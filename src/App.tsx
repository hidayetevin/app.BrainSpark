import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import HomeScreen from '@/screens/HomeScreen'
import LevelsScreen from '@/screens/LevelsScreen'
import ChaptersScreen from '@/screens/ChaptersScreen'
import GameScreen from '@/screens/GameScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import HowToPlayScreen from '@/screens/HowToPlayScreen'
import DailyScreen from '@/screens/DailyScreen'
import { useAppLifecycle } from '@/hooks/useAppLifecycle'
import { useEffect } from 'react'
import { AdManager } from '@/services/AdManager'
import { AudioService } from '@/services/AudioService'
import { useGameStore } from '@/stores/gameStore'

/**
 * AnimatedRoutes — AnimatePresence'ı useLocation ile birlikte kullanmak için
 * iç component olarak tanımlanır. (useLocation sadece Router altında çalışır)
 */
import { GlobalBanner } from '@/components/ads/GlobalBanner'

/**
 * AnimatedRoutes — AnimatePresence'ı useLocation ile birlikte kullanmak için
 * iç component olarak tanımlanır. (useLocation sadece Router altında çalışır)
 */
function AnimatedRoutes() {
  const location = useLocation()

  // App Lifecycle hook'unu burada başlatıyoruz (Router context içinde)
  useAppLifecycle()

  const darkMode = useGameStore(state => state.settings.darkMode)
  const fontSize = useGameStore(state => state.settings.fontSize)

  // Reklam yöneticisini, Ses servisini ve IAP entegrasyonunu başlat
  useEffect(() => {
    AdManager.init()
    AudioService.init().then(() => {
      AudioService.playBgMusic()
    })
  }, [])

  // Dark Mode Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Font Size Sync
  useEffect(() => {
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px'
  }, [fontSize])

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[var(--surface-bg)] overflow-hidden">
      {/* Route Content Area (Flex 1, Relative for Absolute Children) */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/levels" element={<LevelsScreen />} />
            <Route path="/chapters/:difficulty" element={<ChaptersScreen />} />
            <Route path="/game/:difficulty/:chapter" element={<GameScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/how-to-play" element={<HowToPlayScreen />} />
            <Route path="/daily" element={<DailyScreen />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Global Ad Area (Bottom) */}
      <GlobalBanner />
    </div>
  )
}

/**
 * App — HashRouter ile sarılmış kök bileşen.
 * HashRouter tercih sebebi: Capacitor native bridge
 * file:// protokolüyle çalıştığında history API desteği yoktur;
 * hash tabanlı routing bu sorunu çözer.
 */
export default function App() {
  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  )
}
