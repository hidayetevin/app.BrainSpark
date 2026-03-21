/**
 * Brain Spark – Global Type Definitions
 * Tüm servisler bu tip tanımlarını import eder.
 */

// ─── Puzzle ──────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface PuzzleData {
    id: string
    difficulty: Difficulty
    /** 81 elemanlı; 0 = boş hücre */
    initialBoard: number[]
    solutionBoard: number[]
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface PuzzleStats {
    stars: number
    mistakes: number
    hintsUsed: number
    /** Saniye cinsinden tamamlanma süresi */
    elapsedTime: number
    /** En iyi süre (saniye) */
    bestTime: number
}

/**
 * Puzzle ID → istatistik eşlemesi.
 * Key formatı: "easy_001", "medium_015", vb.
 */
export type PuzzleStatsMap = Record<string, PuzzleStats>

// ─── Persisted Saved State ───────────────────────────────────────────────────

/**
 * Uygulama arka plana alındığında ya da çöktüğünde
 * Capacitor Preferences'a yazılan oyun snapshot'ı.
 */
export interface SavedGameState {
    difficulty: Difficulty
    chapter: number
    grid: number[]
    /** Set<number>[] → number[][] olarak serialize edilir */
    notes: number[][]
    lives: number
    elapsedTime: number
}

// ─── Store Slice (Persisted) ─────────────────────────────────────────────────

export interface GameSettings {
    errorHighlight: boolean
    soundEnabled: boolean
    vibrationEnabled: boolean
    language: 'tr' | 'en'
    darkMode: boolean
    hasSeenTutorial: boolean
}

/**
 * Zustand persist middleware'inin diske yazacağı alan alt kümesi.
 * Geçici UI state'i (highlights, isPaused, vb.) BURAYA GİRMEZ.
 */
export interface PersistedSlice {
    /** Ayarlar */
    settings: GameSettings
    /** Bulmaca istatistikleri (yıldız, süre, vb.) */
    puzzleStats: PuzzleStatsMap
    streak: number
    lastChallengeClaimDate: string
    lastTrustedTime: number
    adsDisabled: boolean
    /** Son aktif oyun; null ise aktif oyun yok */
    savedState: SavedGameState | null
}

// ─── Game Store State ─────────────────────────────────────────────────────────

export interface GameState extends PersistedSlice {
    // ── Süregelen Oyun ────────────────────────────────────────────
    grid: number[]
    /** Başlangıç tahtası: kullanıcı değiştiremez */
    initialGrid: number[]
    /** Çözüm tahtası: validateMove ve hint için kullanılır */
    solutionGrid: number[]
    /** 81 elemanlı kalem notu seti */
    notes: Set<number>[]

    difficulty: Difficulty
    chapter: number

    // ── Me ta ─────────────────────────────────────────────────────
    lives: number
    mistakes: number
    hintsUsed: number
    elapsedTime: number
    stars: number

    // ── UI State (persist edilmez) ────────────────────────────────
    isPaused: boolean
    isCompleted: boolean
    selectedCell: number | null
    /** Çakışan hücrelerin kırmızı vurgusu için geçici state */
    errorCells: number[]

    // ── Actions ──────────────────────────────────────────────────
    /**
     * Hücreye sayı yaz. Arka planda asenkron olarak state'i kaydet.
     * await ile bekleme — oyun akışını bloklamasın.
     */
    placeNumber: (cellIndex: number, value: number) => void
    removeNumber: (cellIndex: number) => void
    toggleNote: (cellIndex: number, value: number) => void
    decreaseLives: () => void
    setLives: (lives: number) => void
    setAdsDisabled: (value: boolean) => void
    selectCell: (cellIndex: number | null) => void
    setErrorCells: (cells: number[]) => void
    setPaused: (isPaused: boolean) => void
    setCompleted: (isCompleted: boolean) => void
    setElapsedTime: (time: number) => void
    setStars: (stars: number) => void
    increaseHintsUsed: () => void
    removeValueFromNotes: (cells: number[], value: number) => void
    savePuzzleStats: (puzzleId: string, stats: PuzzleStats) => void
    updateSettings: (newSettings: Partial<GameSettings>) => void
    claimDailyReward: (trustedTimeMs: number) => { success: boolean, newStreak: number }
    resetGame: (puzzleData: PuzzleData) => void
    resumeSavedGame: (puzzleData: PuzzleData) => void
    /** Mevcut oyun state'ini arka planda Preferences'a yazar */
    saveGame: () => void
    /** Kayıtlı state'i store'a yükler (uygulama başlangıcında çağrılır) */
    loadSavedGame: () => Promise<boolean>
}
