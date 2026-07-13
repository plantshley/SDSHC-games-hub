/**
 * Farm World — input controls.
 *
 * Two sources write into one shared input state:
 *  - an on-screen virtual joystick (primary control on the touchscreen kiosk)
 *  - WASD / arrow keys (classroom laptops)
 *
 * The world polls `state.x / state.y` each frame (x: right+, y: down/toward
 * camera+), so the two sources just overwrite the same vector — whichever the
 * player is actively using wins.
 */

/**
 * Build the joystick element. Caller appends `el` to the HUD; pointer events
 * are self-contained (capture on the base). Writes into `state`.
 *
 * @param {{x: number, y: number}} state
 * @returns {{ el: HTMLElement }}
 */
export function createJoystick(state) {
  const el = document.createElement('div')
  el.className = 'adv-fw-joystick'
  el.innerHTML = `
    <div class="adv-fw-joystick-base">
      <div class="adv-fw-joystick-thumb"></div>
    </div>
  `
  const base = el.querySelector('.adv-fw-joystick-base')
  const thumb = el.querySelector('.adv-fw-joystick-thumb')

  let activeId = null

  function update(e) {
    const rect = base.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const maxR = rect.width / 2
    let dx = e.clientX - cx
    let dy = e.clientY - cy
    const d = Math.hypot(dx, dy)
    if (d > maxR) {
      dx = (dx / d) * maxR
      dy = (dy / d) * maxR
    }
    thumb.style.transform = `translate(${dx}px, ${dy}px)`
    state.x = dx / maxR
    state.y = dy / maxR
  }

  function release() {
    activeId = null
    thumb.style.transform = ''
    state.x = 0
    state.y = 0
  }

  base.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    if (activeId !== null) return // a second finger doesn't steal the stick
    activeId = e.pointerId
    base.setPointerCapture(e.pointerId)
    update(e)
  })
  base.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId) return
    update(e)
  })
  base.addEventListener('pointerup', (e) => {
    if (e.pointerId === activeId) release()
  })
  base.addEventListener('pointercancel', (e) => {
    if (e.pointerId === activeId) release()
  })

  return { el }
}

const KEY_VEC = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
}

/**
 * Keyboard movement. Returns a dispose fn that removes the listeners.
 *
 * @param {{x: number, y: number}} state
 * @returns {() => void}
 */
export function createKeyboardInput(state) {
  const held = new Set()

  function apply() {
    let x = 0
    let y = 0
    held.forEach(code => {
      const v = KEY_VEC[code]
      x += v[0]
      y += v[1]
    })
    const mag = Math.hypot(x, y)
    state.x = mag > 1 ? x / mag : x
    state.y = mag > 1 ? y / mag : y
  }

  function onDown(e) {
    if (!KEY_VEC[e.code]) return
    e.preventDefault() // arrows scroll the page on laptops otherwise
    if (held.has(e.code)) return
    held.add(e.code)
    apply()
  }

  function onUp(e) {
    if (!held.has(e.code)) return
    held.delete(e.code)
    apply()
  }

  function onBlur() {
    if (held.size === 0) return
    held.clear()
    apply()
  }

  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', onBlur)

  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    window.removeEventListener('blur', onBlur)
  }
}
