/**
 * Leaderboard button + modal for Advanced Mode.
 *
 * Renders a small trophy button to drop next to the theme toggle. Tapping
 * opens a modal with three tabs: Current Event (hidden if no active event),
 * This Month, All-Time. Only approved teams appear.
 *
 * Footer has a small "Admin" link that navigates to #advanced/admin.
 */

import {
  getActiveEventId,
  getEventById,
  getLeaderboard,
} from './leaderboard-api.js'
import { navigateRaw } from '../router.js'

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

  btn.addEventListener('pointerdown', (e) => {
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
  const activeEvent = activeEventId ? await getEventById(activeEventId) : null

  const overlay = document.createElement('div')
  overlay.className = 'adv-lb-overlay'
  // Copy mode/theme attributes so CSS custom properties resolve
  const app = document.getElementById('app')
  if (app) {
    overlay.dataset.mode = app.dataset.mode || 'advanced'
    if (app.dataset.theme) overlay.dataset.theme = app.dataset.theme
  }

  // Event view leads with the top-3 podium (a single shared session, so a
  // "winner" reads well); All-Time uses bars (statewide, ongoing, easier to
  // scan a long list).
  const tabs = []
  if (activeEvent) tabs.push({ key: 'event', label: activeEvent.name, scope: 'event', style: 'combo' })
  tabs.push({ key: 'all', label: 'All-Time', scope: 'all', style: 'bars' })

  overlay.innerHTML = `
    <div class="adv-lb-card">
      <div class="adv-lb-header">
        <h3 class="adv-lb-title">${'\u{1F3C6}\u{FE0E}'} Leaderboard</h3>
        <button class="adv-lb-close" aria-label="Close">${'✕'}</button>
      </div>
      <div class="adv-lb-tabs" role="tablist">
        ${tabs.map((t, i) => `
          <button class="adv-lb-tab ${i === 0 ? 'adv-lb-tab-active' : ''}" data-tab="${t.key}">${t.label}</button>
        `).join('')}
      </div>
      <div class="adv-lb-body" id="adv-lb-body">
        <div class="adv-lb-loading">Loading…</div>
      </div>
      <div class="adv-lb-footer">
        <span class="adv-lb-hint" title="Team names submitted by players are hidden until an admin approves them.">${'ℹ'} Pending names are hidden</span>
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

  overlay.querySelector('.adv-lb-close').addEventListener('pointerdown', (e) => {
    e.stopPropagation()
    dismiss()
  })
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) dismiss()
  })
  overlay.querySelector('.adv-lb-admin-link').addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dismiss()
    navigateRaw('advanced/admin')
  })

  const body = overlay.querySelector('#adv-lb-body')

  async function renderTab(key) {
    const tab = tabs.find(t => t.key === key) || tabs[0]
    body.innerHTML = `<div class="adv-lb-loading">Loading…</div>`
    const rows = await getLeaderboard(
      tab.scope === 'event' ? { scope: 'event', eventId: activeEventId } : { scope: 'all' }
    )

    if (!rows.length) {
      body.innerHTML = `<div class="adv-lb-empty">No scores yet for this view.</div>`
      return
    }

    body.innerHTML = renderStyle(tab.style, rows)
  }

  overlay.querySelectorAll('.adv-lb-tab').forEach(tabBtn => {
    tabBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation()
      overlay.querySelectorAll('.adv-lb-tab').forEach(b => b.classList.remove('adv-lb-tab-active'))
      tabBtn.classList.add('adv-lb-tab-active')
      renderTab(tabBtn.dataset.tab)
    })
  })

  renderTab(tabs[0].key)
}

/* ─── Leaderboard render styles ─── */

function renderStyle(style, rows) {
  switch (style) {
    case 'bars': return renderBars(rows)
    case 'rows': return renderColoredTable(rows)
    case 'podium': return renderPodium(rows) + renderRestTable(rows.slice(3), 4, false)
    case 'combo': return renderPodium(rows) + renderRestTable(rows.slice(3), 4, true)
    default: return renderPlainTable(rows)
  }
}

function tableHead() {
  return `
    <thead>
      <tr>
        <th class="adv-lb-col-rank">Rank</th>
        <th class="adv-lb-col-team">Team</th>
        <th class="adv-lb-col-pts" title="Score normalized across games so each game counts fairly.">Score<span class="adv-lb-col-sub">(Normalized)</span></th>
        <th class="adv-lb-col-raw" title="Total raw points actually earned in games.">Raw</th>
        <th class="adv-lb-col-games">Games</th>
      </tr>
    </thead>
  `
}

function renderPlainTable(rows) {
  return `
    <table class="adv-lb-table">
      ${tableHead()}
      <tbody>
        ${rows.map((r, i) => `
          <tr>
            <td class="adv-lb-col-rank">${i + 1}</td>
            <td class="adv-lb-col-team">${escapeHtml(r.teamName)}</td>
            <td class="adv-lb-col-pts">${r.normPoints}</td>
            <td class="adv-lb-col-raw">${r.points}</td>
            <td class="adv-lb-col-games">${r.gamesPlayed}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// Table with each row tinted by its team's accent colors (left bar + dot).
function renderColoredTable(rows) {
  return `
    <table class="adv-lb-table adv-lb-table-tinted">
      ${tableHead()}
      <tbody>
        ${rows.map((r, i) => `
          <tr style="--team-c1: ${r.color1}; --team-c2: ${r.color2}">
            <td class="adv-lb-col-rank">${i + 1}</td>
            <td class="adv-lb-col-team"><span class="adv-lb-team-dot" style="background: linear-gradient(135deg, ${r.color1}, ${r.color2})"></span>${escapeHtml(r.teamName)}</td>
            <td class="adv-lb-col-pts">${r.normPoints}</td>
            <td class="adv-lb-col-raw">${r.points}</td>
            <td class="adv-lb-col-games">${r.gamesPlayed}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// Horizontal bars: length proportional to the leader, filled with team colors.
function renderBars(rows) {
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
                <span class="adv-lb-bar-team">${escapeHtml(r.teamName)}</span>
                <span class="adv-lb-bar-meta">${r.points} raw · ${r.gamesPlayed} ${r.gamesPlayed === 1 ? 'game' : 'games'}</span>
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
function renderPodium(rows) {
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
              <span class="adv-lb-podium-team">${escapeHtml(r.teamName)}</span>
              <span class="adv-lb-podium-score">${r.normPoints}</span>
              <span class="adv-lb-podium-raw">${r.points} raw · ${r.gamesPlayed} ${r.gamesPlayed === 1 ? 'game' : 'games'}</span>
            </div>
            <div class="adv-lb-podium-base">${place}</div>
          </div>
        `
      }).join('')}
    </div>
  `
}

// Compact list for ranks below the podium. `tinted` adds team-color accents.
function renderRestTable(rows, startRank, tinted) {
  if (!rows.length) return ''
  return `
    <table class="adv-lb-table ${tinted ? 'adv-lb-table-tinted' : ''}" style="margin-top: 8px;">
      ${tableHead()}
      <tbody>
        ${rows.map((r, i) => `
          <tr ${tinted ? `style="--team-c1: ${r.color1}; --team-c2: ${r.color2}"` : ''}>
            <td class="adv-lb-col-rank">${startRank + i}</td>
            <td class="adv-lb-col-team">${tinted ? `<span class="adv-lb-team-dot" style="background: linear-gradient(135deg, ${r.color1}, ${r.color2})"></span>` : ''}${escapeHtml(r.teamName)}</td>
            <td class="adv-lb-col-pts">${r.normPoints}</td>
            <td class="adv-lb-col-raw">${r.points}</td>
            <td class="adv-lb-col-games">${r.gamesPlayed}</td>
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
