import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'

/**
 * HomeScreen – Ana Ekran
 * PROMPT 8'de tam tasarım gelecek.
 */
export default function HomeScreen() {
    const navigate = useNavigate()

    return (
        <ScreenTransition>
            <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                        🧩
                    </div>
                    <h1 className="text-4xl font-black tracking-tight"
                        style={{ background: 'linear-gradient(135deg, #818cf8, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Brain Spark
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Zihninizi zorlayan Sudoku deneyimi
                    </p>
                </motion.div>

                {/* Nav Buttons */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col w-full max-w-xs gap-3"
                >
                    <button id="btn-play" className="btn btn-primary w-full py-4 text-lg"
                        onClick={() => navigate('/levels')}>
                        🎮 Oyna
                    </button>
                    <button id="btn-daily" className="btn btn-ghost w-full"
                        onClick={() => navigate('/daily')}>
                        📅 Günlük Bulmaca
                    </button>
                    <button id="btn-how-to-play" className="btn btn-ghost w-full"
                        onClick={() => navigate('/how-to-play')}>
                        📖 Nasıl Oynanır
                    </button>
                    <button id="btn-settings" className="btn btn-ghost w-full"
                        onClick={() => navigate('/settings')}>
                        ⚙️ Ayarlar
                    </button>
                </motion.div>
            </div>
        </ScreenTransition>
    )
}
