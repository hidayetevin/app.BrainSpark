import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { useTranslation } from '@/locales/i18n'
import { puzzles } from '@/constants/puzzles.json'

export default function ChaptersScreen() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { difficulty } = useParams<{ difficulty: string }>()
    const { puzzleStats, savedStates } = useGameStore()

    const diffMode = difficulty || 'easy'
    const label = t.game[diffMode as keyof typeof t.game] || diffMode

    // İlerleme mantığı hesaplanıyor
    const { maxCompletedIndex, statsMap, chapterProgress } = useMemo(() => {
        let maxIdx = -1
        const map: boolean[] = Array(30).fill(false)
        const progressMap: number[] = Array(30).fill(0)

        for (let i = 0; i < 30; i++) {
            const puzzleId = `${diffMode}_${(i + 1).toString().padStart(3, '0')}`

            // 1. TAMAMLANANLAR (Yıldız almış olanlar)
            const stat = puzzleStats[puzzleId]
            if (stat && stat.stars > 0) {
                map[i] = true
                maxIdx = Math.max(maxIdx, i)
            }

            // 2. DEVAM EDENLER (savedStates'te olanlar)
            const saved = savedStates[puzzleId]
            if (saved && !map[i]) {
                const puzzle = (puzzles as any[]).find(p => p.id === puzzleId)
                if (puzzle) {
                    const initialCount = puzzle.initialBoard.filter((v: number) => v !== 0).length
                    const currentCount = saved.grid.filter((v: number) => v !== 0).length
                    const totalToFill = 81 - initialCount
                    const filledByPlayer = currentCount - initialCount
                    if (totalToFill > 0) {
                        progressMap[i] = Math.max(0, Math.floor((filledByPlayer / totalToFill) * 100))
                    }
                }
            }
        }
        return { maxCompletedIndex: maxIdx, statsMap: map, chapterProgress: progressMap }
    }, [puzzleStats, savedStates, diffMode])

    // "Mevcut + sonraki 2: aktif" -> maxCompletedIndex + 3'e kadar açık
    const getLevelStatus = (i: number) => {
        const isCompleted = statsMap[i]
        const progress = chapterProgress[i]
        const isUnlocked = i <= maxCompletedIndex + 3
        return { isCompleted, isUnlocked, progress }
    }

    return (
        <ScreenTransition className="flex flex-col h-full bg-[var(--surface-bg)]">
            <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto">
                <header className="flex items-center gap-4 pt-2" style={{ paddingTop: '5%' }}>
                    <button className="btn btn-ghost px-3 py-2 rounded-full backdrop-blur-md"
                        onClick={() => navigate(-1)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">
                            {label}
                        </h1>
                        <p className="text-xs text-indigo-300 font-medium tracking-wider uppercase">{t.game.chapters}</p>
                    </div>
                </header>

                <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 30 }, (_, i) => {
                        const { isCompleted, isUnlocked, progress } = getLevelStatus(i)

                        return (
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.02, duration: 0.3 }}
                                key={i}
                                disabled={!isUnlocked || isCompleted}
                                id={`btn-chapter-${i + 1}`}
                                onClick={() => navigate(`/game/${diffMode}/${i + 1}`)}
                                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center font-bold text-xl transition-all ${isCompleted
                                    ? 'bg-white/5 text-emerald-400 border-2 border-emerald-500/40 opacity-80 cursor-default'
                                    : isUnlocked
                                        ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg active:scale-90 hover:scale-[1.03] border border-white/20'
                                        : 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                                    }`}
                            >
                                {isCompleted ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="Tour Checkmark bg-emerald-500 rounded-full p-1 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-tighter opacity-70">{t.game.completedLabel}</span>
                                    </div>
                                ) : isUnlocked ? (
                                    <div className=" flex flex-col items-center justify-center w-full h-full">
                                        <span className={progress > 0 ? "mb-2" : ""}>{i + 1}</span>
                                        {(
                                            <div className="h-5 absolute inset-x-0 bottom-0 py-1.5 bg-black/30 backdrop-blur-md border-t border-white/10 rounded-b-2xl flex items-center justify-center">
                                                <span className="text-[10px] font-black leading-none text-cyan-300 drop-shadow-sm">%{progress}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                )}
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </ScreenTransition>
    )
}
