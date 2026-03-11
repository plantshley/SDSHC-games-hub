# SDSHC Games Hub

## Project Overview

Educational game hub for South Dakota Soil Health Coalition (SDSHC) youth events. Runs on a 23.8" Dell OptiPlex 7410 touchscreen (1920x1080). Fully offline capable, deployed via GitHub Pages. Content sourced from 4 Youth Activities PDFs covering Pre-K through Middle School.

## Constraints

- **No sound** — silent operation only
- **No external API calls** — everything runs offline
- **All assets local** — fonts bundled as woff2, no CDN
- **Touch-first** — no hover-only interactions, all targets minimum 44px
- **Target display** — 1920x1080, no scrolling, no overflow
- **Auto-reset** — 120s idle returns to splash screen, 10s warning at 110s
- **Progress resets on idle timeout** — each kiosk user starts fresh

## Tech Stack

- **Vite** — dev server and bundler (`npm run dev` / `npm run build`)
- **Vanilla JavaScript** — ES modules, no framework
- **CSS** — custom properties for theming, no preprocessor

## File Structure

```
public/
  assets/
    sprites/        # pixel-art PNGs (Sprout Lands pack)
    svg/            # SVG diagrams and game assets
    gifs/           # animated GIFs (farm scenes, animals, plants)
    backgrounds/    # pixel-background*.jpg
    fonts/          # silkscreen.woff2, 04b03.woff2, jetbrains-mono.woff2
src/
  main.js           # entry point
  router.js         # hash-based SPA router
  idle-timer.js     # idle detection and auto-reset
  styles/
    base.css        # reset, @font-face, CSS custom properties
    hub.css         # splash, grade select, game select screens
    games.css       # shared in-game UI components
    transitions.css # screen transition animations
  screens/
    splash.js       # title screen with "Tap to Start"
    grade-select.js # character + tier selection
    game-select.js  # game card grid per tier
  games/
    _base.js        # GameBase class (mount/unmount/progress)
    [game].js       # one module per game (11 total)
  data/
    game-registry.js # metadata for all games
    content/         # per-game content (questions, levels, configs)
  utils/
    dom.js          # DOM helper utilities
    animation.js    # shared animation helpers
    touch.js        # touch/drag interaction helpers
```

## Fonts

Three bundled pixel fonts. Never use Google Fonts CDN.

| Font | CSS Variable | Usage |
|------|-------------|-------|
| Silkscreen | `--font-title` | Main titles, hub name |
| 04b03 | `--font-header` | Section headers, game titles |
| JetBrains Mono | `--font-body` | Body text, questions, descriptions |

Font stack example: `font-family: var(--font-title), sans-serif;`

## Colors

Tier accent colors (define pastel variants for backgrounds/hover states):

| Tier | Color | Hex |
|------|-------|-----|
| Little Sprouts (Pre-K - 2nd) | Green | `#a6c264` |
| Meadow Makers (3rd - 5th) | Pink | `#e496d7` |
| Harvest Guardians (Middle & High) | Teal | `#38cebc` |

Base palette: earthy greens, warm browns, sky blues, cream/parchment backgrounds. Inspired by Cupnooble's Sprout Lands asset pack.

## Visual Design Rules

- **Nature-centered** — fill dead space with foliage sprites (bushes, trees, flowers, mushrooms) and creature GIFs
- **Pixel art aesthetic** — all UI elements should feel consistent with the Sprout Lands style
- **Smooth transitions** — screen changes use CSS transitions (slide/fade, ~300ms). No jarring cuts.
- **No wooden signboard assets for buttons** — use CSS-styled card buttons with tier accent colors and pixel-art borders
- **Backgrounds per screen:**
  - Splash: `pixel-farm-scene.gif`
  - Grade select: `pixel-farm-scene3.gif` + `Hills_topsoil_H.png` repeated bottom
  - Game select: `grass_main.png` tiled
  - In-game: per-game as specified in REDO.md

## Game Module Pattern

Every game extends `GameBase` from `src/games/_base.js`:

```js
class GameBase {
  constructor(container, gameData) {}
  mount()    // create DOM, bind events
  unmount()  // cleanup DOM, unbind events
  onLevelComplete(levelIndex)
  onGameComplete()
}
```

Games register via `src/data/game-registry.js` with metadata:
```js
{ id, title, tier, levelCount, icon, description, module: () => import('./games/X.js') }
```

Games are lazy-loaded via dynamic import. Each game has a corresponding content file in `src/data/content/`.

## Content Data Format

Each content file in `src/data/content/` exports structured data for its game. Keep content separate from game logic. All educational content must come from the Youth Activities PDFs and Clues & Answers document — do not invent educational facts.

## Screen Flow

```
Splash → Grade Select → Game Select → Game (with levels) → back to Game Select
```

Progress (completed games/levels) stored in localStorage during active use. All progress clears on idle timeout.

## Grade Tiers

| Tier | Name | Grades | Games |
|------|------|--------|-------|
| 1 | Little Sprouts | Pre-K - 2nd | Games 1-4 (visual, drag, tap, zero reading) |
| 2 | Meadow Makers | 3rd - 5th | Games 5-8 (matching, trivia, cause-and-effect) |
| 3 | Harvest Guardians | Middle & High | Games 9-11 (systems, strategy, challenging trivia) |

## Games (11 total)

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

## Asset References

- Sprites: `use-these-assets/sprites/` (83 PNGs)
- SVGs: `use-these-assets/svg files/` (104 SVGs)
- GIFs: `use-these-assets/*.gif` (27 animations)
- Backgrounds: `use-these-assets/pixel-background*.jpg` (9 images)
- Source content: `Youth Activities PDFs/Clues & Answers.md`

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

- `REDO.md` — detailed game descriptions, asset mappings, UX flow
- `Youth Activities PDFs/Clues & Answers.md` — all educational content mapped to assets
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
