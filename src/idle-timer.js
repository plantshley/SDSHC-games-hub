/**
 * Idle timer: 120s of no interaction → reset to splash.
 * Shows warning overlay at 110s (10s before reset).
 */

const IDLE_TIMEOUT = 120_000
const WARNING_AT = 110_000

let timerId = null
let warningTimerId = null
let countdownInterval = null
let overlay = null
let onReset = null

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
  if (!overlay) return
  overlay.classList.add('visible')
  let seconds = Math.ceil((IDLE_TIMEOUT - WARNING_AT) / 1000)
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

  warningTimerId = setTimeout(() => {
    showWarning()
  }, WARNING_AT)

  timerId = setTimeout(() => {
    hideWarning()
    if (onReset) onReset()
  }, IDLE_TIMEOUT)
}

function onActivity() {
  if (overlay && overlay.classList.contains('visible')) {
    hideWarning()
  }
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
