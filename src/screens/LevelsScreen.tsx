import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { AudioService } from '@/services/AudioService'
import { useTranslation } from '@/locales/i18n'

export default function LevelsScreen() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { puzzleStats } = useGameStore()

    const handleNav = (path: string) => {
        AudioService.playClick()
        if (typeof path === 'string') navigate(path)
        else navigate(-1) // handle navigate(-1)
    }

    const progress = useMemo(() => {
        const counts = { easy: 0, medium: 0, hard: 0 }
        Object.entries(puzzleStats).forEach(([id, stat]) => {
            if (stat && stat.stars > 0) {
                const diff = id.split('_')[0] as keyof typeof counts
                if (counts[diff] !== undefined) counts[diff]++
            }
        })
        return counts
    }, [puzzleStats])

    const levels = [
        { id: 'easy', label: t.game.easy, color: 'from-emerald-400 to-emerald-600', emoji: '🌱', desc: t.levels.easyDesc },
        { id: 'medium', label: t.game.medium, color: 'from-amber-400 to-orange-500', emoji: '🔥', desc: t.levels.mediumDesc },
        { id: 'hard', label: t.game.hard, color: 'from-rose-500 to-red-600', emoji: '⚡', desc: t.levels.hardDesc },
    ] as const

    const TOTAL_LEVELS = 30 // Her zorluk için 30 bulmaca var

    return (
        <ScreenTransition>
            <div className="flex flex-col h-full p-6 gap-8 overflow-y-auto">
                <header className="flex items-center gap-4 pt-2" style={{ paddingTop: '5%' }}>
                    <button className="btn btn-ghost px-3 py-2 rounded-full backdrop-blur-md"
                        onClick={() => handleNav(-1 as any)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-gray-400 text-transparent bg-clip-text">{t.levels.title}</h1>
                </header>

                <div className="flex flex-col gap-5">
                    {levels.map((level, idx) => {
                        const completed = progress[level.id]
                        const percent = Math.round((completed / TOTAL_LEVELS) * 100)

                        return (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.4 }}
                                key={level.id}
                                className="relative overflow-hidden glass-strong w-full text-left transition-transform active:scale-95 group"
                                style={{ borderRadius: 'var(--radius-xl)', padding: '5%' }}
                                onClick={() => handleNav(`/chapters/${level.id}`)}
                            >
                                {/* Arkaplan parlaklığı (Gradient glow) */}
                                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${level.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shadow-inner">
                                            {level.emoji}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-2xl text-white tracking-wide">{level.label}</h2>
                                            <p className="text-sm text-indigo-200 mt-1">{level.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-white">{percent}%</div>
                                        <div className="text-xs text-indigo-300 font-medium">{completed} / {TOTAL_LEVELS}</div>
                                    </div>
                                </div>

                                {/* Progress Bar Container */}
                                <div style={{ marginTop: '1rem' }} className="w-full h-2 bg-black/40 rounded-full overflow-hidden shrink-0 mt-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}

                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`h-full bg-gradient-to-r ${level.color}`}
                                    />
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </ScreenTransition>
    )
}
