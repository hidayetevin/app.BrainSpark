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
import type { PuzzleData, Difficulty } from '@/types/game'
import type { SudokuCapabilities } from '@/engines/PuzzleEngine'

// ─── Helper: Stars Calculation ────────────────────────────────────────────────

/**
 * calculateStars — Zorluk seviyesi, süre, hata miktarına göre 1-3 arası yıldız hesaplar.
 * Dokümandaki Tablo:
 * 3 Yıldız: 0 hata, <3dk(Kolay) / <8dk(Orta) / <15dk(Zor)
 * 2 Yıldız: ≤2 hata veya süre aşımı
 * 1 Yıldız: ≥3 hata
 */
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
    }

    const timeExceeded = elapsedTime > limits[difficulty]

    if (mistakes === 0 && !timeExceeded) {
        return 3
    }

    return 2
}

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseSudokuEngineReturn {
    /** Çakışan hücre indekslerini döndürür */
    getConflictingCells: (cellIndex: number, value: number) => number[]
    /** İlgili hücreleri (satır + sütun + blok) döndürür */
    getRelatedCells: (cellIndex: number) => number[]
    /** Aynı değere sahip hücreleri döndürür */
    getCellsWithSameValue: (value: number) => number[]

    /** İleri Seviye: Sayı yerleştirir, çakışma/win/lose mantığını otomatik işler */
    placeNumber: (cellIndex: number, value: number) => void
    /** İleri Seviye: Doğru sayıyı yerleştirip hint sayacını arttırır */
    useHint: (cellIndex: number) => void

    /** Engine instance'ına doğrudan erişim (test vb kullanım için) */
    engine: SudokuCapabilities
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSudokuEngine(puzzleData: PuzzleData | null): UseSudokuEngineReturn {
    const engineRef = useRef<SudokuEngine>(new SudokuEngine())
    const grid = useGameStore(state => state.grid)

    // Yeni bulmaca yüklendiğinde engine'i başlat
    useEffect(() => {
        if (puzzleData) {
            engineRef.current.loadPuzzle(puzzleData)
        }
    }, [puzzleData])

    // Zustand grid'i değiştiğinde engine'i senkronize et (O(81) hızlı kopyalama)
    useEffect(() => {
        engineRef.current.syncGrid(grid)
    }, [grid])

    // Kazanma işlemini tek noktada yönet
    const handleWin = () => {
        const store = useGameStore.getState()
        const stars = calculateStars(store.difficulty, store.elapsedTime, store.mistakes)
        store.setStars(stars)
        store.setCompleted(true)
    }

    return {
        getConflictingCells: (cellIndex, value) =>
            engineRef.current.getConflictingCells(cellIndex, value),

        getRelatedCells: (cellIndex) =>
            engineRef.current.getRelatedCells(cellIndex),

        getCellsWithSameValue: (value) =>
            engineRef.current.getCellsWithSameValue(value),

        // ── PROMPT 3: Advanced placeNumber ──────────────────────────────────────
        placeNumber: (cellIndex, value) => {
            const store = useGameStore.getState()

            // Değer 0 ise direkt silme (kalem notlarına vs dokunmayız)
            if (value === 0) {
                store.removeNumber(cellIndex)
                return
            }

            // 1. Geçerlilik Kontrolü
            if (!engineRef.current.validateMove(cellIndex, value)) {
                const conflicts = engineRef.current.getConflictingCells(cellIndex, value)
                // Kırmızı pulse animasyonunu tetikle
                store.setErrorCells(conflicts)
                store.decreaseLives()

                // Animasyon bittikten sonra temizle (600ms = css süresi)
                setTimeout(() => store.setErrorCells([]), 600)
                return
            }

            // 2. Geçerli Hamle: Zustand'a yaz
            store.placeNumber(cellIndex, value)

            // 3. Auto-candidate clean (aynı satır/sütun/bloktaki notlardan bu sayıyı sil)
            const related = engineRef.current.getRelatedCells(cellIndex)
            store.removeValueFromNotes(related, value)

            // 4. Kazanma kontrolü
            // store state'i asenkron re-render getireceği için, anında test etmek adına manual sync ediyoruz:
            const currentGrid = store.grid.slice()
            currentGrid[cellIndex] = value
            engineRef.current.syncGrid(currentGrid)

            if (engineRef.current.checkCompletion()) {
                handleWin()
            }
        },

        // ── PROMPT 3: Advanced useHint ──────────────────────────────────────────
        useHint: (cellIndex) => {
            const engine = engineRef.current
            const store = useGameStore.getState()

            // Başlangıç hücresiyse veya zaten doğru doluysa engelle
            if (engine.isInitialCell(cellIndex) || engine.getGrid()[cellIndex] !== 0) {
                return
            }

            const correctValue = engine.getHint(cellIndex)
            if (correctValue === 0) return // Bulmaca bozuk veya yüklenmemiş

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

        engine: engineRef.current,
    }
}
