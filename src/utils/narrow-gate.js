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
 *
 * Opt-in: pass `rotatePrompt: true` to also append a dismissible
 * "rotate to landscape" prompt that activates only on tablet portrait
 * (600–1279px, portrait orientation). Below 600px the hard narrow-gate
 * already covers the screen so the prompt would never fire there.
 * Currently used by planting-sim, spin-wheel, odd-one-out, drag-drop,
 * farm-manager, and trivia-blitz — the games with the busiest landscape
 * layouts. Dismissal is per-render (not persisted), so navigating between
 * these games re-prompts.
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

  // The gate is mounted the instant a game screen swaps in — often directly
  // under the button the user just tapped to enter the game. On touch devices
  // the browser synthesizes a `click` at the tap coordinates *after* that swap,
  // which can land on this freshly-mounted Back button and bounce the user
  // straight back out (seen on food-web in landscape, where the centered Back
  // button sits right where "Enter" was). Ignore clicks fired within a short
  // window of mount so only a deliberate, separate tap triggers Back.
  const mountedAt = Date.now()
  const back = gate.querySelector('.too-narrow-gate-back')
  back.addEventListener('click', (e) => {
    e.stopPropagation()
    if (Date.now() - mountedAt < 400) return
    if (opts.onBack) {
      opts.onBack()
    } else {
      navigate('game-select')
    }
  })

  return gate
}

function buildRotatePrompt() {
  const prompt = document.createElement('div')
  prompt.className = 'rotate-prompt'
  prompt.innerHTML = `
    <div class="rotate-prompt-icon" aria-hidden="true">⟳</div>
    <div class="rotate-prompt-title">Rotate for the best view</div>
    <div class="rotate-prompt-msg">This game is laid out for landscape. Rotate your device to landscape — or continue in portrait.</div>
    <button type="button" class="rotate-prompt-dismiss">Continue in portrait</button>
  `
  prompt.querySelector('.rotate-prompt-dismiss').addEventListener('click', (e) => {
    e.stopPropagation()
    prompt.classList.add('rotate-prompt-dismissed')
  })
  return prompt
}

/**
 * Append a narrow-gate to `parent`, deferred to the next microtask so it
 * survives any synchronous `parent.innerHTML = ...` that follows. Pass
 * `rotatePrompt: true` to also append the tablet-portrait rotate prompt.
 *
 * @param {HTMLElement} parent
 * @param {{ onBack?: () => void, message?: string, wide?: boolean, rotatePrompt?: boolean }} [opts]
 */
export function mountNarrowGate(parent, opts = {}) {
  Promise.resolve().then(() => {
    parent.appendChild(buildGate(opts))
    if (opts.rotatePrompt) {
      parent.appendChild(buildRotatePrompt())
    }
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
