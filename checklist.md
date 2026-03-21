# 🧩 Brain Spark – Geliştirme Checklist

Son Güncelleme: 2026-03-21

---

## ✅ PROMPT 0 – Navigasyon ve App Lifecycle

**Durum: TAMAMLANDI**

### Proje Kurulumu
- [x] Vite + React + TypeScript projesi oluşturuldu
- [x] Bağımlılıklar yüklendi: `react-router-dom`, `framer-motion`, `zustand`, `@capacitor/core`, `@capacitor/app`, `@capacitor/preferences`, `@capacitor/haptics`
- [x] Dev bağımlılıklar: `tailwindcss (@tailwindcss/vite)`, `vitest`, `@testing-library/react`, `jsdom`
- [x] `vite.config.ts` → TailwindCSS plugin, `@` path alias, Vitest config
- [x] `tsconfig.app.json` → `@/*` path alias, `vitest/globals` type
- [x] `package.json` → `test`, `test:watch`, `test:coverage` script'leri eklendi

### index.html
- [x] `viewport-fit=cover` → Safe Area (notch/Dynamic Island) desteği
- [x] Google Fonts: Inter
- [x] SEO meta description + theme-color

### Design System (src/index.css)
- [x] Tailwind v4 import
- [x] CSS custom properties (color tokens, spacing, radius, transitions)
- [x] Dark theme foundation
- [x] `.safe-area` ve `.screen` utility sınıfları
- [x] `.glass` ve `.glass-strong` glassmorphism sınıfları
- [x] Animasyonlar: `pulse-danger`, `flash-success`, `shake`
- [x] `.btn`, `.btn-primary`, `.btn-ghost` base button sınıfları

### Navigasyon (HashRouter)
- [x] `HashRouter` kuruldu (Capacitor native uyumlu)
- [x] 7 rota tanımlandı:
  - [x] `/` → `HomeScreen`
  - [x] `/levels` → `LevelsScreen`
  - [x] `/chapters/:difficulty` → `ChaptersScreen`
  - [x] `/game/:difficulty/:chapter` → `GameScreen`
  - [x] `/settings` → `SettingsScreen`
  - [x] `/how-to-play` → `HowToPlayScreen`
  - [x] `/daily` → `DailyScreen`
- [x] `AnimatePresence` + `ScreenTransition` komponenti → 250ms ease-out slide animasyonu

### useAppLifecycle Hook
- [x] `appStateChange(isActive: false)` → state kaydedilir (Preferences)
- [x] `appStateChange(isActive: true)` → `/game/` ekranında `app:resume-on-game` event'i
- [x] `backButton` → `/game/*`: `app:back-on-game` event dispatch edilir
- [x] `backButton` → `/`: `App.exitApp()`
- [x] `backButton` → Diğer rotalar: `navigate(-1)`
- [x] Listener'lar unmount'ta temizlenir
- [x] Closure trap önleme: `locationRef` ile güncel path referansı

### Ekran Placeholder'ları (PROMPT 8'de tam tasarım)
- [x] `HomeScreen` — Logo, 4 nav butonu
- [x] `LevelsScreen` — 3 zorluk kartı + banner ad slot
- [x] `ChaptersScreen` — 30 bölüm butonu (4-kolonluk grid)
- [x] `GameScreen` — 9x9 grid + klavye + back/resume event listener
- [x] `SettingsScreen` — 6 ayar kalemi
- [x] `HowToPlayScreen` — 4 adımlı tutorial
- [x] `DailyScreen` — Countdown timer + streak göstergesi

### Unit Testler
- [x] `useAppLifecycle.test.tsx` → 5/5 test geçti
  - [x] Listener kayıt + unmount temizleme
  - [x] `isActive:false` → `Preferences.set` çağrısı
  - [x] `isActive:true` on `/game/` → `app:resume-on-game` event
  - [x] `backButton` on `/game/` → `app:back-on-game` event
  - [x] `backButton` on `/` → `App.exitApp()`

---

## ✅ PROMPT 1 – Zustand Store Architecture

**Durum: TAMAMLANDI**

### TypeScript Types (`src/types/game.ts`)
- [x] `Difficulty`, `PuzzleData`, `PuzzleStats`, `PuzzleStatsMap`
- [x] `SavedGameState` → notes: `number[][]` (Set serialize edilemez, array kullanılır)
- [x] `PersistedSlice` → persist middleware'inin yazacağı alan alt kümesi
- [x] `GameState` → tüm store alanları + action signature'ları

### Capacitor Storage Adapter (`src/stores/capacitorStorage.ts`)
- [x] `rawCapacitorStorage` → Kapasitör Preferences API'sini wrap eder
- [x] Web dev fallback: Capacitor yoksa localStorage kullanılır
- [x] `capacitorStorage` → Zustand `createJSONStorage` ile uyumlu
- [x] `SAVED_STATE_KEY` → crash protection için ayrı Preferences key
- [x] `saveToCrashProtection()` → fire-and-forget async save
- [x] `loadFromCrashProtection()` → uygulama başlangıcı restore

### Global Game Store (`src/stores/gameStore.ts`)
- [x] State alanları: `grid`, `notes` (Set<number>[]), `lives`, `mistakes`, `hintsUsed`, `elapsedTime`, `stars`, `streak`, `completedLevels`, `adsDisabled`
- [x] **Cell-level subscription**: `useCellValue(cellIndex)`, `useCellNotes(cellIndex)`, `useIsInitialCell(cellIndex)` selector'ları
- [x] `React.memo` ile sarılacak Cell bileşeni için selector pattern dokümante edildi
- [x] **Actions**: `placeNumber`, `removeNumber`, `toggleNote`, `decreaseLives`, `setAdsDisabled`, `selectCell`, `setPaused`, `setCompleted`, `setElapsedTime`, `setStars`, `savePuzzleStats`, `resetGame`, `saveGame`, `loadSavedGame`
- [x] **Crash Protection**: `placeNumber` her çağrıldığında `saveToCrashProtection()` fire-and-forget
- [x] **persist middleware**: Capacitor storage adapter, `partialize` ile geçici state dahil edilmez
- [x] **Set Serialization**: `partialize` → `Set → number[]`, `merge` → `number[] → Set`
- [x] removeNumber guardu: `initialGrid[cellIndex] !== 0` ise silme engellenir
- [x] `savePuzzleStats`: `bestTime = Math.min(existing, new)` mantığı

### useAppLifecycle Güncellemeleri
- [x] TODO stub'lar gerçek Zustand store ile değiştirildi
- [x] `isActive: false` → `useGameStore.getState().saveGame()` (fire-and-forget)
- [x] `isActive: true` + `/game/` → `useGameStore.getState().setPaused(true)`
- [x] `backButton onConfirm` → `useGameStore.getState().saveGame()` + navigate

### Unit Testler (21/21 ✅)
- [x] `useAppLifecycle.test.tsx` → 5/5 ✅
- [x] `gameStore.test.ts` → 14/14 ✅
  - [x] `placeNumber` → grid güncellenir
  - [x] `placeNumber` → crash protection çağrılır
  - [x] `removeNumber` → hücre temizlenir
  - [x] `removeNumber` → initialGrid koruması
  - [x] `toggleNote` → ekle/çıkar cycle
  - [x] `toggleNote` → dolu hücre garantisi
  - [x] `decreaseLives` → azalma + boundary
  - [x] `setAdsDisabled` → flag toggle
  - [x] `resetGame` → tam sıfırlama
  - [x] `savePuzzleStats` → bestTime 3 senaryo (ilk, iyileşme, kötüleşme)
  - [x] grid ve notes cell-level selector pattern teyidi

---

## ✅ PROMPT 2 – PuzzleEngine Abstraction

**Durum: TAMAMLANDI**

### Interface (`src/engines/PuzzleEngine.ts`)
- [x] OCP (Open-Closed Principle) uyumlu `PuzzleEngine` interface'i
- [x] Temel metodlar: `loadPuzzle`, `validateMove`, `checkCompletion`, `getHint`
- [x] Sudoku'ya özel uzantı: `SudokuCapabilities` (`getConflictingCells`, `getRelatedCells`, vb.)

### Sudoku Motoru (`src/engines/SudokuEngine.ts`)
- [x] Grid/Board state'i lokal olarak tutulur (framework bağımsız)
- [x] Geometri yardımcıları (O(1)): `getRow`, `getCol`, `getBlock` vb.
- [x] `validateMove`: O(27) time complexity ile çakışma kontrolü
- [x] `checkCompletion`: O(81) tek geçişle solutionGrid ile hızlı kıyaslama (< 2ms)
- [x] `getConflictingCells`: Çakışan hücre indekslerini döndürür (hata animasyonu için)
- [x] `getRelatedCells`: Satır, sütun ve bloktaki benzersiz hücreleri hesaplar (vurgu için)

### React Entegrasyon Hook'u (`src/hooks/useSudokuEngine.ts`)
- [x] Engine instantiate edilip `useRef`'e atanır (re-render'dan korunur)
- [x] `useEffect` içinden store grid engine'e O(81) sync edilir
- [x] Metodlara doğrudan erişim sağlanıp dışa aktarılır

### Unit Testler (35/35 ✅)
- [x] `sudokuEngine.test.ts` eklendi
- [x] Geometri yardımcıları için %100 kapsama
- [x] Hamle doğrulamada tüm sınır durumları (kendi hücresi, 0 değeri, tek/çoklu çakışma) test edildi
- [x] `< 2ms` checkCompletion performans garantisi doğrulandı

---

## ✅ PROMPT 3 – Sudoku Engine Hook (İleri Seviye)

**Durum: TAMAMLANDI**

### GameState Genişletmesi (`src/types/game.ts` & `src/stores/gameStore.ts`)
- [x] O(1) hata takibi için `errorCells: number[]` geçici state'i eklendi (Zustand partialize dışında bırakıldı).
- [x] İlgili actions yazıldı: `setErrorCells`, `increaseHintsUsed`, `removeValueFromNotes`.

### Yıldız Hesaplama (`src/hooks/useSudokuEngine.ts`)
- [x] `calculateStars` yardımcı modülü: Hata (≥3 -> 1 yıldız), Limit aşımı, ipucu, ve hata varlığına göre yıldız cezaları. Süre tablosu (Easy: 5dk, Med: 10dk, Hard: 15dk).

### Gelişmiş Hook (`src/hooks/useSudokuEngine.ts`)
- [x] **`placeNumber`**: 
  - 0 ise doğrudan sil.
  - Hatalıysa: `setErrorCells(conflicts)` ile animasyonu tetikle, `decreaseLives`, setTimeout(600ms) ile hücreleri temizle.
  - Geçerliyse: `store.placeNumber` ve Auto-candidate clean (`store.removeValueFromNotes`).
  - Anında `checkCompletion()` ve kazanmayı tespit edip store'a işle(`handleWin`).
- [x] **`useHint`**: 
  - `getHint` üzerinden çözümü bulur, hatayı engeller (0 değilse çalışır).
  - İpucu harcamasını kaydeder, sayıyı yerleştirir, kalemi siler, kazanmayı kontrol eder.

---

## ✅ PROMPT 4 – Game Screen UI & Grid

**Durum: TAMAMLANDI**

- [x] Top Bar: Canlar (kalpli), Süre (useTimer), Pause/Play Butonu, Zorluk ve Bölüm
- [x] O(1) `memo` ile optimize edilmiş 9x9 CSS Grid (`SudokuGrid.tsx` ve `Cell.tsx`)
- [x] Alt Panel (Kalem toggle, İpucu butonu, Silme)
- [x] Virtual Numpad (seçili hücreye rakam basma `Keyboard.tsx`)
- [x] Vurgulamalar:
    - Geçici UI states: `sameNumberCells`, `relatedCells` O(81) useMemo performansı ile hesaplandı
    - Seçili hücre
    - Aynı sayı vurgusu
    - İlgili Satır/Sütun/Blok highlight
    - Hata `errorCells` (.pulse-danger / Framer Motion animate shake)
- [x] Remaining Number Counter: `Keyboard` 1'den 9'a kadar boardda 9 kere geçen sayıları sayar ve `isDone` ise disable/dim yapar (Kalem modu hariç).
- [x] Error Highlight Toggle: `settings.errorHighlight` ile hatalar renklendirilir. React Testing Library ile test edildi.

---

## ✅ PROMPT 5 – Bulmaca Validator ve Veri Seti Üretimi

**Durum: TAMAMLANDI**

- [x] Validator Script (`scripts/generateAndValidatePuzzles.js`):
    - Seçili zorluğa göre (Easy: 45-50, Medium: 31-35, Hard: 24-28 ipucu) tam 90 adet bölüm rastgele kazıyarak üretildi.
    - Satır/Sütun/Blok OCP ve kural testlerinden geçti.
    - initialBoard / solutionBoard tutarlılığı test edildi.
    - Tek ve benzersiz çözüm (Backtracking Solver kullanılarak tam 1 tane çözüm olduğu garanti edildi).
- [x] Mükemmel bir JSON dosyası `src/constants/puzzles.json` konumuna başarıyla oluşturuldu.
- [x] `GameScreen` MOCK veriyi kaldırıp gerçek JSON'dan (`puzzles.json`) bölüm verisi okuyacak şekilde güncellendi.

---

## ✅ PROMPT 6 – AdManager Sistemi

**Durum: TAMAMLANDI**

- [x] `AdManager.ts` servisi oluşturuldu.
- [x] **Ad Pooling**: Uygulama açılışında (`App.tsx`'te init) 1 Interstitial ve 1 Rewarded yüklenir, gösterilince anında yenisi (`prepare*`) kuyruğa alınır.
- [x] **SMART INTERSTITIAL KURALLARI**:
    - Bölüm bitiminde (`GameScreen.tsx`) tetiklenir.
    - 180 Saniye kuralı (En az 180 sn geçmeli).
    - Session başına max 6 Interstitial kuralı.
    - Reklam yüklü değilse oyunu bölmez, sessizce geçilir.
- [x] **Banner**: `LevelsScreen.tsx`'in altında render edilip temizlenir (`pb-20` layout padding verildi).
- [x] **IAP Remove Ads**: `@capgo/capacitor-purchases` eklendi, her başlangıçta `restorePurchases()` ile yetki doğrulaması yapılır.
- [x] Vitest ile tüm limit, zamanlama algoritması ve `adsDisabled` özellikleri `%100` oranında test edildi.

---

## ✅ PROMPT 7 – Retention Sistemleri & Akıllı Kayıt ve Kurtarma

**Durum: TAMAMLANDI**

- [x] **Zustand Persist Refinement**: `resumeSavedGame` action'ı yazıldı. `grid`, `notes`, `lives`, `elapsedTime` güvenle yüklenebiliyor.
- [x] **GameScreen Resume Mantığı**: Girilen bölüm ve zorluk, `savedState` içindekiyle aynıysa sıfırdan oluşturmak yerine kalındığı yerden devam ediyor.
- [x] **HomeScreen "Devam Et" Butonu**: Eğer `savedState` varsa ana ekranda beliriyor.
- [x] **Hybrid Time Verification**: `TimeService.ts` yazıldı. `worldtimeapi.org`'den zaman çekiyor. Yoksa `lastTrustedTime` kullanıyor.
- [x] **Anti-Cheat Sistemi**: `deviceTime < lastTrustedTime` durumunda `isCheatDetected: true` dönüyor.
- [x] **Streak Claim Algoritması**: Kesin tarih checkleri ile `claimDailyReward` state'i eklenerek Streak döngüleri korundu.
- [x] **Achievement Modal**: Streak milestone'ları (3, 7, 30 gün) için `lottie-react` ile çalışan `AchievementModal.tsx` yapıldı.
- [x] **Testler**: Anti-cheat (`TimeService`) ve `Streak` state machine'i Vitest ile simüle edildi (`retention.test.ts`). Toplam test sayısı: 66.

---

## ⏳ PROMPT 8 – UI/UX Ekran Tasarımları

**Durum: BEKLIYOR**

- [ ] Tailwind / Framer Motion gerçek tasarımlar.
- [ ] Renk paletleri ve modern cam tasarımı (Level selection vb.)
- [ ] Ana Menü ve Alt bileşen tasarımlarının giydirilmesi.


---

## ⏳ PROMPT 9 – Game Over Modal, Tutorial, Polishing

**Durum: BEKLIYOR**

---

## ⏳ PROMPT 10 – Performance Tests ve Build Pipeline

**Durum: BEKLIYOR**

---

## 📁 Proje Dosya Yapısı (Güncel)

```
app.BrainSpark/
├── Docs/
│   ├── ReadMe.md
│   ├── sudoku_platform_analysis_v4.md
│   └── sudoku_platform_prompts_v4.md
├── src/
│   ├── components/
│   │   └── ScreenTransition.tsx    ← Framer Motion ekran geçiş wrapper
│   ├── hooks/
│   │   └── useAppLifecycle.ts      ← Capacitor app lifecycle yönetimi
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── LevelsScreen.tsx
│   │   ├── ChaptersScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── HowToPlayScreen.tsx
│   │   └── DailyScreen.tsx
│   ├── test/
│   │   ├── setup.ts                ← jest-dom setup
│   │   └── useAppLifecycle.test.tsx
│   ├── App.tsx                     ← HashRouter + AnimatePresence + Routes
│   ├── main.tsx
│   └── index.css                   ← Design system tokens + Tailwind v4
├── index.html                      ← viewport-fit=cover + Google Fonts
├── vite.config.ts                  ← TailwindCSS plugin + path alias + Vitest
├── tsconfig.app.json               ← @/* path alias + vitest/globals
└── package.json                    ← test/test:watch/test:coverage scripts
```
