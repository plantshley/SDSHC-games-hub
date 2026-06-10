/**
 * onTap — fire a handler only on a genuine tap, never on a scroll/drag.
 *
 * The games historically bind activation to `pointerdown`, which fires the
 * instant a finger touches the screen. On the 1920×1080 kiosk (no scrolling)
 * that's fine and feels instant — but on phones, where gameplay/shell screens
 * scroll, starting a scroll gesture on a card or button immediately triggers it
 * (the "I tried to scroll but a button activated" problem).
 *
 * onTap waits for `pointerup` and only fires when:
 *   - the pointer didn't move past a small threshold, and
 *   - the gesture wasn't cancelled by the browser beginning a scroll
 *     (which dispatches `pointercancel`).
 *
 * On the kiosk a mouse/touch tap is still down→up with no movement, so it fires
 * essentially as immediately as before.
 */

const MOVE_THRESHOLD = 10 // px of movement that reclassifies a tap as a scroll

export function onTap(el, handler) {
  // Null-safe so callers can pass `container.querySelector(...)` for elements
  // that may not be present (mirrors the old `?.addEventListener` pattern).
  if (!el) return el
  let active = false
  let startX = 0
  let startY = 0
  let pointerId = null

  el.addEventListener('pointerdown', (e) => {
    active = true
    pointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
  })

  el.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== pointerId) return
    if (Math.abs(e.clientX - startX) > MOVE_THRESHOLD || Math.abs(e.clientY - startY) > MOVE_THRESHOLD) {
      active = false // moved too far — it's a scroll/drag, not a tap
    }
  })

  el.addEventListener('pointercancel', (e) => {
    if (e.pointerId === pointerId) active = false
  })

  el.addEventListener('pointerup', (e) => {
    if (!active || e.pointerId !== pointerId) return
    active = false
    handler(e)
  })

  return el
}
