#!/usr/bin/env node
/**
 * Rebuilds content/kana/hiragana.json from AnimCJK's graphicsJaKana.txt.
 *
 * For self-crossing strokes (あ's curve, の's loop, …) AnimCJK adds auxiliary
 * animation-pass segments; they are recognizable because their median ends at
 * the same point as an earlier segment (and often runs off-canvas). Those are
 * not pen strokes: their outline is folded into the parent stroke so the glyph
 * stays complete, their median is dropped, and the result is validated against
 * the official school stroke counts so the numbered tracing matches homework.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE = 'https://raw.githubusercontent.com/parsimonhi/animCJK/master/graphicsJaKana.txt'
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'kana', 'hiragana.json')

// Official school stroke counts (Japanese Grade 1 handwriting)
const SCHOOL_STROKES = {
  あ: 3, い: 2, う: 2, え: 2, お: 3, か: 3, き: 4, く: 1, け: 3, こ: 2,
  さ: 3, し: 1, す: 2, せ: 3, そ: 1, た: 4, ち: 2, つ: 1, て: 1, と: 2,
  な: 4, に: 3, ぬ: 2, ね: 2, の: 1, は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
  ま: 3, み: 2, む: 3, め: 2, も: 3, や: 3, ゆ: 2, よ: 2, ら: 2, り: 2,
  る: 1, れ: 2, ろ: 1, わ: 2, を: 3, ん: 1
}

// Voiced forms: dakuten adds 2 short strokes, handakuten adds 1 circle
const DAKUTEN = { が: 'か', ぎ: 'き', ぐ: 'く', げ: 'け', ご: 'こ', ざ: 'さ', じ: 'し', ず: 'す', ぜ: 'せ', ぞ: 'そ', だ: 'た', ぢ: 'ち', づ: 'つ', で: 'て', ど: 'と', ば: 'は', び: 'ひ', ぶ: 'ふ', べ: 'へ', ぼ: 'ほ' }
const HANDAKUTEN = { ぱ: 'は', ぴ: 'ひ', ぷ: 'ふ', ぺ: 'へ', ぽ: 'ほ' }
for (const [voiced, base] of Object.entries(DAKUTEN)) SCHOOL_STROKES[voiced] = SCHOOL_STROKES[base] + 2
for (const [voiced, base] of Object.entries(HANDAKUTEN)) SCHOOL_STROKES[voiced] = SCHOOL_STROKES[base] + 1

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

// optional: pass a local copy of graphicsJaKana.txt as argv[2] to skip the fetch
let text
if (process.argv[2]) {
  text = await readFile(process.argv[2], 'utf8')
} else {
  const res = await fetch(SOURCE)
  if (!res.ok) {
    console.error(`Failed to fetch ${SOURCE}: ${res.status}`)
    process.exit(1)
  }
  text = await res.text()
}
const lines = text.trim().split('\n').map((l) => JSON.parse(l))

const result = {}
for (const [kana, want] of Object.entries(SCHOOL_STROKES)) {
  const entry = lines.find((l) => l.character === kana)
  if (!entry) {
    console.error(`Missing ${kana} in source data`)
    process.exit(1)
  }
  const work = { strokes: [], medians: [] }
  const keptEnds = []
  entry.medians.forEach((median, i) => {
    const end = median.at(-1)
    const parent = keptEnds.findIndex((prev) => dist(prev, end) < 10)
    if (parent === -1) {
      work.strokes.push(entry.strokes[i])
      work.medians.push(median)
      keptEnds.push(end)
    } else {
      // aux animation pass: keep its pixels on the parent stroke, drop its median
      work.strokes[parent] = `${work.strokes[parent]} ${entry.strokes[i]}`
    }
  })
  if (work.medians.length !== want) {
    console.error(`${kana}: has ${work.medians.length} strokes, school says ${want}`)
    process.exit(1)
  }
  result[kana] = work
}

await writeFile(out, JSON.stringify(result))
console.log(`Wrote ${Object.keys(result).length} kana to ${out}, all matching school stroke counts.`)
