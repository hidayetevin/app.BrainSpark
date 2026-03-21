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

/**
 * AnimatedRoutes — AnimatePresence'ı useLocation ile birlikte kullanmak için
 * iç component olarak tanımlanır. (useLocation sadece Router altında çalışır)
 */
function AnimatedRoutes() {
  const location = useLocation()

  // App Lifecycle hook'unu burada başlatıyoruz (Router context içinde)
  useAppLifecycle()

  return (
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
