/**
 * useAppLifecycle Hook Unit Tests
 *
 * Capacitor @capacitor/app plugin'i mock'lanır.
 * Test edilen senaryolar:
 * 1. Listener'lar register edilir ve unmount'ta temizlenir
 * 2. appStateChange(isActive: false) → saveGameState çağrılır
 * 3. appStateChange(isActive: true) → /game/ rotasında resume event gönderilir
 * 4. backButton on /game/ → 'app:back-on-game' custom event dispatch edilir
 * 5. backButton on / → App.exitApp() çağrılır
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

// ─── Capacitor Mocks ────────────────────────────────────────────────────────

// Her test için yeniden oluşturulan listener registry
let mockListeners: Map<string, ((payload: unknown) => void)[]>
let mockRemoveFns: Array<ReturnType<typeof vi.fn>>

const mockCapacitorApp = {
    addListener: vi.fn(),
    exitApp: vi.fn(),
}

vi.mock('@capacitor/app', () => ({
    App: mockCapacitorApp,
}))

vi.mock('@capacitor/preferences', () => ({
    Preferences: {
        set: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue({ value: null }),
        remove: vi.fn().mockResolvedValue(undefined),
    },
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
    // Her testten önce listener map ve removeFns listesini sıfırla
    mockListeners = new Map()
    mockRemoveFns = []

    // addListener implementasyonunu yenile
    mockCapacitorApp.addListener.mockImplementation(
        async (event: string, handler: (payload: unknown) => void) => {
            if (!mockListeners.has(event)) mockListeners.set(event, [])
            mockListeners.get(event)!.push(handler)

            const removeFn = vi.fn(() => {
                const handlers = mockListeners.get(event) ?? []
                const idx = handlers.indexOf(handler)
                if (idx !== -1) handlers.splice(idx, 1)
            })
            mockRemoveFns.push(removeFn)
            return { remove: removeFn }
        },
    )

    mockCapacitorApp.exitApp.mockClear()
})

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Belirtilen Capacitor event için kayıtlı handler'ları tetikler */
async function triggerCapacitorEvent(event: string, payload: unknown) {
    const handlers = mockListeners.get(event) ?? []
    await Promise.all(handlers.map(h => Promise.resolve(h(payload))))
}

/** Hook'u belirtilen path üzerinde oluşturur, listener'ların kaydedilmesini bekler */
async function setupHook(initialPath: string) {
    const { useAppLifecycle } = await import('@/hooks/useAppLifecycle')

    const Wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[initialPath]}>
            {children}
        </MemoryRouter>
    )

    const result = renderHook(() => useAppLifecycle(), { wrapper: Wrapper })

    // async addListener çağrılarının tamamlanmasını bekle
    await act(async () => {
        await new Promise(r => setTimeout(r, 60))
    })

    return result
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useAppLifecycle', () => {
    it('listener\'lar kaydedilir ve unmount\'ta temizlenir', async () => {
        const { unmount } = await setupHook('/')

        // İki listener kaydedilmiş olmalı
        expect(mockCapacitorApp.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function))
        expect(mockCapacitorApp.addListener).toHaveBeenCalledWith('backButton', expect.any(Function))
        expect(mockRemoveFns.length).toBe(2)

        unmount()

        // Her iki listener remove edilmiş olmalı
        mockRemoveFns.forEach(fn => expect(fn).toHaveBeenCalled())
    })

    it('appStateChange isActive:false → Preferences.set çağrılır (state kaydedilir)', async () => {
        const { Preferences } = await import('@capacitor/preferences')
        await setupHook('/game/easy/1')

        await act(async () => {
            await triggerCapacitorEvent('appStateChange', { isActive: false })
            // Preferences.set çağrılmış olmalı (persist middleware tetiklendi)
        })
        expect(Preferences.set).toHaveBeenCalledWith(
            expect.objectContaining({ key: 'brain-spark-store' }),
        )
    })

    it('appStateChange isActive:true on /game/ → app:resume-on-game event dispatch edilir', async () => {
        await setupHook('/game/easy/1')
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        await act(async () => {
            await triggerCapacitorEvent('appStateChange', { isActive: true })
            await new Promise(r => setTimeout(r, 30))
        })

        const resumeCall = dispatchSpy.mock.calls.find(
            ([event]) => event instanceof CustomEvent && event.type === 'app:resume-on-game',
        )
        expect(resumeCall).toBeDefined()
    })

    it('backButton on /game/ → app:back-on-game custom event dispatch edilir', async () => {
        await setupHook('/game/easy/1')
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        await act(async () => {
            await triggerCapacitorEvent('backButton', { canGoBack: false })
            await new Promise(r => setTimeout(r, 30))
        })

        const backCall = dispatchSpy.mock.calls.find(
            ([event]) => event instanceof CustomEvent && event.type === 'app:back-on-game',
        )
        expect(backCall).toBeDefined()
    })

    it('backButton on / → App.exitApp() çağrılır', async () => {
        await setupHook('/')

        await act(async () => {
            await triggerCapacitorEvent('backButton', { canGoBack: false })
            await new Promise(r => setTimeout(r, 30))
        })

        expect(mockCapacitorApp.exitApp).toHaveBeenCalledTimes(1)
    })
})
