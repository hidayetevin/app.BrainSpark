import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { AdManager } from '@/services/AdManager'
import { useTranslation } from '@/locales/i18n'

export default function SettingsScreen() {
    const navigate = useNavigate()
    const { settings, updateSettings } = useGameStore()
    const { t } = useTranslation()

    const toggleSetting = (key: keyof typeof settings) => {
        if (typeof settings[key] === 'boolean') {
            updateSettings({ [key]: !settings[key] })
        }
    }

    const toggleLanguage = () => {
        updateSettings({ language: settings.language === 'tr' ? 'en' : 'tr' })
    }

    return (
        <ScreenTransition className="flex flex-col h-full bg-[var(--surface-bg)] px-6 pb-20">
            <div className="flex flex-col h-full gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10" />

                <header className="flex items-center gap-4 pt-2 z-10" style={{ paddingTop: '5%' }}>
                    <button className="btn btn-ghost px-3 py-2 rounded-full backdrop-blur-md"
                        onClick={() => navigate(-1)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-3xl font-black tracking-tight text-white">{t.settings.title}</h1>
                </header>

                <div className="flex flex-col gap-4 z-10">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-2">{t.settings.general}</div>

                    <div style={{ padding: '1rem' }} className="glass-strong rounded-[2rem] p-2 flex flex-col gap-2 shadow-xl border border-white/5">
                        <SettingItem
                            label={t.settings.language}
                            value={settings.language === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                            onClick={toggleLanguage}
                        />
                        <SettingToggle
                            label={t.settings.sound}
                            checked={settings.soundEnabled}
                            onChange={() => toggleSetting('soundEnabled')}
                        />
                        <SettingToggle
                            label={t.settings.vibration}
                            checked={settings.vibrationEnabled}
                            onChange={() => toggleSetting('vibrationEnabled')}
                        />
                    </div>

                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-2 mt-4">{t.settings.gameplay}</div>

                    <div style={{ padding: '1rem' }} className="glass-strong rounded-[2rem] p-2 flex flex-col gap-2 shadow-xl border border-white/5">
                        <SettingToggle
                            label={t.settings.errorHighlight}
                            checked={settings.errorHighlight}
                            onChange={() => toggleSetting('errorHighlight')}
                        />
                        <SettingToggle
                            label={t.settings.darkMode}
                            checked={settings.darkMode}
                            onChange={() => toggleSetting('darkMode')}
                        />
                        <SettingItem
                            label={t.settings.fontSize}
                            value={settings.fontSize === 'small' ? 'Küçük' : settings.fontSize === 'medium' ? 'Orta' : 'Büyük'}
                            onClick={() => {
                                const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large']
                                const next = sizes[(sizes.indexOf(settings.fontSize) + 1) % sizes.length]
                                updateSettings({ fontSize: next })
                            }}
                        />
                    </div>
                    {/* 
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-2 mt-4">{t.settings.others}</div>

                    <div style={{ padding: '1rem' }} className="glass-strong rounded-[2rem] p-2 flex flex-col gap-2 shadow-xl border border-white/5">
                        <SettingItem
                            label={t.settings.restorePurchases}
                            value={t.settings.restoreButton}
                            onClick={() => {
                                AdManager.restorePurchases()
                                alert(t.settings.restoreAlert)
                            }}
                            highlight
                        />
                    </div> */}
                </div>

                <p className="text-center text-xs text-slate-500 font-medium mt-auto px-4 z-10">
                    Brain Spark v1.0.0
                </p>
            </div>
        </ScreenTransition>
    )
}

function SettingItem({ label, value, onClick, highlight = false }: any) {
    return (
        <button
            onClick={onClick}
            className="flex justify-between items-center px-4 py-4 rounded-2xl hover:bg-slate-800/50 active:scale-[0.98] transition-all text-left w-full"
        >
            <span className="font-semibold text-[1.05rem] text-slate-200">{label}</span>
            <span className={`font-medium ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{value}</span>
        </button>
    )
}

function SettingToggle({ label, checked, onChange }: any) {
    return (
        <button
            onClick={onChange}
            className="flex justify-between items-center px-4 py-4 rounded-2xl hover:bg-slate-800/50 active:scale-[0.98] transition-all text-left w-full"
        >
            <span className="font-semibold text-[1.05rem] text-slate-200">{label}</span>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                <motion.div
                    initial={false}
                    animate={{ x: checked ? 24 : 0 }}
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                />
            </div>
        </button>
    )
}
