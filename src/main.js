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
import { chooseEvent } from './utils/event-status.js'
import { warmOfflineCache, isWarmedForBuild } from './utils/offline-warmup.js'
import { USE_FIRESTORE } from './firebase/config.js'

const app = document.getElementById('app')
let currentScreen = null
// Tracks whether the screen we're leaving was the admin panel, so we can lock
// it behind the password again the moment staff navigates away (see below).
let wasAdmin = false

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
  // Lock the admin panel behind the password again as soon as it's left. On a
  // shared event device the risk is a signed-in session outliving the staffer
  // who signed in; ending it on navigation-away means a student can't wander
  // into an already-unlocked panel. Fire-and-forget; the auth chunk is loaded
  // lazily so non-admin navigation never pulls firebase/auth in.
  const isAdmin = route.mode === 'advanced' && route.screen === 'admin'
  if (wasAdmin && !isAdmin && USE_FIRESTORE) {
    import('./firebase/auth.js').then(m => m.adminSignOut()).catch(() => {})
  }
  wasAdmin = isAdmin

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
 * Advanced game-select entry. Before showing the grid, work out whether this
 * device should be prompted for team-vs-casual — which means working out which
 * event, if any, this device is in.
 *
 * The device no longer has to be pointed at an event by hand from the admin
 * panel: if exactly one event is running, it joins it. See resolveActiveEvent.
 */
async function handleAdvancedGameSelect() {
  const entryHash = location.hash
  if (!getPlayMode()) {
    const resolution = await resolveActiveEvent()
    // A newer navigation superseded us while awaiting the event read — let it
    // own the screen instead of switching on top of it.
    if (location.hash !== entryHash) return

    // 'joined'    — one event, now active on this device.
    // 'ambiguous' — several running; the play-mode screen shows a picker.
    // 'unknown'   — we couldn't read the events (cold offline cache), but this
    //   device still holds a pointer from when it *could*. Prompt anyway. Not
    //   prompting would leave play-mode unset, which every caller treats as
    //   casual — so a kiosk booted offline would silently record a whole event
    //   with no team and no eventId, the exact failure auto-join exists to fix.
    const prompt =
      resolution === 'joined' ||
      resolution === 'ambiguous' ||
      (resolution === 'unknown' && getActiveEventId())

    if (prompt) {
      navigateRaw('advanced/play-mode')
      return
    }
  }
  if (location.hash !== entryHash) return
  switchScreen(createAdvancedGameSelectScreen())
}

/**
 * Decide which event this device is in, and persist the answer.
 *
 * Auto-join replaces the old "admin signs in on every device and picks the
 * event" step. The decision itself is pure — see `chooseEvent` in
 * utils/event-status.js, which is where the rules and their rationale live.
 *
 * The resolved id is WRITTEN to localStorage, not merely computed per
 * navigation: a device that goes offline afterwards then keeps its event even
 * once the events cache goes cold.
 *
 * @returns {'joined' | 'ambiguous' | 'none' | 'unknown'}
 */
async function resolveActiveEvent() {
  let events
  try {
    // listEvents is a cached collection read; unlike a single-doc get it does
    // not throw offline for an id the cache has never seen.
    events = await listEvents()
  } catch {
    return 'unknown' // transient read failure — keep any pointer, don't prompt
  }

  const activeId = getActiveEventId()
  const { decision, eventId } = chooseEvent(events, activeId, Date.now())

  // 'unknown' means we can't tell — never write, never clear.
  if (decision !== 'unknown' && eventId !== activeId) setActiveEventId(eventId)

  return decision
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
