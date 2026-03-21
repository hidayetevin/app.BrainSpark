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

## ⏳ PROMPT 1 – Zustand Store Architecture

**Durum: BEKLIYOR**

- [ ] Global Zustand store: `grid`, `notes`, `lives`, `mistakes`, `hintsUsed`, `elapsedTime`, `stars`, `streak`, `completedLevels`, `adsDisabled`
- [ ] Cell-level subscription (`state => state.grid[cellIndex]`)
- [ ] `React.memo` ile Cell component'leri
- [ ] `persist` middleware + Capacitor Preferences custom storage adapter
- [ ] Actions: `placeNumber`, `removeNumber`, `toggleNote`, `decreaseLives`, `setAdsDisabled`, `resetGame`
- [ ] `useAppLifecycle`'daki TODO'lar gerçek store ile güncellenir
- [ ] Unit testler: `placeNumber`, `decreaseLives`, `toggleNote`

---

## ⏳ PROMPT 2 – PuzzleEngine Abstraction

**Durum: BEKLIYOR**

- [ ] `PuzzleEngine` interface
- [ ] `SudokuEngine` class implementasyonu
- [ ] `useSudokuEngine` hook

---

## ⏳ PROMPT 3 – Sudoku Engine Hook

**Durum: BEKLIYOR**

---

## ⏳ PROMPT 4 – Advanced Sudoku UX

**Durum: BEKLIYOR**

---

## ⏳ PROMPT 5 – Bulmaca Validator ve 90 Bulmaca

**Durum: BEKLIYOR**

---

## ⏳ PROMPT 6 – AdManager Sistemi

**Durum: BEKLIYOR**

---

## ⏳ PROMPT 7 – Retention Sistemleri

**Durum: BEKLIYOR**

---

## ⏳ PROMPT 8 – UI/UX Ekran Tasarımları

**Durum: BEKLIYOR**

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
