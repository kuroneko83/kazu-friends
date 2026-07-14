# Evidence Review — July 2026

Evaluation of the current game (5 worlds, 7 patterns, live in production)
against the evidence base in `docs_evidencias/` (local only, not committed —
contains book-page scans): ADHD & executive function (Barkley, Diamond, Brown),
learning science (Willingham, Roediger/Karpicke, Dunlosky), early numeracy
(Gelman & Gallistel, Clements & Sarama, Fyfe), playful design (Papert, Resnick,
Schell, Deci), childhood bilingualism, inclusion/dyslexia, and child privacy.

## What the game already gets right (keep doing this)

| Evidence | Where the game complies |
|---|---|
| Error as debugging, never failure (Papert, *Mindstorms* p. 23) | No red X, no buzzer; miss 1 → scaffolded retry, miss 2 → solve-together that always ends in success |
| Guided retrieval with high success rate — the form of retrieval practice that works at this age (Karpicke et al. 2014/2016) | The whole game is questions, never exposition; scaffolds guarantee high success |
| Immediate, frequent reinforcement at the point of performance (Barkley pp. 149–150; Luman et al. 2005) | Per-question spoken praise, instant feedback, chest + stars at a visible finish line 5–7 questions away |
| Short sessions, one task per screen, no sustained-attention dependence (ADHD anti-patterns) | 90s–3min missions, single question on screen, progress dots |
| No timers, flexible pacing (inclusion §4) | Nothing in the game depends on response speed |
| No streaks, no absence punishment, no social comparison (design anti-patterns) | Absent by design; sessions end with a closure ritual |
| Text is a barrier until proven otherwise (inclusion §3) | Zero required reading; everything spoken in PT + JA |
| Touch targets (WCAG 2.5.5 AAA = 44px; child inference 48px+) | 64px minimum, enforced by an e2e test |
| Drag must have single-pointer equivalent (WCAG 2.5.7) | All interactions are taps — even "feed" and "trace" need no compound gestures (tracing is the essential exception the norm allows) |
| Manipulatives must embody the quantity, not decorate (numeracy §4) | Berries/cats/dinos ARE the counted objects; give-a-number task = the feed pattern, literally |
| Part-whole structure is the base of later arithmetic (numeracy §3) | The decompose pattern (15 = 10 + ▢) and さくらんぼ plans target exactly this |
| Heritage-language input at the dominance-shift moment (bilingualism §1) | PT-default experience is structured Portuguese input; math vocabulary also in JA, matching school |
| Language separation per session as cautious default (bilingualism §5) | One language at a time, child-switchable with one tap |
| Kana sounds always Japanese regardless of UI language | Correct by design (katakana TTS texts avoid particle readings) |
| Radical data minimization (privacy §1–5) | Local-first IndexedDB, no accounts, no analytics, no network writes; name never leaves the device |
| No cognitive/brain-training claims (ADHD §5, bilingualism §3) | The app claims to teach content, nothing else |

## Findings (ranked)

### F1 — Externalize the spoken number during play (HIGH, cheap)
Barkley's principle 6: place important information *in physical form at the
point of performance* because working memory is the deficit. Today the feed
pattern ("give 3 fruits") and the hop pattern ("jump 3 forward") speak the
number once and then require the child to hold it in working memory — the
numeral + dots scaffold appears only **after** a miss. The equation/compare/
train/kana patterns already externalize (the question stays visible).
**Action:** show a small persistent target cue (numeral, or numeral + dots)
during play in feed and hop, and add the kana pattern's 🔊 replay button to
every pattern. This converts "memory test by accident" into "math practice".

### F2 — Portuguese audio quality is the top language priority (HIGH)
The bilingualism doc is explicit: for a heritage-language child, synthesizing
the heritage language badly is worse than in the majority language — PT audio
quality matters *more*, not less. Dad already reported PT audio bugs (details
TBD) and we already found one gender bug ("dois frutinhas"). **Action:** don't
wait for bug reports — run a systematic listen-through audit of all ~200 PT
lines (script can present each mp3 + its text for judgment), fix, re-bake.

### F3 — No spaced review: completed missions never return (MEDIUM-HIGH)
Distributed practice is a top-2 technique (Dunlosky et al. 2013), and mission
content is currently blocked (one pattern per mission, missions done once).
Kana missions partially mitigate (old rows return as distractors). **Action:**
a lightweight "warm-up" entry point that regenerates 3–5 questions sampled from
*already-completed* missions across worlds (new seed each day). This is also
exactly the Homework Companion warm-up from PLAN.md M3 — evidence says build it
sooner rather than later.

### F4 — Support subitizing with structured arrangements (MEDIUM)
Counting item-by-item is working-memory-expensive; recognizable patterns
(dice faces, pairs) let children see quantity in groups (Clements & Sarama;
numeracy §2/§6). Tap-count deliberately scatters dinos and compare clusters
cats loosely — fine at 1–3, costly at 6–10. **Action:** arrange countables in
dice/five-frame layouts for counts ≥ 4 (at minimum in the compare pattern and
tap-count's larger missions). Keep scatter only where counting one-by-one *is*
the training goal (early tap-count).

### F5 — Praise strategy/process, not just outcome (LOW, cheap)
Current praise lines ("Incrível!", "Você conseguiu!") are outcome praise. The
mindset literature's honest core (small effects, but zero cost and no known
harm) supports praising process. **Action:** when re-baking audio for F2, add
2–3 process-praise variants ("Você contou um por um, muito bem!") to the
rotation, weighted toward together-mode completions.

### F6 — No creation mechanics yet (ROADMAP)
Resnick's 4 Ps prioritize mechanics where the child *builds*. All seven current
patterns are respond-to-prompt. The さくらんぼ cherry-split (drag a number
apart) will be the first construction-flavored mechanic; a free-play "build a
pattern for Pip to ride" mode on the train is another cheap candidate.
**Action:** none now; bias Hero City's design toward construction.

### F7 — Reward economy: keep stars anchored, plan the migration (WATCH)
Deci et al. (1999): expected tangible rewards can erode intrinsic motivation;
Luman et al. (2005): ADHD kids need frequent immediate reinforcement — the
documented working resolution is immediate reinforcement that *migrates toward
informative feedback* as competence grows. Stars are currently fixed per
mission and always awarded — fine. Risks to avoid as M3 approaches: making the
star balance the visual centerpiece, or letting the parent reward catalog turn
stars into wages. Revisit at M3 design time.

### F8 — Adaptive difficulty is still static (ROADMAP, already planned)
Flow needs calibrated challenge (Schell), and the PLAN's adaptive engine (M2)
remains unbuilt: mission params are fixed; only the miss-scaffold adapts within
a question. The N=1 advantage: dad IS the adaptive engine for now (he picks
missions). Fine until the mission count grows; the per-skill mastery model
should arrive with Hero City or shortly after.

### F9 — Privacy: aligned today; the cliff is M4 (WATCH)
Today nothing leaves the device — compliant with LGPD art. 14 principles, COPPA
direction, and the household exception (LGPD art. 4º, I) plausibly applies to
N=1 use. Two tripwires documented in the evidence: (a) the household exception
evaporates the moment the app is distributed or becomes portfolio-with-users —
the privacy floor applies from day one by project principle; (b) M4 cloud sync
is a child-data event: minimization questions (which data? why? how long?
breach impact?) must gate that design, and parental-consent verification needs
real design, not a checkbox.

## Suggested order of attack

1. **F2** — PT audio audit + fixes (dad's reported bugs fold into this; ships to `main` as a fix).
2. **F1** — externalized number cue + replay button in feed/hop (small, ships to `main`).
3. **F4** — dice/five-frame arrangements (pairs naturally with F1 in the same patterns).
4. **F3** — warm-up/review mode (staging; it's a new feature).
5. **F5** — process-praise lines (piggyback on the F2 re-bake).
6. F6–F9 — fold into Hero City design and M3/M4 planning respectively.
