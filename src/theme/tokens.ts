// Tasarım tokenlarının TEK kaynağı. Değerler `örnek tasarım/` klasöründeki
// HTML referanslarından (Bugun, Takvim, YeniAliskanlik, Profil) çıkarıldı.
// Başka bir yerde rastgele değer uydurma — ihtiyacın olursa bu dosyayı genişlet.
//
// HTML'deki 390px genişlik yalnızca iPhone referansıdır; ekranlar sabit piksel
// yerine Flex ile kurulur, buradaki sayılar yalnızca ölçek değerleridir.

// --- Renkler ---------------------------------------------------------------

export const lightColors = {
  background: "#F6F7FB", // sayfa zemini (üstüne BackgroundGlow tonları biner)
  surface: "#FFFFFF",
  surfaceMuted: "#F4F5FA", // input / tarih kutusu zemini
  segmented: "#F0F1F8", // segment kontrol ve kapat butonu zemini
  text: "#16172B",
  textSecondary: "#63667E",
  textMuted: "#A3A6B8", // #63667E'nin %60 opaklığa denk açık hâli
  border: "rgba(22,23,43,0.08)", // çip / kart ince kenarlığı
  divider: "rgba(22,23,43,0.07)",
  accent: "#5A66E0", // ana renk (seçili gün, birincil buton, FAB)
  accentSoft: "#EEF0FC", // seçili çip zemini
  accentAlt: "#7C5CFF", // ikincil nokta rengi
  success: "#34B37A",
  danger: "#D0553D",
  black: "#16172B",
  white: "#FFFFFF",
  toggleOff: "#DDDFEA",
  chartBar: "#C9CEFF", // Profil grafiğindeki pasif sütun
  streak: "#C2552B", // seri yazısı
  streakIcon: "#E07A3F", // seri alev ikonu
  dotOrange: "#F4A259", // gün şeridi / takvim noktaları
  dotViolet: "#7C5CFF",
  dotGreen: "#34B37A",
  // Yarı saydam yüzeyler (referanstaki rgba beyazlar)
  glass: "rgba(255,255,255,0.72)", // pasif gün hücresi, ikincil çip
  glassStrong: "rgba(255,255,255,0.86)", // alt gezinme çubuğu
  panel: "rgba(255,255,255,0.8)", // takvim / profil kartları, ayarlar butonu
  glassBorder: "rgba(22,23,43,0.06)",
} as const;

export const darkColors = {
  background: "#131320",
  surface: "#1D1D2C",
  surfaceMuted: "#242436",
  segmented: "#2A2A3E",
  text: "#F3F2FA",
  textSecondary: "#A3A3B8",
  textMuted: "#6D6D82",
  border: "rgba(255,255,255,0.10)",
  divider: "rgba(255,255,255,0.08)",
  accent: "#7B85E6",
  accentSoft: "#26294A",
  accentAlt: "#9575E8",
  success: "#4CBE7E",
  danger: "#E06A50",
  black: "#F3F2FA",
  white: "#131320",
  toggleOff: "#3A3A52",
  chartBar: "#3A3F7A",
  streak: "#F0906A",
  streakIcon: "#F0906A",
  dotOrange: "#F4A259",
  dotViolet: "#9575E8",
  dotGreen: "#4CBE7E",
  glass: "rgba(255,255,255,0.08)",
  glassStrong: "rgba(38,38,58,0.86)",
  panel: "rgba(38,38,58,0.8)",
  glassBorder: "rgba(255,255,255,0.10)",
} as const;

// Profil özet kartının gradienti (Profil.html: 135°, #7B85E6 → #5A66E0 %60 → #7E6BD8).
export const heroGradient = ["#7B85E6", "#5A66E0", "#7E6BD8"] as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

// Arka plan degradesinin tonları (Bugun.html ve diğerlerinde ortak):
// sol üstte açık mavi, sağ üstte lavanta, altta yumuşak mavi. Referans radyal
// gradient kullanıyor; expo-linear-gradient radyal desteklemediği için
// BackgroundGlow bunları üç doğrusal katmanla yaklaşık verir.
export const glowTones = {
  light: { topLeft: "#DCEDF8", topRight: "#E7E3F4", bottom: "#E3E8F5" },
  dark: { topLeft: "#1B3550", topRight: "#2A2660", bottom: "#23285A" },
} as const;

// Referanstaki altı pastel aile. Her aile: kart zemini (bg), ince kenarlık
// (border) ve buton / çip / ikon için koyu ton (strong). Kartlar, etiket
// çipleri ve istatistik kutuları hep bu ailelerden seçilir.
export type ToneKey = "mint" | "butter" | "sky" | "lavender" | "peach" | "rose";
export type Tone = { bg: string; border: string; strong: string };

export const tones: Record<ToneKey, Tone> = {
  mint: { bg: "#EAF6F0", border: "#D4EBDF", strong: "#2A7B54" },
  butter: { bg: "#FAF5E4", border: "#EFE2B8", strong: "#8A6516" },
  sky: { bg: "#EAF1FA", border: "#D3E2F3", strong: "#33629F" },
  lavender: { bg: "#F0ECFA", border: "#DED4F2", strong: "#6A4BB5" },
  peach: { bg: "#FBEEE7", border: "#F1D6C6", strong: "#A5542C" },
  rose: { bg: "#FAEBF1", border: "#F0D2DE", strong: "#A04066" },
};

// Koyu temada aynı ailelerin koyu karşılıkları (referansta koyu tema yok;
// aynı ton, düşük parlaklık).
export const darkTones: Record<ToneKey, Tone> = {
  mint: { bg: "#1F332B", border: "#2B4A3D", strong: "#6FD3A3" },
  butter: { bg: "#38321F", border: "#544A2A", strong: "#E5C36A" },
  sky: { bg: "#1F2D3F", border: "#2C425E", strong: "#7FB0EA" },
  lavender: { bg: "#2B2540", border: "#3F3560", strong: "#B39BEA" },
  peach: { bg: "#3A2A24", border: "#57403A", strong: "#EFA07C" },
  rose: { bg: "#3A2530", border: "#573545", strong: "#E88AAE" },
};

export const toneKeys = Object.keys(tones) as ToneKey[];

// Eski ad: bazı ekranlar hâlâ `pastel.*` okuyor; değerler yeni ailelerden gelir.
export const pastel = {
  rose: tones.rose.bg,
  roseStrong: tones.rose.strong,
  purple: tones.lavender.bg,
  purpleStrong: tones.lavender.strong,
  sage: tones.mint.bg,
  sageStrong: tones.mint.strong,
  blue: tones.sky.bg,
  blueStrong: tones.sky.strong,
  amber: tones.butter.bg,
  amberStrong: tones.butter.strong,
} as const;

// --- Boşluk ve köşe yarıçapı ----------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // ekran yan boşluğu ve bölümler arası boşluk
  xxl: 24,
  xxxl: 32,
} as const;

// Referanstaki köşe yarıçapları. Gerçek daireler (FAB, iki dokunma alanı)
// kendi kutusunun %50'si boyutlandırılır ve bu ölçeğin dışındadır.
export const radius = {
  xs: 8, // grafik sütunu
  sm: 12, // takvim hücresi, küçük ikon karosu (11-13)
  md: 14, // input, buton, segment
  lg: 18, // istatistik / plan satırı
  xl: 22, // ana kart, panel
  xxl: 24, // Profil özet kartı
  day: 16, // gün şeridi hücresi
  pill: 999, // çip, hap, gezinme çubuğu
} as const;

export const layout = {
  screenPadding: 20,
  sectionGap: 20,
  cardPadding: 16,
  iconTile: 40, // kart başlığındaki ikon karosu
  iconTileRadius: 13,
  touchTarget: 44, // ayarlar / düzenle butonu
  dayCellHeight: 64,
} as const;

// --- Tipografi -------------------------------------------------------------

// Referans Plus Jakarta Sans (500–800) kullanıyor. React Native'de özel
// fontlar her ağırlık için ayrı bir fontFamily ister; ağırlık, aile adında
// kodludur. Dosyalar assets/fonts altındadır, app/_layout.tsx yükler.
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

export const typography = {
  largeTitle: { fontSize: 24, fontFamily: fonts.extrabold, letterSpacing: -0.48 },
  sectionTitle: { fontSize: 22, fontFamily: fonts.extrabold, letterSpacing: -0.44 },
  title: { fontSize: 20, fontFamily: fonts.extrabold },
  subtitle: { fontSize: 17, fontFamily: fonts.bold },
  bodyStrong: { fontSize: 15, fontFamily: fonts.bold },
  body: { fontSize: 15, fontFamily: fonts.semibold },
  caption: { fontSize: 13, fontFamily: fonts.semibold },
  label: { fontSize: 12, fontFamily: fonts.bold },
  small: { fontSize: 12, fontFamily: fonts.semibold },
  micro: { fontSize: 11, fontFamily: fonts.bold },
} as const;

// --- Gölgeler --------------------------------------------------------------
//
// ÖNEMLİ: Android'de `elevation`, view'ın yarı saydam zemininin ARKASINDA
// dikdörtgen bir gölge çizer. Bu yüzden yarı saydam yüzeyler yalnızca iOS
// gölgesi (`glass*`) alır; `elevation` içerenler (`raised`, `primary`, `hero`)
// SADECE tam opak zeminli görünümlerde kullanılır.
// (CSS blur değeri, RN shadowRadius'un yaklaşık 2 katıdır.)

export const shadow = {
  // 0 8px 24px rgba(40,44,90,.06) — yarı saydam kart/panel
  card: { shadowColor: "#282C5A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12 },
  // aynısı, tam opak pastel kart için (Android elevation'lı)
  raised: {
    shadowColor: "#282C5A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  // 0 12px 28px rgba(90,102,224,.28) — FAB, Kaydet butonu, seçili gün
  primary: {
    shadowColor: "#5A66E0",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  // 0 12px 32px rgba(40,44,90,.10) — alt gezinme çubuğu (yarı saydam)
  nav: { shadowColor: "#282C5A", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 16 },
  // 0 16px 36px rgba(90,102,224,.22) — Profil özet kartı
  hero: {
    shadowColor: "#5A66E0",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;

// --- Yardımcılar -----------------------------------------------------------

// "#RRGGBB" rengini verilen saydamlıkla rgba() metnine çevirir.
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// "#RRGGBB" → renk tonu (hue, 0-360).
export function hexToHue(hex: string): number {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

// Bir alışkanlık rengini (kullanıcı seçer, serbest hex) altı pastel aileden
// en yakınına eşler. Yalnızca renk tonuna bakılır; hangi renk seçilirse
// seçilsin kart her zaman referanstaki paletin içinde kalır.
export function toneKeyForColor(hex: string): ToneKey {
  const h = hexToHue(hex);
  if (h >= 340 || h < 20) return "rose";
  if (h < 45) return "peach";
  if (h < 90) return "butter";
  if (h < 175) return "mint";
  if (h < 255) return "sky";
  return "lavender";
}

// Alışkanlık etiketi → pastel aile. Hazır etiketler formdaki (YeniAliskanlik)
// renkleriyle eşleşir; kullanıcının eklediği etiketler kimliğinden türetilir.
const TAG_TONE_BY_ID: Record<string, ToneKey> = {
  morning: "butter",
  noon: "peach",
  afternoon: "sky",
  evening: "lavender",
  sport: "mint",
  cleaning: "sky",
  food: "peach",
  "before-sleep": "lavender",
  "bad-habits": "rose",
};

export function toneKeyForTag(tagId: string): ToneKey {
  const known = TAG_TONE_BY_ID[tagId];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < tagId.length; i++) hash = (hash * 31 + tagId.charCodeAt(i)) % 997;
  return toneKeys[hash % toneKeys.length];
}

// Basma geri bildirimi için ortak yay. Aşırı sönümlü (damping, 2·√(stiffness·mass)
// = 40'a yakın) olduğundan HEDEFİ AŞMAZ: küçülür, bırakınca sıçramadan eski
// boyuna döner. Düşük damping (12-16) bırakınca zıplama yapıyordu.
export const PRESS_SPRING = { damping: 38, stiffness: 420, mass: 1 } as const;
