import { translate, type TranslationKey } from "../languages";
// Uygulama genelinde kullanılan "YYYY-MM-DD" tarih anahtarları için tek
// doğruluk kaynağı. Anahtarlar her zaman YEREL (local) takvim alanlarından
// türetilir — asla toISOString() kullanılmaz; o UTC'dir ve gece yarısına
// yakın veya UTC dışı saat dilimlerinde anahtarı sessizce bir gün kaydırır.

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "YYYY-MM-DD" biçiminde ve takvimde gerçekten var olan bir gün mü? (ör. link parametreleri için) */
export function isValidDateKey(key: string | undefined): key is string {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toDateKey(parseDateKey(key)) === key;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Pazar
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Bugün dahil, geriye doğru son `n` günü (en eskisi önce olacak şekilde) döner.
export function lastNDays(n: number): Date[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

// Ay ve gün adları seçili dilde (src/languages) gelir. getMonth() / getDay()
// (0=Pazar) ile indekslenir. Başlıkta tam ad ("Pazartesi"), DayStrip'te kısa
// ad ("Pzt") kullanılır.
export function monthName(month: number): string {
  return translate(`date.month.${month}` as TranslationKey);
}

export function weekdayName(day: number): string {
  return translate(`date.weekday.${day}` as TranslationKey);
}

export function weekdayShort(day: number): string {
  return translate(`date.weekdayShort.${day}` as TranslationKey);
}

// Ana sayfa başlığı: "Pazartesi, 24 Ağustos" / "Monday, August 24"
export function formatDayTitle(date: Date): string {
  return translate("date.dayTitle", {
    weekday: weekdayName(date.getDay()),
    day: date.getDate(),
    month: monthName(date.getMonth()),
  });
}

// Takvim ızgarası: verilen ay için Pazartesi başlangıçlı, tam 6 haftalık
// (6x7) bir Date matrisi. Önceki/sonraki aya taşan günler de dahildir; ekran
// bunları `getMonth()` karşılaştırmasıyla soluk gösterebilir. Sabit 6 satır,
// ay değişince ızgara yüksekliğinin zıplamasını önler.
export function monthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(start, w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}
