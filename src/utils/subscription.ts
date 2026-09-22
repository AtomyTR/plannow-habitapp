// Aboneliklerin tarih ve tutar hesapları.
//
// Buradaki hiçbir sonuç diske yazılmaz; hepsi aboneliğin kendi alanlarından
// (ilk ödeme günü, döngü, tutar) yeniden hesaplanır. "Bir sonraki ödeme günü"
// gibi bir alanı saklamak, tarih geçtiğinde güncellenmesi gereken ikinci bir
// doğruluk kaynağı yaratırdı — güncellenmediği an da sessizce yanlış bilgi
// gösterirdi.

import { Subscription } from "../types/habit";
import { parseDateKey, toDateKey } from "./date";
import { getLanguage, translate } from "../languages";

const MONTHS_PER_CYCLE: Record<Subscription["cycle"], number> = {
  monthly: 1,
  yearly: 12,
};

/**
 * Ayın gününü koruyarak ay ekler.
 *
 * Ayın 31'inde ödenen bir abonelik, 30 çeken bir ayda ayın SON gününe çekilir.
 * Bu kontrol olmadan JS tarihi sessizce bir sonraki aya taşardı: 31 Ocak'a bir
 * ay eklemek 3 Mart üretir (31 Şubat diye bir gün yok), yani abonelik yanlış
 * ayda görünürdü.
 */
export function addMonthsClamped(base: Date, months: number): Date {
  const targetDay = base.getDate();
  const firstOfTarget = new Date(base.getFullYear(), base.getMonth() + months, 1);
  // Ayın 0. günü = bir önceki ayın son günü.
  const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), Math.min(targetDay, lastDay));
}

/**
 * Bugün DAHİL, bugünden sonraki ilk yenileme günü ("YYYY-MM-DD").
 *
 * İlk ödeme günü henüz gelmediyse doğrudan o gün döner. Geçtiyse, aradan kaç
 * döngü geçtiği tahmin edilip ileri doğru yürünerek düzeltilir — ayın sonuna
 * çekme (clamp) yüzünden tahmin bir adım şaşabilir.
 */
export function nextRenewalKey(sub: Subscription, today = new Date()): string {
  const first = parseDateKey(sub.firstBillingDate);
  const todayKey = toDateKey(today);
  const firstKey = toDateKey(first);
  if (firstKey >= todayKey) return firstKey;

  const step = MONTHS_PER_CYCLE[sub.cycle];
  const monthsElapsed =
    (today.getFullYear() - first.getFullYear()) * 12 + (today.getMonth() - first.getMonth());

  // Bir eksikten başlayıp ileri yürümek, clamp kaynaklı kaymayı da düzeltir.
  let cycles = Math.max(0, Math.floor(monthsElapsed / step) - 1);
  while (toDateKey(addMonthsClamped(first, cycles * step)) < todayKey) cycles += 1;

  return toDateKey(addMonthsClamped(first, cycles * step));
}

// Yenilemeye kaç gün kaldığı. 0 = bugün.
export function daysUntil(dateKey: string, today = new Date()): number {
  const target = parseDateKey(dateKey);
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // UTC gün başlangıcı üzerinden: yaz saati geçişi farkı bir saat kaydırıp
  // gün sayısını yanlış yuvarlamasın.
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((utcTarget - utcFrom) / 86_400_000);
}

// "bugün" / "yarın" / "3 gün sonra"
export function renewalLabel(dateKey: string, today = new Date()): string {
  const days = daysUntil(dateKey, today);
  if (days <= 0) return translate("subscription.renewal.today");
  if (days === 1) return translate("subscription.renewal.tomorrow");
  return translate("subscription.renewal.inDays", { n: days });
}

/**
 * Tüm aboneliklerin AYLIK toplamı.
 *
 * Yıllık ödenenler 12'ye bölünerek katılır; aksi halde yılda bir çekilen büyük
 * bir tutar, denk geldiği ayın toplamını gerçekte olmadığı kadar şişirirdi.
 */
export function monthlyTotal(subs: Subscription[]): number {
  return subs.reduce(
    (sum, s) => sum + (s.cycle === "yearly" ? s.amount / 12 : s.amount),
    0
  );
}

export function yearlyTotal(subs: Subscription[]): number {
  return monthlyTotal(subs) * 12;
}

// 12345.6 → "12.345". Intl/toLocaleString bilerek kullanılmıyor: Hermes'te
// platforma göre farklı davranabiliyor ve tek ihtiyacımız binlik ayracı.
function groupThousands(amount: number): string {
  return Math.round(amount)
    .toString()
    // Binlik ayraç dile göre: Türkçe "12.345", İngilizce "12,345".
    .replace(/\B(?=(\d{3})+(?!\d))/g, getLanguage() === "en" ? "," : ".");
}

export function formatTRY(amount: number): string {
  return `₺${groupThousands(amount)}`;
}

// Listeyi en yakın yenilemeden en uzağa sıralar; aynı gün düşenler ada göre.
export function sortByNextRenewal(subs: Subscription[], today = new Date()): Subscription[] {
  return [...subs].sort((a, b) => {
    const ka = nextRenewalKey(a, today);
    const kb = nextRenewalKey(b, today);
    return ka === kb ? a.name.localeCompare(b.name, "tr") : ka.localeCompare(kb);
  });
}

/**
 * Verilen ay içinde bu aboneliğin ödeme günü var mı? Varsa gün anahtarı.
 *
 * Takvim ızgarasında "bu ay hangi günler para çıkıyor" işaretlemek için
 * kullanılır. Aylık aboneliklerde ayda tam bir gün düşer; yıllıklarda ise
 * yalnızca yıldönümü ayında.
 */
export function renewalKeyInMonth(
  sub: Subscription,
  year: number,
  month: number
): string | null {
  const first = parseDateKey(sub.firstBillingDate);
  const monthsFromFirst = (year - first.getFullYear()) * 12 + (month - first.getMonth());
  if (monthsFromFirst < 0) return null; // abonelik o ay henüz başlamamış

  const step = MONTHS_PER_CYCLE[sub.cycle];
  // Yıllıkta yalnızca döngüye denk gelen aylar sayılır (12'nin katı).
  if (monthsFromFirst % step !== 0) return null;

  return toDateKey(addMonthsClamped(first, monthsFromFirst));
}

// Görüntülenen ayda ödemesi olan gün anahtarları.
export function renewalDaysInMonth(
  subs: Subscription[],
  year: number,
  month: number
): Set<string> {
  const days = new Set<string>();
  for (const sub of subs) {
    const key = renewalKeyInMonth(sub, year, month);
    if (key) days.add(key);
  }
  return days;
}
