import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'

// Store import — Zustand store PROMPT 1'de oluşturulacak.
// Şimdilik tip uyumu için hafif bir stub interface kullanıyoruz.
interface GameStateSnapshot {
    grid?: number[]
    notes?: Set<number>[]
    lives?: number
    elapsedTime?: number
}

/**
 * getGameStateSnapshot — Zustand store bağlandıktan sonra
 * gerçek store getter'ıyla değiştirilecek.
 * PROMPT 1 sonrası: useGameStore.getState() kullanılacak.
 */
function getGameStateSnapshot(): GameStateSnapshot {
    // TODO (PROMPT 1): return useGameStore.getState()
    return {}
}

/**
 * saveGameState — Capacitor Preferences ile state saklar.
 * PROMPT 1 sonrası gerçek implementation ile değiştirilecek.
 */
async function saveGameState(snapshot: GameStateSnapshot): Promise<void> {
    try {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.set({
            key: 'saved_state',
            value: JSON.stringify({
                ...snapshot,
                // Set<number>[] JSON'a doğru serialize edilemiyor; array'e çeviriyoruz
                notes: snapshot.notes?.map(s => [...s]),
            }),
        })
    } catch (err) {
        // Capacitor Preferences kullanılamıyorsa sessizce devam et
        console.warn('[useAppLifecycle] saveGameState failed:', err)
    }
}

/**
 * useAppLifecycle
 *
 * Capacitor @capacitor/app plugin üzerinden şu olayları yönetir:
 *
 * 1. appStateChange (isActive: false) → oyunu duraklat + state'i kaydet
 * 2. appStateChange (isActive: true)  → oyun ekranındaysa kayıtlı state'i yükle,
 *                                       duraklatma overlay'ini göster
 * 3. backButton                        → /game/ rotasında çıkış onayı,
 *                                       diğer rotalarda navigate(-1),
 *                                       / (ana ekran)'da App.exitApp()
 *
 * ⚠️ Bu hook component unmount'ta listener'ları temizler.
 */
export function useAppLifecycle() {
    const navigate = useNavigate()
    const location = useLocation()

    // Ref'ler güncel değerlere erişmek için kullanılır (closure trap önleme)
    const locationRef = useRef(location.pathname)
    locationRef.current = location.pathname

    // Çıkış onayı modali için basit bir flag (PROMPT 9'da modal ile değişecek)
    const exitConfirmPending = useRef(false)

    useEffect(() => {
        const listeners: PluginListenerHandle[] = []

        /**
         * appStateChange listener
         */
        const setupListeners = async () => {
            // ── 1. App State Change ──────────────────────────────────────
            const stateChangeHandle = await CapacitorApp.addListener(
                'appStateChange',
                async ({ isActive }) => {
                    if (!isActive) {
                        // Uygulama arka plana alındı → state'i kaydet
                        const snapshot = getGameStateSnapshot()
                        // await ile bekleme — oyun akışını bloklamasın
                        saveGameState(snapshot).catch(err =>
                            console.warn('[useAppLifecycle] background save failed:', err),
                        )
                    } else {
                        // Uygulama ön plana döndü
                        const currentPath = locationRef.current
                        if (currentPath.startsWith('/game/')) {
                            // Oyun ekranındaysa duraklatma overlay'ini tetikle
                            // TODO (PROMPT 3): useGameStore.getState().setPaused(true)
                            window.dispatchEvent(new CustomEvent('app:resume-on-game'))
                        }
                    }
                },
            )
            listeners.push(stateChangeHandle)

            // ── 2. Back Button ───────────────────────────────────────────
            const backButtonHandle = await CapacitorApp.addListener(
                'backButton',
                ({ canGoBack }) => {
                    const currentPath = locationRef.current

                    if (currentPath.startsWith('/game/')) {
                        // Oyun ekranı → çıkış onay modali göster
                        if (!exitConfirmPending.current) {
                            exitConfirmPending.current = true
                            // Modal event'i, GameScreen tarafından dinlenir (PROMPT 9)
                            window.dispatchEvent(
                                new CustomEvent('app:back-on-game', {
                                    detail: {
                                        onConfirm: () => {
                                            exitConfirmPending.current = false
                                            // Oyunu kaydet ve ana ekrana dön
                                            saveGameState(getGameStateSnapshot()).then(() => {
                                                navigate('/', { replace: true })
                                            })
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
                        // Ana ekran → uygulamayı kapat
                        CapacitorApp.exitApp()
                        return
                    }

                    // Diğer ekranlar → bir geri git
                    if (canGoBack) {
                        navigate(-1)
                    } else {
                        navigate('/')
                    }
                },
            )
            listeners.push(backButtonHandle)
        }

        setupListeners()

        // Cleanup: component unmount olduğunda listener'ları kaldır
        return () => {
            listeners.forEach(handle => handle.remove())
        }
    }, [navigate]) // navigate stabil ref; eslint-disable gerekmez

    return null
}
