import { AdMob, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'
import { CapacitorPurchases } from '@capgo/capacitor-purchases'
import { useGameStore } from '@/stores/gameStore'

const TEST_INTERSTITIAL_ID = Capacitor.getPlatform() === 'ios'
    ? 'ca-app-pub-3940256099942544/4411468910'
    : 'ca-app-pub-3940256099942544/1033173712'

const TEST_REWARDED_ID = Capacitor.getPlatform() === 'ios'
    ? 'ca-app-pub-3940256099942544/1712485313'
    : 'ca-app-pub-3940256099942544/5224354917'

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'

const ENV = import.meta.env
const PROD_INTERSTITIAL_ID = ENV.VITE_ADMOB_INTERSTITIAL_ID || ENV.REACT_APP_ADMOB_INTERSTITIAL_ID
const PROD_REWARDED_ID = ENV.VITE_ADMOB_REWARDED_ID || ENV.REACT_APP_ADMOB_REWARDED_ID
const PROD_BANNER_ID = ENV.VITE_ADMOB_BANNER_ID || ENV.REACT_APP_ADMOB_BANNER_ID

const isTest = !ENV.PROD

export const AD_RULES = {
    MIN_INTERVAL_MS: 180 * 1000,
    MAX_SESSION_IMPRESSIONS: 6
}

class AdManagerService {
    private lastInterstitialTime: number = 0
    private sessionImpressions: number = 0
    private isInitialized = false

    private interstitialLoaded = false
    private rewardedLoaded = false

    async init() {
        if (Capacitor.getPlatform() === 'web') return

        try {
            await AdMob.initialize()
            this.isInitialized = true

            // IAP Kontrolü (HATA FİKSİ: Purchases henüz configure edilmediği için crash yapıyordu)
            // if (Capacitor.getPlatform() !== 'web') {
            //    await this.restorePurchases()
            // }

            const adsDisabled = useGameStore.getState().adsDisabled

            if (!adsDisabled) {
                this.prepareInterstitial()
                this.prepareRewarded()
                this.setupListeners()
            }
        } catch (e) {
            console.warn('AdManager init failed', e)
        }
    }

    async restorePurchases() {
        if (Capacitor.getPlatform() === 'web') return
        try {
            const info = await CapacitorPurchases.restorePurchases()
            if (!info || !info.customerInfo) return

            const isAdFree = info.customerInfo.entitlements.active['ad_free'] !== undefined
            if (isAdFree) {
                useGameStore.getState().setAdsDisabled(true)
            }
        } catch (e) {
            console.warn('Purchases restore failed or not initialized', e)
        }
    }

    private async prepareInterstitial() {
        if (this.interstitialLoaded || useGameStore.getState().adsDisabled) return
        try {
            await AdMob.prepareInterstitial({
                adId: isTest ? TEST_INTERSTITIAL_ID : PROD_INTERSTITIAL_ID,
                isTesting: isTest,
            })
            this.interstitialLoaded = true
        } catch (e) {
            console.warn('Prepare Interstitial Failed')
        }
    }

    private async prepareRewarded() {
        if (this.rewardedLoaded) return
        try {
            await AdMob.prepareRewardVideoAd({
                adId: isTest ? TEST_REWARDED_ID : PROD_REWARDED_ID,
                isTesting: isTest,
            })
            this.rewardedLoaded = true
        } catch (e) {
            console.warn('Prepare Rewarded Failed')
        }
    }

    private setupListeners() {
        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
            this.interstitialLoaded = false
            this.prepareInterstitial()
        })

        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            this.rewardedLoaded = false
            this.prepareRewarded()
        })
    }

    // ── Smart Interstitial (Test Edilebilir Kurallar) ──────────────────────────
    canShowInterstitial(now: number = Date.now()): boolean {
        if (this.sessionImpressions >= AD_RULES.MAX_SESSION_IMPRESSIONS) return false
        if (now - this.lastInterstitialTime < AD_RULES.MIN_INTERVAL_MS) return false
        if (useGameStore.getState().adsDisabled) return false
        if (!this.interstitialLoaded && Capacitor.getPlatform() !== 'web') return false

        return true
    }

    async showSmartInterstitial(): Promise<boolean> {
        if (!this.canShowInterstitial()) {
            return false
        }

        try {
            if (Capacitor.getPlatform() !== 'web') {
                await AdMob.showInterstitial()
            }
            this.lastInterstitialTime = Date.now()
            this.sessionImpressions++
            return true
        } catch (e) {
            console.warn('Show Interstitial Failed', e)
            return false
        }
    }

    async showRewarded(): Promise<boolean> {
        return new Promise(async (resolve) => {
            if (Capacitor.getPlatform() === 'web') {
                resolve(true)
                return
            }
            if (!this.rewardedLoaded) {
                resolve(false)
                return
            }
            let rewarded = false
            const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true })
            const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                rewardListener.remove(); dismissListener.remove(); resolve(rewarded); this.rewardedLoaded = false; this.prepareRewarded()
            })
            try { await AdMob.showRewardVideoAd() } catch (e) { rewardListener.remove(); dismissListener.remove(); resolve(false) }
        })
    }

    // ── Banner ──────────────────────────────────────────────────────────────────
    async showBanner() {
        if (!this.isInitialized || useGameStore.getState().adsDisabled || Capacitor.getPlatform() === 'web') return

        // EMULATOR CRASH & VISIBILITY FIX (NullPointerException)
        await new Promise(resolve => setTimeout(resolve, 800))

        try {
            await AdMob.showBanner({
                adId: isTest ? TEST_BANNER_ID : PROD_BANNER_ID,
                adSize: BannerAdSize.ADAPTIVE_BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                isTesting: isTest,
                margin: 0
            })
        } catch (e) {
            console.warn('Show Banner Failed', e)
        }
    }

    async hideBanner() {
        if (Capacitor.getPlatform() === 'web') return
        try {
            await AdMob.hideBanner()
        } catch (e) { }
    }

    // Testler için state injection
    __injectTestState(impressions: number, lastTime: number, isLoaded: boolean) {
        this.sessionImpressions = impressions
        this.lastInterstitialTime = lastTime
        this.interstitialLoaded = isLoaded
    }
}

export const AdManager = new AdManagerService()
