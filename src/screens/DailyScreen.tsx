import { useNavigate } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'

/**
 * DailyScreen – Günlük Bulmaca Ekranı
 * Streak, kalan süre, anti-cheat zaman sistemi PROMPT 7'de eklenecek.
 */
export default function DailyScreen() {
    const navigate = useNavigate()

    // Gece yarısına kalan süreyi basitçe hesapla
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const remaining = midnight.getTime() - now.getTime()
    const hh = String(Math.floor(remaining / 3600000)).padStart(2, '0')
    const mm = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')

    return (
        <ScreenTransition>
            <div className="flex flex-col h-full p-6 gap-6">
                <header className="flex items-center gap-3 pt-2">
                    <button id="btn-back-daily" className="btn btn-ghost px-3 py-2"
                        onClick={() => navigate(-1)}>
                        ← Geri
                    </button>
                    <h1 className="text-2xl font-bold">📅 Günlük Bulmaca</h1>
                </header>

                <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
                    <div className="text-5xl">🧩</div>
                    <h2 className="text-xl font-bold">Bugünün Bulmacası</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>

                    {/* Kalan Süre */}
                    <div className="glass rounded-xl px-6 py-3 text-center">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Yenilenmesine</p>
                        <p className="text-2xl font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
                            {hh}:{mm}
                        </p>
                    </div>

                    {/* Streak */}
                    <div id="streak-display" className="flex items-center gap-2 text-lg font-bold">
                        🔥 <span id="streak-count">0</span> günlük seri
                    </div>
                </div>

                <button id="btn-start-daily" className="btn btn-primary"
                    onClick={() => navigate('/game/daily/1')}>
                    Başla 🚀
                </button>

                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Streak sistemi ve anti-cheat PROMPT 7'de eklenecek
                </p>
            </div>
        </ScreenTransition>
    )
}
