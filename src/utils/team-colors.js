/**
 * Team accent colors — shared palette, deterministic fallback, and a swatch
 * picker component.
 *
 * Every team carries two accent colors used across the leaderboard. They're
 * set two ways:
 *   - Manually, via the swatch picker on the roster screen / admin panel.
 *   - Automatically, when a team is created by a player just typing a new name
 *     on a game intro. `deriveTeamColors()` produces a stable pair from the
 *     team's id so the same team always looks the same without anyone picking.
 *
 * `getTeamColors()` is the read-side accessor: stored colors if present, else
 * the deterministic fallback. This keeps legacy teams (created before colors
 * existed) looking consistent with no data migration.
 */

export const TEAM_PALETTE = [
  '#38cebc', // teal
  '#b8e84a', // yellow-green
  '#ff71ce', // pink
  '#01cdfe', // cyan
  '#b967ff', // purple
  '#ffe627', // amber
  '#ff4b57', // coral
  '#6bd968', // green
  '#4d96ff', // blue
  '#ff9f43', // orange
  '#eaeaea', // white
  '#141414', // black
  '#787878', // grey
  '#835915', // brown

]

function hashString(s) {
  let h = 0
  for (let i = 0; i < String(s).length; i++) {
    h = (h * 31 + String(s).charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Deterministic two-distinct-color pair from a seed (team id or name).
 * @param {string} seed
 * @returns {{ color1: string, color2: string }}
 */
export function deriveTeamColors(seed) {
  const h = hashString(seed || '')
  const i = h % TEAM_PALETTE.length
  let j = (Math.floor(h / TEAM_PALETTE.length) + 1) % TEAM_PALETTE.length
  if (j === i) j = (i + 1) % TEAM_PALETTE.length
  return { color1: TEAM_PALETTE[i], color2: TEAM_PALETTE[j] }
}

/**
 * Stored colors if the team has them, else the deterministic fallback.
 * @param {{ id?: string, name?: string, color1?: string, color2?: string }} team
 * @returns {{ color1: string, color2: string }}
 */
export function getTeamColors(team) {
  if (team && team.color1 && team.color2) {
    return { color1: team.color1, color2: team.color2 }
  }
  return deriveTeamColors(team ? team.id || team.name : '')
}

/**
 * Inline two-row swatch picker (Primary + Secondary). Returns the element plus
 * a `getValue()` reader. Optional `onChange(colors)` fires on every selection.
 *
 * @param {{ color1: string, color2: string }} initial
 * @param {(colors: { color1: string, color2: string }) => void} [onChange]
 * @returns {{ el: HTMLElement, getValue: () => { color1: string, color2: string } }}
 */
export function createColorSwatchPicker(initial, onChange) {
  const state = {
    color1: initial?.color1 || TEAM_PALETTE[0],
    color2: initial?.color2 || TEAM_PALETTE[1],
  }

  const el = document.createElement('div')
  el.className = 'adv-color-picker'
  el.innerHTML = `
    <div class="adv-color-rows">
      <div class="adv-color-row" data-slot="color1">
        <span class="adv-color-label">Primary</span>
        <div class="adv-color-swatches">
          ${TEAM_PALETTE.map(c => `<button type="button" class="adv-color-swatch" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
        </div>
      </div>
      <div class="adv-color-row" data-slot="color2">
        <span class="adv-color-label">Secondary</span>
        <div class="adv-color-swatches">
          ${TEAM_PALETTE.map(c => `<button type="button" class="adv-color-swatch" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
        </div>
      </div>
    </div>
    <div class="adv-color-preview">
      <span class="adv-color-preview-chip"></span>
      <span class="adv-color-preview-text">Preview</span>
    </div>
  `

  function refresh() {
    el.querySelectorAll('.adv-color-row').forEach(row => {
      const slot = row.dataset.slot
      row.querySelectorAll('.adv-color-swatch').forEach(sw => {
        sw.classList.toggle('adv-color-swatch-active', sw.dataset.color === state[slot])
      })
    })
    const chip = el.querySelector('.adv-color-preview-chip')
    chip.style.background = `linear-gradient(135deg, ${state.color1}, ${state.color2})`
  }

  el.querySelectorAll('.adv-color-row').forEach(row => {
    const slot = row.dataset.slot
    row.querySelectorAll('.adv-color-swatch').forEach(sw => {
      sw.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        state[slot] = sw.dataset.color
        refresh()
        if (onChange) onChange({ ...state })
      })
    })
  })

  refresh()

  return { el, getValue: () => ({ ...state }) }
}

/**
 * Modal popover wrapping the swatch picker with Save / Cancel. Used by the
 * admin panel where an always-visible picker per row would be too dense.
 *
 * @param {{ color1: string, color2: string }} initial
 * @param {(colors: { color1: string, color2: string }) => void} onSave
 */
export function openColorPopover(initial, onSave) {
  const existing = document.querySelector('.adv-color-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.className = 'adv-color-overlay'
  const app = document.getElementById('app')
  if (app) {
    overlay.dataset.mode = app.dataset.mode || 'advanced'
    if (app.dataset.theme) overlay.dataset.theme = app.dataset.theme
  }

  const card = document.createElement('div')
  card.className = 'adv-color-card'
  card.innerHTML = `<h4 class="adv-color-card-title">Team colors</h4>`

  const picker = createColorSwatchPicker(initial)
  card.appendChild(picker.el)

  const actions = document.createElement('div')
  actions.className = 'adv-color-actions'
  actions.innerHTML = `
    <button type="button" class="adv-admin-btn" data-act="cancel">Cancel</button>
    <button type="button" class="adv-admin-btn adv-admin-btn-primary" data-act="save">Save</button>
  `
  card.appendChild(actions)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('adv-color-show'))

  const close = () => {
    overlay.classList.remove('adv-color-show')
    setTimeout(() => overlay.remove(), 200)
  }

  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) close()
  })
  actions.querySelector('[data-act="cancel"]').addEventListener('pointerdown', (e) => {
    e.stopPropagation()
    close()
  })
  actions.querySelector('[data-act="save"]').addEventListener('pointerdown', (e) => {
    e.stopPropagation()
    onSave(picker.getValue())
    close()
  })
}
