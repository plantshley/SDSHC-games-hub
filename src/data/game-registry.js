/**
 * Game registry: metadata for all 11 games across 3 tiers.
 * Games are lazy-loaded via dynamic import when selected.
 */

export const TIER_META = {
  sprouts: {
    name: 'Little Sprouts',
    grades: 'Pre-K \u2013 2nd Grade',
    color: '#a6c264',
  },
  meadow: {
    name: 'Meadow Makers',
    grades: '3rd \u2013 5th Grade',
    color: '#e496d7',
  },
  guardians: {
    name: 'Harvest Guardians',
    grades: 'Middle & High School',
    color: '#38cebc',
  },
}

export const GAMES = [
  // Tier 1: Little Sprouts
  {
    id: 'soil-cake',
    title: 'Build a Soil Cake',
    tier: 'sprouts',
    levelCount: 1,
    icon: '/assets/gifs/cake-gif.gif',
    description: 'Fill in soil layers with the right colors',
    module: () => import('../games/soil-cake.js'),
  },
  {
    id: 'dot-to-dot',
    title: 'What Does Soil Make?',
    tier: 'sprouts',
    levelCount: 4,
    icon: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png',
    description: 'Connect glowing dots to reveal objects',
    module: () => import('../games/dot-to-dot.js'),
  },
  {
    id: 'dont-belong',
    title: "Things That Don't Belong",
    tier: 'sprouts',
    levelCount: 4,
    icon: '/assets/gifs/h03-icon-strawberry.gif',
    description: 'Tap the item that doesn\'t belong',
    module: () => import('../games/dont-belong.js'),
  },
  {
    id: 'coloring',
    title: 'Soil Critter Coloring',
    tier: 'sprouts',
    levelCount: 12,
    icon: '/assets/sprites/Basic_Grass_Biom_things_flower3.png',
    description: 'Pick colors and paint soil critters',
    module: () => import('../games/coloring.js'),
  },

  // Tier 2: Meadow Makers
  {
    id: 'planting-sim',
    title: 'Planting Simulation',
    tier: 'meadow',
    levelCount: 3,
    icon: '/assets/sprites/Basic_Plants_fruit-grow3.png',
    description: 'Plant the right crops in the right spots',
    module: () => import('../games/planting-sim.js'),
  },
  {
    id: 'spin-wheel',
    title: 'Spin the Soil Wheel',
    tier: 'meadow',
    levelCount: 7,
    icon: '/assets/sprites/Free_Chicken_Sprites_6.png',
    description: 'Spin the wheel and answer soil trivia',
    module: () => import('../games/spin-wheel.js'),
  },
  {
    id: 'odd-one-out',
    title: 'Odd One Out',
    tier: 'meadow',
    levelCount: 4,
    icon: '/assets/sprites/Basic_Grass_Biom_things_mushroom2.png',
    description: 'Find what doesn\'t belong — fast!',
    module: () => import('../games/odd-one-out.js'),
  },
  {
    id: 'drag-drop',
    title: 'Drag & Drop Match',
    tier: 'meadow',
    levelCount: 6,
    icon: '/assets/sprites/Basic_Grass_Biom_things_flower1.png',
    description: 'Drag words to the right spot',
    module: () => import('../games/drag-drop.js'),
  },

  // Tier 3: Harvest Guardians
  {
    id: 'farm-manager',
    title: 'Farm Manager Simulator',
    tier: 'guardians',
    levelCount: 9,
    icon: '/assets/sprites/Basic_Plants_wheat-grow4.png',
    description: 'Save the farm with the right practice!',
    module: () => import('../games/farm-manager.js'),
  },
  {
    id: 'trivia-blitz',
    title: 'Soil Health Trivia Blitz',
    tier: 'guardians',
    levelCount: 9,
    icon: '/assets/sprites/Weather_Icons_smal_sunny.png',
    description: '60-second timed trivia challenge',
    module: () => import('../games/trivia-blitz.js'),
  },
  {
    id: 'food-web',
    title: 'Soil Food Web Builder',
    tier: 'guardians',
    levelCount: 1,
    icon: '/assets/sprites/Basic_Grass_Biom_things_log.png',
    description: 'Build a soil food web diagram',
    module: () => import('../games/food-web.js'),
  },
]

export function getGamesForTier(tier) {
  return GAMES.filter(g => g.tier === tier)
}

export function getGameById(id) {
  return GAMES.find(g => g.id === id)
}
