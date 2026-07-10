#!/usr/bin/env node
/**
 * Build-time TTS pipeline: bakes every content line into per-character mp3s
 * using Google Cloud Text-to-Speech, writing public/audio/<lang>/<id>.mp3
 * plus public/audio/manifest.json (consumed by src/audio/speak.ts).
 *
 * Requires GOOGLE_TTS_API_KEY (restricted to the Text-to-Speech API).
 * Without it the script prints a notice and exits 0 — the game then uses
 * the browser speechSynthesis fallback, so builds never block on this.
 *
 * Hash-cached: unchanged lines are skipped on re-runs.
 *
 * Numeric {n} placeholder lines are baked once per possible value (ranges
 * mirror engine/generator.ts + dino-valley.json), keyed "<lang>/<id>?n=<v>".
 * Only lines with dynamic params ({name}) stay on runtime synthesis.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = path.join(root, 'public', 'audio')
const cachePath = path.join(audioDir, '.cache.json')
const manifestPath = path.join(audioDir, 'manifest.json')

const API_KEY = process.env.GOOGLE_TTS_API_KEY
if (!API_KEY) {
  console.log('GOOGLE_TTS_API_KEY not set — skipping TTS generation (exit 0).')
  console.log('The app will use the browser speechSynthesis fallback until real voices are baked.')
  process.exit(0)
}

// Voice map must mirror src/audio/voices.ts
const voices = {
  guide: { ja: 'ja-JP-Neural2-D', pt: 'pt-BR-Neural2-B' },
  pip: { ja: 'ja-JP-Neural2-B', pt: 'pt-BR-Neural2-C' }
}
const bcp47 = { ja: 'ja-JP', pt: 'pt-BR' }

// Every value {n} can take, per line — from the mission defs and generator bounds
function range(min, max) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}
const paramValues = {
  'feed.prompt': range(1, 10),
  'hop.goto': range(1, 20),
  'hop.forward': range(1, 5),
  'hop.back': range(1, 5)
}

// Must mirror src/audio/speak.ts
const ptNumberWords = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte']

/**
 * pt-BR TTS reads bare digits with masculine defaults ("2 frutinhas" → "dois"),
 * so numbers are spelled out with the gender the template asks for: {n} → "dois", {n:f} → "duas".
 */
function numberWord(lang, n, gender) {
  if (lang !== 'pt') return String(n)
  if (n === 1) return gender === 'f' ? 'uma' : 'um'
  if (n === 2) return gender === 'f' ? 'duas' : 'dois'
  return ptNumberWords[n] ?? String(n)
}

const cache = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {}

let synthesized = 0
let skipped = 0
let parameterized = 0

for (const lang of ['ja', 'pt']) {
  const lines = JSON.parse(await readFile(path.join(root, 'content', `lines.${lang}.json`), 'utf8'))
  await mkdir(path.join(audioDir, lang), { recursive: true })

  for (const [id, line] of Object.entries(lines)) {
    const voice = voices[line.character]?.[lang]
    if (!voice) {
      console.warn(`No voice for character "${line.character}" (${lang}/${id}) — skipping`)
      continue
    }

    // One variant for plain lines; one per possible n for numeric {n} lines.
    // Lines with dynamic params ({name}) stay on runtime synthesis.
    let variants
    if (!line.text.includes('{')) {
      variants = [{ key: `${lang}/${id}`, file: `${id}.mp3`, text: line.text }]
    } else if (paramValues[id]) {
      variants = paramValues[id].map((v) => ({
        key: `${lang}/${id}?n=${v}`,
        file: `${id}.n${v}.mp3`,
        text:
          line.variants?.[String(v)] ??
          line.text.replace(/\{n(?::([fm]))?\}/g, (_, gender) => numberWord(lang, v, gender))
      }))
    } else {
      parameterized++
      continue
    }

    for (const { key, file, text } of variants) {
      const hash = createHash('sha256').update(`${voice}:${text}`).digest('hex').slice(0, 16)
      const filePath = path.join(audioDir, lang, file)
      if (cache[key] === hash && existsSync(filePath)) {
        skipped++
        continue
      }

      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: bcp47[lang], name: voice },
          audioConfig: { audioEncoding: 'MP3', speakingRate: line.character === 'guide' ? 0.9 : 1.0 }
        })
      })
      if (!res.ok) {
        console.error(`TTS failed for ${key}: ${res.status} ${await res.text()}`)
        process.exit(1)
      }
      const { audioContent } = await res.json()
      await writeFile(filePath, Buffer.from(audioContent, 'base64'))
      cache[key] = hash
      manifest[key] = `audio/${lang}/${file}`
      synthesized++
      console.log(`✓ ${key} (${voice})`)
    }
  }
}

await mkdir(audioDir, { recursive: true })
await writeFile(cachePath, JSON.stringify(cache, null, 2))
await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
console.log(
  `Done: ${synthesized} synthesized, ${skipped} cached, ${parameterized} parameterized lines left to runtime synthesis.`
)
