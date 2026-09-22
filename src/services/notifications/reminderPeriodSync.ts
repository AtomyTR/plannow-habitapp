// Bu dosya: dönemi gelen/geçen alışkanlıkların bildirimlerini uygulama
// açılışında ve her öne gelişte düzeltir; cihazdan silinmiş hatırlatmaları
// (iOS 64 sınırı, zorla durdurma) fark edip yeniden kurar.
//
// Sorun şu: telefona kurulan tekrarlayan bildirim SÜRESİZDİR. "Her gün 09:00"
// diye bir hatırlatma kurulduğunda telefon bunu sonsuza kadar çalar. Ama
// alışkanlığın bir bitiş tarihi olabilir. Bitiş tarihi, hatırlatma kurulduktan
// GÜNLER SONRA gelir — o an uygulama çalışmıyor bile olabilir. Yani "kurarken
// kontrol etmek" tek başına yetmez.
//
// Bu yüzden uygulama her açıldığında kısa bir uzlaştırma yapılır:
//   • Dönemi geçmiş (veya henüz başlamamış) ama bildirimi duran alışkanlık
//     → bildirimi iptal edilir
//   • Dönemi içinde olan ama bildirimi olmayan alışkanlık
//     → bildirimi yeniden kurulur (dönemi başlamış olanlar için)
//
// Bilerek "hepsini yeniden kur" YAPILMAZ: her açılışta tüm bildirimleri söküp
// takmak gereksiz telefon işi olur ve yarış hatalarına davetiye çıkarır.
// Yalnızca durumu yanlış olanlara dokunulur.

import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Habit } from "../../types/habit";
import { cancelHabitReminder, isWithinPeriod, scheduleHabitReminder } from ".";
import { cancelOrphanedHabitReminders, usesNativeRepeat } from "./habitReminders";
import { hasNotificationPermission } from "./runtime";
import { HabitReminderScheduler } from "./habitReminderScheduler";

// Bir alışkanlığın ŞU ANDA telefonda bildirimi olması gerekiyor mu?
function shouldHaveReminder(habit: Habit): boolean {
  return (
    !habit.deletedAt &&
    !habit.archived &&
    habit.hasReminderTime &&
    isWithinPeriod(habit)
  );
}

// Kayıtlı id'ler var mı ve (cihaz listesi okunabildiyse) hepsi gerçekten
// cihazda bekliyor mu? Eksik olan varsa bildirim yok sayılır ve yeniden kurulur.
function hasScheduledReminder(habit: Habit, onDevice: Set<string> | null): boolean {
  const ids = habit.notificationIds ?? [];
  if (ids.length === 0) return false;
  return onDevice ? ids.every((id) => onDevice.has(id)) : true;
}

export function useReminderPeriodSync(
  habits: Habit[],
  loaded: boolean,
  reminders: HabitReminderScheduler
) {
  // Her zaman güncel liste: uzlaştırma açılışta VE uygulama her öne geldiğinde
  // çalışır; o anki alışkanlıkları görmeli.
  const habitsRef = useRef(habits);
  habitsRef.current = habits;
  const running = useRef(false);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    const reconcile = async () => {
      if (running.current) return;
      running.current = true;
      try {
        // 1) Önce sahipsiz alışkanlık bildirimlerini temizle. Bu, aşağıdaki
        //    yeniden planlamalardan ÖNCE bitmeli; yoksa yeni kurulan id'ler
        //    bilinen kümede olmadığı için yanlışlıkla iptal edilirdi.
        let onDevice: Set<string> | null = null;
        try {
          const knownIds = new Set(habitsRef.current.flatMap((h) => h.notificationIds ?? []));
          onDevice = await cancelOrphanedHabitReminders(knownIds);
        } catch (error) {
          console.error("Sahipsiz alışkanlık hatırlatıcıları temizlenemedi", error);
        }
        // Kullanıcı bir eylem yapmadan izin penceresi açılmasın: izin yoksa
        // yeniden planlama atlanır (iptaller yine yapılır).
        const canSchedule = await hasNotificationPermission();
        if (cancelled) return;

        for (const habit of habitsRef.current) {
          const shouldHave = shouldHaveReminder(habit);
          const has = hasScheduledReminder(habit, onDevice);
          // Tek seferlik bildirimlerle çalışan döngüler (aylık, N günde bir…)
          // her seferinde yenilenir; aksi halde kurulan birkaç tarih tükenince
          // hatırlatma kesilirdi.
          if (shouldHave && canSchedule && !usesNativeRepeat(habit)) {
            const generation = reminders.bumpGeneration(habit.id);
            cancelHabitReminder(habit.notificationIds)
              .then(() => scheduleHabitReminder(habit))
              .then((ids) => reminders.applyScheduleResult(habit.id, generation, ids))
              .catch((error) => console.error("Hatırlatıcı yenilenemedi", error));
            continue;
          }
          if (shouldHave === has) continue;

          const generation = reminders.bumpGeneration(habit.id);

          if (has) {
            // Dönemi bitti (ya da henüz başlamadı) ama bildirimi hâlâ duruyor.
            cancelHabitReminder(habit.notificationIds)
              .then(() => reminders.applyScheduleResult(habit.id, generation, []))
              .catch((error) =>
                console.error("Dönemi biten alışkanlığın hatırlatıcısı iptal edilemedi", error)
              );
          } else {
            if (!canSchedule) continue;
            // Bildirimi yok ya da kayıtlı olup cihazdan silinmiş: (varsa kalan
            // parçaları iptal edip) yeniden kur.
            cancelHabitReminder(habit.notificationIds)
              .then(() => scheduleHabitReminder(habit))
              .then((ids) => reminders.applyScheduleResult(habit.id, generation, ids))
              .catch((error) =>
                console.error("Eksik alışkanlık hatırlatıcısı kurulamadı", error)
              );
          }
        }
      } finally {
        running.current = false;
      }
    };

    reconcile();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcile();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
    // Yalnızca yükleme durumuna bağlı; `habits` bağımlılık olsaydı her
    // tamamlama işaretinde yeniden çalışır, kendi yazdığı notificationIds
    // değişikliğiyle kendini tekrar tetiklerdi. Güncel liste ref'ten okunur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
}
