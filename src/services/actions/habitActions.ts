// Bu dosya: alışkanlıklara yapılan her şey.
//
// Ekle, düzenle, sil, geri al, arşivle, arşivden çıkar, kalıcı sil, sırasını
// değiştir. Her işlem iki şeyi birden düzenler: uygulamadaki listeyi ve
// telefonda kurulu hatırlatmaları.
//
// Üç kavram bu dosyayı anlamak için yeterli:
// - SİLME kalıcı değildir: kayıt 7 günlüğüne çöp kutusuna gider (bkz. trash.ts).
// - ARŞİVLEME "artık yapmıyorum ama geçmişim kalsın" demektir; tamamlama
//   geçmişi silinmez, sadece hatırlatma susturulur.
// - KALICI SİLME gerçekten yok eder; alışkanlığın tamamlama kayıtları da gider.

import React from "react";
import { Habit, HabitCompletion } from "../../types/habit";
import { HabitStoreValue } from "../habitStoreTypes";
import { generateId } from "../id";
import { reminderScheduleChanged } from "../notifications/reminderDiff";
import { cancelHabitReminder, scheduleHabitReminder } from "../notifications";
import { HabitReminderScheduler } from "../notifications/habitReminderScheduler";
import { StreakMilestoneScheduler } from "../notifications/streakMilestoneScheduler";

// Yeni (veya geri alınan) alışkanlık listenin en sonuna eklenir: aktif
// alışkanlıklar içindeki en büyük sıra numarasının bir fazlasını alır.
function nextOrder(habits: Habit[]) {
  const active = habits.filter((h) => !h.deletedAt);
  return active.length === 0 ? 0 : Math.max(...active.map((h) => h.order)) + 1;
}

type HabitActionsDeps = {
  habitsRef: React.MutableRefObject<Habit[]>;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  completionsRef: React.MutableRefObject<HabitCompletion[]>;
  setCompletions: React.Dispatch<React.SetStateAction<HabitCompletion[]>>;
  reminders: HabitReminderScheduler;
  milestones: StreakMilestoneScheduler;
};

type HabitActions = Pick<
  HabitStoreValue,
  | "addHabit"
  | "updateHabit"
  | "deleteHabit"
  | "restoreHabit"
  | "archiveHabit"
  | "unarchiveHabit"
  | "permanentlyDeleteHabit"
  | "reorderHabit"
>;

export function useHabitActions(deps: HabitActionsDeps): HabitActions {
  const { habitsRef, setHabits, completionsRef, setCompletions, reminders, milestones } = deps;

  // Bir alışkanlığın yeni halini hem senkron aynaya (habitsRef) hem de React
  // state'ine yazar. İkisi birlikte güncellenmezse, arka arkaya yapılan iki
  // işlemden ikincisi bir önceki değişikliği görmeden çalışırdı.
  function commitHabit(id: string, next: Habit) {
    habitsRef.current = habitsRef.current.map((h) => (h.id === id ? next : h));
    setHabits((prev) => prev.map((h) => (h.id === id ? next : h)));
  }

  // Telefonda hatırlatmayı (yeniden) kurar ve sonucu yarış korumasından geçirir.
  function scheduleReminderFor(habit: Habit, errorMessage: string) {
    const generation = reminders.bumpGeneration(habit.id);
    scheduleHabitReminder(habit)
      .then((ids) => reminders.applyScheduleResult(habit.id, generation, ids))
      .catch((error) => console.error(errorMessage, error));
  }

  const addHabit: HabitStoreValue["addHabit"] = (habit) => {
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      createdAt: new Date().toISOString(),
      archived: false,
      order: nextOrder(habitsRef.current),
    };
    habitsRef.current = [...habitsRef.current, newHabit];
    setHabits((prev) => [...prev, newHabit]);

    if (newHabit.hasReminderTime) {
      scheduleReminderFor(newHabit, "Alışkanlık hatırlatıcısı planlanamadı");
    }

    return newHabit;
  };

  const updateHabit: HabitStoreValue["updateHabit"] = (id, patch) => {
    const current = habitsRef.current.find((h) => h.id === id);
    if (!current) return;

    const merged: Habit = { ...current, ...patch };
    commitHabit(id, merged);

    // Başlık, hatırlatıcı ayarı veya arşiv durumu değiştiyse bekleyen kutlama
    // artık güncel alışkanlığı temsil etmiyor (eski başlığı taşıyor ya da
    // kullanıcı artık o alışkanlık için bildirim istemiyor).
    if (reminderScheduleChanged(current, merged) || current.archived !== merged.archived) {
      milestones.dropPendingMilestone(id);
    }

    if (reminderScheduleChanged(current, merged)) {
      const generation = reminders.bumpGeneration(id);
      cancelHabitReminder(current.notificationIds)
        .then(() => (merged.hasReminderTime ? scheduleHabitReminder(merged) : Promise.resolve([])))
        .then((ids) => reminders.applyScheduleResult(id, generation, ids))
        .catch((error) => console.error("Alışkanlık hatırlatıcısı yeniden planlanamadı", error));
    }
  };

  const deleteHabit: HabitStoreValue["deleteHabit"] = (id) => {
    const current = habitsRef.current.find((h) => h.id === id);
    if (!current) return;

    // Bu alışkanlık için devam eden planı geçersiz kıl; böylece geç dönen
    // bir promise, artık sahipsiz kalan id'leri geri yazmak yerine iptal eder.
    reminders.bumpGeneration(id);
    milestones.dropPendingMilestone(id);

    if (current.notificationIds && current.notificationIds.length > 0) {
      cancelHabitReminder(current.notificationIds).catch((error) =>
        console.error("Alışkanlık hatırlatıcısı iptal edilemedi", error)
      );
    }

    const trashed: Habit = { ...current, deletedAt: new Date().toISOString(), notificationIds: [] };
    commitHabit(id, trashed);
  };

  const restoreHabit: HabitStoreValue["restoreHabit"] = (id) => {
    const current = habitsRef.current.find((h) => h.id === id);
    if (!current) return;
    const restored: Habit = { ...current, deletedAt: undefined, order: nextOrder(habitsRef.current) };
    commitHabit(id, restored);

    if (restored.hasReminderTime) {
      scheduleReminderFor(restored, "Geri alınan alışkanlığın hatırlatıcısı yeniden planlanamadı");
    }
  };

  /**
   * Arşivleme, silmenin yumuşak alternatifidir: alışkanlık listelerden ve
   * istatistiklerden çıkar ama TAMAMLAMA GEÇMİŞİ SİLİNMEZ ve çöp kutusu gibi
   * 7 gün sonra kalıcı olarak yok olmaz. "Artık bunu yapmıyorum ama geçmişimi
   * kaybetmek istemiyorum" durumunun karşılığıdır.
   *
   * Cihaz bildirimi MUTLAKA iptal edilir — arşivlenmiş bir alışkanlığın her
   * gün hatırlatma göndermeye devam etmesi, özelliğin tamamını anlamsız kılar.
   */
  const archiveHabit: HabitStoreValue["archiveHabit"] = (id) => {
    const current = habitsRef.current.find((h) => h.id === id);
    if (!current || current.archived) return;

    // Kuşak sayacını ilerlet: uçuşta olan bir planlama promise'i geç dönerse,
    // az önce iptal ettiğimiz id'leri alışkanlığın üzerine geri yazmasın.
    // Dönen değer burada kullanılmıyor; çağrının kendisi (yan etkisi) gerekli.
    reminders.bumpGeneration(id);
    milestones.dropPendingMilestone(id);

    const archived: Habit = { ...current, archived: true, notificationIds: undefined };
    commitHabit(id, archived);

    // `notificationIds` yukarıda zaten temizlendi; iptal başarılı olsa da
    // olmasa da alanın son hali aynı. Bu yüzden burada ayrıca
    // applyScheduleResult çağrılmaz — tek işi cihazdaki kaydı silmek.
    if (current.notificationIds && current.notificationIds.length > 0) {
      cancelHabitReminder(current.notificationIds).catch((error) =>
        console.error("Arşivlenen alışkanlığın hatırlatıcısı iptal edilemedi", error)
      );
    }
  };

  // Arşivden çıkarır ve hatırlatıcısı varsa cihaz bildirimini yeniden kurar.
  const unarchiveHabit: HabitStoreValue["unarchiveHabit"] = (id) => {
    const current = habitsRef.current.find((h) => h.id === id);
    if (!current || !current.archived) return;

    const restored: Habit = { ...current, archived: false, order: nextOrder(habitsRef.current) };
    commitHabit(id, restored);

    if (restored.hasReminderTime) {
      scheduleReminderFor(restored, "Arşivden çıkarılan alışkanlığın hatırlatıcısı planlanamadı");
    }
  };

  const permanentlyDeleteHabit: HabitStoreValue["permanentlyDeleteHabit"] = (id) => {
    milestones.dropPendingMilestone(id);
    milestones.forgetHabit(id);
    habitsRef.current = habitsRef.current.filter((h) => h.id !== id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    completionsRef.current = completionsRef.current.filter((c) => c.habitId !== id);
    setCompletions(completionsRef.current);
  };

  // Listede bir alışkanlığı bir yukarı/bir aşağı taşır: komşusuyla sıra
  // numarasını takas eder. Listenin ucundaysa hiçbir şey yapmaz.
  const reorderHabit: HabitStoreValue["reorderHabit"] = (id, direction) => {
    setHabits((prev) => {
      const sorted = [...prev].filter((h) => !h.deletedAt).sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((h) => h.id === id);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= sorted.length) return prev;

      const a = sorted[index];
      const b = sorted[swapWith];
      const aOrder = a.order;
      const bOrder = b.order;

      const next = prev.map((h) => {
        if (h.id === a.id) return { ...h, order: bOrder };
        if (h.id === b.id) return { ...h, order: aOrder };
        return h;
      });
      habitsRef.current = next;
      return next;
    });
  };

  return {
    addHabit,
    updateHabit,
    deleteHabit,
    restoreHabit,
    archiveHabit,
    unarchiveHabit,
    permanentlyDeleteHabit,
    reorderHabit,
  };
}
