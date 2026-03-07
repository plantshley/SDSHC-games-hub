/**
 * Simple hash-based SPA router.
 * Routes: #splash, #grade-select, #game-select/:tier, #game/:gameId/:level
 */

const listeners = []
let currentRoute = null

export function onRoute(callback) {
  listeners.push(callback)
}

export function navigate(hash) {
  window.location.hash = hash
}

export function getCurrentRoute() {
  return currentRoute
}

function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, '')
  if (!clean || clean === 'splash') {
    return { screen: 'splash' }
  }
  if (clean === 'grade-select') {
    return { screen: 'grade-select' }
  }
  if (clean.startsWith('game-select/')) {
    return { screen: 'game-select', tier: clean.split('/')[1] }
  }
  if (clean.startsWith('game/')) {
    const parts = clean.split('/')
    return { screen: 'game', gameId: parts[1], level: parseInt(parts[2] || '0', 10) }
  }
  return { screen: 'splash' }
}

function handleHashChange() {
  const route = parseHash(window.location.hash)
  currentRoute = route
  for (const cb of listeners) {
    cb(route)
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleHashChange)
  // Set initial route
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#splash'
  } else {
    handleHashChange()
  }
}
