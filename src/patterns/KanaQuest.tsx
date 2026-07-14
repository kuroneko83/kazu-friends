import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import HanziWriter from 'hanzi-writer'
import kanaStrokes from '../../content/kana/hiragana.json'
import type { KanaQuestion } from '../engine/types'
import type { Lang } from '../audio/voices'
import { speak } from '../audio/speak'
import type { PatternMode } from './TapCount'

interface Props {
  question: KanaQuestion
  lang: Lang
  mode: PatternMode
  onResult: (correct: boolean) => void
}

const strokeData = kanaStrokes as Record<string, { strokes: string[]; medians: number[][][] }>

/** The kana sound is Japanese regardless of UI language; spoken as katakana so
 *  an isolated は/へ is never read as its particle pronunciation. */
function speakKana(kana: string): Promise<void> {
  return speak(`kana.${kana}`, { lang: 'ja' })
}

export function KanaQuest({ question, lang, mode, onResult }: Props) {
  const [phase, setPhase] = useState<'pick' | 'trace'>('pick')
  const [revealed, setRevealed] = useState(false)
  /** board pixel size once the writer mounts — the stroke-number badges need it */
  const [boardSize, setBoardSize] = useState(0)
  /** strokes completed so far, to light up the badges in order */
  const [strokesDone, setStrokesDone] = useState(0)
  const traceBox = useRef<HTMLDivElement>(null)
  const writer = useRef<ReturnType<typeof HanziWriter.create> | null>(null)
  const busy = useRef(false)

  // say the kana after the mission player's prompt line has had time to finish
  useEffect(() => {
    const id = setTimeout(() => void speakKana(question.kana), mode === 'play' ? 2400 : 600)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // "Solve it together": reveal the right card while saying it, then trace as usual
  useEffect(() => {
    if (mode !== 'together') return
    let cancelled = false
    ;(async () => {
      await new Promise((r) => setTimeout(r, 800))
      if (cancelled) return
      setRevealed(true)
      await speakKana(question.kana)
      await new Promise((r) => setTimeout(r, 900))
      if (cancelled) return
      if (question.kana in strokeData) setPhase('trace')
      else onResult(true)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // tracing stage: guided stroke-by-stroke quiz over a faint outline
  useEffect(() => {
    if (phase !== 'trace') return
    void speak('kana.trace', { lang })

    // e2e seam: headless CI can't hand-draw strokes
    if ((window as unknown as { __autoTrace?: boolean }).__autoTrace) {
      const id = setTimeout(() => onResult(true), 400)
      return () => clearTimeout(id)
    }

    const el = traceBox.current!
    const size = Math.min(el.clientWidth, el.clientHeight)
    setBoardSize(size)
    setStrokesDone(0)
    const w = HanziWriter.create(el, question.kana, {
      width: size,
      height: size,
      padding: 14,
      showCharacter: false,
      showOutline: true,
      drawingWidth: 24,
      leniency: 1.6,
      // after 2 wobbly tries the stroke draws itself — the "solve together" of writing
      showHintAfterMisses: 2,
      highlightOnComplete: true,
      strokeColor: '#3D3A4B',
      outlineColor: '#DCD6E4',
      drawingColor: '#4DA184',
      highlightColor: '#FFB830',
      charDataLoader: (char, onComplete) => onComplete(strokeData[char])
    })
    writer.current = w
    // in together mode, show the strokes once before asking for them
    const start = mode === 'together' ? w.animateCharacter().then(() => new Promise((r) => setTimeout(r, 400))) : Promise.resolve()
    void start.then(() =>
      w.quiz({
        onCorrectStroke: (s) => setStrokesDone(s.strokeNum + 1),
        onComplete: () => {
          setTimeout(() => onResult(true), 700)
        }
      })
    )
    return () => {
      writer.current = null
      el.replaceChildren()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // multi-char units (きゃ…) have no single-glyph stroke data: recognition only
  const traceable = question.kana in strokeData

  function pick(kana: string) {
    if (mode === 'together' || busy.current || phase !== 'pick') return
    if (kana === question.kana) {
      if (traceable) {
        setPhase('trace')
      } else {
        busy.current = true
        onResult(true)
      }
    } else {
      busy.current = true
      onResult(false)
    }
  }

  // hint mode after a miss: two cards instead of three
  const firstDistractor = question.choices.find((c) => c !== question.kana)
  const cards = mode === 'hint' ? question.choices.filter((k) => k === question.kana || k === firstDistractor) : question.choices

  return (
    <div className="pattern pattern--kana" data-testid="pattern-kana" data-answer={question.kana} data-phase={phase}>
      {phase === 'pick' && (
        <>
          <button className="kana-replay" data-testid="kana-replay" onClick={() => void speakKana(question.kana)}>
            🔊
          </button>
          <div className="choice-row__buttons">
            {cards.map((k) => (
              <motion.button
                key={k}
                className={`kana-card ${revealed && k === question.kana ? 'choice-btn--reveal' : ''}`}
                data-testid={`kana-choice-${k}`}
                whileTap={{ scale: 0.92 }}
                onClick={() => pick(k)}
              >
                {k}
              </motion.button>
            ))}
          </div>
        </>
      )}

      {phase === 'trace' && (
        <div className="kana-trace">
          <button className="kana-replay" data-testid="kana-replay-trace" onClick={() => void speakKana(question.kana)}>
            🔊
          </button>
          <div className="kana-trace__wrap">
            <div className="kana-trace__board" data-testid="kana-trace-board" ref={traceBox} />
            {/* stroke-order numbers at each stroke's starting point, like his worksheets */}
            {boardSize > 0 && (
              <div className="kana-trace__badges" aria-hidden>
                {strokeData[question.kana].medians.map((median, i) => {
                  const scale = (boardSize - 28) / 1024
                  return (
                    <span
                      key={i}
                      className={`stroke-badge ${i < strokesDone ? 'stroke-badge--done' : ''} ${i === strokesDone ? 'stroke-badge--current' : ''}`}
                      style={{ left: 14 + median[0][0] * scale, top: 14 + (900 - median[0][1]) * scale }}
                    >
                      {i + 1}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
