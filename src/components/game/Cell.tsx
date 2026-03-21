import { memo } from 'react'
import { motion } from 'framer-motion'
import { useCellValue, useCellNotes, useIsInitialCell } from '@/stores/gameStore'
import clsx from 'clsx'

interface CellProps {
    index: number
    /** Transient selection state passed from parent to avoid subscribing everyone to selectedCell */
    isSelected: boolean
    isSameNumberHighlight: boolean
    isRelatedHighlight: boolean
    isError: boolean
    onSelect: (index: number) => void
}

/**
 * Cell Component – O(1) rendering ile sadece kendi state'ine abone olur.
 * React.memo ile sarıldığı için dışarıdan gelen props değişmezse re-render olmaz.
 */
function CellComponent({
    index,
    isSelected,
    isSameNumberHighlight,
    isRelatedHighlight,
    isError,
    onSelect,
}: CellProps) {
    // O(1) Zustand subscriptions
    const value = useCellValue(index)
    const notes = useCellNotes(index)
    const isInitial = useIsInitialCell(index)

    const row = Math.floor(index / 9)
    const col = index % 9

    // CSS Border logic
    const borderRight = (col === 2 || col === 5) ? '2px solid var(--color-primary)' : '1px solid var(--surface-border)'
    const borderBottom = (row === 2 || row === 5) ? '2px solid var(--color-primary)' : '1px solid var(--surface-border)'

    // Background/Color variations based on PROMPT 4 UX
    const bgColor = isError
        ? 'rgba(239, 68, 68, 0.2)' // Red for error
        : isSelected
            ? 'var(--color-primary)'   // Primary for selected
            : isSameNumberHighlight
                ? 'rgba(99, 102, 241, 0.4)' // Soft primary for same numbers
                : isRelatedHighlight
                    ? 'rgba(99, 102, 241, 0.1)' // Very soft primary for row/col/block
                    : 'transparent'

    const textColor = isInitial
        ? 'var(--text-primary)'
        : isSelected
            ? '#ffffff'
            : 'var(--color-primary)'

    return (
        <motion.div
            onClick={() => onSelect(index)}
            // Framer Motion pulse-danger animasyonu (hata varsa sarsılır)
            animate={isError ? { x: [-2, 2, -2, 2, 0], backgroundColor: 'rgba(239,68,68,0.3)' } : { backgroundColor: bgColor }}
            transition={{ duration: 0.3 }}
            className={clsx(
                'w-full aspect-square flex items-center justify-center text-xl sm:text-2xl cursor-pointer select-none',
                {
                    'font-semibold relative': true,
                }
            )}
            style={{
                borderRight: col === 8 ? 'none' : borderRight,
                borderBottom: row === 8 ? 'none' : borderBottom,
                color: textColor,
            }}
        >
            {/* 1. Eğer hücre doluysa direkt sayıyı göster */}
            {value !== 0 ? (
                value
            ) : (
                /* 2. Eğer hücre boşsa ve kalem notu varsa, 3x3 minik grid içinde notları göster */
                notes.size > 0 && (
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[2px]">
                        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                            <div
                                key={num}
                                className="flex items-center justify-center text-[8px] sm:text-[10px] leading-none"
                                style={{
                                    color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                                }}
                            >
                                {notes.has(num) ? num : ''}
                            </div>
                        ))}
                    </div>
                )
            )}
        </motion.div>
    )
}

export const Cell = memo(CellComponent)
