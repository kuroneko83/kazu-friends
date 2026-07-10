# Kazu Friends — Math Adventure App (working title)

> "Kazu" (数) = "number" in Japanese, and sounds friendly in Portuguese too. **Naming tip from the PM:** let your son pick/rename the app and the main creature — co-naming gives him ownership before he even plays. Working title used in code: `kazu-friends`.

## Context

A math practice game for the user's 6-year-old son: ADHD, first grade at a Japanese school (math taught in Japanese), Portuguese spoken at home, pre-reader, 2–5 minute attention window. Homework time is currently stressful for both him and his dad. The goal is a game he *looks forward to*, used as a **homework companion** (warm-up before homework, victory lap after), covering the full Japanese Grade 1 math curriculum. Full vision, cloud sync from day one, built as a PWA in `/Users/atilalima/portfolio_projects/kazu-friends`.

### Child profile → design constraints (the spec behind every decision)

| Fact | Design consequence |
|---|---|
| Pre-reader | Zero required reading. Every instruction spoken + iconic. Text appears only as decoration/reinforcement. |
| ADHD, 2–5 min focus | Missions are 5–7 questions, 90s–3min, with a **visible finish line** (progress dots) and a guaranteed reward moment at the end. One task on screen at a time. |
| Frustration depends on mood | Adaptive difficulty + struggle detection: 2 misses in a row → auto-easier variant + visual scaffolding. **No red X, no buzzer, no visible timers, no lives.** Wrong answers become "let's solve it together" moments. |
| School math in Japanese | Word problems & math vocabulary in Japanese (matching school tests), incl. さくらんぼ算-style decomposition visuals used in Japanese 1st grade. A "help" button replays the problem in Portuguese. |
| Portuguese at home | Full UI/audio available in both PT-BR and JA; parent picks default, child can tap-to-switch. **No English anywhere.** |
| Loves dinos, space, heroes, Mario-style stories, cats, Pokémon | Four themed worlds + an original collectible-creature system (all original characters — no copyrighted IP). |
| Motivated by real-world rewards | Star economy → **parent-managed reward catalog** (e.g., park trip = 30 ⭐) with a redemption ceremony screen. |
| Dad = storyteller | **Story Cards**: after each session the app generates a story seed for dad (creatures + the math he practiced) to weave into bedtime stories. In-game story chapters unlock between worlds. |
| Character TTS voices | Pre-generated TTS audio (ja-JP + pt-BR), one distinct voice per character, shipped as static assets so audio works offline with zero runtime cost. |

## Game design

### Structure
- **World Map** (home screen): 4 worlds — 🦖 Dino Valley, 🚀 Star Station, 🦸 Hero City, 🐾 Whisker Woods. Each world has a chain of missions on a path (Mario-style overworld). All math topics appear in every world; worlds are theme, not topic silos.
- **Missions**: 5–7 questions, one interaction pattern per mission, ends with a chest/egg animation + stars. Interaction patterns (all touch-first, huge targets):
  1. **Tap-count** — tap the dinos as they're counted aloud
  2. **Feed the creature** — drag the right number of items (addition/subtraction with objects)
  3. **Number line hop** — hop the creature along a 0–20 line (+/- as movement)
  4. **Decomposition cherries** — さくらんぼ算: split a number into two bubbles (composition of 10, carrying)
  5. **Which is more?** — comparison with visual quantities
  6. **Pattern train** — complete the shape/color/number sequence on train cars
  7. **Story problems** — narrated Japanese word problem acted out by creatures on screen; answer by tapping/dragging (no reading)
  8. **Clock helper** — set the hands for the creature's schedule (o'clock / half past)
- **Creature collection**: completing mission chains hatches original collectible creatures ("Kazumates"). Creatures ride along in later missions and cheer. **Variable reward schedule** (mystery eggs, occasional rare finds) — the ADHD-friendly dopamine loop, but bounded: no loot-box UI, no scarcity pressure.
- **Homework Companion mode** (its own big button, for dad to launch):
  - **Warm-up** (before homework): one 2-min confidence mission at slightly-below current level — starts homework on a win.
  - **Victory lap** (after homework): dad taps "homework done!" → bonus stars + one free-choice fun mission. Homework itself becomes a star-earning step.
- **Session end ritual**: every session ends the same way — stars fly into his bank, creature says goodbye by name, "see you tomorrow" in his chosen language. Predictable closure, easy handoff off-screen.

### Adaptive engine
- Per-skill mastery tracking (~20 skill nodes across the Grade 1 curriculum), simple mastery model: each skill has a level 0–5; correct answers advance, misses trigger scaffolding before dropping level.
- Struggle detection: 2 consecutive misses → same concept, easier representation (abstract → concrete objects); 3rd miss → the creature "solves it with him" step-by-step (always ends in success).
- Mission generator: parameterized question templates per skill × difficulty level — content is generated, not hand-authored, so there's effectively infinite practice.

### Curriculum (Japanese Grade 1 算数)
Numbers 0–120 (recognition, counting, sequence) · composition/decomposition of 10 · addition/subtraction within 20 incl. carrying/borrowing via さくらんぼ decomposition · comparison (おおい/すくない) · patterns & shapes · narrated word problems (ぶんしょうだい) · clock basics (なんじ/なんじはん).

### Parent area (PIN-protected route)
- Skills heatmap + streaks + "what he practiced today" (glanceable in 10 seconds)
- **Reward catalog manager**: create rewards with emoji/photo + star price; approve redemptions
- **Story Cards** feed for storyteller dad
- Focus setter: "this week, weave in subtraction" → generator weights missions
- Settings: language default, audio, reduced-motion, session length cap

## Architecture

- **Frontend**: React 18 + TypeScript + Vite. PWA (installable, offline-first via service worker). Framer Motion for animation, Howler.js for audio, Zustand for game state. SVG-based art (crisp on any device, tiny bundle; original character art as SVG).
- **Local-first data**: IndexedDB via Dexie — the child is never blocked by network. All progress writes land locally first.
- **Cloud sync**: **Supabase** (Postgres + Auth + Storage). One parent account (email auth), child profile(s) under it. Background sync pushes local event log → Supabase; any device pulls latest state on launch. Conflict rule: progress is additive (max-merge of mastery levels, sum of stars from event log) — no destructive conflicts possible.
- **Audio pipeline**: build-time script calls a TTS API (Google Cloud TTS — strong ja-JP Neural2 + pt-BR voices; final voice choice at implementation) for every line in `content/lines.{ja,pt}.json` → versioned `.mp3` assets per character voice. Runtime just plays files; fully offline-capable. Adding content = editing JSON + rerunning the script.
- **Schema (Supabase)**: `parents`, `children`, `skill_state` (child × skill → level, last_seen), `session_events` (append-only log), `rewards`, `redemptions`, `creatures_unlocked`. Row-level security scoped to parent account.
- **Deploy**: Netlify or Vercel (matches existing portfolio projects); Supabase hosted free tier is plenty.

## Milestones (full vision, staged so he plays early)

**M1 — Playable core (his first playtest)**
Project scaffold, PWA shell, design tokens (calm palette, XL touch targets), audio pipeline with 2 character voices (JA+PT), mission player with patterns 1–3, star bank, one world (Dino Valley) with a 10-mission path, local-first storage, session end ritual. *Deliverable: he plays counting + addition missions on the tablet.*

**M2 — Depth & adaptivity**
Remaining interaction patterns (4–8), full 20-node curriculum with mission generator, adaptive engine + struggle scaffolding, creature collection + mystery eggs, all 4 worlds.

**M3 — Family loop**
Homework Companion mode, parent PIN area, reward catalog + redemption ceremony, Story Cards generator, weekly focus setter, story chapter unlocks between worlds.

**M4 — Cloud & polish**
Supabase auth + sync (multi-device), parent dashboard heatmap/streaks, settings (reduced motion, session caps), sound design pass, cross-device QA, deploy.

## Verification

- **Per milestone**: `npm run dev` + manual play-through of every new interaction pattern; Playwright smoke test (launch → complete a mission → stars awarded → progress persisted after reload).
- **Audio**: script that verifies every content line has generated JA + PT audio files.
- **Offline**: DevTools offline mode — complete a full mission with network killed; then reconnect and confirm Supabase sync (M4).
- **Multi-device**: playtest on tablet + phone + laptop; touch targets ≥ 64px verified at smallest viewport.
- **The real test**: structured playtests with his son at each milestone — watch for the 3 ADHD signals: does he finish a mission unprompted? does he ask to play again? how does he react to a miss? Feed findings into the next milestone.

## Notes & guardrails

- All characters/creatures are **original** — inspired by the vibes of dinos/Pokémon/Mario, never using the IP itself (matters if this later joins the portfolio publicly).
- No dark patterns: no streak-shaming, no countdown pressure, no infinite play loops — the game encourages *ending* sessions well.
- Architecture keeps multi-child support trivial (child profiles already modeled) — future portfolio/product value at zero extra cost now.
