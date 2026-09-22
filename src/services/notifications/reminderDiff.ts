// Bu dosya: "bu düzenleme yüzünden telefondaki hatırlatmayı yeniden kurmam
// gerekiyor mu?" sorusunun cevabı.
//
// Bir alışkanlığın veya toplantının hatırlatması, telefonun işletim sistemine
// önceden kaydedilir. Kullanıcı kaydı her düzenlediğinde bu planı söküp
// yeniden kurmak hem gereksiz hem de risklidir (arada bildirim kaybolabilir).
// Bu yüzden, düzenlemeden önceki ve sonraki hali karşılaştırılır: sadece
// hatırlatmanın ne zaman çalacağını veya ne yazacağını etkileyen alanlar
// değiştiyse yeniden kurulur.
//
// Örnek: alışkanlığın sadece rengini değiştirmek hatırlatmaya dokunmaz;
// saatini değiştirmek dokunur.

import { Habit, Meeting, Subscription } from "../../types/habit";

// İki haftanın gün listesini (sırasından bağımsız olarak) karşılaştırır.
// [1,3] ile [3,1] aynı kabul edilir.
function sameDays(a: number[] | undefined, b: number[] | undefined) {
  const A = [...(a ?? [])].sort();
  const B = [...(b ?? [])].sort();
  return A.length === B.length && A.every((v, i) => v === B[i]);
}

// Cihazda planlanan bildirimi sadece bu alanlar gerçekten değiştirir.
// ("patch içinde bu anahtar var mıydı" yerine) değerleri karşılaştırmak,
// her kayıtta alışkanlığın tüm bildirim planını sökmekten kurtarır —
// örneğin sadece adını değiştirmek hatırlatıcılara dokunmamalı.
export function reminderScheduleChanged(before: Habit, after: Habit) {
  return (
    before.title !== after.title ||
    before.hasReminderTime !== after.hasReminderTime ||
    before.reminderTime !== after.reminderTime ||
    before.repeatCycle !== after.repeatCycle ||
    (before.repeatEveryN ?? 1) !== (after.repeatEveryN ?? 1) ||
    !sameDays(before.repeatDaysOfWeek, after.repeatDaysOfWeek)
  );
}

// Toplantı bildirimi sadece bu alanlar değişince yeniden planlanmalı. Saat/tarih
// tetikleyici anını, başlık ise bildirim içeriğini etkiler.
export function meetingReminderChanged(before: Meeting, after: Meeting) {
  return (
    before.title !== after.title ||
    before.date !== after.date ||
    before.time !== after.time ||
    before.hasReminder !== after.hasReminder ||
    (before.reminderMinutesBefore ?? 0) !== (after.reminderMinutesBefore ?? 0)
  );
}

// Abonelik bildirimi sadece bu alanlar değişince yeniden planlanmalı.
// Tutar da listede: bildirim gövdesinde tutar yazıyor, dolayısıyla fiyat
// değiştiğinde eski bildirim yanlış rakamı gösterirdi.
//
// `firstBillingDate` ve `cycle`, bir sonraki yenileme gününü belirledikleri
// için tetikleyici anını doğrudan değiştirirler.
export function subscriptionReminderChanged(before: Subscription, after: Subscription) {
  return (
    before.name !== after.name ||
    before.amount !== after.amount ||
    before.cycle !== after.cycle ||
    before.firstBillingDate !== after.firstBillingDate ||
    before.hasReminder !== after.hasReminder ||
    (before.reminderDaysBefore ?? 0) !== (after.reminderDaysBefore ?? 0)
  );
}
