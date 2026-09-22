// Bu dosya: alışkanlıklara ait bildirimler.
//
// İki farklı bildirim var ve ikisi bambaşka çalışır:
//
//   1. HATIRLATMA — "Kitap okuma" gibi, her gün (veya seçili günlerde) aynı
//      saatte tekrar eden bildirim. Kullanıcı hatırlatma saati kurduğunda
//      planlanır, alışkanlık silinince/arşivlenince iptal edilir.
//
//   2. KUTLAMA — seri 7, 30 veya 100. güne ulaştığında bir kez düşen bildirim.
//      Önceden planlanmaz; seri o sayıya ulaştığı ANDA planlanır.
//
// Neden ikisi farklı? Çünkü yarınki serinin kaç olacağı bugünden bilinemez.
// Detaylı gerekçe aşağıda, scheduleStreakMilestone'un üstünde.

import { Habit } from "../../types/habit";
import { toDateKey } from "../../utils/date";
import { upcomingReminderDates } from "../../utils/habitSchedule";
import { habitReminderBody, streakMilestoneBody } from "../../data/reminder";
import {
  ANDROID_CHANNEL_ID,
  ensureAndroidChannel,
  ensureNotificationPermission,
  hasNotificationPermission,
  Notifications,
  parseTime,
} from "./runtime";

// Habit.repeatDaysOfWeek, JS'in Date#getDay() sırasını kullanır: 0=Pazar..6=Cumartesi.
// Expo'nun WeeklyTriggerInput'u ise 1=Pazar..7=Cumartesi kullanır — aynı sıra, sadece bir kaydırılmış.
function toExpoWeekday(appWeekday: number) {
  return appWeekday + 1;
}

// Haftalık bir alışkanlıkta hiç gün seçilmemişse (eski kayıtlarla uyum için)
// haftanın tamamı kabul edilir.
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Bir alışkanlık için hatırlatıcı planlar ve daha sonra iptal/yeniden
 * planlama yapılabilmesi için habit üzerinde saklanacak bildirim id'lerini
 * döner.
 *
 * Sadece düz "daily" ve "weekly" döngüler (repeatEveryN = 1) gerçek,
 * tekrarlayan bir cihaz bildirimi alır. "N günde/haftada/ayda/yılda bir"
 * varyantları ve monthly/yıllık döngüler Expo'nun yerel tekrar tetikleyici
 * tiplerine (trigger) karşılık gelmez — "her N günde bir" diye bir tetikleyici
 * tipi yok — bu yüzden bunlar için bildirim planlanmaz. Hatırlatma-saati
 * arayüzü niyeti yine de kaydeder, sadece kullanıcıya cihaz bildirimi göndermez.
 */
/**
 * Alışkanlık BUGÜN kendi döneminin içinde mi?
 *
 * Expo'nun tekrarlayan tetikleyicileri süresizdir — bir kez kurulunca kendi
 * kendine sona ermezler. Dolayısıyla dönemi bitmiş bir alışkanlığa bildirim
 * kurulursa, alışkanlık listelerden kalktıktan sonra bile hatırlatma
 * göndermeye devam eder. Henüz başlamamış bir alışkanlık da başlamadan
 * hatırlatma göndermeye başlar.
 */
export const HABIT_REMINDER_KIND = "habit-reminder";

/**
 * Cihazda duran ama hiçbir alışkanlığın notificationIds listesinde olmayan
 * alışkanlık hatırlatmalarını iptal eder (ör. planlama sonrası id diske
 * yazılmadan uygulama kapandıysa). Sadece `HABIT_REMINDER_KIND` etiketlilere
 * dokunur; toplantı/abonelik/kutlama bildirimleri etkilenmez.
 */
export async function cancelOrphanedHabitReminders(knownIds: Set<string>): Promise<Set<string> | null> {
  if (!Notifications) return null;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const orphans = scheduled.filter(
    (n) => n.content.data?.kind === HABIT_REMINDER_KIND && !knownIds.has(n.identifier)
  );
  await Promise.all(
    orphans.map((n) => Notifications!.cancelScheduledNotificationAsync(n.identifier))
  );
  // Cihazda GERÇEKTEN bekleyen bildirimler: kayıtlı id'si olup cihazda
  // olmayanları (iOS 64 sınırı, zorla durdurma, yedekten dönüş) bulmak için.
  return new Set(scheduled.map((n) => n.identifier));
}

export function isWithinPeriod(habit: Habit, today = toDateKey(new Date())): boolean {
  if (habit.startDate && today < habit.startDate) return false;
  if (habit.endDate && today > habit.endDate) return false;
  return true;
}

/**
 * Expo'da karşılığı olan tekrar tetikleyicisi var mı? Yalnızca düz günlük ve
 * haftalık döngüler (repeatEveryN = 1) tekrarlayan bir cihaz bildirimi alır.
 * Diğerleri (N günde/haftada bir, aylık, yıllık) için sonraki birkaç tarih tek
 * seferlik bildirim olarak kurulur ve her açılışta yenilenir
 * (reminderPeriodSync).
 */
export function usesNativeRepeat(habit: Habit): boolean {
  const everyN = habit.repeatEveryN ?? 1;
  return everyN <= 1 && (habit.repeatCycle === "daily" || habit.repeatCycle === "weekly");
}

export async function scheduleHabitReminder(habit: Habit): Promise<string[]> {
  if (!Notifications || !habit.hasReminderTime || !habit.reminderTime) return [];
  if (!isWithinPeriod(habit)) return [];

  const granted = await ensureNotificationPermission();
  if (!granted) return [];

  await ensureAndroidChannel();

  const { hour, minute } = parseTime(habit.reminderTime);
  // `data.kind` açılıştaki sahipsiz-bildirim taramasının (reminderPeriodSync)
  // yalnızca alışkanlık hatırlatmalarına dokunabilmesi için eklenir.
  const content = {
    title: habit.title,
    body: habitReminderBody(),
    data: { kind: HABIT_REMINDER_KIND, habitId: habit.id },
  };

  if (!usesNativeRepeat(habit)) {
    const ids: string[] = [];
    for (const date of upcomingReminderDates(habit, hour, minute)) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: ANDROID_CHANNEL_ID,
          },
        })
      );
    }
    return ids;
  }

  if (habit.repeatCycle === "daily") {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    return [id];
  }

  if (habit.repeatCycle === "weekly") {
    // Haftalık alışkanlıkta her seçili gün için AYRI bir bildirim planlanır;
    // Expo'nun haftalık tetikleyicisi tek seferde tek gün kabul eder.
    const weekdays =
      habit.repeatDaysOfWeek && habit.repeatDaysOfWeek.length > 0
        ? habit.repeatDaysOfWeek
        : ALL_WEEKDAYS;

    const ids: string[] = [];
    for (const day of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: toExpoWeekday(day),
          hour,
          minute,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
      ids.push(id);
    }
    return ids;
  }

  return [];
}

export async function cancelHabitReminder(notificationIds: string[] | undefined) {
  if (!Notifications || !notificationIds || notificationIds.length === 0) return;
  await Promise.all(
    notificationIds.map((id) => Notifications!.cancelScheduledNotificationAsync(id))
  );
}

// Kutlama bildirimi, tetikleyen dokunuştan hemen sonra değil birkaç saniye
// sonra düşer. Kutucuğa basmakla aynı ana denk gelen bir banner, tamamlama
// animasyonunun üstüne biner ve dokunuşun bir yan etkisi gibi görünür.
const MILESTONE_DELAY_SECONDS = 5;

/**
 * Bir seri kilometre taşı için TEK SEFERLİK kutlama bildirimi planlar.
 *
 * Zamanlama tercihi bilinçli: bu bildirim GELECEKTEKİ bir kilometre taşı için
 * önceden planlanmaz, seri o sayıya GERÇEKTEN ulaştığı anda planlanır. Sebebi,
 * karmaşıklık değil imkânsızlık: yarınki serinin ne olacağı bugünden
 * bilinemez — kullanıcının yarın tamamlayıp tamamlamayacağına bağlıdır. Önceden
 * planlanan her kutlama, kullanıcı bir günü kaçırdığı anda gerçekleşmemiş bir
 * başarıyı kutlar hale gelirdi. Ulaşıldığı anda planlandığında ise gövdedeki
 * sayı, gönderildiği anda tanım gereği doğrudur.
 *
 * Alışkanlığın hatırlatıcısı kapalıysa kutlama da gönderilmez: kullanıcı o
 * alışkanlık için cihaz bildirimi istemediğini zaten söylemiştir. Buna karşılık
 * tekrarlayan hatırlatıcının kısıtı (repeatEveryN > 1 ve monthly/yearly için
 * bildirim yok) burada geçerli DEĞİLDİR — o kısıt, Expo'da "her N günde bir"
 * diye bir tekrar tetikleyicisi olmamasından kaynaklanır; tek seferlik bir
 * bildirimin böyle bir sorunu yok.
 */
export async function scheduleStreakMilestone(habit: Habit, streak: number): Promise<string | null> {
  if (!Notifications || !habit.hasReminderTime) return null;

  const body = streakMilestoneBody(streak);
  if (!body) return null;

  // Bilerek ensureNotificationPermission() değil: bir kutlama, izin penceresini
  // açmak için uygun bir an değildir.
  if (!(await hasNotificationPermission())) return null;

  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: { title: habit.title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: MILESTONE_DELAY_SECONDS,
      repeats: false,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

export async function cancelStreakMilestone(notificationId: string | undefined) {
  if (!Notifications || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
