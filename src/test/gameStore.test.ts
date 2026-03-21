/**
 * gameStore Unit Tests
 *
 * Capacitor Preferences storage adapter mock'lanır.
 * Test edilen senaryolar:
 * 1. placeNumber → grid güncellenir + crash-protection save tetiklenir
 * 2. removeNumber → hücre temizlenir; initialGrid hücresi silinemez
 * 3. toggleNote → note eklenir / çıkarılır; dolu hücrede not eklenmez
 * 4. decreaseLives → lives azalır, mistakes artar, 0'ın altına inemez
 * 5. setAdsDisabled → flag güncellenir
 * 6. resetGame → tüm geçici state sıfırlanır, yeni bulmaca yüklenir
 * 7. savePuzzleStats → best time doğru hesaplanır
 * 8. grid selector → ilgili hücre değerini doğrular
 * 9. notes selector → ilgili hücrenin notlarını doğrular
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { createJSONStorage } from 'zustand/middleware'
import type { PuzzleData } from '@/types/game'

// ─── Mock: Capacitor Preferences ────────────────────────────────────────────
vi.mock('@capacitor/preferences', () => ({
    Preferences: {
        get: vi.fn().mockResolvedValue({ value: null }),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
    },
}))

// ─── Mock: capacitorStorage (persist middleware) ─────────────────────────────
// Persist middleware'inin async Capacitor storage'ı yerine
// senkron in-memory storage kullansın — testler hızlı ve deterministik olur.
vi.mock('@/stores/capacitorStorage', async () => {
    const memStore: Record<string, string> = {}

    const rawStorage = {
        getItem: (key: string) => memStore[key] ?? null,
        setItem: (key: string, value: string) => { memStore[key] = value },
        removeItem: (key: string) => { delete memStore[key] },
    }

    return {
        capacitorStorage: createJSONStorage(() => rawStorage),
        SAVED_STATE_KEY: 'brain-spark-saved-state',
        saveToCrashProtection: vi.fn().mockResolvedValue(undefined),
        loadFromCrashProtection: vi.fn().mockResolvedValue(null),
    }
})

// ─── Helper: fresh puzzle data ────────────────────────────────────────────────

function makePuzzle(overrides: Partial<PuzzleData> = {}): PuzzleData {
    return {
        id: 'easy_001',
        difficulty: 'easy',
        // İlk 20 hücre dolu, kalanlar boş
        initialBoard: Array(81).fill(0).map((_, i) => (i < 20 ? (i % 9) + 1 : 0)),
        solutionBoard: Array(81).fill(0).map((_, i) => (i % 9) + 1),
        ...overrides,
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useGameStore', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('placeNumber → grid[cellIndex] güncellenir', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        const puzzle = makePuzzle()
        act(() => { useGameStore.getState().resetGame(puzzle) })
        act(() => { useGameStore.getState().placeNumber(20, 5) })
        expect(useGameStore.getState().grid[20]).toBe(5)
    })

    it('placeNumber → saveToCrashProtection asenkron çağrılır', async () => {
        const { saveToCrashProtection } = await import('@/stores/capacitorStorage')
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().placeNumber(20, 7)
        })
        await new Promise(r => setTimeout(r, 30))
        expect(saveToCrashProtection).toHaveBeenCalled()
    })

    it('removeNumber → boş hücre temizlenir', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().placeNumber(20, 5)
        })
        act(() => { useGameStore.getState().removeNumber(20) })
        expect(useGameStore.getState().grid[20]).toBe(0)
    })

    it('removeNumber → initialGrid hücresi silinemez', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => { useGameStore.getState().resetGame(makePuzzle()) })
        const valueBefore = useGameStore.getState().grid[0]
        act(() => { useGameStore.getState().removeNumber(0) })
        expect(useGameStore.getState().grid[0]).toBe(valueBefore)
    })

    it('toggleNote → note eklenir', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().toggleNote(20, 3) // hücre 20 boş
        })
        expect(useGameStore.getState().notes[20].has(3)).toBe(true)
    })

    it('toggleNote → aynı note tekrar basılınca çıkarılır', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().toggleNote(20, 3)
        })
        act(() => { useGameStore.getState().toggleNote(20, 3) })
        expect(useGameStore.getState().notes[20].has(3)).toBe(false)
    })

    it('toggleNote → dolu hücreye note eklenemez', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().toggleNote(0, 5) // hücre 0 initialBoard'da dolu
        })
        expect(useGameStore.getState().notes[0].size).toBe(0)
    })

    it('decreaseLives → lives 1 azalır, mistakes 1 artar', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => { useGameStore.getState().resetGame(makePuzzle()) })
        const livesBefore = useGameStore.getState().lives
        act(() => { useGameStore.getState().decreaseLives() })
        expect(useGameStore.getState().lives).toBe(livesBefore - 1)
        expect(useGameStore.getState().mistakes).toBe(1)
    })

    it('decreaseLives → lives 0\'ın altına inmez', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().decreaseLives()
            useGameStore.getState().decreaseLives()
            useGameStore.getState().decreaseLives()
            useGameStore.getState().decreaseLives() // 4. kez
        })
        expect(useGameStore.getState().lives).toBe(0)
    })

    it('setAdsDisabled → adsDisabled flag güncellenir', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => { useGameStore.getState().setAdsDisabled(true) })
        expect(useGameStore.getState().adsDisabled).toBe(true)
        act(() => { useGameStore.getState().setAdsDisabled(false) })
        expect(useGameStore.getState().adsDisabled).toBe(false)
    })

    it('resetGame → tüm geçici state sıfırlanır', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().decreaseLives()
            useGameStore.getState().toggleNote(20, 4)
            useGameStore.getState().setCompleted(true)
        })
        act(() => { useGameStore.getState().resetGame(makePuzzle({ id: 'easy_002' })) })

        const s = useGameStore.getState()
        expect(s.lives).toBe(3)
        expect(s.mistakes).toBe(0)
        expect(s.hintsUsed).toBe(0)
        expect(s.elapsedTime).toBe(0)
        expect(s.isCompleted).toBe(false)
        expect(s.isPaused).toBe(false)
        expect(s.notes[20].size).toBe(0)
    })

    it('savePuzzleStats → ilk kayıtta bestTime = elapsedTime', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().savePuzzleStats('easy_001', {
                stars: 3, mistakes: 0, hintsUsed: 0, elapsedTime: 120, bestTime: 120,
            })
        })
        expect(useGameStore.getState().puzzleStats['easy_001'].bestTime).toBe(120)
    })

    it('savePuzzleStats → daha iyi süre gelince bestTime güncellenir', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().savePuzzleStats('easy_001', {
                stars: 2, mistakes: 1, hintsUsed: 0, elapsedTime: 200, bestTime: 200,
            })
            useGameStore.getState().savePuzzleStats('easy_001', {
                stars: 3, mistakes: 0, hintsUsed: 0, elapsedTime: 90, bestTime: 90,
            })
        })
        expect(useGameStore.getState().puzzleStats['easy_001'].bestTime).toBe(90)
    })

    it('savePuzzleStats → daha yavaş süre gelince bestTime değişmez', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().savePuzzleStats('easy_001', {
                stars: 3, mistakes: 0, hintsUsed: 0, elapsedTime: 80, bestTime: 80,
            })
            useGameStore.getState().savePuzzleStats('easy_001', {
                stars: 1, mistakes: 2, hintsUsed: 1, elapsedTime: 300, bestTime: 300,
            })
        })
        expect(useGameStore.getState().puzzleStats['easy_001'].bestTime).toBe(80)
    })

    it('grid state → cell-level selector pattern çalışır', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().placeNumber(20, 9)
        })
        // getState() ile cell-level subscription pattern'i doğruluyoruz
        // (React hook'lar render context dışında çağrılamaz)
        expect(useGameStore.getState().grid[20]).toBe(9)
        expect(useGameStore.getState().grid[21]).toBe(0)
    })

    it('notes state → cell-level selector pattern çalışır', async () => {
        const { useGameStore } = await import('@/stores/gameStore')
        act(() => {
            useGameStore.getState().resetGame(makePuzzle())
            useGameStore.getState().toggleNote(30, 1)
            useGameStore.getState().toggleNote(30, 5)
        })
        const notes = useGameStore.getState().notes[30]
        expect(notes.has(1)).toBe(true)
        expect(notes.has(5)).toBe(true)
        expect(notes.has(3)).toBe(false)
    })
})
