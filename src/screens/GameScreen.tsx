import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { useSudokuEngine } from '@/hooks/useSudokuEngine'

// Bileşenler
import { TopBar } from '@/components/game/TopBar'
import { SudokuGrid } from '@/components/game/SudokuGrid'
import { Keyboard } from '@/components/game/Keyboard'

// Gerçek Veri Seti (PROMPT 5 Entegrasyonu)
import type { PuzzleData } from '@/types/game'
import puzzlesData from '@/constants/puzzles.json'

/**
 * GameScreen – Oyun Ekranı (PROMPT 4 & 5 Entegrasyonu)
 * Grid, Keyboard ve Engine hook birleşimi.
 */
export default function GameScreen() {
    const navigate = useNavigate()
    const { difficulty, chapter } = useParams<{ difficulty: string; chapter: string }>()

    // Puzzle Data State
    const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null)

    // Modlar (Kalem)
    const [pencilMode, setPencilMode] = useState(false)

    // Store'dan gerekli global field'lar
    const {
        elapsedTime,
        setElapsedTime,
        isPaused,
        setPaused,
        isCompleted,
        selectedCell,
        resetGame,
        toggleNote, // Kalem modu
        removeNumber // Silme tuşu için
    } = useGameStore()

    // Sudoku Engine
    const { placeNumber, useHint } = useSudokuEngine(puzzleData)

    // 1. Oyunun Yüklenmesi (PROMPT 5)
    useEffect(() => {
        setTimeout(() => {
            // JSON'daki id formatı: 'easy_001'
            const puzzleId = `${difficulty}_${(chapter || '1').padStart(3, '0')}`

            const foundPuzzle = puzzlesData.puzzles.find(p => p.id === puzzleId)

            if (!foundPuzzle) {
                console.error(`Bulmaca verisi bulunamadı: ${puzzleId}`)
                navigate('/')
                return
            }

            setPuzzleData(foundPuzzle as PuzzleData)

            // Sadece 0 timer ise veya chapter farklı ise resetle (Resume oyunları bozmamak için)
            // (PROMPT 6 Kayıt sisteminde refine edilecek)
            const state = useGameStore.getState()
            if (state.chapter !== parseInt(chapter || '1')) {
                resetGame(foundPuzzle as PuzzleData)
            }
        }, 100)
        // Sadece component mount edildiğinde
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 2. Zamanlayıcı (Timer) - Saniye bazlı artış
    useEffect(() => {
        if (!puzzleData || isPaused || isCompleted) return

        const interval = setInterval(() => {
            setElapsedTime(elapsedTime + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [puzzleData, isPaused, isCompleted, elapsedTime, setElapsedTime])

    // 3. App Lifecycle Events (Resume vs)
    useEffect(() => {
        const handleResume = () => {
            setPaused(true) // Arka plandan dönünce duraklat
        }
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


    // ── Keyboard Actions ──
    const handleNumberPress = (num: number) => {
        if (selectedCell === null || isPaused || isCompleted) return

        if (pencilMode) {
            toggleNote(selectedCell, num)
        } else {
            placeNumber(selectedCell, num)
        }
    }

    const handleErase = () => {
        if (selectedCell === null || isPaused || isCompleted) return
        removeNumber(selectedCell)
    }

    const handleHint = () => {
        if (selectedCell === null || isPaused || isCompleted) return
        useHint(selectedCell)
    }

    // Yükleme bekleniyor
    if (!puzzleData) {
        return (
            <ScreenTransition className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-t-[var(--color-primary)] animate-spin" />
            </ScreenTransition>
        )
    }

    return (
        <ScreenTransition>
            <div className="flex flex-col h-[100dvh] w-full items-center justify-between pb-4">

                <TopBar />

                {/* Blur overlay eğer oyunda pause veya tamamlama varsa */}
                <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[50%]">

                    <SudokuGrid />

                    {(isPaused || isCompleted) && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl m-4">
                            {isCompleted ? (
                                <div className="text-center p-6 glass rounded-2xl animate-in zoom-in w-3/4 max-w-sm">
                                    <h2 className="text-2xl font-bold text-white mb-2">Tebrikler! 🎉</h2>
                                    <p className="text-sm text-gray-200 mb-4">Bulmacayı başarıyla çözdünüz!</p>
                                    <button onClick={() => navigate('/levels')} className="btn btn-primary w-full shadow-lg shadow-indigo-500/30">
                                        Bölüm Seç
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setPaused(false)}
                                    className="btn bg-[var(--color-primary)] text-white px-8 py-4 rounded-full text-lg shadow-xl shadow-indigo-500/30 font-bold transition-transform hover:scale-105 active:scale-95"
                                >
                                    Devam Et
                                </button>
                            )}
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

            </div>
        </ScreenTransition>
    )
}
