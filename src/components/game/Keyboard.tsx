import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import clsx from 'clsx'
import { PencilIcon, LightBulbIcon, BackspaceIcon } from '@heroicons/react/24/outline'
import { PencilIcon as PencilSolidIcon } from '@heroicons/react/24/solid'

interface KeyboardProps {
    onNumberPress: (num: number) => void
    onErase: () => void
    onHint: () => void
    pencilMode: boolean
    onTogglePencil: () => void
}

/**
 * Keyboard: Virtual Numpad & Tools Panel
 * 1'den 9'a kadar sayılar, Silme, İpucu, Kalem Modu.
 * Board üzerindeki kullanımları sayar ve limiti dolanları soluklaştırır.
 */
export function Keyboard({
    onNumberPress,
    onErase,
    onHint,
    pencilMode,
    onTogglePencil,
}: KeyboardProps) {
    // Grid'e abone ol (sayı sayaçlarını güncel tutmak için)
    const grid = useGameStore(state => state.grid)

    // 1-9 sayılarının kullanım miktarlarını hesapla
    const counts: Record<number, number> = {}
    for (let i = 1; i <= 9; i++) counts[i] = 0
    grid.forEach((num) => {
        if (num >= 1 && num <= 9) counts[num]++
    })

    return (
        <div className="flex flex-col gap-2 p-2 sm:p-4 w-full max-w-md mx-auto">

            {/* Numpad (1-9) */}
            <div className="grid grid-cols-5 gap-2 px-2">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
                    const count = counts[num]
                    const isDone = count >= 9

                    return (
                        <motion.button
                            key={num}
                            whileTap={!isDone ? { scale: 0.9 } : undefined}
                            onClick={() => {
                                // Eğer kalem modundaysan veya sayı bitmemişse izin ver
                                if (pencilMode || !isDone) onNumberPress(num)
                            }}
                            disabled={isDone && !pencilMode}
                            className={clsx(
                                "glass btn flex flex-col items-center justify-center p-0 h-14 sm:h-16 rounded-xl",
                                "text-2xl font-bold transition-opacity",
                                isDone && !pencilMode ? "opacity-30 cursor-not-allowed" : "text-[var(--color-primary)] shadow-sm hover:brightness-110 active:scale-95"
                            )}
                        >
                            <span>{num}</span>
                            {/* Kalan sayıyı minik bir dot/counter olarak gösterebiliriz */}
                        </motion.button>
                    )
                })}

                {/* Araç Kutusu (3 Buton) - Son kolonda/alt satırda yerleştirmek için */}
                {/* Klavye Grid'ini 5 kolon yaptık, 9 numara + 3 araç = 12 buton. Grid yapısı otomatik diler */}

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onErase}
                    className="glass btn flex flex-col items-center justify-center p-0 h-14 sm:h-16 rounded-xl text-[var(--text-secondary)] hover:brightness-110 active:scale-95"
                >
                    <BackspaceIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium leading-none">Sil</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onTogglePencil}
                    className={clsx(
                        "glass btn flex flex-col items-center justify-center p-0 h-14 sm:h-16 rounded-xl hover:brightness-110 active:scale-95",
                        pencilMode ? "text-[var(--color-primary)] bg-[rgba(99,102,241,0.1)] border-[var(--color-primary)]" : "text-[var(--text-secondary)]"
                    )}
                >
                    {pencilMode ? <PencilSolidIcon className="w-6 h-6 mb-1" /> : <PencilIcon className="w-6 h-6 mb-1" />}
                    <span className="text-[10px] font-medium leading-none">Not</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onHint}
                    className="glass btn flex flex-col items-center justify-center p-0 h-14 sm:h-16 rounded-xl text-yellow-500 hover:brightness-110 active:scale-95"
                >
                    <LightBulbIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium leading-none">İpucu</span>
                </motion.button>
            </div>

        </div>
    )
}
