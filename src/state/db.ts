import Dexie, { type EntityTable } from 'dexie'
import type { Lang } from '../audio/voices'

export interface Settings {
  id: 'main'
  lang: Lang
  childName: string
  onboarded: boolean
}

export interface MissionProgress {
  missionId: string
  completedAt: number
  stars: number
}

/**
 * Append-only star ledger. Balance = sum of amounts — additive by design,
 * so the future Supabase sync (M4) can max/union-merge without conflicts.
 */
export interface StarEvent {
  id?: number
  amount: number
  reason: 'mission' | 'bonus'
  missionId?: string
  at: number
}

class KazuDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>
  missionProgress!: EntityTable<MissionProgress, 'missionId'>
  starEvents!: EntityTable<StarEvent, 'id'>

  constructor() {
    super('kazu-friends')
    this.version(1).stores({
      settings: 'id',
      missionProgress: 'missionId, completedAt',
      starEvents: '++id, at'
    })
  }
}

export const db = new KazuDB()
