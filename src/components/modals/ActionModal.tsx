import { motion, AnimatePresence } from 'framer-motion'

interface ActionModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel?: () => void
    type?: 'default' | 'danger'
}

/**
 * ActionModal — Oyun içindeki onay ve duraklatma pencereleri için
 * Premium Glassmorphism tasarımlı merkezi modal bileşeni.
 */
export function ActionModal({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    type = 'default'
}: ActionModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10" style={{ margin: '1rem' }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ padding: '1rem' }}
                        className="relative w-full max-w-sm glass-strong rounded-[2.5rem] p-8 shadow-2xl border border-white/10 overflow-hidden"
                    >
                        {/* Decorative Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px]" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            {/* Icon Placeholder or Decoration */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-white/5">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight" style={{ marginTop: '1rem' }}>
                                {title}
                            </h3>

                            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 px-2">
                                {message}
                            </p>

                            <div className="flex flex-col gap-3 w-full" style={{ marginTop: '1rem' }}>
                                <button
                                    onClick={onConfirm}
                                    className={`btn w-full py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all ${type === 'danger'
                                        ? 'bg-red-500/80 text-white shadow-red-500/20'
                                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/30'
                                        }`}
                                >
                                    {confirmLabel}
                                </button>

                                {cancelLabel && (
                                    <button
                                        onClick={onCancel}
                                        className="btn w-full py-4 rounded-2xl font-bold text-slate-300 glass hover:bg-white/5 active:scale-95 transition-all"
                                    >
                                        {cancelLabel}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
