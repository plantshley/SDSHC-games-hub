/**
 * Score-save status pill.
 *
 * Advanced games fire `recordScoresWithStatus(...)` on results. Per owner
 * preference (2026-06-19) the pill is ERROR-ONLY: a successful save (online) or
 * a safely-queued offline save shows NOTHING — only a genuine save failure
 * surfaces a small, non-blocking "Couldn't save score — tell an organizer" pill.
 *
 * It never rejects. Returns Promise<boolean> (true = saved or safely queued,
 * false = failed) for callers that care; callers may ignore it exactly like the
 * old fire-and-forget pattern.
 *
 * Offline note: with Firestore offline persistence an offline write is cached
 * immediately and replays on reconnect (idempotent via deterministic doc ids in
 * recordScores). `batch.commit()` doesn't resolve until reconnect, so offline we
 * fire the write and report success immediately rather than awaiting a promise
 * that won't settle until the network returns.
 */

import { recordScores } from './leaderboard-api.js'

// Only `error` is rendered today (success/offline are silent per owner
// preference); the other entries are retained as the CSS-class map in case
// success feedback is ever re-enabled.
const STATES = {
  saving: { text: 'Saving score…', cls: 'saving' },
  saved:  { text: 'Score saved ✓', cls: 'saved' },
  queued: { text: 'Saved offline — will sync when online', cls: 'queued' },
  error:  { text: "Couldn't save score — tell an organizer", cls: 'error' },
}

function getPill() {
  let pill = document.querySelector('.score-save-pill')
  if (!pill) {
    pill = document.createElement('div')
    pill.className = 'score-save-pill'
    pill.setAttribute('role', 'status')
    pill.setAttribute('aria-live', 'polite')
    document.body.appendChild(pill)
  }
  // The advanced light/dark theme lives on #app; the pill is a direct child of
  // <body> so it can't inherit it. Mirror it onto the pill (same pattern as
  // help-overlay.js / leaderboard-modal.js).
  const app = document.getElementById('app')
  if (app && app.dataset.theme === 'light') pill.dataset.theme = 'light'
  else delete pill.dataset.theme
  return pill
}

function setState(pill, key) {
  const s = STATES[key]
  pill.textContent = s.text
  pill.className = `score-save-pill show ${s.cls}`
}

function scheduleDismiss(pill, delay) {
  clearTimeout(pill._dismissTimer)
  pill._dismissTimer = setTimeout(() => {
    pill.classList.remove('show')
    // Remove after the fade-out transition so a later save re-creates it clean.
    setTimeout(() => { if (!pill.classList.contains('show')) pill.remove() }, 450)
  }, delay)
}

const isOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false

/**
 * @param {{ gameId: string, runId: string, entries: Array, eventId: string|null }} payload
 * @returns {Promise<boolean>}
 */
export function recordScoresWithStatus(payload) {
  // Success + offline-queued saves are SILENT (owner preference); only a real
  // failure surfaces a pill. Offline writes still queue and replay on reconnect.
  if (isOffline()) {
    recordScores(payload).catch(err => console.error('recordScores failed', err))
    return Promise.resolve(true)
  }

  return recordScores(payload)
    .then(() => true)
    .catch(err => {
      console.error('recordScores failed', err)
      const pill = getPill()
      setState(pill, 'error')
      scheduleDismiss(pill, 6000)
      return false
    })
}
