import { useGameStore } from '../state/gameStore'

// Child-reachable language switch — flags-free, icon-plus-script based
// (he recognizes the scripts, not the words).
export function LanguageToggle() {
  const lang = useGameStore((s) => s.lang)
  const toggleLang = useGameStore((s) => s.toggleLang)
  return (
    <button className="lang-toggle" data-testid="lang-toggle" onClick={() => void toggleLang()}>
      {lang === 'pt' ? 'あ' : 'A'}
      <span className="lang-toggle__current">{lang === 'pt' ? 'PT' : 'JA'}</span>
    </button>
  )
}
