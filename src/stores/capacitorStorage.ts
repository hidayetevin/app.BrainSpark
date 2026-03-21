/**
 * capacitorStorage — Zustand persist middleware için Capacitor Preferences adapter.
 *
 * Capacitor Preferences API'si async'tir; Zustand'ın `createJSONStorage`
 * helper'ı async `getItem`/`setItem`/`removeItem` metodlarını destekler.
 *
 * Neden localStorage değil?
 * - Capacitor native build'de localStorage bazı platformlarda uygulama
 *   yeniden başlatılınca sıfırlanabilir.
 * - Preferences, native iOS (NSUserDefaults) ve Android (SharedPreferences)
 *   katmanlarını kullanır — kalıcı ve güvenlidir.
 */

import { createJSONStorage } from 'zustand/middleware'

/**
 * Raw async storage — Capacitor Preferences API'sini sarıyor.
 * Capacitor yoksa (web dev ortamı) localStorage'a geri düşer.
 */
const rawCapacitorStorage = {
    async getItem(key: string): Promise<string | null> {
        try {
            const { Preferences } = await import('@capacitor/preferences')
            const { value } = await Preferences.get({ key })
            return value
        } catch {
            // Web ortamı fallback
            return localStorage.getItem(key)
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        try {
            const { Preferences } = await import('@capacitor/preferences')
            await Preferences.set({ key, value })
        } catch {
            localStorage.setItem(key, value)
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            const { Preferences } = await import('@capacitor/preferences')
            await Preferences.remove({ key })
        } catch {
            localStorage.removeItem(key)
        }
    },
}

/**
 * capacitorStorage — `persist` middleware'ine doğrudan geçilebilecek
 * Zustand-uyumlu storage nesnesi.
 */
export const capacitorStorage = createJSONStorage(() => rawCapacitorStorage)

/**
 * SAVED_STATE_KEY — Aktif oyun snapshot'ı için kullanılan
 * ayrı Preferences key'i. Persist middleware'inden bağımsız olarak
 * `placeNumber` action'ı tarafından her hamlede yazılır (crash protection).
 */
export const SAVED_STATE_KEY = 'brain-spark-saved-state'

/**
 * saveToCrashProtection — Mevcut oyun state'ini bloklamadan kaydeder.
 * `placeNumber` her çağrıldığında fire-and-forget olarak tetiklenir.
 */
export async function saveToCrashProtection(payload: string): Promise<void> {
    try {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.set({ key: SAVED_STATE_KEY, value: payload })
    } catch {
        localStorage.setItem(SAVED_STATE_KEY, payload)
    }
}

/**
 * loadFromCrashProtection — Uygulama başlangıcında kayıtlı state'i okur.
 */
export async function loadFromCrashProtection(): Promise<string | null> {
    try {
        const { Preferences } = await import('@capacitor/preferences')
        const { value } = await Preferences.get({ key: SAVED_STATE_KEY })
        return value
    } catch {
        return localStorage.getItem(SAVED_STATE_KEY)
    }
}
