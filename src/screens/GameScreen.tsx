import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScreenTransition from '@/components/ScreenTransition'
import { useGameStore } from '@/stores/gameStore'
import { useSudokuEngine } from '@/hooks/useSudokuEngine'

// Bileşenler
import { TopBar } from '@/components/game/TopBar'
import { SudokuGrid } from '@/components/game/SudokuGrid'
import { Keyboard } from '@/components/game/Keyboard'

// Gecici Mock Puzzle (PROMPT 5'te JSON üzerinden yüklenecek)
import type { PuzzleData } from '@/types/game'

const MOCK_PUZZLE: PuzzleData = {
    id: 'easy_001',
    difficulty: 'easy',
    initialBoard: [
        5, 3, 0, 0, 7, 0, 0, 0, 0,
        6, 0, 0, 1, 9, 5, 0, 0, 0,
        0, 9, 8, 0, 0, 0, 0, 6, 0,
        8, 0, 0, 0, 6, 0, 0, 0, 3,
        4, 0, 0, 8, 0, 3, 0, 0, 1,
        7, 0, 0, 0, 2, 0, 0, 0, 6,
        0, 6, 0, 0, 0, 0, 2, 8, 0,
        0, 0, 0, 4, 1, 9, 0, 0, 5,
        0, 0, 0, 0, 8, 0, 0, 7, 9,
    ],
    solutionBoard: [
        5, 3, 4, 6, 7, 8, 9, 1, 2,
        6, 7, 2, 1, 9, 5, 3, 4, 8,
        1, 9, 8, 3, 4, 2, 5, 6, 7,
        8, 5, 9, 7, 6, 1, 4, 2, 3,
        4, 2, 6, 8, 5, 3, 7, 9, 1,
        7, 1, 3, 9, 2, 4, 8, 5, 6,
        9, 6, 1, 5, 3, 7, 2, 8, 4,
        2, 8, 7, 4, 1, 9, 6, 3, 5,
        3, 4, 5, 2, 8, 6, 1, 7, 9,
    ]
}

/**
 * GameScreen – Oyun Ekranı (PROMPT 4 Entegrasyonu)
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

    // 1. Oyunun Yüklenmesi (Mock)
    useEffect(() => {
        // Gerçekte: id = `${difficulty}_${chapter.padStart(3,'0')}` formatında JSON'dan çekilir
        // Şimdilik mock veriyi kullanıp store reset diyoruz
        setTimeout(() => {
            // difficulty veya chapter değişmişse MOCK'un id'sini uydur (test için)
            const data = { ...MOCK_PUZZLE, difficulty: (difficulty as any) || 'easy', id: `${difficulty}_${chapter}` }
            setPuzzleData(data)
            // resetGame içindeki Zustand action sadece game ilk açıldığında veya continue olmadığında çağırılmalı 
            // (PROMPT 6 Kayıt sisteminde refine edilecek. Şimdilik hep reset çekiyoruz ancak store'da savedState varsa GameScreen açılmazdı vs)
            const state = useGameStore.getState()
            // Sadece 0 timer ise veya chapter farklı ise resetle (Resume oyunları bozmamak için)
            if (state.chapter !== parseInt(chapter || '1')) {
                resetGame(data)
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
