# SDSHC Games Hub

## Project Overview

Educational game hub for South Dakota Soil Health Coalition (SDSHC) events. Runs on a 23.8" Dell OptiPlex 7410 touchscreen (1920x1080). Fully offline capable, deployed via GitHub Pages.

**Dual-mode architecture:**
- **Kid Mode** — pixel-art game hub for Pre-K through Middle School. Content sourced from 4 Youth Activities PDFs.
- **Advanced Mode** — sleek, modern game hub for high school and college students. Content sourced from USDA "Full Set Soil Health Lesson Plans" PDF + upgraded kid content + credible web sources (USDA, NRCS, peer-reviewed journals).

## Constraints

- **No sound** — silent operation only
- **No external API calls** — everything runs offline
- **All assets local** — fonts bundled as woff2, no CDN
- **Touch-first** — no hover-only interactions, all targets minimum 44px. Glow/hover effects must also trigger on tap.
- **Target display** — 1920x1080, no scrolling, no overflow
- **Kid Mode auto-reset** — 120s idle returns to intro screen, 10s warning at 110s
- **Advanced Mode auto-reset** — 300s (5 min) idle returns to intro screen
- **Progress resets on idle timeout** — each kiosk user starts fresh

## Tech Stack

- **Vite** — dev server and bundler (`npm run dev` / `npm run build`)
- **Vanilla JavaScript** — ES modules, no framework
- **CSS** — custom properties for theming, no preprocessor

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
```

`navigate(path)` auto-prepends current mode. Use `navigateRaw(hash)` for cross-mode navigation (intro, idle reset).

## File Structure

```
public/
  assets/
    sprites/        # pixel-art PNGs (Sprout Lands pack) — Kid Mode only
    svg/            # SVG diagrams and game assets — Kid Mode only
    gifs/           # animated GIFs (farm scenes, animals, plants) — Kid Mode only
    backgrounds/    # pixel-background*.jpg — Kid Mode only
    fonts/          # silkscreen.woff2, 04b03.woff2, jetbrains-mono.woff2
src/
  main.js           # entry point, mode-aware route handling
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
  screens/
    intro.js        # mode select screen (Kid Mode / Advanced Mode)
    splash.js       # kid mode: title screen
    grade-select.js # kid mode: character + tier selection
    game-select.js  # kid mode: game card grid per tier
    advanced-game-select.js  # advanced mode: game card grid
  games/
    soil-cake.js    # Kid game modules (standalone, export createXxxGame())
    coloring.js
    planting-sim.js
    spin-wheel.js
    trivia-blitz.js
    advanced/
      spin-wheel.js       # Advanced: converted from kid, dark theme, multiplayer
      trivia-blitz.js     # Advanced: converted from kid, dark theme, multiplayer
      jeopardy.js         # Advanced: new, category grid, multiplayer
      word-game.js        # Advanced: new, Wheel of Fortune style, multiplayer
  data/
    game-registry.js      # kid mode game metadata
    advanced-game-registry.js  # advanced mode game metadata (flat, no tiers)
    content/
      soil-cake.js        # kid content files
      coloring.js
      planting-sim.js
      spin-wheel.js
      trivia-blitz.js
      advanced/
        spin-wheel.js     # advanced content: PDF + upgraded kid categories
        trivia-blitz.js
        jeopardy.js
        word-game.js
  utils/
    svg-recolor.js  # SVG preprocessing for coloring game
```

## Fonts

Three bundled pixel fonts. Never use Google Fonts CDN.

| Font | CSS Variable | Usage |
|------|-------------|-------|
| Silkscreen | `--font-title` | Main titles, hub name (both modes) |
| 04b03 | `--font-header` | Section headers, game titles (Kid Mode only) |
| JetBrains Mono | `--font-body` | Body text, questions (both modes) |

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

- **NO image assets** — everything is CSS-only, Unicode symbols, inline SVG at most
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

### Advanced Games (4 total)

1. **Spin the Wheel** — converted from kid version, harder questions, dark theme, multiplayer
2. **Trivia Blitz** — converted from kid version, college-level questions, dark theme, multiplayer
3. **Soil Jeopardy** — category grid (5-6 categories x 5 point values), daily doubles, multiplayer
4. **Word Game** — Wheel of Fortune style, guess soil science terms letter by letter, depleting progress bar for wrong guesses, multiplayer

### Advanced Game Registry

Flat array (no tiers). Each entry:
```js
{ id, title, description, icon (Unicode symbol, swappable later), module: () => import(...) }
```

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

Games register via their respective registry (`game-registry.js` for kid, `advanced-game-registry.js` for advanced).

Content is separated into data files in `src/data/content/` (kid) and `src/data/content/advanced/` (advanced).

## Asset References

- Sprites: `use-these-assets/sprites/` (83 PNGs) — Kid Mode only
- SVGs: `use-these-assets/svg files/` (104 SVGs) — Kid Mode only
- GIFs: `use-these-assets/*.gif` (27 animations) — Kid Mode only
- Backgrounds: `use-these-assets/pixel-background*.jpg` (9 images) — Kid Mode only
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
- Design inspiration: Cupnooble's Sprout Lands (https://cupnooble.itch.io/sprout-lands-asset-pack)

## Other notes
- Always ask the user clarifying questions when needed or helpful

# Agent Instructions

## Subagents

Subagents are lightweight agents (Sonnet 4.5) with self-contained contexts, defined in `.claude/agents/`. They're cheaper, unbiased (no parent context leakage), and keep the parent context clean.

### Available Subagents
- `code-reviewer` - Unbiased code review with zero context. Returns issues by severity with a PASS/FAIL verdict.
- `research` - Deep research via web search, file reads, and codebase exploration. Returns concise sourced findings.
- `qa` - Generates tests for a code snippet, runs them, and reports pass/fail results.

### Design & Build Workflow

When building or modifying any non-trivial code (scripts, features, refactors), follow this loop:

1. **Write/edit the code** — Make your changes.
2. **Code Review** — Spawn `code-reviewer` subagent with the changed file(s). It reports issues back — it does NOT fix anything itself.
3. **QA** — Spawn `qa` subagent with the code. It generates tests, runs them, and reports results back — it does NOT fix anything itself.
4. **Fix** — The parent agent (you) reads the review and QA reports and applies all fixes.
5. **Ship** — Only after review passes and tests pass.

**Important:** Subagents are read-only reporters. All code changes happen in the parent agent.

For research-heavy tasks, spawn `research` subagent first to gather context without polluting the main conversation.

**Parallel execution:** When reviewing + QA'ing independent files, spawn both subagents in parallel using `run_in_background: true`.


Be pragmatic. Be reliable. Self-anneal.
