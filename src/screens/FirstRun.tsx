import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lang } from '../audio/voices'
import { useGameStore } from '../state/gameStore'
import { GuideDino } from '../components/creatures'
import { t } from '../i18n'

/**
 * One-time setup, done by the parent: default language + child's name.
 * Both language cards are labeled in their own language (never English).
 */
export function FirstRun() {
  const completeOnboarding = useGameStore((s) => s.completeOnboarding)
  const [lang, setLang] = useState<Lang | null>(null)
  const [name, setName] = useState('')

  return (
    <div className="screen first-run" data-testid="first-run">
      <GuideDino size={180} />
      <div className="first-run__langs">
        <motion.button
          className={`lang-card ${lang === 'pt' ? 'lang-card--picked' : ''}`}
          data-testid="pick-pt"
          whileTap={{ scale: 0.94 }}
          onClick={() => setLang('pt')}
        >
          <span className="lang-card__glyph">A</span>
          Português
        </motion.button>
        <motion.button
          className={`lang-card ${lang === 'ja' ? 'lang-card--picked' : ''}`}
          data-testid="pick-ja"
          whileTap={{ scale: 0.94 }}
          onClick={() => setLang('ja')}
        >
          <span className="lang-card__glyph">あ</span>
          にほんご
        </motion.button>
      </div>

      {lang && (
        <motion.div className="first-run__name" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <input
            data-testid="child-name"
            placeholder={t(lang, 'yourName')}
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
          />
          <motion.button
            className="start-btn"
            data-testid="start-app"
            whileTap={{ scale: 0.94 }}
            onClick={() => void completeOnboarding(lang, name.trim())}
          >
            {t(lang, 'start')}
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
