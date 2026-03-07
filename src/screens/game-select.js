import { navigate } from '../router.js'
import { getGamesForTier, TIER_META } from '../data/game-registry.js'

function createHearts(count) {
  return Array.from({ length: count }, () => '\u2661').join('')
}

export function createGameSelectScreen(tier) {
  const el = document.createElement('div')
  el.className = 'screen game-select-screen'

  const tierInfo = TIER_META[tier]
  const games = getGamesForTier(tier)

  const cardsHtml = games.map((game, i) => {
    const locked = i > 0 ? 'locked' : ''
    return `
      <button class="game-card ${locked}" data-tier="${tier}" data-game="${game.id}" ${locked ? 'disabled' : ''}>
        <img class="game-card-icon" src="${game.icon}" alt="">
        <span class="game-card-title">${game.title}</span>
        <span class="game-card-levels">${createHearts(game.levelCount)}</span>
      </button>
    `
  }).join('')

  el.innerHTML = `
    <div class="game-select-header">
      <button class="home-btn pixel-btn" style="padding:8px;">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="game-select-title">${tierInfo.name}</h2>
    </div>
    <div class="game-grid stagger-children">
      ${cardsHtml}
    </div>
  `

  // Home button
  el.querySelector('.home-btn').addEventListener('pointerdown', () => {
    navigate('grade-select')
  })

  // Game card handlers
  el.querySelectorAll('.game-card:not(.locked)').forEach(card => {
    card.addEventListener('pointerdown', () => {
      navigate(`game/${card.dataset.game}/0`)
    })
  })

  return el
}
