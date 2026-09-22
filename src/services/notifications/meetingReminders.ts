// Bu dosya: toplantılara ait bildirimler.
//
// Toplantı, alışkanlıktan farklıdır: tekrar etmez, takvimde tek bir an vardır.
// Bu yüzden bildirimi de tek seferliktir ve "şu tarih-saatte çal" diye kurulur.
// Kullanıcı "15 dakika önce hatırlat" dediyse bildirim o kadar öne alınır.

import { Meeting } from "../../types/habit";
import { reminderBody } from "../../data/reminder";
import {
  ANDROID_CHANNEL_ID,
  ensureAndroidChannel,
  ensureNotificationPermission,
  Notifications,
  parseTime,
} from "./runtime";

const MS_PER_MINUTE = 60_000;

/**
 * Bir toplantı için tek seferlik hatırlatıcı planlar; bildirimi tam toplantı
 * tarih+saatinde tetikler ve daha sonra iptal edilebilmesi için bildirim
 * id'sini döner. Geçmişte kalan (veya tam şu an olan) bir toplantıya bildirim
 * planlanmaz — DATE tetikleyicisi gelecekte bir an gerektirir.
 */
export async function scheduleMeetingReminder(meeting: Meeting): Promise<string | null> {
  if (!Notifications || !meeting.hasReminder) return null;

  const when = reminderMoment(meeting);
  // Hatırlatıcı, toplantı başlangıcından `reminderMinutesBefore` dakika
  // öncesine kurulur. Bu an geçmişte kaldıysa bildirim planlanmaz.
  if (when.getTime() <= Date.now()) return null;

  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: meeting.title,
      body: reminderBody(meeting.reminderMinutesBefore ?? 0),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

// Toplantının başlangıcından, istenen dakika kadar öncesi.
function reminderMoment(meeting: Meeting): Date {
  const { hour, minute } = parseTime(meeting.time);
  const [year, month, day] = meeting.date.split("-").map(Number);
  const start = new Date(year, month - 1, day, hour, minute, 0, 0);
  const minutesBefore = meeting.reminderMinutesBefore ?? 0;
  return new Date(start.getTime() - minutesBefore * MS_PER_MINUTE);
}

export async function cancelMeetingReminder(notificationId: string | undefined) {
  if (!Notifications || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
