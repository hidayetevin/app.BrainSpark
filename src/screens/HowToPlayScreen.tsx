import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { useTranslation } from '@/locales/i18n'

export default function HowToPlayScreen() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const steps = [
        { emoji: '💡', title: t.howto.logicTitle, desc: t.howto.logicDesc },
        { emoji: '🔎', title: t.howto.noteTitle, desc: t.howto.noteDesc },
        { emoji: '❤️', title: t.howto.limitTitle, desc: t.howto.limitDesc },
        { emoji: '🔥', title: t.howto.streakTitle, desc: t.howto.streakDesc }
    ]

    return (
        <ScreenTransition className="flex flex-col h-full bg-[var(--surface-bg)]">
            <div className="flex flex-col h-full p-6 pb-12 gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-10" />

                <header className="flex items-center gap-4 pt-2 z-10" style={{ paddingTop: '5%' }}>
                    <button className="btn btn-ghost px-3 py-2 rounded-full backdrop-blur-md"
                        onClick={() => navigate(-1)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-3xl font-black tracking-tight text-white">{t.howto.title}</h1>
                </header>

                <div className="flex flex-col gap-5 z-10 overscroll-contain">
                    {steps.map((step, i) => (
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            key={i}
                            id={`howto-step-${i + 1}`}
                            className="glass-strong p-5 rounded-[1.5rem] flex gap-5 items-center border border-emerald-500/10"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <span className="text-3xl drop-shadow-lg">{step.emoji}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-emerald-300 mb-1">{step.title}</h3>
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-auto flex flex-col gap-3 w-full z-10">
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{ height: '3rem' }}
                        className="w-full py-4 rounded-2xl glass border border-white/20 text-emerald-300 font-bold text-lg hover:bg-white/5 active:scale-95 transition-all text-center"
                        onClick={() => {
                            useGameStore.getState().updateSettings({ hasSeenTutorial: false })
                            navigate('/game/easy/1', { replace: true })
                        }}
                    >
                        {t.howto.interactive}
                    </motion.button>

                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        style={{ height: '3rem' }}
                        id="btn-start-playing"
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-center"
                        onClick={() => navigate('/levels')}
                    >
                        {t.howto.adventure}
                    </motion.button>
                </div>
            </div>
        </ScreenTransition>
    )
}
