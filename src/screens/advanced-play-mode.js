/**
 * Advanced Mode — Play Mode prompt.
 *
 * Shown after intro → Advanced Mode when an event is running AND the player
 * hasn't picked a play mode for this browser session. Two choices:
 *
 *   - Team Play: scores roll up to schools/teams. After choosing, the player
 *     is routed to the Roster setup screen to register the participating
 *     team(s) with the event.
 *   - Casual Play: no team tracking. Goes straight to game select; the
 *     team/school field is hidden on every game intro.
 *
 * Casual Play deliberately does NOT clear the active event. The pointer means
 * "which event this device would join", not "this session is tagged" — and
 * `getScoreEventId()` below already returns null unless the mode is 'team'.
 *
 * If several events are running at once, main.js hands off here without having
 * picked one, and this screen shows an event picker rather than guessing.
 *
 * The session's choice is stored in `sdshc-lb-play-mode` (sessionStorage).
 * `clearPlayMode()` re-prompts on the next Advanced Mode entry — admin uses
 * this when changing the active event or to force a re-prompt.
 */

import { navigate, navigateRaw } from '../router.js'
import { onTap } from '../utils/tap.js'
import { getActiveEventId, setActiveEventId, getEventById, listOpenEvents } from '../utils/leaderboard-api.js'
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
      <div class="adv-pm-event-picker" id="adv-pm-picker" hidden></div>
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

  const sub = screen.querySelector('#adv-pm-event-name')
  const picker = screen.querySelector('#adv-pm-picker')
  const teamBtn = screen.querySelector('#adv-pm-team')

  /** Team Play needs an event to join; Casual never does. */
  function setTeamEnabled(enabled) {
    teamBtn.disabled = !enabled
    teamBtn.classList.toggle('adv-pm-btn-disabled', !enabled)
  }

  ;(async () => {
    const eventId = getActiveEventId()

    // Offline with a cold cache, getEventById REJECTS for a doc id the cache
    // has never seen. That must not blank the screen: this device still holds a
    // valid pointer, so Team Play has to stay available even when we can't read
    // the event's name.
    //
    // On a flaky network the read can also simply hang rather than reject, which
    // would leave the subtitle on its "…" placeholder forever. Cap the wait and
    // fall back to an unnamed label; the buttons work either way.
    let ev = null
    if (eventId) {
      try {
        ev = await Promise.race([
          getEventById(eventId),
          new Promise(resolve => setTimeout(() => resolve(null), 3000)),
        ])
      } catch {
        ev = null
      }
    }

    if (ev) {
      sub.innerHTML = `Event: <strong>${escapeHtml(ev.name)}</strong>`
      return
    }
    if (eventId) {
      // Pointer but no readable event — keep Team Play usable, unnamed.
      sub.textContent = 'Event in progress'
      return
    }

    // No pointer — main.js sent us here because several events are running.
    // Ask instead of guessing which one this device belongs to.
    let open = []
    try {
      open = await listOpenEvents()
    } catch {
      open = []
    }
    if (open.length === 0) {
      sub.textContent = ''
      return
    }
    sub.textContent = 'Which event are you at?'
    setTeamEnabled(false)
    picker.hidden = false
    picker.innerHTML = open
      .map(e => `<button class="adv-pm-event-option" data-id="${e.id}">${escapeHtml(e.name)}</button>`)
      .join('')
    picker.querySelectorAll('.adv-pm-event-option').forEach(btn => {
      onTap(btn, () => {
        setActiveEventId(btn.dataset.id)
        picker.querySelectorAll('.adv-pm-event-option').forEach(b =>
          b.classList.toggle('adv-pm-event-option-active', b === btn)
        )
        setTeamEnabled(true)
      })
    })
  })()

  onTap(screen.querySelector('#adv-pm-back'), () => {
    navigateRaw('intro')
  })

  onTap(teamBtn, () => {
    // Guard: with the picker up and nothing chosen, roster has no event to
    // write to and would bounce straight back to game-select.
    if (!getActiveEventId()) return
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
