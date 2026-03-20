/**
 * Advanced Mode Game Registry
 * Flat array (no tiers). All games support multiplayer (1-4 players).
 * Icons are Unicode symbols, designed to be swappable for image assets later.
 */

export const ADVANCED_GAMES = [
  {
    id: 'adv-spin-wheel',
    title: 'Spin the Wheel',
    description: 'Spin the wheel, pick a category, and answer advanced soil science questions.',
    icon: '\u2609', // ☉ (sun symbol)
    players: '1-4 players',
    module: () => import('../games/advanced/spin-wheel.js'),
  },
  {
    id: 'adv-trivia-blitz',
    title: 'Trivia Blitz',
    description: 'Timed multiple-choice rounds covering soil health, conservation, and more.',
    icon: '\u26A1', // ⚡
    players: '1-4 players',
    module: () => import('../games/advanced/trivia-blitz.js'),
  },
  {
    id: 'adv-jeopardy',
    title: 'Soil Jeopardy',
    description: 'Choose categories and point values. Watch out for Daily Doubles!',
    icon: '\u2726', // ✦
    players: '1-4 players',
    module: () => import('../games/advanced/jeopardy.js'),
  },
  {
    id: 'adv-word-game',
    title: 'Word or Worm?',
    description: 'Guess soil science terms letter by letter. How many can you solve?',
    icon: '\u2135', // ℵ (alef — abstract letter symbol)
    players: '1-4 players',
    module: () => import('../games/advanced/word-game.js'),
  },
  {
    id: 'adv-field-guide',
    title: 'Field Guide',
    description: 'Identify SD plants, crops, practices, and equipment from photos.',
    icon: '\u2618', // ☘ (shamrock)
    players: '1-4 players',
    module: () => import('../games/advanced/field-guide.js'),
  },
]

export function getAdvancedGameById(id) {
  return ADVANCED_GAMES.find(g => g.id === id)
}

export function getAllAdvancedGames() {
  return ADVANCED_GAMES
}
