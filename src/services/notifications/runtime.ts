// Bu dosya: bildirim altyapısının kurulumu ve izin durumu.
//
// Buradaki hiçbir şey tek başına bildirim GÖNDERMEZ. Burası sadece şu üç
// soruyu cevaplar:
//   1. Bu cihazda/ortamda bildirim gönderebiliyor muyuz?
//   2. Android için bildirim kanalı açıldı mı? (Android bunu zorunlu tutar)
//   3. Kullanıcı izin verdi mi, vermedi mi, henüz sorulmadı mı?
//
// Asıl bildirim planlama işi habitReminders.ts ve meetingReminders.ts'te.

import { Platform } from "react-native";
import { translate } from "../../languages";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type * as NotificationsType from "expo-notifications";

// expo-notifications'ın Android bildirim özelliği, SDK 53'ten itibaren
// Expo Go'dan tamamen kaldırıldı. Sıradan bir hatadan daha kötüsü: modül bu
// durumu asenkron bir native callback üzerinden React Native'in global/fatal
// hata yakalayıcısına bildiriyor — yani require() etrafına konan senkron bir
// try/catch bunu YAKALAYAMIYOR. Tek güvenilir çözüm: Expo Go içindeyken bu
// modülü hiç require() etmemek. Bunu anlamanın güncel (deprecated olmayan)
// yolu `executionEnvironment` kontrolüdür.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Expo Go'da null kalır. Bu yüzden bildirimle ilgili HER fonksiyon işe
// "Notifications var mı?" diye başlar; yoksa sessizce hiçbir şey yapmaz.
export let Notifications: typeof NotificationsType | null = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (error) {
    console.error("Bu ortamda expo-notifications kullanılamıyor", error);
  }
}

export const ANDROID_CHANNEL_ID = "habit-reminders";

let handlerConfigured = false;

// Modül kapsamında değil, kök layout'un bir effect'i içinden çağrılır —
// import sırasında hata fırlatan bir native modül çağrısı, React daha ilk
// render'ını yapmadan uygulamayı hiçbir hata göstermeden çökertebilirdi.
export function configureNotificationHandler() {
  if (handlerConfigured || !Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  } catch (error) {
    console.error("Bildirim işleyicisi (handler) yapılandırılamadı", error);
  }
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android" || !Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: translate("notif.channel.name"),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (error) {
    console.error("Android bildirim kanalı oluşturulamadı", error);
  }
}

/**
 * Bildirim izninin, ARAYÜZE GÖSTERİLEBİLECEK durumu.
 *
 * - "unsupported": bu ortamda bildirim yok (Expo Go). Kullanıcının yapabileceği
 *   bir şey olmadığı için uyarı göstermenin anlamı da yok.
 * - "undetermined": henüz sorulmadı; hatırlatıcı kurulduğunda sorulacak.
 * - "granted" / "denied": kullanıcının kararı.
 *
 * "denied" ayrı bir durum olarak döner çünkü tek çözümü uygulama içinden
 * tekrar sormak DEĞİL, cihaz ayarlarından açmaktır — iOS ikinci kez sormaya
 * izin vermez. Arayüz bunu bilmeden doğru yönlendirmeyi yapamaz.
 */
export type NotificationPermissionStatus =
  | "unsupported"
  | "undetermined"
  | "granted"
  | "denied";

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!Notifications) return "unsupported";
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    return current.canAskAgain ? "undetermined" : "denied";
  } catch (error) {
    console.error("Bildirim izni durumu okunamadı", error);
    return "unsupported";
  }
}

// İzin yoksa sistem penceresini AÇAR. Kullanıcı bilerek bir hatırlatıcı
// kurarken bunu beklemek makuldür.
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Mevcut izni SORAR AMA İSTEMEZ — sistem izin penceresini açmaz.
 *
 * Kullanıcı bir hatırlatıcı kurarken izin istemek beklenen bir şeydir
 * (`ensureNotificationPermission`). Ama kullanıcı sadece bir kutucuğu
 * işaretlemişken araya izin penceresi sokmak, istemediğini söylemiş birini
 * tekrar tekrar dürtmek olur. Kutlama bildirimleri bu yüzden izin yoksa
 * sessizce atlanır.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  } catch (error) {
    console.error("Bildirim izni okunamadı", error);
    return false;
  }
}

// "09:30" → { hour: 9, minute: 30 }
export function parseTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}
