/**
 * Advanced Mode — Game Select Screen
 * Clean, dark card grid. No pixel art, no sprites.
 * Dark/light theme toggle in header.
 */

import { navigateRaw, navigate } from '../router.js'
import { getAllAdvancedGames } from '../data/advanced-game-registry.js'
import { onTap } from '../utils/tap.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { getTheme, setTheme, createThemeToggle } from '../utils/theme-toggle.js'
import { createLeaderboardButton } from '../utils/leaderboard-modal.js'
import { getPlayMode } from './advanced-play-mode.js'
import { getActiveEventId, warmLeaderboardCache } from '../utils/leaderboard-api.js'

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
  // Fire-and-forget: pre-load leaderboard data into the Firestore offline cache
  // while we're (presumably) online, so a kiosk going offline for an event
  // starts from the current cloud snapshot. No-op on the localStorage backend;
  // failures (offline, blocked) are swallowed — purely opportunistic.
  warmLeaderboardCache().catch(() => {})

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

  // Right cluster: (team mode) the manage-roster button to the LEFT of the
  // leaderboard button, then leaderboard, then the theme toggle.
  const headerRight = document.createElement('div')
  headerRight.className = 'adv-header-right'
  if (playMode === 'team' && activeEventId) {
    const rosterBtn = document.createElement('button')
    rosterBtn.className = 'adv-game-select-banner-btn'
    rosterBtn.textContent = 'Manage roster'
    onTap(rosterBtn, () => {
      // Mark roster's Back as returning to game-select rather than play-mode
      sessionStorage.setItem('sdshc-roster-return', 'game-select')
      navigate('roster')
    })
    headerRight.appendChild(rosterBtn)
  }
  headerRight.appendChild(createLeaderboardButton())
  headerRight.appendChild(createThemeToggle())
  screen.querySelector('.adv-header').appendChild(headerRight)

  // Back button
  onTap(screen.querySelector('.adv-back-btn'), () => {
    navigateRaw('intro')
  })

  // Game cards
  const cards = screen.querySelectorAll('.adv-game-card')
  cards.forEach(card => {
    card.style.touchAction = 'manipulation'
    onTap(card, (e) => {
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
