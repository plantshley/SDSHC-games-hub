/**
 * Narrow-gate overlay for game screens.
 *
 * `mountNarrowGate(parent, opts)` defers the actual append via a microtask, so
 * the gate survives a synchronous `parent.innerHTML = ...` assignment that
 * happens later in the same call (the common pattern in our games).
 *
 * The gate itself is CSS-driven: `display: none` by default; the responsive
 * media queries in base.css flip it to `display: flex` at the gating
 * breakpoint (≤ 599px default, ≤ 899px when `wide: true`).
 */

import { navigate } from '../router.js'

function buildGate(opts) {
  const gate = document.createElement('div')
  gate.className = opts.wide ? 'too-narrow-gate too-narrow-gate-wide' : 'too-narrow-gate'
  gate.innerHTML = `
    <div class="too-narrow-gate-title">Screen too narrow</div>
    <div class="too-narrow-gate-msg">${opts.message || 'Rotate your device to landscape or use a tablet/laptop to play this game.'}</div>
    <button type="button" class="too-narrow-gate-back">← Back</button>
  `

  const back = gate.querySelector('.too-narrow-gate-back')
  back.addEventListener('click', (e) => {
    e.stopPropagation()
    if (opts.onBack) {
      opts.onBack()
    } else {
      navigate('game-select')
    }
  })

  return gate
}

/**
 * Append a narrow-gate to `parent`, deferred to the next microtask so it
 * survives any synchronous `parent.innerHTML = ...` that follows.
 *
 * @param {HTMLElement} parent
 * @param {{ onBack?: () => void, message?: string, wide?: boolean }} [opts]
 */
export function mountNarrowGate(parent, opts = {}) {
  Promise.resolve().then(() => {
    parent.appendChild(buildGate(opts))
  })
}

/**
 * Legacy: returns the element synchronously. Caller must append it AFTER any
 * `el.innerHTML = ...` it does, otherwise the gate will be wiped.
 *
 * Prefer `mountNarrowGate(parent, opts)` for new callers.
 */
export function createNarrowGate(opts = {}) {
  return buildGate(opts)
}
