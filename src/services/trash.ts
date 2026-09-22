// Bu dosya: çöp kutusunun kuralları.
//
// Kullanıcı bir alışkanlığı sildiğinde kayıt hemen yok olmaz;
// üzerine "silinme zamanı" (deletedAt) yazılır ve çöp kutusuna düşer.
// Kullanıcı 7 gün içinde fikrini değiştirip geri alabilir.
//
// 7 gün dolduktan sonra ne olur? Kayıt gerçekten ve geri dönüşsüz silinir.
// Bu temizlik uygulama her açıldığında tek seferde yapılır — aksi halde
// silinmiş veriler telefonda sonsuza dek birikirdi.

import { Habit, HabitCompletion } from "../types/habit";

// Çöp kutusunda kalma süresi: 7 gün.
const TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function isExpiredTrash(deletedAt: string | undefined) {
  if (!deletedAt) return false;
  return Date.now() - new Date(deletedAt).getTime() > TRASH_RETENTION_MS;
}

/**
 * Diskten okunan veriden, çöp kutusunda saklama süresini (7 gün) aşmış her
 * şeyi ayıklar ve temizlenmiş listeleri döner.
 *
 * Bir alışkanlık kalıcı olarak silindiğinde, o alışkanlığa ait tamamlama
 * kayıtları da silinir: sahibi olmayan tamamlama kayıtları hiçbir ekranda
 * görünmez, sadece yer kaplar.
 */
export function purgeExpiredTrash(input: {
  habits: Habit[];
  completions: HabitCompletion[];
}) {
  const purgedHabitIds = new Set(
    input.habits.filter((x) => isExpiredTrash(x.deletedAt)).map((x) => x.id)
  );

  return {
    habits: input.habits.filter((x) => !purgedHabitIds.has(x.id)),
    completions: input.completions.filter((x) => !purgedHabitIds.has(x.habitId)),
  };
}
