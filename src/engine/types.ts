export type PatternId = 'tapCount' | 'feed' | 'numberLineHop' | 'equation' | 'compare' | 'train'

export type EquationOp = 'add' | 'sub' | 'decompose'

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

/** Pattern 4: spoken equation answered by tapping a numeral —
 *  add/sub within 10 plus "breaking apart" teens (15 = 10 + ▢) */
export interface EquationQuestion {
  pattern: 'equation'
  op: EquationOp
  /** add/sub: left operand; decompose: the teen being broken apart */
  a: number
  /** add/sub: right operand; decompose: always 10 */
  b: number
  answer: number
  choices: number[]
}

/** Pattern 5: two groups side by side — tap the one with more (or fewer) */
export interface CompareQuestion {
  pattern: 'compare'
  mode: 'more' | 'fewer'
  left: number
  right: number
  answer: 'left' | 'right'
}

/** Pattern 6: complete the sequence on the train — repeating shapes or a number series */
export interface TrainQuestion {
  pattern: 'train'
  mode: 'shape' | 'number'
  /** shape mode: shape ids (indexes into the pattern's shape set); number mode: the numbers shown */
  sequence: number[]
  /** shape mode: length of the repeating unit, for the hint grouping */
  unitLen?: number
  answer: number
  choices: number[]
}

export type Question = TapCountQuestion | FeedQuestion | HopQuestion | EquationQuestion | CompareQuestion | TrainQuestion

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
    ops?: EquationOp[]
    compareModes?: Array<'more' | 'fewer'>
    trainModes?: Array<'shape' | 'number'>
    /** shape-train repeating forms, e.g. ["AB", "AAB", "ABC"] */
    forms?: string[]
    /** number-train increment (1 = count on, 2 = count by twos) */
    step?: number
  }
  stars: number
}

export interface WorldDef {
  id: string
  missions: MissionDef[]
}
