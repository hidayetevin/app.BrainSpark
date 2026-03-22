import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { useTranslation } from '@/locales/i18n'

export default function DailyScreen() {
    const navigate = useNavigate()
    const { streak, lastChallengeClaimDate } = useGameStore()
    const { t } = useTranslation()
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date()
            const midnight = new Date(now)
            midnight.setHours(24, 0, 0, 0)
            const remaining = midnight.getTime() - now.getTime()

            const hours = Math.floor(remaining / 3600000)
            const minutes = Math.floor((remaining % 3600000) / 60000)
            const seconds = Math.floor((remaining % 60000) / 1000)

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }

        updateTimer()
        const intv = setInterval(updateTimer, 1000)
        return () => clearInterval(intv)
    }, [])

    const todayObj = new Date()
    const todayStr = `${todayObj.getFullYear()}-${(todayObj.getMonth() + 1).toString().padStart(2, '0')}-${todayObj.getDate().toString().padStart(2, '0')}`
    const isCompletedToday = lastChallengeClaimDate === todayStr

    return (
        <ScreenTransition className="flex flex-col h-full bg-[var(--surface-bg)] px-6 pb-20">
            <div className="flex flex-col h-full gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600 rounded-full blur-[100px] opacity-20" />

                <header className="flex items-center gap-4 pt-2 z-10" style={{ paddingTop: '5%' }}>
                    <button className="btn btn-ghost px-3 py-2 rounded-full backdrop-blur-md"
                        onClick={() => navigate(-1)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-fuchsia-400 to-orange-400 text-transparent bg-clip-text truncate">{t.daily.title}</h1>
                </header>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-strong rounded-[2rem] p-8 flex flex-col items-center gap-8 mt-4 z-10 relative overflow-hidden shadow-2xl border border-white/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <div className="flex flex-col items-center text-center">
                        <span className="text-6xl mb-4 drop-shadow-2xl">🌍</span>
                        <h2 className="text-3xl font-black text-white">{t.daily.puzzleTitle}</h2>
                        <p className="text-sm text-indigo-300 font-medium mt-2 tracking-wide uppercase">
                            {todayObj.toLocaleDateString(t.daily.locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                            <span className="text-3xl mb-1">{streak > 0 ? '🔥' : '🧊'}</span>
                            <span className="text-2xl font-black text-white">{streak}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-center">{t.daily.streakLabel}</span>
                        </div>

                        <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                            <span className="text-3xl mb-1">⏳</span>
                            <span className="text-xl font-mono font-bold text-orange-400">{timeLeft}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-center">{t.daily.resetLabel}</span>
                        </div>
                    </div>

                    {isCompletedToday ? (
                        <div className="w-full py-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-center font-bold flex flex-col items-center gap-2">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {t.daily.claimedMessage}
                        </div>
                    ) : (
                        <button
                            style={{ height: '3rem' }}
                            className="w-full py-5 rounded-3xl bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white font-black text-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                            onClick={() => navigate('/game/daily/1')}
                        >
                            {t.daily.startChallenge}
                        </button>
                    )}
                </motion.div>

                <p className="text-center text-xs text-slate-500 mt-auto px-4 z-10 font-medium">
                    {t.daily.footerNote}
                </p>
            </div>
        </ScreenTransition>
    )
}
