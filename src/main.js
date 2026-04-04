import './styles/base.css'
import './styles/hub.css'
import './styles/transitions.css'
import './styles/games.css'
import './styles/intro.css'
import './styles/theme.css'
import './styles/advanced.css'

import { initRouter, onRoute, navigate, navigateRaw } from './router.js'
import { initIdleTimer, clearProgress, setIdleTimeout } from './idle-timer.js'
import { trackIdleTimeout, trackGameStart } from './utils/analytics.js'
import { createIntroScreen } from './screens/intro.js'
import { createSplashScreen } from './screens/splash.js'
import { createGradeSelectScreen } from './screens/grade-select.js'
import { createGameSelectScreen } from './screens/game-select.js'
import { createAdvancedGameSelectScreen } from './screens/advanced-game-select.js'
import { getGameById } from './data/game-registry.js'
import { getAdvancedGameById } from './data/advanced-game-registry.js'
import { createSoilCakeGame } from './games/soil-cake.js'
import { createPlantingSimGame } from './games/planting-sim.js'
import { createTriviaBlitzGame } from './games/trivia-blitz.js'
import { createColoringGame } from './games/coloring.js'
import { createSpinWheelGame } from './games/spin-wheel.js'
import { createDotToDotGame } from './games/dot-to-dot.js'
import { createFoodWebGame } from './games/food-web.js'
import { createDragDropGame } from './games/drag-drop.js'

const app = document.getElementById('app')
let currentScreen = null

function switchScreen(newScreenEl) {
  if (currentScreen) {
    currentScreen.classList.remove('active')
    currentScreen.classList.add('exiting')

    const old = currentScreen
    old.addEventListener('animationend', () => {
      old.remove()
    }, { once: true })

    // Fallback removal if animation doesn't fire
    setTimeout(() => {
      if (old.parentNode) old.remove()
    }, 400)
  }

  app.appendChild(newScreenEl)

  // Force reflow before adding active class for animation
  newScreenEl.offsetHeight
  newScreenEl.classList.add('active', 'entering')

  newScreenEl.addEventListener('animationend', () => {
    newScreenEl.classList.remove('entering')
  }, { once: true })

  currentScreen = newScreenEl
}

function handleRoute(route) {
  // Set mode on app element for CSS scoping
  if (route.mode) {
    app.dataset.mode = route.mode
  } else {
    delete app.dataset.mode
  }

  // Configure idle timer based on mode
  if (route.mode === 'kid') {
    setIdleTimeout(120_000)
  } else if (route.mode === 'advanced') {
    setIdleTimeout(300_000)
  }

  // Intro screen (no mode)
  if (route.screen === 'intro') {
    switchScreen(createIntroScreen())
    return
  }

  // Kid mode screens
  if (route.mode === 'kid') {
    switch (route.screen) {
      case 'splash':
        switchScreen(createSplashScreen())
        break
      case 'grade-select':
        switchScreen(createGradeSelectScreen())
        break
      case 'game-select':
        switchScreen(createGameSelectScreen(route.tier))
        break
      case 'game':
        handleKidGame(route)
        break
    }
    return
  }

  // Advanced mode screens
  if (route.mode === 'advanced') {
    switch (route.screen) {
      case 'game-select':
        switchScreen(createAdvancedGameSelectScreen())
        break
      case 'game':
        handleAdvancedGame(route)
        break
    }
    return
  }
}

function handleKidGame(route) {
  const game = getGameById(route.gameId)
  trackGameStart(route.gameId, 'kid', { tier: game?.tier || null, playerCount: 1 })

  // Route to implemented games
  if (route.gameId === 'soil-cake') {
    switchScreen(createSoilCakeGame())
    return
  }
  if (route.gameId === 'planting-sim') {
    switchScreen(createPlantingSimGame())
    return
  }
  if (route.gameId === 'trivia-blitz') {
    switchScreen(createTriviaBlitzGame())
    return
  }
  if (route.gameId === 'coloring') {
    switchScreen(createColoringGame())
    return
  }
  if (route.gameId === 'spin-wheel') {
    switchScreen(createSpinWheelGame())
    return
  }
  if (route.gameId === 'dot-to-dot') {
    switchScreen(createDotToDotGame())
    return
  }
  if (route.gameId === 'food-web') {
    switchScreen(createFoodWebGame())
    return
  }
  if (route.gameId === 'drag-drop') {
    switchScreen(createDragDropGame())
    return
  }

  // Placeholder for unimplemented games
  const placeholder = document.createElement('div')
  placeholder.className = 'screen game-placeholder'
  placeholder.innerHTML = `
    <div class="game-placeholder-topbar">
      <button class="home-btn" id="game-back">
        <img src="/assets/sprites/ui_board-home.png" alt="Back">
      </button>
      <span class="game-placeholder-title">${game ? game.title : route.gameId}</span>
      <span class="game-placeholder-level">Level ${route.level + 1}</span>
    </div>
    <div class="game-placeholder-body">
      <p>Game coming soon!</p>
    </div>
  `
  placeholder.querySelector('#game-back').addEventListener('pointerdown', () => {
    navigate(`game-select/${game ? game.tier : 'sprouts'}`)
  })
  switchScreen(placeholder)
}

/**
 * Handle advanced mode game routing.
 * Lazy-loads game modules from the advanced registry.
 */
async function handleAdvancedGame(route) {
  const game = getAdvancedGameById(route.gameId)
  if (!game) {
    // Unknown game — go back to advanced game select
    navigate('game-select')
    return
  }

  // Show loading state
  const loading = document.createElement('div')
  loading.className = 'screen'
  loading.style.cssText = 'background: var(--adv-bg, #0a0a14); display: flex; align-items: center; justify-content: center;'
  loading.innerHTML = `<span style="font-family: var(--font-body), monospace; color: var(--adv-accent, #38cebc); font-size: 1.2rem;">Loading...</span>`
  switchScreen(loading)

  try {
    const mod = await game.module()
    const gameScreen = mod.default ? mod.default() : Object.values(mod)[0]()
    switchScreen(gameScreen)
  } catch (err) {
    console.error('Failed to load advanced game:', err)
    navigate('game-select')
  }
}

// Initialize
onRoute(handleRoute)
initRouter()

initIdleTimer(() => {
  trackIdleTimeout(app.dataset.mode || 'intro', location.hash.replace('#', '') || 'intro')
  clearProgress()
  navigateRaw('intro')
})
