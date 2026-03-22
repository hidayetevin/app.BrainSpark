import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { useGameStore } from '@/stores/gameStore'
import { AudioService } from '@/services/AudioService'
import { AdManager } from '@/services/AdManager'

/**
 * useAppLifecycle
 *
 * Capacitor @capacitor/app plugin üzerinden şu olayları yönetir:
 *
 * 1. appStateChange (isActive: false) → store.saveGame() çağrılır (fire-and-forget)
 * 2. appStateChange (isActive: true)  → /game/ rotasında store.setPaused(true) +
 *                                       app:resume-on-game custom event'i dispatch edilir
 * 3. backButton → /game/*: app:back-on-game event (GameScreen dinler, PROMPT 9'da modal)
 *                /: App.exitApp()
 *                Diğer: navigate(-1)
 *
 * ⚠️ Bu hook component unmount'ta listener'ları temizler (memory leak önleme).
 */
export function useAppLifecycle() {
    const navigate = useNavigate()
    const location = useLocation()

    // Güncel pathname'e her render'da sync'lenen ref (closure trap önleme)
    const locationRef = useRef(location.pathname)
    locationRef.current = location.pathname

    // Çift back-button basışında iki modal açılmasını önleyen flag
    const exitConfirmPending = useRef(false)

    useEffect(() => {
        const listeners: PluginListenerHandle[] = []

        const setupListeners = async () => {
            // ── 1. App State Change ──────────────────────────────────────────────
            const stateChangeHandle = await CapacitorApp.addListener(
                'appStateChange',
                ({ isActive }) => {
                    if (!isActive) {
                        // Arka plana alındı → sessize al ve kaydet
                        AudioService.pauseBgMusic()
                        useGameStore.getState().saveGame()
                    } else {
                        // Ön plana döndü → müziği devam ettir (Eğer ayar açıksa)
                        AudioService.resumeBgMusic()

                        // REKLAM DÖNÜŞÜ KONTROLÜ: Eğer reklamdan dönüyorsa oyunu zorla duraklatma
                        if (locationRef.current.startsWith('/game/') && !AdManager.isShowingAd()) {
                            // Oyun ekranındaysa ve reklamda değilse duraklatma modunu aktif et
                            useGameStore.getState().setPaused(true)
                            window.dispatchEvent(new CustomEvent('app:resume-on-game'))
                        }
                    }
                },
            )
            listeners.push(stateChangeHandle)

            // ── 2. Back Button ───────────────────────────────────────────────────
            const backButtonHandle = await CapacitorApp.addListener(
                'backButton',
                ({ canGoBack }) => {
                    const currentPath = locationRef.current

                    if (currentPath.startsWith('/game/')) {
                        // Oyun ekranı → çıkış onay modalini tetikle
                        if (!exitConfirmPending.current) {
                            exitConfirmPending.current = true
                            window.dispatchEvent(
                                new CustomEvent('app:back-on-game', {
                                    detail: {
                                        onConfirm: () => {
                                            exitConfirmPending.current = false
                                            // Oyunu kaydet + ana ekrana dön
                                            useGameStore.getState().saveGame()
                                            navigate('/', { replace: true })
                                        },
                                        onCancel: () => {
                                            exitConfirmPending.current = false
                                        },
                                    },
                                }),
                            )
                        }
                        return
                    }

                    if (currentPath === '/') {
                        // Ana ekran → uygulamadan çık
                        void CapacitorApp.exitApp()
                        return
                    }

                    // Diğer ekranlar → bir adım geri git
                    if (canGoBack) {
                        navigate(-1)
                    } else {
                        navigate('/')
                    }
                },
            )
            listeners.push(backButtonHandle)
        }

        void setupListeners()

        // Cleanup: unmount'ta listener'ları kaldır
        return () => {
            listeners.forEach(handle => handle.remove())
        }
    }, [navigate])

    return null
}
