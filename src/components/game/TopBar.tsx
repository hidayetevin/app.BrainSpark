import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { ArrowLeftIcon, HeartIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { motion } from 'framer-motion'

export function TopBar() {
    const navigate = useNavigate()
    const { difficulty, chapter, lives, elapsedTime, isPaused, setPaused } = useGameStore()

    // Saniye → MM:SS formatı
    const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0')
    const s = (elapsedTime % 60).toString().padStart(2, '0')

    const diffStr = difficulty === 'easy' ? 'Kolay' : difficulty === 'medium' ? 'Orta' : 'Zor'

    // Back Button -> Confirm Modal veya Quit (Şimdilik geçici window.confirm, PROMPT 9'da değişecek)
    const handleBack = () => {
        // app:back-on-game eventi dinleyicisi GameScreen'de (önceden yazdık)
        const event = new CustomEvent('app:back-on-game', {
            detail: {
                onConfirm: () => {
                    // Oyunu kaydet ve çık
                    useGameStore.getState().saveGame()
                    navigate('/')
                },
                onCancel: () => { },
            }
        })
        window.dispatchEvent(event)
    }

    return (
        <header className="flex flex-col gap-2 p-3 sm:p-4 mb-2 z-10 w-full max-w-md mx-auto" style={{ paddingTop: '5%' }}>
            <div className="flex items-center justify-between">

                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="btn btn-ghost px-2 py-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)] active:scale-95"
                    aria-label="Geri"
                >
                    <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Title */}
                <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-wide">
                        {diffStr} - Bölüm {chapter}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-muted)] font-mono tracking-wider">
                        {m}:{s}
                    </span>
                </div>

                {/* Stats & Pause */}
                <div className="flex items-center gap-3">
                    {/* Lives (Hearts) */}
                    <div className="tour-step-lives flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <HeartIcon
                                key={i}
                                className={clsx(
                                    "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                                    i < lives ? "text-red-500" : "text-gray-500/30"
                                )}
                            />
                        ))}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPaused(!isPaused)}
                        className="btn btn-ghost px-2 py-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)]"
                        aria-label="Pause"
                    >
                        {isPaused ? <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </motion.button>
                </div>

            </div>
        </header>
    )
}
