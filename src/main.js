import './styles/base.css'
import './styles/hub.css'
import './styles/transitions.css'
import './styles/games.css'
import './styles/intro.css'
import './styles/theme.css'
import './styles/advanced.css'
import './styles/leaderboard.css'

import { initRouter, onRoute, navigate, navigateRaw } from './router.js'
import { initIdleTimer, clearProgress, setIdleTimeout, disableIdleTimer, enableIdleTimer } from './idle-timer.js'
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
import { getActiveEventId, setActiveEventId, listEvents } from './utils/leaderboard-api.js'
import { warmOfflineCache, isWarmedForBuild } from './utils/offline-warmup.js'

const app = document.getElementById('app')
let currentScreen = null

function switchScreen(newScreenEl) {
  // Sweep any orphaned old screens first — defensive cleanup so animation
  // hiccups (interrupted transitions, missed animationend events) can't
  // leave previous screen DOM stacked behind the new one.
  Array.from(app.querySelectorAll('.screen')).forEach(s => {
    if (s !== currentScreen) s.remove()
  })

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

  // Configure idle timer. Admin page disables it entirely so an admin working
  // on a phone (typing, color picking) isn't kicked back to intro mid-task.
  if (route.mode === 'advanced' && route.screen === 'admin') {
    disableIdleTimer()
  } else if (route.mode === 'kid') {
    enableIdleTimer()
    setIdleTimeout(120_000)
  } else if (route.mode === 'advanced') {
    enableIdleTimer()
    setIdleTimeout(600_000)
  } else {
    enableIdleTimer()
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
        handleAdvancedGameSelect()
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
      default:
        // Unrecognized advanced sub-route (e.g. a typo'd hash) — self-heal to
        // the game grid instead of sweeping the screen and rendering nothing.
        console.warn('[router] Unrecognized advanced route:', route.screen)
        navigate('game-select')
    }
    return
  }
}

/**
 * Advanced game-select entry. If this kiosk has an active event and the player
 * hasn't chosen a play mode this session, prompt team-vs-casual first — but only
 * after confirming the active event still exists and is open. A stale pointer
 * (event ended/deleted, possibly on another kiosk while this one held the id in
 * localStorage) is cleared so we don't prompt team play for a dead event.
 */
async function handleAdvancedGameSelect() {
  const entryHash = location.hash
  const activeId = getActiveEventId()
  if (activeId && !getPlayMode()) {
    const status = await activeEventStatus(activeId)
    // A newer navigation superseded us while awaiting the event read — let it
    // own the screen instead of switching on top of it.
    if (location.hash !== entryHash) return
    if (status === 'open') {
      navigateRaw('advanced/play-mode')
      return
    }
    // Clear only when CONFIRMED gone or ended, so this kiosk stands down when an
    // event ends/deletes elsewhere. A scheduled event, or a transient read
    // failure, keeps the pointer and just skips the prompt this time.
    if (status === 'invalid') setActiveEventId(null)
  }
  if (location.hash !== entryHash) return
  switchScreen(createAdvancedGameSelectScreen())
}

/**
 * 'open'    — event exists and is running → prompt team play.
 * 'invalid' — event is deleted or ended → stale, clear the pointer.
 * 'pending' — event exists but is scheduled (not open yet) → skip prompt, keep it.
 * 'unknown' — read failed (e.g. offline + uncached) → skip prompt, keep it.
 * Uses listEvents (a cached collection read that doesn't throw offline) rather
 * than a single-doc get (which throws for an id the cache has never seen).
 */
async function activeEventStatus(activeId) {
  try {
    const events = await listEvents()
    const ev = events.find(e => e.id === activeId)
    if (!ev) return 'invalid'
    if (ev.status === 'open') return 'open'
    if (ev.status === 'ended') return 'invalid'
    return 'pending'
  } catch {
    return 'unknown'
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

// Warm the offline media cache once per build, when online. Deferred and
// fire-and-forget so it never competes with first render or blocks gameplay.
// (The admin panel exposes a manual re-run with progress for kiosk setup.)
if (navigator.onLine && !isWarmedForBuild()) {
  const kick = () => warmOfflineCache().catch(() => {})
  if ('requestIdleCallback' in window) {
    requestIdleCallback(kick, { timeout: 5000 })
  } else {
    setTimeout(kick, 3000)
  }
}
