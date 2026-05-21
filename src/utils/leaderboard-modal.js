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

  const tabs = []
  if (activeEvent) tabs.push({ key: 'event', label: activeEvent.name })
  tabs.push({ key: 'month', label: 'This Month' })
  tabs.push({ key: 'all', label: 'All-Time' })

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
    body.innerHTML = `<div class="adv-lb-loading">Loading…</div>`
    let rows
    if (key === 'event') {
      rows = await getLeaderboard({ scope: 'event', eventId: activeEventId })
    } else if (key === 'month') {
      rows = await getLeaderboard({ scope: 'month' })
    } else {
      rows = await getLeaderboard({ scope: 'all' })
    }

    if (!rows.length) {
      body.innerHTML = `<div class="adv-lb-empty">No scores yet for this view.</div>`
      return
    }

    body.innerHTML = `
      <table class="adv-lb-table">
        <thead>
          <tr>
            <th class="adv-lb-col-rank">Rank</th>
            <th class="adv-lb-col-team">Team</th>
            <th class="adv-lb-col-pts" title="Score normalized across games so each game counts fairly.">Score<span class="adv-lb-col-sub">(Normalized)</span></th>
            <th class="adv-lb-col-raw" title="Total raw points actually earned in games.">Raw</th>
            <th class="adv-lb-col-games">Games</th>
          </tr>
        </thead>
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
