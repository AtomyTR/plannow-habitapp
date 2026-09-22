// Bu dosya: abonelik yenileme hatırlatmaları.
//
// Neden tek seferlik bildirim kuruluyor da "her ay tekrarla" denmiyor?
// Çünkü Expo'da "her ayın 15'i" diye bir tekrar tetikleyicisi yok — aynı kısıt
// aylık/yıllık alışkanlıklarda da geçerli (bkz. habitReminders.ts). Bunun
// yerine YALNIZCA bir sonraki yenileme için tek seferlik bir bildirim kurulur;
// o tarih geçtiğinde uygulama açılışında bir sonraki kurulur
// (bkz. subscriptionRenewalSync.ts).
//
// Bu yaklaşımın bilinen sınırı: kullanıcı uygulamayı aylarca hiç açmazsa
// zincir kopar ve sonraki hatırlatma kurulmaz. Alternatifi (aylar öncesinden
// onlarca bildirim kurmak) tutar veya tarih değiştiğinde hepsini bulup
// iptal etmeyi gerektirirdi — bu, sahipsiz bildirim riskini çok daha büyütürdü.

import { Subscription } from "../../types/habit";
import { parseDateKey } from "../../utils/date";
import { formatTRY } from "../../utils/subscription";
import {
  SUBSCRIPTION_REMINDER_HOUR,
  subscriptionReminderBody,
} from "../../data/subscriptions";
import {
  ANDROID_CHANNEL_ID,
  ensureAndroidChannel,
  ensureNotificationPermission,
  Notifications,
} from "./runtime";

/**
 * Bir aboneliğin, verilen yenileme günü için hatırlatıcısını planlar ve
 * bildirim id'sini döner.
 *
 * Yenileme günü çağıran tarafından verilir (bkz. utils/subscription.ts) —
 * tarih hesabı burada tekrarlanmaz, tek bir yerde yapılır.
 *
 * Hesaplanan an geçmişte kaldıysa bildirim planlanmaz: DATE tetikleyicisi
 * gelecekte bir an ister. Bu, "2 gün önce hatırlat" denmiş ama yenilemeye
 * 1 gün kalmış aboneliklerde normal bir durumdur.
 */
export async function scheduleSubscriptionReminder(
  subscription: Subscription,
  renewalKey: string
): Promise<string | null> {
  if (!Notifications || !subscription.hasReminder) return null;

  const daysBefore = subscription.reminderDaysBefore ?? 0;
  const when = parseDateKey(renewalKey);
  when.setDate(when.getDate() - daysBefore);
  when.setHours(SUBSCRIPTION_REMINDER_HOUR, 0, 0, 0);

  if (when.getTime() <= Date.now()) return null;

  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: subscription.name,
      body: subscriptionReminderBody(formatTRY(subscription.amount), daysBefore),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

export async function cancelSubscriptionReminder(notificationId: string | undefined) {
  if (!Notifications || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
