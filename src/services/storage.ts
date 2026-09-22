import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage'ın etrafındaki ince bir sarmalayıcı (wrapper). Uygulamanın
// geri kalanı AsyncStorage'ı asla doğrudan import etmez; ileride depolama
// motorunu (örn. SQLite) değiştirmek istersek tek değişecek yer burası olur.

// Diske en son yazılan / diskten okunan ham metin, anahtar başına. writeJSON
// aynı içeriği tekrar yazmaya kalkarsa (örn. açılışta yükleme biter bitmez
// kalıcılık effect'leri az önce okunan veriyi geri yazar) disk işi atlanır.
const lastRaw = new Map<string, string | null>();

// Aynı tick içinde gelen readJSON çağrıları tek bir multiGet'te toplanır:
// açılıştaki 6-7 ayrı getItem yerine native tarafa tek gidiş-dönüş.
let pendingReads: Map<string, ((raw: string | null) => void)[]> | null = null;

function readRaw(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!pendingReads) {
      const batch = new Map<string, ((raw: string | null) => void)[]>();
      pendingReads = batch;
      Promise.resolve().then(async () => {
        pendingReads = null;
        const keys = [...batch.keys()];
        let pairs: readonly (readonly [string, string | null])[] = [];
        try {
          pairs = await AsyncStorage.multiGet(keys);
        } catch {
          // Okunamayan anahtar null kabul edilir (readJSON fallback'e düşer).
        }
        const byKey = new Map(pairs.map(([k, v]) => [k, v] as const));
        for (const [k, resolvers] of batch) {
          const raw = byKey.get(k) ?? null;
          lastRaw.set(k, raw);
          resolvers.forEach((r) => r(raw));
        }
      });
    }
    const list = pendingReads.get(key) ?? [];
    list.push(resolve);
    pendingReads.set(key, list);
  });
}

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await readRaw(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Aynı anahtara yazmalar sıraya alınır: art arda iki yazma yarışıp eski
// değerin yenisinin üstüne yazılması engellenir.
const writeQueue = new Map<string, Promise<void>>();

export function writeJSON<T>(key: string, value: T): Promise<void> {
  const raw = JSON.stringify(value);
  if (lastRaw.get(key) === raw) return writeQueue.get(key) ?? Promise.resolve();
  lastRaw.set(key, raw);
  const next = (writeQueue.get(key) ?? Promise.resolve())
    .then(() => AsyncStorage.setItem(key, raw))
    .catch((error) => {
      lastRaw.delete(key);
      console.error(`"${key}" yerel depoya kaydedilemedi`, error);
    });
  writeQueue.set(key, next);
  return next;
}

export async function removeKey(key: string): Promise<void> {
  try {
    lastRaw.delete(key);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`"${key}" yerel depodan silinemedi`, error);
  }
}

// Artık kullanılmayan, eski sürümlerden kalmış anahtarlar. Açılışta bir kez
// temizlenir ki telefonda uygulamanın hiçbir yerinde okunmayan veri
// birikmesin. Bir özellik kaldırıldığında anahtarı buraya eklenmeli.
export const LEGACY_KEYS = [
  "beman.tasks", // görevler özelliği kaldırıldı
] as const;

// Tüm AsyncStorage anahtarları tek yerde toplanır; farklı dosyalarda
// birbirinden habersiz string sabitler yazılmasını (ve çakışmasını) önler.
export const StorageKeys = {
  themeMode: "beman.preferences.themeMode",
  habits: "beman.habits",
  completions: "beman.completions",
  habitSettings: "beman.preferences.habitSettings",
  customTags: "beman.customTags",
  meetings: "beman.meetings",
  subscriptions: "beman.subscriptions",
} as const;
