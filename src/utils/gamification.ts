// Alışkanlık verisinden türetilen ilerleme göstergeleri: seri (streak),
// tutarlılık oranı, XP ve seviye.
//
// TEMEL KURAL: burada hesaplanan hiçbir değer KALICI OLARAK SAKLANMAZ.
// Hepsi mevcut `completions` kayıtlarının saf birer fonksiyonudur.
// XP'nin çarpanı, bonusu veya süreli etkinliği yoktur; bu sayede geçmişteki
// kazanım bağlamını hatırlamaya gerek kalmaz ve her açılışta yeniden
// hesaplanabilir. Bir gün "çift XP" gibi bir mekanik eklenirse bu varsayım
// bozulur ve XP'yi saklamak zorunlu hale gelir — o yüzden eklenmemeli.

import { Habit, HabitCompletion } from "../types/habit";
import { addDays, toDateKey } from "./date";
import { isHabitDueOn } from "./habitSchedule";

// habitId -> tamamlanmış tarih anahtarları.
// Seri hesabı, her gün için `completions.some(...)` ile lineer tarama yapmak
// yerine bu indeksi kullanır: O(gün × tamamlama) yerine O(gün).
export type CompletionIndex = Map<string, Set<string>>;

export function buildCompletionIndex(completions: HabitCompletion[]): CompletionIndex {
  const index: CompletionIndex = new Map();
  for (const completion of completions) {
    let dates = index.get(completion.habitId);
    if (!dates) {
      dates = new Set();
      index.set(completion.habitId, dates);
    }
    dates.add(completion.date);
  }
  return index;
}

function isDone(index: CompletionIndex, habitId: string, dateKey: string): boolean {
  return index.get(habitId)?.has(dateKey) ?? false;
}

// Seri hesabının geriye doğru tarayacağı en fazla gün sayısı. Hiç kırılmayan
// bir seride döngünün sonsuza gitmesini engeller; alışkanlığın oluşturulma
// tarihi zaten çoğu durumda daha erken bir sınır koyar.
const MAX_STREAK_LOOKBACK_DAYS = 730;

/**
 * Bir alışkanlığın güncel serisi: bugünden geriye doğru, KESİNTİSİZ tamamlanmış
 * "sırası gelmiş gün" sayısı.
 *
 * İki önemli davranış:
 *
 * 1. Sadece `isHabitDueOn` ile sırası gelen günler sayılır. Takvim günü saymak
 *    yanlış olurdu: sadece Pazartesi/Çarşamba yapılan bir alışkanlığın serisi,
 *    Salı günü "yapılmadı" diye kırılmamalı — Salı o alışkanlığın günü değil.
 *
 * 2. Bugün sırası gelmiş ama HENÜZ tamamlanmamışsa seri kırılmaz; sayıma dünden
 *    başlanır. Gün daha bitmemişken kullanıcıya serisi sıfırlanmış gibi
 *    göstermek, olmayan bir başarısızlığı bildirmek olurdu.
 */
export function currentStreak(habit: Habit, index: CompletionIndex, today = new Date()): number {
  const createdKey = toDateKey(new Date(habit.createdAt));
  let streak = 0;
  let cursor = today;

  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
    const key = toDateKey(cursor);

    // Alışkanlık oluşmadan önceki günlere bakmanın anlamı yok.
    // "YYYY-MM-DD" anahtarları sözlük sırasıyla karşılaştırılabilir.
    if (key < createdKey) break;

    if (isHabitDueOn(habit, key)) {
      if (isDone(index, habit.id, key)) {
        streak += 1;
      } else if (i === 0) {
        // Bugün: gün henüz bitmedi, seriyi kırma — sadece sayma.
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export type Consistency = {
  completed: number;
  possible: number;
  rate: number; // 0..1
};

/**
 * Son `days` gün içindeki tutarlılık: sırası gelmiş gün sayısına oranla kaç
 * tanesinin tamamlandığı.
 *
 * Tek bir kaçırılan günde sıfıra düşen ardışık sayaç yerine bu oranın birincil
 * gösterge olmasının sebebi: bir günün kaçırılması alışkanlığın uzun vadeli
 * yerleşmesini neredeyse hiç etkilemez. Oran %86'dan %83'e iner — dürüst ve
 * dramsız. Sıfıra düşen bir sayaç ise yapay bir uçurum yaratır.
 */
export function consistency(habits: Habit[], index: CompletionIndex, days = 30): Consistency {
  const today = new Date();
  let completed = 0;
  let possible = 0;

  for (let i = 0; i < days; i++) {
    const key = toDateKey(addDays(today, -i));
    for (const habit of habits) {
      // Alışkanlık oluşmadan önceki günler "kaçırılmış" sayılmaz; yoksa bugün
      // eklenen bir alışkanlık ilk günden %3 gibi haksız bir oranla başlar
      // (currentStreak da aynı kuralı uygular).
      if (key < toDateKey(new Date(habit.createdAt))) continue;
      if (!isHabitDueOn(habit, key)) continue;
      possible += 1;
      if (isDone(index, habit.id, key)) completed += 1;
    }
  }

  return { completed, possible, rate: possible > 0 ? completed / possible : 0 };
}

// --- Kilometre taşları ----------------------------------------------------

// Sadece KUTLAMA için kullanılır. "Serin bozulmak üzere" türü bir kayıp
// uyarısına asla dönüştürülmemeli: o mekanik kaygı üzerine kuruludur ve bu
// uygulamanın korumaya çalıştığı bir kullanım metriği yok.
export const STREAK_MILESTONES = [7, 30, 100] as const;

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak as (typeof STREAK_MILESTONES)[number]);
}
