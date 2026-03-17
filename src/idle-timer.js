/**
 * Idle timer: configurable timeout with no-interaction reset.
 * Shows warning overlay 10s before reset.
 * Kid Mode: 120s timeout. Advanced Mode: 300s timeout.
 */

let idleTimeout = 120_000
let warningBuffer = 10_000

let timerId = null
let warningTimerId = null
let countdownInterval = null
let overlay = null
let onReset = null
let enabled = true

function createOverlay() {
  overlay = document.createElement('div')
  overlay.className = 'idle-overlay'
  overlay.innerHTML = `
    <div class="idle-overlay-text">Touch to continue!</div>
    <div class="idle-overlay-countdown"></div>
  `
  document.body.appendChild(overlay)

  overlay.addEventListener('pointerdown', () => {
    hideWarning()
    resetTimer()
  })
}

function showWarning() {
  if (!overlay || !enabled) return
  overlay.classList.add('visible')
  let seconds = Math.ceil(warningBuffer / 1000)
  const countdownEl = overlay.querySelector('.idle-overlay-countdown')
  countdownEl.textContent = `Resetting in ${seconds}s...`

  countdownInterval = setInterval(() => {
    seconds--
    if (seconds <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
      return
    }
    countdownEl.textContent = `Resetting in ${seconds}s...`
  }, 1000)
}

function hideWarning() {
  if (!overlay) return
  overlay.classList.remove('visible')
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

function resetTimer() {
  clearTimeout(timerId)
  clearTimeout(warningTimerId)
  hideWarning()

  if (!enabled) return

  const warningAt = idleTimeout - warningBuffer

  warningTimerId = setTimeout(() => {
    showWarning()
  }, warningAt)

  timerId = setTimeout(() => {
    hideWarning()
    if (onReset) onReset()
  }, idleTimeout)
}

function onActivity() {
  if (!enabled) return
  if (overlay && overlay.classList.contains('visible')) {
    hideWarning()
  }
  resetTimer()
}

/**
 * Set the idle timeout duration in milliseconds.
 * Call this when switching between modes.
 */
export function setIdleTimeout(ms) {
  idleTimeout = ms
  warningBuffer = Math.min(10_000, ms / 2)
  if (enabled) resetTimer()
}

/**
 * Disable the idle timer (clears all timers, hides overlay).
 */
export function disableIdleTimer() {
  enabled = false
  clearTimeout(timerId)
  clearTimeout(warningTimerId)
  hideWarning()
}

/**
 * Enable the idle timer and start tracking.
 */
export function enableIdleTimer() {
  enabled = true
  resetTimer()
}

export function initIdleTimer(resetCallback) {
  onReset = resetCallback
  createOverlay()

  const events = ['pointerdown', 'pointermove', 'keydown']
  for (const evt of events) {
    document.addEventListener(evt, onActivity, { passive: true })
  }

  resetTimer()
}

export function clearProgress() {
  localStorage.removeItem('sdshc-progress')
}
