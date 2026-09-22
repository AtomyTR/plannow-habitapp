// Bu dosya tek bir soruyu cevaplar:
// "Bu alışkanlığın, verilen günde sırası gelmiş mi?"
//
// Neden gerekli? Çünkü her alışkanlık her gün yapılmaz. "Her pazartesi",
// "3 haftada bir", "her ayın 15'i" gibi kurallar var. Hem takvim boyaması,
// hem seri (streak) hesabı, hem de tutarlılık oranı bu cevaba dayanır —
// örneğin sadece pazartesi yapılan bir alışkanlığın serisi, salı günü
// "yapılmadı" diye kırılmamalıdır.

import { Habit } from "../types/habit";
import { addDays, parseDateKey, startOfWeek, toDateKey } from "./date";

// "N günde/haftada/ayda/yılda bir" hesabının yapıldığı referans gün.
// repeatAnchorDate set edilmemişse alışkanlığın oluşturulduğu gün baz alınır.
function anchorDate(habit: Habit): Date {
  return habit.repeatAnchorDate ? parseDateKey(habit.repeatAnchorDate) : new Date(habit.createdAt);
}

// İki tarih arasındaki tam gün farkı. UTC gün başlangıcı üzerinden
// hesaplanır ki yaz saati (DST) kayması farkı bir saat kaydırıp yanlış
// gün sayısı üretmesin.
function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

function weeksBetween(a: Date, b: Date): number {
  return Math.floor(daysBetween(startOfWeek(a), startOfWeek(b)) / 7);
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// Referans gün ayda yoksa (31, 30 ya da 29 Şubat) o ayın son gününe çekilir;
// aksi halde "her ayın 31'i" alışkanlığı 30 çeken aylarda hiç görünmezdi.
function clampedAnchorDay(anchorDay: number, date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.min(anchorDay, lastDay);
}

// repeatEveryN boş/1 ise çarpan yok demektir — "her <döngü>".
function everyN(habit: Habit): number {
  return habit.repeatEveryN && habit.repeatEveryN > 1 ? habit.repeatEveryN : 1;
}

// Bir alışkanlığın tekrar döngüsünün, verilen tarihte gerçekten "sırası
// gelmiş" olup olmadığını söyler.
//
// Her döngü, kendi temel biriminin üzerine isteğe bağlı bir repeatEveryN
// çarpanı destekler ("her hafta" vs. alışkanlığın referans gününden itibaren
// sayılan "3 haftada bir") — daily için çarpan gün sayısı, weekly için hafta
// sayısı, monthly için ay sayısı, yearly için yıl sayısıdır.
export function isHabitDueOn(habit: Habit, dateKey: string): boolean {
  // Dönem kontrolü her şeyden önce gelir: aralığın dışındaki bir günde tekrar
  // döngüsüne hiç bakmaya gerek yok. "YYYY-MM-DD" anahtarları sabit uzunlukta
  // ve büyükten küçüğe sıralı olduğu için doğrudan sözlük sırasıyla
  // karşılaştırılabilir; tarihe çevirmeye gerek yoktur.
  //
  // Alanlardan biri tanımsızsa o yönde sınır yok demektir — bu alanları
  // içermeyen eski kayıtlar aynen eskisi gibi davranır.
  if (habit.startDate && dateKey < habit.startDate) return false;
  if (habit.endDate && dateKey > habit.endDate) return false;

  const date = parseDateKey(dateKey);
  const n = everyN(habit);

  switch (habit.repeatCycle) {
    case "daily": {
      if (n === 1) return true;
      const diff = daysBetween(anchorDate(habit), date);
      return diff >= 0 && diff % n === 0;
    }
    case "weekly": {
      // Önce haftanın hangi günlerinde aktif olduğuna bak; hiç gün
      // seçilmemişse (eski veriyle uyum için) her gün geçerli sayılır.
      const days = habit.repeatDaysOfWeek;
      const onSelectedDay = !days || days.length === 0 || days.includes(date.getDay());
      if (!onSelectedDay) return false;
      if (n === 1) return true;
      const diff = weeksBetween(anchorDate(habit), date);
      return diff >= 0 && diff % n === 0;
    }
    case "monthly": {
      // Ayın referans gündeki günü (örn. ayın 15'i) tutmalı.
      const anchor = anchorDate(habit);
      if (date.getDate() !== clampedAnchorDay(anchor.getDate(), date)) return false;
      if (n === 1) return true;
      const diff = monthsBetween(anchor, date);
      return diff >= 0 && diff % n === 0;
    }
    case "yearly": {
      // Yılın referans gün + ayını (örn. 15 Mart) tutmalı.
      const anchor = anchorDate(habit);
      if (date.getMonth() !== anchor.getMonth()) return false;
      if (date.getDate() !== clampedAnchorDay(anchor.getDate(), date)) return false;
      if (n === 1) return true;
      const diff = date.getFullYear() - anchor.getFullYear();
      return diff >= 0 && diff % n === 0;
    }
    case "custom":
    default:
      return true;
  }
}

// iOS en fazla 64 bekleyen bildirim tutar; alışkanlık başına sınırlı tutulur.
const MAX_ONE_SHOT_REMINDERS = 6;
// Bu kadar gün ileriye bakılır (yıllık döngü için bir yılı kapsar).
const LOOKAHEAD_DAYS = 400;

/** Hatırlatmanın düşeceği sonraki tarihleri (yerel saat) döner. Saf fonksiyon. */
export function upcomingReminderDates(
  habit: Habit,
  hour: number,
  minute: number,
  now = new Date(),
  max = MAX_ONE_SHOT_REMINDERS,
  lookaheadDays = LOOKAHEAD_DAYS
): Date[] {
  const out: Date[] = [];
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i <= lookaheadDays && out.length < max; i++) {
    const day = addDays(day0, i);
    const key = toDateKey(day);
    if (habit.endDate && key > habit.endDate) break;
    if (habit.startDate && key < habit.startDate) continue;
    if (!isHabitDueOn(habit, key)) continue;
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
    if (at.getTime() <= now.getTime()) continue;
    out.push(at);
  }
  return out;
}
