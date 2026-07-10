import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { TapCountQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speak, speakNumber } from '../audio/speak'
import { LittleDino } from '../components/creatures'
import { t } from '../i18n'

export type PatternMode = 'play' | 'hint' | 'together'

interface Props {
  question: TapCountQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

const DINO_COLORS = ['#7FC8A9', '#8ECAE6', '#F4A9C4', '#FFD66B', '#D9A066']

// Loose deterministic scatter so the herd looks natural but tests are stable
function scatter(i: number) {
  return {
    rotate: ((i * 37) % 17) - 8,
    y: ((i * 53) % 24) - 12
  }
}

export function TapCount({ question, lang, mode, onResult }: Props) {
  const [tapped, setTapped] = useState<number[]>([])
  const [phase, setPhase] = useState<'counting' | 'choosing'>('counting')
  const [highlight, setHighlight] = useState<number | null>(null)
  const busy = useRef(false)

  const allCounted = tapped.length === question.count

  useEffect(() => {
    if (allCounted && phase === 'counting') {
      const id = setTimeout(() => {
        setPhase('choosing')
        void speak('tapcount.howmany', { lang })
      }, 600)
      return () => clearTimeout(id)
    }
  }, [allCounted, phase, lang])

  // "Solve it together": the guide counts each dino aloud, then picks the answer
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      setTapped([])
      setPhase('counting')
      for (let i = 0; i < question.count; i++) {
        if (cancelled) return
        setHighlight(i)
        setTapped((prev) => [...prev, i])
        await speakNumber(i + 1, lang)
        await new Promise((r) => setTimeout(r, 250))
      }
      if (cancelled) return
      setHighlight(null)
      setPhase('choosing')
      await new Promise((r) => setTimeout(r, 800))
      if (!cancelled) onResult(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function tapDino(i: number) {
    if (mode === 'together' || phase !== 'counting' || tapped.includes(i) || busy.current) return
    const next = [...tapped, i]
    setTapped(next)
    void speakNumber(next.length, lang)
  }

  function choose(n: number) {
    if (mode === 'together' || busy.current) return
    busy.current = true
    onResult(n === question.count)
  }

  return (
    <div className="pattern pattern--tapcount" data-testid="pattern-tapcount">
      <div className="tapcount__herd">
        {Array.from({ length: question.count }, (_, i) => {
          const isTapped = tapped.includes(i)
          const s = scatter(i)
          return (
            <motion.button
              key={i}
              className={`tapcount__dino ${isTapped ? 'tapcount__dino--tapped' : ''}`}
              data-testid={`dino-${i}`}
              style={{ rotate: s.rotate, y: s.y }}
              whileTap={{ scale: 0.9 }}
              animate={
                isTapped
                  ? { scale: highlight === i ? 1.25 : 1.08, y: s.y - 8 }
                  : { scale: 1, y: s.y }
              }
              onClick={() => tapDino(i)}
            >
              <LittleDino color={DINO_COLORS[i % DINO_COLORS.length]} />
              {(isTapped && (mode !== 'play' || allCounted)) && (
                <span className="tapcount__badge">{tapped.indexOf(i) + 1}</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {phase === 'choosing' && (
        <motion.div
          className="choice-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="choice-row__label">{t(lang, 'howMany')}</p>
          <div className="choice-row__buttons">
            {question.choices.map((n) => (
              <motion.button
                key={n}
                className={`choice-btn ${mode === 'together' && n === question.count ? 'choice-btn--reveal' : ''}`}
                data-testid={`choice-${n}`}
                whileTap={{ scale: 0.92 }}
                onClick={() => choose(n)}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
