/**
 * Advanced Mode — Game Select Screen
 * Clean, dark card grid. No pixel art, no sprites.
 * Dark/light theme toggle in header.
 */

import { navigateRaw, navigate } from '../router.js'
import { getAllAdvancedGames } from '../data/advanced-game-registry.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { getTheme, setTheme, createThemeToggle } from '../utils/theme-toggle.js'
import { createLeaderboardButton } from '../utils/leaderboard-modal.js'
import { getPlayMode } from './advanced-play-mode.js'
import { getActiveEventId, getEventRoster, getEventById } from '../utils/leaderboard-api.js'

const BURST_COLORS = ['#38cebc', '#b8e84a', '#ff71ce', '#01cdfe', '#b967ff']

function spawnBurstParticles(container, x, y) {
  const count = 14
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'adv-burst-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 50 + Math.random() * 80
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = BURST_COLORS[i % BURST_COLORS.length]
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    container.appendChild(p)
    p.addEventListener('animationend', () => p.remove())
  }
}

export function createAdvancedGameSelectScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen adv-game-select'

  // Apply saved theme
  const currentTheme = getTheme()
  if (currentTheme === 'light') {
    document.getElementById('app').dataset.theme = 'light'
  }

  const games = getAllAdvancedGames()

  const playMode = getPlayMode()
  const activeEventId = getActiveEventId()

  screen.innerHTML = `
    <div class="adv-header">
      <div class="adv-header-left">
        <button class="adv-back-btn">\u2190 Back</button>
        <h1 class="adv-title">Advanced Mode</h1>
        ${playMode === 'team' && activeEventId ? `
          <div class="adv-game-select-banner" id="adv-gs-banner">
            <span class="adv-game-select-banner-text" id="adv-gs-banner-text">\u2026</span>
            <button class="adv-game-select-banner-btn" id="adv-gs-manage-roster">Manage roster</button>
          </div>
        ` : ''}
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

  // Cluster leaderboard button + theme toggle on the right
  const headerRight = document.createElement('div')
  headerRight.className = 'adv-header-right'
  headerRight.appendChild(createLeaderboardButton())
  headerRight.appendChild(createThemeToggle())
  screen.querySelector('.adv-header').appendChild(headerRight)

  // Back button
  screen.querySelector('.adv-back-btn').addEventListener('pointerdown', () => {
    navigateRaw('intro')
  })

  // Team-mode roster banner (populate event name + roster count, wire button)
  if (playMode === 'team' && activeEventId) {
    ;(async () => {
      const [ev, roster] = await Promise.all([getEventById(activeEventId), getEventRoster(activeEventId)])
      const text = screen.querySelector('#adv-gs-banner-text')
      if (text && ev) {
        text.innerHTML = `Event: <strong>${ev.name}</strong> · <span class="adv-gs-banner-count">${roster.length} team${roster.length === 1 ? '' : 's'} on roster</span>`
      }
    })()
    screen.querySelector('#adv-gs-manage-roster').addEventListener('pointerdown', () => {
      // Mark roster's Back as returning to game-select rather than play-mode
      sessionStorage.setItem('sdshc-roster-return', 'game-select')
      navigate('roster')
    })
  }

  // Game cards
  const cards = screen.querySelectorAll('.adv-game-card')
  cards.forEach(card => {
    card.style.touchAction = 'manipulation'
    card.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      card.classList.add('tapped')
      const rect = card.getBoundingClientRect()
      const screenRect = screen.getBoundingClientRect()
      spawnBurstParticles(screen, rect.left - screenRect.left + rect.width / 2, rect.top - screenRect.top + rect.height / 2)
      const gameId = card.dataset.game
      setTimeout(() => {
        navigate(`game/${gameId}/0`)
      }, 250)
    })
  })

  return screen
}
