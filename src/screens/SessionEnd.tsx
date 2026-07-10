import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { speak } from '../audio/speak'
import { useGameStore } from '../state/gameStore'
import { GuideDino, Pip, Star } from '../components/creatures'
import { t } from '../i18n'

/**
 * The session-end ritual — identical every time, for predictable closure:
 * stars fly into the bank, the guide says goodbye by name, Pip says
 * "see you tomorrow", and one big button leads back to the map.
 */
export function SessionEnd() {
  const lang = useGameStore((s) => s.lang)
  const childName = useGameStore((s) => s.childName)
  const lastStars = useGameStore((s) => s.lastStars)
  const starBalance = useGameStore((s) => s.starBalance)
  const finishSession = useGameStore((s) => s.finishSession)
  const spoke = useRef(false)

  useEffect(() => {
    if (spoke.current) return
    spoke.current = true
    void speak('end.goodbye', { lang }).then(() => speak('end.tomorrow', { lang }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen session-end" data-testid="session-end">
      <div className="session-end__creatures">
        <GuideDino size={180} cheer />
        <Pip size={110} cheer />
      </div>

      <div className="session-end__stars">
        {Array.from({ length: lastStars }, (_, i) => (
          <motion.span
            key={i}
            initial={{ y: 120, opacity: 0, scale: 0.4 }}
            animate={{ y: 0, opacity: [0, 1, 1, 0.9], scale: 1 }}
            transition={{ delay: 0.3 + i * 0.35, duration: 0.8 }}
          >
            <Star size={64} />
          </motion.span>
        ))}
      </div>

      <motion.div
        className="session-end__bank"
        data-testid="end-star-balance"
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.08, 1] }}
        transition={{ delay: 0.3 + lastStars * 0.35, duration: 0.6 }}
      >
        <Star size={52} /> {starBalance}
      </motion.div>

      <p className="session-end__label">
        {childName ? t(lang, 'seeYouTomorrowName', { name: childName }) : t(lang, 'seeYouTomorrow')} 🌙
      </p>

      <motion.button
        className="start-btn"
        data-testid="back-to-map"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        whileTap={{ scale: 0.94 }}
        onClick={finishSession}
      >
        🏠
      </motion.button>
    </div>
  )
}
