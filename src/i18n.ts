// Minimal decorative UI strings (the child never needs to read them —
// every instruction is also spoken). Only pt-BR and ja, never English.
import type { Lang } from './audio/voices'

export const ui: Record<Lang, Record<string, string>> = {
  pt: {
    play: 'Jogar',
    'worldName.dino-valley': 'Vale dos Dinos',
    'worldName.star-station': 'Estação Estelar',
    'worldName.whisker-woods': 'Bosque dos Gatinhos',
    'worldName.hiragana-island': 'Ilha do Hiragana',
    'worldName.tenten-island': 'Ilha dos Pontinhos',
    yourName: 'Nome da criança',
    start: 'Começar!',
    missionDone: 'Missão completa!',
    seeYouTomorrow: 'Até amanhã!',
    seeYouTomorrowName: 'Até amanhã, {name}!',
    helloName: 'Olá, {name}!',
    howMany: 'Quantos são?'
  },
  ja: {
    play: 'あそぶ',
    'worldName.dino-valley': 'ダイノバレー',
    'worldName.star-station': 'スターステーション',
    'worldName.whisker-woods': 'ねこのもり',
    'worldName.hiragana-island': 'ひらがなのしま',
    'worldName.tenten-island': 'てんてんのしま',
    yourName: 'おなまえ',
    start: 'スタート!',
    missionDone: 'ミッションクリア!',
    seeYouTomorrow: 'またあしたね!',
    seeYouTomorrowName: '{name}、またあしたね!',
    helloName: '{name}、こんにちは!',
    howMany: 'いくつかな?'
  }
}

export function t(lang: Lang, key: string, params?: Record<string, string>): string {
  let text = ui[lang][key] ?? key
  for (const [k, v] of Object.entries(params ?? {})) text = text.replaceAll(`{${k}}`, v)
  return text
}
