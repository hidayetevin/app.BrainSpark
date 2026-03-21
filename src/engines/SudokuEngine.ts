/**
 * SudokuEngine — PuzzleEngine interface'ini implement eden Sudoku motoru.
 *
 * Performans Hedefleri:
 * ─────────────────────────────────────────────────────────────────────────────
 * - validateMove  : < 1ms  (O(27) sabit maliyet)
 * - checkCompletion: < 2ms  (O(81) tek geçiş, çözüm karşılaştırması)
 * - getConflictingCells: < 1ms  (O(27))
 * - getRelatedCells: < 1ms  (O(27), tekrarsız Set)
 *
 * Mimari Notlar:
 * ─────────────────────────────────────────────────────────────────────────────
 * - Engine hiçbir React modülüne, Zustand store'a veya framework'e bağlı değildir.
 * - `useSudokuEngine` hook'u, Zustand state değiştiğinde `syncGrid()` çağırarak
 *   engine'in grid'ini günceller.
 * - Engine instance React.useRef içinde tutulur → re-render'da yeniden oluşturulmaz.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PuzzleData } from '@/types/game'
import type { SudokuCapabilities } from './PuzzleEngine'

// ─── Geometry Helpers ────────────────────────────────────────────────────────

/** Hücre indeksinden satır numarasını hesaplar (0–8) */
export function getRow(cellIndex: number): number {
    return Math.floor(cellIndex / 9)
}

/** Hücre indeksinden sütun numarasını hesaplar (0–8) */
export function getCol(cellIndex: number): number {
    return cellIndex % 9
}

/** Hücrenin hangi 3x3 blokta olduğunu hesaplar (0–8, sol üstten sağ alta) */
export function getBlock(cellIndex: number): number {
    const row = getRow(cellIndex)
    const col = getCol(cellIndex)
    return Math.floor(row / 3) * 3 + Math.floor(col / 3)
}

/**
 * getRowCells — Belirtilen hücreyle aynı satırdaki 9 hücrenin indekslerini döndürür.
 */
export function getRowCells(cellIndex: number): number[] {
    const row = getRow(cellIndex)
    return Array.from({ length: 9 }, (_, c) => row * 9 + c)
}

/**
 * getColCells — Belirtilen hücreyle aynı sütundaki 9 hücrenin indekslerini döndürür.
 */
export function getColCells(cellIndex: number): number[] {
    const col = getCol(cellIndex)
    return Array.from({ length: 9 }, (_, r) => r * 9 + col)
}

/**
 * getBlockCells — Belirtilen hücreyle aynı 3x3 blokta olan 9 hücrenin indekslerini döndürür.
 */
export function getBlockCells(cellIndex: number): number[] {
    const row = getRow(cellIndex)
    const col = getCol(cellIndex)
    const blockRowStart = Math.floor(row / 3) * 3
    const blockColStart = Math.floor(col / 3) * 3
    const cells: number[] = []

    for (let r = blockRowStart; r < blockRowStart + 3; r++) {
        for (let c = blockColStart; c < blockColStart + 3; c++) {
            cells.push(r * 9 + c)
        }
    }
    return cells
}

// ─── SudokuEngine ────────────────────────────────────────────────────────────

export class SudokuEngine implements SudokuCapabilities {
    /** Engine'in mevcut grid görünümü (Zustand grid'inin kopyası) */
    private grid: number[] = Array(81).fill(0)

    /** Değiştirilemeyen başlangıç hücreleri */
    private initialGrid: number[] = Array(81).fill(0)

    /** Doğru cevapları içeren çözüm tahtası */
    private solutionGrid: number[] = Array(81).fill(0)

    // ── PuzzleEngine Interface ────────────────────────────────────────────────

    /**
     * loadPuzzle — Bulmacayı engine'e yükler.
     * Grid derin kopyalanır — dışarıdan referans değişikliği güvenliği sağlanır.
     */
    loadPuzzle(data: PuzzleData): void {
        this.grid = data.initialBoard.slice()
        this.initialGrid = data.initialBoard.slice()
        this.solutionGrid = data.solutionBoard.slice()
    }

    /**
     * validateMove — Belirtilen hamlenin Sudoku kurallarına göre geçerli olup
     * olmadığını kontrol eder.
     *
     * Kontroller (O(27) sabit maliyet):
     * 1. Satır: aynı satırda aynı değer var mı?
     * 2. Sütun: aynı sütunda aynı değer var mı?
     * 3. 3x3 Blok: aynı blokta aynı değer var mı?
     *
     * NOT: Kendi hücresi (cellIndex) karşılaştırmadan hariç tutulur.
     *      0 değeri her zaman geçerlidir (hücre temizleme).
     */
    validateMove(cellIndex: number, value: number): boolean {
        if (value === 0) return true

        const row = getRow(cellIndex)
        const col = getCol(cellIndex)

        // 1. Satır kontrolü
        const rowStart = row * 9
        for (let c = 0; c < 9; c++) {
            const idx = rowStart + c
            if (idx !== cellIndex && this.grid[idx] === value) return false
        }

        // 2. Sütun kontrolü
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col
            if (idx !== cellIndex && this.grid[idx] === value) return false
        }

        // 3. 3x3 Blok kontrolü
        const blockRowStart = Math.floor(row / 3) * 3
        const blockColStart = Math.floor(col / 3) * 3
        for (let r = blockRowStart; r < blockRowStart + 3; r++) {
            for (let c = blockColStart; c < blockColStart + 3; c++) {
                const idx = r * 9 + c
                if (idx !== cellIndex && this.grid[idx] === value) return false
            }
        }

        return true
    }

    /**
     * checkCompletion — Grid'in tamamlanıp tamamlanmadığını kontrol eder.
     *
     * Strateji: O(81) tek geçişle solutionGrid ile karşılaştır.
     * Bu yaklaşım, satır/sütun/blok validation'ından çok daha hızlıdır (< 2ms garanti).
     * solutionBoard tanım gereği geçerli ve benzersizdir
     * (PROMPT 5 validator bunu doğrular).
     */
    checkCompletion(): boolean {
        for (let i = 0; i < 81; i++) {
            if (this.grid[i] !== this.solutionGrid[i]) return false
        }
        return true
    }

    /**
     * getHint — Seçili hücre için solutionBoard'dan doğru değeri döndürür.
     * 0 döndürürse hücre solutionBoard'da boş (geçersiz durum).
     */
    getHint(cellIndex: number): number {
        return this.solutionGrid[cellIndex]
    }

    // ── SudokuCapabilities ────────────────────────────────────────────────────

    /**
     * syncGrid — Zustand store'daki grid değiştiğinde hook tarafından çağrılır.
     * Engine'in dahili grid'ini günceller (derin kopya).
     */
    syncGrid(grid: number[]): void {
        this.grid = grid.slice()
    }

    /**
     * getConflictingCells — Belirtilen hücreye değer yerleştirildiğinde
     * çakışan tüm hücrelerin indekslerini döndürür.
     *
     * Kullanım: Conflict highlight (kırmızı pulse animasyonu).
     *
     * @returns Boşsa [] (çakışma yok)
     */
    getConflictingCells(cellIndex: number, value: number): number[] {
        if (value === 0) return []

        const conflicts: number[] = []
        const row = getRow(cellIndex)
        const col = getCol(cellIndex)

        // Satır çakışmaları
        const rowStart = row * 9
        for (let c = 0; c < 9; c++) {
            const idx = rowStart + c
            if (idx !== cellIndex && this.grid[idx] === value) conflicts.push(idx)
        }

        // Sütun çakışmaları
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col
            if (idx !== cellIndex && this.grid[idx] === value) conflicts.push(idx)
        }

        // 3x3 Blok çakışmaları
        const blockRowStart = Math.floor(row / 3) * 3
        const blockColStart = Math.floor(col / 3) * 3
        for (let r = blockRowStart; r < blockRowStart + 3; r++) {
            for (let c = blockColStart; c < blockColStart + 3; c++) {
                const idx = r * 9 + c
                if (idx !== cellIndex && this.grid[idx] === value) {
                    // Zaten satır/sütun kontrolünden eklenmiş olabilir, tekrar ekleme
                    if (!conflicts.includes(idx)) conflicts.push(idx)
                }
            }
        }

        return conflicts
    }

    /**
     * getRelatedCells — Belirtilen hücreyle aynı satır, sütun veya 3x3 blokta
     * olan tüm hücre indekslerini döndürür (cellIndex hariç).
     *
     * Kullanım: Row/Column/Block highlight (açık arka plan rengi).
     * Set kullanılarak tekrarlayan indeksler elenir.
     */
    getRelatedCells(cellIndex: number): number[] {
        const related = new Set<number>()

        // Satırdakiler
        getRowCells(cellIndex).forEach(i => related.add(i))
        // Sütundakiler
        getColCells(cellIndex).forEach(i => related.add(i))
        // Bloktakiler
        getBlockCells(cellIndex).forEach(i => related.add(i))

        // Kendi hücresini hariç tut
        related.delete(cellIndex)

        return Array.from(related)
    }

    /**
     * getCellsWithSameValue — Grid'de belirtilen değeri taşıyan tüm hücreleri döndürür.
     *
     * Kullanım: "Same number highlight" — seçili sayı ile aynı değerdeki hücreleri vurgula.
     */
    getCellsWithSameValue(value: number): number[] {
        if (value === 0) return []
        const cells: number[] = []
        for (let i = 0; i < 81; i++) {
            if (this.grid[i] === value) cells.push(i)
        }
        return cells
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    /** Mevcut grid'in bir kopyasını döndürür (test ve debug için) */
    getGrid(): number[] {
        return this.grid.slice()
    }

    /** Solution grid'in bir kopyasını döndürür (test için) */
    getSolutionGrid(): number[] {
        return this.solutionGrid.slice()
    }

    /** Hücrenin başlangıç hücresi olup olmadığını döndürür */
    isInitialCell(cellIndex: number): boolean {
        return this.initialGrid[cellIndex] !== 0
    }
}
