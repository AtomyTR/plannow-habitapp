// Bu dosya: seri kutlamaları.
//
// Kullanıcı bir alışkanlığı üst üste belirli sayıda gün tamamladığında
// ("7 gün oldu!") kutlama bildirimi gönderilir. Bu dosya o kutlamanın ne zaman
// gönderileceğine, ne zaman iptal edileceğine karar verir.
//
// Cevapladığı sorular:
// - Aynı kutlama iki kez gönderilir mi? Hayır — alışkanlık başına aynı anda
//   en fazla bir bekleyen kutlama tutulur.
// - Kullanıcı işareti geri alırsa? Seri düşer ve bekleyen kutlama iptal edilir;
//   kaçırılan gün için kullanıcıya hiçbir bildirim gitmez.
// - Alışkanlık silinir veya arşivlenirse? Kutlama da iptal edilir.

import React, { useRef } from "react";
import { Habit, HabitCompletion } from "../../types/habit";
import { cancelStreakMilestone, scheduleStreakMilestone } from ".";
import { buildCompletionIndex, currentStreak, isStreakMilestone } from "../../utils/gamification";

export type StreakMilestoneScheduler = {
  // Bekleyen kutlamayı iptal eder (silme / arşivleme / hatırlatıcı değişimi).
  dropPendingMilestone: (habitId: string) => void;
  // Bir tamamlama değiştikten sonra kutlamayı güncel seriyle hizalar.
  syncStreakMilestone: (habitId: string, nextCompletions: HabitCompletion[]) => void;
  // Alışkanlık kalıcı olarak silindiğinde, ona ait sayaç kaydını da temizler.
  forgetHabit: (habitId: string) => void;
};

export function useStreakMilestoneScheduler(
  habitsRef: React.MutableRefObject<Habit[]>
): StreakMilestoneScheduler {
  // Alışkanlık başına BEKLEYEN kilometre taşı bildirimi (id + hangi seri için).
  // Map'in anahtarının alışkanlık id'si olması ve yenisini planlamadan önce
  // eskisinin iptal edilmesi, "aynı anda alışkanlık başına en fazla bir kutlama"
  // kuralını yapısal olarak garanti eder — kutlamalar bir akışa dönüşemez.
  //
  // Bilerek DİSKE YAZILMIYOR ve Habit tipine bir alan eklenmiyor: bu bildirim
  // planlandıktan birkaç saniye sonra düşer, yani bir uygulama yeniden
  // başlatmasını asla atlatamaz. Kalıcı bir alan, %100 boş duran bir kolon ve
  // var olamayacak "sahipsiz bildirim" için bir temizleme yolu üretirdi.
  // Ayrıca `notificationIds`ten ayrı tutulması bir doğruluk gereği:
  // `applyScheduleResult` o diziyi komple ezer, dolayısıyla sadece başlığı
  // değiştiren bir düzenleme bekleyen bir kutlamayı sessizce düşürürdü.
  const milestoneNotificationRef = useRef<Map<string, { id: string; milestone: number }>>(new Map());

  // Kutlamalar için de, hatırlatıcılardaki ile aynı "kuşak" (generation) yarış
  // koruması: geç dönen bir planlama sonucu, arada iptal edilmiş bir kutlamayı
  // geri diriltemesin.
  const milestoneGenerationRef = useRef<Map<string, number>>(new Map());

  function bumpMilestoneGeneration(id: string) {
    const next = (milestoneGenerationRef.current.get(id) ?? 0) + 1;
    milestoneGenerationRef.current.set(id, next);
    return next;
  }

  // Bekleyen kutlamayı iptal eder ve devam eden planlamayı geçersiz kılar.
  // Alışkanlık silindiğinde, arşivlendiğinde veya hatırlatıcısı değiştiğinde
  // çağrılır; böylece artık geçerli olmayan bir kutlama cihazda kalmaz.
  function dropPendingMilestone(habitId: string) {
    bumpMilestoneGeneration(habitId);
    const pending = milestoneNotificationRef.current.get(habitId);
    if (!pending) return;
    milestoneNotificationRef.current.delete(habitId);
    cancelStreakMilestone(pending.id).catch((error) =>
      console.error("Kilometre taşı bildirimi iptal edilemedi", error)
    );
  }

  /**
   * Bir tamamlama değiştikten sonra, o alışkanlığın kutlama bildirimini güncel
   * seriyle hizalar.
   *
   * Kutlama GELECEK için önceden planlanmaz, seriye ULAŞILDIĞI anda planlanır:
   * yarınki serinin ne olacağı bugünden bilinemez (kullanıcının yarın
   * tamamlayıp tamamlamayacağına bağlıdır), dolayısıyla önceden planlanan her
   * kutlama bir gün kaçırıldığında gerçekleşmemiş bir başarıyı kutlar hale
   * gelirdi. Ulaşıldığı anda planlandığında gövdedeki sayı tanım gereği doğrudur.
   *
   * Seri hesabı saf bir fonksiyondur ve cihaza hiç dokunmaz; cihaz çağrısı
   * yalnızca sonuç gerçekten bir kilometre taşına eşit olduğunda (alışkanlık
   * başına ömür boyu en fazla üç kez) yapılır. İşaret kaldırıldığında seri
   * düşer ve bekleyen kutlama aynı yolla iptal edilir — kaçırılan gün yüzünden
   * kullanıcıya HİÇBİR bildirim gönderilmez.
   */
  function syncStreakMilestone(habitId: string, nextCompletions: HabitCompletion[]) {
    const habit = habitsRef.current.find((h) => h.id === habitId);
    if (!habit || habit.deletedAt || habit.archived) return;

    const index = buildCompletionIndex(nextCompletions.filter((c) => c.habitId === habitId));
    const streak = currentStreak(habit, index);

    // Aynı kilometre taşı için zaten bekleyen bir kutlama varsa hiçbir şey yapma
    // — tekrar planlamak aynı bildirimi ikinci kez göndermek olurdu.
    const pending = milestoneNotificationRef.current.get(habitId);
    if (pending && pending.milestone === streak) return;

    dropPendingMilestone(habitId);
    if (!isStreakMilestone(streak)) return;

    const generation = milestoneGenerationRef.current.get(habitId) ?? 0;
    scheduleStreakMilestone(habit, streak)
      .then((id) => {
        if (!id) return;
        if (milestoneGenerationRef.current.get(habitId) !== generation) {
          // Daha yeni bir işaret/düzenleme/silme geçersiz kıldı — bu id sahipsiz.
          cancelStreakMilestone(id).catch((error) =>
            console.error("Geçersiz kalmış kilometre taşı bildirimi iptal edilemedi", error)
          );
          return;
        }
        milestoneNotificationRef.current.set(habitId, { id, milestone: streak });
      })
      .catch((error) => console.error("Kilometre taşı bildirimi planlanamadı", error));
  }

  function forgetHabit(habitId: string) {
    milestoneGenerationRef.current.delete(habitId);
  }

  return { dropPendingMilestone, syncStreakMilestone, forgetHabit };
}
