import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { AudioService } from '@/services/AudioService'
import { useTranslation } from '@/locales/i18n'

interface LevelCompleteModalProps {
    isVisible: boolean
    stars: number
    elapsedTime: number
    mistakes: number
    onNextLevel: () => void
    onHome: () => void
}

export function LevelCompleteModal({
    isVisible,
    stars,
    elapsedTime,
    mistakes,
    onNextLevel,
    onHome,
}: LevelCompleteModalProps) {
    const { t } = useTranslation()
    const [animatedStars, setAnimatedStars] = useState(0)

    useEffect(() => {
        if (isVisible) {
            // Animasyon sıfırlama
            setAnimatedStars(0)

            // Konfeti ve ses
            setTimeout(() => {
                AudioService.playSuccess()
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#34d399', '#fcd34d', '#38bdf8', '#f472b6']
                })
            }, 300)

            // Yıldızları animasyonla doldur
            let count = 0
            const starIntv = setInterval(() => {
                if (count < stars) {
                    count++
                    setAnimatedStars(count)
                } else {
                    clearInterval(starIntv)
                }
            }, 400) // Her yıldız arasında 400ms bekle

            return () => clearInterval(starIntv)
        }
    }, [isVisible, stars])

    const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0')
    const s = (elapsedTime % 60).toString().padStart(2, '0')

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-10 bg-black/70 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 100 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: -50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="glass-strong rounded-[2.5rem] p-8 flex flex-col items-center max-w-sm w-full shadow-[0_0_50px_rgba(252,211,77,0.2)] border border-amber-500/20"
                    >
                        <h2 className="text-4xl font-black bg-gradient-to-r from-amber-200 to-yellow-500 text-transparent bg-clip-text mb-6">
                            {t.game.excellent}
                        </h2>

                        {/* Stars Container */}
                        <div className="flex items-center gap-4 mb-8">
                            {[1, 2, 3].map((starIdx) => (
                                <motion.div
                                    key={starIdx}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: animatedStars >= starIdx ? [0, 1.4, 1] : 1 }}
                                    transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                                    className={`text-5xl drop-shadow-[0_0_15px_rgba(252,211,77,0.5)] ${animatedStars >= starIdx ? 'text-amber-400' : 'text-slate-700/50'
                                        }`}
                                >
                                    ★
                                </motion.div>
                            ))}
                        </div>

                        {/* Stats Panel */}
                        <div className="grid grid-cols-2 gap-4 w-full mb-8">
                            <div className="glass flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5">
                                <span className="text-3xl mb-1">⏱️</span>
                                <span className="text-xl font-bold text-slate-200">{m}:{s}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{t.game.time}</span>
                            </div>
                            <div className="glass flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5">
                                <span className="text-3xl mb-1">❌</span>
                                <span className="text-xl font-bold text-slate-200">{mistakes}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{t.game.mistakes}</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 w-full">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onNextLevel}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-all"
                            >
                                {t.game.nextLevel}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onHome}
                                className="w-full py-4 rounded-2xl glass-strong border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-colors"
                            >
                                {t.game.menu}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
