// Two original characters, each with a distinct voice in both languages.
// googleVoice is used by scripts/generate-tts.mjs at build time;
// pitch/rate shape the speechSynthesis fallback (and future mp3 variants).

export type Character = 'guide' | 'pip'
export type Lang = 'ja' | 'pt'

export interface VoiceConfig {
  googleVoice: Record<Lang, string>
  /** speechSynthesis pitch, 0–2 (1 = neutral) */
  pitch: number
  /** speechSynthesis rate, 0.1–10 (1 = neutral); kept slow for a 6-year-old */
  rate: number
}

export const voices: Record<Character, VoiceConfig> = {
  // Big dino guide: warm, low, unhurried
  guide: {
    googleVoice: { ja: 'ja-JP-Neural2-D', pt: 'pt-BR-Neural2-B' },
    pitch: 0.8,
    rate: 0.85
  },
  // Pip, the small companion: bright and chirpy
  pip: {
    googleVoice: { ja: 'ja-JP-Neural2-B', pt: 'pt-BR-Neural2-C' },
    pitch: 1.4,
    rate: 1.0
  }
}

export const BCP47: Record<Lang, string> = { ja: 'ja-JP', pt: 'pt-BR' }
