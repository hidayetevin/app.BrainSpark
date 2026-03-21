import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { useSudokuEngine } from '@/hooks/useSudokuEngine'
import { AdManager } from '@/services/AdManager'

import { TopBar } from '@/components/game/TopBar'
import { SudokuGrid } from '@/components/game/SudokuGrid'
import { Keyboard } from '@/components/game/Keyboard'
import { GameOverModal } from '@/components/game/GameOverModal'
import { LevelCompleteModal } from '@/components/game/LevelCompleteModal'
import { TutorialOverlay } from '@/components/game/TutorialOverlay'

import type { PuzzleData } from '@/types/game'
import puzzlesData from '@/constants/puzzles.json'

export default function GameScreen() {
    const navigate = useNavigate()
    const { difficulty, chapter } = useParams<{ difficulty: string; chapter: string }>()

    const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null)
    const [pencilMode, setPencilMode] = useState(false)

    const {
        elapsedTime,
        setElapsedTime,
        isPaused,
        setPaused,
        isCompleted,
        lives,
        setLives,
        mistakes,
        stars,
        selectedCell,
        toggleNote,
        removeNumber,
        resetGame
    } = useGameStore()

    const { placeNumber, useHint } = useSudokuEngine(puzzleData)

    useEffect(() => {
        setTimeout(() => {
            const puzzleId = `${difficulty}_${(chapter || '1').padStart(3, '0')}`
            const foundPuzzle = puzzlesData.puzzles.find(p => p.id === puzzleId)

            if (!foundPuzzle) {
                console.error(`Bulmaca verisi bulunamadı: ${puzzleId}`)
                navigate('/')
                return
            }

            setPuzzleData(foundPuzzle as PuzzleData)

            const state = useGameStore.getState()
            if (state.savedState && state.savedState.chapter === parseInt(chapter || '1') && state.savedState.difficulty === difficulty) {
                state.resumeSavedGame(foundPuzzle as PuzzleData)
            } else {
                state.resetGame(foundPuzzle as PuzzleData)
            }
        }, 100)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!puzzleData || isPaused || isCompleted || lives === 0) return

        const interval = setInterval(() => {
            setElapsedTime(elapsedTime + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [puzzleData, isPaused, isCompleted, lives, elapsedTime, setElapsedTime])

    useEffect(() => {
        const handleResume = () => setPaused(true)
        const handleBackOnGame = (e: Event) => {
            const { onConfirm } = (e as CustomEvent).detail as { onConfirm: () => void, onCancel: () => void }

            const confirmed = window.confirm('Durduruyorsunuz. Menüye dönmek istiyor musunuz? İlerlemeniz kaydedildi.')
            if (confirmed) {
                onConfirm()
                navigate('/')
            }
        }

        window.addEventListener('app:resume-on-game', handleResume)
        window.addEventListener('app:back-on-game', handleBackOnGame)
        return () => {
            window.removeEventListener('app:resume-on-game', handleResume)
            window.removeEventListener('app:back-on-game', handleBackOnGame)
        }
    }, [navigate, setPaused])

    const handleNumberPress = (num: number) => {
        if (selectedCell === null || isPaused || isCompleted || lives === 0) return

        if (pencilMode) {
            toggleNote(selectedCell, num)
        } else {
            placeNumber(selectedCell, num)
        }
    }

    const handleErase = () => {
        if (selectedCell === null || isPaused || isCompleted || lives === 0) return
        removeNumber(selectedCell)
    }

    const handleHint = () => {
        if (selectedCell === null || isPaused || isCompleted || lives === 0) return
        useHint(selectedCell)
    }

    useEffect(() => {
        if (isCompleted) {
            AdManager.showSmartInterstitial()
        }
    }, [isCompleted])

    if (!puzzleData) {
        return (
            <ScreenTransition className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-t-[var(--color-primary)] animate-spin" />
            </ScreenTransition>
        )
    }

    return (
        <ScreenTransition className="flex flex-col h-[100dvh] w-full items-center justify-between pb-4 bg-[var(--surface-bg)]">
            <TopBar />

            <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[50%]">
                <SudokuGrid />

                {isPaused && !isCompleted && lives > 0 && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-xl m-4">
                        <button
                            onClick={() => setPaused(false)}
                            className="btn bg-indigo-500 text-white px-8 py-4 rounded-full text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] font-bold transition-transform hover:scale-105 active:scale-95"
                        >
                            ▶ Devam Et
                        </button>
                    </div>
                )}
            </div>

            <Keyboard
                onNumberPress={handleNumberPress}
                onErase={handleErase}
                onHint={handleHint}
                pencilMode={pencilMode}
                onTogglePencil={() => setPencilMode(!pencilMode)}
            />

            <GameOverModal
                isVisible={lives === 0}
                onRestart={() => resetGame(puzzleData)}
                onHome={() => navigate('/')}
                onRevive={() => setLives(1)}
            />

            <LevelCompleteModal
                isVisible={isCompleted}
                stars={stars}
                elapsedTime={elapsedTime}
                mistakes={mistakes}
                onNextLevel={() => {
                    // Quick next level route
                    const nextChap = parseInt(chapter || '1') + 1
                    navigate(`/game/${difficulty}/${nextChap}`, { replace: true })
                    window.location.reload() // Tamamen temiz state için reload
                }}
                onHome={() => navigate('/')}
            />
            <TutorialOverlay />
        </ScreenTransition>
    )
}
