// English — notification texts. Must provide ALL keys of notifications/tr.ts.
import type { NotificationKey } from "./tr";

export const notificationsEn: Record<NotificationKey, string> = {
  // --- Alışkanlık formu ve tekrar seçenekleri ---
  "notif.meeting.now": "Your meeting is starting now.",
  "notif.meeting.inMinutes": "Your meeting starts in {n} minutes.",
  "notif.meeting.inHours.one": "Your meeting starts in {n} hour.",
  "notif.meeting.inHours.other": "Your meeting starts in {n} hours.",
  "notif.meeting.tomorrow": "Your meeting is tomorrow.",
  "notif.meeting.inDays": "Your meeting is in {n} days.",
  "notif.habit.reminderBody": "Don't forget to complete your habit.",
  "notif.habit.streak.7": "7 days in a row. It's becoming a habit.",
  "notif.habit.streak.30": "30 days in a row. This is your routine now.",
  "notif.habit.streak.100": "100 days in a row. You really did it.",

  // --- Toplantı, abonelik ve ayarlar ---
  "notif.subscription.body.today": "{amount} will be charged today.",
  "notif.subscription.body.tomorrow": "{amount} will be charged tomorrow.",
  "notif.subscription.body.oneWeek": "{amount} will be charged in 1 week.",
  "notif.subscription.body.days": "{amount} will be charged in {n} days.",

  // --- Servisler ---
  "notif.channel.name": "Habit Reminders",
  "notif.followUp.body": "Did you complete this habit?",
};
