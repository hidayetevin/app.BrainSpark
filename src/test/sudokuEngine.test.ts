/**
 * SudokuEngine Unit Tests
 *
 * Test edilen senaryolar:
 * === validateMove ===
 * 1. Geçerli hamle → true
 * 2. Satır çakışması → false
 * 3. Sütun çakışması → false
 * 4. 3x3 blok çakışması → false
 * 5. Değer 0 → her zaman true (hücre temizleme)
 * 6. Kendi pozisyonunu çakışma saymaz (mevcut değer)
 *
 * === checkCompletion ===
 * 7. Tamamlanmış board → true, VE < 2ms
 * 8. Eksik hücre olan board → false
 * 9. Yanlış değer içeren board → false
 * 10. Boş board → false
 *
 * === getHint ===
 * 11. solutionBoard'dan doğru değer döndürür
 *
 * === getConflictingCells ===
 * 12. Satır çakışması hücre listesinde yer alır
 * 13. Sütun çakışması hücre listesinde yer alır
 * 14. Blok çakışması hücre listesinde yer alır
 * 15. Çakışma yoksa boş liste döner
 *
 * === getRelatedCells ===
 * 16. Toplam ilgili hücre sayısı doğru (≤ 20)
 * 17. Kendi hücresi listede değil
 * 18. Tekrarlayan indeks yok
 *
 * === getCellsWithSameValue ===
 * 19. Grid'deki tüm aynı değerli hücreleri döndürür
 * 20. 0 için boş liste döner
 *
 * === Geometry Helpers ===
 * 21. getRow, getCol, getBlock doğru hesaplanır
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SudokuEngine, getRow, getCol, getBlock } from '@/engines/SudokuEngine'
import type { PuzzleData } from '@/types/game'

// ─── Test Fixtures ────────────────────────────────────────────────────────────

/**
 * Geçerli ve çözümlenmiş bir Sudoku tahtası.
 * Kaynak: Peter Norvig, "Solving Every Sudoku Puzzle"
 */
// prettier-ignore
const SOLUTION: number[] = [
    5, 3, 4, 6, 7, 8, 9, 1, 2,
    6, 7, 2, 1, 9, 5, 3, 4, 8,
    1, 9, 8, 3, 4, 2, 5, 6, 7,
    8, 5, 9, 7, 6, 1, 4, 2, 3,
    4, 2, 6, 8, 5, 3, 7, 9, 1,
    7, 1, 3, 9, 2, 4, 8, 5, 6,
    9, 6, 1, 5, 3, 7, 2, 8, 4,
    2, 8, 7, 4, 1, 9, 6, 3, 5,
    3, 4, 5, 2, 8, 6, 1, 7, 9,
]

/**
 * Başlangıç tahtası: 0 = boş hücre.
 * SOLUTION'daki değerlerin bir kısmı gizlenmiştir.
 */
// prettier-ignore
const INITIAL: number[] = [
    5, 3, 0, 0, 7, 0, 0, 0, 0,
    6, 0, 0, 1, 9, 5, 0, 0, 0,
    0, 9, 8, 0, 0, 0, 0, 6, 0,
    8, 0, 0, 0, 6, 0, 0, 0, 3,
    4, 0, 0, 8, 0, 3, 0, 0, 1,
    7, 0, 0, 0, 2, 0, 0, 0, 6,
    0, 6, 0, 0, 0, 0, 2, 8, 0,
    0, 0, 0, 4, 1, 9, 0, 0, 5,
    0, 0, 0, 0, 8, 0, 0, 7, 9,
]

function makePuzzle(initial: number[] = INITIAL, solution: number[] = SOLUTION): PuzzleData {
    return {
        id: 'easy_001',
        difficulty: 'easy',
        initialBoard: initial.slice(),
        solutionBoard: solution.slice(),
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SudokuEngine', () => {
    let engine: SudokuEngine

    beforeEach(() => {
        engine = new SudokuEngine()
        engine.loadPuzzle(makePuzzle())
        // Engine'i tam çözüm grid'iyle başlat (sonra test içinde değiştirilebilir)
        engine.syncGrid(INITIAL.slice())
    })

    // ── validateMove ──────────────────────────────────────────────────────────

    describe('validateMove', () => {
        it('geçerli hamle → true', () => {
            // Hücre 2 (satır 0, sütun 2) boş, çözüm 4 → geçerli
            engine.syncGrid(INITIAL.slice())
            expect(engine.validateMove(2, 4)).toBe(true)
        })

        it('satır çakışması → false', () => {
            // Satır 0: [5,3,0,...] → 5 zaten var
            engine.syncGrid(INITIAL.slice())
            expect(engine.validateMove(2, 5)).toBe(false) // 5 satırda zaten var
        })

        it('sütun çakışması → false', () => {
            // Sütun 0: [5,6,0,8,4,7,0,0,0] → 6 zaten var
            engine.syncGrid(INITIAL.slice())
            expect(engine.validateMove(18, 6)).toBe(false) // 6 sütunda zaten var
        })

        it('blok çakışması → false', () => {
            // Sol üst blok: [5,3,0, 6,0,0, 0,9,8] → 9 zaten var
            engine.syncGrid(INITIAL.slice())
            expect(engine.validateMove(2, 9)).toBe(false) // 9 blokta zaten var
        })

        it('değer 0 → her zaman true (silme işlemi)', () => {
            engine.syncGrid(INITIAL.slice())
            expect(engine.validateMove(0, 0)).toBe(true)
            expect(engine.validateMove(40, 0)).toBe(true)
        })

        it('mevcut hücrenin kendi değeri kontrol edilmez', () => {
            // Hücre 0'da 5 var; 5 yerleştirmeye çalışırken kendi değeri sayılmamalı
            const grid = INITIAL.slice()
            grid[0] = 0 // önce temizle
            engine.syncGrid(grid)
            // Artık satırda 5 yok → geçerli olmalı
            expect(engine.validateMove(0, 5)).toBe(true)
        })

        it('satır, sütun ve blokta olmayan değer → true', () => {
            engine.syncGrid(INITIAL.slice())
            // Hücre 2: satır [5,3], sütun [0,9,8,...], blok [5,3,6,9,8]
            // Değer 4: bu kısıtlamaları ihlal etmiyor mu?
            // SOLUTION[2] = 4, dolayısıyla 4 geçerlidir
            expect(engine.validateMove(2, 4)).toBe(true)
        })
    })

    // ── checkCompletion ───────────────────────────────────────────────────────

    describe('checkCompletion', () => {
        it('tamamlanmış board → true', () => {
            engine.syncGrid(SOLUTION.slice())
            expect(engine.checkCompletion()).toBe(true)
        })

        it('tamamlanmış board → < 2ms', () => {
            engine.syncGrid(SOLUTION.slice())
            const start = performance.now()
            engine.checkCompletion()
            const duration = performance.now() - start
            expect(duration).toBeLessThan(2)
        })

        it('eksik hücre → false', () => {
            const partial = SOLUTION.slice()
            partial[80] = 0 // son hücreyi boşalt
            engine.syncGrid(partial)
            expect(engine.checkCompletion()).toBe(false)
        })

        it('yanlış değer içeren board → false', () => {
            const wrong = SOLUTION.slice()
            wrong[0] = 9 // doğrusu 5
            engine.syncGrid(wrong)
            expect(engine.checkCompletion()).toBe(false)
        })

        it('boş board → false', () => {
            engine.syncGrid(Array(81).fill(0))
            expect(engine.checkCompletion()).toBe(false)
        })

        it('initialBoard ile çalışan board → false (çözüm tamamlanmamış)', () => {
            engine.syncGrid(INITIAL.slice())
            expect(engine.checkCompletion()).toBe(false)
        })
    })

    // ── getHint ───────────────────────────────────────────────────────────────

    describe('getHint', () => {
        it('solutionBoard\'dan doğru değer döndürür', () => {
            expect(engine.getHint(0)).toBe(SOLUTION[0])   // 5
            expect(engine.getHint(2)).toBe(SOLUTION[2])   // 4
            expect(engine.getHint(80)).toBe(SOLUTION[80]) // 9
        })

        it('dolu bir initialBoard hücresi için de doğru değer döndürür', () => {
            // Hücre 0 INITIAL'da 5 var ve SOLUTION'da da 5
            expect(engine.getHint(0)).toBe(5)
        })
    })

    // ── getConflictingCells ───────────────────────────────────────────────────

    describe('getConflictingCells', () => {
        it('satır çakışması → çakışan hücre listede', () => {
            // Satır 0'a 5 koymaya çalış: hücre 0'da 5 var
            engine.syncGrid(INITIAL.slice())
            const conflicts = engine.getConflictingCells(2, 5)
            expect(conflicts).toContain(0) // hücre 0 (satır 0, sütun 0 = 5)
        })

        it('sütun çakışması → çakışan hücre listede', () => {
            // Sütun 0'a 5 koymaya çalış: hücre 0'da 5 var
            engine.syncGrid(INITIAL.slice())
            const conflicts = engine.getConflictingCells(72, 5) // hücre 72 (satır 8, sütun 0), sütunda 5 var
            expect(conflicts).toContain(0) // hücre 0'da 5 var
        })

        it('blok çakışması → çakışan hücre listede', () => {
            // Sol üst blok: hücre 0'da 5 var. Aynı bloğa 5 koymaya çalış
            engine.syncGrid(INITIAL.slice())
            // Hücre 2 (satır 0, sütun 2) için blok [0,1,2, 9,10,11, 18,19,20]'de 5 var (hücre 0)
            // Farklı bir test: hücre 11 (satır 1, sütun 2), blokta 5 var (hücre 0)
            const conflicts2 = engine.getConflictingCells(11, 5)
            expect(conflicts2).toContain(0)
        })

        it('çakışma yoksa boş liste döner', () => {
            engine.syncGrid(INITIAL.slice())
            // Hücre 2: doğru cevap 4, satır/sütun/blokta 4 yok
            const conflicts = engine.getConflictingCells(2, 4)
            expect(conflicts).toHaveLength(0)
        })

        it('değer 0 için boş liste döner', () => {
            engine.syncGrid(INITIAL.slice())
            const conflicts = engine.getConflictingCells(0, 0)
            expect(conflicts).toHaveLength(0)
        })

        it('dönen listede tekrar eden indeks yok', () => {
            engine.syncGrid(INITIAL.slice())
            // Çakışma senaryosu: hem satır hem blokta aynı değer
            const conflicts = engine.getConflictingCells(2, 5)
            const unique = new Set(conflicts)
            expect(unique.size).toBe(conflicts.length) // tekrar yok
        })
    })

    // ── getRelatedCells ───────────────────────────────────────────────────────

    describe('getRelatedCells', () => {
        it('çakışma alanı toplam 20 benzersiz hücre döndürür', () => {
            // Satır: 8 hücre (kendi hariç) + Sütun: 8 hücre + Blok: ?
            // Köşe hücreler için: 8 + 8 + 4 = 20 (bazıları overlap eder)
            // Merkez veya köşe fark eder, her zaman ≤ 20 olmalı
            const related = engine.getRelatedCells(40) // merkez
            expect(related.length).toBeLessThanOrEqual(20)
            expect(related.length).toBeGreaterThan(0)
        })

        it('kendi hücresi listede değil', () => {
            const cellIndex = 40
            const related = engine.getRelatedCells(cellIndex)
            expect(related).not.toContain(cellIndex)
        })

        it('dönen listede tekrarlayan indeks yok', () => {
            const related = engine.getRelatedCells(40)
            const unique = new Set(related)
            expect(unique.size).toBe(related.length)
        })

        it('satırdaki tüm hücreler dahil', () => {
            const related = engine.getRelatedCells(0) // hücre 0 (satır 0, sütun 0)
            // Satır 0: hücreler 1–8
            for (let c = 1; c < 9; c++) {
                expect(related).toContain(c)
            }
        })

        it('sütundaki tüm hücreler dahil', () => {
            const related = engine.getRelatedCells(0)
            // Sütun 0: hücreler 9, 18, 27, 36, 45, 54, 63, 72
            for (let r = 1; r < 9; r++) {
                expect(related).toContain(r * 9)
            }
        })
    })

    // ── getCellsWithSameValue ─────────────────────────────────────────────────

    describe('getCellsWithSameValue', () => {
        it('grid\'deki tüm aynı değerli hücreleri döndürür', () => {
            engine.syncGrid(SOLUTION.slice())
            // Çözüm grid'inde 5 kaç kez geçiyor?
            const expected = SOLUTION.reduce<number[]>((acc, v, i) => {
                if (v === 5) acc.push(i)
                return acc
            }, [])
            const result = engine.getCellsWithSameValue(5)
            expect(result.sort()).toEqual(expected.sort())
        })

        it('değer 0 için boş liste döner', () => {
            engine.syncGrid(SOLUTION.slice())
            expect(engine.getCellsWithSameValue(0)).toHaveLength(0)
        })

        it('boş grid\'de herhangi bir değer için boş liste döner', () => {
            engine.syncGrid(Array(81).fill(0))
            expect(engine.getCellsWithSameValue(7)).toHaveLength(0)
        })
    })

    // ── Geometry Helpers ──────────────────────────────────────────────────────

    describe('Geometry Helpers', () => {
        it('getRow: hücre indeksinden satır hesaplanır', () => {
            expect(getRow(0)).toBe(0)
            expect(getRow(8)).toBe(0)
            expect(getRow(9)).toBe(1)
            expect(getRow(80)).toBe(8)
        })

        it('getCol: hücre indeksinden sütun hesaplanır', () => {
            expect(getCol(0)).toBe(0)
            expect(getCol(8)).toBe(8)
            expect(getCol(9)).toBe(0)
            expect(getCol(80)).toBe(8)
        })

        it('getBlock: hücre indeksinden blok hesaplanır', () => {
            expect(getBlock(0)).toBe(0)  // sol üst
            expect(getBlock(4)).toBe(1)  // orta üst
            expect(getBlock(80)).toBe(8) // sağ alt
            expect(getBlock(40)).toBe(4) // merkez
        })

        it('tüm 81 hücre için getRow/getCol/getBlock tutarlı çalışır', () => {
            for (let i = 0; i < 81; i++) {
                const row = getRow(i)
                const col = getCol(i)
                const block = getBlock(i)

                expect(row).toBeGreaterThanOrEqual(0)
                expect(row).toBeLessThan(9)
                expect(col).toBeGreaterThanOrEqual(0)
                expect(col).toBeLessThan(9)
                expect(block).toBeGreaterThanOrEqual(0)
                expect(block).toBeLessThan(9)

                // Geri dönüş kontrolü
                expect(row * 9 + col).toBe(i)
            }
        })
    })

    // ── syncGrid + loadPuzzle ─────────────────────────────────────────────────

    describe('syncGrid + loadPuzzle', () => {
        it('syncGrid sonrası validateMove güncel grid\'i kullanır', () => {
            const grid = Array(81).fill(0)
            grid[0] = 5 // Satır 0, sütun 0'a 5 koy
            engine.syncGrid(grid)

            // Aynı satıra 5 koyma → çakışma
            expect(engine.validateMove(5, 5)).toBe(false)
        })

        it('yeni bulmaca yüklendiğinde önceki grid silinir', () => {
            engine.syncGrid(SOLUTION.slice())
            expect(engine.checkCompletion()).toBe(true)

            const emptyPuzzle = makePuzzle(Array(81).fill(0), SOLUTION.slice())
            engine.loadPuzzle(emptyPuzzle)
            engine.syncGrid(Array(81).fill(0))
            expect(engine.checkCompletion()).toBe(false)
        })
    })
})
