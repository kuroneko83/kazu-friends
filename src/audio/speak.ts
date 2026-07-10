import { Howl } from 'howler'
import { voices, BCP47, type Character, type Lang } from './voices'
import linesJa from '../../content/lines.ja.json'
import linesPt from '../../content/lines.pt.json'

interface Line {
  text: string
  character: string
}

const lines: Record<Lang, Record<string, Line>> = {
  ja: linesJa as Record<string, Line>,
  pt: linesPt as Record<string, Line>
}

export type LineId = keyof typeof linesPt

/** manifest.json maps "<lang>/<lineId>" → mp3 URL; absent until `npm run tts` bakes real voices */
let manifest: Record<string, string> = {}
fetch('/audio/manifest.json')
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

  const hasParams = opts.params && Object.keys(opts.params).length > 0
  const mp3 = manifest[`${opts.lang}/${lineId}`]
  // Parameterized lines can't use a single baked mp3 — always synthesize those.
  if (mp3 && !hasParams) {
    return new Promise((resolve) => {
      const howl = new Howl({ src: [mp3], onend: () => resolve(), onloaderror: () => resolve(), onplayerror: () => resolve() })
      currentHowl = howl
      howl.play()
    })
  }

  let text = line.text
  for (const [key, value] of Object.entries(opts.params ?? {})) {
    text = text.replaceAll(`{${key}}`, String(value))
  }

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
