// Saatin iki farklı gösterimi arasındaki küçük çeviriciler.
//
// Ekranda saat bir tarih (Date) nesnesiyle seçilir, ama kayıtta "07:30" gibi
// düz bir metin olarak saklanır. Aşağıdaki iki fonksiyon bu ikisi arasında
// gidip gelir.

// Date -> "07:30"
export function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// "07:30" -> bugünün tarihinde, saati 07:30'a ayarlanmış bir Date
export function parseTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
