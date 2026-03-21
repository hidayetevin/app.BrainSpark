import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Ekran geçiş animasyonu:
 * - Giriş: sağdan sola (x: 100% → 0)
 * - Çıkış: sola doğru (x: 0 → -30%)
 * - Süre: 250ms ease-out
 */
const screenVariants: Variants = {
    initial: {
        x: '100%',
        opacity: 0,
    },
    animate: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.25,
            ease: 'easeOut',
        },
    },
    exit: {
        x: '-30%',
        opacity: 0,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
        },
    },
}

interface ScreenTransitionProps {
    children: ReactNode
    className?: string
}

/**
 * ScreenTransition — Her ekranı sayan animasyonlu wrapper bileşen.
 * AnimatePresence ile birlikte çalışır; her route değişiminde
 * mevcut ekran sola kayarken yeni ekran sağdan girer.
 */
export default function ScreenTransition({ children, className = '' }: ScreenTransitionProps) {
    return (
        <motion.div
            className={`screen ${className}`}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {children}
        </motion.div>
    )
}
