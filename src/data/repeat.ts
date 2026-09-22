import { Habit, RepeatCycle } from "../types/habit";
import { translate } from "../languages";

// Etiketler çağrıldığı anda o anki dilde okunur (getter), modül yüklenirken
// sabitlenmez — dil değişince yeni dilde görünürler.
function option(key: RepeatCycle): { key: RepeatCycle; label: string } {
  return {
    key,
    get label() {
      return translate(`repeat.option.${key}` as "repeat.option.daily");
    },
  };
}

export const REPEAT_OPTIONS: { key: RepeatCycle; label: string }[] = [
  option("daily"),
  option("weekly"),
  option("monthly"),
  option("yearly"),
];

// "Her gün", "Her hafta", ... — döngünün sabit etiketi.
export function repeatLabel(cycle: RepeatCycle): string {
  return translate(`repeat.label.${cycle}` as "repeat.label.daily");
}

// "3 günde bir", "2 haftada bir", ... (n > 1). Özel döngünün birimi olmadığı
// için onun etiketi değişmez.
export function repeatEveryNLabel(cycle: RepeatCycle, n: number): string {
  if (n <= 1 || cycle === "custom") return repeatLabel(cycle);
  return translate(`repeat.everyN.${cycle}` as "repeat.everyN.daily", { n });
}

// Çoğu tekrar döngüsü sabit bir "Her X" etiketi gösterir; ama bir
// repeatEveryN çarpanı varsa "N X'de bir" olarak okunur ("3 günde bir",
// "2 haftada bir", ...).
export function repeatCycleLabel(habit: Pick<Habit, "repeatCycle" | "repeatEveryN">): string {
  return repeatEveryNLabel(habit.repeatCycle, habit.repeatEveryN ?? 1);
}
