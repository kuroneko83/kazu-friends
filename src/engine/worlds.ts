import dinoValley from '../../content/missions/dino-valley.json'
import starStation from '../../content/missions/star-station.json'
import whiskerWoods from '../../content/missions/whisker-woods.json'
import hiraganaIsland from '../../content/missions/hiragana-island.json'
import tentenIsland from '../../content/missions/tenten-island.json'
import { VISIBLE_WORLDS } from '../config'
import type { MissionDef, WorldDef } from './types'

const allWorlds: WorldDef[] = [
  dinoValley as WorldDef,
  starStation as WorldDef,
  whiskerWoods as WorldDef,
  hiraganaIsland as WorldDef,
  tentenIsland as WorldDef
]

/** worlds this build exposes, in VISIBLE_WORLDS order (pacing knob — see ROADMAP.md) */
export const worlds: WorldDef[] = VISIBLE_WORLDS.map((id) => allWorlds.find((w) => w.id === id)).filter(
  (w): w is WorldDef => Boolean(w)
)

export function worldById(id: string): WorldDef {
  return worlds.find((w) => w.id === id) ?? worlds[0]
}

export function missionById(missionId: string): MissionDef {
  for (const world of worlds) {
    const mission = world.missions.find((m) => m.id === missionId)
    if (mission) return mission
  }
  throw new Error(`Unknown mission ${missionId}`)
}
