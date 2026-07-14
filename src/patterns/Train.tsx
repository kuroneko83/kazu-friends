import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { TrainQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speakNumber } from '../audio/speak'
import type { PatternMode } from './TapCount'

interface Props {
  question: TrainQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

/** The four shapes a pattern can be made of (id = index) */
export function TrainShape({ id, size = 44 }: { id: number; size?: number }) {
  const shapes = [
    <circle key="c" cx="30" cy="30" r="22" fill="#F4A9C4" stroke="#D97BA0" strokeWidth="3" />,
    <rect key="r" x="9" y="9" width="42" height="42" rx="8" fill="#8ECAE6" stroke="#5FA8CB" strokeWidth="3" />,
    <path key="t" d="M30 7 L54 50 L6 50z" fill="#FFD66B" stroke="#E8B93F" strokeWidth="3" strokeLinejoin="round" />,
    <path
      key="s"
      d="M30 5 l6.6 13.7 15.1 2.1 -11 10.5 2.7 14.9 -13.4 -7.2 -13.4 7.2 2.7 -14.9 -11 -10.5 15.1 -2.1z"
      fill="#7FC8A9"
      stroke="#4DA184"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  ]
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
      {shapes[id]}
    </svg>
  )
}

export function Train({ question, lang, mode, onResult }: Props) {
  const busy = useRef(false)
  const [highlight, setHighlight] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const isNumber = question.mode === 'number'

  // "Solve it together": ride along the cars (counting aloud for numbers), then reveal
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < question.sequence.length; i++) {
        if (cancelled) return
        setHighlight(i)
        if (isNumber) await speakNumber(question.sequence[i], lang)
        else await new Promise((r) => setTimeout(r, 380))
        await new Promise((r) => setTimeout(r, 140))
      }
      if (cancelled) return
      setHighlight(question.sequence.length)
      if (isNumber) await speakNumber(question.answer, lang)
      setRevealed(true)
      await new Promise((r) => setTimeout(r, 1100))
      if (!cancelled) onResult(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function choose(value: number) {
    if (mode === 'together' || busy.current) return
    busy.current = true
    onResult(value === question.answer)
  }

  const unitLen = question.unitLen ?? 0

  return (
    <div className="pattern pattern--train" data-testid="pattern-train" data-answer={question.answer}>
      <div className="train__track">
        <div className="train__engine" aria-hidden>
          <svg viewBox="0 0 90 70" width="86">
            <rect x="6" y="26" width="56" height="34" rx="8" fill="#E8828F" />
            <rect x="46" y="8" width="24" height="30" rx="6" fill="#D96E7C" />
            <rect x="50" y="14" width="16" height="12" rx="3" fill="#FFF4F8" />
            <circle cx="22" cy="62" r="8" fill="#3D3A4B" />
            <circle cx="48" cy="62" r="8" fill="#3D3A4B" />
            <rect x="62" y="40" width="24" height="12" rx="4" fill="#D96E7C" />
          </svg>
        </div>
        {question.sequence.map((item, i) => {
          // hint scaffold: shade alternating repetitions so the rhythm is visible
          const alt = mode !== 'play' && unitLen > 0 && Math.floor(i / unitLen) % 2 === 1
          return (
            <div key={i} className={`train__car ${alt ? 'train__car--alt' : ''} ${highlight === i ? 'train__car--lit' : ''}`}>
              {isNumber ? <span className="train__num">{item}</span> : <TrainShape id={item} />}
              {mode !== 'play' && isNumber && i > 0 && <span className="train__step">+{item - question.sequence[i - 1]}</span>}
            </div>
          )
        })}
        <div className={`train__car train__car--blank ${highlight === question.sequence.length ? 'train__car--lit' : ''}`}>
          {revealed ? (
            isNumber ? (
              <span className="train__num">{question.answer}</span>
            ) : (
              <TrainShape id={question.answer} />
            )
          ) : (
            <span className="train__question">?</span>
          )}
        </div>
      </div>

      <motion.div className="choice-row" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="choice-row__buttons">
          {question.choices.map((value) => (
            <motion.button
              key={value}
              className={`choice-btn ${revealed && value === question.answer ? 'choice-btn--reveal' : ''}`}
              data-testid={`choice-${value}`}
              whileTap={{ scale: 0.92 }}
              onClick={() => choose(value)}
            >
              {isNumber ? value : <TrainShape id={value} size={54} />}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
