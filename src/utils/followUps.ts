// Takip bildirimlerinin ZAMAN PLANI (saf mantık, cihaz API'si yok).
//
// Hatırlatma saati olan bir alışkanlık o gün tamamlanmadıysa, hatırlatmadan
// 30, 60 ve 90 dakika sonra "tamamladınız mı?" diye sorulur. Tamamlanınca
// kalanlar iptal edilir (bkz. services/notifications/habitFollowUps.ts).

import { Habit } from "../types/habit";
import { addDays, toDateKey } from "./date";
import { isHabitDueOn } from "./habitSchedule";

export const FOLLOW_UP_INTERVAL_MINUTES = 30;
export const FOLLOW_UP_COUNT = 3;
/**
 * Yalnızca bugün için kurulur; uygulama her açılışta/öne gelişte yeniler.
 * iOS cihazda en fazla 64 bekleyen bildirim tutar — asıl hatırlatmalara yer
 * kalsın diye takipler hem bugünle hem de toplam bir üst sınırla kısıtlıdır.
 */
export const FOLLOW_UP_DAYS_AHEAD = 1;
export const MAX_FOLLOW_UPS = 24;

export type FollowUp = { habitId: string; dateKey: string; at: Date };

export function planFollowUps(
  habits: Habit[],
  isCompletedOn: (habitId: string, dateKey: string) => boolean,
  now = new Date()
): FollowUp[] {
  const out: FollowUp[] = [];
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const habit of habits) {
    if (habit.deletedAt || habit.archived || !habit.hasReminderTime || !habit.reminderTime) continue;
    const [hour, minute] = habit.reminderTime.split(":").map(Number);

    for (let d = 0; d < FOLLOW_UP_DAYS_AHEAD; d++) {
      const day = addDays(day0, d);
      const dateKey = toDateKey(day);
      if (habit.startDate && dateKey < habit.startDate) continue;
      if (habit.endDate && dateKey > habit.endDate) continue;
      if (!isHabitDueOn(habit, dateKey) || isCompletedOn(habit.id, dateKey)) continue;

      for (let i = 1; i <= FOLLOW_UP_COUNT; i++) {
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute + i * FOLLOW_UP_INTERVAL_MINUTES);
        // Gece yarısını aşan takip ertesi güne sarkmaz; geçmiş zamanlar atlanır.
        if (toDateKey(at) !== dateKey || at.getTime() <= now.getTime()) continue;
        out.push({ habitId: habit.id, dateKey, at });
      }
    }
  }
  // Bütçe aşılırsa en yakın zamandakiler kalır.
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_FOLLOW_UPS);
}
