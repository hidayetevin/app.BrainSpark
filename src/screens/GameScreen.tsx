import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'

/**
 * GameScreen – Oyun Ekranı
 * PROMPT 3–4'te tam Sudoku grid, klavye ve mekanikler eklencek.
 * PROMPT 9'da back button onay modalı buraya bağlanacak.
 */
export default function GameScreen() {
    const navigate = useNavigate()
    const { difficulty, chapter } = useParams<{ difficulty: string; chapter: string }>()

    // Back button onay modalı event dinleyicisi (PROMPT 9'da gerçek modal ile değişecek)
    useEffect(() => {
        const handleBackOnGame = (e: Event) => {
            const { onConfirm, onCancel } = (e as CustomEvent).detail as {
                onConfirm: () => void
                onCancel: () => void
            }

            // Şimdilik window.confirm kullanıyoruz (PROMPT 9'da native modal ile değişecek)
            const confirmed = window.confirm('Oyunu bırakmak istiyor musunuz? İlerlemeniz kaydedilecektir.')
            if (confirmed) {
                onConfirm()
            } else {
                onCancel()
            }
        }

        window.addEventListener('app:back-on-game', handleBackOnGame)
        return () => window.removeEventListener('app:back-on-game', handleBackOnGame)
    }, [])

    // Resume event (uygulama ön plana döndüğünde)
    useEffect(() => {
        const handleResume = () => {
            // TODO (PROMPT 3): useGameStore.getState().setPaused(true)
            console.log('[GameScreen] App resumed on game screen — show pause overlay')
        }

        window.addEventListener('app:resume-on-game', handleResume)
        return () => window.removeEventListener('app:resume-on-game', handleResume)
    }, [])

    return (
        <ScreenTransition>
            <div className="flex flex-col h-full p-4 gap-4">
                {/* Header */}
                <header className="flex items-center justify-between pt-2">
                    <button id="btn-back-game" className="btn btn-ghost px-3 py-2"
                        onClick={() => navigate(-1)}>
                        ←
                    </button>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {difficulty === 'easy' ? 'Kolay' : difficulty === 'medium' ? 'Orta' : 'Zor'} – Bölüm {chapter}
                    </span>
                    <div className="flex gap-2">
                        <span>❤️ 3</span>
                        <span>💡</span>
                    </div>
                </header>

                {/* Grid placeholder */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="grid grid-cols-9 gap-0 border-2"
                        style={{ borderColor: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                        {Array.from({ length: 81 }, (_, i) => (
                            <div key={i}
                                className="w-9 h-9 flex items-center justify-center text-sm font-medium"
                                style={{
                                    borderRight: (i + 1) % 9 !== 0 ? '1px solid var(--surface-border)' : 'none',
                                    borderBottom: Math.floor(i / 9) < 8 ? '1px solid var(--surface-border)' : 'none',
                                    borderRightColor: (i + 1) % 3 === 0 && (i + 1) % 9 !== 0 ? 'var(--surface-border)' : undefined,
                                }}>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keyboard placeholder */}
                <div className="grid grid-cols-9 gap-2 pb-2">
                    {Array.from({ length: 9 }, (_, i) => (
                        <button key={i}
                            id={`btn-num-${i + 1}`}
                            className="btn btn-ghost p-0 h-12 text-lg font-bold"
                            style={{ minWidth: 0 }}>
                            {i + 1}
                        </button>
                    ))}
                </div>

                <p className="text-center text-xs pb-2" style={{ color: 'var(--text-muted)' }}>
                    Tam Sudoku grid &amp; mekanikler PROMPT 3–4'te eklenecek
                </p>
            </div>
        </ScreenTransition>
    )
}
