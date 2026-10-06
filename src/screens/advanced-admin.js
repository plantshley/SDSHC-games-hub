/**
 * Advanced Mode — Admin Panel (Phase 1A: no auth yet).
 *
 * Route: #advanced/admin
 *
 * Sections:
 *   - Active event for this kiosk
 *   - Pending team names
 *   - All teams (with each team's school)
 *   - Schools (add, approve, rename, merge, colors, delete)
 *   - Events (optionally split into sessions, which share a Day leaderboard)
 *   - Recent scores
 *
 * Phase 1B will add a password sign-in at the top of this screen.
 */

import { navigate } from '../router.js'
import { onTap } from '../utils/tap.js'
import {
  listOpenEvents,
  listEvents,
  startEvent,
  endEvent,
  deleteEvent,
  openScheduledEvent,
  reopenEvent,
  getActiveEventId,
  setActiveEventId,
  getEventById,
  listPendingTeams,
  listAllTeams,
  approveTeam,
  renameTeam,
  deleteTeam,
  listRecentScores,
  deleteScore,
  getEventRoster,
  getOrCreateTeam,
  addTeamToEventRoster,
  removeTeamFromEventRoster,
  approveTeamForEvent,
  setTeamColors,
  setEventEndsAt,
  setEventStart,
  setTeamSchool,
  listAllSchools,
  createApprovedSchool,
  approveSchool,
  setSchoolColors,
  renameSchool,
  mergeSchools,
  deleteSchool,
} from '../utils/leaderboard-api.js'
import { derivedEventStatus, eventEndsAt } from '../utils/event-status.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { createThemeToggle, getTheme } from '../utils/theme-toggle.js'
import { clearPlayMode, setPinnedEventId } from './advanced-play-mode.js'
import { getTeamColors, openColorPopover, createColorSwatchPicker, deriveTeamColors } from '../utils/team-colors.js'
import { isClean } from '../utils/profanity.js'
import { USE_FIRESTORE } from '../firebase/config.js'
import { adminSignIn, adminSignOut, onAdminAuthChange } from '../firebase/auth.js'
import { warmOfflineCache, onWarmupProgress } from '../utils/offline-warmup.js'
import { attachCombobox } from '../utils/combobox.js'
import { createSchoolPicker } from '../utils/school-picker.js'
import { teamLabel, eventLabel, selectableTeams } from '../utils/leaderboard-shared.js'

export function createAdvancedAdminScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen adv-admin'

  // Staff reference docs live in public/guides/ so they deploy with the app and
  // resolve offline. BASE_URL carries the GitHub Pages sub-path in prod ('/' in
  // some setups), so the links work in dev and on the deployed kiosk alike.
  const guidesBase = `${import.meta.env.BASE_URL}guides/`
  // The cheat sheet defaults to dark on its own; pass the site's current theme
  // so opening it from here mirrors whatever mode the admin is viewing in.
  const cheatSheetTheme = `?theme=${getTheme()}`

  screen.innerHTML = `
    <div class="adv-header">
      <div class="adv-header-left">
        <button class="adv-back-btn" id="adv-admin-back">${'←'} Back</button>
        <h1 class="adv-title">Admin</h1>
      </div>
      <nav class="adv-admin-doclinks" aria-label="Staff reference documents">
        <a class="adv-admin-doclink" href="${guidesBase}full-event-guide.docx" target="_blank" rel="noopener" title="Full event staff guide (Word document)">Full Guide (DOC)</a>
        <a class="adv-admin-doclink" href="${guidesBase}cheat-sheet.html${cheatSheetTheme}" target="_blank" rel="noopener" title="Event cheat sheet (opens in browser)">Cheat Sheet (WEB)</a>
        <a class="adv-admin-doclink" href="${guidesBase}cheat-sheet-print.pdf" target="_blank" rel="noopener" title="Printable cheat sheet (PDF)">Cheat Sheet (PRINT)</a>
      </nav>
      <div class="adv-header-right"></div>
    </div>

    <div class="adv-admin-body">
      <section class="adv-admin-section" data-section="active-event">
        <h2 class="adv-admin-section-title">Active event on this kiosk</h2>
        <div class="adv-admin-section-content" id="sec-active-event">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="roster">
        <h2 class="adv-admin-section-title">Active event roster <span class="adv-admin-badge" id="roster-count"></span></h2>
        <div class="adv-admin-section-content" id="sec-roster">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="pending">
        <h2 class="adv-admin-section-title">Pending team names (statewide) <span class="adv-admin-badge" id="pending-count"></span></h2>
        <div class="adv-admin-section-content" id="sec-pending">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="teams">
        <h2 class="adv-admin-section-title">All teams</h2>
        <div class="adv-admin-section-content" id="sec-teams">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="schools">
        <h2 class="adv-admin-section-title">Schools <span class="adv-admin-badge" id="schools-pending-count"></span></h2>
        <div class="adv-admin-section-content" id="sec-schools">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="events">
        <h2 class="adv-admin-section-title">Events</h2>
        <div class="adv-admin-section-content" id="sec-events">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="scores">
        <h2 class="adv-admin-section-title">Recent scores (last 50)</h2>
        <div class="adv-admin-section-content" id="sec-scores">Loading…</div>
      </section>

      <section class="adv-admin-section" data-section="offline">
        <h2 class="adv-admin-section-title">Offline readiness</h2>
        <div class="adv-admin-section-content" id="sec-offline">Loading…</div>
      </section>
    </div>
  `

  addGradientBackground(screen, 'game-select')
  screen.querySelector('.adv-header-right').appendChild(createThemeToggle())

  onTap(screen.querySelector('#adv-admin-back'), () => {
    navigate('game-select')
  })

  // ─── Section renderers ───

  // Event creator state, kept outside renderActiveEvent so a half-filled form
  // survives the section re-rendering after an action elsewhere on the page.
  // `sessions` is null for a single event, else one entry per session row.
  const creator = { name: '', sessions: null }
  // Set while events are being written, so a double tap can't create twice.
  let creatingEvent = false
  const blankSession = () => ({ session: '', start: '', end: '' })

  async function renderActiveEvent() {
    const el = screen.querySelector('#sec-active-event')
    const [open, currentId] = await Promise.all([listOpenEvents(), getActiveEventId()])
    const current = currentId ? await getEventById(currentId) : null

    el.innerHTML = `
      <div class="adv-admin-active-row">
        <label class="adv-admin-label" for="active-event-select">Set device to</label>
        <select class="adv-admin-select" id="active-event-select">
          <option value="">${'—'} None (auto)</option>
          ${open.map(e => `<option value="${e.id}" ${e.id === currentId ? 'selected' : ''}>${escapeHtml(eventLabel(e))}</option>`).join('')}
        </select>
        <span class="adv-admin-active-inline">
          ${current
            ? `Currently active: <strong>${escapeHtml(eventLabel(current))}</strong>`
            : open.length === 1
              ? `Will join <strong>${escapeHtml(eventLabel(open[0]))}</strong> automatically.`
              : open.length > 1
                ? `${open.length} events running ${'·'} players pick one when they start.`
                : `No event running ${'·'} players can play for an approved school on All-Time.`}
        </span>
      </div>
      <p class="adv-admin-hint">
        A device joins the running event by itself, but you can
        override it here when more than one event is running at once.
      </p>
      ${creator.sessions ? sessionCreatorHtml() : singleCreatorHtml()}
    `

    el.querySelector('#active-event-select').addEventListener('change', async (e) => {
      const v = e.target.value
      setActiveEventId(v || null)
      // A pick holds even when several events run; None goes back to auto.
      setPinnedEventId(v || null)
      clearPlayMode()
      await renderActiveEvent()
      await renderRoster()
    })

    if (creator.sessions) bindSessionCreator(el)
    else bindSingleCreator(el)
  }

  function singleCreatorHtml() {
    return `
      <div class="adv-admin-event-creator-row">
        <div class="adv-admin-event-name-col">
          <input class="adv-admin-input" id="new-event-name" placeholder="Event name (e.g. FFA Day Spring)"
            maxlength="60" value="${escapeHtml(creator.name)}" />
          <button type="button" class="adv-admin-split-link" data-act="split">+ Split into sessions</button>
        </div>
        <label class="adv-admin-radio">
          <input type="radio" name="when" value="now" checked />
          <span>Start now</span>
        </label>
        <label class="adv-admin-radio">
          <input type="radio" name="when" value="scheduled" />
          <span>Schedule for</span>
        </label>
        <input class="adv-admin-input adv-admin-datetime" type="datetime-local" id="new-event-when" />
        <button class="adv-admin-btn-create" id="start-event-btn">Create event</button>
      </div>
      <p class="adv-admin-create-error" role="alert"></p>
    `
  }

  function sessionCreatorHtml() {
    const rows = creator.sessions.map((s, i) => `
      <div class="adv-admin-session-row" data-i="${i}">
        <input class="adv-admin-input adv-admin-session-event" data-f="name" placeholder="Event name"
          maxlength="60" value="${escapeHtml(creator.name)}" aria-label="Event name" />
        <input class="adv-admin-input adv-admin-session-name" data-f="session" placeholder="Session (e.g. Morning)"
          maxlength="40" value="${escapeHtml(s.session)}" aria-label="Session name" />
        <label class="adv-admin-endsat">Starts
          <input type="datetime-local" class="adv-admin-input adv-admin-datetime" data-f="start" value="${s.start}" />
        </label>
        <label class="adv-admin-endsat">Ends
          <input type="datetime-local" class="adv-admin-input adv-admin-datetime" data-f="end" value="${s.end}" />
        </label>
        <button type="button" class="adv-admin-session-remove" data-act="remove-session"
          aria-label="Remove session" title="Remove session">${'✕'}</button>
      </div>
    `).join('')
    return `
      <div class="adv-admin-event-creator-row adv-admin-session-creator">
        <div class="adv-admin-session-list">${rows}</div>
        <div class="adv-admin-session-footer">
          <button type="button" class="adv-admin-split-link" data-act="add-session">+ Add session</button>
          <button type="button" class="adv-admin-split-link adv-admin-split-link-muted" data-act="unsplit">Remove split</button>
          <button class="adv-admin-btn-create" id="start-event-btn">Create sessions</button>
        </div>
      </div>
      <p class="adv-admin-create-error" role="alert"></p>
      <p class="adv-admin-hint">
        Events with split sessions will have three leaderboards: one for the session, one for the overall event that
        combines the sessions, and the All-Time board.
      </p>
    `
  }

  /** Why a create was refused, shown under the creator. '' clears it. */
  function setCreateError(el, text) {
    const err = el.querySelector('.adv-admin-create-error')
    if (err) err.textContent = text || ''
  }

  function bindSingleCreator(el) {
    const nameInput = el.querySelector('#new-event-name')
    nameInput.addEventListener('input', () => { creator.name = nameInput.value })
    onTap(el.querySelector('[data-act="split"]'), () => {
      creator.name = nameInput.value
      creator.sessions = [blankSession(), blankSession()]
      renderActiveEvent()
    })

    // Typing a date implies scheduling — flip the radio so the UI matches what
    // will actually happen (the submit handler treats a filled date as
    // scheduled regardless, but keeping the radio in sync avoids confusion).
    el.querySelector('#new-event-when').addEventListener('input', (e) => {
      if (e.target.value) el.querySelector('input[name="when"][value="scheduled"]').checked = true
    })

    onTap(el.querySelector('#start-event-btn'), async () => {
      const input = el.querySelector('#new-event-name')
      const name = input.value.trim()
      if (!name) {
        setCreateError(el, 'Enter an event name.')
        input.focus()
        return
      }
      setCreateError(el, '')
      const when = el.querySelector('input[name="when"]:checked').value
      const dtRaw = el.querySelector('#new-event-when').value
      const dtTs = dtRaw ? new Date(dtRaw).getTime() : null
      let scheduledStart = null
      if (dtTs && !Number.isNaN(dtTs) && dtTs > Date.now()) {
        // A future date/time was filled in — schedule for it even if the
        // "Start now" radio was left selected. It's easy to type a date and
        // forget to flip the radio, and the filled-in date is the clearer
        // intent, so it wins.
        scheduledStart = dtTs
      } else if (when === 'scheduled') {
        // "Schedule for" chosen but no valid future time given — a blank or
        // past date can't schedule, so point the organizer back at the field.
        setCreateError(el, 'Pick a future date and time to schedule the event.')
        el.querySelector('#new-event-when').focus()
        return
      }
      if (creatingEvent) return
      creatingEvent = true
      let ev
      try {
        ev = await startEvent(name, { scheduledStart })
      } catch (err) {
        console.error('create event failed', err)
        setCreateError(el, 'Could not create the event. Try again.')
        return
      } finally {
        creatingEvent = false
      }
      // Auto-activate only if starting now
      if (!scheduledStart) {
        setActiveEventId(ev.id)
        clearPlayMode()
      }
      creator.name = ''
      await renderActiveEvent()
      await renderEvents()
      flashMessage(scheduledStart ? `Event scheduled for ${formatDate(scheduledStart)}` : 'Event started')
    })
  }

  function bindSessionCreator(el) {
    const rowsEl = [...el.querySelectorAll('.adv-admin-session-row')]
    rowsEl.forEach(row => {
      const i = Number(row.dataset.i)
      const s = creator.sessions[i]
      row.querySelectorAll('[data-f]').forEach(input => {
        input.addEventListener('input', () => {
          const f = input.dataset.f
          if (f === 'name') {
            // One event name for every session: typing in any row fills the rest.
            creator.name = input.value
            el.querySelectorAll('[data-f="name"]').forEach(other => {
              if (other !== input) other.value = input.value
            })
          } else {
            s[f] = input.value
          }
        })
      })
      onTap(row.querySelector('[data-act="remove-session"]'), () => {
        // Down to one row is allowed: a single session can join an existing Day.
        if (creator.sessions.length <= 1) return
        creator.sessions.splice(i, 1)
        renderActiveEvent()
      })
    })
    onTap(el.querySelector('[data-act="add-session"]'), () => {
      creator.sessions.push(blankSession())
      renderActiveEvent()
    })
    onTap(el.querySelector('[data-act="unsplit"]'), () => {
      creator.sessions = null
      renderActiveEvent()
    })
    onTap(el.querySelector('#start-event-btn'), async () => {
      if (creatingEvent) return
      creatingEvent = true
      try {
        await createSessions(el)
      } finally {
        creatingEvent = false
      }
    })
  }

  /**
   * Validate the session rows and create one event per session. A blank (or
   * past) start opens now. A blank end closes a session when the next one
   * starts. Sessions may overlap: separate sessions or events can run at once.
   */
  async function createSessions(el) {
    const name = creator.name.trim()
    const focusRow = (i, f) => el.querySelector(`.adv-admin-session-row[data-i="${i}"] [data-f="${f}"]`)?.focus()
    const refuse = (text, i, f) => {
      setCreateError(el, text)
      if (i != null) focusRow(i, f)
    }
    if (!name) {
      refuse('Enter an event name.', 0, 'name')
      return
    }
    const now = Date.now()
    const parsed = []
    const seen = new Set()
    for (let i = 0; i < creator.sessions.length; i++) {
      const s = creator.sessions[i]
      const session = s.session.trim()
      if (!session) {
        refuse('Give every session a name.', i, 'session')
        return
      }
      const key = session.toLowerCase()
      if (seen.has(key)) {
        refuse('Session names must be different.', i, 'session')
        return
      }
      seen.add(key)
      const startTs = s.start ? new Date(s.start).getTime() : NaN
      const endTs = s.end ? new Date(s.end).getTime() : null
      const startsNow = Number.isNaN(startTs) || startTs <= now
      parsed.push({ i, session, startsNow, start: startsNow ? now : startTs, end: endTs })
    }
    parsed.sort((a, b) => a.start - b.start)
    for (let k = 0; k < parsed.length; k++) {
      const p = parsed[k]
      const next = parsed.slice(k + 1).find(n => n.start > p.start)
      if (p.end == null && next) p.end = next.start
      if (p.end != null && p.end <= p.start) {
        refuse(`${p.session} must end after it starts.`, p.i, 'end')
        return
      }
    }
    setCreateError(el, '')
    // With several sessions opening now, leave the pointer alone: devices
    // then ask players which one they're at.
    const soleNow = parsed.filter(p => p.startsNow).length === 1
    // Sessions created together form one Day, whatever their start dates.
    const dayId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    try {
      for (const p of parsed) {
        const ev = await startEvent(name, {
          scheduledStart: p.startsNow ? null : p.start,
          endsAt: p.end,
          session: p.session,
          dayId,
        })
        // Point this device at a session that opens now right away, so a
        // later failure can't leave it running with no device pointed at it.
        if (p.startsNow && soleNow) {
          setActiveEventId(ev.id)
          clearPlayMode()
        }
      }
    } catch (err) {
      console.error('create sessions failed', err)
      flashMessage('Could not create every session. Check the Events list.')
      await renderActiveEvent()
      await renderEvents()
      return
    }
    creator.name = ''
    creator.sessions = null
    await renderActiveEvent()
    await renderEvents()
    flashMessage(`Created ${parsed.length} ${parsed.length === 1 ? 'session' : 'sessions'}`)
  }

  async function renderRoster() {
    const el = screen.querySelector('#sec-roster')
    const badge = screen.querySelector('#roster-count')
    const activeId = getActiveEventId()
    if (!activeId) {
      badge.textContent = ''
      el.innerHTML = `<div class="adv-admin-empty">Set an active event above to manage its roster.</div>`
      return
    }
    const roster = await getEventRoster(activeId)
    const pendingCount = roster.filter(r => r.rosterStatus === 'pending').length
    badge.textContent = pendingCount ? String(pendingCount) : ''
    if (roster.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No teams on the roster yet. Players add themselves when they pick Team Play.</div>`
      return
    }
    el.innerHTML = `
      <ul class="adv-admin-list">
        ${roster.map(r => `
          <li class="adv-admin-row" data-id="${r.teamId}">
            <span class="adv-admin-row-name">${rosterNameHtml(r)}</span>
            ${rosterStatusPill(r.rosterStatus, 'Event')}
            ${rosterStatusPill(r.teamStatus, 'Statewide')}
            <span class="adv-admin-row-actions">
              ${r.rosterStatus !== 'approved'
                ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve-event">Approve for event</button>`
                : ''}
              ${r.teamStatus !== 'approved'
                ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve-statewide">Approve statewide</button>`
                : ''}
              <button class="adv-admin-btn adv-admin-btn-danger" data-act="remove">Remove</button>
            </span>
          </li>
        `).join('')}
      </ul>
    `
    el.querySelectorAll('.adv-admin-row').forEach(row => {
      const id = row.dataset.id
      onTap(row.querySelector('[data-act="approve-event"]'), async () => {
        await approveTeamForEvent(activeId, id)
        await renderRoster(); await renderPending()
      })
      onTap(row.querySelector('[data-act="approve-statewide"]'), async () => {
        await approveTeam(id)
        await renderRoster(); await renderPending(); await renderTeams()
      })
      // `click`, not `pointerdown` — mobile browsers suppress confirm/prompt
      // when called from pointerdown (treated like a blocked popup).
      row.querySelector('[data-act="remove"]')?.addEventListener('click', async () => {
        if (!window.confirm('Remove this team from the event roster? Their event scores will no longer count.')) return
        await removeTeamFromEventRoster(activeId, id)
        await renderRoster()
      })
    })
  }

  async function renderPending() {
    const el = screen.querySelector('#sec-pending')
    const [teams, schools] = await Promise.all([listPendingTeams(), listAllSchools()])
    const badge = screen.querySelector('#pending-count')
    badge.textContent = teams.length ? String(teams.length) : ''
    if (teams.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No teams waiting for statewide review.</div>`
      return
    }
    el.innerHTML = `
      <ul class="adv-admin-list">
        ${teams.map(t => {
          const c = getTeamColors(t)
          return `
          <li class="adv-admin-row" data-id="${t.id}">
            <span class="adv-admin-row-color" style="background: linear-gradient(135deg, ${c.color1}, ${c.color2})"></span>
            <span class="adv-admin-row-name">${escapeHtml(t.name)}</span>
            <span class="adv-admin-row-meta">created ${formatDate(t.createdAt)}</span>
            ${schoolSelectHtml(t, schools)}
            <span class="adv-admin-row-actions">
              <button class="adv-admin-btn adv-admin-btn-good" data-act="approve">Approve statewide</button>
              <button class="adv-admin-btn" data-act="colors">Colors</button>
              <button class="adv-admin-btn" data-act="rename">Rename</button>
              <button class="adv-admin-btn adv-admin-btn-danger" data-act="remove">Remove</button>
            </span>
          </li>
        `}).join('')}
      </ul>
    `
    el.querySelectorAll('.adv-admin-row').forEach(row => {
      const id = row.dataset.id
      bindSchoolSelect(row, id)
      onTap(row.querySelector('[data-act="approve"]'), async () => {
        await approveTeam(id)
        await renderPending(); await renderTeams(); await renderRoster(); await renderScores()
      })
      row.querySelector('[data-act="remove"]').addEventListener('click', async () => {
        if (!window.confirm('Remove this team AND all its score entries? This cannot be undone.')) return
        await deleteTeam(id)
        await renderPending(); await renderTeams(); await renderRoster(); await renderScores()
      })
      onTap(row.querySelector('[data-act="rename"]'), async () => {
        const next = await openRenamePrompt('team', teams.find(t => t.id === id)?.name || '')
        if (next) {
          await renameTeam(id, next)
          await renderPending(); await renderTeams(); await renderRoster(); await renderScores()
        }
      })
      onTap(row.querySelector('[data-act="colors"]'), () => {
        openColorPopover(getTeamColors(teams.find(t => t.id === id)), async ({ color1, color2 }) => {
          await setTeamColors(id, color1, color2)
          await renderPending(); await renderTeams(); await renderRoster()
        })
      })
    })
  }

  async function renderTeams() {
    const el = screen.querySelector('#sec-teams')
    const [teams, events, schools] = await Promise.all([listAllTeams(), listEvents(), listAllSchools()])
    const schoolName = new Map(schools.map(sc => [sc.id, sc.name]))
    if (teams.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No teams yet.</div>`
      return
    }
    // Which events each team sits on (with its per-event roster status), so the
    // row can label its status pills by scope — "pending · statewide" vs
    // "approved · FFA Day" — instead of a bare "pending" that hides which
    // approval it refers to. Only currently-relevant events (open or scheduled)
    // are labelled; a team's membership in a long-past event is just noise.
    const now = Date.now()
    const membershipsByTeam = new Map()
    for (const ev of events) {
      const ds = derivedEventStatus(ev, now)
      if (ds !== 'open' && ds !== 'scheduled') continue
      for (const r of (ev.roster || [])) {
        const arr = membershipsByTeam.get(r.teamId) || []
        arr.push({ eventName: eventLabel(ev), rosterStatus: r.status })
        membershipsByTeam.set(r.teamId, arr)
      }
    }
    const rowFor = (t) => teamRowHtml(t, membershipsByTeam.get(t.id) || [], schools)
    el.innerHTML = `
      <input class="adv-admin-input adv-admin-search" id="teams-search" placeholder="Search teams…" />
      <ul class="adv-admin-list" id="teams-list">
        ${teams.map(rowFor).join('')}
      </ul>
    `
    const list = el.querySelector('#teams-list')
    const search = el.querySelector('#teams-search')
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase()
      list.innerHTML = teams
        .filter(t =>
          t.name.toLowerCase().includes(q) ||
          (schoolName.get(t.schoolId) || '').toLowerCase().includes(q)
        )
        .map(rowFor)
        .join('')
      bindTeamRows()
    })
    bindTeamRows()

    function bindTeamRows() {
      list.querySelectorAll('.adv-admin-row').forEach(row => {
        const id = row.dataset.id
        bindSchoolSelect(row, id)
        onTap(row.querySelector('[data-act="approve"]'), async () => {
          await approveTeam(id); await renderTeams(); await renderPending(); await renderRoster(); await renderScores()
        })
        onTap(row.querySelector('[data-act="rename"]'), async () => {
          const next = await openRenamePrompt('team', teams.find(t => t.id === id)?.name || '')
          if (next) {
            await renameTeam(id, next)
            await renderTeams(); await renderPending(); await renderRoster(); await renderScores()
          }
        })
        row.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
          if (!window.confirm('Delete this team AND all its score entries? This cannot be undone.')) return
          await deleteTeam(id)
          await renderTeams(); await renderPending(); await renderRoster(); await renderScores()
        })
        onTap(row.querySelector('[data-act="colors"]'), () => {
          openColorPopover(getTeamColors(teams.find(t => t.id === id)), async ({ color1, color2 }) => {
            await setTeamColors(id, color1, color2)
            await renderTeams(); await renderPending(); await renderRoster()
          })
        })
      })
    }
  }

  function teamRowHtml(t, memberships = [], schools = []) {
    const c = getTeamColors(t)
    const eventPills = memberships.map(m => scopePill(m.rosterStatus, m.eventName)).join('')
    return `
      <li class="adv-admin-row" data-id="${t.id}">
        <span class="adv-admin-row-color" style="background: linear-gradient(135deg, ${c.color1}, ${c.color2})"></span>
        <span class="adv-admin-row-name">${escapeHtml(t.name)}</span>
        ${scopePill(t.status, 'statewide')}
        ${eventPills}
        ${schoolSelectHtml(t, schools)}
        <span class="adv-admin-row-actions">
          ${t.status !== 'approved' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve">Approve</button>` : ''}
          <button class="adv-admin-btn" data-act="colors">Colors</button>
          <button class="adv-admin-btn" data-act="rename">Rename</button>
          <button class="adv-admin-btn adv-admin-btn-danger" data-act="delete">Delete</button>
        </span>
      </li>
    `
  }

  /**
   * Per-team school dropdown: No school, every approved school, plus the
   * team's current school when it isn't approved (so the select shows the
   * truth instead of silently reading "No school").
   */
  function schoolSelectHtml(t, schools) {
    const opts = schools
      .filter(sc => sc.status === 'approved' || sc.id === t.schoolId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(sc => {
        const tag = sc.status === 'approved' ? '' : ` (${sc.status})`
        return `<option value="${sc.id}" ${sc.id === t.schoolId ? 'selected' : ''}>${escapeHtml(sc.name)}${tag}</option>`
      })
      .join('')
    return `
      <select class="adv-admin-select adv-admin-school-select" data-act="school" aria-label="School for ${escapeHtml(t.name)}">
        <option value="" ${t.schoolId ? '' : 'selected'}>No school</option>
        ${opts}
      </select>
    `
  }

  function bindSchoolSelect(row, teamId) {
    row.querySelector('[data-act="school"]')?.addEventListener('change', async (e) => {
      try {
        await setTeamSchool(teamId, e.target.value || null)
        flashMessage('School updated')
      } catch (err) {
        console.error('set team school failed', err)
        flashMessage('Could not update the school')
      }
      await renderPending(); await renderTeams(); await renderRoster(); await renderSchools()
    })
  }

  async function renderSchools() {
    const el = screen.querySelector('#sec-schools')
    const [schools, teams] = await Promise.all([listAllSchools(), listAllTeams()])
    const badge = screen.querySelector('#schools-pending-count')
    const pendingCount = schools.filter(sc => sc.status === 'pending').length
    badge.textContent = pendingCount ? String(pendingCount) : ''
    const teamCount = new Map()
    for (const t of teams) {
      if (t.schoolId) teamCount.set(t.schoolId, (teamCount.get(t.schoolId) || 0) + 1)
    }
    const order = { pending: 0, approved: 1, hidden: 2 }
    const sorted = [...schools].sort((a, b) =>
      (order[a.status] ?? 3) - (order[b.status] ?? 3) || a.name.localeCompare(b.name)
    )
    const rowFor = (sc) => {
      const n = teamCount.get(sc.id) || 0
      const others = sorted.filter(o => o.id !== sc.id && o.status !== 'hidden')
      const c = getTeamColors(sc)
      return `
        <li class="adv-admin-row" data-id="${sc.id}">
          <span class="adv-admin-row-color" style="background: linear-gradient(135deg, ${c.color1}, ${c.color2})"></span>
          <span class="adv-admin-row-name">${escapeHtml(sc.name)}</span>
          <span class="adv-admin-row-status adv-admin-status-${sc.status}">${sc.status}</span>
          <span class="adv-admin-row-meta">${n} ${n === 1 ? 'team' : 'teams'}</span>
          <span class="adv-admin-row-actions">
            ${sc.status !== 'approved' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve">Approve</button>` : ''}
            <button class="adv-admin-btn" data-act="colors">Colors</button>
            <button class="adv-admin-btn" data-act="rename">Rename</button>
            ${others.length ? `
              <select class="adv-admin-select adv-admin-merge-select" data-act="merge" aria-label="Merge ${escapeHtml(sc.name)} into another school">
                <option value="">Merge into…</option>
                ${others.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('')}
              </select>` : ''}
            <button class="adv-admin-btn adv-admin-btn-danger" data-act="delete">Delete</button>
          </span>
        </li>
      `
    }
    el.innerHTML = `
      <div class="adv-admin-event-creator-row">
        <input class="adv-admin-input" id="new-school-name" placeholder="New school name" maxlength="40" spellcheck="false" autocomplete="off" />
        <button class="adv-admin-btn-create" id="add-school-btn">Add school</button>
      </div>
      <p class="adv-admin-hint">
        Schools added here are approved right away. Schools added from the roster show as pending until approved here and do not count towards the leaderboard.
      </p>
      ${sorted.length ? `
        <input class="adv-admin-input adv-admin-search" id="schools-search" placeholder="Search schools…" />
        <ul class="adv-admin-list" id="schools-list">${sorted.map(rowFor).join('')}</ul>
      ` : `<div class="adv-admin-empty">No schools yet.</div>`}
    `

    const nameInput = el.querySelector('#new-school-name')
    const addSchool = async () => {
      const name = nameInput.value.trim()
      if (!name) {
        nameInput.focus()
        return
      }
      try {
        await createApprovedSchool(name)
        flashMessage(`Added ${name}`)
      } catch (err) {
        console.error('add school failed', err)
        flashMessage('Could not add that school')
        return
      }
      await renderSchools(); await renderTeams(); await renderPending()
    }
    onTap(el.querySelector('#add-school-btn'), addSchool)
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addSchool()
      }
    })

    const list = el.querySelector('#schools-list')
    const search = el.querySelector('#schools-search')
    if (!list) return
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase()
      list.innerHTML = sorted.filter(sc => sc.name.toLowerCase().includes(q)).map(rowFor).join('')
      bindSchoolRows()
    })
    bindSchoolRows()

    function bindSchoolRows() {
      const refresh = async () => {
        await renderSchools(); await renderTeams(); await renderPending(); await renderRoster()
      }
      list.querySelectorAll('.adv-admin-row').forEach(row => {
        const id = row.dataset.id
        const school = schools.find(sc => sc.id === id)
        onTap(row.querySelector('[data-act="approve"]'), async () => {
          await approveSchool(id)
          await refresh()
        })
        onTap(row.querySelector('[data-act="colors"]'), () => {
          openColorPopover(getTeamColors(school), async ({ color1, color2 }) => {
            await setSchoolColors(id, color1, color2)
            await renderSchools()
          }, { title: 'School colors' })
        })
        onTap(row.querySelector('[data-act="rename"]'), async () => {
          const next = await openRenamePrompt('school', school.name)
          if (next) {
            await renameSchool(id, next)
            await refresh()
          }
        })
        row.querySelector('[data-act="merge"]')?.addEventListener('change', async (e) => {
          const toId = e.target.value
          if (!toId) return
          const target = schools.find(sc => sc.id === toId)
          if (!window.confirm(`Merge ${school.name} into ${target ? target.name : 'that school'}? Its teams move over and ${school.name} is removed.`)) {
            e.target.value = ''
            return
          }
          await mergeSchools(id, toId)
          await refresh()
        })
        row.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
          if (!window.confirm(`Delete ${school.name}? Its teams and scores stay, with no school.`)) return
          await deleteSchool(id)
          await refresh()
        })
      })
    }
  }

  async function renderEvents() {
    const el = screen.querySelector('#sec-events')
    const events = await listEvents()
    if (events.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No events yet.</div>`
      return
    }
    // Status is DERIVED from the clock, not read off `e.status` — a scheduled
    // event whose start has passed is really open, and an event nobody ended is
    // really over once its endsAt lapses. Showing the raw field would lie.
    const now = Date.now()
    const pillClass = (s) => s === 'open' ? 'approved' : s === 'scheduled' ? 'pending' : 'hidden'
    // Row order: name, status, Starts, Ends, then End / Open now / Reopen,
    // Manage Teams, and Delete. Ended events show their dates as text instead
    // of the two editable times.
    el.innerHTML = `
      <ul class="adv-admin-list">
        ${events.map(e => {
          const ds = derivedEventStatus(e, now)
          const agedOut = ds === 'ended' && !e.endedAt
          const ends = eventEndsAt(e)
          const starts = eventStartsAt(e)
          return `
          <li class="adv-admin-row adv-admin-event-row" data-id="${e.id}">
            <span class="adv-admin-row-name">${escapeHtml(eventLabel(e))}</span>
            <span class="adv-admin-row-status adv-admin-status-${pillClass(ds)}"${agedOut ? ' title="No one ended this event — it closed itself at its end time."' : ''}>${ds}${agedOut ? ' (auto)' : ''}</span>
            ${ds === 'ended' ? `<span class="adv-admin-row-meta">${eventMeta(e, ends)}</span>` : ''}
            <span class="adv-admin-row-actions">
              ${ds !== 'ended' && starts
                ? `<label class="adv-admin-endsat" title="When this event opens">Starts
                     <input type="datetime-local" class="adv-admin-input adv-admin-datetime" data-act="startsat"
                       value="${toLocalInputValue(starts)}" />
                   </label>`
                : ''}
              ${ds !== 'ended' && ends
                ? `<label class="adv-admin-endsat" title="When this event closes itself">Ends
                     <input type="datetime-local" class="adv-admin-input adv-admin-datetime" data-act="endsat"
                       value="${toLocalInputValue(ends)}" min="${toLocalInputValue(endsAtFloor(e, now))}" />
                   </label>`
                : ''}
              ${ds === 'scheduled' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="open-now">Open now</button>` : ''}
              ${ds === 'open' ? `<button class="adv-admin-btn adv-admin-btn-warn" data-act="end">End</button>` : ''}
              ${ds === 'ended' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="reopen">Reopen</button>` : ''}
              <button class="adv-admin-btn" data-act="precreate">Manage Teams</button>
              <button class="adv-admin-btn adv-admin-btn-danger" data-act="delete">Delete</button>
            </span>
          </li>
        `}).join('')}
      </ul>
      <p class="adv-admin-hint">
        Devices automatically join the running event, and an event closes itself at its end time.
        New events default to end 24 hours after they start; for anything longer, push the
        <strong>Ends</strong> time out on its row.
      </p>
    `
    el.querySelectorAll('.adv-admin-row').forEach(row => {
      const id = row.dataset.id
      onTap(row.querySelector('[data-act="precreate"]'), () => {
        const ev = events.find(x => x.id === id)
        openRosterModal(id, ev ? eventLabel(ev) : 'Event')
      })
      onTap(row.querySelector('[data-act="open-now"]'), async () => {
        await openScheduledEvent(id)
        await renderEvents(); await renderActiveEvent()
      })
      onTap(row.querySelector('[data-act="end"]'), async () => {
        await endEvent(id)
        await renderEvents(); await renderActiveEvent(); await renderRoster()
      })
      onTap(row.querySelector('[data-act="reopen"]'), async () => {
        await reopenEvent(id)
        await renderEvents(); await renderActiveEvent()
      })
      row.querySelector('[data-act="startsat"]')?.addEventListener('change', async (e) => {
        const ts = new Date(e.target.value).getTime()
        if (Number.isNaN(ts)) return
        const ev = events.find(x => x.id === id)
        const ends = eventEndsAt(ev)
        if (ends != null && ts >= ends) {
          flashMessage('Start time must be before the end time')
          await renderEvents()
          return
        }
        await setEventStart(id, ts)
        await renderEvents(); await renderActiveEvent()
        flashMessage('Start time updated')
      })
      row.querySelector('[data-act="endsat"]')?.addEventListener('change', async (e) => {
        const ts = new Date(e.target.value).getTime()
        if (Number.isNaN(ts)) return
        // `min` on the input isn't reliably enforced for typed values, and an
        // end time before the start would derive the event straight to "ended"
        // without it ever having been open.
        const ev = events.find(x => x.id === id)
        const floor = endsAtFloor(ev, Date.now())
        if (ts <= floor) {
          flashMessage('End time must be after the event starts')
          await renderEvents()
          return
        }
        await setEventEndsAt(id, ts)
        await renderEvents(); await renderActiveEvent()
        flashMessage('End time updated')
      })
      row.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
        if (!window.confirm('Delete this event AND all its tagged scores? This cannot be undone.')) return
        await deleteEvent(id)
        await renderEvents(); await renderActiveEvent(); await renderScores(); await renderRoster()
      })
    })
  }

  /** When an event opens (or opened): its scheduled start, else when it started. */
  function eventStartsAt(e) {
    if (!e) return null
    if (e.status === 'scheduled' && typeof e.scheduledStart === 'number') return e.scheduledStart
    return typeof e.startedAt === 'number' ? e.startedAt : null
  }

  /**
   * Earliest sane auto-end for an event: never before it starts, never in the
   * past. A scheduled event's floor is its scheduledStart, not `now`.
   */
  function endsAtFloor(e, now) {
    if (!e) return now
    // Only a still-scheduled event has a future start to respect; one opened
    // early keeps its old scheduledStart, which must not pin the floor.
    const scheduled = derivedEventStatus(e, now) === 'scheduled'
    return Math.max(now, scheduled && typeof e.scheduledStart === 'number' ? e.scheduledStart : 0)
  }

  /** Dates for an ended event's row. */
  function eventMeta(e, ends) {
    const started = formatDate(e.startedAt)
    if (e.endedAt) return `${started} ${'→'} ${formatDate(e.endedAt)}`
    if (ends) return `${started} ${'→'} auto-ended ${formatDate(ends)}`
    return started
  }

  /**
   * Team-management modal for a specific event, used to build (and moderate) an
   * event's roster ahead of time. Adding a name creates the team (if new) with
   * the colors picked below, puts it on this event's roster, AND approves it for
   * the event in one step — so it shows up pre-approved in the game-intro
   * dropdown the moment the event goes live, without the organizer having to
   * open the event early. Each row can then be approved statewide, recolored, or
   * removed. Mirrors the player-facing Team Roster screen (inline color picker,
   * swatched rows) with the admin moderation controls added.
   *
   * The overlay mounts on document.body — NOT the admin `.screen` — because the
   * screen is a transformed/scrollable positioning context, which would make a
   * `position: fixed` child center within the tall scroll area instead of the
   * viewport. data-mode/theme are stamped so the advanced-mode CSS variables
   * resolve outside #app (same trick as openColorPopover).
   */
  function openRosterModal(eventId, eventName) {
    const overlay = document.createElement('div')
    overlay.className = 'adv-roster-modal'
    const app = document.getElementById('app')
    if (app) {
      overlay.dataset.mode = app.dataset.mode || 'advanced'
      if (app.dataset.theme) overlay.dataset.theme = app.dataset.theme
    }
    overlay.innerHTML = `
      <div class="adv-roster-modal-card" role="dialog" aria-modal="true" aria-label="Manage teams">
        <div class="adv-roster-modal-head">
          <h2 class="adv-roster-modal-title">Manage Teams ${'·'} ${escapeHtml(eventName)}</h2>
          <button class="adv-roster-modal-close" data-act="close" aria-label="Close">${'✕'}</button>
        </div>
        <p class="adv-roster-modal-sub">Teams you add here go on this event's roster pre-approved, so they're ready to pick the moment the event opens.</p>
        <form class="adv-roster-modal-add">
          <input class="adv-admin-input" data-act="add-name" placeholder="Team or school name" maxlength="40" spellcheck="false" autocomplete="off" aria-label="Team name" />
          <button class="adv-admin-btn-create" type="submit">+ Add team</button>
        </form>
        <div class="adv-roster-school" data-host="school">
          <span class="adv-roster-field-label">School</span>
        </div>
        <div class="adv-roster-modal-colors" data-host="colors"></div>
        <div class="adv-roster-modal-feedback" role="alert"></div>
        <div class="adv-roster-modal-list">Loading…</div>
      </div>
    `
    const card = overlay.querySelector('.adv-roster-modal-card')
    const form = overlay.querySelector('.adv-roster-modal-add')
    const nameInput = overlay.querySelector('[data-act="add-name"]')
    const feedback = overlay.querySelector('.adv-roster-modal-feedback')
    const listEl = overlay.querySelector('.adv-roster-modal-list')
    const colorsHost = overlay.querySelector('[data-host="colors"]')

    const schoolPicker = createSchoolPicker({ inputClass: 'adv-admin-input' })
    overlay.querySelector('[data-host="school"]').appendChild(schoolPicker.el)

    // Teams approved statewide or for any event, so a returning team gets
    // picked (with its school link, approved or not) instead of created again.
    let knownTeams = []
    function loadKnownTeams() {
      return Promise.all([listAllTeams(), listEvents(), listAllSchools()]).then(([teams, events, schools]) => {
        const approved = new Map(schools.filter(sc => sc.status === 'approved').map(sc => [sc.id, sc]))
        knownTeams = selectableTeams(teams, events)
          .map(t => ({ team: t, school: approved.get(t.schoolId) || null, label: teamLabel(t, approved) }))
          .sort((a, b) => a.label.localeCompare(b.label))
      }).catch(err => console.error('team list failed', err))
    }
    loadKnownTeams()

    const teamCombo = attachCombobox(nameInput, {
      getOptions: () => knownTeams.map(k => ({
        value: k.team.id,
        label: k.team.name,
        sublabel: k.school ? k.school.name : '',
        known: k,
      })),
      emptyText: 'No approved teams yet. Type a new name.',
      onSelect: (option) => {
        nameInput.value = option.label
        const { team, school } = option.known
        schoolPicker.setValue(
          school ? { id: school.id, name: school.name }
            : team.schoolId ? { id: team.schoolId, pending: true }
            : null
        )
        mountColorPicker(getTeamColors(team))
      },
    })

    let suggestTimer = 0
    nameInput.addEventListener('input', () => {
      clearTimeout(suggestTimer)
      suggestTimer = setTimeout(() => schoolPicker.suggestFrom(nameInput.value), 150)
    })

    let touchedTeams = false // did we create/approve anything worth refreshing on close?

    // Inline swatch picker for the team being added, seeded with a fresh random
    // pair each time so consecutive teams get distinct colors unless picked.
    // Picking a saved team passes its colors instead.
    let colorPicker = null
    function mountColorPicker(colors) {
      colorsHost.innerHTML = ''
      colorPicker = createColorSwatchPicker(colors || deriveTeamColors(`${Date.now()}_${Math.random()}`))
      colorsHost.appendChild(colorPicker.el)
    }
    mountColorPicker()

    function setFeedback(text, kind) {
      feedback.textContent = text || ''
      feedback.className = `adv-roster-modal-feedback${kind ? ` adv-roster-modal-feedback-${kind}` : ''}`
    }

    async function paintList() {
      const roster = await getEventRoster(eventId)
      if (roster.length === 0) {
        listEl.innerHTML = `<div class="adv-admin-empty">No teams yet. Add schools above to build the roster ahead of time.</div>`
        return
      }
      listEl.innerHTML = `
        <ul class="adv-admin-list">
          ${roster.map(r => `
            <li class="adv-admin-row" data-id="${r.teamId}">
              <span class="adv-admin-row-color" style="background: linear-gradient(135deg, ${r.color1}, ${r.color2})"></span>
              <span class="adv-admin-row-name">${rosterNameHtml(r)}</span>
              ${rosterStatusPill(r.rosterStatus, 'Event')}
              ${rosterStatusPill(r.teamStatus, 'Statewide')}
              <span class="adv-admin-row-actions">
                ${r.rosterStatus !== 'approved'
                  ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve-event">Approve for event</button>`
                  : ''}
                ${r.teamStatus !== 'approved'
                  ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve-statewide">Approve statewide</button>`
                  : ''}
                <button class="adv-admin-btn" data-act="colors">Colors</button>
                <button class="adv-admin-btn adv-admin-btn-danger" data-act="remove">Remove</button>
              </span>
            </li>
          `).join('')}
        </ul>
      `
      listEl.querySelectorAll('.adv-admin-row').forEach(rowEl => {
        const teamId = rowEl.dataset.id
        const rEntry = roster.find(r => r.teamId === teamId)
        onTap(rowEl.querySelector('[data-act="approve-event"]'), async () => {
          await approveTeamForEvent(eventId, teamId)
          touchedTeams = true
          await paintList()
        })
        onTap(rowEl.querySelector('[data-act="approve-statewide"]'), async () => {
          await approveTeam(teamId)
          touchedTeams = true
          await paintList()
        })
        onTap(rowEl.querySelector('[data-act="colors"]'), () => {
          openColorPopover({ color1: rEntry.color1, color2: rEntry.color2 }, async ({ color1, color2 }) => {
            await setTeamColors(teamId, color1, color2)
            touchedTeams = true
            await paintList()
          })
        })
        rowEl.querySelector('[data-act="remove"]')?.addEventListener('click', async () => {
          if (!window.confirm('Remove this team from the event roster?')) return
          await removeTeamFromEventRoster(eventId, teamId)
          touchedTeams = true
          await paintList()
        })
      })
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const name = nameInput.value.trim()
      if (!name) {
        nameInput.focus()
        return
      }
      if (!isClean(name)) {
        setFeedback('Pick a different name.', 'error')
        nameInput.select()
        return
      }
      setFeedback('')
      try {
        clearTimeout(suggestTimer)
        await schoolPicker.commit()
        const { schoolId } = schoolPicker.getValue()
        const { teamId } = await getOrCreateTeam(name, colorPicker.getValue(), { schoolId })
        await addTeamToEventRoster(eventId, teamId)
        await approveTeamForEvent(eventId, teamId)
        touchedTeams = true
        teamCombo.close()
        nameInput.value = ''
        schoolPicker.reset()
        mountColorPicker()
        loadKnownTeams()
        await paintList()
        setFeedback(`Added ${'"'}${name}${'"'} — approved for this event.`, 'ok')
      } catch (err) {
        console.error('pre-create team failed', err)
        setFeedback('Could not add that team. Try again.', 'error')
      }
      nameInput.focus()
    })

    function close() {
      document.removeEventListener('keydown', onKey)
      overlay.remove()
      // A pre-created team is also a new statewide-pending team, so refresh the
      // sections that reflect that. The active-event roster may overlap if the
      // modal targeted the active event.
      if (touchedTeams) {
        renderPending(); renderTeams(); renderRoster(); renderSchools()
      }
    }
    function onKey(e) { if (e.key === 'Escape') close() }

    onTap(overlay.querySelector('[data-act="close"]'), close)
    // Backdrop click (outside the card) closes; clicks inside don't bubble out.
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    card.addEventListener('click', (e) => e.stopPropagation())
    document.addEventListener('keydown', onKey)

    document.body.appendChild(overlay)
    paintList()
    setTimeout(() => nameInput.focus(), 50)
  }

  async function renderScores() {
    const el = screen.querySelector('#sec-scores')
    const [scores, teams, events, schools] = await Promise.all([listRecentScores(50), listAllTeams(), listEvents(), listAllSchools()])
    const schoolNames = new Map(schools.map(sc => [sc.id, sc.name]))
    const teamMap = new Map(teams.map(t => [t.id, t]))
    const eventMap = new Map(events.map(e => [e.id, e]))
    if (scores.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No scores recorded yet.</div>`
      return
    }
    el.innerHTML = `
      <ul class="adv-admin-list">
        ${scores.map(s => {
          const team = s.teamId ? teamMap.get(s.teamId) : null
          // School-play scores (no event) have a school instead of a team.
          const teamName = s.teamId ? (team?.name || '(deleted team)')
            : s.schoolId ? `${schoolNames.get(s.schoolId) || '(deleted school)'} (school play)`
            : '(no team)'
          // Show a status badge while the team isn't approved (pending/hidden) so
          // an organizer can see this score won't appear on the public board yet.
          // Read live from the team doc, so a rename/approve here reflects after
          // renderScores() re-runs (rename/approve handlers now call it).
          const statusTag = team && team.status !== 'approved'
            ? ` <span class="adv-admin-row-status adv-admin-status-${team.status}">${team.status}</span>`
            : ''
          const evName = s.eventId ? (eventMap.has(s.eventId) ? eventLabel(eventMap.get(s.eventId)) : '(deleted event)') : ''
          return `
            <li class="adv-admin-row" data-id="${s.id}">
              <span class="adv-admin-row-name">${escapeHtml(teamName)}${statusTag} ${'·'} <span class="adv-admin-row-faint">${escapeHtml(s.playerName)}</span></span>
              <span class="adv-admin-row-meta">${escapeHtml(s.gameId)} ${'·'} ${formatDate(s.ts)} ${evName ? `${'·'} ${escapeHtml(evName)}` : ''}</span>
              <span class="adv-admin-row-points">${s.points} pts</span>
              <span class="adv-admin-row-actions">
                <button class="adv-admin-btn adv-admin-btn-danger" data-act="delete">Delete</button>
              </span>
            </li>
          `
        }).join('')}
      </ul>
    `
    el.querySelectorAll('.adv-admin-row').forEach(row => {
      const id = row.dataset.id
      row.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
        if (!window.confirm('Delete this score entry?')) return
        await deleteScore(id)
        await renderScores()
      })
    })
  }

  function flashMessage(text) {
    const flash = document.createElement('div')
    flash.className = 'adv-admin-flash'
    flash.textContent = text
    // On <body>, not the admin screen: the screen is a transformed scroll
    // container, so a fixed child there scrolls away with the page and a
    // message shown while scrolled down lands out of view.
    const app = document.getElementById('app')
    flash.dataset.mode = app?.dataset.mode || 'advanced'
    if (app?.dataset.theme) flash.dataset.theme = app.dataset.theme
    document.body.appendChild(flash)
    requestAnimationFrame(() => flash.classList.add('adv-admin-flash-show'))
    setTimeout(() => {
      flash.classList.remove('adv-admin-flash-show')
      setTimeout(() => flash.remove(), 300)
    }, 2200)
  }

  // ─── Offline readiness ───
  // The PWA precaches only the app shell; media is cached at runtime. Before an
  // event the advisor must cache everything while online so games work offline.
  // This row shows progress and offers a manual re-cache.
  let offlineUnsub = null
  function renderOffline() {
    const el = screen.querySelector('#sec-offline')
    if (!el) return

    const paint = (st) => {
      const live = screen.querySelector('#sec-offline')
      if (!live) return
      let statusText, statusClass
      switch (st.status) {
        case 'ready':
          statusText = '✓ All assets cached — ready to go offline'
          statusClass = 'adv-offline-ok'
          break
        case 'running':
          statusText = `Caching assets… ${st.done} / ${st.total}`
          statusClass = 'adv-offline-busy'
          break
        case 'partial':
          statusText = `⚠ Cached ${st.done} / ${st.total} — ${st.error}. Retry while online.`
          statusClass = 'adv-offline-warn'
          break
        case 'offline':
          statusText = 'Offline — connect to Wi-Fi, then cache assets.'
          statusClass = 'adv-offline-warn'
          break
        case 'dev':
          statusText = 'ℹ Offline caching runs in the production (deployed) build only — nothing to cache on the dev server.'
          statusClass = 'adv-offline-warn'
          break
        case 'error':
          statusText = `⚠ Couldn't read asset list (${st.error}).`
          statusClass = 'adv-offline-warn'
          break
        default:
          statusText = 'Not cached yet for this version.'
          statusClass = 'adv-offline-warn'
      }
      const pct = st.total ? Math.round((st.done / st.total) * 100) : 0
      live.innerHTML = `
        <div class="adv-offline-row">
          <span class="adv-offline-status ${statusClass}">${statusText}</span>
          <button class="adv-admin-btn" id="offline-cache-btn" ${st.status === 'running' ? 'disabled' : ''}>
            ${st.status === 'running' ? 'Caching…' : 'Cache for offline'}
          </button>
        </div>
        ${st.status === 'running' ? `<div class="adv-offline-bar"><div class="adv-offline-bar-fill" style="width:${pct}%"></div></div>` : ''}
        <p class="adv-admin-hint">Do this at home, online, before each event — it downloads every game asset so the kiosk works with no Wi-Fi.</p>
      `
      onTap(live.querySelector('#offline-cache-btn'), (e) => {
        e.preventDefault()
        warmOfflineCache({ force: true })
      })
    }

    if (offlineUnsub) offlineUnsub()
    offlineUnsub = onWarmupProgress(paint)
  }

  function renderAll() {
    renderActiveEvent()
    renderRoster()
    renderPending()
    renderTeams()
    renderSchools()
    renderEvents()
    renderScores()
    renderOffline()
  }

  // ─── Auth gate ───
  // localStorage backend has no remote writes to protect, so it renders
  // straight away (Phase 1A behavior). The Firestore backend gates the whole
  // panel behind an admin sign-in, since moderation writes require an
  // authenticated session to pass the security rules.
  if (!USE_FIRESTORE) {
    renderAll()
    return screen
  }

  const body = screen.querySelector('.adv-admin-body')
  const headerRight = screen.querySelector('.adv-header-right')
  const gate = buildSignInGate((password) => adminSignIn(password))
  screen.appendChild(gate.el)

  let signOutBtn = null
  let rendered = false

  function applyAuthState(signedIn) {
    if (signedIn) {
      gate.hide()
      body.style.display = ''
      if (!signOutBtn) {
        signOutBtn = document.createElement('button')
        signOutBtn.className = 'adv-admin-signout-btn'
        signOutBtn.textContent = 'Sign out'
        onTap(signOutBtn, () => adminSignOut())
        headerRight.prepend(signOutBtn)
      }
      if (!rendered) {
        renderAll()
        rendered = true
      }
    } else {
      body.style.display = 'none'
      if (signOutBtn) {
        signOutBtn.remove()
        signOutBtn = null
      }
      rendered = false
      gate.show()
    }
  }

  // Locked by default until the first auth callback resolves the session.
  body.style.display = 'none'
  gate.show()

  let seenConnected = false
  let unsub = null
  unsub = onAdminAuthChange((signedIn) => {
    if (screen.isConnected) seenConnected = true
    else if (seenConnected) {
      // Screen was navigated away from — stop listening to avoid leaks.
      if (unsub) unsub()
      return
    }
    applyAuthState(signedIn)
  })

  return screen
}

/**
 * Password-only sign-in overlay. `onSubmit(password)` should return a promise
 * that resolves on success (the auth listener then reveals the panel) or
 * rejects with a Firebase auth error.
 */
function buildSignInGate(onSubmit) {
  const el = document.createElement('div')
  el.className = 'adv-admin-gate'
  // autocomplete="new-password" (not "current-password") tells the browser this
  // is NOT a login to autofill — on a shared event device, an autofilled
  // password a student could just click "Unlock" past would defeat the whole
  // lockout. `off` on the form and a random field name further discourage the
  // save/offer prompt. (This can't purge a password the browser already saved —
  // deleting that is a one-time browser-settings step per device.)
  el.innerHTML = `
    <form class="adv-admin-gate-card" novalidate autocomplete="off">
      <h2 class="adv-admin-gate-title">Admin sign-in</h2>
      <p class="adv-admin-gate-sub">Enter the admin password to manage teams, events, and scores.</p>
      <div class="adv-admin-gate-field">
        <input class="adv-admin-gate-input" type="password" placeholder="Password"
          name="admin-unlock-${Math.random().toString(36).slice(2, 8)}"
          autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false" />
        <button class="adv-admin-gate-reveal" type="button" aria-label="Show password" aria-pressed="false" title="Show password">
          <svg class="adv-admin-gate-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M1.8 12S5.8 5.2 12 5.2 22.2 12 22.2 12 18.2 18.8 12 18.8 1.8 12 1.8 12z" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
          <svg class="adv-admin-gate-eye-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M1.8 12S5.8 5.2 12 5.2 22.2 12 22.2 12 18.2 18.8 12 18.8 1.8 12 1.8 12z" />
            <circle cx="12" cy="12" r="3.2" />
            <line x1="3.5" y1="20.5" x2="20.5" y2="3.5" />
          </svg>
        </button>
      </div>
      <button class="adv-admin-gate-btn" type="submit">Unlock</button>
      <div class="adv-admin-gate-error" role="alert"></div>
    </form>
  `
  const card = el.querySelector('.adv-admin-gate-card')
  const input = el.querySelector('.adv-admin-gate-input')
  const btn = el.querySelector('.adv-admin-gate-btn')
  const error = el.querySelector('.adv-admin-gate-error')
  const reveal = el.querySelector('.adv-admin-gate-reveal')

  const setRevealed = (on) => {
    input.type = on ? 'text' : 'password'
    reveal.classList.toggle('is-on', on)
    reveal.setAttribute('aria-pressed', String(on))
    const label = on ? 'Hide password' : 'Show password'
    reveal.setAttribute('aria-label', label)
    reveal.setAttribute('title', label)
  }

  reveal.addEventListener('click', () => {
    setRevealed(input.type === 'password')
    // Keep the caret where it was so toggling mid-type doesn't cost a tap.
    const end = input.value.length
    input.focus()
    input.setSelectionRange(end, end)
  })

  el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const pw = input.value
    if (!pw) {
      input.focus()
      return
    }
    btn.disabled = true
    error.textContent = ''
    try {
      await onSubmit(pw)
    } catch (err) {
      error.textContent = friendlyAuthError(err)
      card.classList.remove('shake')
      void card.offsetWidth // reflow so the animation restarts each failure
      card.classList.add('shake')
      input.select()
    } finally {
      btn.disabled = false
    }
  })

  return {
    el,
    show() {
      el.style.display = 'flex'
      setTimeout(() => input.focus(), 50)
    },
    hide() {
      el.style.display = 'none'
      input.value = ''
      error.textContent = ''
      setRevealed(false)
    },
  }
}

function friendlyAuthError(err) {
  const code = err && err.code ? err.code : ''
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect password.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a moment and try again.'
  if (code.includes('network')) return 'Network error — check your connection and retry.'
  if (code.includes('user-not-found')) return 'Admin account not found. Check Firebase setup.'
  return 'Sign-in failed. Please try again.'
}

// Roster pills show only a mark + scope label (Event / Statewide). The status
// word itself ("approved"/"pending") is encoded in the mark + color, so the
// pill stays narrow enough to sit beside the team name on a phone-width row.
//   approved → ✓ (check)   pending → … (waiting)   hidden → ✕ (x)
function rosterStatusPill(status, scope) {
  const marks = { approved: '✓', pending: '○', hidden: '✕' }
  const mark = marks[status] || '·'
  const title = `${status} (${scope.toLowerCase()})`
  return `<span class="adv-admin-row-status adv-admin-status-${status}" title="${title}">${mark} ${scope}</span>`
}

/**
 * Styled rename dialog (replaces window.prompt). Resolves to the trimmed new
 * name, or null when cancelled or unchanged. Mounts on <body> with the app's
 * mode/theme copied over, like the color popover it shares its look with.
 * @param {'team'|'school'} kind
 * @param {string} current
 * @returns {Promise<string|null>}
 */
function openRenamePrompt(kind, current) {
  return new Promise(resolve => {
    document.querySelector('.adv-rename-overlay')?.remove()
    const overlay = document.createElement('div')
    overlay.className = 'adv-color-overlay adv-rename-overlay'
    const app = document.getElementById('app')
    if (app) {
      overlay.dataset.mode = app.dataset.mode || 'advanced'
      if (app.dataset.theme) overlay.dataset.theme = app.dataset.theme
    }
    overlay.innerHTML = `
      <form class="adv-color-card adv-rename-card" role="dialog" aria-modal="true" aria-label="Rename ${kind}">
        <h4 class="adv-color-card-title">Rename ${kind}</h4>
        <input class="adv-admin-input adv-rename-input" maxlength="40" spellcheck="false" autocomplete="off"
          value="${escapeHtml(current)}" aria-label="New ${kind} name" />
        <p class="adv-rename-hint">If another ${kind} already has this name, the two merge.</p>
        <div class="adv-color-actions">
          <button type="button" class="adv-admin-btn" data-act="cancel">Cancel</button>
          <button type="submit" class="adv-admin-btn adv-admin-btn-primary">Save</button>
        </div>
      </form>
    `
    const form = overlay.querySelector('form')
    const input = overlay.querySelector('input')
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      document.removeEventListener('keydown', onKey)
      overlay.classList.remove('adv-color-show')
      setTimeout(() => overlay.remove(), 200)
      resolve(value)
    }
    const onKey = (e) => { if (e.key === 'Escape') finish(null) }
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const next = input.value.trim()
      if (!next) {
        input.focus()
        return
      }
      finish(next === current.trim() ? null : next)
    })
    onTap(overlay.querySelector('[data-act="cancel"]'), (e) => {
      e.stopPropagation()
      finish(null)
    })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(null) })
    document.addEventListener('keydown', onKey)
    document.body.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-color-show'))
    setTimeout(() => input.select(), 50)
  })
}

// Roster row name: "Team · School", with a pending pill after a school that
// is still awaiting approval.
function rosterNameHtml(r) {
  if (!r.pendingSchoolName) return escapeHtml(r.label)
  return `${escapeHtml(r.teamName)} ${'·'} ${escapeHtml(r.pendingSchoolName)} <span class="adv-school-pending-pill" title="School awaiting approval">pending</span>`
}

// Full-word status pill labelled with its scope — "pending · statewide",
// "approved · FFA Day". Used in the All-teams list so a bare "pending" can't be
// mistaken for the wrong kind of approval. `scopeLabel` may be a user-entered
// event name, so it's escaped.
function scopePill(status, scopeLabel) {
  return `<span class="adv-admin-row-status adv-admin-status-${status}" title="${escapeHtml(status)} (${escapeHtml(scopeLabel)})">${status} ${'·'} ${escapeHtml(scopeLabel)}</span>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  let h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)} ${h}:${m} ${ampm}`
}

/**
 * `YYYY-MM-DDTHH:mm` in LOCAL time, which is what <input type="datetime-local">
 * expects. toISOString() would render UTC and silently shift the value by the
 * timezone offset every time the row re-renders.
 */
function toLocalInputValue(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
