/**
 * Advanced Mode — Play Mode prompt.
 *
 * Shown after intro → Advanced Mode when an event is active on this kiosk AND
 * the player hasn't picked a play mode for this browser session. Two choices:
 *
 *   - Team Play: scores roll up to schools/teams. After choosing, the player
 *     is routed to the Roster setup screen to register the participating
 *     team(s) with the event.
 *   - Casual Play: no team tracking. Goes straight to game select; the
 *     team/school field is hidden on every game intro.
 *
 * The session's choice is stored in `sdshc-lb-play-mode` (sessionStorage).
 * `clearPlayMode()` re-prompts on the next Advanced Mode entry — admin uses
 * this when changing the active event or to force a re-prompt.
 */

import { navigate, navigateRaw } from '../router.js'
import { onTap } from '../utils/tap.js'
import { getActiveEventId, getEventById } from '../utils/leaderboard-api.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { createThemeToggle } from '../utils/theme-toggle.js'

const SS_KEY = 'sdshc-lb-play-mode'

/** @returns {'team' | 'casual' | null} */
export function getPlayMode() {
  return sessionStorage.getItem(SS_KEY)
}

export function setPlayMode(value) {
  if (value) sessionStorage.setItem(SS_KEY, value)
  else sessionStorage.removeItem(SS_KEY)
}

export function clearPlayMode() {
  sessionStorage.removeItem(SS_KEY)
}

/**
 * eventId to tag new scores with: only set when player chose Team Play
 * within an active event. Casual play returns null so scores still record
 * but stay out of the per-event leaderboard.
 */
export function getScoreEventId() {
  const eventId = getActiveEventId()
  if (!eventId) return null
  return getPlayMode() === 'team' ? eventId : null
}

export function createAdvancedPlayModeScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen adv-play-mode'

  screen.innerHTML = `
    <div class="adv-header">
      <div class="adv-header-left">
        <button class="adv-back-btn" id="adv-pm-back">${'←'} Back</button>
        <h1 class="adv-title">Advanced Mode</h1>
      </div>
      <div class="adv-header-right"></div>
    </div>

    <div class="adv-pm-card">
      <h2 class="adv-pm-heading">How do you want to play?</h2>
      <p class="adv-pm-sub" id="adv-pm-event-name">…</p>
      <div class="adv-pm-actions">
        <button class="adv-pm-btn adv-pm-btn-primary" id="adv-pm-team">
          <span class="adv-pm-btn-title">Team Play</span>
          <span class="adv-pm-btn-desc">Earn points for your school/team. Register your team next.</span>
        </button>
        <button class="adv-pm-btn" id="adv-pm-casual">
          <span class="adv-pm-btn-title">Casual Play</span>
          <span class="adv-pm-btn-desc">Just play for fun. Scores aren't tracked to a team.</span>
        </button>
      </div>
    </div>
  `

  addGradientBackground(screen, 'game-select')
  screen.querySelector('.adv-header-right').appendChild(createThemeToggle())

  ;(async () => {
    const eventId = getActiveEventId()
    const ev = eventId ? await getEventById(eventId) : null
    const sub = screen.querySelector('#adv-pm-event-name')
    if (ev && sub) sub.innerHTML = `Event: <strong>${escapeHtml(ev.name)}</strong>`
    else if (sub) sub.textContent = ''
  })()

  onTap(screen.querySelector('#adv-pm-back'), () => {
    navigateRaw('intro')
  })

  onTap(screen.querySelector('#adv-pm-team'), () => {
    setPlayMode('team')
    navigate('roster')
  })

  onTap(screen.querySelector('#adv-pm-casual'), () => {
    setPlayMode('casual')
    navigate('game-select')
  })

  return screen
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
