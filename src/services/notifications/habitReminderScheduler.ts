// Bu dosya: alışkanlık hatırlatmalarının telefonla senkron kalmasını sağlayan
// "yarış koruması".
//
// Sorun şu: bir hatırlatmayı telefona kurmak zaman alır (asenkron bir iş).
// Kullanıcı, kurma işlemi daha bitmeden alışkanlığı tekrar düzenlerse ya da
// silerse, geç gelen sonuç artık geçersiz olur. Hiçbir şey yapılmazsa
// telefonda "sahipsiz" bir bildirim kalır: uygulama onu bilmez, iptal edemez,
// ama bildirim yine de çalar. Kullanıcı sildiği bir alışkanlıktan bildirim
// almaya devam eder.
//
// Çözüm: her alışkanlığa bir sayaç (generation / "kuşak") tutulur.
// Hatırlatmaya dokunan her işlem, başlamadan önce bu sayacı bir artırır.
// Sonuç geldiğinde sayaç hâlâ aynıysa sonuç geçerlidir ve kaydedilir;
// değişmişse arada daha yeni bir işlem olmuş demektir — o zaman yeni gelen
// bildirim id'leri kaydedilmez, doğrudan iptal edilir.

import React, { useRef } from "react";
import { Habit } from "../../types/habit";
import { cancelHabitReminder } from ".";

export type HabitReminderScheduler = {
  // Devam eden planlama işlerini geçersiz kılar ve yeni kuşak numarasını döner.
  bumpGeneration: (id: string) => number;
  // Planlama sonucu geldiğinde çağrılır: hâlâ geçerliyse kaydeder, değilse iptal eder.
  applyScheduleResult: (id: string, generation: number, ids: string[]) => void;
};

export function useHabitReminderScheduler(
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>
): HabitReminderScheduler {
  // Devam eden bildirim planlama/iptal işlerini koruyan, alışkanlık başına
  // sayaç. Bir alışkanlığın hatırlatıcılarına dokunan her işlem, başlamadan
  // önce o alışkanlığın "kuşağını" (generation) bir artırır; asenkron sonuç
  // geldiğinde sadece kuşak hâlâ eşleşiyorsa uygulanır — eşleşmiyorsa daha
  // yeni bir düzenleme (ya da silme) onu geçersiz kılmış demektir, ve artık
  // sahipsiz kalan bildirim id'leri iptal edilir.
  const notificationGenerationRef = useRef<Map<string, number>>(new Map());

  function bumpGeneration(id: string) {
    const next = (notificationGenerationRef.current.get(id) ?? 0) + 1;
    notificationGenerationRef.current.set(id, next);
    return next;
  }

  function applyScheduleResult(id: string, generation: number, ids: string[]) {
    if (notificationGenerationRef.current.get(id) !== generation) {
      // Daha yeni bir düzenleme veya silme tarafından geçersiz kılınmış —
      // bu id'ler artık sahipsiz, iptal edilmeleri gerekir.
      if (ids.length > 0) {
        cancelHabitReminder(ids).catch((error) =>
          console.error("Geçersiz kalmış (superseded) hatırlatıcı iptal edilemedi", error)
        );
      }
      return;
    }
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, notificationIds: ids } : h)));
  }

  return { bumpGeneration, applyScheduleResult };
}
