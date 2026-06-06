/**
 * Offline cache warm-up.
 *
 * The service worker precaches only the app shell (code/fonts/html) so it
 * installs and updates in ~1s. Media (sprites, photos, gifs, diagrams) is cached
 * at runtime instead — but a kiosk taken to an event with no Wi-Fi needs *every*
 * asset cached ahead of time, not just the ones that happened to be viewed.
 *
 * This module fetches `asset-manifest.json` (emitted at build time, listing all
 * media URLs) and requests each one while online. Those requests pass through
 * the service worker's StaleWhileRevalidate handler, which stores them in the
 * `sdshc-media` cache — making the installed PWA fully offline-capable.
 *
 * Re-running is cheap: already-cached assets are served from the SW cache, so
 * the warm-up is idempotent. We still gate the *automatic* run to once per build
 * (via localStorage) so a returning kiosk doesn't refetch the manifest every
 * launch; the admin panel's "Cache for offline" button always forces a run.
 */

const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'
const WARMED_KEY = 'sdshc-offline-warmed-build'
const CONCURRENCY = 6

let state = { status: 'idle', done: 0, total: 0, error: null }
const listeners = new Set()

function emit() {
  const snapshot = { ...state }
  for (const cb of listeners) {
    try {
      cb(snapshot)
    } catch {
      /* a listener throwing must not break the warm-up */
    }
  }
}

/**
 * Subscribe to warm-up progress. Fires immediately with the current state and
 * on every change. Returns an unsubscribe function.
 */
export function onWarmupProgress(cb) {
  listeners.add(cb)
  cb({ ...state })
  return () => listeners.delete(cb)
}

export function getWarmupState() {
  return { ...state }
}

/** True if the offline warm-up already completed for the currently-served build. */
export function isWarmedForBuild() {
  try {
    return localStorage.getItem(WARMED_KEY) === BUILD_ID
  } catch {
    return false
  }
}

/**
 * Prefetch all media into the runtime cache so the PWA works offline.
 * @param {{ force?: boolean }} [opts] force re-runs even if already warmed.
 * @returns {Promise<typeof state>}
 */
export async function warmOfflineCache({ force = false } = {}) {
  if (state.status === 'running') return { ...state }
  if (!navigator.onLine) {
    state = { status: 'offline', done: 0, total: 0, error: null }
    emit()
    return { ...state }
  }
  if (!force && isWarmedForBuild()) {
    state = { status: 'ready', done: state.total, total: state.total, error: null }
    emit()
    return { ...state }
  }

  let list
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}asset-manifest.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`manifest HTTP ${res.status}`)
    list = await res.json()
    if (!Array.isArray(list)) throw new Error('manifest not an array')
  } catch (err) {
    state = { status: 'error', done: 0, total: 0, error: String(err && err.message || err) }
    emit()
    return { ...state }
  }

  state = { status: 'running', done: 0, total: list.length, error: null }
  emit()

  const queue = list.slice()
  let failed = 0
  const worker = async () => {
    while (queue.length) {
      const url = queue.pop()
      try {
        // Goes through the service worker → StaleWhileRevalidate caches it.
        const r = await fetch(url, { cache: 'no-store' })
        if (!r.ok) failed++
      } catch {
        failed++
      }
      state.done++
      emit()
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  if (failed === 0) {
    try {
      localStorage.setItem(WARMED_KEY, BUILD_ID)
    } catch {
      /* private mode / quota — warm-up still worked for this session */
    }
    state = { status: 'ready', done: state.total, total: state.total, error: null }
  } else {
    state = {
      status: 'partial',
      done: state.done,
      total: state.total,
      error: `${failed} asset(s) failed to cache`,
    }
  }
  emit()
  return { ...state }
}
