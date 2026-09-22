// Bu dosya: uygulamanın hafızasının "sözleşmesi".
//
// Ekranlar veriye ve işlemlere useHabitStore() ile ulaşır. Burada yazan liste,
// bir ekranın elde edebileceği HER ŞEYİ gösterir: hangi veriler okunabilir
// (alışkanlıklar, toplantılar, abonelikler, etiketler, ayarlar) ve hangi işlemler
// yapılabilir (ekle, güncelle, sil, geri al, arşivle, işaretle...).
//
// Burada gerçek kod yoktur, sadece tanımlar vardır. İşleri asıl yapan dosyalar
// habitActions / meetingActions / subscriptionActions / tagActions'tır.

import { Habit, HabitCompletion, HabitSettings, HabitTag, Meeting, Subscription } from "../types/habit";

// Yeni bir alışkanlık oluştururken kullanıcıdan gelen alanlar. Buradaki
// çıkarılan alanları (id, oluşturma tarihi, sıra, bildirim id'leri...) kullanıcı
// değil, uygulamanın kendisi doldurur.
export type NewHabitInput = Omit<
  Habit,
  "id" | "createdAt" | "archived" | "order" | "notificationIds" | "deletedAt"
>;

// Yeni bir toplantı oluştururken kullanıcıdan gelen alanlar.
export type NewMeetingInput = Omit<Meeting, "id" | "createdAt" | "notificationId">;

// Yeni bir abonelik oluştururken kullanıcıdan gelen alanlar.
export type NewSubscriptionInput = Omit<
  Subscription,
  "id" | "createdAt" | "notificationId" | "notificationForDate"
>;

// Uygulamanın tüm ekranlarının useHabitStore() ile eriştiği tek merkezi
// state ve aksiyon kümesi. UI bileşenleri asla AsyncStorage'a veya
// notifications.ts'e doğrudan dokunmaz — hepsi buradan geçer.
export type HabitStoreValue = {
  habits: Habit[]; // sadece aktif (silinmemiş) alışkanlıklar; arşivlenmişler dahildir
  trashedHabits: Habit[];
  archivedHabits: Habit[]; // arşivlenmiş ama silinmemiş alışkanlıklar
  completions: HabitCompletion[];
  meetings: Meeting[];
  subscriptions: Subscription[]; // en yakın yenilemeden en uzağa sıralı
  settings: HabitSettings;
  tags: HabitTag[]; // DEFAULT_TAGS + kullanıcının eklediği özel etiketler
  loaded: boolean;

  addCustomTag: (label: string, emoji: string) => HabitTag;
  deleteCustomTag: (id: string) => void;

  addHabit: (habit: NewHabitInput) => Habit;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;
  permanentlyDeleteHabit: (id: string) => void;
  reorderHabit: (id: string, direction: "up" | "down") => void;

  isCompletedOn: (habitId: string, date: string) => boolean;
  toggleCompletion: (habitId: string, date: string, amount?: number) => void;

  addMeeting: (meeting: NewMeetingInput) => Meeting;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;

  addSubscription: (subscription: NewSubscriptionInput) => Subscription;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  updateSettings: (patch: Partial<HabitSettings>) => void;
};
