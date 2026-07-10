import { create } from 'zustand'
import { db, type MissionProgress } from './db'
import type { Lang } from '../audio/voices'

export type Screen = 'firstRun' | 'map' | 'mission' | 'sessionEnd'

interface GameState {
  hydrated: boolean
  screen: Screen
  lang: Lang
  childName: string
  starBalance: number
  completed: Record<string, MissionProgress>
  activeMissionId: string | null
  /** stars won in the mission that just ended, for the session-end ceremony */
  lastStars: number

  hydrate: () => Promise<void>
  completeOnboarding: (lang: Lang, childName: string) => Promise<void>
  toggleLang: () => Promise<void>
  startMission: (missionId: string) => void
  completeMission: (missionId: string, stars: number) => Promise<void>
  finishSession: () => void
  exitMission: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  hydrated: false,
  screen: 'firstRun',
  lang: 'pt',
  childName: '',
  starBalance: 0,
  completed: {},
  activeMissionId: null,
  lastStars: 0,

  hydrate: async () => {
    const [settings, progress, starEvents] = await Promise.all([
      db.settings.get('main'),
      db.missionProgress.toArray(),
      db.starEvents.toArray()
    ])
    const completed: Record<string, MissionProgress> = {}
    for (const p of progress) completed[p.missionId] = p
    set({
      hydrated: true,
      lang: settings?.lang ?? 'pt',
      childName: settings?.childName ?? '',
      screen: settings?.onboarded ? 'map' : 'firstRun',
      completed,
      starBalance: starEvents.reduce((sum, e) => sum + e.amount, 0)
    })
  },

  completeOnboarding: async (lang, childName) => {
    await db.settings.put({ id: 'main', lang, childName, onboarded: true })
    set({ lang, childName, screen: 'map' })
  },

  toggleLang: async () => {
    const lang: Lang = get().lang === 'pt' ? 'ja' : 'pt'
    set({ lang })
    const settings = await db.settings.get('main')
    if (settings) await db.settings.put({ ...settings, lang })
  },

  startMission: (missionId) => set({ activeMissionId: missionId, screen: 'mission' }),

  completeMission: async (missionId, stars) => {
    const record: MissionProgress = { missionId, completedAt: Date.now(), stars }
    await db.missionProgress.put(record)
    await db.starEvents.add({ amount: stars, reason: 'mission', missionId, at: Date.now() })
    set((s) => ({
      completed: { ...s.completed, [missionId]: record },
      starBalance: s.starBalance + stars,
      lastStars: stars,
      screen: 'sessionEnd'
    }))
  },

  finishSession: () => set({ screen: 'map', activeMissionId: null, lastStars: 0 }),

  exitMission: () => set({ screen: 'map', activeMissionId: null })
}))
