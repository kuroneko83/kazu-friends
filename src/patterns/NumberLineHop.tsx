import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { HopQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speakNumber } from '../audio/speak'
import { Pip } from '../components/creatures'
import type { PatternMode } from './TapCount'

interface Props {
  question: HopQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

export function NumberLineHop({ question, lang, mode, onResult }: Props) {
  const [pos, setPos] = useState(question.start)
  const busy = useRef(false)

  // "Solve it together": Pip hops one spot at a time, counting aloud
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      setPos(question.start)
      const step = question.answer >= question.start ? 1 : -1
      let current = question.start
      while (current !== question.answer) {
        if (cancelled) return
        current += step
        setPos(current)
        await speakNumber(Math.max(current, 1), lang)
        await new Promise((r) => setTimeout(r, 300))
      }
      await new Promise((r) => setTimeout(r, 900))
      if (!cancelled) onResult(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function hopTo(n: number) {
    if (mode === 'together' || busy.current || n === pos) return
    busy.current = true
    setPos(n)
    setTimeout(() => onResult(n === question.answer), 650)
  }

  const showStartFlag = question.mode !== 'goto'

  return (
    <div className="pattern pattern--hop" data-testid="pattern-hop">
      {/* visual scaffold after a miss: hop count shown as dots */}
      {mode !== 'play' && question.mode !== 'goto' && (
        <div className="hop__scaffold" data-testid="hop-scaffold">
          {Array.from({ length: question.delta }, (_, i) => (
            <span key={i} className="scaffold-dot scaffold-dot--filled" />
          ))}
          <span className="hop__scaffold-arrow">{question.mode === 'forward' ? '→' : '←'}</span>
        </div>
      )}
      <div className="hop__line" data-testid="hop-line">
        {Array.from({ length: question.max + 1 }, (_, n) => (
          <button
            key={n}
            className={`hop__spot ${showStartFlag && n === question.start ? 'hop__spot--start' : ''}`}
            data-testid={`spot-${n}`}
            onClick={() => hopTo(n)}
          >
            {pos === n && (
              <motion.div
                layoutId="hopper"
                className="hop__creature"
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                <Pip size={72} />
              </motion.div>
            )}
            <span className="hop__number">{n}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
