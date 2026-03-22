import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/locales/i18n'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface HintModalProps {
    isOpen: boolean
    onClose: () => void
    onWatchAd: () => void
    onSpendCoins: () => void
    coins: number
}

export function HintModal({ isOpen, onClose, onWatchAd, onSpendCoins, coins }: HintModalProps) {
    const { t } = useTranslation()
    const [showCoinBtn, setShowCoinBtn] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setShowCoinBtn(false)
            const timer = setTimeout(() => {
                setShowCoinBtn(true)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        style={{ padding: '1rem' }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        className="glass-strong rounded-[2.5rem] p-8 flex flex-col items-center max-w-sm w-full shadow-2xl border border-indigo-500/20 relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div style={{ marginTop: '1rem' }} className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6">
                            <span className="text-5xl drop-shadow-lg">💡</span>
                        </div>

                        <h2 style={{ marginTop: '1rem' }} className="text-2xl font-black text-white mb-2 text-center leading-tight">
                            {t.game.hintModalTitle}
                        </h2>

                        <p className="text-slate-400 text-center text-sm font-medium mb-2 leading-relaxed px-2">
                            {t.game.hintModalDesc}
                        </p>

                        <div style={{ marginTop: '1rem', height: '2rem', padding: '1rem' }} className="flex items-center gap-1.5 mb-8 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bakiye:</span>
                            <span className="text-sm font-black text-amber-300">💎 {coins}</span>
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            {/* AD BUTTON */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ height: '3rem', marginTop: '1rem' }}
                                onClick={onWatchAd}
                                className="w-full  py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                {t.game.watchAdLabel}
                            </motion.button>

                            {/* COIN BUTTON */}
                            <button
                                onClick={onSpendCoins}
                                disabled={!showCoinBtn}
                                style={{ height: '3rem', marginTop: '.5rem' }}
                                className={`w-full rounded-2xl glass-strong border border-white/10 text-amber-300 font-black text-lg transition-all flex items-center justify-center gap-2 ${!showCoinBtn ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:scale-[1.01] active:scale-95'
                                    }`}
                            >
                                <span className="text-xl">💎</span>
                                {t.game.spendCoinsLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
