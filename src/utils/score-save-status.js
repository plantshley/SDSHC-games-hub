/**
 * Score-save status pill.
 *
 * Advanced games previously fired `recordScores(...).catch(console.error)` — so
 * a failed (or merely pending) save was invisible to players, who'd walk away
 * believing their team scored. This wraps `recordScores` and surfaces a small,
 * non-blocking pill: saving → saved / saved-offline / couldn't-save.
 *
 * It never rejects. Returns Promise<boolean> (true = saved or safely queued,
 * false = failed) for callers that care; callers may ignore it exactly like the
 * old fire-and-forget pattern.
 *
 * Offline note: with Firestore offline persistence the write is cached
 * immediately but `batch.commit()` does NOT resolve until reconnect. So when
 * the browser reports offline we show "saved offline" right away instead of
 * waiting on a promise that won't settle until the network returns.
 */

import { recordScores } from './leaderboard-api.js'

const STATES = {
  saving: { text: 'Saving score…', cls: 'saving' },
  saved:  { text: 'Score saved ✓', cls: 'saved' },
  queued: { text: 'Saved offline — will sync when online', cls: 'queued' },
  error:  { text: "Couldn't save score — tell an organizer", cls: 'error' },
}

const SLOW_MS = 6000 // online but unsettled this long → treat as queued

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
  const pill = getPill()

  if (isOffline()) {
    setState(pill, 'queued')
    scheduleDismiss(pill, 4500)
    // Still issue the write so Firestore queues it for replay on reconnect.
    recordScores(payload).catch(err => console.error('recordScores failed', err))
    return Promise.resolve(true)
  }

  setState(pill, 'saving')

  let settled = false
  const slowTimer = setTimeout(() => {
    if (!settled) {
      // Commit is dragging (flaky network); reassure rather than spin forever.
      setState(pill, 'queued')
      scheduleDismiss(pill, 4500)
    }
  }, SLOW_MS)

  return recordScores(payload)
    .then(() => {
      settled = true
      clearTimeout(slowTimer)
      setState(pill, 'saved')
      scheduleDismiss(pill, 3500)
      return true
    })
    .catch(err => {
      settled = true
      clearTimeout(slowTimer)
      console.error('recordScores failed', err)
      setState(pill, 'error')
      scheduleDismiss(pill, 6000)
      return false
    })
}
