import { useNavigate, useParams } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'

/**
 * ChaptersScreen – Bölüm Seçim Ekranı
 * PROMPT 8'de tam tasarım (4'lü grid, kilitleme mantığı) gelecek.
 */
export default function ChaptersScreen() {
    const navigate = useNavigate()
    const { difficulty } = useParams<{ difficulty: string }>()

    const label = difficulty === 'easy' ? 'Kolay' : difficulty === 'medium' ? 'Orta' : 'Zor'

    return (
        <ScreenTransition>
            <div className="flex flex-col h-full p-6 gap-6">
                <header className="flex items-center gap-3 pt-2">
                    <button id="btn-back-chapters" className="btn btn-ghost px-3 py-2"
                        onClick={() => navigate(-1)}>
                        ← Geri
                    </button>
                    <h1 className="text-2xl font-bold">{label} – Bölümler</h1>
                </header>

                {/* 4x grid of chapters — full logic in PROMPT 8 */}
                <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 30 }, (_, i) => (
                        <button
                            key={i}
                            id={`btn-chapter-${i + 1}`}
                            className="glass aspect-square rounded-xl flex items-center justify-center font-bold text-lg"
                            onClick={() => navigate(`/game/${difficulty}/${i + 1}`)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </ScreenTransition>
    )
}
