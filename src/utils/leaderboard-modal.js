/**
 * Leaderboard button + modal for Advanced Mode.
 *
 * Renders a small trophy button to drop next to the theme toggle. Tapping
 * opens a modal with up to three scope tabs:
 *   - Session: the active event (labelled with its own name; omitted when no
 *     event is active)
 *   - Day: every event in the active event's group (labelled with the group
 *     name; omitted when the active event has no group)
 *   - All-Time
 * A Teams/Schools toggle sits under the tabs. It starts at the first tab's
 * default (Teams for Session and Day, Schools for All-Time). Until someone
 * flips it, switching tabs moves it to that tab's default; once flipped, the
 * choice carries across tabs. Reopening the modal resets it.
 *
 * Only approved teams and approved schools appear. `getLeaderboard` also
 * supports a `month` scope, but no tab surfaces it today.
 *
 * Footer has a small "Admin" link that navigates to #advanced/admin.
 */

import {
  getActiveEventId,
  getEventById,
  getLeaderboard,
} from './leaderboard-api.js'
import { navigateRaw } from '../router.js'
import { onTap } from './tap.js'

/**
 * @returns {HTMLButtonElement}
 */
export function createLeaderboardButton() {
  const btn = document.createElement('button')
  btn.className = 'adv-lb-btn'
  btn.title = 'Leaderboard'
  // U+1F3C6 trophy + U+FE0E (text presentation selector) — forces text-style
  // glyph from Noto Sans Symbols 2 rather than emoji fallback.
  btn.textContent = '\u{1F3C6}\u{FE0E}'

  onTap(btn, (e) => {
    e.stopPropagation()
    showLeaderboardModal()
  })

  return btn
}

async function showLeaderboardModal() {
  // Prevent duplicates
  const existing = document.querySelector('.adv-lb-overlay')
  if (existing) existing.remove()

  const activeEventId = getActiveEventId()
  // A failed read (offline, cold cache) still opens the modal on All-Time.
  const activeEvent = activeEventId ? await getEventById(activeEventId).catch(() => null) : null

  const overlay = document.createElement('div')
  overlay.className = 'adv-lb-overlay'
  // Copy mode/theme attributes so CSS custom properties resolve
  const app = document.getElementById('app')
  if (app) {
    overlay.dataset.mode = app.dataset.mode || 'advanced'
    if (app.dataset.theme) overlay.dataset.theme = app.dataset.theme
  }

  // Session and Day lead with the top-3 podium (a shared session or day, so a
  // "winner" reads well); All-Time uses bars (statewide, ongoing, easier to
  // scan a long list).
  const tabs = []
  if (activeEvent) {
    tabs.push({ key: 'event', label: activeEvent.name, scope: 'event', style: 'combo', groupBy: 'team' })
    const group = String(activeEvent.group || '').trim()
    if (group) tabs.push({ key: 'group', label: group, scope: 'group', style: 'combo', groupBy: 'team' })
  }
  tabs.push({ key: 'all', label: 'All-Time', scope: 'all', style: 'bars', groupBy: 'school' })

  // Teams/Schools state for this modal instance only (see file header).
  let groupBy = tabs[0].groupBy
  let groupByPicked = false
  let currentTab = tabs[0].key
  let renderSeq = 0

  overlay.innerHTML = `
    <div class="adv-lb-card">
      <div class="adv-lb-header">
        <h3 class="adv-lb-title">${'\u{1F3C6}\u{FE0E}'} Leaderboard</h3>
        <button class="adv-lb-close" aria-label="Close">${'✕'}</button>
      </div>
      <div class="adv-lb-tabs" role="tablist">
        ${tabs.map((t, i) => `
          <button class="adv-lb-tab ${i === 0 ? 'adv-lb-tab-active' : ''}" data-tab="${t.key}">${escapeHtml(t.label)}</button>
        `).join('')}
      </div>
      <div class="adv-lb-groupby" role="radiogroup" aria-label="Rank by">
        <button class="adv-lb-groupby-btn" role="radio" data-groupby="team">Teams</button>
        <button class="adv-lb-groupby-btn" role="radio" data-groupby="school">Schools</button>
      </div>
      <div class="adv-lb-body" id="adv-lb-body">
        <div class="adv-lb-loading">Loading…</div>
      </div>
      <div class="adv-lb-footer">
        <span class="adv-lb-hint" title="Team and school names submitted by players are hidden until an admin approves them.">${'ℹ'} Pending names are hidden</span>
        <a class="adv-lb-admin-link" href="#advanced/admin">Admin</a>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('adv-lb-show'))

  let dismissed = false
  const dismiss = () => {
    if (dismissed) return
    dismissed = true
    overlay.classList.remove('adv-lb-show')
    setTimeout(() => overlay.remove(), 250)
  }

  onTap(overlay.querySelector('.adv-lb-close'), (e) => {
    e.stopPropagation()
    dismiss()
  })
  onTap(overlay, (e) => {
    if (e.target === overlay) dismiss()
  })
  onTap(overlay.querySelector('.adv-lb-admin-link'), (e) => {
    e.preventDefault()
    e.stopPropagation()
    dismiss()
    navigateRaw('advanced/admin')
  })

  const body = overlay.querySelector('#adv-lb-body')

  const groupByBtns = overlay.querySelectorAll('.adv-lb-groupby-btn')
  function paintGroupBy() {
    groupByBtns.forEach(b => {
      const on = b.dataset.groupby === groupBy
      b.classList.toggle('adv-lb-groupby-active', on)
      b.setAttribute('aria-checked', on ? 'true' : 'false')
    })
  }

  async function renderTab(key) {
    const tab = tabs.find(t => t.key === key) || tabs[0]
    const kind = groupBy
    // A slow read for an earlier tab/toggle must not overwrite a newer one.
    const seq = ++renderSeq
    paintGroupBy()
    body.innerHTML = `<div class="adv-lb-loading">Loading…</div>`
    const args = tab.scope === 'all'
      ? { scope: 'all', groupBy: kind }
      : { scope: tab.scope, eventId: activeEventId, groupBy: kind }
    let rows
    try {
      rows = await getLeaderboard(args)
    } catch (err) {
      console.error('leaderboard load failed', err)
      if (seq === renderSeq) {
        body.innerHTML = `<div class="adv-lb-empty">Couldn't load the leaderboard. Check the connection and try again.</div>`
      }
      return
    }
    if (seq !== renderSeq) return

    if (!rows.length) {
      body.innerHTML = kind === 'school'
        ? `<div class="adv-lb-empty">No school scores yet. A team counts toward its school once it's approved and linked to an approved school.</div>`
        : `<div class="adv-lb-empty">No scores yet for this view.</div>`
      return
    }

    body.innerHTML = renderStyle(tab.style, rows, kind)
  }

  overlay.querySelectorAll('.adv-lb-tab').forEach(tabBtn => {
    onTap(tabBtn, (e) => {
      e.stopPropagation()
      overlay.querySelectorAll('.adv-lb-tab').forEach(b => b.classList.remove('adv-lb-tab-active'))
      tabBtn.classList.add('adv-lb-tab-active')
      currentTab = tabBtn.dataset.tab
      if (!groupByPicked) groupBy = (tabs.find(t => t.key === currentTab) || tabs[0]).groupBy
      renderTab(currentTab)
    })
  })

  groupByBtns.forEach(btn => {
    onTap(btn, (e) => {
      e.stopPropagation()
      // Only a real flip counts as a choice; tapping the active side is a no-op.
      if (groupBy === btn.dataset.groupby) return
      groupByPicked = true
      groupBy = btn.dataset.groupby
      renderTab(currentTab)
    })
  })

  renderTab(currentTab)
}

/* ─── Leaderboard render styles ─── */

// `kind` is 'team' or 'school'. Team rows show their approved school as a muted
// suffix (two schools can each have a "Team 1"); school rows add Teams and
// Avg / team columns, which are informational only (ranking is by total).

function renderStyle(style, rows, kind = 'team') {
  switch (style) {
    case 'bars': return renderBars(rows, kind)
    case 'rows': return renderColoredTable(rows, kind)
    case 'podium': return renderPodium(rows, kind) + renderRestTable(rows.slice(3), 4, false, kind)
    case 'combo': return renderPodium(rows, kind) + renderRestTable(rows.slice(3), 4, true, kind)
    default: return renderPlainTable(rows, kind)
  }
}

function tableHead(kind) {
  return `
    <thead>
      <tr>
        <th class="adv-lb-col-rank">Rank</th>
        <th class="adv-lb-col-team">${kind === 'school' ? 'School' : 'Team'}</th>
        <th class="adv-lb-col-pts" title="Score normalized across games so each game counts fairly.">Score<span class="adv-lb-col-sub">(Normalized)</span></th>
        ${kind === 'school' ? `
        <th class="adv-lb-col-teams" title="Approved teams with at least one score in this view.">Teams</th>
        <th class="adv-lb-col-avg" title="Normalized score divided by the number of teams.">Avg / team</th>` : ''}
        <th class="adv-lb-col-raw" title="Total raw points actually earned in games.">Raw</th>
        <th class="adv-lb-col-games">Games</th>
      </tr>
    </thead>
  `
}

function nameHtml(r, kind) {
  const school = kind === 'team' && r.schoolName
    ? `<span class="adv-lb-school">${'·'} ${escapeHtml(r.schoolName)}</span>`
    : ''
  return `${escapeHtml(r.name)}${school}`
}

function rowCells(r, kind) {
  return `
    <td class="adv-lb-col-pts">${r.normPoints}</td>
    ${kind === 'school' ? `
    <td class="adv-lb-col-teams">${r.teamCount}</td>
    <td class="adv-lb-col-avg">${r.avgPerTeam}</td>` : ''}
    <td class="adv-lb-col-raw">${r.points}</td>
    <td class="adv-lb-col-games">${r.gamesPlayed}</td>
  `
}

// Secondary line for bars and podium cards.
function metaText(r, kind) {
  const games = `${r.gamesPlayed} ${r.gamesPlayed === 1 ? 'game' : 'games'}`
  if (kind === 'school') {
    const teams = `${r.teamCount} ${r.teamCount === 1 ? 'team' : 'teams'}`
    return `${teams} ${'·'} avg ${r.avgPerTeam} ${'·'} ${r.points} raw`
  }
  return `${r.points} raw ${'·'} ${games}`
}

function renderPlainTable(rows, kind) {
  return `
    <table class="adv-lb-table">
      ${tableHead(kind)}
      <tbody>
        ${rows.map((r, i) => `
          <tr>
            <td class="adv-lb-col-rank">${i + 1}</td>
            <td class="adv-lb-col-team">${nameHtml(r, kind)}</td>
            ${rowCells(r, kind)}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// Table with each row tinted by its accent colors (left bar + dot).
function renderColoredTable(rows, kind) {
  return `
    <table class="adv-lb-table adv-lb-table-tinted">
      ${tableHead(kind)}
      <tbody>
        ${rows.map((r, i) => `
          <tr style="--team-c1: ${r.color1}; --team-c2: ${r.color2}">
            <td class="adv-lb-col-rank">${i + 1}</td>
            <td class="adv-lb-col-team"><span class="adv-lb-team-dot" style="background: linear-gradient(135deg, ${r.color1}, ${r.color2})"></span>${nameHtml(r, kind)}</td>
            ${rowCells(r, kind)}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// Horizontal bars: length proportional to the leader, filled with accent colors.
function renderBars(rows, kind) {
  const max = rows[0]?.normPoints || 1
  return `
    <div class="adv-lb-bars">
      ${rows.map((r, i) => {
        const pct = Math.max(2, Math.round((r.normPoints / max) * 100))
        return `
          <div class="adv-lb-bar-row">
            <span class="adv-lb-bar-rank" style="color: ${r.color1}">${i + 1}</span>
            <div class="adv-lb-bar-main">
              <div class="adv-lb-bar-labels">
                <span class="adv-lb-bar-team">${nameHtml(r, kind)}</span>
                <span class="adv-lb-bar-meta">${metaText(r, kind)}</span>
              </div>
              <div class="adv-lb-bar-track">
                <div class="adv-lb-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, ${r.color1}, ${r.color2})"></div>
              </div>
            </div>
            <span class="adv-lb-bar-value" style="color: ${r.color2}">${r.normPoints}</span>
          </div>
        `
      }).join('')}
    </div>
  `
}

// Top-3 podium. Visual order 2 · 1 · 3, with first place tallest.
function renderPodium(rows, kind) {
  const top = rows.slice(0, 3)
  const order = top.length === 1 ? [0] : top.length === 2 ? [1, 0] : [1, 0, 2]
  return `
    <div class="adv-lb-podium">
      ${order.map(idx => {
        const r = top[idx]
        if (!r) return ''
        const place = idx + 1
        return `
          <div class="adv-lb-podium-col adv-lb-podium-${place}" style="--team-c1: ${r.color1}; --team-c2: ${r.color2}">
            <div class="adv-lb-podium-card">
              <span class="adv-lb-podium-team">${escapeHtml(r.name)}</span>
              ${kind === 'team' && r.schoolName ? `<span class="adv-lb-podium-school">${escapeHtml(r.schoolName)}</span>` : ''}
              <span class="adv-lb-podium-score">${r.normPoints}</span>
              <span class="adv-lb-podium-raw">${metaText(r, kind)}</span>
            </div>
            <div class="adv-lb-podium-base">${place}</div>
          </div>
        `
      }).join('')}
    </div>
  `
}

// Compact list for ranks below the podium. `tinted` adds accent colors.
function renderRestTable(rows, startRank, tinted, kind) {
  if (!rows.length) return ''
  return `
    <table class="adv-lb-table ${tinted ? 'adv-lb-table-tinted' : ''}" style="margin-top: 8px;">
      ${tableHead(kind)}
      <tbody>
        ${rows.map((r, i) => `
          <tr ${tinted ? `style="--team-c1: ${r.color1}; --team-c2: ${r.color2}"` : ''}>
            <td class="adv-lb-col-rank">${startRank + i}</td>
            <td class="adv-lb-col-team">${tinted ? `<span class="adv-lb-team-dot" style="background: linear-gradient(135deg, ${r.color1}, ${r.color2})"></span>` : ''}${nameHtml(r, kind)}</td>
            ${rowCells(r, kind)}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
