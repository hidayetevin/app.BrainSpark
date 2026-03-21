import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { AudioService } from '@/services/AudioService'
import { useTranslation } from '@/locales/i18n'

export default function HomeScreen() {
    const navigate = useNavigate()
    const { savedState } = useGameStore()
    const { t } = useTranslation()

    const handleNav = (path: string) => {
        AudioService.playClick()
        navigate(path)
    }

    return (
        <ScreenTransition className="flex flex-col items-center justify-center h-full bg-[var(--surface-bg)] relative overflow-hidden">
            {/* Arka plan efektleri (Ambient glow) */}
            <div className="absolute top-10 -left-10 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20" />
            <div className="absolute bottom-10 -right-10 w-64 h-64 bg-cyan-600 rounded-full blur-[100px] opacity-20" />

            <div className="flex flex-col items-center justify-center p-6 w-full z-10 gap-10">
                {/* Logo Section */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)] border border-white/20 relative overflow-hidden bg-slate-900/40 backdrop-blur-md">
                        <img src="/logo.png" alt="Brain Spark Logo" className="w-full h-full object-cover scale-110" />
                        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-indigo-200 via-white to-cyan-300 text-transparent bg-clip-text drop-shadow-sm mb-1">
                            Brain Spark
                        </h1>
                        <p className="text-sm text-indigo-200/80 font-medium tracking-wide">
                            {t.home.subtitle}
                        </p>
                    </div>
                </motion.div>

                {/* Nav Buttons */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: {
                            opacity: 1, y: 0,
                            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                        }
                    }}
                    className="flex flex-col w-full max-w-[18rem] gap-4"
                >
                    {savedState && (
                        <motion.button
                            variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                            whileTap={{ scale: 0.95 }}
                            id="btn-resume"
                            className="relative w-full py-4 text-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 overflow-hidden group"
                            style={{ padding: '.8rem' }}
                            onClick={() => handleNav(`/game/${savedState.difficulty}/${savedState.chapter}`)}
                        >
                            <div className="absolute inset-0 bg-white/30 translate-y-8 group-hover:translate-y-0 transition-transform blur-md" />
                            <span className="relative z-10 flex items-center gap-2">{t.home.resume}</span>
                        </motion.button>
                    )}

                    <motion.button
                        variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                        whileTap={{ scale: 0.95 }}
                        id="btn-play"
                        style={{ padding: '.8rem' }}
                        className="w-full py-4 text-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        onClick={() => handleNav('/levels')}
                    >
                        {t.home.newGame}
                    </motion.button>

                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                            whileTap={{ scale: 0.95 }}
                            id="btn-daily"
                            className="glass-strong flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors text-orange-300"
                            onClick={() => handleNav('/daily')}
                        >
                            <span className="text-2xl drop-shadow-md">📅</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 whitespace-pre">{t.home.dailyChallenge}</span>
                        </motion.button>

                        <motion.button
                            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                            whileTap={{ scale: 0.95 }}
                            id="btn-how-to-play"
                            className="glass-strong flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors text-emerald-300"
                            onClick={() => handleNav('/how-to-play')}
                        >
                            <span className="text-2xl drop-shadow-md">📖</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t.home.tutorial}</span>
                        </motion.button>
                    </div>

                    <motion.button
                        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                        whileTap={{ scale: 0.95 }}
                        id="btn-settings"
                        style={{ padding: '1rem' }}
                        className="glass-strong flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors text-slate-300"
                        onClick={() => handleNav('/settings')}
                    >
                        <span className="text-xl">⚙️</span>
                        <span className="font-bold">{t.home.settings}</span>
                    </motion.button>
                </motion.div>

                <p className="text-center text-[10px] text-slate-500 font-medium pb-2 opacity-50">
                    Brain Spark v1.0.0
                </p>
            </div>
        </ScreenTransition>
    )
}
