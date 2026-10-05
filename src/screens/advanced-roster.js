/**
 * Advanced Mode — Event Roster setup.
 *
 * Reached after picking Team Play. Lets the player(s) register the team(s)
 * that will play at this kiosk during the event. New names create teams as
 * `pending` and add them to the event roster as `pending` — admin approves
 * them from the admin panel. The team dropdown on game intros lists APPROVED
 * roster teams only (see team-input.js) so unmoderated names don't get
 * suggested — but a pending team is still immediately playable:
 * typing its name manually resolves to the existing pending team and tags
 * scores correctly. Those scores just don't appear on the public event
 * leaderboard until approval.
 *
 * Approved teams from prior events (in the global teams registry) show up in
 * the team dropdown so returning teams don't get duplicated.
 *
 * Each team can carry a school (school-picker.js). Team identity is name +
 * school, so "Team 1" from two schools stays two teams.
 */

import { navigate, navigateRaw } from '../router.js'
import { onTap } from '../utils/tap.js'
import {
  getActiveEventId,
  setActiveEventId,
  getEventById,
  getOrCreateTeam,
  addTeamToEventRoster,
  removeTeamFromEventRoster,
  getEventRoster,
  listApprovedTeams,
  listApprovedSchools,
} from '../utils/leaderboard-api.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { createThemeToggle } from '../utils/theme-toggle.js'
import { isClean } from '../utils/profanity.js'
import { createColorSwatchPicker, deriveTeamColors } from '../utils/team-colors.js'
import { setPlayMode } from './advanced-play-mode.js'
import { attachCombobox } from '../utils/combobox.js'
import { createSchoolPicker } from '../utils/school-picker.js'
import { teamLabel } from '../utils/leaderboard-shared.js'

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
        <input class="adv-roster-input" id="adv-roster-input" maxlength="40"
          placeholder="Team or school name" spellcheck="false" autocomplete="off" aria-label="Team name" />
        <button class="adv-roster-add-btn" id="adv-roster-add">+ Add team</button>
      </div>
      <div class="adv-roster-school" id="adv-roster-school">
        <span class="adv-roster-field-label">School</span>
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

  // Approved teams (any event) for the team dropdown, so returning teams get
  // picked instead of created fresh. Labeled with their approved school only;
  // a team whose school isn't approved keeps that link (so picking it doesn't
  // create a duplicate) but never shows the unapproved name.
  let knownTeams = []
  async function loadKnownTeams() {
    try {
      const [teams, schools] = await Promise.all([listApprovedTeams(), listApprovedSchools()])
      const schoolMap = new Map(schools.map(sc => [sc.id, sc]))
      knownTeams = teams
        .map(t => ({ team: t, school: t.schoolId ? schoolMap.get(t.schoolId) || null : null, label: teamLabel(t, schoolMap) }))
        .sort((a, b) => a.label.localeCompare(b.label))
    } catch (err) {
      console.error('team list failed', err)
    }
  }
  loadKnownTeams()

  // The Back button returns to wherever the user came from. Coming from
  // "Manage roster" on game-select sets a sessionStorage hint; otherwise we
  // assume the player just chose Team Play and go back to the prompt.
  const returnTo = sessionStorage.getItem('sdshc-roster-return')
  sessionStorage.removeItem('sdshc-roster-return')
  onTap(screen.querySelector('#adv-roster-back'), () => {
    if (returnTo === 'game-select' || eventGone) {
      navigate('game-select')
    } else {
      navigateRaw('advanced/play-mode')
    }
  })

  const input = screen.querySelector('#adv-roster-input')
  const addBtn = screen.querySelector('#adv-roster-add')
  const errorEl = screen.querySelector('#adv-roster-error')
  const colorsHost = screen.querySelector('#adv-roster-colors')
  const schoolRow = screen.querySelector('#adv-roster-school')

  const schoolPicker = createSchoolPicker()
  schoolRow.appendChild(schoolPicker.el)

  const teamCombo = attachCombobox(input, {
    getOptions: () => knownTeams.map(k => ({
      value: k.team.id,
      label: k.team.name,
      sublabel: k.school ? k.school.name : '',
      known: k,
    })),
    emptyText: 'No saved teams yet. Type a new name.',
    onSelect: (option) => {
      input.value = option.label
      const { team, school } = option.known
      schoolPicker.setValue(
        school ? { id: school.id, name: school.name }
          : team.schoolId ? { id: team.schoolId, pending: true }
          : null
      )
      showError('')
    },
  })

  // Suggest a school from the team name as it's typed (debounced). The picker
  // ignores this once someone picks a school by hand.
  let suggestTimer = 0
  input.addEventListener('input', () => {
    clearTimeout(suggestTimer)
    suggestTimer = setTimeout(() => schoolPicker.suggestFrom(input.value), 150)
  })

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

  // The event can be deleted from another device while this screen is open
  // (or before it opened, if the pointer went stale mid-session). Drop the
  // stale pointer, switch this session to casual play, and say so instead of
  // failing every add with a generic error.
  let eventGone = false
  function handleEventGone() {
    if (eventGone) return
    eventGone = true
    // Only clear state that still points at this event. The load-time check is
    // async, and by the time it lands the device may have joined another one.
    if (getActiveEventId() === eventId) {
      setActiveEventId(null)
      setPlayMode('casual')
    }
    // Inline display, not [hidden]: these rows have display: flex in CSS.
    for (const node of [
      screen.querySelector('#adv-roster-sub'),
      screen.querySelector('.adv-roster-add'),
      schoolRow,
      colorsHost,
      screen.querySelector('#adv-roster-list'),
      screen.querySelector('.adv-roster-hint'),
    ]) node.style.display = 'none'
    screen.querySelector('#adv-roster-continue').textContent = 'Play casually →'
    showError("This event was removed, so teams can't be added. You're now in casual play.")
  }

  let isAdding = false
  async function handleAdd() {
    const val = input.value.trim()
    if (!val) {
      showError('Enter a team or school name.')
      input.focus()
      return
    }
    if (!isClean(val)) {
      showError('That name isn\'t allowed. Try another.')
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
      // Check the event still exists BEFORE creating the team, so a deleted
      // event doesn't leave behind an orphaned pending team.
      if (!(await getEventById(eventId))) {
        handleEventGone()
        return
      }
      clearTimeout(suggestTimer)
      // Finish any school pick still in progress (a new school being saved, or
      // a typed name the field hasn't committed) before reading it.
      await schoolPicker.commit()
      const { schoolId } = schoolPicker.getValue()
      const result = await getOrCreateTeam(val, colorPicker.getValue(), { schoolId })
      await addTeamToEventRoster(eventId, result.teamId)
      teamCombo.close()
      input.value = ''
      schoolPicker.reset()
      mountColorPicker()
      loadKnownTeams()
      renderRoster()
      input.focus()
    } catch (err) {
      // Deleted between the check above and the roster write.
      if (err && err.message === 'Event not found') {
        handleEventGone()
        return
      }
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
    if (e.key === 'Enter' && !eventGone) {
      e.preventDefault()
      handleAdd()
    }
  })

  onTap(screen.querySelector('#adv-roster-continue'), async () => {
    // If the player typed a team name but didn't tap "+ Add team", commit it now
    // so it isn't silently dropped. handleAdd clears the input on success and
    // leaves it (with an error shown) on failure — only navigate once it's clean.
    if (input.value.trim() && !eventGone) {
      await handleAdd()
      // Event was deleted mid-add: stay put so the player sees why.
      if (eventGone) return
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
        <span class="adv-roster-name">${escapeHtml(r.label)}</span>
        <span class="adv-roster-status adv-roster-status-${r.rosterStatus}">${r.rosterStatus}</span>
        <button class="adv-roster-remove" data-id="${r.teamId}" title="Remove">${'✕'}</button>
      </li>
    `).join('')
    list.querySelectorAll('.adv-roster-remove').forEach(btn => {
      onTap(btn, async (e) => {
        e.preventDefault()
        const id = btn.dataset.id
        try {
          await removeTeamFromEventRoster(eventId, id)
        } catch (err) {
          if (err && err.message === 'Event not found') {
            handleEventGone()
            return
          }
          console.error('roster remove failed', err)
          showError('Could not remove team. Try again.')
          return
        }
        renderRoster()
      })
    })
  }

  // Header subtitle with event name
  ;(async () => {
    const sub = screen.querySelector('#adv-roster-sub')
    let ev
    try {
      ev = eventId ? await getEventById(eventId) : null
    } catch {
      // Offline with a cold cache: can't read the event, but that doesn't mean
      // it's gone. Leave the screen usable, unnamed.
      if (sub) sub.textContent = ''
      return
    }
    if (ev && sub) sub.innerHTML = `Joining: <strong>${escapeHtml(ev.name)}</strong>`
    else if (eventId) handleEventGone()
    else if (sub) sub.textContent = ''
  })()

  renderRoster()

  return screen
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
