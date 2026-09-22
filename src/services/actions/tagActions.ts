// Bu dosya: etiketler.
//
// Etiket, alışkanlıkları gruplamaya yarayan küçük bir isim + emoji çiftidir
// ("Spor 🏃", "Okuma 📚"). Uygulamayla birlikte gelen hazır etiketler
// (DEFAULT_TAGS) silinemez; kullanıcının kendi eklediği etiketler silinebilir.
//
// Bir etiket silinince ona bağlı alışkanlıklara ne olur? Alışkanlık silinmez;
// sadece etiketsiz hale gelir. Aksi halde artık var olmayan bir etikete işaret
// eden alışkanlıklar kalır ve ekranlar boş bir etiket göstermeye çalışırdı.

import React from "react";
import { Habit, HabitTag } from "../../types/habit";
import { HabitStoreValue } from "../habitStoreTypes";
import { generateId } from "../id";

type TagActionsDeps = {
  setCustomTags: React.Dispatch<React.SetStateAction<HabitTag[]>>;
  habitsRef: React.MutableRefObject<Habit[]>;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
};

type TagActions = Pick<HabitStoreValue, "addCustomTag" | "deleteCustomTag">;

export function useTagActions(deps: TagActionsDeps): TagActions {
  const { setCustomTags, habitsRef, setHabits } = deps;

  const addCustomTag: HabitStoreValue["addCustomTag"] = (label, emoji) => {
    const newTag: HabitTag = { id: generateId(), label, emoji, custom: true };
    setCustomTags((prev) => [...prev, newTag]);
    return newTag;
  };

  const deleteCustomTag: HabitStoreValue["deleteCustomTag"] = (id) => {
    setCustomTags((prev) => prev.filter((t) => t.id !== id));
    // Silinen etikete bağlı alışkanlıklar, artık hiçbir yerde var olmayan bir
    // etikete sessizce işaret etmek yerine, sadece "etiketsiz" hale döner.
    habitsRef.current = habitsRef.current.map((h) => (h.tagId === id ? { ...h, tagId: undefined } : h));
    setHabits((prev) => prev.map((h) => (h.tagId === id ? { ...h, tagId: undefined } : h)));
  };

  return { addCustomTag, deleteCustomTag };
}
