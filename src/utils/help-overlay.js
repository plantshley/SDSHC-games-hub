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

  btn.addEventListener('pointerdown', (e) => {
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
  overlay.innerHTML = `
    <div class="adv-help-card">
      <h3 class="adv-help-title">How to Play: ${title}</h3>
      <ul class="adv-help-rules">
        ${rules.map(r => `<li>${r}</li>`).join('')}
      </ul>
      <button class="adv-help-dismiss">Got it</button>
    </div>
  `

  document.getElementById('app').appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('adv-help-show'))

  const dismiss = () => {
    overlay.classList.remove('adv-help-show')
    setTimeout(() => overlay.remove(), 250)
  }

  overlay.querySelector('.adv-help-dismiss').addEventListener('pointerdown', dismiss)
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) dismiss()
  })
}
