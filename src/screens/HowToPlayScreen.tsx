import { useNavigate } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'

/**
 * HowToPlayScreen – Nasıl Oynanır / Tutorial Ekranı
 * 4 adımlı spotlight tutorial PROMPT 9'da eklenecek.
 */
export default function HowToPlayScreen() {
    const navigate = useNavigate()

    const steps = [
        { emoji: '🔢', title: 'Grid Yapısı', desc: '9x9 hücreden oluşan grid. Her hücreye 1–9 arası bir sayı yerleştirilir.' },
        { emoji: '↔️', title: 'Satır / Sütun / Blok', desc: 'Aynı satır, sütun veya 3x3 blokta bir sayı tekrar edemez.' },
        { emoji: '✏️', title: 'Not Alma Modu', desc: 'Aday sayıları not olarak işaretleyip ilerleyin.' },
        { emoji: '❤️', title: 'Can Sistemi', desc: '3 canınız var. Her hatalı girişte 1 can kaybedersiniz.' },
    ]

    return (
        <ScreenTransition>
            <div className="flex flex-col h-full p-6 gap-6">
                <header className="flex items-center gap-3 pt-2">
                    <button id="btn-back-howto" className="btn btn-ghost px-3 py-2"
                        onClick={() => navigate(-1)}>
                        ← Geri
                    </button>
                    <h1 className="text-2xl font-bold">📖 Nasıl Oynanır</h1>
                </header>

                <div className="flex flex-col gap-4">
                    {steps.map((step, i) => (
                        <div key={i} id={`howto-step-${i + 1}`}
                            className="glass p-4 rounded-xl flex gap-4 items-start">
                            <span className="text-2xl mt-1">{step.emoji}</span>
                            <div>
                                <p className="font-bold mb-1">{step.title}</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button id="btn-start-playing" className="btn btn-primary mt-auto"
                    onClick={() => navigate('/levels')}>
                    Oynamaya Başla 🚀
                </button>
            </div>
        </ScreenTransition>
    )
}
