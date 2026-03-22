/**
 * Brain Spark – Global Game Store (Zustand)
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

function serializeNotes(notes: Set<number>[]): number[][] {
    return notes.map(s => Array.from(s))
}

function deserializeNotes(raw: number[][]): Set<number>[] {
    return raw.map(arr => new Set<number>(arr))
}

// ─── Persisted Slice Defaults ────────────────────────────────────────────────

const defaultPersistedSlice: PersistedSlice = {
    settings: {
        errorHighlight: true,
        soundEnabled: true,
        musicEnabled: true,
        vibrationEnabled: true,
        language: 'tr',
        darkMode: true,
        hasSeenTutorial: false,
        fontSize: 'medium',
    },
    puzzleStats: {},
    streak: 0,
    lastChallengeClaimDate: '',
    lastTrustedTime: 0,
    adsDisabled: false,
    coins: 0,
    savedStates: {},
    lastActivePuzzleId: null,
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
            pencilMode: false,
            errorCells: [],

            // ────────────────────────────────────────────────────────────
            // ACTIONS
            // ────────────────────────────────────────────────────────────

            placeNumber: (cellIndex: number, value: number) => {
                set(state => {
                    const newGrid = state.grid.slice()
                    newGrid[cellIndex] = value

                    // OTOMATİK KAYIT (CRASH PROTECTION):
                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`
                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: newGrid,
                        notes: serializeNotes(state.notes),
                        lives: state.lives,
                        elapsedTime: state.elapsedTime
                    }

                    // Disk crash protection için (opsiyonel ama güvenli)
                    void saveToCrashProtection(JSON.stringify(currentSave))

                    return {
                        grid: newGrid,
                        lastActivePuzzleId: puzzleId,
                        // Persist middleware'in yakalaması için savedStates'i güncelle
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
                })
            },

            removeNumber: (cellIndex: number) => {
                set(state => {
                    if (state.initialGrid[cellIndex] !== 0) return state

                    const newGrid = state.grid.slice()
                    newGrid[cellIndex] = 0

                    const newNotes = state.notes.slice()
                    newNotes[cellIndex] = new Set<number>()

                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`
                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: newGrid,
                        notes: serializeNotes(newNotes),
                        lives: state.lives,
                        elapsedTime: state.elapsedTime
                    }

                    return {
                        grid: newGrid,
                        notes: newNotes,
                        lastActivePuzzleId: puzzleId,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
                })
            },

            toggleNote: (cellIndex: number, value: number) => {
                set(state => {
                    if (state.grid[cellIndex] !== 0) return state

                    const newNotes = state.notes.slice()
                    const cellNotes = new Set(newNotes[cellIndex])

                    if (cellNotes.has(value)) {
                        cellNotes.delete(value)
                    } else {
                        cellNotes.add(value)
                    }

                    newNotes[cellIndex] = cellNotes

                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`
                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: state.grid,
                        notes: serializeNotes(newNotes),
                        lives: state.lives,
                        elapsedTime: state.elapsedTime
                    }

                    return {
                        notes: newNotes,
                        lastActivePuzzleId: puzzleId,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
                })
            },

            decreaseLives: () => {
                set(state => {
                    const newLives = Math.max(0, state.lives - 1)
                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`

                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: state.grid,
                        notes: serializeNotes(state.notes),
                        lives: newLives,
                        elapsedTime: state.elapsedTime
                    }

                    return {
                        lives: newLives,
                        mistakes: state.mistakes + 1,
                        lastActivePuzzleId: puzzleId,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
                })
            },

            setLives: (lives: number) => {
                set(state => {
                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`
                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: state.grid,
                        notes: serializeNotes(state.notes),
                        lives: lives,
                        elapsedTime: state.elapsedTime
                    }
                    return {
                        lives,
                        lastActivePuzzleId: puzzleId,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
                })
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
                    const lastDateMidnight = new Date(state.lastChallengeClaimDate + 'T00:00:00')
                    const todayMidnight = new Date(today + 'T00:00:00')

                    const diffTime = todayMidnight.getTime() - lastDateMidnight.getTime()
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays === 1) {
                        newStreak = state.streak + 1
                    } else if (diffDays > 1) {
                        newStreak = 1
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

            addCoins: (amount: number) => {
                set(state => ({ coins: state.coins + amount }))
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

            setPencilMode: (pencilMode: boolean) => {
                set({ pencilMode })
            },

            togglePencilMode: () => {
                set(state => ({ pencilMode: !state.pencilMode }))
            },

            setCompleted: (isCompleted: boolean) => {
                set({ isCompleted })
            },

            setElapsedTime: (time: number) => {
                set(state => {
                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`
                    if (state.isCompleted) return { elapsedTime: time }

                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: state.grid,
                        notes: serializeNotes(state.notes),
                        lives: state.lives,
                        elapsedTime: time
                    }

                    return {
                        elapsedTime: time,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
                })
            },

            setStars: (stars: number) => {
                set({ stars })
            },

            increaseHintsUsed: () => {
                set(state => ({ hintsUsed: state.hintsUsed + 1 }))
            },

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

                    if (!changed) return state

                    const puzzleId = `${state.difficulty}_${state.chapter.toString().padStart(3, '0')}`
                    const currentSave: SavedGameState = {
                        puzzleId,
                        difficulty: state.difficulty,
                        chapter: state.chapter,
                        grid: state.grid,
                        notes: serializeNotes(newNotes),
                        lives: state.lives,
                        elapsedTime: state.elapsedTime
                    }

                    return {
                        notes: newNotes,
                        lastActivePuzzleId: puzzleId,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: currentSave
                        }
                    }
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

            resetGame: (puzzleData: PuzzleData) => {
                const puzzleId = puzzleData.id
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
                    pencilMode: false,
                    lastActivePuzzleId: puzzleId,
                    errorCells: [],
                })
            },

            resumeSavedGame: (puzzleData: PuzzleData) => {
                const state = get()
                const puzzleId = puzzleData.id
                const saved = state.savedStates[puzzleId]

                if (!saved) {
                    state.resetGame(puzzleData)
                    return
                }

                set({
                    initialGrid: puzzleData.initialBoard.slice(),
                    solutionGrid: puzzleData.solutionBoard.slice(),
                    grid: [...saved.grid],
                    notes: deserializeNotes(saved.notes),
                    difficulty: saved.difficulty,
                    chapter: saved.chapter,
                    lives: saved.lives,
                    elapsedTime: saved.elapsedTime,
                    isPaused: false,
                    isCompleted: false,
                    selectedCell: null,
                    lastActivePuzzleId: puzzleId,
                    errorCells: []
                })
            },

            saveGame: () => {
                // Manuel tetikleme
            },

            clearSavedState: (puzzleId: string) => {
                set(state => {
                    const newSavedStates = { ...state.savedStates }
                    delete newSavedStates[puzzleId]

                    // Eğer sildiğimiz bulmaca son aktif olan ise temizle
                    const newLastActive = state.lastActivePuzzleId === puzzleId ? null : state.lastActivePuzzleId

                    return {
                        savedStates: newSavedStates,
                        lastActivePuzzleId: newLastActive
                    }
                })
            },

            loadSavedGame: async (): Promise<boolean> => {
                try {
                    const raw = await loadFromCrashProtection()
                    if (!raw) return false
                    const saved = JSON.parse(raw) as SavedGameState
                    if (!saved.grid || saved.grid.length !== 81) return false

                    const puzzleId = saved.puzzleId
                    set(state => ({
                        lastActivePuzzleId: puzzleId,
                        savedStates: {
                            ...state.savedStates,
                            [puzzleId]: saved
                        }
                    }))
                    return true
                } catch {
                    return false
                }
            },
        }),

        {
            name: 'brain-spark-store-v3', // v3 as we added lastActivePuzzleId
            storage: capacitorStorage,
            partialize: (state): PersistedSlice => ({
                settings: state.settings,
                puzzleStats: state.puzzleStats,
                streak: state.streak,
                lastChallengeClaimDate: state.lastChallengeClaimDate,
                lastTrustedTime: state.lastTrustedTime,
                adsDisabled: state.adsDisabled,
                coins: state.coins,
                savedStates: state.savedStates,
                lastActivePuzzleId: state.lastActivePuzzleId,
            }),
            merge: (persistedState, currentState) => {
                const ps = persistedState as PersistedSlice
                return {
                    ...currentState,
                    settings: { ...currentState.settings, ...(ps.settings || {}) },
                    puzzleStats: ps.puzzleStats ?? currentState.puzzleStats,
                    streak: ps.streak ?? currentState.streak,
                    lastChallengeClaimDate: ps.lastChallengeClaimDate ?? currentState.lastChallengeClaimDate,
                    lastTrustedTime: ps.lastTrustedTime ?? currentState.lastTrustedTime,
                    adsDisabled: ps.adsDisabled ?? currentState.adsDisabled,
                    coins: ps.coins ?? currentState.coins,
                    savedStates: ps.savedStates ?? {},
                    lastActivePuzzleId: ps.lastActivePuzzleId ?? null,
                }
            },
            version: 3,
        },
    ),
)

// Selector helpers
export const useCellValue = (cellIndex: number): number =>
    useGameStore(state => state.grid[cellIndex])

export const useCellNotes = (cellIndex: number): Set<number> =>
    useGameStore(state => state.notes[cellIndex])

export const useIsInitialCell = (cellIndex: number): boolean =>
    useGameStore(state => state.initialGrid[cellIndex] !== 0)
