import { useState, useEffect } from 'react'
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'
import { useGameStore } from '@/stores/gameStore'

export function TutorialOverlay() {
    const { settings, updateSettings } = useGameStore()
    const [run, setRun] = useState(false)

    useEffect(() => {
        if (!settings.hasSeenTutorial) {
            // Biraz gecikmeli başlasın ki UI tamamen mount olsun
            const timer = setTimeout(() => setRun(true), 500)
            return () => clearTimeout(timer)
        }
    }, [settings.hasSeenTutorial])

    const steps: Step[] = [
        {
            target: 'body',
            content: 'Brain Spark Sudoku\'ya hoş geldin! Hadi nasıl oynandığına hızlıca bakalım.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.tour-step-grid',
            content: 'Amacın 9x9 luk alanı sayılarla doldurmak. Ancak her satır, her sütun ve her 3x3 lük blokta 1\'den 9\'a kadar sayılar yalnızca BİR kez kullanılabilir!',
            placement: 'bottom',
        },
        {
            target: '.tour-step-pencil',
            content: 'Emin olmadığın durumlarda Not (Kalem) modunu açarak hücrelere küçük ihtimaller yazabilirsin. Mantık yürütmek için harikadır!',
            placement: 'top',
        },
        {
            target: '.tour-step-lives',
            content: 'Dikkat et, kural dışı veya hatalı bir sayı yerleştirdiğinde Can kaybedersin. 3 defa hata yaparsan oyun biter. Bol şans!',
            placement: 'bottom-start',
        }
    ]

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

        if (finishedStatuses.includes(status)) {
            setRun(false)
            updateSettings({ hasSeenTutorial: true })
        }
    }

    if (settings.hasSeenTutorial && !run) return null

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#6366f1',
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    textColor: '#f8fafc',
                    arrowColor: 'rgba(30, 41, 59, 0.95)',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#6366f1',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                },
                buttonBack: {
                    color: '#94a3b8',
                },
                buttonSkip: {
                    color: '#cbd5e1',
                }
            }}
            locale={{
                back: 'Geri',
                close: 'Kapat',
                last: 'Anladım!',
                next: 'İleri',
                skip: 'Geç'
            }}
        />
    )
}
