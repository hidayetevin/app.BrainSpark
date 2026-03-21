import { useState, useEffect } from 'react'
import Joyride, { STATUS } from 'react-joyride'
import type { Step, CallBackProps } from 'react-joyride'
import { useGameStore } from '@/stores/gameStore'
import { useTranslation } from '@/locales/i18n'

export function TutorialOverlay() {
    const { settings, updateSettings } = useGameStore()
    const { t } = useTranslation() // Hook kullanımı
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
            content: t.tutorial.welcome,
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.tour-step-grid',
            content: t.tutorial.goal,
            placement: 'bottom',
        },
        {
            target: '.tour-step-pencil',
            content: t.tutorial.pencil,
            placement: 'top',
        },
        {
            target: '.tour-step-lives',
            content: t.tutorial.lives,
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
            showProgress={false} // "Step 1 of 4" gibi İngilizce kalabilen yazıyı gizle
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
                back: t.tutorial.back,
                close: t.tutorial.close,
                last: t.tutorial.last,
                next: t.tutorial.next,
                skip: t.tutorial.skip,
            }}
        />
    )
}
