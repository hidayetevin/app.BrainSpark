/**
 * Brain Spark – Global Game Store (Zustand)
 *
 * Mimari Kararlar:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. CELL-LEVEL SUBSCRIPTION:
 *    Her hücre `useGameStore(state => state.grid[cellIndex])` ile sadece
 *    kendi değerine abone olur. Parent 81 elemanlı diziye abone olmaz.
 *    Cell component `React.memo` ile sarılır → tek hücre güncellemesi
 *    yalnızca o hücreyi render eder. Input latency hedefi: <16ms.
 *
 * 2. PERSIST MIDDLEWARE:
 *    `partialize` ile yalnızca kalıcı alanlar diske yazılır:
 *    puzzleStats, streak, lastChallengeDate, adsDisabled, savedState.
 *    Geçici UI state (isPaused, isCompleted, selectedCell, highlights)
 *    persist edilmez.
 *
 * 3. SET SERİALİZASYON:
 *    `notes: Set<number>[]`, JSON'a serialize edilemez. `partialize`
 *    aşamasında `Set → number[]` dönüşümü yapılır; `merge` aşamasında
 *    `number[] → Set` geri dönüştürülür.
 *
 * 4. CRASH PROTECTION (Auto-Save):
 *    Her `placeNumber` çağrısında state Preferences'a arka planda
 *    yazılır. `await` kullanılmaz — oyun akışını bloklamaz.
 *    En kötü senaryoda oyuncu 1 hamle kaybeder.
 *
 * 5. STATE KAYNAKLAR ARASI ÖNCELIK:
 *    IAP doğrulaması (store) → `adsDisabled` flag → yerel depolama
 *    (store doğrulaması her zaman önceliklidir).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { capacitorStorage, saveToCrashProtection, loadFromCrashProtection } from './capacitorStorage'
import type { GameState, PersistedSlice, PuzzleData, PuzzleStats, SavedGameState, Difficulty } from '@/types/game'

// ─── Initial State Factories ────────────────────────────────────────────────

function emptyNotes(): Set<number>[] {
    return Array.from({ length: 81 }, () => new Set<number>())
}

function emptyGrid(): number[] {
    return Array(81).fill(0)
}

const INITIAL_LIVES = 3

// ─── Serialization Helpers ───────────────────────────────────────────────────

/** Set<number>[] → number[][] (persist için) */
function serializeNotes(notes: Set<number>[]): number[][] {
    return notes.map(s => Array.from(s))
}

/** number[][] → Set<number>[] (rehydrate için) */
function deserializeNotes(raw: number[][]): Set<number>[] {
    return raw.map(arr => new Set<number>(arr))
}

// ─── Persisted Slice Defaults ────────────────────────────────────────────────

const defaultPersistedSlice: PersistedSlice = {
    settings: {
        errorHighlight: true,
        soundEnabled: true,
        vibrationEnabled: true,
        language: 'tr',
        darkMode: true,
        hasSeenTutorial: false,
    },
    puzzleStats: {},
    streak: 0,
    lastChallengeClaimDate: '',
    lastTrustedTime: 0,
    adsDisabled: false,
    savedState: null,
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // ── Persisted defaults ──────────────────────────────────────
            ...defaultPersistedSlice,

            // ── In-memory game state defaults ───────────────────────────
            grid: emptyGrid(),
            initialGrid: emptyGrid(),
            solutionGrid: emptyGrid(),
            notes: emptyNotes(),
            difficulty: 'easy' as Difficulty,
            chapter: 1,
            lives: INITIAL_LIVES,
            mistakes: 0,
            hintsUsed: 0,
            elapsedTime: 0,
            stars: 0,

            // ── UI state defaults ────────────────────────────────────────
            isPaused: false,
            isCompleted: false,
            selectedCell: null,
            errorCells: [],

            // ────────────────────────────────────────────────────────────
            // ACTIONS
            // ────────────────────────────────────────────────────────────

            /**
             * placeNumber — Hücreye sayı yaz.
             * Performans: Yalnızca `grid[cellIndex]` değiştirilir → o hücre render edilir.
             * Crash protection: Arka planda sessionStorage'a asenkron yazar.
             */
            placeNumber: (cellIndex: number, value: number) => {
                set(state => {
                    const newGrid = state.grid.slice()
                    newGrid[cellIndex] = value
                    return { grid: newGrid }
                })

                // Crash protection: fire-and-forget, await YOK
                const state = get()
                const payload = JSON.stringify({
                    difficulty: state.difficulty,
                    chapter: state.chapter,
                    grid: state.grid, // set() zaten çalıştı, get() güncel değer döndürür
                    notes: serializeNotes(state.notes),
                    lives: state.lives,
                    elapsedTime: state.elapsedTime,
                } satisfies SavedGameState)

                void saveToCrashProtection(payload)
            },

            removeNumber: (cellIndex: number) => {
                set(state => {
                    // Başlangıç hücresi silinemez
                    if (state.initialGrid[cellIndex] !== 0) return state
                    const newGrid = state.grid.slice()
                    newGrid[cellIndex] = 0
                    return { grid: newGrid }
                })
            },

            /**
             * toggleNote — Kalem modu: not ekle/kaldır.
             * Auto Candidate Clean (PROMPT 3'te SudokuEngine hook ile entegre edilecek):
             * Doğru sayı yerleştirildiğinde aynı satır/sütun/bloktan o not silinir.
             * Şimdilik yalnızca toggle mantığı uygulanır.
             */
            toggleNote: (cellIndex: number, value: number) => {
                set(state => {
                    // Hücre doluysa not eklenemiyor
                    if (state.grid[cellIndex] !== 0) return state

                    const newNotes = state.notes.slice()
                    const cellNotes = new Set(newNotes[cellIndex])

                    if (cellNotes.has(value)) {
                        cellNotes.delete(value)
                    } else {
                        cellNotes.add(value)
                    }

                    newNotes[cellIndex] = cellNotes
                    return { notes: newNotes }
                })
            },

            decreaseLives: () => {
                set(state => ({
                    lives: Math.max(0, state.lives - 1),
                    mistakes: state.mistakes + 1,
                }))
            },

            setLives: (lives: number) => {
                set({ lives })
            },

            setAdsDisabled: (value: boolean) => {
                set({ adsDisabled: value })
            },

            updateSettings: (newSettings) => {
                set(state => ({
                    settings: { ...state.settings, ...newSettings }
                }))
            },

            claimDailyReward: (trustedTimeMs: number) => {
                const state = get()
                const dateObj = new Date(trustedTimeMs)
                const today = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`

                if (state.lastChallengeClaimDate === today) {
                    return { success: false, newStreak: state.streak }
                }

                let newStreak = 1
                if (state.lastChallengeClaimDate) {
                    // Sadece tarihleri karşılaştırarak saat farkının ceil yüzünden artmasını önle
                    const lastDateMidnight = new Date(state.lastChallengeClaimDate + 'T00:00:00')
                    const todayMidnight = new Date(today + 'T00:00:00')

                    const diffTime = todayMidnight.getTime() - lastDateMidnight.getTime()
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays === 1) {
                        newStreak = state.streak + 1
                    } else if (diffDays > 1) {
                        newStreak = 1 // Streak koptu
                    } else if (diffDays === 0) {
                        newStreak = state.streak
                    }
                }

                set({
                    streak: newStreak,
                    lastChallengeClaimDate: today,
                    lastTrustedTime: trustedTimeMs
                })

                return { success: true, newStreak }
            },

            selectCell: (cellIndex: number | null) => {
                set({ selectedCell: cellIndex })
            },

            setErrorCells: (cells: number[]) => {
                set({ errorCells: cells })
            },

            setPaused: (isPaused: boolean) => {
                set({ isPaused })
            },

            setCompleted: (isCompleted: boolean) => {
                set({ isCompleted })
            },

            setElapsedTime: (time: number) => {
                set({ elapsedTime: time })
            },

            setStars: (stars: number) => {
                set({ stars })
            },

            increaseHintsUsed: () => {
                set(state => ({ hintsUsed: state.hintsUsed + 1 }))
            },

            /**
             * removeValueFromNotes — Belirtilen hücrelerin notlarından `value`i siler.
             * Auto-candidate clean (aynı satır/sütun/bloktan kalemi silme) için kullanılır.
             */
            removeValueFromNotes: (cells: number[], value: number) => {
                set(state => {
                    let changed = false
                    const newNotes = state.notes.slice()

                    cells.forEach(idx => {
                        const cellNotes = new Set(newNotes[idx])
                        if (cellNotes.has(value)) {
                            cellNotes.delete(value)
                            newNotes[idx] = cellNotes
                            changed = true
                        }
                    })

                    return changed ? { notes: newNotes } : state
                })
            },

            savePuzzleStats: (puzzleId: string, stats: PuzzleStats) => {
                set(state => {
                    const existing = state.puzzleStats[puzzleId]
                    const bestTime = existing?.bestTime
                        ? Math.min(existing.bestTime, stats.elapsedTime)
                        : stats.elapsedTime

                    return {
                        puzzleStats: {
                            ...state.puzzleStats,
                            [puzzleId]: { ...stats, bestTime },
                        },
                    }
                })
            },

            /**
             * resetGame — Yeni bulmaca yükler; persist edilmeyen alanları sıfırlar.
             */
            resetGame: (puzzleData: PuzzleData) => {
                set({
                    grid: puzzleData.initialBoard.slice(),
                    initialGrid: puzzleData.initialBoard.slice(),
                    solutionGrid: puzzleData.solutionBoard.slice(),
                    notes: emptyNotes(),
                    difficulty: puzzleData.difficulty,
                    chapter: parseInt(puzzleData.id.split('_')[1] ?? '1', 10),
                    lives: INITIAL_LIVES,
                    mistakes: 0,
                    hintsUsed: 0,
                    elapsedTime: 0,
                    stars: 0,
                    isPaused: false,
                    isCompleted: false,
                    selectedCell: null,
                    errorCells: [],
                    savedState: null // Yeni oyun başlayınca öncekini sil
                })
            },

            resumeSavedGame: (puzzleData: PuzzleData) => {
                const state = get()
                if (!state.savedState) {
                    state.resetGame(puzzleData) // Saved state yoksa reset at
                    return
                }

                set({
                    initialGrid: puzzleData.initialBoard.slice(),
                    solutionGrid: puzzleData.solutionBoard.slice(),
                    grid: state.savedState.grid,
                    notes: deserializeNotes(state.savedState.notes),
                    difficulty: state.savedState.difficulty,
                    chapter: state.savedState.chapter,
                    lives: state.savedState.lives,
                    elapsedTime: state.savedState.elapsedTime,
                    // Diğer istatistikleri koru
                    isPaused: false,
                    isCompleted: false,
                    selectedCell: null,
                    errorCells: []
                })
            },

            /**
             * saveGame — Mevcut oyun state'ini `savedState` alanına yazar.
             * Lifecycle hook (arka plana alma) tarafından çağrılır.
             */
            saveGame: () => {
                const state = get()
                const savedState: SavedGameState = {
                    difficulty: state.difficulty,
                    chapter: state.chapter,
                    grid: state.grid,
                    notes: serializeNotes(state.notes),
                    lives: state.lives,
                    elapsedTime: state.elapsedTime,
                }
                set({ savedState })
                // persist middleware bunu yakında diske yazar
            },

            /**
             * loadSavedGame — Crash protection key'inden kayıtlı oyunu yükler.
             * `true` döndürürse yükleme başarılı (GameScreen'e devam et).
             */
            loadSavedGame: async (): Promise<boolean> => {
                try {
                    const raw = await loadFromCrashProtection()
                    if (!raw) return false

                    const saved = JSON.parse(raw) as SavedGameState
                    if (!saved.grid || saved.grid.length !== 81) return false

                    set({
                        difficulty: saved.difficulty,
                        chapter: saved.chapter,
                        grid: saved.grid,
                        notes: deserializeNotes(saved.notes),
                        lives: saved.lives,
                        elapsedTime: saved.elapsedTime,
                        isPaused: true, // Devam ederken duraklatılmış gelir
                    })

                    return true
                } catch {
                    return false
                }
            },
        }),

        // ── Persist Middleware Config ──────────────────────────────────────────────
        {
            name: 'brain-spark-store',
            storage: capacitorStorage,

            /**
             * partialize — Disk'e yazılacak alanları filtreler.
             * notes: Set<number>[] → number[][] dönüşümü burada yapılır.
             * Geçici state (isPaused, isCompleted, selectedCell, errorCells, vb) DIŞARDA bırakılır.
             */
            partialize: (state): PersistedSlice => ({
                settings: state.settings,
                puzzleStats: state.puzzleStats,
                streak: state.streak,
                lastChallengeClaimDate: state.lastChallengeClaimDate,
                lastTrustedTime: state.lastTrustedTime,
                adsDisabled: state.adsDisabled,
                savedState: state.grid.some(v => v !== 0)
                    ? {
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: state.grid,
                        notes: serializeNotes(state.notes),
                        lives: state.lives,
                        elapsedTime: state.elapsedTime,
                    }
                    : null,
            }),

            /**
             * merge — Diskten okunan state ile in-memory default'ları birleştirir.
             * notes: number[][] → Set<number>[] dönüşümü burada yapılır.
             */
            merge: (persistedState, currentState) => {
                const ps = persistedState as PersistedSlice
                const merged: GameState = {
                    ...currentState,
                    settings: ps.settings ?? currentState.settings,
                    puzzleStats: ps.puzzleStats ?? currentState.puzzleStats,
                    streak: ps.streak ?? currentState.streak,
                    lastChallengeClaimDate: ps.lastChallengeClaimDate ?? currentState.lastChallengeClaimDate,
                    lastTrustedTime: ps.lastTrustedTime ?? currentState.lastTrustedTime,
                    adsDisabled: ps.adsDisabled ?? currentState.adsDisabled,
                    savedState: ps.savedState ?? null,
                }

                // Eğer kayıtlı oyun varsa in-memory state'e de yükle
                if (ps.savedState) {
                    merged.difficulty = ps.savedState.difficulty
                    merged.chapter = ps.savedState.chapter
                    merged.grid = ps.savedState.grid
                    merged.notes = deserializeNotes(ps.savedState.notes)
                    merged.lives = ps.savedState.lives
                    merged.elapsedTime = ps.savedState.elapsedTime
                }

                return merged
            },

            version: 1,
        },
    ),
)

// ─── Convenience Selectors ───────────────────────────────────────────────────
// Bu selector'lar, her bileşenin kendi performans kaygısı olmadan
// doğru şekilde subscribe olmasını sağlar.

/**
 * useCellValue — Tek hücrenin değerine abone olur.
 * `React.memo` ile sarılmış Cell bileşeninde kullanılır.
 * Performans: Sadece kendi değeri değiştiğinde re-render.
 */
export const useCellValue = (cellIndex: number): number =>
    useGameStore(state => state.grid[cellIndex])

/**
 * useCellNotes — Tek hücrenin notlarına abone olur.
 */
export const useCellNotes = (cellIndex: number): Set<number> =>
    useGameStore(state => state.notes[cellIndex])

/**
 * useIsInitialCell — Hücrenin başlangıç değeri olup olmadığını döndürür.
 */
export const useIsInitialCell = (cellIndex: number): boolean =>
    useGameStore(state => state.initialGrid[cellIndex] !== 0)
