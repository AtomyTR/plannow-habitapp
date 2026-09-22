import { HabitTag } from "../types/habit";
import { translate } from "../languages";

// Hazır (built-in) etiketler. Her zaman kullanılabilir, silinemezler —
// kullanıcı bunların üzerine kendi etiketlerini ekleyebilir (bkz. settings/tags.tsx).
// Hazır etiketlerin adı kayıtta değil çeviride durur: `label` bir getter'dır ve
// her okunuşta o anki dili döndürür. Kullanıcının kendi etiketleri ise yazdığı
// metinle saklanır ve olduğu gibi gösterilir.
function defaultTag(id: string, emoji: string): HabitTag {
  return {
    id,
    emoji,
    get label() {
      return translate(`data.tag.${id}` as "data.tag.morning");
    },
  };
}

export const DEFAULT_TAGS: HabitTag[] = [
  defaultTag("morning", "☀️"),
  defaultTag("noon", "🌤️"),
  defaultTag("afternoon", "⛅"),
  defaultTag("evening", "🌆"),
  defaultTag("sport", "🏃"),
  defaultTag("cleaning", "✨"),
  defaultTag("food", "🍽️"),
  defaultTag("before-sleep", "🛌"),
  defaultTag("bad-habits", "🚫"),
];

const DEFAULT_TAG_IDS = new Set(DEFAULT_TAGS.map((tag) => tag.id));

/** Ekranda gösterilecek etiket adı: hazır etiketse çevirisi, değilse kullanıcının yazdığı ad. */
export function tagLabel(tag: Pick<HabitTag, "id" | "label">): string {
  return DEFAULT_TAG_IDS.has(tag.id) ? translate(`data.tag.${tag.id}` as "data.tag.morning") : tag.label;
}

// Kategoriye göre gruplanmış hazır alışkanlık şablonları. Şu an hiçbir ekran
// bunları göstermiyor (Keşfet sekmesi kaldırıldı); yeni tasarımda geri gelmek
// üzere duruyor.
export type HabitPreset = {
  id: string;
  label: string;
  emoji: string;
  tagId?: string;
};

function preset(id: string, emoji: string): HabitPreset {
  return {
    id,
    emoji,
    get label() {
      return translate(`data.preset.${id}` as "data.preset.make-bed");
    },
  };
}

export const PRESET_CATEGORIES: { id: string; title: string; emoji: string; tagId?: string; items: HabitPreset[] }[] = [
  {
    id: "popular",
    get title() {
      return translate("data.presetCategory.popular");
    },
    emoji: "🔥",
    items: [
      preset("meditation-5", "🧘"),
      preset("water-2l", "🥛"),
      preset("self-motivate", "✊"),
      preset("neck-stretch", "🙆"),
      preset("run-2km", "🏃"),
      preset("no-phone-bed", "🚫"),
    ],
  },
  {
    id: "morning",
    get title() {
      return translate("data.presetCategory.morning");
    },
    emoji: "☀️",
    tagId: "morning",
    items: [
      preset("make-bed", "🛏️"),
      preset("wake-6", "⏰"),
      preset("water-glass", "🥛"),
      preset("morning-stretch", "🤸"),
      preset("morning-meditation", "🧘"),
    ],
  },
  {
    id: "health",
    get title() {
      return translate("data.presetCategory.health");
    },
    emoji: "🌱",
    items: [],
  },
];


// Yeni etiket eklerken önerilen emojiler. İki yerden kullanılır: Ayarlar >
// Etiketleri Yönet ekranı ve alışkanlık formundaki "+ Ekle" penceresi.
// Tek listede tutulur ki iki ekran birbirinden sessizce ayrışmasın.
export const SUGGESTED_TAG_EMOJIS = ["🏷️", "📌", "⭐", "🎯", "📚", "🎨", "🎵", "💧"];

// Etiket adı geçerli mi? Sadece boşluktan oluşan ad kabul edilmez.
export function isValidTagLabel(label: string): boolean {
  return label.trim().length > 0;
}
