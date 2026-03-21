import { Howl } from 'howler'
import { useGameStore } from '@/stores/gameStore'

/**
 * AudioService - Yönetim sınıfı
 * bg-music.mp3, btn-click.mp3, success.mp3 gibi efektleri Howler ile çalar.
 * store.settings.soundEnabled durumuna göre susar/çalar.
 */
class AudioServiceImpl {
    private bgMusic: Howl | null = null
    private clickSound: Howl | null = null
    private successSound: Howl | null = null
    private errorSound: Howl | null = null

    // Gerçek dosyalarla değiştirilince .mp3 uzantısı verilebilir.
    private readonly PATHS = {
        bg: '/assets/audio/bg-music.mp3', // placeholder
        click: '/assets/audio/btn-click.mp3', // placeholder
        success: '/assets/audio/success.mp3', // placeholder
        error: '/assets/audio/error.mp3', // placeholder
    }

    private isInitialized = false

    async init() {
        if (this.isInitialized) return

        this.bgMusic = new Howl({
            src: [this.PATHS.bg],
            loop: true,
            volume: 0.3,
            html5: true,
            onloaderror: () => console.warn(`Couldn't load ${this.PATHS.bg}`),
            onplayerror: () => console.warn(`Couldn't play ${this.PATHS.bg}`)
        })

        this.clickSound = new Howl({
            src: [this.PATHS.click],
            volume: 0.5,
            onloaderror: () => console.warn(`Couldn't load ${this.PATHS.click}`),
        })

        this.successSound = new Howl({
            src: [this.PATHS.success],
            volume: 0.7,
            onloaderror: () => console.warn(`Couldn't load ${this.PATHS.success}`),
        })

        this.errorSound = new Howl({
            src: [this.PATHS.error],
            volume: 0.7,
            onloaderror: () => console.warn(`Couldn't load ${this.PATHS.error}`),
        })

        this.isInitialized = true

        // Listen to store changes for fine-grained control
        let currentMusicEnabled = useGameStore.getState().settings.musicEnabled

        useGameStore.subscribe(
            (state) => {
                const newMusic = state.settings.musicEnabled
                if (newMusic !== currentMusicEnabled) {
                    currentMusicEnabled = newMusic
                    if (newMusic) {
                        this.resumeBgMusic()
                    } else {
                        this.pauseBgMusic()
                    }
                }
            }
        )
    }

    playBgMusic() {
        if (!this.bgMusic) return
        const { musicEnabled } = useGameStore.getState().settings
        if (musicEnabled && !this.bgMusic.playing()) {
            this.bgMusic.play()
        }
    }

    pauseBgMusic() {
        if (this.bgMusic && this.bgMusic.playing()) {
            this.bgMusic.pause()
        }
    }

    resumeBgMusic() {
        if (!this.bgMusic) return
        const { musicEnabled } = useGameStore.getState().settings
        if (musicEnabled && !this.bgMusic.playing()) {
            this.bgMusic.play()
        }
    }

    stopBgMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop()
        }
    }

    playClick() {
        if (this.clickSound && useGameStore.getState().settings.soundEnabled) {
            this.clickSound.play()
        }
    }

    playSuccess() {
        if (this.successSound && useGameStore.getState().settings.soundEnabled) {
            this.successSound.play()
        }
    }

    playError() {
        if (this.errorSound && useGameStore.getState().settings.soundEnabled) {
            this.errorSound.play()
        }
    }
}

export const AudioService = new AudioServiceImpl()
