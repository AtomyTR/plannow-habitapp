// Bu dosya: "tamamladınız mı?" takip bildirimleri.
//
// Telefon, bildirimi atacağı anda alışkanlığın tamamlanıp tamamlanmadığını
// bilemez. Bu yüzden takipler ÖNCEDEN kurulur ve durum her değiştiğinde
// (tik, düzenleme, açılış, uygulamaya dönüş) topluca yeniden kurulur:
// tamamlanan günün takipleri hiç kurulmaz, bekleyenler iptal edilir.
//
// Takip id'leri diske yazılmaz; bildirimler `data.kind` etiketiyle bulunur.
// Böylece veri modeline alan eklenmez ve sahipsiz takip kalmaz.

import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Habit } from "../../types/habit";
import { planFollowUps } from "../../utils/followUps";
import { translate } from "../../languages";
import { ANDROID_CHANNEL_ID, ensureAndroidChannel, hasNotificationPermission, Notifications } from "./runtime";

export const HABIT_FOLLOW_UP_KIND = "habit-follow-up";
// Art arda tiklerde her seferinde yeniden kurmamak için kısa bekleme.
const SYNC_DELAY_MS = 800;

async function cancelAllFollowUps() {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === HABIT_FOLLOW_UP_KIND)
      .map((n) => Notifications!.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Bir alışkanlığın belirli bir günü tamamlanınca o güne ait takipleri
 * BEKLEMEDEN iptal eder (toplu senkron sırasını beklemez): "yaptım ama hâlâ
 * soruyor" durumu olmasın.
 */
export async function cancelFollowUpsFor(habitId: string, dateKey: string) {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (n) =>
          n.content.data?.kind === HABIT_FOLLOW_UP_KIND &&
          n.content.data?.habitId === habitId &&
          n.content.data?.date === dateKey
      )
      .map((n) => Notifications!.cancelScheduledNotificationAsync(n.identifier))
  );
}

async function syncFollowUps(habits: Habit[], isCompletedOn: (habitId: string, dateKey: string) => boolean) {
  const N = Notifications;
  if (!N) return;
  await cancelAllFollowUps();
  // İzin yoksa sessizce çıkılır; takip için izin penceresi açılmaz.
  if (!(await hasNotificationPermission())) return;
  await ensureAndroidChannel();

  const titles = new Map(habits.map((h) => [h.id, h.title]));
  // Paralel kurulur; senkron kısa sürer, yeni bir tik iptali geciktirmez.
  await Promise.all(
    planFollowUps(habits, isCompletedOn).map((f) =>
      N.scheduleNotificationAsync({
        content: {
          title: titles.get(f.habitId) ?? "",
          body: translate("notif.followUp.body"),
          data: { kind: HABIT_FOLLOW_UP_KIND, habitId: f.habitId, date: f.dateKey },
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: f.at,
          channelId: ANDROID_CHANNEL_ID,
        },
      })
    )
  );
}

/**
 * Alışkanlıklar ya da tamamlamalar değiştikçe (kısa bir beklemeyle) ve
 * uygulama öne geldikçe takipleri yeniden kurar. Senkronlar sıraya alınır;
 * aynı anda iki senkron çalışıp çift bildirim kurmaz.
 */
export function useHabitFollowUpSync(
  habits: Habit[],
  isCompletedOn: (habitId: string, dateKey: string) => boolean,
  loaded: boolean,
  /** Dil değişince takipler yeni dilde yeniden kurulsun diye bağımlılık. */
  language: string
) {
  const latest = useRef({ habits, isCompletedOn });
  latest.current = { habits, isCompletedOn };
  const queue = useRef<Promise<void>>(Promise.resolve());

  const run = useRef(() => {
    queue.current = queue.current
      .then(() => syncFollowUps(latest.current.habits, latest.current.isCompletedOn))
      .catch((error) => console.error("Takip bildirimleri kurulamadı", error));
  }).current;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      run();
    }, SYNC_DELAY_MS);
  }, [habits, isCompletedOn, loaded, language, run]);

  useEffect(() => {
    if (!loaded) return;
    const sub = AppState.addEventListener("change", (state) => {
      // Öne gelince: gün değişmiş olabilir, yeniden kur.
      if (state === "active") run();
      // Arka plana geçerken bekleyen senkron hemen yapılır; yeni atılan bir
      // tik yüzünden artık gereksiz olan takip çalmasın.
      else if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        run();
      }
    });
    return () => {
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [loaded, run]);
}
