# 🧩 Brain Spark – Production Analysis (v4)

## 1. Proje Vizyonu
Bu proje yalnızca bir Sudoku oyunu değil, gelecekte farklı puzzle türlerini destekleyebilecek ölçeklenebilir bir **Puzzle Platform** olarak tasarlanacaktır.

Başlangıç puzzle türü: Sudoku

Gelecekte eklenebilir: Kakuro, Nonogram, KenKen

Hedef:
- Yüksek performanslı mobil oyun
- Offline-first çalışma
- Akıllı reklam stratejisi
- Yüksek kullanıcı retention

---

## 2. Teknik Mimari

### Frontend
- React
- Capacitor (native bridge)
- TailwindCSS
- Framer Motion (ekran geçişleri ve mikro animasyonlar)

### State Yönetimi
- **Zustand** → Global oyun state'i (grid, lives, progress vb.)
- **React Context** → UI tercihleri (tema, dil, font boyutu)

Sebep: Sudoku grid gibi yüksek frekanslı state değişimleri için Context uygun değildir; Zustand'ın selector tabanlı subscription modeli 81 hücreyi bağımsız render eder.

### Navigasyon
- **React Router v6** — `HashRouter` (Capacitor ile uyumlu)
- Rotalar:
  - `/` → Ana Ekran
  - `/levels` → Seviyeler
  - `/chapters/:difficulty` → Bölümler
  - `/game/:difficulty/:chapter` → Oyun Ekranı
  - `/settings` → Ayarlar
  - `/how-to-play` → Tutorial
  - `/daily` → Daily Challenge
- Ekran geçişleri: `framer-motion` ile slide animasyonu (sağdan sola giriş, sola çıkış, 250ms ease-out)
- Android geri tuşu: `@capacitor/app` `backButton` eventi ile yönetilir

---

## 3. Performans Stratejisi (Kritik)

Sudoku grid: 9x9 = 81 hücre. Her sayı girişinde tüm grid render edilmemelidir.

### Cell-Level Subscription
Her hücre yalnızca kendi state'ine subscribe olur:
```js
const value = useGameStore(state => state.grid[cellIndex])
```
- Parent component tüm grid'e subscribe olmaz
- Cell component `React.memo` ile sarılır
- Tek hücre güncellemesi yalnızca o hücreyi render eder

### Performans Hedefleri

| Metrik | Hedef |
|---|---|
| Grid Input Latency | < 16ms |
| Puzzle Completion Check | < 2ms |
| Highlight Update | < 8ms |
| FPS | 60 |

---

## 4. Sudoku Engine

`PuzzleEngine` interface'ini implement eden `SudokuEngine` sınıfı aşağıdaki özellikleri destekler:

- Number placement
- Pencil mode (birden fazla aday sayı)
- Conflict detection
- Completion detection
- Hint system
- Star calculation

### Conflict Highlight
Seçili hücreyle aynı sayılar highlight edilir. Çakışma varsa kırmızı pulse animasyonu gösterilir.

### Auto Candidate Clean
Doğru sayı yerleştirildiğinde aynı satır, sütun ve 3x3 bloktan o aday notu otomatik siler. İşlem tek Zustand action'ında batch olarak gerçekleşir (birden fazla re-render önlenir).

---

## 5. PuzzleEngine Abstraction

Yeni puzzle türlerini desteklemek için ortak interface:

```ts
interface PuzzleEngine {
  loadPuzzle(data: PuzzleData): void
  validateMove(cell: number, value: number): boolean
  checkCompletion(): boolean
  getHint(cell: number): number
}
```

`SudokuEngine` bu interface'i implement eder. `useSudokuEngine` hook'u doğrudan `SudokuEngine` instance'ını kullanır — ileride `KakuroEngine` gibi yeni bir engine eklendiğinde hook değişmeden çalışır.

---

## 6. Bulmaca Veri Seti ve Validator

### Veri Yapısı
```json
{
  "id": "easy_001",
  "difficulty": "easy",
  "initialBoard": [5,3,0,0,7,0,0,0,0, ...],
  "solutionBoard": [5,3,4,6,7,8,9,1,2, ...]
}
```
Toplam: 30 kolay + 30 orta + 30 zor = 90 bulmaca.

### Validator Script (`scripts/validatePuzzles.js`)
Her bulmaca yayına alınmadan önce şu kontrollerden geçer:
1. 9 satır, 9 sütun ve 9 blokta 1–9 rakamları tekrarsız mı?
2. `initialBoard`'daki dolu hücreler `solutionBoard` ile uyuşuyor mu?
3. `initialBoard`'ın **tek ve benzersiz** çözümü var mı? (backtracking ile)

Script `node scripts/validatePuzzles.js` ile çalıştırılır; hatalı bulmacaları ID ile raporlar.

### Zorluk Kriterleri
| Seviye | Açık Hücre | Gereken Teknik |
|---|---|---|
| Kolay | 45–50 | Naked/Hidden Single |
| Orta | 30–35 | Naked/Hidden Single + Pair |
| Zor | 22–27 | X-Wing, Swordfish |

---

## 7. Retention Sistemleri

### Star Rating
Her bölüm 1–3 yıldız alır. Eşik değerleri zorluk seviyesine göre belirlenir:

| Yıldız | Kolay | Orta | Zor |
|---|---|---|---|
| ⭐⭐⭐ | 0 hata, < 3dk | 0 hata, < 8dk | 0 hata, < 15dk |
| ⭐⭐ | ≤ 2 hata veya süre aşımı | ≤ 2 hata veya süre aşımı | ≤ 2 hata veya süre aşımı |
| ⭐ | Tamamlandı (herhangi bir koşulda) | aynı | aynı |

### Daily Challenge
Her gün farklı, önceden hazırlanmış bir puzzle. Tamamlama ödülü: özel rozet.

### Streak
Arka arkaya gün oynama serisi. Kaçırılan gün streak'i sıfırlar.

### Best Time
Her puzzle için en iyi süre saklanır ve bölüm ekranında gösterilir.

---

## 8. Zaman Doğrulama (Offline Güvenliği)

Daily Challenge ve Streak için hybrid zaman sistemi kullanılır.

Öncelik:
1. Sunucu/NTP zamanı (ücretsiz NTP API: `https://worldtimeapi.org/api/ip`)
2. Son güvenilir zaman (local cache: `lastTrustedTime`)
3. Cihaz zamanı (fallback — yalnızca 1 ve 2 erişilemezse)

Anti-cheat kuralı:
- `deviceTime < lastTrustedTime` ise günlük ödül verilmez, streak artmaz.
- Uygulama tamamen offline'sa cihaz zamanı kabul edilir ancak bir sonraki online bağlantıda doğrulama yapılır.

Saklanan değerler: `lastTrustedTime`, `lastChallengeClaimDate`

---

## 9. Monetization Stratejisi

### Reklam Türleri
- **Banner:** Level select ekranında, alt kısımda sabit. Layout banner yüksekliği (50dp) kadar padding alır.
- **Interstitial:** Bölüm bitişinde, Smart Interstitial kuralına göre.
- **Rewarded:** Hint alma ve "İzle Devam Et" (can yenileme).

### Smart Interstitial Kuralları
- Bölüm tamamlandığında tetiklenir.
- Son interstitial'dan bu yana **en az 180 saniye** geçmiş olmalı.
- Session başına maksimum **6 interstitial**.
- Reklam yüklenemezse sessizce atlanır (uygulama kilitlenmez).

### Reklam Havuzu (Ad Pooling)
- Uygulama açılışında 1 Interstitial + 1 Rewarded arka planda yüklenir.
- Gösterim sonrası anında yeni reklam talep edilir.

### Test / Production ID Yönetimi
- Test ortamı: AdMob test ID'leri sabit kodlanır.
- Production: `.env.production` içinden `REACT_APP_ADMOB_INTERSTITIAL_ID` ve `REACT_APP_ADMOB_REWARDED_ID` okunur.

---

## 10. IAP – Remove Ads

- Plugin: `@capgo/capacitor-purchases` (RevenueCat wrapper)
- Uygulama her açılışta `restorePurchases()` çağırır, entitlement doğrulanır.
- `adsDisabled` flag'i yalnızca store doğrulamasından set edilir; local storage tek başına yeterli değildir.
- Entitlement `true` ise tüm reklam gösterimleri kalıcı olarak devre dışı kalır.

---

## 11. Uygulama Yaşam Döngüsü (App Lifecycle)

`@capacitor/app` plugin'i ile yönetilir. `useAppLifecycle` custom hook'u ilgili ekranlarda çağrılır.

- **Auto-save (Crash Koruması):** Her `placeNumber` action'ı tetiklendiğinde state asenkron olarak arka planda kaydedilir. Bu sayede uygulama beklenmedik şekilde çökse bile oyuncu en fazla 1 hamle kaybeder. Kayıt işlemi `await` ile beklenmez; oyun akışını bloklamaz.
- **Arka plana alma (`isActive: false`):** Oyun duraklatılır, `grid`, `notes`, `lives`, `elapsedTime` anında kaydedilir.
- **Ön plana dönüş (`isActive: true`):** Oyun ekranındaysa kayıtlı state yüklenir, duraklatma ekranı gösterilir.
- **Android geri tuşu:** Oyun ekranında onay modalı → "Evet" seçilirse kaydet + Ana Ekran. Diğer ekranlarda `navigate(-1)`. Ana ekranda `App.exitApp()`.

---

## 12. Veri Saklama (Capacitor Preferences)

```json
{
  "user_settings": {
    "language": "TR",
    "sound": true,
    "vibration": true,
    "theme": "dark",
    "fontSize": "medium"
  },
  "game_progress": {
    "easy":   { "completed": 5, "last_played": 6 },
    "medium": { "completed": 0, "last_played": 1 },
    "hard":   { "completed": 0, "last_played": 1 },
    "puzzle_stats": {
      "easy_001": { "mistakes": 1, "hintsUsed": 0, "elapsedTime": 142, "stars": 3, "bestTime": 142 }
    },
    "saved_state": {
      "difficulty": "easy",
      "chapter": 6,
      "grid": [],
      "notes": [],
      "lives": 3,
      "elapsedTime": 142
    }
  },
  "retention": {
    "streak": 4,
    "lastTrustedTime": 1718000000,
    "lastChallengeClaimDate": "2025-06-10"
  }
}
```

---

## 13. Build ve Deploy Pipeline

### Geliştirme
```bash
npm run dev           # Web'de test
npx cap sync          # Web build → native
npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

### Android Release
- `build.gradle`: `applicationId com.evnlabs.BrainSpark`, `versionCode`, `versionName`, `minSdkVersion 22`, `targetSdkVersion 34`
- Keystore: `keytool` ile üretilir, `gradle.properties`'e referans verilir, şifreler `.gitignore`'a alınır.
- `./gradlew bundleRelease` → AAB
- `./gradlew assembleRelease` → APK
- ProGuard: Capacitor ve AdMob keep kuralları eklenir.

### Release Checklist
- [ ] `app-ads.txt` doğrulandı
- [ ] AdMob App ID manifest'e eklendi
- [ ] Production env ID'leri set edildi
- [ ] İkon ve splash boyutları tam
- [ ] İzin tanımları (`AndroidManifest.xml`) tamamlandı
- [ ] IAP ürün ID'leri store'da tanımlı

---

## 14. Reklam Doğrulama
`app-ads.txt`: `google.com, pub-4190858087915294, DIRECT, f08c47fec0942fa0`
Yalnızca production build'de geçerlidir.
