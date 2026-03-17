/**
 * Advanced Mode — Game Select Screen
 * Clean, dark card grid. No pixel art, no sprites.
 * Dark/light theme toggle in header.
 */

import { navigateRaw, navigate } from '../router.js'
import { getAllAdvancedGames } from '../data/advanced-game-registry.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { getTheme, setTheme, createThemeToggle } from '../utils/theme-toggle.js'

export function createAdvancedGameSelectScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen adv-game-select'

  // Apply saved theme
  const currentTheme = getTheme()
  if (currentTheme === 'light') {
    document.getElementById('app').dataset.theme = 'light'
  }

  const games = getAllAdvancedGames()

  screen.innerHTML = `
    <div class="adv-header">
      <div class="adv-header-left">
        <button class="adv-back-btn">\u2190 Back</button>
        <h1 class="adv-title">Advanced Mode</h1>
      </div>
    </div>

    <div class="adv-game-grid">
      ${games.map(game => `
        <div class="adv-game-card" data-game="${game.id}">
          <span class="adv-game-card-icon">${game.icon}</span>
          <span class="adv-game-card-title">${game.title}</span>
          <span class="adv-game-card-desc">${game.description}</span>
          <span class="adv-game-card-players">${game.players}</span>
        </div>
      `).join('')}
    </div>
  `

  // Add gradient sphere background
  addGradientBackground(screen, 'game-select')

  // Add theme toggle to header
  screen.querySelector('.adv-header').appendChild(createThemeToggle())

  // Back button
  screen.querySelector('.adv-back-btn').addEventListener('pointerdown', () => {
    navigateRaw('intro')
  })

  // Game cards
  const cards = screen.querySelectorAll('.adv-game-card')
  cards.forEach(card => {
    card.addEventListener('pointerdown', () => {
      card.classList.add('tapped')
      const gameId = card.dataset.game
      setTimeout(() => {
        navigate(`game/${gameId}/0`)
      }, 150)
    })
  })

  return screen
}
