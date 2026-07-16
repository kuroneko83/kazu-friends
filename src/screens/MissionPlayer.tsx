import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MissionDef, Question } from '../engine/types'
import { missionById } from '../engine/worlds'
import { generateMission } from '../engine/generator'
import { speak } from '../audio/speak'
import { useGameStore } from '../state/gameStore'
import { ProgressDots } from '../components/ProgressDots'
import { Pip, Star } from '../components/creatures'
import { TapCount, type PatternMode } from '../patterns/TapCount'
import { FeedCreature } from '../patterns/FeedCreature'
import { NumberLineHop } from '../patterns/NumberLineHop'
import { Equation } from '../patterns/Equation'
import { Compare } from '../patterns/Compare'
import { Train } from '../patterns/Train'
import { KanaQuest } from '../patterns/KanaQuest'

/** ?seed=N pins question generation for Playwright; otherwise time-random */
function missionSeed(missionId: string): number {
  const fromUrl = new URLSearchParams(window.location.search).get('seed')
  if (fromUrl) return Number(fromUrl)
  let h = Date.now() & 0xffffff
  for (const c of missionId) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  return h
}

function promptFor(q: Question): { lineId: string; params?: Record<string, number> } {
  switch (q.pattern) {
    case 'tapCount':
      return { lineId: 'tapcount.prompt' }
    case 'feed':
      return { lineId: 'feed.prompt', params: { n: q.target } }
    case 'numberLineHop':
      if (q.mode === 'goto') return { lineId: 'hop.goto', params: { n: q.answer } }
      return { lineId: q.mode === 'forward' ? 'hop.forward' : 'hop.back', params: { n: q.delta } }
    case 'equation':
      if (q.op === 'decompose') return { lineId: 'eq.decompose', params: { n: q.a } }
      return { lineId: q.op === 'add' ? 'eq.add' : 'eq.sub', params: { a: q.a, b: q.b } }
    case 'compare':
      return { lineId: q.mode === 'more' ? 'compare.more' : 'compare.fewer' }
    case 'train':
      return { lineId: q.mode === 'shape' ? 'train.shape' : 'train.number' }
    case 'kana':
      return { lineId: 'kana.pick' }
  }
}

export function MissionPlayer() {
  const lang = useGameStore((s) => s.lang)
  const missionId = useGameStore((s) => s.activeMissionId)!
  const completeMission = useGameStore((s) => s.completeMission)
  const exitMission = useGameStore((s) => s.exitMission)

  const def: MissionDef = missionById(missionId)
  const seed = useMemo(() => missionSeed(missionId), [missionId])
  const questions = useMemo(() => generateMission(def, seed), [def, seed])

  const [qIndex, setQIndex] = useState(0)
  const [mode, setMode] = useState<PatternMode>('play')
  const [celebrating, setCelebrating] = useState(false)
  const [chest, setChest] = useState(false)
  const misses = useRef(0)
  const praiseIndex = useRef(0)
  const advancing = useRef(false)

  const question = questions[qIndex]

  // Prompt plus, for kana questions, the kana sound — strictly AFTER the
  // prompt finishes, never racing it (the old fixed delay cut sentences off)
  function speakPrompt(cancelled?: () => boolean) {
    const { lineId, params } = promptFor(question)
    return speak(lineId, { lang, params }).then(() => {
      if (cancelled?.()) return
      if (question.pattern === 'kana') return speak(`kana.${question.kana}`, { lang: 'ja' })
    })
  }

  // Speak the prompt whenever a question starts (or restarts after a miss)
  useEffect(() => {
    if (chest || mode === 'together') return
    let cancelled = false
    void speakPrompt(() => cancelled)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, mode, chest])

  async function advance() {
    advancing.current = false
    misses.current = 0
    setMode('play')
    setCelebrating(false)
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1)
    } else {
      setChest(true)
      await speak('mission.done', { lang })
      await speak('stars.won', { lang })
      await new Promise((r) => setTimeout(r, 1200))
      await completeMission(missionId, def.stars)
    }
  }

  async function handleResult(correct: boolean) {
    if (advancing.current) return
    if (correct) {
      advancing.current = true
      setCelebrating(true)
      if (mode === 'together') {
        await speak('together.done', { lang })
      } else {
        praiseIndex.current = (praiseIndex.current % 4) + 1
        await speak(`praise.${praiseIndex.current}`, { lang })
      }
      await new Promise((r) => setTimeout(r, 500))
      void advance()
    } else {
      // Never a red X, never a buzzer: 1st miss → retry with a visual
      // scaffold; 2nd miss → the guide solves it together with him.
      misses.current += 1
      if (misses.current === 1) {
        await speak('retry', { lang })
        setMode('hint')
      } else {
        await speak('together', { lang })
        setMode('together')
      }
    }
  }

  const patternKey = `${qIndex}-${mode}`

  return (
    <div className="screen mission" data-testid="mission-player">
      <header className="mission__header">
        <button className="mission__exit" data-testid="exit-mission" onClick={exitMission}>
          🏠
        </button>
        <ProgressDots total={questions.length} done={qIndex + (chest ? 1 : 0)} />
        {/* replay the prompt on demand — externalized memory support, never a penalty */}
        {!chest && (
          <button
            className="mission__replay"
            data-testid="replay-prompt"
            onClick={() => void speakPrompt()}
          >
            🔊
          </button>
        )}
      </header>

      {!chest && (
        <div className="mission__stage" key={patternKey} data-testid="mission-stage" data-question={qIndex}>
          {question.pattern === 'tapCount' && (
            <TapCount question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
          {question.pattern === 'feed' && (
            <FeedCreature question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
          {question.pattern === 'numberLineHop' && (
            <NumberLineHop question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
          {question.pattern === 'equation' && (
            <Equation question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
          {question.pattern === 'compare' && (
            <Compare question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
          {question.pattern === 'train' && (
            <Train question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
          {question.pattern === 'kana' && (
            <KanaQuest question={question} lang={lang} mode={mode} onResult={handleResult} />
          )}
        </div>
      )}

      <AnimatePresence>
        {celebrating && (
          <motion.div
            className="mission__cheer"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Pip size={120} cheer />
          </motion.div>
        )}
      </AnimatePresence>

      {chest && (
        <motion.div
          className="mission__chest"
          data-testid="mission-chest"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          <svg viewBox="0 0 200 160" width="220" aria-hidden>
            <rect x="30" y="70" width="140" height="70" rx="14" fill="#D9A066" />
            <path d="M30 84 a70 46 0 0 1 140 0z" fill="#B87F45" />
            <rect x="88" y="62" width="24" height="34" rx="6" fill="#FFD66B" />
          </svg>
          <div className="mission__chest-stars">
            {Array.from({ length: def.stars }, (_, i) => (
              <motion.span
                key={i}
                initial={{ y: 30, opacity: 0, scale: 0.3 }}
                animate={{ y: -20, opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.25, type: 'spring' }}
              >
                <Star size={56} />
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
