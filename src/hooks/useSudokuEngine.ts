/**
 * useSudokuEngine — SudokuEngine instance'ını React lifecycle ile entegre eden hook.
 *
 * PROMPT 3 İleri Seviye Mantık:
 * ─────────────────────────────────────────────────────────────────────────────
 * - `placeNumber`: `validateMove` kontrolü yapar. Hatalıysa `errorCells` tetikler ve can azaltır.
 *   Geçerli ise `gameStore` a yazar ve auto-candidate clean işlemini uygular. Kazanma kontrolü yapar.
 * - `useHint`: `getHint` kullanarak doğru sayıyı yerleştirir, hint sayacını artırır ve kazanma kontrolü yapar.
 * - `calculateStars`: Zorluk limitlerine, hatalara ve ipucu kullanımına göre 1-3 yıldız döndürür.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useEffect } from 'react'
import { SudokuEngine } from '@/engines/SudokuEngine'
import { useGameStore } from '@/stores/gameStore'
import { AudioService } from '@/services/AudioService'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import type { PuzzleData, Difficulty } from '@/types/game'
import type { SudokuCapabilities } from '@/engines/PuzzleEngine'

// ─── Helper: Stars Calculation ────────────────────────────────────────────────

export function calculateStars(
    difficulty: Difficulty,
    elapsedTime: number,
    mistakes: number
): number {
    if (mistakes >= 3) return 1

    const limits: Record<Difficulty, number> = {
        easy: 180,   // 3 dk
        medium: 480, // 8 dk
        hard: 900,   // 15 dk
        daily: 900,  // Günlük görev de hard seviyesinde
    }

    const timeExceeded = elapsedTime > limits[difficulty]

    if (mistakes === 0 && !timeExceeded) {
        return 3
    }

    return 2
}

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseSudokuEngineReturn {
    getConflictingCells: (cellIndex: number, value: number) => number[]
    getRelatedCells: (cellIndex: number) => number[]
    getCellsWithSameValue: (value: number) => number[]

    placeNumber: (cellIndex: number, value: number) => void
    useHint: (cellIndex: number) => void
    toggleNote: (cellIndex: number, value: number) => void

    engine: SudokuCapabilities
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSudokuEngine(puzzleData: PuzzleData | null): UseSudokuEngineReturn {
    const engineRef = useRef<SudokuEngine>(new SudokuEngine())
    const grid = useGameStore(state => state.grid)

    useEffect(() => {
        if (puzzleData) {
            engineRef.current.loadPuzzle(puzzleData)
        }
    }, [puzzleData])

    useEffect(() => {
        engineRef.current.syncGrid(grid)
    }, [grid])

    const handleWin = async () => {
        const store = useGameStore.getState()
        const stars = calculateStars(store.difficulty === 'daily' ? 'hard' : store.difficulty as Difficulty, store.elapsedTime, store.mistakes)
        store.setStars(stars)

        // Günlük görev tamamlandıysa kaydet ve seri artır
        if (store.difficulty === 'daily') {
            store.claimDailyReward(Date.now())
        }

        // Ödül: Her galibiyet için 5 coin
        store.addCoins(5)

        store.setCompleted(true)
        AudioService.playSuccess()
        if (store.settings.vibrationEnabled) {
            await Haptics.vibrate({ duration: 200 })
        }
    }

    return {
        getConflictingCells: (cellIndex, value) =>
            engineRef.current.getConflictingCells(cellIndex, value),

        getRelatedCells: (cellIndex) =>
            engineRef.current.getRelatedCells(cellIndex),

        getCellsWithSameValue: (value) =>
            engineRef.current.getCellsWithSameValue(value),

        placeNumber: async (cellIndex, value) => {
            const store = useGameStore.getState()
            AudioService.playClick()

            if (value === 0) {
                store.removeNumber(cellIndex)
                if (store.settings.vibrationEnabled) {
                    await Haptics.impact({ style: ImpactStyle.Light })
                }
                return
            }

            if (!engineRef.current.validateMove(cellIndex, value)) {
                AudioService.playError()
                if (store.settings.vibrationEnabled) {
                    await Haptics.vibrate({ duration: 100 })
                }
                const conflicts = engineRef.current.getConflictingCells(cellIndex, value)
                store.setErrorCells(conflicts)
                store.decreaseLives()
                setTimeout(() => store.setErrorCells([]), 600)
                return
            }

            if (store.settings.vibrationEnabled) {
                await Haptics.impact({ style: ImpactStyle.Light }) // Doğru yerleştirme
            }

            store.placeNumber(cellIndex, value)

            const related = engineRef.current.getRelatedCells(cellIndex)
            store.removeValueFromNotes(related, value)

            const currentGrid = store.grid.slice()
            currentGrid[cellIndex] = value
            engineRef.current.syncGrid(currentGrid)

            if (engineRef.current.checkCompletion()) {
                handleWin()
            }
        },

        useHint: async (cellIndex) => {
            const engine = engineRef.current
            const store = useGameStore.getState()

            if (engine.isInitialCell(cellIndex) || engine.getGrid()[cellIndex] !== 0) {
                return
            }

            const correctValue = engine.getHint(cellIndex)
            if (correctValue === 0) return

            AudioService.playClick()
            if (store.settings.vibrationEnabled) {
                await Haptics.impact({ style: ImpactStyle.Medium })
            }

            store.increaseHintsUsed()
            store.placeNumber(cellIndex, correctValue)

            const related = engine.getRelatedCells(cellIndex)
            store.removeValueFromNotes(related, correctValue)

            const currentGrid = store.grid.slice()
            currentGrid[cellIndex] = correctValue
            engine.syncGrid(currentGrid)

            if (engine.checkCompletion()) {
                handleWin()
            }
        },

        toggleNote: async (cellIndex, value) => {
            const store = useGameStore.getState()
            AudioService.playClick()
            if (store.settings.vibrationEnabled) {
                await Haptics.impact({ style: ImpactStyle.Light })
            }
            store.toggleNote(cellIndex, value)
        },

        engine: engineRef.current,
    }
}
