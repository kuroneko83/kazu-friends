import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FeedQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speakNumber } from '../audio/speak'
import { Berry, GuideDino } from '../components/creatures'
import type { PatternMode } from './TapCount'

interface Props {
  question: FeedQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

export function FeedCreature({ question, lang, mode, onResult }: Props) {
  const [fed, setFed] = useState<number[]>([])
  const busy = useRef(false)

  // "Solve it together": feed exactly `target` berries, counting each one
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      setFed([])
      for (let i = 0; i < question.target; i++) {
        if (cancelled) return
        setFed((prev) => [...prev, i])
        await speakNumber(i + 1, lang)
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

  function feed(i: number) {
    if (mode === 'together' || fed.includes(i) || busy.current) return
    const next = [...fed, i]
    setFed(next)
    void speakNumber(next.length, lang)
  }

  function confirm() {
    if (mode === 'together' || busy.current || fed.length === 0) return
    busy.current = true
    onResult(fed.length === question.target)
  }

  return (
    <div className="pattern pattern--feed" data-testid="pattern-feed">
      <div className="feed__stage">
        <div className="feed__dino">
          <GuideDino size={200} cheer={fed.length === question.target} />
          {/* visual scaffold after a miss: the target as numeral + dots */}
          {mode !== 'play' && (
            <div className="feed__scaffold" data-testid="feed-scaffold">
              <span className="feed__scaffold-number">{question.target}</span>
              <span className="feed__scaffold-dots">
                {Array.from({ length: question.target }, (_, i) => (
                  <span key={i} className={`scaffold-dot ${i < fed.length ? 'scaffold-dot--filled' : ''}`} />
                ))}
              </span>
            </div>
          )}
          <div className="feed__belly" data-testid="feed-belly">
            <AnimatePresence>
              {fed.map((id) => (
                <motion.span
                  key={id}
                  initial={{ scale: 0.4, opacity: 0, y: -40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <Berry size={44} />
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="feed__basket" data-testid="feed-basket">
          {Array.from({ length: question.available }, (_, i) => (
            <motion.button
              key={i}
              className="feed__berry"
              data-testid={`berry-${i}`}
              disabled={fed.includes(i)}
              animate={fed.includes(i) ? { opacity: 0, scale: 0.2, y: -60 } : { opacity: 1, scale: 1 }}
              whileTap={{ scale: 1.15 }}
              onClick={() => feed(i)}
            >
              <Berry />
            </motion.button>
          ))}
        </div>
      </div>

      {fed.length > 0 && mode !== 'together' && (
        <motion.button
          className="confirm-btn"
          data-testid="confirm-feed"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          onClick={confirm}
        >
          ✓
        </motion.button>
      )}
    </div>
  )
}
