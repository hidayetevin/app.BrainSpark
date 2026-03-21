import { useMemo } from 'react'
import { Cell } from './Cell'
import { useGameStore } from '@/stores/gameStore'
import { getRowCells, getColCells, getBlockCells } from '@/engines/SudokuEngine'

/**
 * SudokuGrid — 81 hücreyi (Cell) render eden ana komponent.
 * Performans Optimizasyonu:
 * - Hücreler `React.memo` ile sarılıdır. Sadece prop'ları değişen hücreler render olur.
 * - Seçili hücreye göre satır, sütun ve blok vurguları burada hesaplanıp props ile geçirilir.
 */
export function SudokuGrid() {
    const grid = useGameStore(state => state.grid)
    const selectedCell = useGameStore(state => state.selectedCell)
    const errorCells = useGameStore(state => state.errorCells)
    const errorHighlightEnabled = useGameStore(state => state.settings.errorHighlight)

    // Seçili hücrenin bilgisini hesapla
    const selectedValue = selectedCell !== null ? grid[selectedCell] : null

    // O(81) Highlight Hesaplamaları: `useMemo` ile sadece selected/grid değiştiğinde hesaplanır.
    // Not: selectedCell ve grid bağımlılığına göre hesaplamak <1ms sürer.
    const { relatedCells, sameNumberCells } = useMemo(() => {
        const related = new Set<number>()
        const sameList = new Set<number>()

        if (selectedCell !== null) {
            // Satır, sütun ve blok indekslerini topla
            getRowCells(selectedCell).forEach(i => related.add(i))
            getColCells(selectedCell).forEach(i => related.add(i))
            getBlockCells(selectedCell).forEach(i => related.add(i))
            related.delete(selectedCell) // Kendisini çıkar

            // Aynı sayı tespiti (0 hariç)
            if (selectedValue !== null && selectedValue !== 0) {
                for (let i = 0; i < 81; i++) {
                    if (grid[i] === selectedValue && i !== selectedCell) {
                        sameList.add(i)
                    }
                }
            }
        }

        return { relatedCells: related, sameNumberCells: sameList }
    }, [selectedCell, selectedValue, grid])

    const handleCellSelect = (index: number) => {
        // Aynı hücreye tıklanırsa seçimi iptal et, yoksa seç
        useGameStore.getState().selectCell(index === selectedCell ? null : index)
    }

    return (
        <div className="tour-step-grid flex justify-center items-center w-full max-w-md mx-auto p-2" style={{ aspectRatio: '1/1' }}>
            <div
                className="w-full h-full grid grid-cols-9 bg-[var(--surface-card)] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                style={{ border: '2px solid var(--color-primary)' }}
            >
                {grid.map((_, index) => (
                    <Cell
                        key={index}
                        index={index}
                        isSelected={selectedCell === index}
                        isSameNumberHighlight={sameNumberCells.has(index)}
                        isRelatedHighlight={relatedCells.has(index)}
                        isError={errorHighlightEnabled && errorCells.includes(index)}
                        onSelect={handleCellSelect}
                    />
                ))}
            </div>
        </div>
    )
}
