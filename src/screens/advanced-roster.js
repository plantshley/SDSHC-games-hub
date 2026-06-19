/**
 * Advanced Mode — Event Roster setup.
 *
 * Reached after picking Team Play. Lets the player(s) register the team(s)
 * that will play at this kiosk during the event. New names create teams as
 * `pending` and add them to the event roster as `pending` — admin approves
 * them from the admin panel. The autocomplete dropdown on game intros lists
 * APPROVED teams only (see team-input.js `ensureRosterDatalist`) so unmoderated
 * names don't get suggested — but a pending team is still immediately playable:
 * typing its name manually resolves to the existing pending team and tags
 * scores correctly. Those scores just don't appear on the public event
 * leaderboard until approval.
 *
 * Approved teams from prior events (in the global teams registry) show up in
 * the autocomplete suggestions so returning teams don't get duplicated.
 */

import { navigate, navigateRaw } from '../router.js'
import { onTap } from '../utils/tap.js'
import {
  getActiveEventId,
  getEventById,
  getOrCreateTeam,
  addTeamToEventRoster,
  removeTeamFromEventRoster,
  getEventRoster,
  listApprovedTeams,
} from '../utils/leaderboard-api.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { createThemeToggle } from '../utils/theme-toggle.js'
import { isClean } from '../utils/profanity.js'
import { createColorSwatchPicker, deriveTeamColors } from '../utils/team-colors.js'

const DATALIST_ID = 'adv-roster-datalist'

export function createAdvancedRosterScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen adv-roster'

  const eventId = getActiveEventId()

  screen.innerHTML = `
    <div class="adv-header">
      <div class="adv-header-left">
        <button class="adv-back-btn" id="adv-roster-back">${'←'} Back</button>
        <h1 class="adv-title">Team Roster</h1>
      </div>
      <div class="adv-header-right"></div>
    </div>

    <div class="adv-roster-card">
      <p class="adv-roster-sub" id="adv-roster-sub">…</p>

      <div class="adv-roster-add">
        <input class="adv-roster-input" id="adv-roster-input" list="${DATALIST_ID}" maxlength="40"
          placeholder="School / team name" spellcheck="false" />
        <button class="adv-roster-add-btn" id="adv-roster-add">+ Add team</button>
      </div>
      <div class="adv-roster-colors" id="adv-roster-colors"></div>
      <p class="adv-roster-error" id="adv-roster-error"></p>

      <ul class="adv-roster-list" id="adv-roster-list"></ul>

      <div class="adv-roster-actions">
        <button class="adv-roster-continue" id="adv-roster-continue">Start playing ${'→'}</button>
      </div>
      <p class="adv-roster-hint">
        New names go through admin approval before showing on the event leaderboard.
        You can keep adding teams later.
      </p>
    </div>
  `

  addGradientBackground(screen, 'game-select')
  screen.querySelector('.adv-header-right').appendChild(createThemeToggle())

  // Set up the shared datalist of previously-approved teams so returning teams
  // surface as autocomplete suggestions instead of getting created fresh.
  ensureDatalist()

  // The Back button returns to wherever the user came from. Coming from
  // "Manage roster" on game-select sets a sessionStorage hint; otherwise we
  // assume the player just chose Team Play and go back to the prompt.
  const returnTo = sessionStorage.getItem('sdshc-roster-return')
  sessionStorage.removeItem('sdshc-roster-return')
  onTap(screen.querySelector('#adv-roster-back'), () => {
    if (returnTo === 'game-select') {
      navigate('game-select')
    } else {
      navigateRaw('advanced/play-mode')
    }
  })

  const input = screen.querySelector('#adv-roster-input')
  const addBtn = screen.querySelector('#adv-roster-add')
  const errorEl = screen.querySelector('#adv-roster-error')
  const colorsHost = screen.querySelector('#adv-roster-colors')

  // Mount a fresh swatch picker, seeded with a random pair so each team a
  // player adds gets distinct colors unless they deliberately pick.
  let colorPicker = null
  function mountColorPicker() {
    colorsHost.innerHTML = ''
    colorPicker = createColorSwatchPicker(deriveTeamColors(genLocalSeed()))
    colorsHost.appendChild(colorPicker.el)
  }
  mountColorPicker()

  function showError(msg) {
    errorEl.textContent = msg || ''
  }

  let isAdding = false
  async function handleAdd() {
    const val = input.value.trim()
    if (!val) {
      showError('Enter a school or team name.')
      input.focus()
      return
    }
    if (!isClean(val)) {
      showError('That name isn\'t allowed — try another.')
      return
    }
    // Guard against concurrent adds — e.g. tapping "+ Add team" then "Start
    // playing →" in quick succession (both call handleAdd). Without this, two
    // in-flight calls can each create the team / push a roster entry before
    // either write lands, producing a duplicate.
    if (isAdding) return
    showError('')
    isAdding = true
    try {
      const result = await getOrCreateTeam(val, colorPicker.getValue())
      await addTeamToEventRoster(eventId, result.teamId)
      input.value = ''
      mountColorPicker()
      ensureDatalist()
      renderRoster()
      input.focus()
    } catch (err) {
      console.error('roster add failed', err)
      showError('Could not add team. Try again.')
    } finally {
      isAdding = false
    }
  }

  onTap(addBtn, (e) => {
    e.preventDefault()
    handleAdd()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  })

  onTap(screen.querySelector('#adv-roster-continue'), async () => {
    // If the player typed a team name but didn't tap "+ Add team", commit it now
    // so it isn't silently dropped. handleAdd clears the input on success and
    // leaves it (with an error shown) on failure — only navigate once it's clean.
    if (input.value.trim()) {
      await handleAdd()
      if (input.value.trim()) return // add failed (e.g. blocked name) — let them fix it
    }
    navigate('game-select')
  })

  async function renderRoster() {
    const list = screen.querySelector('#adv-roster-list')
    const roster = eventId ? await getEventRoster(eventId) : []
    if (roster.length === 0) {
      list.innerHTML = `<li class="adv-roster-empty">No teams added yet. Add at least one to start playing.</li>`
      return
    }
    list.innerHTML = roster.map(r => `
      <li class="adv-roster-row" data-id="${r.teamId}">
        <span class="adv-roster-color" style="background: linear-gradient(135deg, ${r.color1}, ${r.color2})"></span>
        <span class="adv-roster-name">${escapeHtml(r.teamName)}</span>
        <span class="adv-roster-status adv-roster-status-${r.rosterStatus}">${r.rosterStatus}</span>
        <button class="adv-roster-remove" data-id="${r.teamId}" title="Remove">${'✕'}</button>
      </li>
    `).join('')
    list.querySelectorAll('.adv-roster-remove').forEach(btn => {
      onTap(btn, async (e) => {
        e.preventDefault()
        const id = btn.dataset.id
        await removeTeamFromEventRoster(eventId, id)
        renderRoster()
      })
    })
  }

  // Header subtitle with event name
  ;(async () => {
    const ev = eventId ? await getEventById(eventId) : null
    const sub = screen.querySelector('#adv-roster-sub')
    if (ev && sub) sub.innerHTML = `Joining: <strong>${escapeHtml(ev.name)}</strong>`
    else if (sub) sub.textContent = ''
  })()

  renderRoster()

  return screen
}

async function ensureDatalist() {
  let dl = document.getElementById(DATALIST_ID)
  if (!dl) {
    dl = document.createElement('datalist')
    dl.id = DATALIST_ID
    document.body.appendChild(dl)
  }
  const teams = await listApprovedTeams()
  dl.innerHTML = teams.map(t => `<option value="${escapeAttr(t.name)}">`).join('')
}

function genLocalSeed() {
  return `${Date.now()}_${Math.random()}`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}
