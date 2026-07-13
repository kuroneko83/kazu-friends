import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { EquationQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speakNumber } from '../audio/speak'
import { Star } from '../components/creatures'
import type { PatternMode } from './TapCount'

interface Props {
  question: EquationQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

/** The countable stars behind the equation, grouped so each op reads visually:
 *  add → two groups; sub → one group with the removed part faded;
 *  decompose → a boxed "ten" plus the loose ones to count. */
function scaffoldGroups(q: EquationQuestion): Array<{ size: number; kind: 'plain' | 'ten' | 'gone' }> {
  if (q.op === 'add') {
    return [
      { size: q.a, kind: 'plain' },
      { size: q.b, kind: 'plain' }
    ]
  }
  if (q.op === 'sub') {
    return [
      { size: q.answer, kind: 'plain' },
      { size: q.b, kind: 'gone' }
    ]
  }
  return [
    { size: 10, kind: 'ten' },
    { size: q.answer, kind: 'plain' }
  ]
}

export function Equation({ question, lang, mode, onResult }: Props) {
  const busy = useRef(false)
  /** how many countable stars are lit while the guide counts (together mode) */
  const [counted, setCounted] = useState(0)

  const solved = mode === 'together' && counted === question.answer

  // "Solve it together": the guide counts the answer stars aloud, then reveals it
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      for (let i = 1; i <= question.answer; i++) {
        if (cancelled) return
        setCounted(i)
        await speakNumber(i, lang)
        await new Promise((r) => setTimeout(r, 250))
      }
      await new Promise((r) => setTimeout(r, 900))
      if (!cancelled) onResult(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function choose(n: number) {
    if (mode === 'together' || busy.current) return
    busy.current = true
    onResult(n === question.answer)
  }

  // The countable stars are the ones a child would tally to reach the answer:
  // add counts across both groups; sub/decompose count the plain group only.
  let countable = 0

  return (
    <div className="pattern pattern--equation" data-testid="pattern-equation" data-answer={question.answer}>
      <div className="equation__row">
        {question.op === 'decompose' ? (
          <>
            <span>{question.a}</span>
            <span className="equation__op">=</span>
            <span>10</span>
            <span className="equation__op">+</span>
          </>
        ) : (
          <>
            <span>{question.a}</span>
            <span className="equation__op">{question.op === 'add' ? '+' : '−'}</span>
            <span>{question.b}</span>
            <span className="equation__op">=</span>
          </>
        )}
        <span className="equation__slot" data-testid="equation-slot">
          {solved ? question.answer : '?'}
        </span>
      </div>

      {/* visual scaffold after a miss: the equation as countable stars */}
      {mode !== 'play' && (
        <div className="eq-scaffold" data-testid="eq-scaffold">
          {scaffoldGroups(question).map((group, gi) => (
            <div key={gi} className={`eq-scaffold__group ${group.kind === 'ten' ? 'eq-scaffold__group--ten' : ''}`}>
              {Array.from({ length: group.size }, (_, i) => {
                const lit = group.kind !== 'gone' && group.kind !== 'ten' && ++countable <= counted
                return (
                  <span key={i} className={`eq-star ${group.kind === 'gone' ? 'eq-star--gone' : ''} ${lit ? 'eq-star--lit' : ''}`}>
                    <Star size={34} />
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <motion.div className="choice-row" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="choice-row__buttons">
          {question.choices.map((n) => (
            <motion.button
              key={n}
              className={`choice-btn ${solved && n === question.answer ? 'choice-btn--reveal' : ''}`}
              data-testid={`choice-${n}`}
              whileTap={{ scale: 0.92 }}
              onClick={() => choose(n)}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
