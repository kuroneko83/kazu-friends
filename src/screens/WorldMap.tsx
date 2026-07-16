import { useEffect, useRef } from 'react'
import { worlds, worldById } from '../engine/worlds'
import { speak } from '../audio/speak'
import { useGameStore } from '../state/gameStore'
import { StarBank } from '../components/StarBank'
import { LanguageToggle } from '../components/LanguageToggle'
import { GuideDino, Pip, Star, WhiskerCat } from '../components/creatures'
import { t } from '../i18n'

const WORLD_EMOJI: Record<string, string> = {
  'dino-valley': '🦖',
  'star-station': '🚀',
  'whisker-woods': '🐾',
  'hiragana-island': '🌸',
  'tenten-island': '✨'
}

// Gentle S-curve path across the map (percent coordinates per node)
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

function welcomeLine(worldId: string): string {
  return worldId === 'dino-valley' ? 'welcome' : `welcome.${worldId}`
}

export function WorldMap() {
  const lang = useGameStore((s) => s.lang)
  const childName = useGameStore((s) => s.childName)
  const completed = useGameStore((s) => s.completed)
  const activeWorldId = useGameStore((s) => s.activeWorldId)
  const setWorld = useGameStore((s) => s.setWorld)
  const startMission = useGameStore((s) => s.startMission)
  const greetedWorld = useRef<string | null>(null)

  const world = worldById(activeWorldId)

  useEffect(() => {
    if (greetedWorld.current === world.id) return
    const first = greetedWorld.current === null
    greetedWorld.current = world.id
    void speak(welcomeLine(world.id), { lang }).then(() => {
      // don't let the chained hint leak into a mission the child already opened
      if (first && useGameStore.getState().screen === 'map') return speak('map.pick', { lang })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id])

  // A mission is unlocked when it's first on the path or its predecessor is done
  function isUnlocked(index: number): boolean {
    return index === 0 || Boolean(completed[world.missions[index - 1].id])
  }

  const nextIndex = world.missions.findIndex((m, i) => isUnlocked(i) && !completed[m.id])

  return (
    <div className={`screen world-map world-map--${world.id}`} data-testid="world-map">
      <header className="world-map__header">
        <StarBank />
        <h1 className="world-map__title">
          {WORLD_EMOJI[world.id]} {t(lang, `worldName.${world.id}`)}
        </h1>
        <LanguageToggle />
      </header>

      <div className="world-map__subheader">
        {childName && <p className="world-map__greeting">{t(lang, 'helloName', { name: childName })}</p>}
        <div className="world-tabs">
          {worlds.map((w) => (
            <button
              key={w.id}
              className={`world-tab ${w.id === world.id ? 'world-tab--active' : ''}`}
              data-testid={`world-${w.id}`}
              onClick={() => void setWorld(w.id)}
            >
              {WORLD_EMOJI[w.id]}
            </button>
          ))}
        </div>
      </div>

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
          {world.id === 'star-station' && <Pip size={130} />}
          {(world.id === 'whisker-woods' || world.id === 'hiragana-island' || world.id === 'tenten-island') && (
            <WhiskerCat size={130} color={{ 'whisker-woods': '#F4A9C4', 'hiragana-island': '#8ECAE6', 'tenten-island': '#FFD66B' }[world.id]} />
          )}
          {world.id === 'dino-valley' && <GuideDino size={140} />}
        </div>
      </div>
    </div>
  )
}
