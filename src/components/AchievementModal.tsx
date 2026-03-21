import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import mockLottie from '@/constants/mock-lottie.json'

interface AchievementModalProps {
    isOpen: boolean
    milestone: number // 3, 7, veya 30
    onClose: () => void
}

export function AchievementModal({ isOpen, milestone, onClose }: AchievementModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full"
                    >
                        {/* LOTTIE ANIMASYONU (PROMPT 7 GEREKSİNİMİ) */}
                        <div className="w-40 h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            {/* Gerçek bir Lottie JSON'u olsaydı burada render edilecekti */}
                            <Lottie
                                animationData={mockLottie}
                                loop={true}
                                className="w-full h-full"
                            />
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-transparent bg-clip-text">
                                MUHTEŞEM!
                            </h2>
                            <p className="mt-2 text-lg text-gray-700 dark:text-gray-300">
                                {milestone} GÜN STREAK YAPTIN!
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Sen bir dâhisin, her gün devam et🏆
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="btn btn-primary w-full py-3 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                        >
                            TEŞEKKÜRLER!
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
