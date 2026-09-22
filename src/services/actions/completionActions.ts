// Bu dosya: "bugün yaptım" işareti.
//
// Kullanıcı bir alışkanlığı bir gün için tamamladığında, o (alışkanlık, tarih)
// çifti için bir kayıt tutulur. Aynı yere tekrar dokunmak kaydı kaldırır.
// Seriler, takvim ve istatistikler hep bu kayıtlardan hesaplanır.
//
// İşaret değiştiği anda seri kutlaması da güncellenir: seri bir kilometre
// taşına ulaştıysa kutlama planlanır, işaret geri alındıysa iptal edilir.

import React, { useCallback, useMemo } from "react";
import { HabitCompletion } from "../../types/habit";
import { HabitStoreValue } from "../habitStoreTypes";
import { StreakMilestoneScheduler } from "../notifications/streakMilestoneScheduler";
import { cancelFollowUpsFor } from "../notifications/habitFollowUps";

type CompletionActionsDeps = {
  // Ekranlara gösterilen güncel liste (okuma için).
  completions: HabitCompletion[];
  // Aynı listenin senkron aynası (arka arkaya yapılan işaretlemeler için).
  completionsRef: React.MutableRefObject<HabitCompletion[]>;
  setCompletions: React.Dispatch<React.SetStateAction<HabitCompletion[]>>;
  milestones: StreakMilestoneScheduler;
};

function completionKey(habitId: string, date: string) {
  return `${habitId}|${date}`;
}

type CompletionActions = Pick<HabitStoreValue, "isCompletedOn" | "toggleCompletion">;

export function useCompletionActions(deps: CompletionActionsDeps): CompletionActions {
  const { completions, completionsRef, setCompletions, milestones } = deps;

  // "Tamamlandı mı?" sorusu ekranlarda alışkanlık × gün kadar sorulur; her
  // seferinde tüm listeyi taramak yerine bir kez kurulan kümeden anında bakılır.
  const completedKeys = useMemo(
    () => new Set(completions.map((c) => completionKey(c.habitId, c.date))),
    [completions]
  );
  const isCompletedOn = useCallback<HabitStoreValue["isCompletedOn"]>(
    (habitId, date) => completedKeys.has(completionKey(habitId, date)),
    [completedKeys]
  );

  const toggleCompletion: HabitStoreValue["toggleCompletion"] = (habitId, date, amount) => {
    // Senkron aynadan okunur: kullanıcı hızlıca birkaç kez dokunursa, her
    // dokunuş bir öncekinin sonucunu görmüş olmalı. React state'i bir render
    // geriden geldiği için buradan okumak yanlış sonuç verirdi.
    const prev = completionsRef.current;
    const exists = prev.some((c) => c.habitId === habitId && c.date === date);
    const next = exists
      ? prev.filter((c) => !(c.habitId === habitId && c.date === date))
      : [...prev, { habitId, date, amount }];

    completionsRef.current = next;
    setCompletions(next);
    if (!exists) {
      cancelFollowUpsFor(habitId, date).catch((error) =>
        console.error("Takip bildirimleri iptal edilemedi", error)
      );
    }
    // Seri hesabı dokunuşun animasyonunu bekletmesin: bir sonraki tick'e ertelenir.
    setTimeout(() => milestones.syncStreakMilestone(habitId, next), 0);
  };

  return { isCompletedOn, toggleCompletion };
}
