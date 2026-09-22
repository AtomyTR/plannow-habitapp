import { translate } from "../../languages";

export type SummaryMessageInput = {
  habitCount: number;
  completed: number;
  possible: number;
  rate: number;
  streak: number;
};

// Ham istatistikleri (tutarlılık oranı, seri uzunluğu) motive edici, cana yakın
// bir cümleye çevirir — Profil sekmesi bir
// "üyelik" ekranı değil, tamamen mevcut veriden türetilen bir başarı özetidir.
//
// KURAL: hiçbir varyant cezalandırıcı olamaz. Veride boşluk varsa bu bir
// suçlama değil, yeniden başlama daveti olarak yazılır.
export function buildMessage({ habitCount, completed, possible, rate, streak }: SummaryMessageInput): string {
  if (habitCount === 0) {
    return translate("profile.msg.noHabits");
  }
  if (possible === 0) {
    return translate("profile.msg.notDueYet");
  }
  if (rate >= 0.8) {
    return streak >= 3
      ? translate("profile.msg.highStreak", { streak })
      : translate("profile.msg.high");
  }
  if (rate >= 0.5) {
    return streak >= 3
      ? translate("profile.msg.midStreak", { completed, streak })
      : translate("profile.msg.mid", { completed });
  }
  if (completed > 0) {
    return translate("profile.msg.some", { completed });
  }
  return translate("profile.msg.restart");
}
