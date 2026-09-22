// Bu dosya: hafızanın telefona yazılması ve telefondan geri okunması.
//
// Uygulama kapanınca hiçbir şey kaybolmasın diye alışkanlıklar, toplantılar,
// abonelikler, etiketler ve ayarlar telefonun yerel deposuna kaydedilir.
//
// İki iş yapar:
// 1) Açılışta her şeyi tek seferde okur ve çöp kutusunda süresi dolmuşları
//    temizler.
// 2) Ekranda bir şey değiştiği anda ilgili listeyi tekrar diske yazar.
//
// Neden "loaded" beklenir? Uygulama daha veriyi okumadan (listeler henüz
// boşken) diske yazmaya kalkarsa, kullanıcının gerçek verisinin üzerine boş
// liste yazılır ve her şey silinmiş gibi görünür.

import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { LEGACY_KEYS, readJSON, removeKey, StorageKeys, writeJSON } from "./storage";
import { Habit, HabitCompletion, HabitSettings, HabitTag, Meeting, Subscription } from "../types/habit";
import { purgeExpiredTrash } from "./trash";

// Kullanıcı hiç ayar yapmamışsa geçerli olan başlangıç ayarları.
export const DEFAULT_SETTINGS: HabitSettings = {
  incompleteFirst: false,
};

// Diskten okunup temizlendikten sonra uygulamaya verilen veri paketi.
export type PersistedStoreData = {
  habits: Habit[];
  completions: HabitCompletion[];
  meetings: Meeting[];
  subscriptions: Subscription[];
  settings: HabitSettings;
  customTags: HabitTag[];
};

// Uygulama açılışında tüm veriyi AsyncStorage'dan tek seferde okur.
export function useLoadPersistedStore(apply: (data: PersistedStoreData) => void) {
  useEffect(() => {
    (async () => {
      const [h, c, s, ct, m, subs] = await Promise.all([
        readJSON<Habit[]>(StorageKeys.habits, []),
        readJSON<HabitCompletion[]>(StorageKeys.completions, []),
        readJSON<HabitSettings>(StorageKeys.habitSettings, DEFAULT_SETTINGS),
        readJSON<HabitTag[]>(StorageKeys.customTags, []),
        readJSON<Meeting[]>(StorageKeys.meetings, []),
        readJSON<Subscription[]>(StorageKeys.subscriptions, []),
      ]);

      // Kaldırılmış özelliklerden kalan veri telefonda durmasın diye tek
      // seferlik temizlik. Okunmadığı için sonucu beklenmez.
      LEGACY_KEYS.forEach(removeKey);

      // Çöp kutusunda saklama süresini (7 gün) aşmış her şey artık kalıcı
      // olarak gitmiştir — depolamayı sonsuza dek büyütmemek için açılışta
      // tek seferde temizlenir.
      const purged = purgeExpiredTrash({ habits: h, completions: c });

      apply({
        habits: purged.habits,
        completions: purged.completions,
        meetings: m,
        subscriptions: subs,
        settings: s,
        customTags: ct,
      });
    })();
  }, []);
}

// Her state değiştiğinde ilgili anahtarı diske yazar. `loaded` koruması,
// ilk yükleme tamamlanmadan (state'ler boş/varsayılan haldeyken) diske
// yanlışlıkla boş veri yazılmasını engeller.
const COMPLETIONS_WRITE_DELAY_MS = 400;

export function usePersistStoreChanges(state: PersistedStoreData & { loaded: boolean }) {
  const { habits, completions, meetings, subscriptions, settings, customTags, loaded } = state;

  useEffect(() => {
    if (loaded) writeJSON(StorageKeys.habits, habits);
  }, [habits, loaded]);

  // Tamamlamalar en sık değişen ve en büyük liste: art arda tiklerde her
  // seferinde tüm listeyi yazmak yerine kısa bir bekleme sonrası tek sefer
  // yazılır. Uygulama arka plana geçerken bekleyen yazma hemen yapılır.
  const pendingCompletions = useRef<HabitCompletion[] | null>(null);
  const completionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushCompletions = useCallback(() => {
    if (completionsTimer.current) clearTimeout(completionsTimer.current);
    completionsTimer.current = null;
    const pending = pendingCompletions.current;
    pendingCompletions.current = null;
    if (pending) writeJSON(StorageKeys.completions, pending);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    pendingCompletions.current = completions;
    if (completionsTimer.current) clearTimeout(completionsTimer.current);
    completionsTimer.current = setTimeout(flushCompletions, COMPLETIONS_WRITE_DELAY_MS);
  }, [completions, loaded, flushCompletions]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") flushCompletions();
    });
    return () => {
      sub.remove();
      flushCompletions();
    };
  }, [flushCompletions]);

  useEffect(() => {
    if (loaded) writeJSON(StorageKeys.meetings, meetings);
  }, [meetings, loaded]);

  useEffect(() => {
    if (loaded) writeJSON(StorageKeys.subscriptions, subscriptions);
  }, [subscriptions, loaded]);

  useEffect(() => {
    if (loaded) writeJSON(StorageKeys.habitSettings, settings);
  }, [settings, loaded]);

  useEffect(() => {
    if (loaded) writeJSON(StorageKeys.customTags, customTags);
  }, [customTags, loaded]);
}
