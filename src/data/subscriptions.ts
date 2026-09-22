// Abonelik ekranının sabit metinleri ve hazır servis şablonları.

import type { ImageSourcePropType } from "react-native";
import { HABIT_COLORS } from "./colors";
import { translate } from "../languages";

/**
 * Marka simgeleri.
 *
 * Hepsi TEK RENKLİ birer alfa maskesidir (siyah glif + saydam zemin), bu
 * yüzden `<Image tintColor>` ile aboneliğin rengine boyanabilirler. Renkli
 * logolar yerine tek renk tercih edildi: 12 farklı markanın kendi renkleri
 * yan yana gelince liste alacalı görünüyor, uygulamanın sade dilini bozuyordu.
 *
 * `require()` çağrıları STATİK olmak zorunda — React Native paketleyicisi
 * (Metro) görselleri derleme anında toplar, çalışma anında bir değişkenden
 * yol üretilemez. Bu yüzden düz bir eşleme tablosu tutulur.
 *
 * Kaynak: simple-icons (CC0). Markalar kendi sahiplerinin tescilli
 * işaretleridir; burada yalnızca kullanıcının kendi aboneliğini tanıması için
 * kullanılıyorlar.
 */
const SUBSCRIPTION_ICONS: Record<string, ImageSourcePropType> = {
  claude: require("../../assets/subscription-icons/claude.png"),
  chatgpt: require("../../assets/subscription-icons/chatgpt.png"),
  adobe: require("../../assets/subscription-icons/adobe.png"),
  spotify: require("../../assets/subscription-icons/spotify.png"),
  netflix: require("../../assets/subscription-icons/netflix.png"),
  youtube: require("../../assets/subscription-icons/youtube.png"),
  instagram: require("../../assets/subscription-icons/instagram.png"),
  "google-one": require("../../assets/subscription-icons/google-one.png"),
  "amazon-prime": require("../../assets/subscription-icons/amazon-prime.png"),
};

// Simgesi olmayan anahtarlar için undefined döner; arayüz o durumda adın ilk
// harfine düşer (bkz. SubscriptionIcon).
export function subscriptionIcon(iconKey: string | undefined): ImageSourcePropType | undefined {
  return iconKey ? SUBSCRIPTION_ICONS[iconKey] : undefined;
}

// Formda tek dokunuşla seçilebilen yaygın servisler. Amaç yazma yükünü
// azaltmak: kullanıcı "Claude"a dokunur, sadece tutarı girer. Listede olmayan
// bir servis için ad alanı elle de yazılabilir — bu liste bir kısıt değil,
// kısayoldur.
export type SubscriptionPreset = {
  name: string;
  color: string;
  /** SUBSCRIPTION_ICONS anahtarı. Simgesi olmayan servisler bunu boş bırakır. */
  iconKey?: string;
};

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { name: "Claude", color: "#D0553D", iconKey: "claude" },
  { name: "ChatGPT", color: "#3EA86B", iconKey: "chatgpt" },
  { name: "Adobe", color: "#D0553D", iconKey: "adobe" },
  { name: "Spotify", color: "#3EA86B", iconKey: "spotify" },
  { name: "Netflix", color: "#D0553D", iconKey: "netflix" },
  { name: "YouTube Premium", color: "#D0553D", iconKey: "youtube" },
  { name: "Instagram", color: "#8A6FD1", iconKey: "instagram" },
  { name: "Google One", color: "#4F8FE0", iconKey: "google-one" },
  { name: "Amazon Prime", color: "#4F8FE0", iconKey: "amazon-prime" },
];

// Şablon seçilmediğinde kullanılacak renk.
export const DEFAULT_SUBSCRIPTION_COLOR = HABIT_COLORS[0];

// Etiketler getter ile okunur: metin, modül yüklenirken değil kullanıldığı
// an seçili dilde üretilir.
export const CYCLE_OPTIONS: { key: "monthly" | "yearly"; readonly label: string }[] = [
  { key: "monthly", get label() { return translate("subscription.cycle.monthly"); } },
  { key: "yearly", get label() { return translate("subscription.cycle.yearly"); } },
];

export const CYCLE_LABELS: Readonly<Record<"monthly" | "yearly", string>> = {
  get monthly() { return translate("subscription.cycleLabel.monthly"); },
  get yearly() { return translate("subscription.cycleLabel.yearly"); },
};

// --- Hatırlatma ------------------------------------------------------------

export type SubscriptionReminderOption = {
  days: number;
  readonly label: string;
};

export const SUBSCRIPTION_REMINDER_OPTIONS: SubscriptionReminderOption[] = [
  { days: 0, get label() { return translate("subscription.reminder.onDay"); } },
  { days: 1, get label() { return translate("subscription.reminder.oneDayBefore"); } },
  { days: 2, get label() { return translate("subscription.reminder.daysBefore", { n: 2 }); } },
  { days: 7, get label() { return translate("subscription.reminder.oneWeekBefore"); } },
];

// İki gün, iptal etmek isteyen biri için genelde yeterli süredir; ödeme
// gününün kendisi ise çoğu zaman çok geç olur.
export const DEFAULT_SUBSCRIPTION_REMINDER_DAYS = 2;

// Hatırlatma bildiriminin günün hangi saatinde düşeceği. Aboneliğin bir saati
// yok — kart gün içinde herhangi bir an çekilebilir — bu yüzden sabit, makul
// bir saat seçilir: sabahın erken saatinde uyandırmayan, gün içinde de
// gözden kaçmayacak bir vakit.
export const SUBSCRIPTION_REMINDER_HOUR = 10;

/**
 * Bildirim gövdesi: "₺500 2 gün sonra çekilecek."
 *
 * Tutar bilerek gövdeye yazılır — hatırlatmanın tek işi, kullanıcının hesabından
 * ne kadar çıkacağını ödeme gerçekleşmeden ÖNCE görmesini sağlamaktır. Başlık
 * zaten aboneliğin adını taşır.
 */
export function subscriptionReminderBody(amountLabel: string, daysBefore: number): string {
  if (daysBefore <= 0) return translate("notif.subscription.body.today", { amount: amountLabel });
  if (daysBefore === 1) return translate("notif.subscription.body.tomorrow", { amount: amountLabel });
  if (daysBefore === 7) return translate("notif.subscription.body.oneWeek", { amount: amountLabel });
  return translate("notif.subscription.body.days", { amount: amountLabel, n: daysBefore });
}
