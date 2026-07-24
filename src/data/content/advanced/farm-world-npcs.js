/**
 * Farm World — NPCs
 *
 * The wandering characters you can talk to. Everything here is plain, swappable
 * data — no code changes needed to re-skin an NPC or rewrite what it says:
 *
 *   - `look`  — a procedural-character state (partial is fine; unset fields fall
 *               back to the doll defaults). Design a look in the in-game
 *               customizer, then run `fwExportLook()` in the browser console and
 *               paste the printed object here.
 *   - `lines` — what the NPC says, one per "Next" tap. Keep them short. Tips are
 *               paraphrased from the same sourced material as the stations
 *               (Trivia Blitz / farm-world facts) — do not invent soil facts.
 *   - `route` — which patrol path world.js walks it along: 'hubLoop' or
 *               'oldOuter' (main island), 'trailNear' or 'trailFar' (trail
 *               island). Geometry lives in world.js so looks/lines stay
 *               coordinate-free.
 *
 * The initial looks below are placeholders — distinct on purpose so the four
 * read as different people — meant to be replaced with real designs later.
 */

export const NPCS = [
  {
    id: 'rosa',
    name: 'Rosa',
    role: 'Soil Scientist',
    route: 'hubLoop',
    look: {
      colors: { skin: '#7a4a2b', hair: '#d09c18', shirt: '#2f9e8f', bottom: '#2f9e8f', shoes: '#5b4636', eyes: '#3a2a1c' },
      variants: { hair: 'bun', shirt: 'overalls', bottom: 'pants', wings: 'off' },
      accessories: { halo: false, ears: false, lashes: false, glasses: true, freckles: true, blushHeart: false, socks: false, star: false },
    },
    lines: [
      'Grab a handful of soil sometime — those crumbly clumps are aggregates, and they let air and water move through.',
      'Healthy soil can soak up over an inch of rain an hour. Tired, bare soil barely manages a tenth of that.',
      'Every glowing ring out here marks a station. Restore them all to bring the whole farm back to life!',
    ],
  },
  {
    id: 'fred',
    name: 'Fred',
    role: 'Farmer',
    route: 'oldOuter',
    look: {
      colors: { skin: '#c78f72', hair: '#d0cabd', shirt: '#ab2124', bottom: '#92b3cb', wings: '#ffaee1', eyes: '#5a84a3', blush: '#462c15', shoes: '#800040' },
      variants: { hair: 'bob', bottom: 'pants', wings: 'off', shirt: 'overalls' },
      accessories: { bow: false, halo: false, horns: false, ears: false, lashes: false, mustache: false, star: false, socks: true, glasses: false, freckles: true, flowerCrown: false, antennae: false, blushHeart: false, blushStar: false },
      accessoryColors: { socks: '#800040', freckles: '#c07836', lashes: '#5a413a' },
    },
    lines: [
      'I switched to no-till years back. Fewer passes with the tractor, and the soil stays soft instead of packed hard.',
      'Keep something growing year-round — living roots feed the critters underground, even through winter.',
      'Cross the bridge if you haven’t yet. There’s a whole second stretch of farm over there to bring back.',
    ],
  },
  {
    id: 'lena',
    name: 'Lena',
    role: 'Conservation Tech',
    route: 'trailNear',
    look: {
      colors: { skin: '#e8b892', hair: '#b5502e', shirt: '#e8873c', bottom: '#4e9e57', wings: '#caa94e', shoes: '#b5502e', eyes: '#3a6e2a' },
      variants: { hair: 'long', shirt: 'crop', bottom: 'shorts', wings: 'butterfly' },
      accessories: { halo: false, ears: false, lashes: true, flowerCrown: true, freckles: true, blushHeart: false, socks: true },
    },
    lines: [
      'Those prairie strips aren’t just pretty — a narrow band of native plants can hold back most of a field’s lost soil.',
      'Buffers along the water catch runoff before it reaches the stream. Clean water really does start on land.',
      'The pollinators love these wildflowers. More blooms up here means more bees for the crops.',
    ],
  },
  {
    id: 'theo',
    name: 'Theo',
    role: 'Agronomy Student',
    route: 'trailFar',
    look: {
      colors: { skin: '#4a2f1e', hair: '#1a1410', shirt: '#3a6ee0', bottom: '#2b3a5c', shoes: '#e8873c', eyes: '#2a1c10' },
      variants: { hair: 'afro', shirt: 'tank', bottom: 'shorts', wings: 'off' },
      accessories: { halo: false, ears: false, lashes: false, star: true, freckles: false, blushHeart: false, socks: false },
    },
    lines: [
      'There are so many soil careers — crop advisor, soil scientist, plant breeder, even engineers who design wetlands.',
      'That sensor rig reads the soil’s electrical conductivity — it maps where salt is quietly building up.',
      'Terra preta — “dark earth” — was made by people centuries ago, and it’s still more fertile than the soil around it. Wild, right?',
    ],
  },
]
