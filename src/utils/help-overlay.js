/**
 * Shared (?) help button + overlay for advanced mode games.
 * Shows game rules/instructions in a dismissible popup.
 */

/**
 * Creates a (?) button that shows a help overlay when tapped.
 * @param {string} title - Game title
 * @param {string[]} rules - Array of rule strings
 * @returns {HTMLButtonElement}
 */
export function createHelpButton(title, rules) {
  const btn = document.createElement('button')
  btn.className = 'adv-help-btn'
  btn.textContent = '?'
  btn.title = 'How to play'

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    showHelpOverlay(title, rules)
  })

  return btn
}

function showHelpOverlay(title, rules) {
  // Prevent duplicates
  const existing = document.querySelector('.adv-help-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.className = 'adv-help-overlay'
  // Copy mode/theme attributes so CSS custom properties resolve correctly
  // (overlay is appended to body, outside the [data-mode] scope)
  const app = document.getElementById('app')
  if (app) {
    overlay.dataset.mode = app.dataset.mode || 'advanced'
    if (app.dataset.theme) overlay.dataset.theme = app.dataset.theme
  }
  overlay.innerHTML = `
    <div class="adv-help-card">
      <h3 class="adv-help-title">How to Play: ${title}</h3>
      <ul class="adv-help-rules">
        ${rules.map(r => `<li>${r}</li>`).join('')}
      </ul>
      <button class="adv-help-dismiss">Got it</button>
    </div>
  `

  // Append to body (outside #app) to avoid interfering with game DOM/stacking
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('adv-help-show'))

  let dismissed = false
  const dismiss = () => {
    if (dismissed) return
    dismissed = true
    overlay.classList.remove('adv-help-show')
    // Remove immediately — no need to wait for fade since pointer-events: none kicks in
    setTimeout(() => overlay.remove(), 250)
  }

  overlay.querySelector('.adv-help-dismiss').addEventListener('click', (e) => {
    e.stopPropagation()
    dismiss()
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss()
  })
}
