# 🚀 Brain Spark – AI Prompt Pack (v4)

Bu prompt seti AI ile production seviyesinde Sudoku oyunu geliştirmek için hazırlanmıştır.

**Global Kurallar (her prompt için geçerli):**
- Clean architecture
- Zustand state management (global), React Context (UI prefs)
- 60 FPS hedefi, input latency < 16ms
- Her prompt sonunda birim testi yazılmalı (Vitest + @testing-library/react)
- Capacitor plugin'leri mock'lanmalı (vi.mock ile)
- Production-ready code

---

## PROMPT 0 – Navigasyon ve App Lifecycle

**Hedef:** Ekranlar arası geçiş altyapısını ve uygulama yaşam döngüsü yönetimini kurmak.

> Sen kıdemli bir React/Capacitor geliştiricisisin. Brain Spark projesinin navigasyon ve lifecycle altyapısını oluştur.
>
> **Navigasyon:**
> 1. `react-router-dom` v6 ile `HashRouter` kur (Capacitor uyumluluğu için).
> 2. Şu rotaları tanımla:
>    - `/` → Ana Ekran
>    - `/levels` → Seviyeler
>    - `/chapters/:difficulty` → Bölümler
>    - `/game/:difficulty/:chapter` → Oyun Ekranı
>    - `/settings` → Ayarlar
>    - `/how-to-play` → Tutorial
>    - `/daily` → Daily Challenge
> 3. `framer-motion` ile ekran geçişlerinde slide animasyonu uygula: sağdan sola giriş, sola doğru çıkış, 250ms ease-out.
>
> **App Lifecycle (`useAppLifecycle` hook):**
> 4. `@capacitor/app` ile `appStateChange` dinle:
>    - `isActive: false` → Zustand store'dan `grid`, `notes`, `lives`, `elapsedTime` oku, `Capacitor Preferences`'a kaydet.
>    - `isActive: true` → Oyun ekranındaysa kayıtlı state'i yükle, duraklatma overlay'i göster.
> 5. `backButton` eventi:
>    - `/game/*` → "Oyunu bırakmak istiyor musunuz?" modalı. Evet → kaydet + `/` rotasına git.
>    - Diğer rotalar → `navigate(-1)`.
>    - `/` → `App.exitApp()`.
> 6. Hook'u `useAppLifecycle` adıyla export et; listener'ları component unmount'ta temizle.
>
> **Test:** `useAppLifecycle` hook'u için Vitest ile `@capacitor/app` mock'lu unit test yaz.

---

## PROMPT 1 – Zustand Store Architecture

**Hedef:** Tüm oyun state'ini yönetecek, hücre bazlı subscription destekli Zustand store'u kurmak.

> Global Zustand store'u oluştur.
>
> **State alanları:**
> - `grid` (81 elemanlı sayı array'i)
> - `notes` (81 elemanlı array, her eleman Set<number>)
> - `lives` (başlangıç: 3)
> - `mistakes`
> - `hintsUsed`
> - `elapsedTime`
> - `stars`
> - `streak`
> - `completedLevels`
> - `adsDisabled` (IAP doğrulamasından set edilir)
>
> **PERFORMANS ZORUNLULUĞU:**
> - Her hücre yalnızca kendi değerine subscribe olmalı:
>   ```js
>   useGameStore(state => state.grid[cellIndex])
>   ```
> - Parent component tüm `grid`'e subscribe olmamalı.
> - Cell component `React.memo` ile sarılmalı.
> - Tek hücre güncellemesi yalnızca o hücreyi render etmeli.
> - Input latency hedefi: **< 16ms**
>
> **Actions:**
> - `placeNumber(cellIndex, value)` → sayıyı grid'e yaz; ardından **state'i asenkron olarak arka planda kaydet** (Zustand persist middleware'in `getState()` + storage adapter `setItem()` doğrudan çağrılabilir). `await` ile bekleme — oyun akışını bloklamasın. Bu, olası bir uygulama çökmesinde oyuncunun en fazla 1 hamle kaybetmesini garantiler.
> - `removeNumber(cellIndex)`
> - `toggleNote(cellIndex, value)`
> - `decreaseLives()`
> - `setAdsDisabled(value: boolean)`
> - `resetGame(puzzleData)`
>
> **Persist Middleware:**
> - Manuel `saveState()` / `loadState()` yazma. Bunun yerine Zustand'ın `persist` middleware'ini kullan:
>   ```js
>   import { persist, createJSONStorage } from 'zustand/middleware'
>   ```
> - Storage olarak `Capacitor Preferences`'ı wrap eden custom storage adapter yaz (`getItem` / `setItem` / `removeItem` async olmalı).
> - Persist edilecek alanlar: `completedLevels`, `streak`, `adsDisabled`, `saved_state` (grid, notes, lives, elapsedTime). `highlights` ve geçici UI state'i persist edilmemeli.
> - `partialize` ile yalnızca kalıcı alanları filtrele; geçici state persist dışında tutulsun.
>
> **Test:** `placeNumber`, `decreaseLives`, `toggleNote` için Vitest unit testleri yaz. Capacitor Preferences storage adapter'ını mock'la.

---

## PROMPT 2 – PuzzleEngine Abstraction

**Hedef:** Gelecekteki puzzle türlerine genişleyebilecek interface ve SudokuEngine implementasyonunu yazmak.

> Aşağıdaki TypeScript interface'i oluştur:
>
> ```ts
> interface PuzzleEngine {
>   loadPuzzle(data: PuzzleData): void
>   validateMove(cellIndex: number, value: number): boolean
>   checkCompletion(): boolean
>   getHint(cellIndex: number): number
> }
> ```
>
> Bu interface'i implement eden `SudokuEngine` sınıfını yaz:
> - `validateMove`: Satır, sütun ve 3x3 blok kuralını kontrol eder.
> - `checkCompletion`: Tüm hücreler dolu ve çakışma yok ise `true`. Hedef: **< 2ms**.
> - `getHint`: Seçili hücre için `solutionBoard`'dan doğru değeri döner.
> - `loadPuzzle`: `initialBoard` ve `solutionBoard`'u engine'e yükler.
>
> `useSudokuEngine` hook'u `SudokuEngine` instance'ını kullanmalı — engine tipi değiştiğinde hook kodu değişmemeli.
>
> **Test:** `validateMove` ve `checkCompletion` için Vitest unit testleri yaz. Completion check'in 2ms altında çalıştığını assert et.

---

## PROMPT 3 – Sudoku Engine Hook

**Hedef:** Oyun mekaniklerinin tamamını kapsayan `useSudokuEngine` hook'unu yazmak.

> `useSudokuEngine` hook'unu yaz. Tüm fonksiyonlar `SudokuEngine` üzerinden çalışmalı.
>
> **Fonksiyonlar:**
> - `placeNumber(cellIndex, value)` → validate et, Zustand'a yaz, conflict highlight tetikle
> - `removeNumber(cellIndex)`
> - `togglePencilMode()`
> - `getHint(cellIndex)` → `hintsUsed` artır, hücreye değeri yaz
> - `checkCompletion()` → true ise star hesapla, completion animasyonu tetikle
> - `calculateStars()` → aşağıdaki tabloya göre:
>
>   | Yıldız | Kolay | Orta | Zor |
>   |---|---|---|---|
>   | 3 | 0 hata, < 3dk | 0 hata, < 8dk | 0 hata, < 15dk |
>   | 2 | ≤2 hata veya süre aşımı | aynı | aynı |
>   | 1 | Tamamlandı | aynı | aynı |
>
> **Conflict Highlight:**
> - Seçili sayı ile aynı değerdeki tüm hücreler highlight edilir.
> - Çakışan hücre: kırmızı pulse animasyonu (Framer Motion).
> - Highlight update hedefi: **< 8ms**
>
> **Auto Candidate Clean:**
> - Doğru sayı yerleştirildiğinde aynı satır, sütun ve bloktan o aday notu sil.
> - Silme işlemi tek Zustand action'ında batch olarak gerçekleşmeli (birden fazla re-render önlenir).
>
> **Test:** `placeNumber` sonrası conflict detection, auto candidate clean ve star calculation için Vitest testleri yaz.

---

## PROMPT 4 – Advanced Sudoku UX

**Hedef:** Zengin kullanıcı deneyimi özelliklerini eklemek.

> Aşağıdaki UX özelliklerini implement et. Her güncelleme < 8ms içinde tamamlanmalı.
>
> 1. **Same Number Highlight:** Seçili sayıyla aynı değerdeki hücreler soft highlight alır.
> 2. **Row / Column / Block Highlight:** Seçili hücrenin satırı, sütunu ve bloğu hafif arka plan rengi alır.
> 3. **Remaining Number Counter:** Klavyede her sayının kaç kez daha kullanılabileceğini göster (9 - boarddaki kullanım sayısı). 9 kez tamamlanan sayı klavyede pasif görünür.
> 4. **Error Highlight Toggle:** Ayarlar'dan açılıp kapatılabilir. Açıkken yanlış hücreler kırmızı gösterilir.
> 5. **Input Feedback:** Doğru girişte yeşil flash, yanlış girişte kırmızı shake animasyonu (Framer Motion).
>
> **Test:** Remaining number counter hesabı ve error highlight toggle için Vitest testleri yaz.

---

## PROMPT 5 – Bulmaca Validator ve 90 Bulmaca Üretimi

**Hedef:** Doğrulanmış 90 bulmacayı içeren veri setini tamamlamak.

> **Adım 1 — Validator (`scripts/validatePuzzles.js`):**
> 1. `initialBoard` ve `solutionBoard` alarak şunları kontrol eden fonksiyon yaz:
>    - 9 satır, 9 sütun ve 9 blokta 1–9 tekrarsız mı?
>    - `initialBoard`'daki dolu hücreler `solutionBoard` ile uyuşuyor mu?
>    - `initialBoard`'ın **tek ve benzersiz** çözümü var mı? (backtracking ile)
> 2. `node scripts/validatePuzzles.js` ile çalıştırılabilir olmalı.
> 3. Hatalı bulmacaları ID ile raporlasın; tüm bulmacalar geçerse "✅ All 90 puzzles valid" yazdırsın.
>
> **Adım 2 — 90 Bulmaca Üretimi:**
> 1. Kolay (30): Açık hücre 45–50, Naked/Hidden Single yeterli, tek çözümlü.
> 2. Orta (30): Açık hücre 30–35, Naked/Hidden Single + Pair, tek çözümlü.
> 3. Zor (30): Açık hücre 22–27, X-Wing/Swordfish gerektiren, tek çözümlü.
> 4. Her bulmacayı ürettikten sonra validator'dan geçir; geçemeyen veri setine eklenmesin.
> 5. Sonuçları `constants/puzzles.json`'a yaz. Format:
>    ```json
>    { "id": "easy_001", "difficulty": "easy", "initialBoard": [...], "solutionBoard": [...] }
>    ```

---

## PROMPT 6 – AdManager Sistemi

**Hedef:** Smart Interstitial kuralları ve IAP entegrasyonlu reklam yönetimini kurmak.

> `AdManager.js` servisini ve IAP entegrasyonunu oluştur.
>
> **Reklam türleri:** Banner, Interstitial, Rewarded
>
> **Ad Pooling:**
> - Uygulama açılışında 1 Interstitial + 1 Rewarded arka planda yükle.
> - Gösterim sonrası anında yenisini yükle.
>
> **SMART INTERSTITIAL KURALI:**
> - Yalnızca bölüm tamamlandığında tetiklenir.
> - Son interstitial'dan bu yana **en az 180 saniye** geçmiş olmalı.
> - Session başına maksimum **6 interstitial**.
> - Reklam yüklenemezse sessizce atla, oyun akışını engelleme.
>
> **Banner:**
> - Level select ekranı alt kısmında sabit.
> - Layout, banner yüksekliği (50dp) kadar `paddingBottom` almalı — banner içerik üzerine binmemeli.
>
> **Test / Production ID Yönetimi:**
> - Test: `ca-app-pub-3940256099942544/1033173712` (Interstitial), `ca-app-pub-3940256099942544/5224354917` (Rewarded)
> - Production: `.env.production` içinden `REACT_APP_ADMOB_INTERSTITIAL_ID` ve `REACT_APP_ADMOB_REWARDED_ID` oku.
>
> **IAP – Remove Ads (`@capgo/capacitor-purchases`):**
> - Uygulama her açılışta `restorePurchases()` çağır.
> - Entitlement doğrulandıysa Zustand'daki `adsDisabled = true` set et.
> - Local storage flag'i tek başına güvenilmez; her zaman store doğrulaması öncelikli.
> - `adsDisabled = true` ise tüm reklam çağrıları sessizce iptal edilir.
>
> **Test:** Smart interstitial zamanlama kuralı ve session limit için Vitest testleri yaz. AdMob plugin'ini mock'la.

---

## PROMPT 7 – Retention Sistemleri

**Hedef:** Daily Challenge, Streak ve Best Time sistemlerini kurmak.

> Aşağıdaki retention sistemlerini implement et.
>
> **Daily Challenge:**
> - Her gün farklı, önceden hazırlanmış bir puzzle (`daily_YYYY-MM-DD` ID formatı).
> - Tamamlama ödülü: özel rozet ve streak artışı.
>
> **Streak Sistemi:**
> - Arka arkaya gün oynama serisi.
> - Kaçırılan gün streak'i sıfırlar.
> - `lastChallengeClaimDate` ile son claim günü karşılaştırılır.
>
> **Best Time:**
> - Her puzzle için `bestTime` Capacitor Preferences'a kaydedilir.
> - Bölüm ekranında gösterilir.
>
> **ZAMAN DOĞRULAMA SİSTEMİ (Hybrid):**
> 1. Önce `https://worldtimeapi.org/api/ip` adresinden sunucu zamanı çek.
> 2. Başarısızsa `lastTrustedTime` (local cache) kullan.
> 3. Her ikisi de yoksa cihaz zamanı fallback olarak kabul edilir; bir sonraki online bağlantıda doğrulama yapılır.
>
> **Anti-cheat kuralı:**
> - `deviceTime < lastTrustedTime` ise günlük ödül verilmez, streak artmaz.
>
> **Saklanan değerler:** `lastTrustedTime`, `lastChallengeClaimDate`, `streak`
>
> **Achievement Modal:** Streak milestone'larında (3, 7, 30 gün) Lottie animasyonlu modal göster.
>
> **Test:** Anti-cheat kuralı ve streak hesabı için Vitest testleri yaz. `worldtimeapi.org` fetch'ini mock'la.

---

## PROMPT 8 – UI/UX ve Ekran Tasarımları

**Hedef:** Tüm ekranları native hissiyatla tasarlamak.

> Oyunun tüm ekranlarını tasarla. Dark/Light tema değişkenlerine (Tailwind `dark:` prefix) duyarlı olmalı.
>
> **⚠️ Safe Area (Notch/Çentik) Yönetimi:**
> Uygulama tam ekran (Immersive Mode) çalışacağından iPhone Dynamic Island, notch'lu Android ve punch-hole kameralı cihazlarda UI elemanları sistem alanlarına binebilir. Her ekranın kök container'ı şu CSS'i almalı:
> ```css
> padding-top: env(safe-area-inset-top);
> padding-bottom: env(safe-area-inset-bottom);
> padding-left: env(safe-area-inset-left);
> padding-right: env(safe-area-inset-right);
> ```
> Tailwind ile kullanım için `tailwind.config.js`'e custom spacing ekle veya inline style olarak uygula. `index.html` `<meta name="viewport">` içinde `viewport-fit=cover` bulunmalı.
>
> 1. **Ana Ekran:** "Devam Et (Seviye-Bölüm)" butonu üstte, altında Seviyeler / Ayarlar / Nasıl Oynanır / Daily Challenge butonları.
> 2. **Seviyeler Ekranı:** Kolay / Orta / Zor dikey kartlar. Her kartta ilerleme yüzdesi + tamamlanan/toplam.
> 3. **Bölümler Ekranı:** 4'lü grid. Tamamlananlar: pasif + ✓. Mevcut + sonraki 2: aktif. Diğerleri: 🔒.
> 4. **Oyun Ekranı:**
>    - Üst: Geri, seviye adı, ❤️ x 3, 💡 ipucu.
>    - Orta: 9x9 grid (`React.memo` hücreler, 3x3 blok ayraçları belirgin).
>    - Alt: 1–9 klavye (remaining counter ile), Not Alma toggle, Sil butonu.
> 5. **Ayarlar:** TR/EN dil, Ses/Titreşim switch, Font boyutu (Küçük/Orta/Büyük), Dark Mode, Error Highlight toggle.
> 6. **Daily Challenge Ekranı:** Günün puzzle'ı, kalan süre (gece yarısına kadar), streak göstergesi.
>
> **Banner Reklam:** Bölümler ekranı altında sabit banner. İçerik banner yüksekliğinin altına kaymamalı.

---

## PROMPT 9 – Oyun Bitti Modalı, Tutorial ve Polishing

**Hedef:** Modal mantığı, öğretici ve cila detaylarını eklemek.

> **1. Oyun Bitti Modalı:**
> - Can 0'a düştüğünde açılır.
> - İlk 2 saniye yalnızca "İzle Devam Et" butonu görünür.
> - 2 saniye sonra "Yeniden Başla" ve "Ana Menü" Framer Motion ile animasyonlu belirir.
> - Reklam izlenirse +1 can, modal kapanır.
> - Reklam yüklenemezse "İzle Devam Et" gizlenir.
>
> **2. Tutorial (Nasıl Oynanır):**
> - İlk açılışta otomatik, sonraki açılışlarda menüden erişilebilir.
> - 4 adım: Grid yapısı → Satır/Sütun/Blok kuralı → Not alma modu → Can sistemi.
> - Her adımda ilgili UI elemanı spotlight ile vurgulanır.
>
> **3. Polishing:**
> - Hatalı girişte `@capacitor/haptics` kısa titreşim.
> - Oyun tamamlandığında Lottie konfeti animasyonu.
> - `Howler.js` ile arka plan müziği (loop) + buton sesi. Ses ayarı değişince anında tepki ver.
> - Yıldız kazanıldığında yıldız dolma animasyonu (Framer Motion).
>
> **⚠️ Asset Placeholder Notu:**
> Gerçek `.mp3` ses dosyaları ve Lottie `.json` animasyon dosyaları bu aşamada mevcut değildir. Kod yazılırken şu kuralları uygula:
> - `assets/audio/` altında `bg-music.mp3`, `btn-click.mp3`, `success.mp3` için boş placeholder dosyası veya README referansı oluştur.
> - `assets/animations/` altında `confetti.json`, `star-fill.json` için aynı yaklaşımı kullan.
> - `AudioService` ve `AnimationService` içinde dosya yolları sabitle; gerçek asset'ler daha sonra bu yollara yerleştirilerek değiştirilebilsin.
> - Ses yüklenemezse (`Howler` hata verirse) oyun sessizce devam etmeli, hata kullanıcıya gösterilmemeli.

---

## PROMPT 10 – Performance Tests ve Build Pipeline

**Hedef:** Birim testlerini tamamlamak ve production build'i hazırlamak.

> **Unit Testler (Vitest):**
> 1. Sudoku engine: `validateMove`, `checkCompletion` (< 2ms assert), `getHint`.
> 2. Completion detection: dolu board, eksik hücre, çakışmalı board senaryoları.
> 3. Auto candidate clean: satır, sütun ve blok temizliği ayrı ayrı test edilmeli.
> 4. Star calculation: her zorluk seviyesi için tüm yıldız senaryoları.
> 5. Anti-cheat: `deviceTime < lastTrustedTime` durumunda streak artmamalı.
> 6. Smart interstitial: 180sn kuralı ve session limit.
>
> Tüm Capacitor plugin'leri (`Preferences`, `Haptics`, `App`, `AdMob`) `vi.mock` ile mock'lanmalı.
>
> **Android Build Pipeline:**
> 1. `.env.production` oluştur: `REACT_APP_ADMOB_INTERSTITIAL_ID`, `REACT_APP_ADMOB_REWARDED_ID`.
> 2. `npm run build` → `npx cap sync`.
> 3. `android/app/build.gradle`: `applicationId com.evnlabs.BrainSpark`, `versionCode`, `versionName`, `minSdkVersion 22`, `targetSdkVersion 34`.
> 4. `keytool` ile keystore üret; `gradle.properties`'e referans ver; şifreler `.gitignore`'da.
> 5. `./gradlew bundleRelease` → AAB, `./gradlew assembleRelease` → APK.
> 6. `proguard-rules.pro` içine Capacitor + AdMob keep kurallarını ekle.
>
> **Release Checklist:**
> - [ ] `app-ads.txt` public klasöründe doğrulandı
> - [ ] AdMob App ID `AndroidManifest.xml`'e eklendi
> - [ ] Production env ID'leri set edildi
> - [ ] İkon ve splash tüm boyutlarda mevcut
> - [ ] IAP ürün ID'leri store'da tanımlı
> - [ ] `worldtimeapi.org` erişimi için internet izni manifest'te var
