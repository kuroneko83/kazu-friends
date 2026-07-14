import dinoValley from '../../content/missions/dino-valley.json'
import starStation from '../../content/missions/star-station.json'
import whiskerWoods from '../../content/missions/whisker-woods.json'
import hiraganaIsland from '../../content/missions/hiragana-island.json'
import type { MissionDef, WorldDef } from './types'

export const worlds: WorldDef[] = [
  dinoValley as WorldDef,
  starStation as WorldDef,
  whiskerWoods as WorldDef,
  hiraganaIsland as WorldDef
]

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
