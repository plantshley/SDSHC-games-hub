/**
 * app-zoom — scale the whole site up on screens bigger than the design size.
 *
 * The layouts are tuned at 1536×738 CSS px (a 1920×1080 laptop at 125% Windows
 * scaling, browser window with toolbars). On a bigger viewport, e.g. a 1920-wide
 * monitor at 100%, the fixed-pixel layouts sat small in the middle of the
 * screen. This sets CSS `zoom` on <body> so any viewport at least the design
 * size lays out at (about) the design size and is drawn proportionally larger:
 *
 *   zoom = max(1, min(innerWidth / 1536, innerHeight / 738))
 *
 * The height term keeps short or ultrawide windows from shrinking the layout
 * below the tested 738px height. Anything at or below the design size
 * (laptops at 125%+, tablets, phones, the kiosk at 125%) gets zoom 1, i.e. no
 * change at all.
 *
 * <body> is also the size container (`container-type: size` in base.css), so
 * `cqw`/`cqh` units and `@container viewport (…)` queries resolve against the
 * zoomed layout size. Viewport units (`vw`/`vh`) and `@media` width queries do
 * NOT, which is why the stylesheets use the container forms.
 *
 * ── JS geometry under zoom ──
 * Two kinds of numbers exist once body is zoomed:
 *   - Screen px: event clientX/clientY, getBoundingClientRect(), innerWidth /
 *     innerHeight, elementFromPoint(). Comparing these with each other is fine.
 *   - Layout (CSS) px: style.left/top/width/height, offsetWidth, clientWidth,
 *     ResizeObserver sizes. These are screen px ÷ zoom.
 * Whenever a screen-px value is written into a style, or mixed with a layout-px
 * value, convert it with toCss(). Ratios (e.g. canvas.width / rect.width) need
 * no conversion.
 */

const DESIGN_W = 1536
const DESIGN_H = 738

// Browsers without CSS zoom (Firefox < 126) would ignore the property while
// the JS still divided by the factor, so treat them as zoom 1 throughout.
const SUPPORTED = typeof CSS !== 'undefined' && CSS.supports?.('zoom', '1.25')

let zoom = 1

/** Current zoom factor on <body> (1 when unzoomed or unsupported). */
export function getZoom() {
  return zoom
}

/** Convert a screen-px value (clientX, rect.left, …) to layout CSS px. */
export function toCss(px) {
  return px / zoom
}

/** getBoundingClientRect() converted to layout CSS px. */
export function cssRect(el) {
  const r = el.getBoundingClientRect()
  return {
    left: r.left / zoom,
    top: r.top / zoom,
    right: r.right / zoom,
    bottom: r.bottom / zoom,
    width: r.width / zoom,
    height: r.height / zoom,
  }
}

/** Layout-viewport size in CSS px (innerWidth/innerHeight ÷ zoom). */
export function cssViewport() {
  return { width: window.innerWidth / zoom, height: window.innerHeight / zoom }
}

function computeZoom() {
  if (!SUPPORTED) return 1
  const z = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
  // Round so tiny resize jitter doesn't re-layout the whole page.
  return z > 1 ? Math.round(z * 1000) / 1000 : 1
}

function apply() {
  const next = computeZoom()
  if (next === zoom) return
  zoom = next
  document.body.style.zoom = zoom === 1 ? '' : String(zoom)
}

/** Call once at startup, before the first screen renders. */
export function initAppZoom() {
  apply()
  window.addEventListener('resize', apply)
}
