import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { CompareQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speakNumber } from '../audio/speak'
import { WhiskerCat } from '../components/creatures'
import type { PatternMode } from './TapCount'

interface Props {
  question: CompareQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

const CAT_COLORS = ['#F4A9C4', '#8ECAE6', '#FFD66B', '#7FC8A9', '#D9A066']

export function Compare({ question, lang, mode, onResult }: Props) {
  const busy = useRef(false)
  /** cats lit so far while the guide counts a side (together mode) */
  const [counting, setCounting] = useState<{ side: 'left' | 'right'; upTo: number } | null>(null)
  const [revealed, setRevealed] = useState(false)

  // "Solve it together": count each group aloud, then pick the answer
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      for (const side of ['left', 'right'] as const) {
        for (let i = 1; i <= question[side]; i++) {
          if (cancelled) return
          setCounting({ side, upTo: i })
          await speakNumber(i, lang)
          await new Promise((r) => setTimeout(r, 200))
        }
        await new Promise((r) => setTimeout(r, 500))
      }
      if (cancelled) return
      setCounting(null)
      setRevealed(true)
      await new Promise((r) => setTimeout(r, 1100))
      if (!cancelled) onResult(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function choose(side: 'left' | 'right') {
    if (mode === 'together' || busy.current) return
    busy.current = true
    onResult(side === question.answer)
  }

  function renderGroup(side: 'left' | 'right') {
    const count = question[side]
    return (
      <motion.button
        className={`compare__group ${revealed && side === question.answer ? 'compare__group--reveal' : ''}`}
        data-testid={`group-${side}`}
        whileTap={{ scale: 0.96 }}
        onClick={() => choose(side)}
      >
        <div className={`compare__cats ${mode !== 'play' ? 'compare__cats--rows' : ''}`}>
          {Array.from({ length: count }, (_, i) => {
            const lit = counting?.side === side && i < counting.upTo
            return (
              <span key={i} className={`compare__cat ${lit ? 'compare__cat--lit' : ''}`}>
                <WhiskerCat size={56} color={CAT_COLORS[(side === 'left' ? i : i + 2) % CAT_COLORS.length]} still />
              </span>
            )
          })}
        </div>
        {/* numeral scaffold after a miss */}
        {mode !== 'play' && <span className="compare__count">{count}</span>}
      </motion.button>
    )
  }

  return (
    <div className="pattern pattern--compare" data-testid="pattern-compare" data-answer={question.answer}>
      <div className="compare__stage">
        {renderGroup('left')}
        {renderGroup('right')}
      </div>
    </div>
  )
}
