/**
 * Shared player + team input rows for advanced game intros.
 *
 * Behavior depends on the current Play Mode (sessionStorage):
 *   - "team":  each player gets a Team/School dropdown sourced from the
 *              active event's roster. Free-typing a new name adds it to the
 *              roster as pending (and creates the team if needed).
 *   - "casual" or unset: NO team line is rendered — just the player-name
 *              input. Scores still record (with teamId=null) but won't roll
 *              up to any team's leaderboard row.
 *
 * Player objects keep their existing shape (`name`, `color`, etc.) plus two
 * extra fields populated when in team mode: `teamId` (string|null) and
 * `teamName` (string).
 */

import {
  getActiveEventId,
  getEventRoster,
  getOrCreateTeam,
  addTeamToEventRoster,
} from './leaderboard-api.js'
import { isClean } from './profanity.js'
import { getPlayMode } from '../screens/advanced-play-mode.js'

const DATALIST_ID = 'adv-team-datalist'

/**
 * Refresh the shared <datalist> with this event's APPROVED roster names only.
 * Pending teams are intentionally excluded — players shouldn't see unmoderated
 * names autocomplete-suggested. They can still type their team manually if
 * theirs is still awaiting approval.
 * Mounts the datalist on document.body the first time.
 */
async function ensureRosterDatalist(rosterTeams) {
  let dl = document.getElementById(DATALIST_ID)
  if (!dl) {
    dl = document.createElement('datalist')
    dl.id = DATALIST_ID
    document.body.appendChild(dl)
  }
  const approved = rosterTeams.filter(t => t.rosterStatus === 'approved')
  dl.innerHTML = approved.map(t => `<option value="${escapeAttr(t.teamName)}">`).join('')
}

/**
 * Render player rows into the given container. Behaviour is mode-aware.
 *
 * Players array is mutated directly via input handlers. Caller can read
 * back `player.name`, `player.teamId`, `player.teamName` after start.
 */
export function renderTeamPlayerRows(container, players, options = {}) {
  const { maxNameLen = 16, namePlaceholderPrefix = 'Player' } = options
  const mode = getPlayMode()
  const eventId = getActiveEventId()

  if (mode === 'team' && eventId) {
    renderTeamModeRows(container, players, eventId, { maxNameLen, namePlaceholderPrefix })
  } else {
    renderCasualRows(container, players, { maxNameLen, namePlaceholderPrefix })
  }
}

/* ─── Casual mode ─── */

function renderCasualRows(container, players, { maxNameLen, namePlaceholderPrefix }) {
  // Ensure no team data is associated with players in casual mode.
  players.forEach(p => { p.teamId = null; p.teamName = '' })

  container.innerHTML = players.map((p, i) => `
    <div class="adv-sw-name-row" data-idx="${i}">
      <span class="adv-sw-name-dot" style="background: ${p.color}"></span>
      <input
        class="adv-sw-name-input adv-team-name-input"
        data-idx="${i}"
        value="${escapeAttr(p.name)}"
        maxlength="${maxNameLen}"
        spellcheck="false"
        placeholder="${namePlaceholderPrefix} ${i + 1}"
      />
    </div>
  `).join('')

  container.querySelectorAll('.adv-team-name-input').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.idx)
      players[idx].name = input.value || `${namePlaceholderPrefix} ${idx + 1}`
    })
  })
}

/* ─── Team mode ─── */

async function renderTeamModeRows(container, players, eventId, { maxNameLen, namePlaceholderPrefix }) {
  // Show a loading placeholder while we fetch the roster.
  container.innerHTML = `<div class="adv-team-loading">Loading roster…</div>`
  const roster = await getEventRoster(eventId)
  ensureRosterDatalist(roster)

  container.innerHTML = players.map((p, i) => `
    <div class="adv-team-row" data-idx="${i}">
      <div class="adv-team-line-name">
        <span class="adv-sw-name-dot" style="background: ${p.color}"></span>
        <input
          class="adv-sw-name-input adv-team-name-input"
          data-idx="${i}"
          value="${escapeAttr(p.name)}"
          maxlength="${maxNameLen}"
          spellcheck="false"
          autocomplete="off"
          placeholder="${namePlaceholderPrefix} ${i + 1}"
        />
      </div>
      <div class="adv-team-line-team">
        <span class="adv-team-label">Team</span>
        <input
          class="adv-team-input"
          data-idx="${i}"
          list="${DATALIST_ID}"
          value="${escapeAttr(p.teamName || '')}"
          maxlength="40"
          spellcheck="false"
          autocomplete="off"
          placeholder="Select or type your school"
        />
      </div>
      <span class="adv-team-feedback" data-idx="${i}"></span>
    </div>
  `).join('')

  // Name input handlers
  container.querySelectorAll('.adv-team-name-input').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.idx)
      players[idx].name = input.value || `${namePlaceholderPrefix} ${idx + 1}`
    })
  })

  // Team input handlers — debounced resolve on input + immediate on blur/Enter
  container.querySelectorAll('.adv-team-input').forEach(input => {
    const idx = parseInt(input.dataset.idx)
    const fb = container.querySelector(`.adv-team-feedback[data-idx="${idx}"]`)

    const resolveTeam = async () => {
      const val = input.value.trim()
      if (!val) {
        players[idx].teamId = null
        players[idx].teamName = ''
        fb.className = 'adv-team-feedback'
        fb.textContent = ''
        return
      }
      if (!isClean(val)) {
        players[idx].teamId = null
        players[idx].teamName = ''
        fb.className = 'adv-team-feedback adv-team-feedback-error'
        fb.textContent = 'Pick a different name'
        return
      }
      try {
        const result = await getOrCreateTeam(val)
        // Whether the team was pre-existing or just created, add it to the
        // event roster (idempotent) so future player setups can pick it.
        await addTeamToEventRoster(eventId, result.teamId)
        const updatedRoster = await getEventRoster(eventId)
        ensureRosterDatalist(updatedRoster)
        const rEntry = updatedRoster.find(r => r.teamId === result.teamId)
        players[idx].teamId = result.teamId
        players[idx].teamName = result.name
        if (rEntry && rEntry.rosterStatus === 'approved') {
          fb.className = 'adv-team-feedback adv-team-feedback-approved'
          fb.textContent = '✓ on roster'
        } else {
          fb.className = 'adv-team-feedback adv-team-feedback-pending'
          fb.textContent = '↻ awaiting approval'
        }
      } catch (err) {
        console.error('team lookup failed', err)
      }
    }

    // Resolve/create only on commit — tapping out (blur), Enter, or picking a
    // datalist option (change). Resolving on every keystroke would spawn a
    // pending team for each partial name ("P", "Pi", "Pie", …), flooding the
    // admin queue. While typing we just clear stale feedback; the team isn't
    // registered (and "awaiting approval" doesn't show) until the field commits.
    input.addEventListener('input', () => {
      fb.className = 'adv-team-feedback'
      fb.textContent = ''
    })
    input.addEventListener('change', resolveTeam)
    input.addEventListener('blur', resolveTeam)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        input.blur()
      }
    })

    // Pre-fill feedback if the player already had a team selected.
    if (players[idx].teamId) {
      const rEntry = roster.find(r => r.teamId === players[idx].teamId)
      if (rEntry && rEntry.rosterStatus === 'approved') {
        fb.className = 'adv-team-feedback adv-team-feedback-approved'
        fb.textContent = '✓ on roster'
      } else if (rEntry) {
        fb.className = 'adv-team-feedback adv-team-feedback-pending'
        fb.textContent = '↻ awaiting approval'
      }
    }
  })
}

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
