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
 * Lines containing {placeholders} are skipped (always synthesized at runtime).
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

const cache = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {}

let synthesized = 0
let skipped = 0
let parameterized = 0

for (const lang of ['ja', 'pt']) {
  const lines = JSON.parse(await readFile(path.join(root, 'content', `lines.${lang}.json`), 'utf8'))
  await mkdir(path.join(audioDir, lang), { recursive: true })

  for (const [id, line] of Object.entries(lines)) {
    if (line.text.includes('{')) {
      parameterized++
      continue
    }
    const voice = voices[line.character]?.[lang]
    if (!voice) {
      console.warn(`No voice for character "${line.character}" (${lang}/${id}) — skipping`)
      continue
    }
    const key = `${lang}/${id}`
    const hash = createHash('sha256').update(`${voice}:${line.text}`).digest('hex').slice(0, 16)
    const filePath = path.join(audioDir, lang, `${id}.mp3`)
    if (cache[key] === hash && existsSync(filePath)) {
      skipped++
      continue
    }

    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: line.text },
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
    manifest[key] = `/audio/${lang}/${id}.mp3`
    synthesized++
    console.log(`✓ ${key} (${voice})`)
  }
}

await mkdir(audioDir, { recursive: true })
await writeFile(cachePath, JSON.stringify(cache, null, 2))
await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
console.log(
  `Done: ${synthesized} synthesized, ${skipped} cached, ${parameterized} parameterized lines left to runtime synthesis.`
)
