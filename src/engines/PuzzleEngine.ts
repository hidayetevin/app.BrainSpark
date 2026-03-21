/**
 * PuzzleEngine – Framework-Agnostic Puzzle Interface
 *
 * Bu interface, gelecekteki tüm puzzle türleri (Sudoku, Kakuro, Nonogram, vb.)
 * için ortak sözleşmeyi tanımlar. Herhangi bir engine bu interface'i
 * implement ettiğinde, `useSudokuEngine` hook'u değişmeden çalışmaya devam eder.
 *
 * Mimari prensipler:
 * - Engine iç state'ini kendi yönetir
 * - Zustand store'a bağımlı değildir
 * - Saf fonksiyon mantığı; side-effect yok
 * - Test edilebilirliği maksimize edilmiştir
 */

import type { PuzzleData } from '@/types/game'

// ─── Core Interface ──────────────────────────────────────────────────────────

/**
 * PuzzleEngine — Tüm puzzle motorlarının implement etmesi gereken interface.
 */
export interface PuzzleEngine {
    /**
     * Bulmacayı engine'e yükler.
     * `initialBoard` ve `solutionBoard`'u engine'in dahili state'ine kopyalar.
     */
    loadPuzzle(data: PuzzleData): void

    /**
     * Belirtilen hücreye değer yerleştirmenin geçerli olup olmadığını kontrol eder.
     * @param cellIndex 0–80 arası hücre indeksi
     * @param value     1–9 arası değer
     * @returns `true` → geçerli hamle, `false` → çakışma var
     */
    validateMove(cellIndex: number, value: number): boolean

    /**
     * Mevcut grid'in tamamlanmış olup olmadığını kontrol eder.
     * Hedef: < 2ms
     * @returns `true` → tüm hücreler doğru dolu
     */
    checkCompletion(): boolean

    /**
     * Seçili hücre için solutionBoard'dan doğru değeri döndürür.
     * @param cellIndex 0–80 arası hücre indeksi
     * @returns 1–9 arası doğru değer
     */
    getHint(cellIndex: number): number
}

// ─── Extended Capabilities ───────────────────────────────────────────────────

/**
 * SudokuCapabilities — SudokuEngine'e özgü ek yetenekler.
 * PuzzleEngine interface'ini genişletir; Kakuro gibi farklı enginelerde
 * bu metodlar farklı implement edilir ya da hiç olmayabilir.
 */
export interface SudokuCapabilities extends PuzzleEngine {
    /**
     * Grid'i güncel tutar. `useSudokuEngine` hook'u Zustand grid değiştiğinde bunu çağırır.
     */
    syncGrid(grid: number[]): void

    /**
     * Belirtilen hücredeki değerle çakışan hücre indekslerini döndürür.
     * Conflict highlight (kırmızı pulse) için kullanılır.
     * @returns Çakışan hücre indekslerinin listesi (boşsa [])
     */
    getConflictingCells(cellIndex: number, value: number): number[]

    /**
     * Belirtilen hücreyle aynı satır, sütun veya 3x3 blokta olan
     * tüm hücre indekslerini döndürür. Highlight için kullanılır.
     */
    getRelatedCells(cellIndex: number): number[]

    /**
     * Aynı satır, sütun veya blokta belirtilen değeri taşıyan
     * tüm hücre indekslerini döndürür. "Same number highlight" için kullanılır.
     */
    getCellsWithSameValue(value: number): number[]
}
