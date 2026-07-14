# Kazu Friends — Stage 2 North Star

The single reference for all development from July 2026 on. PLAN.md holds the
original product vision; this document governs how we build and ship now that
a real player depends on the app.

## Prime directive: stay one step ahead of school, never a firehose

Content ships to him **just before school needs it**, one topic at a time.
Everything else stays on staging, no matter how finished it is. Overwhelming
him loses the game; the game losing him loses the mission.

## Environments

| | branch | deploys to | audience |
|---|---|---|---|
| **Production** | `main` | https://kuroneko83.github.io/kazu-friends/ | his tablet (installed PWA) |
| **Staging** | `dev` | kazu-friends-staging Pages URL | dad only — bug hunting, pacing decisions |

Rules:
- `main` never receives a feature he isn't ready for; fixes to live content go
  straight to `main` (and merge down to `dev`).
- All new worlds/patterns land on `dev` first and soak until dad has played
  every mission on the staging URL.
- **Graduation = merge `dev` → `main`.** Never a new repo, never a new URL:
  his star bank and progress live in the device's IndexedDB, keyed to the
  production URL. Changing the URL would wipe his stars.
- Which worlds are visible in a build is controlled by `VISIBLE_WORLDS` in
  `src/config.ts` — retire or stage worlds by editing the list, never by
  deleting content.

## Curriculum timeline (Japanese Grade 1, started April 2026)

| when | school does | we ship (to `main`) |
|---|---|---|
| ~~Apr–Jul~~ | counting, add/sub within 10, hiragana | ✅ Dino Valley, Star Station, Whisker Woods, Hiragana Island |
| **Jul–Aug (now)** | summer break — consolidation | **Dakuten/small-kana island** (が・ぱ・きゃ rows) |
| Sep | katakana begins; numbers to 20 | Katakana island (reuses the kana engine end to end) |
| Oct | くり上がり carrying addition | Hero City: friends-of-10 → cherry-split (さくらんぼ) → 8+5 |
| Nov–Dec | くり下がり borrowing; first kanji | Hero City part 2 (13−5); Kanji path (hanzi-writer-data-jp, school introduction order) |
| Jan | big numbers to 100/120 | 100-board / counting-by-tens patterns |
| Feb–Mar | clock (なんじ・なんじはん), word problems | Clock helper; narrated story problems (ぶんしょうだい) |

Dates are triggers, not deadlines — if school moves, we move. New worksheets
from school override this table: drop them in a folder and missions get
matched to them (as with `math_worksheets/` for Star Station).

## Non-negotiables (from PLAN.md, restated for stage 2)

- Zero required reading; every instruction spoken (PT + JA), no English.
- No fail states: miss 1 → scaffolded retry, miss 2 → solve together.
- Missions 5–7 questions with visible progress; sessions end with the ritual.
- All characters original; third-party data only with license notes
  (see `content/kana/README.md`).
- Touch targets ≥ 64px, verified by e2e.

## Definition of done for any new world/pattern

1. `npm run build` clean and the full Playwright suite green, including a new
   e2e test that completes one mission of the new pattern.
2. Screenshot review of: mission map, the pattern in play mode, the miss
   scaffold (hint), and solve-together.
3. Voice lines baked for both languages (`npm run tts`) and verified in the
   live manifest after deploy.
4. Played by dad on the staging URL before any merge to `main`.
5. On-device check after merging: close and reopen the installed PWA twice
   (service-worker update), confirm audio and touch input.

## Known issues / backlog

- **Evidence review findings** — see `docs/evidence-review-2026-07.md`
  (evaluation of the game against the research base in `docs_evidencias/`,
  local-only folder). Order of attack: PT audio audit → externalize spoken
  numbers in feed/hop + replay buttons → subitizable arrangements → warm-up
  review mode → process-praise lines.
- **Portuguese audio bugs** — reported by dad (July 2026), details TBD; folds
  into the F2 systematic PT audio audit from the evidence review.
- Palm rejection on the tracing board (watch his playtests; add if his palm
  triggers strokes).
- GitHub Actions warn about Node 20 deprecation in action versions — bump
  `actions/*` majors when convenient.
- Whisker Woods compare hint: grid rows could align 1:1 across both panels
  more strictly for big counts.
- ようおん (きゃ/しゃ…) are recognition-only (no tracing) — revisit if school
  worksheets demand writing them.

## Farther out (M3/M4 from PLAN.md, unchanged)

Homework Companion mode → parent PIN area + reward catalog → Story Cards →
Supabase sync. The `VISIBLE_WORLDS` config is the seed of the parent-area
"focus setter".
