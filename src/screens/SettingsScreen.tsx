import { useNavigate } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'

/**
 * SettingsScreen – Ayarlar Ekranı
 * TR/EN dil, Ses/Titreşim, Font boyutu, Dark Mode, Error Highlight
 * PROMPT 8'de tam implementasyon gelecek.
 */
export default function SettingsScreen() {
    const navigate = useNavigate()

    return (
        <ScreenTransition>
            <div className="flex flex-col h-full p-6 gap-6">
                <header className="flex items-center gap-3 pt-2">
                    <button id="btn-back-settings" className="btn btn-ghost px-3 py-2"
                        onClick={() => navigate(-1)}>
                        ← Geri
                    </button>
                    <h1 className="text-2xl font-bold">⚙️ Ayarlar</h1>
                </header>

                <div className="flex flex-col gap-3">
                    {[
                        { label: 'Dil', value: 'Türkçe', id: 'setting-language' },
                        { label: 'Ses', value: '🔊 Açık', id: 'setting-sound' },
                        { label: 'Titreşim', value: '📳 Açık', id: 'setting-vibration' },
                        { label: 'Yazı Boyutu', value: 'Orta', id: 'setting-font-size' },
                        { label: 'Karanlık Mod', value: '🌙 Açık', id: 'setting-dark-mode' },
                        { label: 'Hata Vurgusu', value: '✅ Açık', id: 'setting-error-highlight' },
                    ].map(item => (
                        <div key={item.id} id={item.id}
                            className="glass flex justify-between items-center p-4 rounded-xl">
                            <span className="font-medium">{item.label}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.value}</span>
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Tam ayarlar PROMPT 8'de eklenecek
                </p>
            </div>
        </ScreenTransition>
    )
}
