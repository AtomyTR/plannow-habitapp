// Bu dosya: uygulamanın hafızası.
//
// Alışkanlıklar, toplantılar, abonelikler, etiketler, tamamlama işaretleri
// ve ayarlar burada tutulur; telefona kaydedilir ve uygulama açıldığında geri
// okunur. Bütün ekranlar veriye buradan ulaşır: `useHabitStore()`.
//
// Bu dosya işleri kendisi yapmaz, PARÇALARI BİR ARAYA GETİRİR. Asıl işi yapan
// dosyalar:
//   habitStoreTypes.ts        — ekranlara sunulan verilerin ve işlemlerin listesi
//   habitStorePersistence.ts  — telefona yazma / telefondan okuma
//   trash.ts                  — çöp kutusu (7 gün) kuralları
//   habitActions.ts           — alışkanlık ekle/düzenle/sil/arşivle
//   completionActions.ts      — "bugün yaptım" işareti
//   meetingActions.ts         — toplantı işlemleri
//   subscriptionActions.ts    — abonelik işlemleri
//   subscriptionRenewalSync.ts — abonelik bildiriminin sonraki yenilemeye taşınması
//   tagActions.ts             — etiket işlemleri
//   habitReminderScheduler.ts — alışkanlık hatırlatmalarının telefonla senkronu
//   reminderPeriodSync.ts     — dönemi geçen/gelen alışkanlıkların bildirim düzeltmesi
//   streakMilestoneScheduler.ts — seri kutlaması bildirimleri
//   habitFollowUps.ts         — tamamlanmayan alışkanlık için "tamamladınız mı?" takibi
//
// Sık sorulanlar:
// - Bir alışkanlık silindiğinde ne olur? Önce çöp kutusuna gider (7 gün),
//   sonra tamamen silinir.
// - Ekranlar hangi listeyi görür? Sadece aktif (silinmemiş) olanları; çöp
//   kutusu ve arşiv ayrı listeler olarak sunulur.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Habit, HabitCompletion, HabitSettings, HabitTag, Meeting, Subscription } from "../types/habit";
import { toDateKey } from "../utils/date";
import { DEFAULT_TAGS } from "../data/tags";
import { HabitStoreValue } from "./habitStoreTypes";
import {
  DEFAULT_SETTINGS,
  useLoadPersistedStore,
  usePersistStoreChanges,
} from "./habitStorePersistence";
import { useHabitReminderScheduler } from "./notifications/habitReminderScheduler";
import { useReminderPeriodSync } from "./notifications/reminderPeriodSync";
import { useStreakMilestoneScheduler } from "./notifications/streakMilestoneScheduler";
import { useHabitFollowUpSync } from "./notifications/habitFollowUps";
import { cancelHabitReminder, ensureAndroidChannel, isWithinPeriod, scheduleHabitReminder } from "./notifications";
import { hasNotificationPermission } from "./notifications/runtime";
import { resolveLanguage } from "../languages";
import { useHabitActions } from "./actions/habitActions";
import { useCompletionActions } from "./actions/completionActions";
import { useMeetingActions } from "./actions/meetingActions";
import { useSubscriptionActions } from "./actions/subscriptionActions";
import { useSubscriptionRenewalSync } from "./notifications/subscriptionRenewalSync";
import { sortByNextRenewal } from "../utils/subscription";
import { useTagActions } from "./actions/tagActions";

const HabitStoreContext = createContext<HabitStoreValue | undefined>(undefined);

export function HabitStoreProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [settings, setSettings] = useState<HabitSettings>(DEFAULT_SETTINGS);
  const [customTags, setCustomTags] = useState<HabitTag[]>([]);
  const [loaded, setLoaded] = useState(false);

  // `habits` state'inin her zaman güncel bir aynası; aşağıdaki her setHabits
  // çağrısıyla eş zamanlı (senkron) güncellenir. Buradan okumak (React'in
  // `habits` closure'ından ya da bir setState updater'ının çalışma zamanına
  // güvenmek yerine) addHabit/updateHabit/deleteHabit'in art arda, "bayat
  // veri" yarışına (race condition) girmeden çağrılabilmesini sağlar —
  // her biri her zaman en son commit edilmiş alışkanlığı görür.
  const habitsRef = useRef<Habit[]>([]);
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // `completions` state'inin senkron aynası — `habitsRef` ile aynı gerekçe.
  // Bir tamamlama işaretlendiğinde serinin yeni değerini HEMEN, React state'i
  // commit etmeden hesaplamak gerekir; aksi halde kilometre taşı kararı bir
  // render geriden gelen bayat listeye bakardı.
  const completionsRef = useRef<HabitCompletion[]>([]);

  // Toplantıların senkron aynası — yine aynı gerekçe.
  const meetingsRef = useRef<Meeting[]>([]);
  useEffect(() => {
    meetingsRef.current = meetings;
  }, [meetings]);

  // Aboneliklerin senkron aynası — yine aynı gerekçe.
  const subscriptionsRef = useRef<Subscription[]>([]);
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  }, [subscriptions]);

  // --- Bildirim senkronizasyonu (yarış koruması) ---
  const reminders = useHabitReminderScheduler(setHabits);
  const milestones = useStreakMilestoneScheduler(habitsRef);

  // Dönemi geçmiş alışkanlıkların bildirimlerini açılışta susturur, dönemi
  // başlamış olanlarınkini kurar. Bkz. reminderPeriodSync.ts.
  useReminderPeriodSync(habits, loaded, reminders);


  // --- Aksiyonlar ---
  const habitActions = useHabitActions({
    habitsRef,
    setHabits,
    completionsRef,
    setCompletions,
    reminders,
    milestones,
  });

  const completionActions = useCompletionActions({
    completions,
    completionsRef,
    setCompletions,
    milestones,
  });

  // Tamamlanmayan alışkanlık için hatırlatmadan 30/60/90 dk sonra takip.
  useHabitFollowUpSync(habits, completionActions.isCompletedOn, loaded, resolveLanguage(settings.language));

  const { resyncMeeting, ...meetingActions } = useMeetingActions({ meetingsRef, setMeetings });
  const { resyncSubscription, ...subscriptionActions } = useSubscriptionActions({
    subscriptionsRef,
    setSubscriptions,
  });

  // Yenileme günü geçmiş aboneliklerin bildirimini bir sonraki yenilemeye
  // taşır. Bkz. subscriptionRenewalSync.ts.
  useSubscriptionRenewalSync(subscriptions, loaded, resyncSubscription);
  const tagActions = useTagActions({ setCustomTags, habitsRef, setHabits });

  const updateSettings: HabitStoreValue["updateSettings"] = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  // --- Diskten yükleme / diske yazma ---

  // Açılışta okunan veri hem senkron aynalara hem de React state'ine yazılır;
  // ikisi baştan aynı olmazsa ilk işlem bayat (boş) listeyle çalışırdı.
  useLoadPersistedStore((data) => {
    habitsRef.current = data.habits;
    setHabits(data.habits);
    completionsRef.current = data.completions;
    setCompletions(data.completions);
    meetingsRef.current = data.meetings;
    setMeetings(data.meetings);
    subscriptionsRef.current = data.subscriptions;
    setSubscriptions(data.subscriptions);
    setSettings(data.settings);
    setCustomTags(data.customTags);
    setLoaded(true);
  });

  usePersistStoreChanges({ habits, completions, meetings, subscriptions, settings, customTags, loaded });

  // Dil değişince cihazda bekleyen bildirimler yeni dilde yeniden kurulur;
  // metinleri kurulduğu anda sabitlenir. İlk yüklemede çalışmaz.
  const language = resolveLanguage(settings.language);
  const scheduledLanguageRef = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (scheduledLanguageRef.current === null || scheduledLanguageRef.current === language) {
      scheduledLanguageRef.current = language;
      return;
    }
    scheduledLanguageRef.current = language;
    // Yalnızca zaten kurulu bildirimler yenilenir; izin yoksa hiçbir şey
    // yapılmaz (dil seçmek izin penceresi açmamalı).
    hasNotificationPermission().then((granted) => {
      if (!granted) return;
      // Android kanal adı da yeni dile geçsin.
      ensureAndroidChannel().catch(() => {});
      for (const habit of habitsRef.current) {
        if (!habit.notificationIds?.length) continue;
        if (habit.deletedAt || habit.archived || !habit.hasReminderTime || !isWithinPeriod(habit)) continue;
        const generation = reminders.bumpGeneration(habit.id);
        cancelHabitReminder(habit.notificationIds)
          .then(() => scheduleHabitReminder(habit))
          .then((ids) => reminders.applyScheduleResult(habit.id, generation, ids))
          .catch((error) => console.error("Alışkanlık hatırlatıcısı yeniden planlanamadı", error));
      }
      meetingsRef.current.filter((m) => m.notificationId).forEach(resyncMeeting);
      subscriptionsRef.current.filter((s) => s.notificationId).forEach(resyncSubscription);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, loaded]);

  // --- Türetilmiş (derived) değerler ---
  const tags = useMemo(() => [...DEFAULT_TAGS, ...customTags], [customTags]);
  const activeHabits = useMemo(() => habits.filter((h) => !h.deletedAt), [habits]);
  const trashedHabits = useMemo(() => habits.filter((h) => h.deletedAt), [habits]);
  const archivedHabits = useMemo(
    () => habits.filter((h) => h.archived && !h.deletedAt),
    [habits]
  );
  // Yenilemesi en yakın olan üstte.
  const sortedSubscriptions = useMemo(() => sortByNextRenewal(subscriptions), [subscriptions]);

  // Kronolojik sıra: önce tarih, sonra saat.
  const sortedMeetings = useMemo(
    () => [...meetings].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))),
    [meetings]
  );

  const value = useMemo<HabitStoreValue>(
    () => ({
      habits: activeHabits,
      trashedHabits,
      archivedHabits,
      completions,
      meetings: sortedMeetings,
      subscriptions: sortedSubscriptions,
      settings,
      tags,
      loaded,
      ...tagActions,
      ...habitActions,
      ...completionActions,
      ...meetingActions,
      ...subscriptionActions,
      updateSettings,
    }),
    [activeHabits, trashedHabits, archivedHabits, completions, sortedMeetings, sortedSubscriptions, settings, tags, loaded]
  );

  return <HabitStoreContext.Provider value={value}>{children}</HabitStoreContext.Provider>;
}

export function useHabitStore() {
  const ctx = useContext(HabitStoreContext);
  if (!ctx) throw new Error("useHabitStore must be used within HabitStoreProvider");
  return ctx;
}

export { toDateKey };
