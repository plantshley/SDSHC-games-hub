# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
      jeopardy.js         # Advanced: category grid, daily doubles, multiplayer
      word-game.js        # Advanced: Wheel of Fortune style, multiplayer
      field-guide.js      # Advanced: photo ID game (exception to no-image rule)
      connections.js      # Advanced: NYT Connections style, group 16 tiles
  data/
    game-registry.js      # kid mode game metadata (GAMES array + TIER_META)
    advanced-game-registry.js  # advanced mode game metadata (flat ADVANCED_GAMES array)
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
        field-guide.js
        connections.js
  utils/
    svg-recolor.js  # SVG preprocessing for coloring game
    gradient-bg.js  # animated gradient background for advanced games
    theme-toggle.js # dark/light mode toggle component
    help-overlay.js # help/rules overlay component
    typewriter.js   # typewriter text animation effect
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

Games register via their respective registry (`game-registry.js` for kid, `advanced-game-registry.js` for advanced). Advanced games are lazy-loaded via dynamic `import()` in the registry.

Content is separated into data files in `src/data/content/` (kid) and `src/data/content/advanced/` (advanced).

### Advanced Game Shared Utils

Advanced games share common UI components from `src/utils/`:
- `gradient-bg.js` — `addGradientBackground(el)` adds the animated gradient spheres backdrop
- `theme-toggle.js` — `createThemeToggle()` returns a dark/light toggle button, persists to `localStorage`
- `help-overlay.js` — `createHelpButton(rules)` returns a "?" button that shows a rules overlay
- `typewriter.js` — `typewriter(el, text)` animates text character by character

Every advanced game screen must use `flex-direction: column` layout with `padding-top: 48px` on the main panel to accommodate the top bar.

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
- Agent instructions (subagents, design/build workflow) are in the parent `.claude/CLAUDE.md` — not repeated here
