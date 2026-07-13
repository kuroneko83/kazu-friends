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
 * Numeric placeholder lines ({n}, {a}+{b}) are baked once per possible param
 * combination (ranges mirror engine/generator.ts + the mission defs), keyed
 * "<lang>/<id>?a=1&b=2" with params sorted alphabetically.
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

// Every param combination a line can take — from the mission defs and generator bounds
function range(min, max) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}
const addPairs = [] // a + b within 10, both addends ≥ 1
for (let a = 1; a <= 9; a++) for (let b = 1; b <= 10 - a; b++) addPairs.push({ a, b })
const subPairs = [] // minuend ≤ 10, difference ≥ 1
for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) subPairs.push({ a, b })
const paramValues = {
  'feed.prompt': range(1, 10).map((n) => ({ n })),
  'hop.goto': range(1, 20).map((n) => ({ n })),
  'hop.forward': range(1, 5).map((n) => ({ n })),
  'hop.back': range(1, 5).map((n) => ({ n })),
  'eq.add': addPairs,
  'eq.sub': subPairs,
  'eq.decompose': range(11, 19).map((n) => ({ n }))
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
      variants = paramValues[id].map((params) => {
        const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
        const suffix = entries.map(([k, v]) => `${k}=${v}`).join('&')
        return {
          key: `${lang}/${id}?${suffix}`,
          file: `${id}.${entries.map(([k, v]) => `${k}${v}`).join('.')}.mp3`,
          text:
            line.variants?.[suffix] ??
            line.text.replace(/\{(\w+)(?::([fm]))?\}/g, (match, key, gender) =>
              params[key] === undefined ? match : numberWord(lang, params[key], gender)
            )
        }
      })
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
