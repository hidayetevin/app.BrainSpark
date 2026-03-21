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

export function Keyboard({
    onNumberPress,
    onErase,
    onHint,
    pencilMode,
    onTogglePencil,
}: KeyboardProps) {
    const grid = useGameStore(state => state.grid)

    // 1-9 sayılarının kullanım miktarlarını hesapla
    const counts: Record<number, number> = {}
    for (let i = 1; i <= 9; i++) counts[i] = 0
    grid.forEach((num) => {
        if (num >= 1 && num <= 9) counts[num]++
    })

    return (
        <div className="flex flex-col gap-3 p-2 sm:p-4 w-full max-w-md mx-auto z-10" style={{ paddingBottom: '20%' }}>
            {/* Tools Row (Sil, Not, İpucu) */}
            <div className="grid grid-cols-3 gap-3 px-2 mb-1">
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onErase}
                    className="glass-strong h-14 rounded-[1.25rem] flex items-center justify-center gap-2 text-indigo-200 hover:text-white transition-colors border border-white/10"
                >
                    <BackspaceIcon className="w-6 h-6" />
                    <span className="text-sm font-semibold">Sil</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onTogglePencil}
                    className={clsx(
                        "tour-step-pencil glass-strong h-14 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all border border-white/10 relative overflow-hidden",
                        pencilMode ? "bg-indigo-500/30 text-indigo-300 border-indigo-500/50" : "text-indigo-200 hover:text-white"
                    )}
                >
                    {pencilMode && <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />}
                    {pencilMode ? <PencilSolidIcon className="w-6 h-6" /> : <PencilIcon className="w-6 h-6" />}
                    <span className="text-sm font-semibold">Not</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onHint}
                    className="glass-strong h-14 rounded-[1.25rem] flex items-center justify-center gap-2 text-amber-300 hover:text-amber-200 transition-colors border border-amber-500/20"
                >
                    <LightBulbIcon className="w-6 h-6" />
                    <span className="text-sm font-semibold">İpucu</span>
                </motion.button>
            </div>

            {/* Numpad Row 1-5 */}
            <div className="grid grid-cols-5 gap-2 px-2">
                {[1, 2, 3, 4, 5].map((num) => {
                    const count = counts[num]
                    const remaining = 9 - count
                    const isDone = remaining <= 0

                    return (
                        <NumberButton
                            key={num}
                            num={num}
                            remaining={remaining}
                            isDone={isDone}
                            pencilMode={pencilMode}
                            onPress={() => (pencilMode || !isDone) && onNumberPress(num)}
                        />
                    )
                })}
            </div>

            {/* Numpad Row 6-9 */}
            <div className="grid grid-cols-4 gap-2 px-2">
                {[6, 7, 8, 9].map((num) => {
                    const count = counts[num]
                    const remaining = 9 - count
                    const isDone = remaining <= 0

                    return (
                        <NumberButton
                            key={num}
                            num={num}
                            remaining={remaining}
                            isDone={isDone}
                            pencilMode={pencilMode}
                            onPress={() => (pencilMode || !isDone) && onNumberPress(num)}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function NumberButton({ num, remaining, isDone, pencilMode, onPress }: any) {
    return (
        <motion.button
            whileTap={!isDone || pencilMode ? { scale: 0.9 } : undefined}
            onClick={onPress}
            disabled={isDone && !pencilMode}
            className={clsx(
                "relative flex flex-col items-center justify-center h-16 sm:h-20 rounded-[1.25rem] transition-all border border-white/5",
                isDone && !pencilMode
                    ? "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                    : "bg-slate-800/80 text-white shadow-xl hover:bg-slate-700 active:scale-95"
            )}
        >
            <span className="text-3xl font-black">{num}</span>
            {(!isDone || pencilMode) && (
                <span className="absolute bottom-1.5 text-[10px] sm:text-xs font-bold text-slate-400">
                    {Math.max(0, remaining)}
                </span>
            )}
        </motion.button>
    )
}
