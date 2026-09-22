// Bu dosya: abonelik hatırlatmalarını, yenileme günü geçtikçe ileri taşır.
//
// Sorun şu: bir aboneliğin bildirimi TEK SEFERLİKTİR ve yalnızca bir sonraki
// yenileme günü için kurulur (nedeni subscriptionReminders.ts'in başında).
// O gün geldiğinde bildirim düşer ve tükenir — bir sonraki ay için kendi
// kendine yenilenmez.
//
// Bu yüzden uygulama her açıldığında kısa bir uzlaştırma yapılır: hatırlatması
// açık her aboneliğin bildirimi, hâlâ GÜNCEL yenileme gününü hedefliyor mu
// diye bakılır. Hedeflemiyorsa (yani o tarih geçmişse) bir sonrakine kurulur.
//
// Bilerek "hepsini yeniden kur" YAPILMAZ: durumu zaten doğru olan aboneliklere
// dokunmak, her açılışta boşuna cihaz çağrısı ve disk yazımı demek olurdu.
// Karşılaştırma `notificationForDate` alanı üzerinden, cihaza hiç sorulmadan
// yapılır.

import { useEffect } from "react";
import { Subscription } from "../../types/habit";
import { nextRenewalKey } from "../../utils/subscription";

export function useSubscriptionRenewalSync(
  subscriptions: Subscription[],
  loaded: boolean,
  resyncSubscription: (subscription: Subscription) => void
) {
  useEffect(() => {
    if (!loaded) return;

    for (const subscription of subscriptions) {
      if (!subscription.hasReminder) continue;
      if (subscription.notificationForDate === nextRenewalKey(subscription)) continue;
      resyncSubscription(subscription);
    }
    // Yalnızca açılıştaki ilk yüklemede çalışır. `subscriptions` bağımlılığa
    // eklenseydi, kendi yazdığı notificationForDate değişikliğiyle kendini
    // tekrar tetiklerdi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
}
