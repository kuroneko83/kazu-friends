// Minimal decorative UI strings (the child never needs to read them —
// every instruction is also spoken). Only pt-BR and ja, never English.
import type { Lang } from './audio/voices'

export const ui: Record<Lang, Record<string, string>> = {
  pt: {
    play: 'Jogar',
    worldName: 'Vale dos Dinos',
    yourName: 'Nome da criança',
    start: 'Começar!',
    missionDone: 'Missão completa!',
    seeYouTomorrow: 'Até amanhã!',
    howMany: 'Quantos são?'
  },
  ja: {
    play: 'あそぶ',
    worldName: 'ダイノバレー',
    yourName: 'おなまえ',
    start: 'スタート!',
    missionDone: 'ミッションクリア!',
    seeYouTomorrow: 'またあしたね!',
    howMany: 'いくつかな?'
  }
}

export function t(lang: Lang, key: string): string {
  return ui[lang][key] ?? key
}
