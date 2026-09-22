// Bu dosya: uygulamanın dil desteği. Çeviri eklemek: src/languages/README.md
//
// Her dilin TÜM arayüz yazıları tek dosyadadır (tr.ts, en.ts); bildirim
// metinleri notifications/ altında ayrıdır. Kullanım:
//
//   const { t } = useI18n();          // bileşenlerde (dil değişince yeniden çizer)
//   t("home.greeting.morning")
//   t("habit.everyN.days", { n: 3 })  // {n} yer tutucusu doldurulur
//
// Bileşen dışındaki kod (bildirim metinleri, tarih biçimleri) `translate()` ve
// `getLanguage()` ile o anki dili okur. Seçili dil ayarlarda (HabitSettings)
// saklanır; varsayılan Türkçe'dir.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { tr, type TranslationKey } from "./tr";
import { en } from "./en";
import { notificationsTr, type NotificationKey } from "./notifications/tr";
import { notificationsEn } from "./notifications/en";

// Dil kaydı. YENİ DİL EKLEMEK için buraya bir satır eklemek yeterli
// (adımlar: src/languages/README.md). `name` dil seçim menüsünde o dilin
// kendi dilindeki adıyla görünür.
const LANGUAGE_PACKS = {
  tr: { name: "Türkçe", ui: tr, notifications: notificationsTr },
  en: { name: "English", ui: en, notifications: notificationsEn },
} satisfies Record<string, { name: string; ui: Record<TranslationKey, string>; notifications: Record<NotificationKey, string> }>;

export type Language = keyof typeof LANGUAGE_PACKS;
export const LANGUAGES = Object.keys(LANGUAGE_PACKS) as Language[];
export const DEFAULT_LANGUAGE: Language = "tr";

/** Dilin kendi adı ("Türkçe", "English", …). */
export function languageName(language: Language): string {
  return LANGUAGE_PACKS[language].name;
}

/** Kayıtlı değer artık desteklenmeyen bir dilse varsayılana döner. */
export function resolveLanguage(value: string | undefined): Language {
  return value && value in LANGUAGE_PACKS ? (value as Language) : DEFAULT_LANGUAGE;
}

type Dict = Record<string, string>;
const dictionaries = {} as Record<Language, Dict>;
for (const lang of LANGUAGES) {
  dictionaries[lang] = { ...LANGUAGE_PACKS[lang].ui, ...LANGUAGE_PACKS[lang].notifications };
}

export type { TranslationKey, NotificationKey };

export type TranslateParams = Record<string, string | number>;

let currentLanguage: Language = DEFAULT_LANGUAGE;

export function getLanguage(): Language {
  return currentLanguage;
}

/** Bileşen dışı kod için: o anki dilde metin. Eksik anahtar Türkçe'ye, o da yoksa anahtara düşer. */
export function translate(key: TranslationKey | NotificationKey, params?: TranslateParams, language: Language = currentLanguage): string {
  let text = dictionaries[language][key] ?? dictionaries.tr[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

type I18nValue = {
  language: Language;
  t: (key: TranslationKey, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nValue>({
  language: DEFAULT_LANGUAGE,
  t: (key, params) => translate(key, params),
});

/**
 * Dili ağaca dağıtır. `language` değişince bağlam değeri değişir ve `useI18n`
 * kullanan her bileşen (memo'lu olanlar dahil) yeni dille yeniden çizilir.
 */
export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  // Modül değişkeni render sırasında güncellenir ki aynı render'da çağrılan
  // bileşen dışı yardımcılar (tarih adları vb.) da yeni dili görsün.
  currentLanguage = language;
  const value = useMemo<I18nValue>(
    () => ({ language, t: (key, params) => translate(key, params, language) }),
    [language]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
