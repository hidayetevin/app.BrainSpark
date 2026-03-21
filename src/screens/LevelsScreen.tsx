import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'
import { AdManager } from '@/services/AdManager'

/**
 * LevelsScreen – Zorluk Seçim Ekranı
 * Banner reklamı burada aktif olur ve padding ayarlanır.
 */
export default function LevelsScreen() {
    const navigate = useNavigate()

    useEffect(() => {
        AdManager.showBanner()
        return () => {
            AdManager.hideBanner()
        }
    }, [])

    const levels = [
        { id: 'easy', label: 'Kolay', emoji: '🟢', desc: '45–50 açık hücre' },
        { id: 'medium', label: 'Orta', emoji: '🟡', desc: '30–35 açık hücre' },
        { id: 'hard', label: 'Zor', emoji: '🔴', desc: '22–27 açık hücre' },
    ] as const

    return (
        <ScreenTransition>
            {/* Banner Ad için pb-14 eklendi */}
            <div className="flex flex-col h-full p-6 pb-20 gap-6">
                <header className="flex items-center gap-3 pt-2">
                    <button id="btn-back-levels" className="btn btn-ghost px-3 py-2"
                        onClick={() => navigate(-1)}>
                        ← Geri
                    </button>
                    <h1 className="text-2xl font-bold">Seviyeler</h1>
                </header>

                <div className="flex flex-col gap-4">
                    {levels.map(level => (
                        <button
                            key={level.id}
                            id={`btn-level-${level.id}`}
                            className="glass w-full p-5 rounded-xl flex items-center gap-4 text-left transition-all"
                            style={{ borderRadius: 'var(--radius-lg)' }}
                            onClick={() => navigate(`/chapters/${level.id}`)}
                        >
                            <span className="text-3xl">{level.emoji}</span>
                            <div>
                                <p className="font-bold text-lg">{level.label}</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{level.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </ScreenTransition>
    )
}
