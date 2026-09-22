# Çeviri rehberi / Translation guide

PlanNow şu an **Türkçe** ve **İngilizce** destekler. Uygulamayı kendi dilinize çevirmek için aşağıdaki adımları izleyin.
PlanNow currently supports **Turkish** and **English**. Follow the steps below to translate the app into your language.

---

## 🇬🇧 English

### How the files are organised

```
src/languages/
  tr.ts                 ← Turkish UI strings (source of truth — every key is defined here)
  en.ts                 ← English UI strings
  notifications/
    tr.ts               ← Turkish notification texts
    en.ts               ← English notification texts
  index.tsx             ← language registry (one line per language)
```

- **UI strings** (buttons, titles, messages, month and weekday names) live in `tr.ts` / `en.ts`.
- **Notification texts** live separately in `notifications/`.
- Values may contain placeholders such as `{n}`, `{title}`, `{day}`, `{month}`. Keep them exactly as they are. You may move them to fit your grammar, e.g. `"{month} {day}"` or `"{day} {month}"`.
- Keys ending in `.one` / `.other` are singular / plural forms.

### Adding a language (example: German, `de`)

1. **Get the code:**
   ```bash
   git clone https://github.com/AtomyTR/plannow-habitapp.git
   cd plannow-habitapp
   npm install
   ```
2. **Copy the English files:**
   ```bash
   cp src/languages/en.ts src/languages/de.ts
   cp src/languages/notifications/en.ts src/languages/notifications/de.ts
   ```
3. **Rename the exports** in the new files:
   - `export const en` becomes `export const de`
   - `export const notificationsEn` becomes `export const notificationsDe`
4. **Translate every value.** Don't change the keys on the left.
5. **Register the language** in `src/languages/index.tsx`:
   ```ts
   import { de } from "./de";
   import { notificationsDe } from "./notifications/de";

   const LANGUAGE_PACKS = {
     tr: { name: "Türkçe", ui: tr, notifications: notificationsTr },
     en: { name: "English", ui: en, notifications: notificationsEn },
     de: { name: "Deutsch", ui: de, notifications: notificationsDe }, // ← new
   } ...
   ```
   `name` is the language's own name. It appears in the language menu (Profile → 🌐).
6. **Check it:**
   ```bash
   npx tsc --noEmit     # fails if any key is missing or misspelled
   npx expo start       # open the app, Profile → 🌐 → pick your language
   ```
   TypeScript won't compile until **every** key is translated, so a missing string can't slip through.

### Tips

- Translate meaning, not word for word. Keep texts short: buttons and chips have limited space.
- The tone is friendly and encouraging, never pushy. This matters most in the profile summary messages and notifications.
- Check long words on a small screen.
- Found a mistake in an existing translation? Fix it in the same file.

### License

Translations are part of the project and fall under the same [PolyForm Noncommercial 1.0.0](../../LICENSE) license: free for personal and educational use, no commercial use. For questions, reach out on X: [x.com/yigitakinkaya](https://x.com/yigitakinkaya)

---

## 🇹🇷 Türkçe

### Dosyaların düzeni

```
src/languages/
  tr.ts                 ← Türkçe arayüz yazıları (kaynak: bütün anahtarlar burada tanımlı)
  en.ts                 ← İngilizce arayüz yazıları
  notifications/
    tr.ts               ← Türkçe bildirim metinleri
    en.ts               ← İngilizce bildirim metinleri
  index.tsx             ← dil kaydı (her dil için bir satır)
```

- **Arayüz yazıları** (butonlar, başlıklar, mesajlar, ay ve gün adları) `tr.ts` / `en.ts` dosyalarında.
- **Bildirim metinleri** ayrı olarak `notifications/` klasöründe.
- Değerlerde `{n}`, `{title}`, `{day}`, `{month}` gibi yer tutucular olabilir. Bunları aynen koruyun. Dilinizin kurallarına göre yerlerini değiştirebilirsiniz, örneğin `"{month} {day}"` ya da `"{day} {month}"`.
- `.one` / `.other` ile biten anahtarlar tekil ve çoğul hâllerdir.

### Yeni dil ekleme (örnek: Almanca, `de`)

1. **Kodu indirin:**
   ```bash
   git clone https://github.com/AtomyTR/plannow-habitapp.git
   cd plannow-habitapp
   npm install
   ```
2. **İngilizce dosyaları kopyalayın:**
   ```bash
   cp src/languages/en.ts src/languages/de.ts
   cp src/languages/notifications/en.ts src/languages/notifications/de.ts
   ```
3. **Yeni dosyalardaki dışa aktarım adlarını değiştirin:**
   - `export const en` → `export const de`
   - `export const notificationsEn` → `export const notificationsDe`
4. **Bütün değerleri çevirin.** Soldaki anahtarlara dokunmayın.
5. **Dili kaydedin.** `src/languages/index.tsx` dosyasında `LANGUAGE_PACKS` listesine bir satır ekleyin (yukarıdaki İngilizce örnekteki gibi). `name`, dilin kendi dilindeki adıdır ve dil menüsünde (Profil → 🌐) görünür.
6. **Kontrol edin:**
   ```bash
   npx tsc --noEmit     # eksik ya da yanlış yazılmış anahtar varsa hata verir
   npx expo start       # uygulamada Profil → 🌐 → dilinizi seçin
   ```
   **Bütün** anahtarlar çevrilmeden TypeScript derlemeyi geçirmez. Bu yüzden eksik bir yazı gözden kaçamaz.

### İpuçları

- Kelimeyi değil anlamı çevirin. Metinleri kısa tutun, çünkü buton ve çiplerde yer sınırlı.
- Ton samimi ve cesaretlendirici olmalı, baskıcı değil. Bu özellikle profil özet mesajlarında ve bildirimlerde önemli.
- Uzun kelimeleri küçük ekranlı bir telefonda kontrol edin.
- Mevcut bir çeviride hata bulursanız aynı dosyada düzeltin.

### Lisans

Çeviriler projenin parçasıdır ve projeyle aynı [PolyForm Noncommercial 1.0.0](../../LICENSE) lisansına tabidir: kişisel ve eğitim amaçlı kullanım serbest, ticari kullanım yasak. Sorularınız için X üzerinden ulaşın: [x.com/yigitakinkaya](https://x.com/yigitakinkaya)
