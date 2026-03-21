import { useGameStore } from '@/stores/gameStore'

export interface TimeVerificationResult {
    trustedTimeMs: number
    isTrusted: boolean
    isCheatDetected: boolean
}

export class TimeService {
    /**
     * Hybrid Time Verification
     * 1. API'den gerçek dünyadaki MS'i alır.
     * 2. Başarısız olursa local cache (`lastTrustedTime`) dikkate alınır.
     * 3. İkisi de yoksa cihaz saati alınır (Ama güvenilir sayılmaz).
     * 
     * Anti-Cheat Kontrolü:
     * Eğer alınan zaman, önceden kaydedilen lastTrustedTime'dan küçükse
     * oyuncu cihazın saatini geri çekmiş demektir. isCheatDetected = true döner.
     */
    static async verifyTime(): Promise<TimeVerificationResult> {
        const localDeviceMs = Date.now()
        const { lastTrustedTime } = useGameStore.getState()

        let serverTimeMs: number | null = null

        try {
            const response = await fetch('https://worldtimeapi.org/api/ip', {
                /* Abartılı timeout vermiyoruz oyunu kitlememek için */
                signal: AbortSignal.timeout(3000)
            })
            if (response.ok) {
                const data = await response.json()
                if (data.unixtime) {
                    serverTimeMs = data.unixtime * 1000 // Saniyeyi ms'e çevir
                }
            }
        } catch (e) {
            console.warn('WorldTimeApi fetch failed: ', e)
        }

        // 1. Durum: Server'dan Başarı
        if (serverTimeMs !== null) {
            // Hile tespiti: Server time, önceden kaydettiğimizden küçükse mantık hatası var.
            if (serverTimeMs < lastTrustedTime) {
                return { trustedTimeMs: serverTimeMs, isTrusted: false, isCheatDetected: true }
            }
            return { trustedTimeMs: serverTimeMs, isTrusted: true, isCheatDetected: false }
        }

        // 2. Durum: Server Patlamış, ama lastTrustedTime var ve cihaz zamanı ondan İLERİ
        if (localDeviceMs >= lastTrustedTime && lastTrustedTime > 0) {
            return { trustedTimeMs: localDeviceMs, isTrusted: false, isCheatDetected: false }
        }

        // 3. Durum: Cihaz zamanı lastTrustedTime'dan GERİ alınmış (ANTI-CHEAT PATLAMASI)
        if (localDeviceMs < lastTrustedTime) {
            return { trustedTimeMs: localDeviceMs, isTrusted: false, isCheatDetected: true }
        }

        // 4. Durum: Son çare (İlk açılış ve internet yok)
        return { trustedTimeMs: localDeviceMs, isTrusted: false, isCheatDetected: false }
    }
}
