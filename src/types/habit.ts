// Uygulamanın tüm verisinin (alışkanlık, toplantı, abonelik, etiket, ayar)
// tip tanımları.
// Bu dosya "tek doğruluk kaynağı"dır: yeni bir alan eklemek istediğinde
// önce burayı güncelle, sonra habitStore.tsx ve ilgili ekranları düzenle.

export type RepeatCycle = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type HabitTag = {
  id: string;
  label: string;
  emoji: string;
  custom?: boolean; // kullanıcının eklediği etiketler silinebilir; hazır (default) etiketler silinemez
};

export type Habit = {
  id: string;
  title: string;
  color: string;
  icon?: string; // MaterialCommunityIcons adı (bkz. data/habitIcons.ts); yoksa etiketin ikonu gösterilir
  createdAt: string; // ISO tarih formatı

  hasTarget: boolean;
  targetAmount?: number;
  targetUnit?: string;

  repeatCycle: RepeatCycle;
  repeatEveryN?: number; // örn. "weekly" bir alışkanlıkta 3 = "3 haftada bir"; boş/1 = "her <döngü>"
  repeatDaysOfWeek?: number[]; // 0=Pazar..6=Cumartesi, sadece repeatCycle === "weekly" iken kullanılır
  repeatAnchorDate?: string; // "YYYY-MM-DD"; repeatEveryN sayımının başlangıç referans günü/haftası/ayı/yılı

  // Alışkanlığın aktif olduğu dönem. İkisi de isteğe bağlıdır ve TANIMSIZ
  // (undefined) olmaları "o yönde sınır yok" demektir — bu alanları hiç
  // görmemiş eski kayıtlar da bu sayede eskisi gibi, sınırsız çalışmaya
  // devam eder. Aralığın dışındaki günlerde alışkanlığın sırası gelmez.
  startDate?: string; // "YYYY-MM-DD"; bu günden önce alışkanlık aktif değildir
  endDate?: string; // "YYYY-MM-DD"; bu günden sonra alışkanlık aktif değildir

  hasReminderTime: boolean;
  reminderTime?: string; // "HH:mm"
  notificationIds?: string[]; // bu hatırlatıcıya bağlı, cihazda planlanmış bildirim id'leri

  tagId?: string;

  archived: boolean;
  order: number;
  deletedAt?: string; // ISO zaman damgası; silinince set edilir, geri alınca temizlenir, 7 gün sonra kalıcı silinir
};

// Kullanıcının "tamamlandı" işaretlediği her (habitId, tarih) çifti için bir kayıt.
export type HabitCompletion = {
  habitId: string;
  date: string; // "YYYY-MM-DD"
  amount?: number; // alışkanlığın bir hedefi varsa, o gün için kaydedilen ilerleme miktarı
};

export type HabitSettings = {
  incompleteFirst: boolean;
  /** Uygulama dili; eski kayıtlarda yoksa Türkçe kabul edilir. */
  language?: string;
};

// Alışkanlıktan tamamen ayrı bir varlık: belirli bir tarih ve saatte
// olan tek seferlik bir toplantı. Tekrar etmez, çöp kutusu yoktur (silinince
// doğrudan kalkar ve varsa bildirimi iptal edilir).
export type Meeting = {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm" — başlangıç saati
  hasReminder: boolean;
  reminderMinutesBefore?: number; // toplantıdan kaç dakika önce hatırlatılacak; 0 = tam saatinde
  notificationId?: string; // planlanan tek seferlik bildirimin id'si
  createdAt: string; // ISO tarih formatı
};

// Alışkanlık ve toplantıdan bağımsız üçüncü bir varlık: düzenli aralıklarla
// para çeken bir üyelik (Adobe, Claude, Spotify...).
//
// Kasıtlı olarak DAR tutulmuştur — bu bir gelir/gider takibi değildir. Ödeme
// geçmişi, kategori, bütçe, harcama grafiği YOKTUR ve eklenmemelidir; tek
// amacı "hangi aboneliğe ne kadar ödüyorum" sorusuna cevap vermektir.
//
// Bir sonraki yenileme tarihi SAKLANMAZ; `firstBillingDate` + `cycle`'dan
// hesaplanır (bkz. utils/subscription.ts). Saklansaydı, tarih geçtiği halde
// güncellenmemiş bir kayıt sessizce yanlış bilgi gösterirdi.
export type Subscription = {
  id: string;
  name: string;
  amount: number; // TL cinsinden; dolar üyelikler için kullanıcı TL karşılığını girer
  cycle: "monthly" | "yearly";
  firstBillingDate: string; // "YYYY-MM-DD" — ilk ödeme günü; sonraki yenilemeler bundan sayılır
  color: string;
  // Hazır servis seçildiyse onun simge anahtarı (bkz. data/subscriptions.ts).
  // Ad üzerinden eşleştirmek yerine ayrı saklanır: kullanıcı adı "Claude Pro"
  // diye değiştirdiğinde simgenin kaybolmaması gerekir.
  iconKey?: string;

  hasReminder: boolean;
  reminderDaysBefore?: number; // yenilemeden kaç gün önce hatırlatılacak; 0 = ödeme günü
  notificationId?: string;
  // Mevcut bildirimin hedeflediği yenileme günü. Açılışta "bildirim hâlâ doğru
  // güne mi kurulu" sorusunu, cihaza hiç dokunmadan cevaplamayı sağlar.
  notificationForDate?: string;

  createdAt: string; // ISO tarih formatı
};
