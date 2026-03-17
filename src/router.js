/**
 * Simple hash-based SPA router with mode awareness.
 * Routes: #intro, #kid/splash, #kid/grade-select, #kid/game-select/:tier,
 *         #kid/game/:gameId/:level, #advanced/game-select, #advanced/game/:gameId/:level
 */

const listeners = []
let currentRoute = null
let currentMode = null

export function onRoute(callback) {
  listeners.push(callback)
}

/**
 * Navigate within the current mode. Auto-prepends the active mode prefix.
 * e.g. navigate('grade-select') while in kid mode → #kid/grade-select
 */
export function navigate(path) {
  if (currentMode) {
    window.location.hash = `${currentMode}/${path}`
  } else {
    window.location.hash = path
  }
}

/**
 * Navigate to an absolute hash without auto-prefixing.
 * Used for cross-mode navigation (intro screen, idle reset).
 */
export function navigateRaw(hash) {
  window.location.hash = hash
}

export function getCurrentRoute() {
  return currentRoute
}

export function getCurrentMode() {
  return currentMode
}

function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, '')

  // Intro / empty
  if (!clean || clean === 'intro') {
    return { screen: 'intro', mode: null }
  }

  // Kid mode routes
  if (clean.startsWith('kid/')) {
    const rest = clean.slice(4) // strip 'kid/'
    return { ...parseRoute(rest), mode: 'kid' }
  }

  // Advanced mode routes
  if (clean.startsWith('advanced/')) {
    const rest = clean.slice(9) // strip 'advanced/'
    return { ...parseRoute(rest), mode: 'advanced' }
  }

  // Legacy routes without mode prefix — treat as kid mode for backwards compat
  return { ...parseRoute(clean), mode: 'kid' }
}

/**
 * Parse the route portion after the mode prefix.
 */
function parseRoute(path) {
  if (!path || path === 'splash') {
    return { screen: 'splash' }
  }
  if (path === 'grade-select') {
    return { screen: 'grade-select' }
  }
  if (path.startsWith('game-select')) {
    const tier = path.split('/')[1]
    return tier
      ? { screen: 'game-select', tier }
      : { screen: 'game-select' }
  }
  if (path.startsWith('game/')) {
    const parts = path.split('/')
    return { screen: 'game', gameId: parts[1], level: parseInt(parts[2] || '0', 10) }
  }
  return { screen: 'splash' }
}

function handleHashChange() {
  const route = parseHash(window.location.hash)
  currentRoute = route
  currentMode = route.mode
  for (const cb of listeners) {
    cb(route)
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleHashChange)
  // Set initial route
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#intro'
  } else {
    handleHashChange()
  }
}
