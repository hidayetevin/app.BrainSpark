import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useSudokuEngine } from '@/hooks/useSudokuEngine'
import ScreenTransition from '@/components/ScreenTransition'
import { SudokuGrid } from '@/components/game/SudokuGrid'
import { Keyboard } from '@/components/game/Keyboard'
import { TopBar } from '@/components/game/TopBar'
import { GameOverModal } from '@/components/game/GameOverModal'
import { LevelCompleteModal } from '@/components/game/LevelCompleteModal'
import { TutorialOverlay } from '@/components/game/TutorialOverlay'
import { ActionModal } from '@/components/modals/ActionModal'
import { puzzles } from '@/constants/puzzles.json'
import { AdManager } from '@/services/AdManager'
import { useTranslation } from '@/locales/i18n'
import type { Difficulty } from '@/types/game'

export default function GameScreen() {
    const { difficulty, chapter } = useParams<{ difficulty: string; chapter: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const puzzleId = `${difficulty}_${chapter?.padStart(3, '0')}`

    const {
        lives,
        isPaused,
        isCompleted,
        selectedCell,
        mistakes,
        elapsedTime,
        stars,
        pencilMode,
        resetGame,
        setPaused,
        togglePencilMode,
        saveGame,
        removeNumber,
    } = useGameStore()

    const [puzzleData, setPuzzleData] = useState<any>(null)

    // ERROR FIX: puzzleData parametresini geçiyoruz.
    const { placeNumber, useHint, toggleNote } = useSudokuEngine(puzzleData)

    const [showExitModal, setShowExitModal] = useState(false)
    const [showHintWarning, setShowHintWarning] = useState(false)
    const [showAdFailed, setShowAdFailed] = useState(false)
    const [exitModalAction, setExitModalAction] = useState<{ onConfirm: () => void; onCancel: () => void } | null>(null)

    useEffect(() => {
        const handleBack = (e: any) => {
            const { onConfirm, onCancel } = e.detail
            setExitModalAction({ onConfirm, onCancel })
            setShowExitModal(true)
        }
        window.addEventListener('app:back-on-game', handleBack)
        return () => window.removeEventListener('app:back-on-game', handleBack)
    }, [])

    useEffect(() => {
        let actualPuzzle: any = null

        if (difficulty === 'daily') {
            // Pick a hard puzzle based on date
            const hardPuzzles = (puzzles as any[]).filter(it => it.difficulty === 'hard')
            if (hardPuzzles.length > 0) {
                const today = new Date()
                // Day of year for a somewhat unique index
                const start = new Date(today.getFullYear(), 0, 0)
                const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000)
                const oneDay = 1000 * 60 * 60 * 24
                const dayOfYear = Math.floor(diff / oneDay)

                const index = dayOfYear % hardPuzzles.length
                actualPuzzle = hardPuzzles[index]
            }
        } else {
            actualPuzzle = (puzzles as any[]).find(it => it.id === puzzleId)
        }

        if (actualPuzzle) {
            setPuzzleData(actualPuzzle)
            resetGame(actualPuzzle as Difficulty | any)
        } else if (difficulty && chapter) {
            // Fallback: If not daily and not found, navigate back or show error
            // setPuzzleData stays null -> spinner shows
        }
    }, [difficulty, chapter, puzzleId, resetGame])

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

    const handleHint = async () => {
        if (isPaused || isCompleted || lives === 0) return

        if (selectedCell === null) {
            setShowHintWarning(true)
            return
        }

        const currentValue = useGameStore.getState().grid[selectedCell]
        if (currentValue !== 0) return

        const success = await AdManager.showRewarded()
        if (success) {
            useHint(selectedCell)
        } else {
            setShowAdFailed(true)
        }
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
        <ScreenTransition className="flex flex-col h-full w-full items-center justify-between pb-2 bg-[var(--surface-bg)] overflow-hidden">
            <TopBar />

            <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[40%]">
                <div className="w-full flex items-center justify-center">
                    <SudokuGrid />
                </div>

                {/* PAUSE MODAL */}
                <ActionModal
                    isOpen={isPaused && !isCompleted && lives > 0}
                    title={t.game.paused}
                    message={t.game.pauseMessage}
                    confirmLabel={t.game.resume}
                    cancelLabel={t.game.menu}
                    onConfirm={() => setPaused(false)}
                    onCancel={() => {
                        saveGame()
                        navigate('/')
                    }}
                />

                {/* HINT WARNING MODAL */}
                <ActionModal
                    isOpen={showHintWarning}
                    title={t.game.hint}
                    message={t.game.selectCellToHint}
                    confirmLabel={t.game.ok}
                    onConfirm={() => setShowHintWarning(false)}
                />

                {/* AD FAILED MODAL */}
                <ActionModal
                    isOpen={showAdFailed}
                    title={t.game.hint}
                    message={t.game.adFailed}
                    confirmLabel={t.game.ok}
                    onConfirm={() => setShowAdFailed(false)}
                />

                {/* EXIT CONFIRMATION MODAL */}
                <ActionModal
                    isOpen={showExitModal}
                    title={t.game.exitTitle}
                    message={t.game.exitMessage}
                    confirmLabel={t.game.exitConfirm}
                    cancelLabel={t.game.exitCancel}
                    type="danger"
                    onConfirm={() => {
                        setShowExitModal(false)
                        exitModalAction?.onConfirm()
                    }}
                    onCancel={() => {
                        setShowExitModal(false)
                        exitModalAction?.onCancel()
                    }}
                />
            </div>

            <Keyboard
                onNumberPress={handleNumberPress}
                onErase={handleErase}
                onHint={handleHint}
                onTogglePencil={() => togglePencilMode()}
                pencilMode={pencilMode}
            />

            <GameOverModal
                isVisible={lives === 0 && !isCompleted}
                onRestart={() => resetGame(puzzleData)}
                onHome={() => navigate('/')}
                onRevive={() => useGameStore.getState().setLives(1)}
            />

            <LevelCompleteModal
                isVisible={isCompleted}
                stars={stars}
                elapsedTime={elapsedTime}
                mistakes={mistakes}
                onNextLevel={() => {
                    const nextChapterInt = parseInt(chapter || '1') + 1
                    navigate(`/game/${difficulty}/${nextChapterInt}`)
                }}
                onHome={() => navigate('/')}
            />

            <TutorialOverlay />
        </ScreenTransition>
    )
}
