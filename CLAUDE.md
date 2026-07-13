# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational game hub for South Dakota Soil Health Coalition (SDSHC) events. Runs on a 23.8" Dell OptiPlex 7410 touchscreen (1920x1080). Fully offline capable, deployed via GitHub Pages.

**Dual-mode architecture:**
- **Kid Mode** — pixel-art game hub for Pre-K through Middle School. Content sourced from 4 Youth Activities PDFs.
- **Advanced Mode** — sleek, modern game hub for high school and college students. Content sourced from USDA "Full Set Soil Health Lesson Plans" PDF + upgraded kid content + credible web sources (USDA, NRCS, peer-reviewed journals).

## Constraints

- **No sound** — silent operation only
- **No external API calls for gameplay** — everything game-related runs offline. Sole exception: Google Analytics 4 telemetry (fire-and-forget, fails silently when blocked/offline; see [src/utils/analytics.js](src/utils/analytics.js), measurement ID `G-P08D60FD2Y`).
- **All assets local** — fonts bundled, no CDN
- **Touch-first** — no hover-only interactions, all targets minimum 44px. Glow/hover effects must also trigger on tap.
- **Primary target display** — 1920×1080 kiosk, no scrolling, no overflow at that size. Smaller viewports (laptops, tablets, phones) are supported via responsive overrides; see the Responsive Layout section. Kiosk view is preserved by construction — every responsive rule sits inside `@media (max-width: …)` blocks.
- **Kid Mode auto-reset** — 120s idle returns to intro screen, 10s warning at 110s
- **Advanced Mode auto-reset** — 600s (10 min) idle returns to intro screen
- **Admin panel disables idle timer** — `#advanced/admin` keeps the timer off so an admin typing/picking colors isn't kicked back to intro mid-task
- **Progress resets on idle timeout** — each kiosk user starts fresh. Idle reset clears `sdshc-progress` and the session-scoped Farm World look (`sdshc-fw-look`); all `sdshc-lb-*` leaderboard keys survive.

## Tech Stack

- **Vite** — dev server and bundler (`npm run dev` / `npm run build`)
- **Vanilla JavaScript** — ES modules, no framework
- **CSS** — custom properties for theming, no preprocessor
- **three.js** — used ONLY by the Farm World explorer (lazy-loaded chunk, bundled locally — still no CDN/offline-safe)

## Screen Flow

```
Intro Screen (mode select)
  ├── Kid Mode → Grade Select → Game Select → Game → back to Game Select
  └── Advanced Mode → Game Select → Game → back to Game Select
```

## Route Patterns

Hash-based SPA router with mode-aware prefixes:
```
#intro                          → Intro / mode select (default)
#kid/splash                     → Kid splash screen
#kid/grade-select               → Kid tier selection
#kid/game-select/{tier}         → Kid game grid per tier
#kid/game/{gameId}/{level}      → Kid in-game
#advanced/game-select           → Advanced game grid
#advanced/game/{gameId}/{level} → Advanced in-game
#advanced/play-mode             → Team-vs-casual prompt (only when an event is active and no session choice yet)
#advanced/roster                → Event roster setup (team-play only; redirects to game-select otherwise)
#advanced/admin                 → Leaderboard admin panel (idle timer off)
```

`navigate(path)` auto-prepends current mode. Use `navigateRaw(hash)` for cross-mode navigation (intro, idle reset). Legacy unprefixed hashes are treated as kid mode for backwards compat.

`switchScreen()` in [main.js](src/main.js) defensively sweeps orphaned `.screen` elements before each transition so interrupted animations can't leave stacked DOM. Game/screen modules don't need to replicate this.

## File Structure

```
public/
  assets/
    sprites/        # pixel-art PNGs (Sprout Lands pack) — Kid Mode only
    svg/            # SVG diagrams and game assets — Kid Mode only
    gifs/           # animated GIFs (farm scenes, animals, plants) — Kid Mode only
    backgrounds/    # pixel-background*.jpg — Kid Mode only
    field-guide/    # *.webp photos for Field Guide (Advanced) — only image assets in Advanced Mode
    fonts/          # Silkscreen, 04b03, JetBrains Mono, Noto Sans Symbols 2
    other/          # misc PNGs used by a few kid games
src/
  main.js           # entry point, mode-aware route handling, screen-sweep on transitions
  router.js         # hash-based SPA router with mode prefixes
  idle-timer.js     # idle detection with configurable timeout per mode
  styles/
    base.css        # reset, @font-face, CSS custom properties
    hub.css         # kid mode: splash, grade select, game select
    games.css       # kid mode: shared in-game UI components
    transitions.css # screen transition animations (shared)
    intro.css       # intro screen: gradient spheres, particles, glow effects
    theme.css       # advanced mode: dark/light CSS custom properties
    advanced.css    # advanced mode: all advanced UI styles
    leaderboard.css # leaderboard modal, play-mode, roster, admin panel
  screens/
    intro.js        # mode select screen (Kid Mode / Advanced Mode)
    splash.js       # kid mode: title screen
    grade-select.js # kid mode: character + tier selection
    game-select.js  # kid mode: game card grid per tier
    advanced-game-select.js  # advanced mode: game card grid
    advanced-play-mode.js    # advanced mode: team-vs-casual prompt (sessionStorage choice)
    advanced-roster.js       # advanced mode: event roster setup (team play only)
    advanced-admin.js        # advanced mode: leaderboard admin panel (Phase 1A: no auth)
  games/
    soil-cake.js    # Kid game modules (standalone, export createXxxGame())
    coloring.js
    planting-sim.js
    spin-wheel.js
    trivia-blitz.js
    advanced/
      spin-wheel.js       # Advanced: converted from kid, dark theme, multiplayer
      trivia-blitz.js     # Advanced: converted from kid, dark theme, multiplayer
      jeopardy.js         # Advanced: category grid, daily doubles, multiplayer
      word-game.js        # Advanced: Wheel of Fortune style, multiplayer
      field-guide.js      # Advanced: photo ID game (exception to no-image rule)
      connections.js      # Advanced: NYT Connections style, group 16 tiles
      farm-world/         # Advanced: 3D farm explorer (three.js) — index.js, world.js, controls.js
  data/
    game-registry.js      # kid mode game metadata (GAMES array + TIER_META)
    advanced-game-registry.js  # advanced mode game metadata (flat ADVANCED_GAMES array + getGamePar())
    content/
      soil-cake.js        # kid content files
      coloring.js
      planting-sim.js
      spin-wheel.js
      trivia-blitz.js
      advanced/
        shared.js         # PLAYER_COLORS palette shared across advanced games
        spin-wheel.js     # advanced content: PDF + upgraded kid categories
        trivia-blitz.js
        jeopardy.js
        word-game.js
        field-guide.js
        connections.js
  utils/
    svg-recolor.js       # SVG preprocessing for coloring game
    gradient-bg.js       # animated gradient background for advanced games
    theme-toggle.js      # dark/light mode toggle component
    help-overlay.js      # help/rules overlay component
    typewriter.js        # typewriter text animation effect
    game-helpers.js      # shuffleArray + transitionTo, shared by advanced games
    analytics.js         # GA4 wrapper (trackEvent + named helpers); fails silently
    narrow-gate.js       # CSS-driven "screen too narrow" overlay mounted by game screens
    leaderboard-api.js   # leaderboard data layer (Promise-returning; localStorage today, Firestore-ready)
    leaderboard-modal.js # createLeaderboardButton() trophy + modal with tabs
    team-input.js        # shared player+team input rows for advanced game intros
    team-colors.js       # team accent palette, deterministic fallback, swatch picker
    profanity.js         # isClean(name) wordlist filter for team-name submissions
```

## Fonts

Four bundled fonts. Never use Google Fonts CDN.

| Font | CSS Variable | Usage |
|------|-------------|-------|
| Silkscreen | `--font-title` | Main titles, hub name (both modes) |
| 04b03 | `--font-header` | Section headers, game titles (Kid Mode only) |
| JetBrains Mono | `--font-body` | Body text, questions (both modes) |
| Noto Sans Symbols 2 | (no var — used directly) | Unicode game icons in the advanced game registry |

## Intro Screen

The entry point for the hub. Choosing a mode navigates into that mode's flow.

- **Background:** Animated gradient spheres (teal/green palette), grid overlay, noise texture, ambient floating particles, touch-interactive particles
- **Title:** "SDSHC Games Hub" in Silkscreen with teal glow effect
- **Kid Mode button:** Rainbow animated gradient text → navigates to `#kid/grade-select`
- **Advanced Mode button:** Teal→yellow-green gradient text → navigates to `#advanced/game-select`
- Buttons have idle pulse animation and particle burst on tap

## Kid Mode

### Colors

| Tier | Color | Hex |
|------|-------|-----|
| Little Sprouts (Pre-K - 2nd) | Green | `#a6c264` |
| Meadow Makers (3rd - 5th) | Pink | `#e496d7` |
| Harvest Guardians (Middle & High) | Teal | `#38cebc` |

Base palette: earthy greens, warm browns, sky blues, cream/parchment backgrounds. Inspired by Cupnooble's Sprout Lands asset pack.

### Visual Design Rules (Kid Mode)

- **Nature-centered** — fill dead space with foliage sprites and creature GIFs
- **Pixel art aesthetic** — all UI elements consistent with Sprout Lands style
- **Smooth transitions** — CSS transitions (slide/fade, ~300ms)
- **No wooden signboard assets for buttons** — CSS-styled card buttons with tier accent colors
- Uses image assets: sprites, SVGs, GIFs, backgrounds

### Grade Tiers

| Tier | Name | Grades | Games |
|------|------|--------|-------|
| 1 | Little Sprouts | Pre-K - 2nd | Games 1-4 (visual, drag, tap, zero reading) |
| 2 | Meadow Makers | 3rd - 5th | Games 5-8 (matching, trivia, cause-and-effect) |
| 3 | Harvest Guardians | Middle & High | Games 9-11 (systems, strategy, challenging trivia) |

### Kid Games (11 total)

1. Build a Soil Cake — fill soil layers with colors
2. Dot-to-Dot — starfield aesthetic, glowing numbered dots
3. Things That Don't Belong — tap the odd one out (4 items)
4. Soil Critter Coloring — canvas flood-fill on SVG line art
5. Planting Simulation — drag plants to correct garden zones
6. Spin the Soil Wheel — spin wheel + trivia questions
7. Odd One Out — fast-paced classification rounds
8. Drag and Drop Matching — match words to images/positions
9. Farm Manager Simulator — select conservation practices for scenarios
10. Soil Health Trivia Blitz — timed multiple choice
11. Soil Food Web Builder — drag organisms + draw feeding arrows

## Advanced Mode

### Design Rules (Advanced Mode)

- **NO image assets** — everything is CSS-only, Unicode symbols, inline SVG at most **field guide game is exception**
- **Clean, sleek, modern UI** — no pixel art, no sprites, no decorative images
- **Dark/light mode toggle** — dark default, light option. Persisted in `localStorage`
- **Silkscreen** for titles, **JetBrains Mono** for body text
- **All games support multiplayer** — up to 4 players, turn-based
- **End-of-game impact overlays** — brief conservation/soil health takeaway messages where applicable

### Colors (Advanced Mode)

CSS custom properties scoped under `[data-mode="advanced"]`:
```
--adv-bg: #0a0a14           (dark background)
--adv-surface: #1a1a2e      (card/panel surfaces)
--adv-text: #e0e0e0          (primary text)
--adv-accent: #38cebc        (teal — primary accent)
--adv-accent-secondary: #b8e84a  (yellow-green — secondary accent)
--adv-border: #2a2a3e        (subtle borders)
```

Light theme overrides under `[data-mode="advanced"][data-theme="light"]`.

### Advanced Games (6 total)

1. **Spin the Wheel** (`adv-spin-wheel`) — converted from kid version, harder questions, dark theme, multiplayer
2. **Trivia Blitz** (`adv-trivia-blitz`) — converted from kid version, college-level questions, dark theme, multiplayer
3. **Soil Jeopardy** (`adv-jeopardy`) — category grid (6 categories x 5 point values), daily doubles, multiplayer
4. **Word or Worm?** (`adv-word-game`) — Wheel of Fortune style, guess soil science terms letter by letter, multiplayer
5. **Field Guide** (`adv-field-guide`) — photo identification game (exception to no-image-assets rule), multiplayer
6. **Conservation Connections** (`adv-connections`) — NYT Connections style, sort 16 tiles into 4 hidden groups, multiplayer

### Farm World (hidden 7th experience)

**Farm World** (`adv-farm-world`) — Coastal World-inspired 3D farm explorer ([src/games/advanced/farm-world/](src/games/advanced/farm-world/)). Walk a mascot character around a low-poly procedural island (three.js — second exception to the no-image-assets rule: WebGL canvas, but zero textures/image files) and visit 7 stations; each shows a lesson → 2 multiple-choice questions → sourced fact, then visually restores that corner of the farm. The in-world HUD is deliberately Coastal-style (white rounded cards, identical in both themes); the world screen `.adv-fw-world` is excluded from the advanced-mode position clamp in advanced.css. Question pools reuse the Trivia Blitz rounds; facts reuse existing IMPACT_MESSAGES ([src/data/content/advanced/farm-world.js](src/data/content/advanced/farm-world.js)).

- **Not in the game grid** — registry entry has `hidden: true` (filtered out of `getAllAdvancedGames()`, still routable via `getAdvancedGameById`). Launched only from the circular 𖧧 button in the game-select header, left of the leaderboard trophy.
- Single player, no leaderboard recording (its `par` is defensive only).
- Controls: on-screen virtual joystick (kiosk) + WASD/arrows (laptops); E/Enter/Space or the Visit button to interact. Drag the scene to orbit the camera, wheel/two-finger-pinch to zoom, ⊙ topbar button resets the view. ☺ opens the player customizer (body/hat/shoes/backpack; persisted in localStorage `sdshc-fw-look`). The theme-toggle slot in the world topbar is a day/night switch for the 3D scene (default day) — the app theme toggle only appears on the Farm World intro.
- Standard narrow gate at ≤ 599px; falls back to a friendly message if WebGL is unavailable.

### Advanced Game Registry

Flat array (no tiers). Each entry:
```js
{ id, title, description, icon (Unicode symbol, swappable later), players, par, hidden?, module: () => import(...) }
```

`par` is the leaderboard's normalization reference — see the Leaderboard section below. To recalibrate after watching real play, just edit the number; the entire score history re-normalizes instantly. `getGamePar(id)` from the same module is the read-side accessor (falls back to `DEFAULT_PAR = 1500` for unknown ids).

### Content Strategy (Advanced Mode)

**Sources (priority order):**
1. USDA "Full Set Soil Health Lesson Plans" PDF (18 lessons, 113 pages)
2. Existing kid content upgraded with harder vocabulary and trickier answer choices
3. Credible web sources: USDA website, NRCS, peer-reviewed research journals

**Topics from USDA PDF:** Soil Components, Texture & Structure, Organic Matter, Textural Triangle, Soil Moisture, Erosion, Bulk Density, Soil Respiration, EC, pH, Nitrogen Cycle, Phosphorus, Infiltration

**Topics upgraded from kid content:** Soil Art & Culture (history/culture focus), Indigenous Farming (practices, history, regions), Agronomy Careers (types, goals), Conservation Practices (practice types, uses, relationships to soil/farming/climate/wildlife), Climate Change, Carbon Cycle

**Rules:**
- NO calculation-style questions — all conceptual
- Do not invent educational facts — all content sourced from PDF, kid content, or credible web sources
- End-of-game impact overlays: 1-2 sentence conservation impact messages, auto-dismiss after ~8s, only where topically natural

## Game Module Pattern

Each game is a standalone module exporting a `createXxxGame()` function that returns a DOM element. No GameBase class — games manage their own state, DOM, and events.

Games register via their respective registry (`game-registry.js` for kid, `advanced-game-registry.js` for advanced). Advanced games are lazy-loaded via dynamic `import()` in the registry.

Content is separated into data files in `src/data/content/` (kid) and `src/data/content/advanced/` (advanced).

### Advanced Game Shared Utils

Advanced games share common UI components from `src/utils/`:
- `gradient-bg.js` — `addGradientBackground(el)` adds the animated gradient spheres backdrop
- `theme-toggle.js` — `createThemeToggle()` returns a dark/light toggle button, persists to `localStorage`
- `help-overlay.js` — `createHelpButton(rules)` returns a "?" button that shows a rules overlay
- `typewriter.js` — `typewriter(el, text)` animates text character by character
- `game-helpers.js` — `shuffleArray(arr)` and `transitionTo(currentEl, newEl)` used by every advanced game
- `leaderboard-modal.js` — `createLeaderboardButton()` returns the trophy button to drop into the top bar; opens the leaderboard modal
- `team-input.js` — shared player + team-name input rows for game intros, behavior driven by current play mode
- `analytics.js` — `trackGameStart / trackGameComplete / trackGameQuit / trackTopicSelect` etc. Fire-and-forget; safe to call when offline

Every advanced game screen must use `flex-direction: column` layout with `padding-top: 48px` on the main panel to accommodate the top bar.

## Leaderboard (Advanced Mode)

A team/school competition system layered on Advanced Mode. **All phases are live:** Phase 1A (data layer), Phase 1B (Firebase/Firestore backend + Firebase-Auth admin sign-in), and Phase 2 (par-normalized scoring). The backend is selected by `USE_FIRESTORE` in [src/firebase/config.js](src/firebase/config.js) — currently `true` (Firestore + offline persistence). Flip it to `false` to fall back to the localStorage layer. See [the-website-advanced-mode-fluttering-dove plan](../../.claude/plans/the-website-advanced-mode-fluttering-dove.md) for the full design.

### Flow

```
Intro → Advanced Mode
  ├── active event + no session play-mode → #advanced/play-mode
  │     ├── Team play  → #advanced/roster → #advanced/game-select
  │     └── Casual     → #advanced/game-select  (teamId stays null on scores)
  └── no active event → #advanced/game-select directly
```

Session play-mode lives in `sessionStorage['sdshc-lb-play-mode']`. Returning to `#intro` clears it so each fresh entry re-prompts.

### Data layer

[src/utils/leaderboard-api.js](src/utils/leaderboard-api.js) is a thin **backend selector**: it re-exports either `leaderboard-api.firestore.js` (when `USE_FIRESTORE`) or `leaderboard-api.local.js`. Both expose the identical Promise-returning surface, so callers never change. Every consumer imports from `leaderboard-api.js`, never the impls directly.

**Firestore mode (live):** collections `/teams`, `/events`, `/scores`, plus `/admins/{uid}` (admin allow-list checked by `firestore.rules`) and `/config`. Offline persistence is `persistentLocalCache` + `persistentSingleTabManager` — **single browser tab only**. Writes made offline cache immediately and replay on reconnect; idempotency is by deterministic score doc ids `{runId}__{i}`.

**Per-kiosk / session keys (used in both modes):**
```
sdshc-lb-active-event  eventId|null (per-kiosk, localStorage)
sdshc-lb-kiosk-id      stable UUID (per-kiosk, localStorage)
sdshc-lb-play-mode     "team" | "casual" (sessionStorage, see above)
```

**localStorage mode only** (`USE_FIRESTORE = false`) additionally stores the full dataset under `sdshc-lb-teams` / `sdshc-lb-events` / `sdshc-lb-scores` (`{ schemaVersion, … }`). In Firestore mode those are superseded by the collections above.

### Team status model

- **Global team status** (`team.status`): `pending | approved | hidden`. Controls visibility on This-Month / All-Time leaderboards.
- **Per-event roster status** (entry in `event.roster`): `pending | approved`. Controls visibility on the Current-Event leaderboard. Independent of global status — an organizer can approve a team for one event without committing to statewide visibility.
- The team/school **dropdown** (autocomplete `<datalist>`) on game intros lists **approved teams only** — pending teams are intentionally excluded so unmoderated names don't autocomplete-suggest ([team-input.js](src/utils/team-input.js) `ensureRosterDatalist`). A pending team is still immediately playable: typing its name manually resolves to the existing pending team and tags scores correctly. Scores just don't appear publicly until the team is approved.
- Profane names blocked inline by `isClean()` in [profanity.js](src/utils/profanity.js) before they hit the queue.

### Scoring (Phase 2 — par-normalized)

Headline ranking metric is **normalized par × 100**, summed across all runs. For each score record: `displayed = max(0, raw) ÷ par × 100`. A "par" run scores ~100; great runs go higher. Negative runs floor at 0.

Both columns are shown — **Score** (normalized, sorted) and **Raw** (actual points, muted). All 6 games count (the "official games subset" idea from the original sketch was dropped — normalization handles fairness). Computed at read time inside `getLeaderboard()`, not on write, so changing a `par` recomputes the entire history instantly.

### Admin (`#advanced/admin`)

Sections: active event, pending teams, all teams, events (start / schedule / end / reopen / delete), recent scores (with per-row delete), per-event roster moderation, team color picker, offline cache warm-up. Idle timer is force-disabled here. In Firestore mode the panel sits behind a **Firebase-Auth sign-in gate** (password only; the screen signs in as `ADMIN_EMAIL` under the hood and requires an `/admins/{uid}` doc per `firestore.rules`); session persists via `browserLocalPersistence`. In localStorage mode the panel renders with no auth.

### Game-side integration

Every advanced game's intro renders player rows via `team-input.js`. In team mode, each row pairs a player-name input with a school/team dropdown sourced from the event's approved roster (free-typing a new name adds it as pending). In casual mode the team line is hidden and `teamId` stays null. On results, the game calls `recordScoresWithStatus({ gameId, runId, entries, eventId: getScoreEventId() })` ([src/utils/score-save-status.js](src/utils/score-save-status.js)) — a wrapper around `recordScores` that shows a small non-blocking save-status pill (saving / saved / saved-offline / failed) so players get feedback, with a per-run UUID for idempotency.

## Responsive Layout

Hub was originally kiosk-only; Advanced Mode now needs to work on classroom laptops, tablets, and landscape phones too. Full design in [.claude/plans/jaunty-bouncing-sparrow.md](../../.claude/plans/jaunty-bouncing-sparrow.md). 

### Kiosk safety rule

Every responsive rule lives inside a `@media (max-width: …)` block. At 1920×1080 nothing in any media query fires, so the kiosk view is pixel-identical to pre-responsive. **Never** add unconditional rules that change a kiosk-visible style; if you do, append a media-query override instead of mutating the base rule.

### Breakpoints

Documented as CSS custom properties on `:root` in [base.css](src/styles/base.css) (for grep only — CSS can't read them inside `@media`):

| Token | Value | Treatment |
|---|---|---|
| `--bp-laptop` | `1279px` | ≤ this: laptop / tablet landscape — scrolling enabled, shells reflow |
| `--bp-tablet` | `899px` | ≤ this: tablet portrait / large landscape phone — sidebar collapses (orientation-aware) |
| `--bp-gate` | `599px` | ≤ this: game screens gated; shell screens (intro, game-select, roster, play-mode, admin) still work |

### Page-scroll override

At ≤ 1279px, `.screen` becomes `overflow-y: auto` with `justify-content: safe center` (vertical centering when content fits, top-aligned when it overflows). Screens stay absolutely positioned so screen-enter/exit transitions still overlay cleanly.

### Narrow gate

[src/utils/narrow-gate.js](src/utils/narrow-gate.js) exports `mountNarrowGate(parent, opts)` (preferred — defers append by a microtask so the gate survives a synchronous `parent.innerHTML = …`) and `createNarrowGate(opts)` (legacy synchronous). The gate is CSS-driven: `display: none` by default, flipped to `display: flex` at the appropriate breakpoint.

Two variants, one default + one wide:
- Default — `.too-narrow-gate` activates at ≤ 599px. Used by every advanced game and most kid games.
- Wide — `.too-narrow-gate-wide` activates at ≤ 899px (`mountNarrowGate(el, { wide: true })`). Used by games whose layouts can't compress to tablet width (e.g. kid food-web with hardcoded zone pixel widths, advanced field-guide below ~700px).

Shell screens (intro, both game-selects, roster, play-mode, admin) **never** mount the gate so they stay usable in portrait.

### Advanced game sidebar pattern

The 280px fixed sidebar in advanced games adapts by orientation, not just width:

| Viewport | Sidebar treatment |
|---|---|
| ≥ 1280px (laptop / kiosk) | Stays 280px, unchanged |
| 900–1279px (tablet landscape, small laptop) | Stays on left, may shrink to ~240px |
| ≤ 899px **landscape** | Stays on left, shrunk to ~160–180px; fonts compact |
| ≤ 899px **portrait** | Collapses to slim horizontal bottom bar (~60–80px) |
| ≤ 599px portrait | Gated (game doesn't load) |

The orientation-aware split is `@media (max-width: 899px) and (orientation: portrait)` vs `… and (orientation: landscape)`. Reuse this pattern per-game inside [advanced.css](src/styles/advanced.css), scoped to the game's class prefix.

### Canvas-based games

Canvas dimensions can't be media-query'd. Use a `ResizeObserver` on the canvas's container and recompute on resize. [src/games/advanced/spin-wheel.js](src/games/advanced/spin-wheel.js) is the reference: `applyCanvasSize(size)` floors at 220, caps at 700, and `drawWheel()` is called from the observer. The `WHEEL_CSS_SIZE = 420` default keeps the kiosk render identical until the observer fires.

### CSS organization

Media-query blocks live at the **bottom** of the existing CSS file that owns the affected styles (matches the precedent in [leaderboard.css](src/styles/leaderboard.css)). Easy to audit kiosk-safety by checking nothing outside `@media` blocks changed.

## Asset References

- Sprites: `use-these-assets/sprites/` (83 PNGs) — Kid Mode only
- SVGs: `use-these-assets/svg files/` (104 SVGs) — Kid Mode only
- GIFs: `use-these-assets/*.gif` (27 animations) — Kid Mode only
- Backgrounds: `use-these-assets/pixel-background*.jpg` (9 images) — Kid Mode only
- Field Guide photos: `public/assets/field-guide/{category}/*.webp` — Advanced Mode (sole image-asset exception)
- Kid content: `Youth Activities PDFs/Clues & Answers.md`
- Advanced content: `Full-Set-Soil-Health-Lesson-Plans.pdf`

## Development

```bash
npm run dev      # start Vite dev server
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Deployment

- **Online:** GitHub Actions deploys `dist/` to GitHub Pages on push to main
- **Offline:** `npm run dev` on the target machine for localhost access

## Key References

- `REDO.md` — detailed kid game descriptions, asset mappings, UX flow
- `Youth Activities PDFs/Clues & Answers.md` — all kid educational content mapped to assets
- `Full-Set-Soil-Health-Lesson-Plans.pdf` — USDA soil science curriculum for advanced content
- `.claude/plans/the-website-advanced-mode-fluttering-dove.md` — leaderboard system design (Phases 1A/1B/2)
- `.claude/plans/jaunty-bouncing-sparrow.md` — responsive overhaul plan (in progress)
- Design inspiration: Cupnooble's Sprout Lands (https://cupnooble.itch.io/sprout-lands-asset-pack)

## Other notes
- Always ask the user clarifying questions when needed or helpful
- Agent instructions (subagents, design/build workflow) are in the parent `.claude/CLAUDE.md` — not repeated here
