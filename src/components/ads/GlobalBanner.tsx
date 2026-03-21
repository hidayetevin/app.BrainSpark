import { useEffect } from 'react'
import { AdManager } from '@/services/AdManager'
import { Capacitor } from '@capacitor/core'
import { useGameStore } from '@/stores/gameStore'

/**
 * GlobalBanner — AdMob Banner reklamını yöneten ve ekranın altında yer alan bileşen.
 * Uygulama genelinde Routes dışına yerleştirilir, böylece ekran değişimlerinde 
 * reklamın (banner) kapatılıp yeniden açılması ("flicking") önlenmiş olur.
 */
export function GlobalBanner() {
    const adsDisabled = useGameStore(state => state.adsDisabled)

    useEffect(() => {
        const syncBanner = async () => {
            if (!adsDisabled) {
                // Native platformda AdMob bannerını başlatır
                await AdManager.showBanner()
            } else {
                // IAP ile reklamlar kaldırıldıysa bannerı gizler
                await AdManager.hideBanner()
            }
        }
        void syncBanner()
    }, [adsDisabled])

    // Reklamlar kaldırıldıysa hiçbir şey render etme (alanı serbest bırakır)
    if (adsDisabled) return null

    /**
     * Web platformunda: AdMob API'si gerçek bir banner getirmez. 
     * Tasarımın nasıl görüneceğini simüle etmek için şık bir placeholder gösterilir. 
     * Bu, UX'in banner altındayken nasıl bir his verdiğini test etmeye yarar.
     */
    if (Capacitor.getPlatform() === 'web') {
        return (
            <div className="w-full h-[50px] bg-slate-900/90 backdrop-blur-md border-t border-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-300/60 font-mono tracking-widest uppercase shrink-0 transition-all">
                — AdMob Banner Placeholder —
            </div>
        )
    }

    /**
     * Native platformda (Android/iOS): AdMob bannerı webview üzerine (veya webview'i daraltarak) 
     * dışarıdan ('absolute') bindiği için, DOM içinde ona bir yer (spacer) ayırmalıyız.
     * Bu sayede alttaki içerikler reklamın altında kalmaz.
     */
    return <div className="h-[50px] w-full shrink-0 flex-none pointer-events-none" />
}
