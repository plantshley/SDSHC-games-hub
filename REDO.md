## **Notes**

* For all games, decorate pages with:
  * (foliage/plants) Basic_Grass_Biom_things_ : bushes, flower 1, flower 2, flower 3, log, mushroom, mushroom2, mushroom 3, rock, rock-sm, sprout, sunflower, tree1, tree2, tree-apple, flowers-gif
  * (creatures) Free_Chicken_Sprites, Free_Cow_Sprites, fox-gif, ducks-gif, cow-gif2, cow-gif
    * Note: cow-gif2, ducks-gif are facing to the left; cow-gif, Free_Cow_Sprites, Free_Chicken_Sprites are facing to the right
  * The site visuals should be more nature-centered, with a lot of foliage/plants filling dead background space.
* IMPORTANT: Refer to Clues & Answers document for mapping assets to games when assets are not specified here and for text/quiz informational content. I dont want you making up information; if there are gaps, just ask.
* Please open browser to view and click through the websites/presentations I've linked for design inspiration and game features/functionality. Get screenshots when necessary/helpful. If you need css or code chunks let me know.
* Use colors and general cute pixel farming theme like https://cupnooble.itch.io/sprout-lands-asset-pack
* Smooth transitions and animations just like this canva presentation: https://www.canva.com/design/DAGW0LcxO4Y/-UEv3eg5eGZnPGX6o1WHbA/view?embed#1
* Other pixel-themed game websites to reference:
  * [https://8bitgames.eightarms.co.uk/?ref=onepagelove](https://8bitgames.eightarms.co.uk/?ref=onepagelove)
  * [https://rudolf.eightarms.co.uk/?ref=onepagelove](https://rudolf.eightarms.co.uk/?ref=onepagelove)
  * [https://pokepalettes.com/?ref=onepagelove](https://pokepalettes.com/?ref=onepagelove)
* Other pixel-design reference from canva: https://www.canva.com/design/DAF9UWJh3ts/Nn6TYw66NE_teqGanC15eg/view?embed#6
* Silkscreen for main titles, 04b03 font for headers (see "C:\Users\ashle\Documents\GitHub\fonts\04B_03__.TTF"), jetbrains mono for body text
* First build general webpage structure, layout, navigation, visuals, etc., then we can work game-by-game (each game in new session, but use claude md and memory). I will work with you on visual layouts and ensuring mechanics work as intended as we go.
* This should not be ugly like a static html file is limited to, I just need offline support through a local host running via npm run dev. I dont need it to be a static file if that will limit beautiful, smooth visuals which I value more.
* Other notes/questions:
  * Can we create/change any of the planned games to ones like Gemini Slingshot, Gemini Runner, and/or Sky Metropolis, shown on https://aistudio.google.com/apps?source=showcase&showcaseTag=gemini-3 ? Let me know if I need to open the games and "remix" them to try to get any code.

## **Context**

Building an offline-capable, touch-friendly game hub for South Dakota Soil Health Coalition youth events on a 23.8" Dell OptiPlex 7410 touchscreen (1920x1080). Games are based on content from 4 Youth Activities PDFs. Deployed via GitHub Pages with offline localhost capability. No sound. Auto-reset to home after 120s idle.

---

## **Grade Tiers**

1. **Little Sprouts** (Pre-K to 2nd Grade) - Visuals, dragging, tapping, zero-to-low reading
2. **Meadow Makers** (3rd to 5th Grade) - Matching, simple trivia, cause-and-effect
3. **Harvest Guardians** (Middle & High School) - Complex systems, strategy, challenging trivia

---

## **Detailed Game Descriptions**

### Tier 1: Little Sprouts

#### *Game 1: "Build a Soil Cake"*

Base mechanic: Fill in layers with colors on the diagram in the correct order.

| Level | Content Source | Description |
| :---- | :---- | :---- |
| 1 | Lower Elem "Soil Layers as Cake" | Fill in 4 soil horizons (O, A, B, C) as cake layers with the correct colors. Earthworm pops out on completion. |

Assets:

* Fill in the colors of the layers in Soil Cake svg

#### *Game 2: "What Does Soil Make?" (Dot-to-Dot) — REVISED*

Base mechanic: Tap glowing, pulsing star-dots in numbered order. Dots glow with a soft radial light effect (CSS box-shadow + animation). Connected dots leave a sparkling trail line. When complete, the revealed object fades in with a shimmer effect.

**Visual style: Starfield aesthetic** — dark background (repeat pixel-background-night.jpeg horizontally) with softly glowing numbered rainbow dots that pulse. Each tap creates a small burst of particles. The connecting line glows as it's drawn.

Glowing dots ref: https://codesandbox.io/p/sandbox/web-dev-ref-glowing-dots-animation-in-css-2toeq?file=%2Findex.html

(stretch goal) Cosmic Flow shown on https://aistudio.google.com/apps?source=showcase&showcaseTag=gemini-3

| Level | Content Source | Description | Assets to trace (add glowing dots to the number-labeled dots on these svgs) |
| :---- | :---- | :---- | :---- |
| 1 | Pre-K "Soil Makes..." | 2 puzzles: Pencil, Fruit | Prek soil makes-pencil and fruit svgs |
| 2 | Pre-K "Sand Makes..." | 2 puzzles: Computer, Light Bulb | Prek sand makes-computer, lighbulb svgs |
| 3 | Pre-K "Clay Makes..." | 3 puzzles: Mug, Brick, Plate | Clay makes-plate, brick, and mug svgs |
| 4 | Pre-K "Flowers Love..." | 3 puzzles: Bee, Sunshine, Water | Flowers love-WATER, BEES, and SUN svgs |

#### *Game 3: Things that Don't Belong*

Base mechanic: Four items (with and/or text label) appear on screen. Tap the one that doesn't belong.

| Level | Content Source | Rounds | Assets |
| :---- | :---- | :---- | :---- |
| 1 | Lower Elem "Things That Don't Belong" | Bee/Cow/Butterfly/Flower; | butterflies-gif, flowers-gif, cow-gif2, bee-gif |
| 2 | Lower Elem "Things That Don't Belong" | Sand/Clay/Silt/Leaf; | Dirt-main, Basic_Grass_Biome_things_sprout |
| 3 | Lower Elem "Things That Don't Belong" | Bunny/Sun/Pig/Duck; | bunny, prek maze objects-sun, pig, duck |
| 4 | Lower Elem "Things That Don't Belong" | Grape/Water/Earth/Wind | grape-pixel, water-gif, wind-pixel, Basic_Grass_Biom_things_rock |

#### *Game 4: "Soil Critter Coloring" (Interactive Coloring)*

Base mechanic: Pick a color from a palette, then tap regions of a line-art illustration to flood-fill them. there should be a nice animation when the color fills the svg shapes. Use the exact particle effect code outlined at https://www.joshwcomeau.com/animation/color-shifting/.  Optional paint mode where they can choose a color and use their fingers to draw on the canvas and/or fill in the svg shapes. all white space on the svgs should default as transparent on the canvas. Reference "C:\Users\ashle\Documents\GitHub\fairy\fairy-shop\src\pages\BuildYourOwnV2.jsx" as needed for svg filling to avoid white halo near lineart edges and for drawing funcitonality. 

| Page | Content Source | Subject | SVG Assets |
| :---- | :---- | :---- | :---- |
| 1 | Pre-K coloring pages | Tree | tree |
| 2 | Pre-K coloring pages | Bison | bison |
| 3 | Pre-K coloring pages | Cow | flower-cow |
| 4 | Pre-K coloring pages | Duck | Duck |
| 5 | Pre-K coloring pages | Worm | worm2 |
| 6 | Pre-K coloring pages | Caterpillar | caterpillar |
| 7 | Prek maze | Watering plants | Prek maze objects-watering |
| 8 | Soil regions | Wetlands | soil regions-wetland |
| 9 | Soil spheres | Atmosphere | spheres - atmosphere |
| 10 | indigenous farming | Polyculture | polyculture |
| 11 | Soil Health Principles | Animals | principals-livestock |
| 12 | Prek maze | Sunshine | prek maze objects-sun |

12 coloring pages. Simple, relaxing activity for youngest kids.

---

### Tier 2: Meadow Makers

#### *Game 5: Planting Simulation*

Base mechanic: Interactive planting bed. Clues appear at points on tap to guide the player to drag the right plant/item to the location

Maybe something like Sky Metropolis, shown on https://aistudio.google.com/apps?source=showcase&showcaseTag=gemini-3

| Level | Content Source | Description | Assets |
| :---- | :---- | :---- | :---- |
| 1 | Upper Elem "Three Sisters" | Three Sisters Garden: Plant Corn ("tall stalk for sun"), Beans ("fix nitrogen"), Squash ("keep moisture, block weeds"). Include Cherokee names (selu, iya, tuya) in the hints. | Three sisters v2 svg, corn-gif, bean-gif, squash-pixel2 |
| 2 | Lower Elem "Pollinator Garden" | Pollinator Garden: place Short Native Flowers, Medium Flowers, Tall Flowers, Tall Grass, Puddling Area, and Flat Stones in correct zones. Fade in pixel-farm-scene4 to fill the page upon completion | Medium-native-yellow, dark blue, and purple-pink; short-native-red and orange; tall-native-yellow and grass svgs; basic_grass_biom_things_rock (for stones); dirt_tile(for puddling area) Map correct locations and assets using the Pollinator Garden plants and zone map from PDF |
| 3 | Upper Elem "Year in Bloom" | Year in Bloom: Put the plants in the correct order by month – Golden Alexander (Apr), Scarlet Globemallow (May), Prairie Rose (Jun), Butterfly Milkweed (Jul-Aug), Stiff Sunflower (Sep), New England Aster (Oct). Watch the garden bloom through the seasons. Flower color fills in with color based on PDF when correctly placed | Medium-native-yellow, dark blue, and purple-pink; short-native-red and orange; tall-native-yellow svgs Map the correct locations and assets using the Year in Bloom PDF page |

#### *Game 6: "Spin the Soil Wheel" (Wheel + Trivia)*

Base mechanic: Swipe to spin a wheel. It lands on a category. Answer a T/F or multiple-choice question. Correct answers earn water drops to grow a pixel flower.

| Level | Content Source | Questions per level | Assets |
| :---- | :---- | :---- | :---- |
| 1 | CLORPT | "What does the 'C' in CLORPT stand for?" (Climate). 5 questions. | See CLORPT section in Clues & Answers |
| 2 | Plant Parts We Eat | "A banana is which plant part?" (Fruit). 7 questions. | See What Parts of Plants Do We Eat in Clues & Answers |
| 3 | Cover Crops | "Which cover crop is also a grain?" (Barley/Rye/Oats). 5 questions. | sunflower-gif, Barley-pixel, bean-gif, wheat-pixel |
| 4 | Earth's Spheres | "The prefix 'hydro' means ___?" (Water). 5 questions. | See Earth's "Spheres" in Clues & Answers |
| 5 | Soil Biology | "These microscopic organisms break down organic matter" (Bacteria). 7 questions. | See Soil Biology in Clues & Answers |
| 6 | Soil Regions | "Which soil region is not fertile due to having soil that breaks down organic material and minerals quickly?" (Tropical). 6 questions. | See Soil Regions in Clues & Answers |
| 7 | Soil Art & Culture | "Ochre is used as a natural ___?" (Pigment/Dye). 6 questions. | soil and culture-mudcloth, code, ochre, pottery, makeup |

~41 questions total across 7 levels. Each level unlocks after completing the previous.

#### *Game 7: "Odd One Out" (Classification)*

Base mechanic: Four items appear on screen. Tap the one that doesn't belong. Fast-paced rounds. Include explanations after the round.

| Level | Content Source | Rounds | Assets |
| :---- | :---- | :---- | :---- |
| 2 | Plant Parts | Carrot/Potato/Onion/Lettuce (root vs leaf); Broccoli/Rice/Artichoke/Cauliflower (flower vs seed). 5 rounds. | Use your discretion based on file names |
| 3 | Soil Organisms | Bacteria/Fungi/Protozoa/Granite (living vs non-living); Earthworm/Nematode/Corn/Mite. 5 rounds. | Use your discretion based on file names |
| 4 | Cover Crops vs Others | Mixed identification. 5 rounds. | Use your discretion based on file names |
| 5 | Conservation Practices | Which one doesn't prevent erosion? Which isn't a real practice? 5 rounds. | See Soil Conservation Practices in Clues & Answers |

---

#### *Game 8: Drag and drop matching*

Basic mechanic: Drag words to correct image + description (or correct spot on the image, in the case of levels 2 and 3); image fills in with color when correct

* Level 1: Soil Functions
  * Source: Soil Functions crossword, Lower elem
  * Assets: See Clues & Answers
* Level 2: Earth Spheres
  * Source: Earth "Spheres" word search, lower elem
  * Assets: See Clues & Answers
* Level 2: Ways we store carbon
  * Source: Soil & Carbon, Lower elem
  * Assets: See Clues & Answers
* Level 3: Ways we release carbon
  * Source: Soil & Carbon, Lower elem
  * Assets: See Clues & Answers
* Level 4: Soil, Art, & Culture
  * Source: Soil, Art, & Culture word search, Lower elem
  * Assets:
* Level 5: Indigenous Farming Practices
  * Source: Indigenous Farming crossword, Upper elem
  * Assets: See Clues & Answers

### Tier 3: Harvest Guardians

#### *Game 9: "Farm Manager Simulator" (Scenario Strategy)*

Base mechanic: Given a farm crisis scenario, select the correct conservation practice from multiple options. Correct selections trigger before/after animations (e.g., muddy river turns clear, barren field turns green).

| Level | Scenario | Correct Practice | Assets |
| :---- | :---- | :---- | :---- |
| 1 | "Your field is losing nutrients into the local river!" | Saturated Buffers | See Clues & Answers |
| 2 | "Erosion is destroying your hillside crops!" | Prairie Strips | See Clues & Answers |
| 3 | "Your water table is too high after heavy rain!" | Drainage Water Management | See Clues & Answers |
| 4 | "You need to filter runoff before it hits the creek!" | Bioreactors | See Clues & Answers |
| 5 | "Your soil is depleted after harvest season!" | Cover Crops | See Clues & Answers |
| 6 | "Flooding threatens your lowland fields!" | Wetlands | See Clues & Answers |
| 7 | "Your soil has no structure and compacts easily!" | Cover Crops/Living Root | soil-functions-plant |
| 8 | "Pests are taking over — monoculture is failing!" | Plant Diversity / Crop Rotation | polyculture |

8 scenarios using conservation practices from the PDFs. Each level shows a cross-section diagram (extracted from PDF illustrations) of how the practice works after the correct answer.

#### *Game 10: "Soil Health Trivia Blitz" (Timed Trivia)*

Base mechanic: 60-second timed rounds. Multiple choice. Score tracked.

| Level | Content Source | # Questions | Assets |
| :---- | :---- | :---- | :---- |
| 1 | Soil Health Principles | 5 Qs (soil cover, limited disturbance, living roots, plant diversity, livestock integration) | See Clues & Answers |
| 2 | Indigenous Farming | 6 Qs (Chinampa, Milpa, Terraces, Polyculture, Floating Rice, Dry Stone Walling) | See Clues & Answers |
| 3 | CLORPT + Soil Formation | 5 Qs | See Clues & Answers |
| 4 | Soil Biology & Food Web | 7 Qs (bacteria, fungi, protozoa, nematodes, earthworms, arthropods) | See Clues & Answers |
| 5 | Agronomy Careers | 6 Qs (farm manager, soil scientist, seed analyst, climatologist, engineer, plant breeder) | None |
| 6 | Carbon Cycle | 5 Qs (store: trees/roots/no-till/healthy air; release: livestock/burning/plowing/deforestation) | See Clues & Answers |
| 7 | Soil Art & Culture | 6 Qs (mudcloth, pottery, ochre, clay, Egyptian makeup) | soil and culture-mudcloth, code, ochre, pottery, makeup |
| 8 | Climate Change | 4 Qs (agricultural productivity changes, regional impacts) | CLORPT-climate |
| 9 | Soil Regions | 6 Qs (desert, chernozem, forest, wetland, tundra, tropical, permafrost) | See Clues & Answers |
| BONUS | Mixed - All Categories | Random pull from all levels. Endless mode. | Use your discretion |

~50+ unique questions. All sourced directly from PDF content.

#### *Game 11: "Soil Food Web Builder" (Diagram Builder)*

Basic mechanic: Drag organism names to correct positions. Then draw arrows showing "who feeds who." Scoring based on correct placements and connections.

Source: Soil Food Web, Upper elem

Assets: soil-food-web-no-words2

## **Hub UX Flow**

### Home Screen

* Start-up screen:
  * SDSHC Games Hub (floating) *line break* Tap to Start! (blinking)
  * pixel-farm-scene-gif background
* Level selection screen:
  * Waving character (Basic_Charakter_wave.png) with speech bubble: "Choose a level!"
  * Character standing on Hills_topsoil_H repeat across the bottom of the screen, various biom things bushes, trees, flowers-gif pixel_farm_scene3 background
* Three buttons above character
  * "Little Sprouts (Pre-K - 2nd)"
  * "Meadow Makers (3rd - 5th)"
  * "Harvest Guardians (Middle & High)"

### Game Selection Screen

* Grid of game cards
* Each card: pixel-art icon + game title + level count badge (use ♡ to show level count, like levels: ♡♡)
* ui_board-home.png returns to grade select
* Locked levels shown with ui_board-question.png overlay (unlock by completing previous)

### In-Game UI

Not sure, see the notes on visuals at the beginning

### Auto-Reset

* 120 seconds of no touch input -> fade to home screen
* Brief "Touch to continue" prompt before reset (10s warning)

## **Technical Architecture**

### Offline Support

* All fonts bundled as .woff2 (no Google Fonts CDN)
* All assets are local
* Zero external API calls
* Optional: service worker for cache-first strategy

### Deployment

* **Online:** Existing GitHub Actions workflow deploys to GitHub Pages on push to main
* **Offline/Localhost:** `npm run dev`

---

## **Verification Plan**

*(to be filled in)*
