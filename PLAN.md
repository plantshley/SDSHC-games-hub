# SDSHC Games Hub - Implementation Plan

## Context
Building an offline-capable, touch-friendly game hub for South Dakota Soil Health Coalition youth events on a 23.8" Dell OptiPlex 7410 touchscreen (1920x1080). Games are based on content from 4 Youth Activities PDFs. Deployed via GitHub Pages with offline localhost capability. No sound. Auto-reset to home after 120s idle.

---

## Grade Tiers (Original groupings kept)

1. **Little Sprouts** (Pre-K to 2nd Grade) - Visuals, dragging, tapping, zero-to-low reading
2. **Earth Explorers** (3rd to 5th Grade) - Matching, simple trivia, cause-and-effect
3. **Agro-Heroes** (Middle & High School) - Complex systems, strategy, challenging trivia

---

## Games Overview

9 games total. The tier-selected at the home screen determines which games appear AND the complexity of shared games (like Food Web Builder). Each game has multiple levels sourced from PDF content.

| # | Game | Tiers | Levels |
|---|---|---|---|
| 1 | Build a Soil Cake | Little Sprouts | 3 |
| 2 | What Does Soil Make? (Dot-to-Dot) | Little Sprouts | 5 (14 puzzles) |
| 3 | Soil Life Maze | Little Sprouts | 3 |
| 4 | Soil Critter Coloring | Little Sprouts | 6 pages |
| 5 | The Three Sisters Garden | Earth Explorers | 5 |
| 6 | Spin the Soil Wheel | Earth Explorers | 7 (~41 Qs) |
| 7 | Odd One Out | Earth Explorers | 5 (~24 rounds) |
| 8 | Farm Manager Simulator | Agro-Heroes | 8 scenarios |
| 9 | Soil Health Trivia Blitz | Agro-Heroes | 9 + bonus (~50+ Qs) |
| 10 | Soil Food Web Builder | ALL (auto-matched) | 1 per tier |

---

## Detailed Game Descriptions

### Tier 1: Little Sprouts

#### Game 1: "Build a Soil Cake" (Drag & Drop)
Base mechanic: Drag layers onto a plate/diagram in the correct order.

| Level | Content Source | Description |
|---|---|---|
| 1 | Lower Elem "Soil Layers as Cake" | Drag 5 soil horizons (O, A, B, C, R) as cake layers onto a plate. Earthworm pops out on completion. |
| 2 | Lower Elem "Earth's Spheres" | Stack Earth's 5 spheres in correct order (Pedosphere, Geosphere, Hydrosphere, Atmosphere, Biosphere). Drag labels to match. |
| 3 | Lower Elem "Soil Regions" | Pick a biome (desert, prairie, forest, wetland, tundra, tropical), then build its soil profile by dragging the correct characteristics. Simplified for young kids with picture-based clues. |

#### Game 2: "What Does Soil Make?" (Dot-to-Dot) — REVISED
Base mechanic: Tap glowing, pulsing star-dots in numbered order. Dots glow with a soft radial light effect (CSS `box-shadow` + animation). Connected dots leave a sparkling trail line. When complete, the revealed object fades in with a shimmer effect.

**Visual style: Starfield aesthetic** — dark background with softly glowing numbered dots that pulse. Each tap creates a small burst of particles. The connecting line glows as it's drawn.

| Level | Content Source | Description |
|---|---|---|
| 1 | Pre-K "Soil Makes..." | 3 puzzles: Pencil, Clothes, Fruit |
| 2 | Pre-K "Sand Makes..." | 3 puzzles: Glasses, Computer, Light Bulb |
| 3 | Pre-K "Clay Makes..." | 3 puzzles: Mug, Brick, Plate |
| 4 | Pre-K "Flowers Like..." | 3 puzzles: Bee, Sunshine, Water |
| 5 | Pre-K coloring pages | Bonus puzzles: Bison, Tree, Cow, Duck, Worm, Caterpillar |

14 total dot-to-dot puzzles across 5 levels.

#### Game 3: "Soil Life Maze" (Touch Maze) — NEW
Base mechanic: Trace a path through a maze with your finger.

| Level | Content Source | Description |
|---|---|---|
| 1 | Pre-K "Soil Life Maze" | Help an earthworm find its friends (beetles, mites) and reach crops. Avoid birds. Simple path. |
| 2 | Pre-K "Growing Plants Maze" | Guide a character to help a plant grow from soil to sunflower. Medium complexity. |
| 3 | Lower Elem "CLORPT Maze" | Journey through a maze touching all 5 CLORPT factors (Climate, Organisms, Relief, Parent Material, Time) in order. |

Assets: `dirt_*` tiles for walls, `grass_*` for paths, `Basic_Grass_Biom_things_sprout.png` for goal.

#### Game 4: "Soil Critter Coloring" (Interactive Coloring) — NEW
Base mechanic: Pick a color from a palette, then tap regions of a line-art illustration to flood-fill them. Uses canvas-based flood-fill on PNG images extracted from the Pre-K PDF coloring pages.

**Implementation:** Extract line-art illustrations from Pre-K PDF as PNGs. Render on HTML5 Canvas. On tap, perform flood-fill from the tap point, bounded by black outlines. Color palette shows 8-10 pixel-art styled color swatches.

*Note: May upgrade to SVG-based region fill later if PNGs don't produce clean enough results.*

| Page | Content Source | Subject |
|---|---|---|
| 1 | Pre-K coloring pages | Tree |
| 2 | Pre-K coloring pages | Bison |
| 3 | Pre-K coloring pages | Cow |
| 4 | Pre-K coloring pages | Duck |
| 5 | Pre-K coloring pages | Worm |
| 6 | Pre-K coloring pages | Caterpillar |

6 coloring pages. Simple, relaxing activity for youngest kids.

---

### Tier 2: Earth Explorers

#### Game 5: "The Three Sisters Garden" (Planting Sim)
Base mechanic: Interactive planting bed. Clues guide the player to select the right plant/item.

| Level | Content Source | Description |
|---|---|---|
| 1 | Upper Elem "Three Sisters" | Plant Corn ("tall stalk for sun"), Beans ("fix nitrogen"), Squash ("keep moisture, block weeds"). Bonus: match Cherokee names (selu, iya, tuya). |
| 2 | Lower Elem "Pollinator Garden" | Build a pollinator garden: place Short Native Flowers, Medium Flowers, Tall Flowers, Tall Grass, Puddling Area, and Flat Stones in correct zones. |
| 3 | Lower Elem "Year in Bloom" | Plant flowers in the right month order: Golden Alexander (Apr), Scarlet Globemallow (May), Prairie Rose (Jun), Butterfly Milkweed (Jul-Aug), Stiff Sunflower (Sep), New England Aster (Oct). Watch the garden bloom through the seasons. |
| 4 | Lower/Upper Elem "Cover Crops" | Plant cover crops in a field: Sunflower, Rye, Oats, Buckwheat, Fava Bean, Barley. Match each crop to its description/benefit. |
| 5 | Indigenous Farming Practices | Build 6 different farm types: Chinampa (floating gardens), Milpa (intercropping), Terraces (mountain farming), Polyculture (Amazon), Floating Rice (SE Asia), Dry Stone Walling (Mediterranean). Place elements in the correct arrangement. |

Assets: `Basic_Plants_*-grow*.png` for growth animations, `dirt_*` tiles, `Fences_*`, `Water_1.png`, flower/tree assets.

#### Game 6: "Spin the Soil Wheel" (Wheel + Trivia)
Base mechanic: Swipe to spin a wheel. It lands on a category. Answer a T/F or multiple-choice question. Correct answers earn water drops to grow a pixel flower.

| Level | Content Source | Questions per level |
|---|---|---|
| 1 | CLORPT | "What does the 'C' in CLORPT stand for?" (Climate). 5 questions. |
| 2 | Cover Crops | "Which cover crop is also a grain?" (Barley/Rye/Oats). 5 questions. |
| 3 | Soil Regions | "Which soil type is found in the world's breadbaskets?" (Chernozem). 6 questions. |
| 4 | Plant Parts We Eat | "A banana is which plant part?" (Fruit). 7 questions. |
| 5 | Earth's Spheres | "The prefix 'hydro' means ___?" (Water). 5 questions. |
| 6 | Soil Biology | "These microscopic organisms break down organic matter" (Bacteria). 7 questions. |
| 7 | Soil Art & Culture | "Ochre is used as a natural ___?" (Pigment/Dye). 6 questions. |

~41 questions total across 7 levels. Each level unlocks after completing the previous.

#### Game 7: "Odd One Out" (Classification) — NEW
Base mechanic: Four items appear on screen. Tap the one that doesn't belong. Fast-paced rounds.

| Level | Content Source | Rounds |
|---|---|---|
| 1 | Lower Elem "Things That Don't Belong" | Bee/Cow/Butterfly/**Flower**; Sand/Clay/Silt/**Leaf**; Horse/**Sun**/Pig/Duck; **Grape**/Water/Earth/Wind. 4 rounds directly from PDF. |
| 2 | Plant Parts | Carrot/Potato/Onion/**Lettuce** (root vs leaf); Broccoli/**Rice**/Artichoke/Cauliflower (flower vs seed). 5 rounds. |
| 3 | Soil Organisms | Bacteria/Fungi/Protozoa/**Granite** (living vs non-living); Earthworm/Nematode/**Corn**/Mite. 5 rounds. |
| 4 | Cover Crops vs Others | Mixed identification. 5 rounds. |
| 5 | Conservation Practices | Which one doesn't prevent erosion? Which isn't a real practice? 5 rounds. |

~24 rounds across 5 levels.

---

### Tier 3: Agro-Heroes

#### Game 8: "Farm Manager Simulator" (Scenario Strategy)
Base mechanic: Given a farm crisis scenario, select the correct conservation practice from multiple options. Correct selections trigger before/after animations (e.g., muddy river turns clear, barren field turns green).

*Note: Career matching removed — the PDF career-to-practice mappings aren't 1:1 enough. Focus is on identifying the right conservation practice for each problem.*

| Level | Scenario | Correct Practice |
|---|---|---|
| 1 | "Your field is losing nutrients into the local river!" | Saturated Buffers |
| 2 | "Erosion is destroying your hillside crops!" | Prairie Strips |
| 3 | "Your water table is too high after heavy rain!" | Drainage Water Management |
| 4 | "You need to filter runoff before it hits the creek!" | Bioreactors |
| 5 | "Your soil is depleted after harvest season!" | Cover Crops |
| 6 | "Flooding threatens your lowland fields!" | Wetlands |
| 7 | "Your soil has no structure and compacts easily!" | Living Roots (year-round) |
| 8 | "Pests are taking over — monoculture is failing!" | Plant Diversity / Crop Rotation |

8 scenarios using conservation practices from the PDFs. Each level shows a cross-section diagram (extracted from PDF illustrations) of how the practice works after the correct answer.

Assets: `Water_1.png`, terrain tiles, crop growth stages, extracted PDF diagrams.

#### Game 9: "Soil Health Trivia Blitz" (Timed Trivia)
Base mechanic: 60-second timed rounds. Multiple choice. Score tracked. Optional 2-player side-by-side mode.

| Level | Content Source | # Questions |
|---|---|---|
| 1 | Soil Health Principles | 5 Qs (soil cover, limited disturbance, living roots, plant diversity, livestock integration) |
| 2 | Indigenous Farming | 6 Qs (Chinampa, Milpa, Terraces, Polyculture, Floating Rice, Dry Stone Walling) |
| 3 | CLORPT + Soil Formation | 5 Qs |
| 4 | Soil Biology & Food Web | 7 Qs (bacteria, fungi, protozoa, nematodes, earthworms, arthropods) |
| 5 | Agronomy Careers | 6 Qs (farm manager, soil scientist, seed analyst, climatologist, engineer, plant breeder) |
| 6 | Carbon Cycle | 5 Qs (store: trees/roots/no-till/healthy air; release: livestock/burning/plowing/deforestation) |
| 7 | Soil Art & Culture | 6 Qs (mudcloth, pottery, ochre, clay, Egyptian makeup) |
| 8 | Climate Change | 4 Qs (agricultural productivity changes, regional impacts) |
| 9 | Soil Regions | 6 Qs (desert, chernozem, forest, wetland, tundra, tropical, permafrost) |
| BONUS | Mixed - All Categories | Random pull from all levels. Endless mode. |

~50+ unique questions. All sourced directly from PDF content.

---

### Cross-Tier Game

#### Game 10: "Soil Food Web Builder" (Diagram Builder) — NEW
This game appears in ALL three tiers, with complexity auto-matched to the selected grade level. Only ONE version shows per tier (not 3 levels to unlock).

| Tier | Complexity | Organisms | Connections |
|---|---|---|---|
| Little Sprouts | Simple | 4: Plants, Bacteria, Earthworms, Birds | 3 arrows. Large, colorful icons. Snap-to-position. |
| Earth Explorers | Intermediate | 7: Plants, Bacteria, Fungi, Protozoa, Earthworms, Arthropods, Birds | Multiple pathways. Drag to position + draw arrows. |
| Agro-Heroes | Full | 9+: Plants, Organic Matter, Bacteria, Fungi, Protozoa, Nematodes, Arthropods, Earthworms, Birds/Animals | Complete food web from Middle School PDF. All energy flow arrows. |

Base mechanic: Empty circular diagram. Drag organism icons to correct positions. Then draw arrows showing "who feeds who." Scoring based on correct placements and connections.

Assets: Nature object sprites for organisms, `dirt_*` for soil background. PDF food web diagrams used as reference/answer overlay.

---

## Extracted PDF Assets

The following illustrations will be extracted from the PDFs as PNG images for use in games:

| Asset | Source PDF | Used In |
|---|---|---|
| Coloring line art (tree, bison, cow, duck, worm, caterpillar) | Pre-K | Game 4: Soil Critter Coloring (flood-fill targets) |
| Soil Food Web diagram | Lower Elem / Middle School | Game 10: Food Web Builder (answer reference) |
| Indigenous farming illustrations (chinampa, milpa, terraces, etc.) | Lower/Upper Elem / Middle School | Game 5 Level 5, Game 8 (scenario backgrounds) |
| Conservation practice cross-sections (saturated buffers, prairie strips, etc.) | Upper Elem / Middle School | Game 8: Farm Manager (before/after diagrams) |
| Soil regions illustrations (prairie, forest, tundra, tropical, desert, wetland) | Lower Elem / Middle School | Game 1 Level 3 (biome backgrounds) |
| Earth's Spheres circular diagram | Lower Elem | Game 1 Level 2 (reference diagram) |
| Pollinator garden layout | Lower Elem | Game 5 Level 2 (target layout) |
| Plant parts diagram | Lower Elem | Game 6 Level 4 reference |
| Cover crops with root systems | Lower Elem / Upper Elem | Game 5 Level 4, Game 6 |
| Climate change agricultural impact map | Lower Elem / Middle School | Game 9 Level 8 (visual reference) |

*Coloring pages use canvas flood-fill on PNGs initially. May upgrade to SVG-based region fill later if results aren't clean enough.*

---

## PDF Content Utilization Map

| PDF Content | Where It's Used |
|---|---|
| Pre-K: Dot-to-dot (soil/sand/clay/flowers) | Game 2: 14 puzzles across 5 levels |
| Pre-K: Soil Life Maze | Game 3: Level 1 |
| Pre-K: Growing Plants Maze | Game 3: Level 2 |
| Pre-K: Coloring pages (6 subjects) | Game 4: 6 interactive coloring pages |
| Lower Elem: Soil Layers | Game 1: Level 1 |
| Lower Elem: Earth's Spheres | Game 1: Level 2, Game 6: Level 5 |
| Lower Elem: Soil Regions | Game 1: Level 3, Game 9: Level 9 |
| Lower Elem: Three Sisters | Game 5: Level 1 |
| Lower Elem: Pollinator Garden | Game 5: Level 2 |
| Lower Elem: Year in Bloom | Game 5: Level 3 |
| Lower Elem: Cover Crops | Game 5: Level 4, Game 6: Level 2 |
| Lower Elem: CLORPT | Game 3: Level 3, Game 6: Level 1, Game 9: Level 3 |
| Lower Elem: Plant Parts We Eat | Game 6: Level 4, Game 7: Level 2 |
| Lower Elem: Things That Don't Belong | Game 7: Level 1 |
| Lower Elem: Soil Art & Culture | Game 6: Level 7, Game 9: Level 7 |
| Lower Elem: Soil Biology (organisms) | Game 6: Level 6, Game 7: Level 3 |
| Lower Elem: Soil Food Web | Game 10: All tiers |
| Lower Elem: Carbon Storage/Release | Game 9: Level 6 |
| Lower Elem: Soil Health Functions | Game 9: Level 1 |
| Lower Elem: Indigenous Farming | Game 5: Level 5, Game 9: Level 2 |
| Lower Elem: Climate Change Map | Game 9: Level 8 |
| Upper Elem: Three Sisters (detailed) | Game 5: Level 1 |
| Upper Elem: Cover Crops (detailed) | Game 5: Level 4 |
| Upper Elem: Agronomy Careers | Game 9: Level 5 |
| Upper Elem: Conservation Practices | Game 8: All levels |
| Upper Elem: Food Web (advanced) | Game 10: Earth Explorers + Agro-Heroes |
| Upper Elem: Indigenous Farming (detailed) | Game 5: Level 5 |
| Middle School: Soil Health Principles | Game 9: Level 1 |
| Middle School: CLORPT (advanced) | Game 9: Level 3 |
| Middle School: Conservation (advanced) | Game 8: All levels |
| Middle School: Food Web (full) | Game 10: Agro-Heroes |
| Middle School: Indigenous (in-depth) | Game 9: Level 2 |
| Middle School: Climate Change (detailed) | Game 9: Level 8 |
| Middle School: Careers (advanced) | Game 9: Level 5 |

**Estimated PDF content coverage: ~95%**

---

## Hub UX Flow

### Home Screen
- Pixel-art farm scene background (grass tiles, trees, fences, flowers)
- Waving character (`Basic_Charakter_wave.png`) with speech bubble: "What grade are you in?"
- Three wooden sign buttons (`Menu_board_L.png`):
  - "Little Sprouts (Pre-K - 2nd)"
  - "Earth Explorers (3rd - 5th)"
  - "Agro-Heroes (Middle & High)"
- Decorative: chickens/cows walk across bottom, weather icons cycle

### Game Selection Screen
- Grid of game cards (`ui_board-square.png` backgrounds)
- Each card: pixel-art icon + game title + level count badge
- `ui_board-home.png` returns to grade select
- Locked levels shown with `ui_board-question.png` overlay (unlock by completing previous)

### In-Game UI
- Top bar: `ui_board-home.png` (exit), `ui_board-star.png` (score), level indicator
- `ui_board-question.png` - hint button (limited hints)
- `speech_bubble_grey_*.png` - instructions, feedback, fun facts
- `ui_board-check.png` / `ui_board-cancel.png` - correct/incorrect feedback
- `ui_board-trophy.png` - level complete celebration

### Auto-Reset
- 120 seconds of no touch input -> fade to home screen
- Brief "Touch to continue" prompt before reset (10s warning)

### Reward System
- Each completed level grows a pixel garden on the game select screen
- No persistent storage (kiosk resets between sessions)

---

## Technical Architecture

### Stack
- **Vanilla HTML/CSS/JS** — no framework, fully offline-capable
- **No sound**
- **Touch:** Pointer Events API for unified mouse/touch
- **Fonts:** Press Start 2P (titles) + JetBrains Mono (body), bundled locally
- **Canvas:** HTML5 Canvas for coloring game flood-fill + dot-to-dot glow effects

### File Structure
```
SDSHC-games-hub/
├── index.html                 (single entry point, SPA-style)
├── styles/
│   ├── main.css               (global styles, variables, layout)
│   ├── games.css              (game-specific styles)
│   └── fonts/                 (bundled .woff2 files)
│       ├── PressStart2P.woff2
│       └── JetBrainsMono.woff2
├── js/
│   ├── app.js                 (router, grade select, idle timer, shared state)
│   ├── games/
│   │   ├── soil-cake.js       (Game 1: drag & drop layers)
│   │   ├── dot-to-dot.js      (Game 2: glowing star dot-to-dot)
│   │   ├── soil-maze.js       (Game 3: trace maze paths)
│   │   ├── coloring.js        (Game 4: flood-fill coloring)
│   │   ├── three-sisters.js   (Game 5: planting sim)
│   │   ├── spin-wheel.js      (Game 6: wheel + trivia)
│   │   ├── odd-one-out.js     (Game 7: classification tapping)
│   │   ├── farm-manager.js    (Game 8: scenario strategy)
│   │   ├── trivia-blitz.js    (Game 9: timed trivia)
│   │   └── food-web.js        (Game 10: diagram builder)
│   └── data/
│       ├── trivia-questions.js (all questions bank, ~50+ questions)
│       └── game-content.js    (level data, labels, educational text)
├── assets/
│   ├── sprites/               (all 83 original PNGs from use-these-assets/)
│   ├── coloring/              (extracted line-art PNGs from Pre-K PDF)
│   └── diagrams/              (extracted PDF illustrations for game backgrounds)
├── .github/workflows/deploy.yml
```

### Offline Support
- All fonts bundled as .woff2 (no Google Fonts CDN)
- All assets are local PNGs
- Zero external API calls
- Optional: service worker for cache-first strategy

### Deployment
- **Online:** Existing GitHub Actions workflow deploys to GitHub Pages on push to `main`
- **Offline/Localhost:** `python -m http.server 8000` or any static file server

---

## Build Order (Suggested)

1. Hub shell: index.html, CSS, fonts, home screen, grade select, game select, idle timer
2. Extract PDF assets (coloring line art, diagrams, illustrations)
3. Game 1: Soil Cake (simplest drag & drop, proves the pattern)
4. Game 2: Dot-to-Dot with glow effects (canvas rendering pattern)
5. Game 4: Soil Critter Coloring (canvas flood-fill, tests extracted PDF assets)
6. Game 3: Soil Life Maze (trace/path pattern)
7. Game 6: Spin the Wheel (trivia engine — shared with Game 9)
8. Game 5: Three Sisters (planting sim, most levels)
9. Game 7: Odd One Out (fast classification)
10. Game 9: Trivia Blitz (reuses trivia engine from Game 6)
11. Game 8: Farm Manager (scenario selection)
12. Game 10: Food Web Builder (most complex interaction, cross-tier)

---

## Verification Plan

1. Open `index.html` in Chrome — verify grade select -> game select -> game flow
2. Test touch interactions in Chrome DevTools (toggle device toolbar for touch emulation)
3. Verify all assets load (original 83 PNGs + extracted PDF assets)
4. Test idle timer: leave untouched for 120s, confirm auto-reset with 10s warning
5. Test offline: disable network in DevTools, reload, confirm everything works
6. Test dot-to-dot glow effects render smoothly on canvas
7. Test coloring flood-fill accuracy on extracted line art
8. Test Food Web Builder at all 3 tier complexities
9. Deploy to GitHub Pages, verify live URL
10. Test on actual Dell OptiPlex 7410 touchscreen at 1920x1080
11. Verify Press Start 2P renders for titles, JetBrains Mono for body text
12. Walk through every level of every game to confirm all content displays correctly
