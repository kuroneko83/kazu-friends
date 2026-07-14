import type { MissionDef, Question } from './types'

/** mulberry32 — tiny seedable PRNG so missions are deterministic under test */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Three numeral choices around the answer, shuffled, always including it. */
function numeralChoices(rng: () => number, answer: number, max: number): number[] {
  const pool = new Set<number>()
  while (pool.size < 2) {
    const offset = randInt(rng, 1, 2) * (rng() < 0.5 ? -1 : 1)
    const candidate = answer + offset
    if (candidate >= 1 && candidate <= max + 2 && candidate !== answer) pool.add(candidate)
  }
  return shuffle(rng, [answer, ...pool])
}

export function generateMission(def: MissionDef, seed: number): Question[] {
  const rng = mulberry32(seed)
  const questions: Question[] = []
  let previousAnswer = -1

  for (let i = 0; i < def.questions; i++) {
    switch (def.pattern) {
      case 'tapCount': {
        const min = def.params.min ?? 1
        const max = def.params.max ?? 5
        let count = randInt(rng, min, max)
        if (count === previousAnswer) count = count === max ? min : count + 1
        previousAnswer = count
        questions.push({ pattern: 'tapCount', count, choices: numeralChoices(rng, count, max) })
        break
      }
      case 'feed': {
        const min = def.params.min ?? 1
        const max = def.params.max ?? 5
        let target = randInt(rng, min, max)
        if (target === previousAnswer) target = target === max ? min : target + 1
        previousAnswer = target
        questions.push({ pattern: 'feed', target, available: target + randInt(rng, 2, 3) })
        break
      }
      case 'equation': {
        const max = def.params.max ?? 10
        const ops = def.params.ops ?? ['add']
        const op = ops[randInt(rng, 0, ops.length - 1)]
        let a: number
        let b: number
        let answer: number
        if (op === 'add') {
          a = randInt(rng, 1, max - 1)
          b = randInt(rng, 1, max - a)
          answer = a + b
          if (answer === previousAnswer) {
            if (a + b < max) b += 1
            else if (b > 1) b -= 1
            else a = Math.max(1, a - 1)
            answer = a + b
          }
        } else if (op === 'sub') {
          a = randInt(rng, 2, max)
          b = randInt(rng, 1, a - 1)
          answer = a - b
          if (answer === previousAnswer) {
            b = b === a - 1 ? 1 : b + 1
            answer = a - b
          }
        } else {
          a = randInt(rng, 11, 19)
          if (a - 10 === previousAnswer) a = a === 19 ? 11 : a + 1
          b = 10
          answer = a - 10
        }
        previousAnswer = answer
        // decompose answers are 1–9; cap distractors so choices stay single-digit
        const choiceMax = op === 'decompose' ? 7 : max
        questions.push({ pattern: 'equation', op, a, b, answer, choices: numeralChoices(rng, answer, choiceMax) })
        break
      }
      case 'compare': {
        const min = def.params.min ?? 1
        const max = def.params.max ?? 5
        const modes = def.params.compareModes ?? ['more']
        const mode = modes[randInt(rng, 0, modes.length - 1)]
        const left = randInt(rng, min, max)
        let right = randInt(rng, min, max)
        if (right === left) right = right === max ? Math.max(min, right - 1) : right + 1
        const answer = (mode === 'more') === left > right ? 'left' : 'right'
        questions.push({ pattern: 'compare', mode, left, right, answer })
        break
      }
      case 'train': {
        const modes = def.params.trainModes ?? ['shape']
        const mode = modes[randInt(rng, 0, modes.length - 1)]
        if (mode === 'shape') {
          const forms = def.params.forms ?? ['AB']
          const form = forms[randInt(rng, 0, forms.length - 1)]
          const letters = form.split('')
          const uniq = [...new Set(letters)]
          // assign each pattern letter a random shape from the 4-shape set
          const pool = shuffle(rng, [0, 1, 2, 3]).slice(0, uniq.length)
          const unit = letters.map((l) => pool[uniq.indexOf(l)])
          const shown = 5
          const sequence = Array.from({ length: shown }, (_, i) => unit[i % unit.length])
          const answer = unit[shown % unit.length]
          // choices: the pattern's own shapes plus one stray, so guessing isn't 50/50
          const stray = [0, 1, 2, 3].find((s) => !pool.includes(s))
          const options = [...new Set([answer, ...pool, ...(stray === undefined ? [] : [stray])])].slice(0, 3)
          questions.push({ pattern: 'train', mode, sequence, unitLen: unit.length, answer, choices: shuffle(rng, options) })
        } else {
          const step = def.params.step ?? 1
          const max = def.params.max ?? 10
          const shown = 4
          let start = randInt(rng, 1, Math.max(1, max - step * shown))
          let answer = start + shown * step
          if (answer === previousAnswer) {
            start = start === 1 ? start + 1 : start - 1
            answer = start + shown * step
          }
          previousAnswer = answer
          const sequence = Array.from({ length: shown }, (_, i) => start + i * step)
          questions.push({ pattern: 'train', mode, sequence, answer, choices: numeralChoices(rng, answer, max + step) })
        }
        break
      }
      case 'numberLineHop': {
        const max = def.params.max ?? 10
        const modes = def.params.modes ?? ['goto']
        const mode = modes[randInt(rng, 0, modes.length - 1)]
        let start = 0
        let delta: number
        let answer: number
        if (mode === 'goto') {
          delta = randInt(rng, 1, max)
          answer = delta
        } else if (mode === 'forward') {
          start = randInt(rng, 0, max - 2)
          delta = randInt(rng, 1, Math.min(5, max - start))
          answer = start + delta
        } else {
          start = randInt(rng, 2, max)
          delta = randInt(rng, 1, Math.min(5, start))
          answer = start - delta
        }
        if (answer === previousAnswer && mode === 'goto') {
          delta = delta === max ? 1 : delta + 1
          answer = delta
        }
        previousAnswer = answer
        questions.push({ pattern: 'numberLineHop', mode, start, delta, max, answer })
        break
      }
    }
  }
  return questions
}
