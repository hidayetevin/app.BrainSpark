import { expect, test, describe, vi, beforeEach } from 'vitest'
import { AdManager } from '@/services/AdManager'
import { useGameStore } from '@/stores/gameStore'

/**
 * PROMPT 6: AdManager Vitest Testleri
 * Smart interstitial kuralları (Zamanlama, Limitler, AdsDisabled kontrolü).
 * AdMob ve IAP plugin'leri mock'lanır.
 */

// Capacitor ve Plugin Mock'ları
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: () => 'ios', // Web olmamasına dikkat etmeliyiz ki native kurallar test edilsin
        isPluginAvailable: () => true
    }
}))

vi.mock('@capacitor-community/admob', () => ({
    AdMob: {
        initialize: vi.fn().mockResolvedValue(undefined),
        showInterstitial: vi.fn().mockResolvedValue(true),
        prepareInterstitial: vi.fn().mockResolvedValue(true),
        prepareRewardVideoAd: vi.fn().mockResolvedValue(true),
        showBanner: vi.fn().mockResolvedValue(true),
        hideBanner: vi.fn().mockResolvedValue(true),
        addListener: vi.fn()
    },
    InterstitialAdPluginEvents: { Dismissed: 'interstitialAdDismissed' },
    RewardAdPluginEvents: { Dismissed: 'rewardVideoAdDismissed' },
    BannerAdSize: { ADAPTIVE_BANNER: 'ADAPTIVE_BANNER' },
    BannerAdPosition: { BOTTOM_CENTER: 'BOTTOM_CENTER' }
}))

vi.mock('@capgo/capacitor-purchases', () => ({
    CapacitorPurchases: {
        restorePurchases: vi.fn().mockResolvedValue({ customerInfo: { entitlements: { active: {} } } })
    }
}))

describe('AdManager - Smart Interstitial Kuralları', () => {
    beforeEach(() => {
        // Zustand'ı temizle
        useGameStore.setState({ adsDisabled: false })

        // AdManager private state'ini sıfırla
        // __injectTestState(impressions, lastTime, isLoaded)
        AdManager.__injectTestState(0, 0, true) // Testlerde reklam varsayılan olarak yüklenmiş farz edilsin
        vi.clearAllMocks()
    })

    test('Kural 1: İlk çağırmada reklamı gösterir (Zaman ve Limit Aşımı Yok)', () => {
        const now = 1000000 // Uydurma Zaman

        // Geçmiş bir zaman vermiyoruz (ilk çağırma)
        const canShow = AdManager.canShowInterstitial(now)

        expect(canShow).toBe(true)
    })

    test('Kural 2: 180 saniye (AD_RULES.MIN_INTERVAL_MS) dolmadan İKİNCİ reklam GÖSTERİLMEZ', () => {
        const now = 1000000
        // Son reklam now'dan 100 saniye (100000ms) önce gösterilmiş
        AdManager.__injectTestState(1, now - 100000, true)

        // 180sn beklendiği için göstermemesi lazım
        const canShow = AdManager.canShowInterstitial(now)

        expect(canShow).toBe(false)
    })

    test('Kural 2b: 180 saniye DOLDUKTAN SONRA reklam gösterilir', () => {
        const now = 1000000
        // Son reklam now'dan 181 saniye (181000ms) önce gösterilmiş
        AdManager.__injectTestState(1, now - 181000, true)

        const canShow = AdManager.canShowInterstitial(now)

        expect(canShow).toBe(true)
    })

    test('Kural 3: Max Session Impression (Session başına 6 limit) AŞILAMAZ', () => {
        const now = 2000000
        // 6 kere gösterilmiş (Limit dolmuş) VE süreden yana sorun yok diyelim.
        AdManager.__injectTestState(6, now - 5000000, true)

        const canShow = AdManager.canShowInterstitial(now)

        // Session limit (6) aşıldığı için göstermemeli
        expect(canShow).toBe(false)
    })

    test('Kural 4: adsDisabled = true ise ASLA reklam gösterme', () => {
        useGameStore.setState({ adsDisabled: true })
        const now = 1000000

        // Limit yok, bekleme derdi yok
        AdManager.__injectTestState(0, 0, true)

        const canShow = AdManager.canShowInterstitial(now)
        expect(canShow).toBe(false)
    })

    test('Kural 5: Reklam Yüklü Değilse (interstitialLoaded=false) Göstermeyi Atla', () => {
        const now = 1000000

        // Her şey uygun ama reklam yüklenmemiş
        AdManager.__injectTestState(0, 0, false)

        const canShow = AdManager.canShowInterstitial(now)
        // Gösterme izni verilmez
        expect(canShow).toBe(false)
    })
})
