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
    description: 'Fill in the soil layers with the right colors!',
  },
  {
    id: 'dot-to-dot',
    title: 'What Does Soil Make?',
    tier: 'sprouts',
    levelCount: 4,
    icon: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png',
    description: 'Connect the glowing dots to reveal hidden objects!',
  },
  {
    id: 'dont-belong',
    title: "Things That Don't Belong",
    tier: 'sprouts',
    levelCount: 4,
    icon: '/assets/sprites/Basic_Grass_Biom_things_rock.png',
    description: 'Tap the item that doesn\'t belong!',
  },
  {
    id: 'coloring',
    title: 'Soil Critter Coloring',
    tier: 'sprouts',
    levelCount: 9,
    icon: '/assets/sprites/Basic_Grass_Biom_things_flower3.png',
    description: 'Pick colors and paint soil critters!',
  },

  // Tier 2: Meadow Makers
  {
    id: 'planting-sim',
    title: 'Planting Simulation',
    tier: 'meadow',
    levelCount: 3,
    icon: '/assets/sprites/Basic_Plants_fruit-grow3.png',
    description: 'Plant the right crops in the right spots!',
  },
  {
    id: 'spin-wheel',
    title: 'Spin the Soil Wheel',
    tier: 'meadow',
    levelCount: 7,
    icon: '/assets/sprites/Free_Chicken_Sprites_6.png',
    description: 'Spin the wheel and answer soil trivia!',
  },
  {
    id: 'odd-one-out',
    title: 'Odd One Out',
    tier: 'meadow',
    levelCount: 4,
    icon: '/assets/sprites/Basic_Grass_Biom_things_mushroom2.png',
    description: 'Find what doesn\'t belong — fast!',
  },
  {
    id: 'drag-drop',
    title: 'Drag & Drop Match',
    tier: 'meadow',
    levelCount: 5,
    icon: '/assets/sprites/Basic_Grass_Biom_things_flower1.png',
    description: 'Drag words to the right spot!',
  },

  // Tier 3: Harvest Guardians
  {
    id: 'farm-manager',
    title: 'Farm Manager Simulator',
    tier: 'guardians',
    levelCount: 8,
    icon: '/assets/sprites/Basic_Plants_wheat-grow4.png',
    description: 'Save the farm with the right practice!',
  },
  {
    id: 'trivia-blitz',
    title: 'Soil Health Trivia Blitz',
    tier: 'guardians',
    levelCount: 10,
    icon: '/assets/sprites/Weather_Icons_smal_sunny.png',
    description: '60-second timed trivia challenge!',
  },
  {
    id: 'food-web',
    title: 'Soil Food Web Builder',
    tier: 'guardians',
    levelCount: 1,
    icon: '/assets/sprites/Basic_Grass_Biom_things_log.png',
    description: 'Build the soil food web diagram!',
  },
]

export function getGamesForTier(tier) {
  return GAMES.filter(g => g.tier === tier)
}

export function getGameById(id) {
  return GAMES.find(g => g.id === id)
}
