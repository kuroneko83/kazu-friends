import { Howl } from 'howler'
import { voices, BCP47, type Character, type Lang } from './voices'
import linesJa from '../../content/lines.ja.json'
import linesPt from '../../content/lines.pt.json'

interface Line {
  text: string
  character: string
  /** per-value overrides, keyed by param suffix ("n=1"), for lines where more
   *  than the numeral changes (e.g. singular noun at n=1) */
  variants?: Record<string, string>
}

// Must mirror scripts/generate-tts.mjs
const ptNumberWords = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte']
const jaNumberWords = ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう', 'じゅういち', 'じゅうに', 'じゅうさん', 'じゅうよん', 'じゅうご', 'じゅうろく', 'じゅうなな', 'じゅうはち', 'じゅうきゅう', 'にじゅう']

/**
 * TTS engines misread bare digits: pt-BR defaults to masculine ("2 frutinhas"
 * → "dois"), and ja reads an isolated "1" as English "wan". Numbers are
 * spelled out per the template's marker — {n:f} feminine (pt), {n:c} counter
 * context (ja keeps the digit: "3こ" → さんこ reads correctly), plain {n} word.
 */
function numberWord(lang: Lang, n: number, spec?: string): string {
  if (lang === 'ja') return spec === 'c' ? String(n) : jaNumberWords[n] ?? String(n)
  if (lang !== 'pt') return String(n)
  if (n === 1) return spec === 'f' ? 'uma' : 'um'
  if (n === 2) return spec === 'f' ? 'duas' : 'dois'
  return ptNumberWords[n] ?? String(n)
}

const lines: Record<Lang, Record<string, Line>> = {
  ja: linesJa as Record<string, Line>,
  pt: linesPt as Record<string, Line>
}

export type LineId = keyof typeof linesPt

/** manifest.json maps "<lang>/<lineId>" → mp3 URL; absent until `npm run tts` bakes real voices */
// BASE_URL is '/' in dev/Vercel and '/kazu-friends/' on GitHub Pages
const base = import.meta.env.BASE_URL
let manifest: Record<string, string> = {}
fetch(`${base}audio/manifest.json`)
  .then((r) => (r.ok ? r.json() : {}))
  .then((m) => (manifest = m))
  .catch(() => {})

// speechSynthesis voices load asynchronously in some browsers
let synthVoices: SpeechSynthesisVoice[] = []
function refreshVoices() {
  if ('speechSynthesis' in window) synthVoices = window.speechSynthesis.getVoices()
}
if ('speechSynthesis' in window) {
  refreshVoices()
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

function pickSynthVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const tag = BCP47[lang]
  return (
    synthVoices.find((v) => v.lang === tag && v.localService) ??
    synthVoices.find((v) => v.lang === tag) ??
    synthVoices.find((v) => v.lang.startsWith(lang === 'ja' ? 'ja' : 'pt'))
  )
}

export interface SpeakOptions {
  lang: Lang
  params?: Record<string, string | number>
  /** override the character voice defined in the content line */
  character?: Character
}

let currentHowl: Howl | null = null

export function stopSpeaking() {
  if (currentHowl) {
    currentHowl.stop()
    currentHowl = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

/**
 * Speak a content line. Plays the pre-generated mp3 when it exists,
 * otherwise falls back to browser speechSynthesis (ja-JP / pt-BR).
 * Resolves when the audio finishes (or immediately if audio is unavailable).
 */
export function speak(lineId: LineId | string, opts: SpeakOptions): Promise<void> {
  const line = lines[opts.lang][lineId]
  if (!line) return Promise.resolve()

  stopSpeaking()

  // Numeric-param lines are baked per value ("<lang>/<id>?n=3"); only lines
  // with dynamic params ({name}) miss the manifest and fall back to synthesis.
  const params = Object.entries(opts.params ?? {})
  const suffix = params.length
    ? '?' + params.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&')
    : ''
  const mp3 = manifest[`${opts.lang}/${lineId}${suffix}`]
  if (mp3) {
    return new Promise((resolve) => {
      const howl = new Howl({ src: [base + mp3.replace(/^\//, '')], onend: () => resolve(), onloaderror: () => resolve(), onplayerror: () => resolve() })
      currentHowl = howl
      howl.play()
    })
  }

  let text = line.variants?.[suffix.slice(1)] ?? line.text
  text = text.replace(/\{(\w+)(?::([fmc]))?\}/g, (match, key: string, spec?: string) => {
    const value = (opts.params ?? {})[key]
    if (value === undefined) return match
    return typeof value === 'number' ? numberWord(opts.lang, value, spec) : String(value)
  })

  if (!('speechSynthesis' in window)) return Promise.resolve()

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    const voiceConfig = voices[(opts.character ?? line.character) as Character] ?? voices.guide
    utterance.lang = BCP47[opts.lang]
    const synthVoice = pickSynthVoice(opts.lang)
    if (synthVoice) utterance.voice = synthVoice
    utterance.pitch = voiceConfig.pitch
    utterance.rate = voiceConfig.rate
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
    // Safety net: some engines drop onend; never leave the game waiting forever.
    setTimeout(resolve, Math.max(3000, text.length * 350))
  })
}

/** Count a number aloud (used by tap-count and star ceremonies). */
export function speakNumber(n: number, lang: Lang): Promise<void> {
  return speak(`num.${n}`, { lang })
}
