import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import {
  getNotificationPermissionStatus,
  NotificationPermissionStatus,
} from "../services/notifications";

/**
 * Bildirim izninin güncel durumunu izler.
 *
 * Uygulama ön plana her döndüğünde yeniden okunur: kullanıcı izni cihaz
 * ayarlarından açtığında geri geldiğinde uyarının hâlâ durması, düzelttiği
 * bir sorunu düzelmemiş gibi göstermek olurdu.
 */
export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermissionStatus>("unsupported");

  const refresh = useCallback(() => {
    getNotificationPermissionStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Cihaz ayarlarındaki uygulama sayfasını açar. iOS ikinci kez izin sormaya
  // izin vermediği için "denied" durumunda tek gerçek çözüm budur.
  const openSettings = useCallback(() => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  }, []);

  return { status, refresh, openSettings };
}
