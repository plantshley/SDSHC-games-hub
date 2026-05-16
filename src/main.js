import './styles/base.css'
import './styles/hub.css'
import './styles/transitions.css'
import './styles/games.css'
import './styles/intro.css'
import './styles/theme.css'
import './styles/advanced.css'
import './styles/leaderboard.css'

import { initRouter, onRoute, navigate, navigateRaw } from './router.js'
import { initIdleTimer, clearProgress, setIdleTimeout } from './idle-timer.js'
import { trackIdleTimeout, trackGameStart } from './utils/analytics.js'
import { createIntroScreen } from './screens/intro.js'
import { createSplashScreen } from './screens/splash.js'
import { createGradeSelectScreen } from './screens/grade-select.js'
import { createGameSelectScreen } from './screens/game-select.js'
import { createAdvancedGameSelectScreen } from './screens/advanced-game-select.js'
import { createAdvancedPlayModeScreen, getPlayMode, clearPlayMode } from './screens/advanced-play-mode.js'
import { createAdvancedRosterScreen } from './screens/advanced-roster.js'
import { createAdvancedAdminScreen } from './screens/advanced-admin.js'
import { getGameById } from './data/game-registry.js'
import { getAdvancedGameById } from './data/advanced-game-registry.js'
import { getActiveEventId } from './utils/leaderboard-api.js'

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

  // Intro screen (no mode). Clear play-mode session choice so each fresh
  // entry to Advanced Mode re-prompts (team vs casual).
  if (route.screen === 'intro') {
    clearPlayMode()
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
        // If an event is active and the player hasn't chosen a play mode this
        // session, redirect to the play-mode prompt first.
        if (getActiveEventId() && !getPlayMode()) {
          navigateRaw('advanced/play-mode')
          return
        }
        switchScreen(createAdvancedGameSelectScreen())
        break
      case 'play-mode':
        switchScreen(createAdvancedPlayModeScreen())
        break
      case 'roster':
        // Roster only makes sense in team mode with an active event.
        if (!getActiveEventId() || getPlayMode() !== 'team') {
          navigate('game-select')
          return
        }
        switchScreen(createAdvancedRosterScreen())
        break
      case 'admin':
        switchScreen(createAdvancedAdminScreen())
        break
      case 'game':
        handleAdvancedGame(route)
        break
    }
    return
  }
}

async function handleKidGame(route) {
  const game = getGameById(route.gameId)
  trackGameStart(route.gameId, 'kid', { tier: game?.tier || null, playerCount: 1 })

  if (!game || !game.module) {
    // Unknown game — go back to game select
    navigate(`game-select/${game ? game.tier : 'sprouts'}`)
    return
  }

  try {
    const mod = await game.module()
    // Find the create function export (first exported function)
    const createFn = mod.default || Object.values(mod).find(v => typeof v === 'function')
    if (createFn) {
      switchScreen(createFn())
    } else {
      navigate(`game-select/${game.tier}`)
    }
  } catch (err) {
    console.error('Failed to load kid game:', err)
    navigate(`game-select/${game.tier}`)
  }
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
