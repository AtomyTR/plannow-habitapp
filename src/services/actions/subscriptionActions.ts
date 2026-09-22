// Bu dosya: aboneliklere yapılan her şey.
//
// Abonelik, toplantının yakın akrabasıdır: tek bir bildirimi vardır, çöp
// kutusu yoktur (silinince gerçekten silinir). Tek farkı, bildiriminin sabit
// bir tarihe değil HESAPLANAN bir sonraki yenileme gününe kurulmasıdır.
//
// Toplantılardaki ile aynı "kuşak" (generation) yarış koruması burada da
// geçerlidir: kullanıcı bildirim kurulurken aboneliği düzenler veya silerse,
// geç gelen sonuç kaydedilmez, doğrudan iptal edilir.

import React, { useRef } from "react";
import { Subscription } from "../../types/habit";
import { HabitStoreValue } from "../habitStoreTypes";
import { generateId } from "../id";
import { subscriptionReminderChanged } from "../notifications/reminderDiff";
import { cancelSubscriptionReminder, scheduleSubscriptionReminder } from "../notifications";
import { nextRenewalKey } from "../../utils/subscription";

type SubscriptionActionsDeps = {
  subscriptionsRef: React.MutableRefObject<Subscription[]>;
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
};

type SubscriptionActions = Pick<
  HabitStoreValue,
  "addSubscription" | "updateSubscription" | "deleteSubscription"
> & {
  // Store'a değil, yalnızca açılış uzlaştırmasına açılan iç işlem;
  // HabitStoreValue'ya girmez çünkü hiçbir ekranın buna işi olmaz.
  resyncSubscription: (subscription: Subscription) => void;
};

export function useSubscriptionActions(deps: SubscriptionActionsDeps): SubscriptionActions {
  const { subscriptionsRef, setSubscriptions } = deps;

  const generationRef = useRef<Map<string, number>>(new Map());

  function bumpGeneration(id: string) {
    const next = (generationRef.current.get(id) ?? 0) + 1;
    generationRef.current.set(id, next);
    return next;
  }

  // Planlama sonucunu kaydeder.
  //
  // `notificationForDate`, "hangi yenileme günü için planlama YAPILDI" demektir
  // — bildirimin gerçekten kurulup kurulmadığından bağımsız olarak yazılır.
  // Kurulamadığı durumlar normaldir (hatırlatma anı çoktan geçmiştir, ya da
  // kullanıcı bildirim izni vermemiştir). Bu alan yalnızca id kurulduğunda
  // yazılsaydı, açılış uzlaştırması o abonelik için her açılışta yeniden
  // denerdi: boşa cihaz çağrısı, boşa state güncellemesi ve boşa disk yazımı.
  function applyScheduleResult(
    id: string,
    generation: number,
    notificationId: string | null,
    forDate: string
  ) {
    if (generationRef.current.get(id) !== generation) {
      // Daha yeni bir düzenleme/silme geçersiz kıldı — bu bildirim sahipsiz.
      if (notificationId) {
        cancelSubscriptionReminder(notificationId).catch((error) =>
          console.error("Geçersiz kalmış abonelik hatırlatıcısı iptal edilemedi", error)
        );
      }
      return;
    }
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              notificationId: notificationId ?? undefined,
              notificationForDate: forDate,
            }
          : s
      )
    );
  }

  // Aboneliğin hatırlatıcısını bir sonraki yenileme gününe kurar.
  function scheduleFor(subscription: Subscription, errorMessage: string) {
    const generation = bumpGeneration(subscription.id);
    const renewalKey = nextRenewalKey(subscription);
    scheduleSubscriptionReminder(subscription, renewalKey)
      .then((notificationId) =>
        applyScheduleResult(subscription.id, generation, notificationId, renewalKey)
      )
      .catch((error) => console.error(errorMessage, error));
  }

  const addSubscription: HabitStoreValue["addSubscription"] = (subscription) => {
    const newSubscription: Subscription = {
      ...subscription,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    subscriptionsRef.current = [...subscriptionsRef.current, newSubscription];
    setSubscriptions((prev) => [...prev, newSubscription]);

    if (newSubscription.hasReminder) {
      scheduleFor(newSubscription, "Abonelik hatırlatıcısı planlanamadı");
    }

    return newSubscription;
  };

  const updateSubscription: HabitStoreValue["updateSubscription"] = (id, patch) => {
    const current = subscriptionsRef.current.find((s) => s.id === id);
    if (!current) return;

    const merged: Subscription = { ...current, ...patch };
    subscriptionsRef.current = subscriptionsRef.current.map((s) => (s.id === id ? merged : s));
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? merged : s)));

    if (!subscriptionReminderChanged(current, merged)) return;

    const generation = bumpGeneration(id);
    const renewalKey = nextRenewalKey(merged);
    cancelSubscriptionReminder(current.notificationId)
      .then(() =>
        merged.hasReminder
          ? scheduleSubscriptionReminder(merged, renewalKey)
          : Promise.resolve(null)
      )
      .then((notificationId) => applyScheduleResult(id, generation, notificationId, renewalKey))
      .catch((error) => console.error("Abonelik hatırlatıcısı yeniden planlanamadı", error));
  };

  const deleteSubscription: HabitStoreValue["deleteSubscription"] = (id) => {
    const current = subscriptionsRef.current.find((s) => s.id === id);
    if (!current) return;

    // Devam eden planı geçersiz kıl; geç dönen bir promise sahipsiz id yazamasın.
    bumpGeneration(id);

    if (current.notificationId) {
      cancelSubscriptionReminder(current.notificationId).catch((error) =>
        console.error("Abonelik hatırlatıcısı iptal edilemedi", error)
      );
    }

    subscriptionsRef.current = subscriptionsRef.current.filter((s) => s.id !== id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  /**
   * Bildirimi, aboneliğin GÜNCEL bir sonraki yenileme gününe taşır.
   *
   * Açılış uzlaştırması tarafından çağrılır (bkz. subscriptionRenewalSync.ts):
   * hedeflediği tarih geçmiş bir bildirim artık tükenmiştir, yerine bir
   * sonraki kurulur. Eskisi yine de iptal edilir — düşmemiş, ama örneğin
   * kullanıcı telefonu kapalı tutmuşsa hâlâ bekliyor olabilir.
   */
  const resyncSubscription = (subscription: Subscription) => {
    const generation = bumpGeneration(subscription.id);
    const renewalKey = nextRenewalKey(subscription);
    cancelSubscriptionReminder(subscription.notificationId)
      .then(() => scheduleSubscriptionReminder(subscription, renewalKey))
      .then((notificationId) =>
        applyScheduleResult(subscription.id, generation, notificationId, renewalKey)
      )
      .catch((error) =>
        console.error("Abonelik hatırlatıcısı sonraki yenilemeye taşınamadı", error)
      );
  };

  return { addSubscription, updateSubscription, deleteSubscription, resyncSubscription };
}
