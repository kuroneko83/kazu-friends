import { useEffect, useRef } from 'react'
import worldData from '../../content/missions/dino-valley.json'
import type { WorldDef } from '../engine/types'
import { speak } from '../audio/speak'
import { useGameStore } from '../state/gameStore'
import { StarBank } from '../components/StarBank'
import { LanguageToggle } from '../components/LanguageToggle'
import { GuideDino, Star } from '../components/creatures'
import { t } from '../i18n'

const world = worldData as WorldDef

// Gentle S-curve path across the valley (percent coordinates per node)
const PATH: Array<{ x: number; y: number }> = [
  { x: 8, y: 78 },
  { x: 22, y: 62 },
  { x: 14, y: 42 },
  { x: 28, y: 26 },
  { x: 45, y: 34 },
  { x: 58, y: 20 },
  { x: 72, y: 32 },
  { x: 66, y: 54 },
  { x: 80, y: 68 },
  { x: 92, y: 50 }
]

export function WorldMap() {
  const lang = useGameStore((s) => s.lang)
  const completed = useGameStore((s) => s.completed)
  const startMission = useGameStore((s) => s.startMission)
  const greeted = useRef(false)

  useEffect(() => {
    if (greeted.current) return
    greeted.current = true
    void speak('welcome', { lang }).then(() => speak('map.pick', { lang }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A mission is unlocked when it's first on the path or its predecessor is done
  function isUnlocked(index: number): boolean {
    return index === 0 || Boolean(completed[world.missions[index - 1].id])
  }

  const nextIndex = world.missions.findIndex((m, i) => isUnlocked(i) && !completed[m.id])

  return (
    <div className="screen world-map" data-testid="world-map">
      <header className="world-map__header">
        <StarBank />
        <h1 className="world-map__title">🦖 {t(lang, 'worldName')}</h1>
        <LanguageToggle />
      </header>

      <div className="world-map__valley">
        {world.missions.map((mission, i) => {
          const done = Boolean(completed[mission.id])
          const unlocked = isUnlocked(i)
          const isNext = i === nextIndex
          return (
            <button
              key={mission.id}
              className={`map-node ${done ? 'map-node--done' : ''} ${!unlocked ? 'map-node--locked' : ''} ${isNext ? 'map-node--next' : ''}`}
              data-testid={`mission-${mission.id}`}
              style={{ left: `${PATH[i].x}%`, top: `${PATH[i].y}%` }}
              disabled={!unlocked}
              onClick={() => startMission(mission.id)}
            >
              {done ? <Star size={44} /> : <span className="map-node__number">{i + 1}</span>}
            </button>
          )
        })}
        <div className="world-map__guide">
          <GuideDino size={140} />
        </div>
      </div>
    </div>
  )
}
