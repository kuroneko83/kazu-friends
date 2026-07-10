export type PatternId = 'tapCount' | 'feed' | 'numberLineHop'

/** Pattern 1: tap the dinos as they're counted aloud, then pick "how many?" */
export interface TapCountQuestion {
  pattern: 'tapCount'
  count: number
  /** numeral choices shown after counting; includes `count` */
  choices: number[]
}

/** Pattern 2: drag the right number of fruits to the creature */
export interface FeedQuestion {
  pattern: 'feed'
  target: number
  /** fruits available in the basket (> target so choosing matters) */
  available: number
}

/** Pattern 3: hop the creature along a 0–max number line */
export interface HopQuestion {
  pattern: 'numberLineHop'
  mode: 'goto' | 'forward' | 'back'
  start: number
  /** for goto: the destination; for forward/back: hops to move */
  delta: number
  max: number
  answer: number
}

export type Question = TapCountQuestion | FeedQuestion | HopQuestion

export interface MissionDef {
  id: string
  pattern: PatternId
  /** questions per mission (spec: 5–7) */
  questions: number
  /** number range / hop mode knobs, per pattern */
  params: {
    min?: number
    max?: number
    modes?: Array<'goto' | 'forward' | 'back'>
  }
  stars: number
}

export interface WorldDef {
  id: string
  missions: MissionDef[]
}
