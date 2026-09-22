// Bildirim metinlerinin tek toplandığı yer: toplantı hatırlatıcılarının
// "kaç dakika önce" seçenekleri ve alışkanlık bildirimlerinin gövdeleri.
// Hem form (seçim çipleri) hem de bildirim gövdesi buradan türetilir;
// böylece kullanıcıya gösterilen her metin tek bir dosyada tanımlıdır.

import { translate } from "../languages";

export type ReminderOption = {
  minutes: number;
  label: string;
};

// Etiket o anki dilde, okunduğu anda çevrilir (getter).
function reminderOption(minutes: number): ReminderOption {
  return {
    minutes,
    get label() {
      return translate(`data.meetingReminder.${minutes}` as "data.meetingReminder.0");
    },
  };
}

export const MEETING_REMINDER_OPTIONS: ReminderOption[] = [0, 5, 10, 15, 30, 60, 1440].map(reminderOption);

export const DEFAULT_MEETING_REMINDER_MINUTES = 10;

// Bildirim gövdesi: "Toplantın 10 dakika içinde başlıyor." gibi. 0 dakika,
// tam başlangıç anıdır.
export function reminderBody(minutesBefore: number): string {
  if (minutesBefore <= 0) return translate("notif.meeting.now");
  if (minutesBefore < 60) return translate("notif.meeting.inMinutes", { n: minutesBefore });
  if (minutesBefore < 1440) {
    const hours = Math.round(minutesBefore / 60);
    return translate(hours === 1 ? "notif.meeting.inHours.one" : "notif.meeting.inHours.other", { n: hours });
  }
  const days = Math.round(minutesBefore / 1440);
  return days === 1 ? translate("notif.meeting.tomorrow") : translate("notif.meeting.inDays", { n: days });
}

// --- Alışkanlık hatırlatıcıları -------------------------------------------

/**
 * Tekrarlayan (günlük/haftalık) alışkanlık hatırlatıcısının gövdesi.
 *
 * Bilerek "her zaman geçerli": içinde seri sayısı gibi zamanla değişen HİÇBİR
 * değer yok. Tekrarlayan bir bildirimin gövdesi planlandığı anda dondurulur,
 * her tetiklenişte yeniden hesaplanmaz — "5 gündür devam ediyorsun" yazan bir
 * gövde ertesi gün sessizce yalan söylemeye başlardı. Seriye özel her metin
 * bu yüzden sadece tek seferlik kilometre taşı bildirimlerinde kullanılır.
 */
export function habitReminderBody(): string {
  return translate("notif.habit.reminderBody");
}

/**
 * Kilometre taşı (seri) bildirim gövdeleri.
 *
 * Bu metinler SADECE kutlama içindir ve yalnızca seri gerçekten o sayıya
 * ULAŞTIKTAN sonra gönderilir; yani hepsi gönderildiği anda doğru olan, geçmiş
 * bir olguyu anlatır. Buraya asla "serin bozulmak üzere", "seni özledik" ya da
 * kaçırılan bir günü ima eden bir metin eklenmemeli: bir gün kaçırıldığında
 * kullanıcı hiçbir ek bildirim almaz, ertesi günkü hatırlatıcı da diğer tüm
 * günlerle bire bir aynıdır.
 */
const STREAK_MILESTONES = [7, 30, 100];

// Verilen seri bir kilometre taşıysa kutlama metnini, değilse null döner.
export function streakMilestoneBody(streak: number): string | null {
  if (!STREAK_MILESTONES.includes(streak)) return null;
  return translate(`notif.habit.streak.${streak}` as "notif.habit.streak.7");
}
