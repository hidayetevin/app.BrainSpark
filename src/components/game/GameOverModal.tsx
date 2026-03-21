import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdManager } from '@/services/AdManager'
import { useTranslation } from '@/locales/i18n'

interface GameOverModalProps {
    isVisible: boolean
    onRestart: () => void
    onHome: () => void
    onRevive: () => void // e.g. setLives(1)
}

export function GameOverModal({ isVisible, onRestart, onHome, onRevive }: GameOverModalProps) {
    const { t } = useTranslation()
    // 2 Saniye kuralı için state
    const [showSkipButtons, setShowSkipButtons] = useState(false)
    const [adFailed, setAdFailed] = useState(false)
    const [adLoading, setAdLoading] = useState(false)

    // Modal açıldığında zamanlayıcı başlat
    useEffect(() => {
        if (isVisible) {
            setShowSkipButtons(false)
            setAdFailed(false)
            setAdLoading(false)

            const timer = setTimeout(() => {
                setShowSkipButtons(true)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [isVisible])

    const handleWatchAd = async () => {
        if (adLoading) return
        setAdLoading(true)
        setAdFailed(false)

        try {
            // Ödüllü reklam göster (showRewarded PROMPT 6'da hazırlandı)
            const success = await AdManager.showRewarded()
            if (success) {
                // Reklam başarıyla izlendi, oyuncuyu canlandır
                onRevive()
            } else {
                // Reklam yüklenemedi veya kapandı
                setAdFailed(true)
                setShowSkipButtons(true) // Reklam basarisizsa butonlari aninda dök
            }
        } catch (e) {
            setAdFailed(true)
            setShowSkipButtons(true)
        } finally {
            setAdLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-10 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        style={{ margin: '1rem', padding: '1rem' }}
                        className="glass-strong rounded-[2rem] p-8 flex flex-col items-center max-w-sm w-full shadow-2xl border border-rose-500/20"
                    >
                        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                            <span className="text-5xl">💔</span>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-2" style={{ marginTop: '1rem' }}>{t.game.gameOver}</h2>
                        <p className="text-center text-slate-300 font-medium mb-8" style={{ marginTop: '0.5rem' }}>
                            {t.game.gameOverMessage} {adFailed ? t.game.adFailed : t.game.pesEtmekYok}
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            {!adFailed && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleWatchAd}
                                    disabled={adLoading}
                                    style={{ height: '4rem', marginTop: '1rem' }}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {adLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>{t.game.revive}</>
                                    )}
                                </motion.button>
                            )}

                            <AnimatePresence>
                                {showSkipButtons && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="flex flex-col gap-3 overflow-hidden"
                                    >
                                        <button
                                            onClick={onRestart}
                                            style={{ height: '3rem' }}
                                            className="w-full py-4 rounded-2xl glass border border-white/10 text-slate-200 font-bold hover:bg-white/5 transition-colors"
                                        >
                                            {t.game.restart}
                                        </button>
                                        <button
                                            onClick={onHome}
                                            style={{ height: '3rem' }}
                                            className="w-full py-4 rounded-2xl glass border border-white/10 text-rose-400 font-bold hover:bg-white/5 transition-colors"
                                        >
                                            {t.game.menu}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
