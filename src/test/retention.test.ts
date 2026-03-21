import { expect, test, describe, vi, beforeEach } from 'vitest'
import { TimeService } from '@/services/TimeService'
import { useGameStore } from '@/stores/gameStore'

describe('Retention (PROMPT 7) - Anti-Cheat & Time Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useGameStore.setState({
            streak: 0,
            lastChallengeClaimDate: '',
            lastTrustedTime: 0
        })
    })

    test('HYBRID TIME 1: Dünya saati başarılı ve hile yok', async () => {
        const fakeServerMs = 1700000000000;
        // const response = { ok: true, json: () => ({ unixtime: fakeServerMs / 1000 }) }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ unixtime: fakeServerMs / 1000 })
        }))

        useGameStore.setState({ lastTrustedTime: 1600000000000 }) // Eski bir tarih

        const result = await TimeService.verifyTime()

        expect(result.isTrusted).toBe(true)
        expect(result.trustedTimeMs).toBe(fakeServerMs)
        expect(result.isCheatDetected).toBe(false)
    })

    test('HYBRID TIME 2 (ANTI-CHEAT): Server saati alındı ama lastTrustedTime daha ileride çıkarsa (Zaman Kırılması Mümkün Değil - Hata/Hile)', async () => {
        const fakeServerMs = 1500000000000;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ unixtime: fakeServerMs / 1000 })
        }))

        // Oyuncu mağazadan lastTrustedTime'i bilerek mi sunucu saatinden çok ileri kaydetti? 
        // veya API yanlış dönüyor (Çok absürt bir senaryo). Server her zaman mutlak doğru sayılabilir ama
        // eger server bile lastTrustedTime dan geride ise bir manipülasyon olabilir, hile sayılır
        useGameStore.setState({ lastTrustedTime: 1600000000000 }) // Server saatinden büyük!

        const result = await TimeService.verifyTime()

        expect(result.isTrusted).toBe(false) // Server'a rağmen güvenilmez kıldık
        expect(result.isCheatDetected).toBe(true)
    })

    test('HYBRID TIME 3 (ANTI-CHEAT Fallback): İnternet yok, Cihaz saati lastTrustedTime\'dan geri!', async () => {
        const fakeDeviceMs = 1500000000000;
        vi.spyOn(Date, 'now').mockReturnValue(fakeDeviceMs)
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error'))) // İnternet kesik

        useGameStore.setState({ lastTrustedTime: 1600000000000 }) // Cihaz saati GERİ alınmış!

        const result = await TimeService.verifyTime()

        // İnternet olmadığı için güvenilmez
        expect(result.isTrusted).toBe(false)
        // AMA Cihaz saati lastTrustedTime'dan GERİDE! Adam saati geri almış bariz!
        expect(result.isCheatDetected).toBe(true)
    })

    test('STREAK 1: Aynı gün tekrar claim edilirse false döner', () => {
        useGameStore.setState({
            streak: 5,
            lastChallengeClaimDate: '2023-10-15',
            lastTrustedTime: 10000
        })

        const msForOct15 = new Date('2023-10-15T10:00:00Z').getTime()
        const { success, newStreak } = useGameStore.getState().claimDailyReward(msForOct15)

        expect(success).toBe(false)
        expect(newStreak).toBe(5) // Değişmez
    })

    test('STREAK 2: Ertesi gün claim edilirse streak artar', () => {
        useGameStore.setState({
            streak: 5,
            lastChallengeClaimDate: '2023-10-15',
            lastTrustedTime: 10000
        })

        const msForOct16 = new Date('2023-10-16T10:00:00Z').getTime()
        const { success, newStreak } = useGameStore.getState().claimDailyReward(msForOct16)

        expect(success).toBe(true)
        expect(newStreak).toBe(6)
    })

    test('STREAK 3: 2 Günden fazla gecikilirse streak = 1 olur (Sıfırlanır)', () => {
        useGameStore.setState({
            streak: 5,
            lastChallengeClaimDate: '2023-10-15',
            lastTrustedTime: 10000
        })

        const msForOct18 = new Date('2023-10-18T10:00:00Z').getTime()
        const { success, newStreak } = useGameStore.getState().claimDailyReward(msForOct18)

        expect(success).toBe(true)
        expect(newStreak).toBe(1) // Kırıldı!
    })
})
