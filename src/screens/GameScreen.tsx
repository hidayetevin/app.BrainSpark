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
import { Capacitor } from '@capacitor/core'
import type { Difficulty } from '@/types/game'

export default function GameScreen() {
    const { difficulty, chapter } = useParams<{ difficulty: string; chapter: string }>()
    const navigate = useNavigate()
    const puzzleId = `${difficulty}_${chapter?.padStart(3, '0')}`

    const {
        lives,
        isPaused,
        isCompleted,
        selectedCell,
        mistakes,
        elapsedTime,
        stars,
        resetGame,
        setPaused,
        saveGame,
        removeNumber,
    } = useGameStore()

    const [puzzleData, setPuzzleData] = useState<any>(null)

    // ERROR FIX: puzzleData parametresini geçiyoruz.
    const { placeNumber, useHint } = useSudokuEngine(puzzleData)

    const [showExitModal, setShowExitModal] = useState(false)
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
        const p = (puzzles as any[]).find(it => it.id === puzzleId)
        if (p) {
            setPuzzleData(p)
            resetGame(p as Difficulty | any)
        }
    }, [puzzleId, resetGame])

    const handleNumberPress = (num: number) => {
        if (selectedCell === null || isPaused || isCompleted || lives === 0) return
        placeNumber(selectedCell, num)
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

    useEffect(() => {
        // Ekran açıldığında banner reklamı göster
        AdManager.showBanner()

        return () => {
            // Ekrandan çıkıldığında banner reklamı gizle
            void AdManager.hideBanner()
        }
    }, [])

    if (!puzzleData) {
        return (
            <ScreenTransition className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-t-[var(--color-primary)] animate-spin" />
            </ScreenTransition>
        )
    }

    return (
        <ScreenTransition className="flex flex-col h-[100dvh] w-full items-center justify-between pb-2 bg-[var(--surface-bg)] overflow-hidden">
            <TopBar />

            <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[40%]">
                <div className="w-full flex items-center justify-center">
                    <SudokuGrid />
                </div>

                {/* PAUSE MODAL */}
                <ActionModal
                    isOpen={isPaused && !isCompleted && lives > 0}
                    title="Oyun Duraklatıldı"
                    message="İlerlemeniz otomatik olarak kaydedildi. Menüye dönmek veya devam etmek ister misiniz?"
                    confirmLabel="▶ Devam Et"
                    cancelLabel="🏠 Ana Menü"
                    onConfirm={() => setPaused(false)}
                    onCancel={() => {
                        saveGame()
                        navigate('/')
                    }}
                />

                {/* EXIT CONFIRMATION MODAL */}
                <ActionModal
                    isOpen={showExitModal}
                    title="Menüye Dönülsün mü?"
                    message="Mevcut oyununuz kaydedilecek. Daha sonra devam edebilirsiniz."
                    confirmLabel="Evet, Çık"
                    cancelLabel="Hayır, Kal"
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
                pencilMode={false}
                onTogglePencil={() => { }}
            />

            {/* Reklam Slotu (Yalnızca Web'de Önizleme Amaçlı) */}
            {Capacitor.getPlatform() === 'web' && (
                <div className="w-full h-[50px] bg-slate-800/80 border-t border-white/5 flex items-center justify-center text-[10px] text-indigo-300/50 font-mono tracking-widest uppercase z-20">
                    — AdMob Banner Placeholder —
                </div>
            )}

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
