import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { useGameStore } from './state/gameStore'
import { FirstRun } from './screens/FirstRun'
import { WorldMap } from './screens/WorldMap'
import { MissionPlayer } from './screens/MissionPlayer'
import { SessionEnd } from './screens/SessionEnd'
import './styles/app.css'

export default function App() {
  const hydrated = useGameStore((s) => s.hydrated)
  const screen = useGameStore((s) => s.screen)
  const hydrate = useGameStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) return null

  return (
    <MotionConfig reducedMotion="user">
      {screen === 'firstRun' && <FirstRun />}
      {screen === 'map' && <WorldMap />}
      {screen === 'mission' && <MissionPlayer />}
      {screen === 'sessionEnd' && <SessionEnd />}
    </MotionConfig>
  )
}
