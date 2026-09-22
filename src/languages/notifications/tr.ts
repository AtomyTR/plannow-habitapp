// Türkçe — bildirim metinleri (arayüz yazılarından ayrı tutulur).
// {title} gibi yer tutucular çalışma anında doldurulur.

export const notificationsTr = {
  // --- Alışkanlık formu ve tekrar seçenekleri ---
  "notif.meeting.now": "Toplantın şimdi başlıyor.",
  "notif.meeting.inMinutes": "Toplantın {n} dakika içinde başlıyor.",
  "notif.meeting.inHours.one": "Toplantın {n} saat içinde başlıyor.",
  "notif.meeting.inHours.other": "Toplantın {n} saat içinde başlıyor.",
  "notif.meeting.tomorrow": "Toplantın yarın.",
  "notif.meeting.inDays": "Toplantın {n} gün içinde.",
  "notif.habit.reminderBody": "Alışkanlığını tamamlamayı unutma.",
  "notif.habit.streak.7": "7 gün üst üste tamamladın. Artık bir alışkanlığa dönüşüyor.",
  "notif.habit.streak.30": "30 gün üst üste tamamladın. Bu artık senin rutinin.",
  "notif.habit.streak.100": "100 gün üst üste tamamladın. Bunu gerçekten başardın.",

  // --- Toplantı, abonelik ve ayarlar ---
  "notif.subscription.body.today": "{amount} bugün çekilecek.",
  "notif.subscription.body.tomorrow": "{amount} yarın çekilecek.",
  "notif.subscription.body.oneWeek": "{amount} 1 hafta sonra çekilecek.",
  "notif.subscription.body.days": "{amount} {n} gün sonra çekilecek.",

  // --- Servisler ---
  "notif.channel.name": "Alışkanlık Hatırlatmaları",
  "notif.followUp.body": "Bu alışkanlığı tamamladınız mı?",
} as const;

export type NotificationKey = keyof typeof notificationsTr;
