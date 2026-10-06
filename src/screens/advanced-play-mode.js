/**
 * Advanced Mode — Play Mode prompt.
 *
 * Shown after intro → Advanced Mode whenever the player hasn't picked a play
 * mode for this browser session. Two choices:
 *
 *   - Team Play (an event is running): scores roll up to schools/teams. After
 *     choosing, the player is routed to the Roster setup screen to register
 *     the participating team(s) with the event.
 *   - Play for your school (no event running): mode 'school'. The roster
 *     screen asks for one approved school, and every score this session
 *     counts toward that school's All-Time total (no teams involved).
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
import { eventLabel } from '../utils/leaderboard-shared.js'

const SS_KEY = 'sdshc-lb-play-mode'
// The event a Team Play session joined ('' = no event). main.js compares it to
// the device's event on each return to game select, so a session whose event
// ended re-prompts instead of scoring into nothing.
const SS_EVENT_KEY = 'sdshc-lb-play-event'
// The school a 'school' session plays for: { id, name }.
const SS_SCHOOL_KEY = 'sdshc-lb-session-school'

/** @returns {'team' | 'school' | 'casual' | null} */
export function getPlayMode() {
  return sessionStorage.getItem(SS_KEY)
}

export function setPlayMode(value) {
  if (value) sessionStorage.setItem(SS_KEY, value)
  else sessionStorage.removeItem(SS_KEY)
}

export function clearPlayMode() {
  sessionStorage.removeItem(SS_KEY)
  sessionStorage.removeItem(SS_EVENT_KEY)
  sessionStorage.removeItem(SS_SCHOOL_KEY)
}

/** @returns {string|null} event id a Team Play session joined, null if unknown */
export function getPlayEventId() {
  return sessionStorage.getItem(SS_EVENT_KEY)
}

/** @returns {{ id: string, name: string }|null} the school a 'school' session plays for */
export function getSessionSchool() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SS_SCHOOL_KEY) || 'null')
    return s && s.id ? s : null
  } catch {
    return null
  }
}

export function setSessionSchool(school) {
  if (school && school.id) {
    sessionStorage.setItem(SS_SCHOOL_KEY, JSON.stringify({ id: school.id, name: school.name }))
  } else {
    sessionStorage.removeItem(SS_SCHOOL_KEY)
  }
}

// Event an admin pinned this kiosk to with "Set kiosk to" (per device, like
// the active-event pointer). main.js honors it while that event is open.
const LS_PINNED_KEY = 'sdshc-lb-pinned-event'

export function getPinnedEventId() {
  try {
    return localStorage.getItem(LS_PINNED_KEY) || null
  } catch {
    return null
  }
}

export function setPinnedEventId(eventId) {
  try {
    if (eventId) localStorage.setItem(LS_PINNED_KEY, eventId)
    else localStorage.removeItem(LS_PINNED_KEY)
  } catch {
    // Storage blocked: the kiosk just stays on auto.
  }
}

/** School id to put on this session's scores, only in 'school' mode. */
export function getScoreSchoolId() {
  if (getPlayMode() !== 'school') return null
  return getSessionSchool()?.id || null
}

/**
 * eventId to tag new scores with: only set when player chose Team Play
 * within an active event. Casual and school play return null so scores still
 * record but stay out of the per-event leaderboard.
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

  // True until we know this device's event: with no pointer, Team Play waits
  // for the open-events read (none running → school play; several → a pick).
  let needsPick = !getActiveEventId()
  // No event running: the first button becomes "play for your school".
  let schoolMode = false

  const teamTitle = teamBtn.querySelector('.adv-pm-btn-title')
  const teamDesc = teamBtn.querySelector('.adv-pm-btn-desc')
  const TEAM_TEXT = [teamTitle.textContent, teamDesc.textContent]

  /** Relabel the first button for the no-event case (or back for an event). */
  function showSchoolMode(on = true) {
    schoolMode = on
    teamTitle.textContent = on ? 'Earn Points for Your School' : TEAM_TEXT[0]
    teamDesc.textContent = on ? 'Pick your school next. Scores count on the All-Time leaderboard.' : TEAM_TEXT[1]
  }
  // With no pointer, no event is the usual case, so label for it up front
  // instead of flashing "Team Play" while the events load.
  if (needsPick) showSchoolMode()

  /** With several events running, Team Play waits for a pick; Casual never does. */
  function setTeamEnabled(enabled) {
    teamBtn.disabled = !enabled
    teamBtn.classList.toggle('adv-pm-btn-disabled', !enabled)
  }
  if (needsPick) setTeamEnabled(false)

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
      sub.innerHTML = `Event: <strong>${escapeHtml(eventLabel(ev))}</strong>`
      return
    }
    if (eventId) {
      // Pointer but no readable event — keep Team Play usable, unnamed.
      sub.textContent = 'Event in progress'
      return
    }

    // No pointer: either several events are running (ask instead of guessing
    // which one this device belongs to) or none is (Team Play counts toward
    // All-Time only).
    // Capped like the event read above; a slow read falls back to no-event play.
    let open = []
    try {
      open = (await Promise.race([
        listOpenEvents(),
        new Promise(resolve => setTimeout(() => resolve([]), 3000)),
      ])) || []
    } catch {
      open = []
    }
    if (open.length === 0) {
      sub.textContent = 'No event running. You can play casually, or select your school to earn points on the All-Time leaderboard. Only previously approved schools are available to represent.'
      showSchoolMode()
      needsPick = false
      setTeamEnabled(true)
      return
    }
    sub.textContent = 'Which event are you at?'
    showSchoolMode(false)
    setTeamEnabled(false)
    picker.hidden = false
    picker.innerHTML = open
      .map(e => `<button class="adv-pm-event-option" data-id="${e.id}">${escapeHtml(eventLabel(e))}</button>`)
      .join('')
    picker.querySelectorAll('.adv-pm-event-option').forEach(btn => {
      onTap(btn, () => {
        setActiveEventId(btn.dataset.id)
        picker.querySelectorAll('.adv-pm-event-option').forEach(b =>
          b.classList.toggle('adv-pm-event-option-active', b === btn)
        )
        needsPick = false
        setTeamEnabled(true)
      })
    })
  })()

  onTap(screen.querySelector('#adv-pm-back'), () => {
    navigateRaw('intro')
  })

  onTap(teamBtn, () => {
    // Guard: with the picker up and nothing chosen, the player hasn't said
    // which event they're at yet.
    if (needsPick) return
    if (schoolMode) {
      setPlayMode('school')
    } else {
      setPlayMode('team')
      sessionStorage.setItem(SS_EVENT_KEY, getActiveEventId() || '')
    }
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
