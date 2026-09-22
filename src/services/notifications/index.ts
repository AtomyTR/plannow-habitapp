// Bu dosya: bildirim işlerinin tek kapısı.
//
// Uygulamanın geri kalanı bildirimle ilgili her şeyi buradan alır
// (`from "../services/notifications"`). İçeride üç parçaya bölünmüştür:
//
//   runtime.ts           → kurulum, Android kanalı, izin durumu
//   habitReminders.ts    → alışkanlık hatırlatmaları + seri kutlamaları
//   meetingReminders.ts  → toplantı hatırlatmaları
//   subscriptionReminders.ts → abonelik yenileme hatırlatmaları
//
// Bölünme sadece okunabilirlik içindir; dışarıya görünen isimler değişmedi.

export {
  configureNotificationHandler,
  ensureAndroidChannel,
  ensureNotificationPermission,
  getNotificationPermissionStatus,
} from "./runtime";
export type { NotificationPermissionStatus } from "./runtime";

export {
  isWithinPeriod,
  cancelHabitReminder,
  cancelStreakMilestone,
  scheduleHabitReminder,
  scheduleStreakMilestone,
} from "./habitReminders";

export { cancelMeetingReminder, scheduleMeetingReminder } from "./meetingReminders";

export {
  cancelSubscriptionReminder,
  scheduleSubscriptionReminder,
} from "./subscriptionReminders";
