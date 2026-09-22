// Alışkanlık ikonları: kullanıcı, alışkanlığına bu listeden bir ikon seçer.
// Hepsi MaterialCommunityIcons setindendir (@expo/vector-icons). Kayıtta yalnızca
// ikonun adı saklanır; listede olmayan (ör. eski/bozuk) bir ad gelirse arayüz
// etiketin ikonuna düşer (bkz. HabitIcon).

import type { ComponentProps } from "react";
import type MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { translate } from "../languages";

export type HabitIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export const HABIT_ICON_GROUPS: { title: string; icons: HabitIconName[] }[] = [
  {
    get title() {
      return translate("data.iconGroup.health");
    },
    icons: [
      "water", "cup-water", "heart-pulse", "pill", "medical-bag",
      "tooth", "eye-outline", "sleep", "bed", "meditation",
      "yoga", "lungs", "brain", "emoticon-happy-outline", "food-apple",
      "carrot", "leaf", "fruit-watermelon", "glass-cocktail-off",
    ],
  },
  {
    get title() {
      return translate("data.iconGroup.sport");
    },
    icons: [
      "run", "dumbbell", "bike", "swim", "walk",
      "basketball", "soccer", "tennis", "hiking", "boxing-glove",
      "kettlebell", "jump-rope", "weight-lifter", "timer-outline",
    ],
  },
  {
    get title() {
      return translate("data.iconGroup.home");
    },
    icons: [
      "broom", "washing-machine", "home-outline", "silverware-fork-knife", "chef-hat",
      "coffee-outline", "trash-can-outline", "flower-outline", "paw", "car-outline",
      "shopping-outline", "cart-outline", "lightbulb-outline", "hanger", "iron",
    ],
  },
  {
    get title() {
      return translate("data.iconGroup.work");
    },
    icons: [
      "book-open-page-variant", "book-outline", "notebook-outline", "pencil-outline", "laptop",
      "code-tags", "school-outline", "translate", "calculator-variant", "briefcase-outline",
      "email-outline", "phone-outline", "calendar-check", "clipboard-check-outline", "target",
    ],
  },
  {
    get title() {
      return translate("data.iconGroup.personal");
    },
    icons: [
      "music-note", "guitar-acoustic", "palette-outline", "camera-outline", "gamepad-variant-outline",
      "movie-open-outline", "headphones", "brush", "account-group-outline", "gift-outline",
      "heart-outline", "star-outline", "weather-sunny", "weather-night", "white-balance-sunny",
      "cash", "piggy-bank-outline", "wallet-outline", "airplane", "pine-tree",
      "cellphone-off", "smoking-off", "alarm", "fire", "lightning-bolt",
      "trophy-outline", "rocket-launch-outline", "diamond-stone", "hand-heart-outline", "thought-bubble-outline",
    ],
  },
];

const ALL_ICONS: string[] = HABIT_ICON_GROUPS.flatMap((g) => g.icons);

export function isHabitIcon(name: string | undefined): name is HabitIconName {
  return !!name && ALL_ICONS.includes(name);
}

// Yeni bir alışkanlığa öntanımlı olarak rastgele bir ikon verilir (renk de
// rastgele seçildiği gibi); kullanıcı formdan değiştirebilir.
export function randomHabitIcon(): HabitIconName {
  return ALL_ICONS[Math.floor(Math.random() * ALL_ICONS.length)] as HabitIconName;
}
