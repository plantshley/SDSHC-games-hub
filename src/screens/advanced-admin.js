/**
 * Advanced Mode — Admin Panel (Phase 1A: no auth yet).
 *
 * Route: #advanced/admin
 *
 * Sections:
 *   - Active event for this kiosk
 *   - Pending team names
 *   - All teams
 *   - Events
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
  addTeamToEventRoster,
  removeTeamFromEventRoster,
  approveTeamForEvent,
  setTeamColors,
} from '../utils/leaderboard-api.js'
import { addGradientBackground } from '../utils/gradient-bg.js'
import { createThemeToggle } from '../utils/theme-toggle.js'
import { clearPlayMode } from './advanced-play-mode.js'
import { getTeamColors, openColorPopover } from '../utils/team-colors.js'
import { USE_FIRESTORE } from '../firebase/config.js'
import { adminSignIn, adminSignOut, onAdminAuthChange } from '../firebase/auth.js'
import { warmOfflineCache, onWarmupProgress } from '../utils/offline-warmup.js'

export function createAdvancedAdminScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen adv-admin'

  screen.innerHTML = `
    <div class="adv-header">
      <div class="adv-header-left">
        <button class="adv-back-btn" id="adv-admin-back">${'←'} Back</button>
        <h1 class="adv-title">Admin</h1>
      </div>
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

  async function renderActiveEvent() {
    const el = screen.querySelector('#sec-active-event')
    const [open, currentId] = await Promise.all([listOpenEvents(), getActiveEventId()])
    const current = currentId ? await getEventById(currentId) : null

    el.innerHTML = `
      <div class="adv-admin-active-row">
        <label class="adv-admin-label" for="active-event-select">Set kiosk to</label>
        <select class="adv-admin-select" id="active-event-select">
          <option value="">${'—'} None (casual mode)</option>
          ${open.map(e => `<option value="${e.id}" ${e.id === currentId ? 'selected' : ''}>${escapeHtml(e.name)}</option>`).join('')}
        </select>
        <span class="adv-admin-active-inline">
          ${current
            ? `Currently active: <strong>${escapeHtml(current.name)}</strong>`
            : `No active event ${'·'} casual scores go to all-time only.`}
        </span>
      </div>
      <div class="adv-admin-event-creator-row">
        <input class="adv-admin-input" id="new-event-name" placeholder="New event name (e.g. FFA Day Spring)" maxlength="60" />
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
    `

    el.querySelector('#active-event-select').addEventListener('change', async (e) => {
      const v = e.target.value
      setActiveEventId(v || null)
      clearPlayMode()
      await renderActiveEvent()
      await renderRoster()
    })

    onTap(el.querySelector('#start-event-btn'), async () => {
      const input = el.querySelector('#new-event-name')
      const name = input.value.trim()
      if (!name) {
        input.focus()
        return
      }
      const when = el.querySelector('input[name="when"]:checked').value
      let scheduledStart = null
      if (when === 'scheduled') {
        const dt = el.querySelector('#new-event-when').value
        if (!dt) {
          el.querySelector('#new-event-when').focus()
          return
        }
        scheduledStart = new Date(dt).getTime()
      }
      const ev = await startEvent(name, { scheduledStart })
      // Auto-activate only if starting now
      if (!scheduledStart) {
        setActiveEventId(ev.id)
        clearPlayMode()
      }
      input.value = ''
      el.querySelector('#new-event-when').value = ''
      el.querySelector('input[name="when"][value="now"]').checked = true
      await renderActiveEvent()
      await renderEvents()
      flashMessage(scheduledStart ? `Event scheduled for ${formatDate(scheduledStart)}` : 'Event started')
    })
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
            <span class="adv-admin-row-name">${escapeHtml(r.teamName)}</span>
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
    const teams = await listPendingTeams()
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
      onTap(row.querySelector('[data-act="approve"]'), async () => {
        await approveTeam(id)
        await renderPending(); await renderTeams(); await renderRoster()
      })
      row.querySelector('[data-act="remove"]').addEventListener('click', async () => {
        if (!window.confirm('Remove this team AND all its score entries? This cannot be undone.')) return
        await deleteTeam(id)
        await renderPending(); await renderTeams(); await renderRoster(); await renderScores()
      })
      row.querySelector('[data-act="rename"]').addEventListener('click', async () => {
        const cur = row.querySelector('.adv-admin-row-name').textContent
        const next = window.prompt('Rename team to:', cur)
        if (next && next.trim()) {
          await renameTeam(id, next.trim())
          await renderPending(); await renderTeams(); await renderRoster()
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
    const teams = await listAllTeams()
    if (teams.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No teams yet.</div>`
      return
    }
    el.innerHTML = `
      <input class="adv-admin-input adv-admin-search" id="teams-search" placeholder="Search teams…" />
      <ul class="adv-admin-list" id="teams-list">
        ${teams.map(t => teamRowHtml(t)).join('')}
      </ul>
    `
    const list = el.querySelector('#teams-list')
    const search = el.querySelector('#teams-search')
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase()
      list.innerHTML = teams
        .filter(t => t.name.toLowerCase().includes(q))
        .map(t => teamRowHtml(t))
        .join('')
      bindTeamRows()
    })
    bindTeamRows()

    function bindTeamRows() {
      list.querySelectorAll('.adv-admin-row').forEach(row => {
        const id = row.dataset.id
        onTap(row.querySelector('[data-act="approve"]'), async () => {
          await approveTeam(id); await renderTeams(); await renderPending(); await renderRoster()
        })
        row.querySelector('[data-act="rename"]')?.addEventListener('click', async () => {
          const cur = row.querySelector('.adv-admin-row-name').textContent
          const next = window.prompt('Rename team to (merges if name matches another team):', cur)
          if (next && next.trim()) {
            await renameTeam(id, next.trim())
            await renderTeams(); await renderPending(); await renderRoster()
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

  function teamRowHtml(t) {
    const c = getTeamColors(t)
    return `
      <li class="adv-admin-row" data-id="${t.id}">
        <span class="adv-admin-row-color" style="background: linear-gradient(135deg, ${c.color1}, ${c.color2})"></span>
        <span class="adv-admin-row-name">${escapeHtml(t.name)}</span>
        <span class="adv-admin-row-status adv-admin-status-${t.status}">${t.status}</span>
        <span class="adv-admin-row-actions">
          ${t.status !== 'approved' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="approve">Approve</button>` : ''}
          <button class="adv-admin-btn" data-act="colors">Colors</button>
          <button class="adv-admin-btn" data-act="rename">Rename</button>
          <button class="adv-admin-btn adv-admin-btn-danger" data-act="delete">Delete</button>
        </span>
      </li>
    `
  }

  async function renderEvents() {
    const el = screen.querySelector('#sec-events')
    const events = await listEvents()
    if (events.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No events yet.</div>`
      return
    }
    const statusToStatus = (s) => s === 'open' ? 'approved' : s === 'scheduled' ? 'pending' : 'hidden'
    el.innerHTML = `
      <ul class="adv-admin-list">
        ${events.map(e => `
          <li class="adv-admin-row" data-id="${e.id}">
            <span class="adv-admin-row-name">${escapeHtml(e.name)}</span>
            <span class="adv-admin-row-meta">${e.scheduledStart && e.status === 'scheduled' ? `starts ${formatDate(e.scheduledStart)}` : `${formatDate(e.startedAt)}${e.endedAt ? ` ${'→'} ${formatDate(e.endedAt)}` : ''}`}</span>
            <span class="adv-admin-row-status adv-admin-status-${statusToStatus(e.status)}">${e.status}</span>
            <span class="adv-admin-row-actions">
              ${e.status === 'scheduled' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="open-now">Open now</button>` : ''}
              ${e.status === 'open' ? `<button class="adv-admin-btn adv-admin-btn-warn" data-act="end">End</button>` : ''}
              ${e.status === 'ended' ? `<button class="adv-admin-btn adv-admin-btn-good" data-act="reopen">Reopen</button>` : ''}
              <button class="adv-admin-btn adv-admin-btn-danger" data-act="delete">Delete</button>
            </span>
          </li>
        `).join('')}
      </ul>
    `
    el.querySelectorAll('.adv-admin-row').forEach(row => {
      const id = row.dataset.id
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
      row.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
        if (!window.confirm('Delete this event AND all its tagged scores? This cannot be undone.')) return
        await deleteEvent(id)
        await renderEvents(); await renderActiveEvent(); await renderScores(); await renderRoster()
      })
    })
  }

  async function renderScores() {
    const el = screen.querySelector('#sec-scores')
    const [scores, teams, events] = await Promise.all([listRecentScores(50), listAllTeams(), listEvents()])
    const teamMap = new Map(teams.map(t => [t.id, t]))
    const eventMap = new Map(events.map(e => [e.id, e]))
    if (scores.length === 0) {
      el.innerHTML = `<div class="adv-admin-empty">No scores recorded yet.</div>`
      return
    }
    el.innerHTML = `
      <ul class="adv-admin-list">
        ${scores.map(s => {
          const teamName = s.teamId ? (teamMap.get(s.teamId)?.name || '(deleted team)') : '(no team)'
          const evName = s.eventId ? (eventMap.get(s.eventId)?.name || '(deleted event)') : ''
          return `
            <li class="adv-admin-row" data-id="${s.id}">
              <span class="adv-admin-row-name">${escapeHtml(teamName)} ${'·'} <span class="adv-admin-row-faint">${escapeHtml(s.playerName)}</span></span>
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
    screen.appendChild(flash)
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
  el.innerHTML = `
    <form class="adv-admin-gate-card" novalidate>
      <h2 class="adv-admin-gate-title">Admin sign-in</h2>
      <p class="adv-admin-gate-sub">Enter the admin password to manage teams, events, and scores.</p>
      <input class="adv-admin-gate-input" type="password" placeholder="Password" autocomplete="current-password" />
      <button class="adv-admin-gate-btn" type="submit">Unlock</button>
      <div class="adv-admin-gate-error" role="alert"></div>
    </form>
  `
  const card = el.querySelector('.adv-admin-gate-card')
  const input = el.querySelector('.adv-admin-gate-input')
  const btn = el.querySelector('.adv-admin-gate-btn')
  const error = el.querySelector('.adv-admin-gate-error')

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
