/**
 * Advanced Mode Game Registry
 * Flat array (no tiers). All games support multiplayer (1-4 players).
 * Icons are Unicode symbols, designed to be swappable for image assets later.
 *
 * `par` is the leaderboard normalization reference: the raw score one player
 * earns in a strong run of that game. The team leaderboard divides each run's
 * raw score by its game's par (×100) so a great game is worth ~100 points no
 * matter which game it was — Jeopardy (thousands) and Connections (tens) land
 * on the same scale. These are starting estimates; tune after watching real
 * play. Raw points are still recorded and shown alongside the normalized total.
 */

export const ADVANCED_GAMES = [
  {
    id: 'adv-spin-wheel',
    title: 'Spin the Wheel',
    description: 'Spin the wheel, pick a category, and answer advanced soil science questions.',
    icon: '\u2609', // ☉ (sun symbol)
    players: '1-4 players',
    par: 1500, // the built-in WIN_THRESHOLD — a strong run is reaching it
    module: () => import('../games/advanced/spin-wheel.js'),
  },
  {
    id: 'adv-trivia-blitz',
    title: 'Trivia Blitz',
    description: 'Timed multiple-choice rounds covering soil health, conservation, and more.',
    icon: '\u26A1', // ⚡
    players: '1-4 players',
    par: 1300, // ~10 correct fast answers (100 base + up to 50 speed bonus)
    module: () => import('../games/advanced/trivia-blitz.js'),
  },
  {
    id: 'adv-jeopardy',
    title: 'Soil Jeopardy',
    description: 'Choose categories and point values. Watch out for Daily Doubles!',
    icon: '\u2726', // ✦
    players: '1-4 players',
    par: 3000, // ~10 clues at avg 300; a solo board sweep scores higher
    module: () => import('../games/advanced/jeopardy.js'),
  },
  {
    id: 'adv-word-game',
    title: 'Word or Worm?',
    description: 'Guess soil science terms letter by letter. How many can you solve?',
    icon: '\u2135', // ℵ (alef — abstract letter symbol)
    players: '1-4 players',
    par: 1200, // ~3-4 words solved (300 solve bonus + letter points each)
    module: () => import('../games/advanced/word-game.js'),
  },
  {
    id: 'adv-field-guide',
    title: 'Field Guide',
    description: 'Identify SD plants, crops, wildlife, soils, practices, and equipment from photos.',
    icon: '\u2618', // ☘ (shamrock)
    players: '1-4 players',
    par: 3000, // ~10 IDs at avg 300 (400 with no clues revealed, less per clue)
    module: () => import('../games/advanced/field-guide.js'),
  },
  {
    id: 'adv-connections',
    title: 'Conservation Connections',
    description: 'Sort 16 tiles into 4 hidden groups. Watch out for tricky overlaps!',
    icon: '\u29C9', // ⧉ (two joined squares)
    players: '1-4 players',
    par: 1500, // ~2 puzzles solved cleanly (up to ~1000 pts each, order-dependent)
    module: () => import('../games/advanced/connections.js'),
  },
  {
    id: 'adv-farm-world',
    title: 'Farm World',
    description: 'Drive a 3D farm and restore its soil health, station by station.',
    icon: '\u{169E7}', // 𖧧 — matches the header launch button
    players: '1 player',
    par: 1400, // defensive only — Farm World never records leaderboard scores
    hidden: true, // not in the game grid; launched from the game-select header
    module: () => import('../games/advanced/farm-world/index.js'),
  },
]

export function getAdvancedGameById(id) {
  return ADVANCED_GAMES.find(g => g.id === id)
}

export function getAllAdvancedGames() {
  // Hidden games (Farm World) stay routable via getAdvancedGameById but are
  // excluded from the game-select grid.
  return ADVANCED_GAMES.filter(g => !g.hidden)
}

// Fallback par for any score whose gameId isn't in the registry (defensive —
// keeps an unknown game from dividing by zero / vanishing from the board).
const DEFAULT_PAR = 1500

/**
 * Normalization reference for a game id. Returns DEFAULT_PAR if unknown.
 * @param {string} id
 * @returns {number}
 */
export function getGamePar(id) {
  const g = ADVANCED_GAMES.find(g => g.id === id)
  return (g && g.par) || DEFAULT_PAR
}
