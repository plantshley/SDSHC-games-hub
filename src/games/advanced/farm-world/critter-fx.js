/**
 * Farm World — critter reaction FX.
 *
 * Visual half of the tap/walk-up animal reactions: a rainbow particle burst
 * plus a billboarded symbol that pops above the animal's head. The behavioral
 * half (the hop/wiggle/perk animation) rides on the existing `updateCow` state
 * machine in world.js. Also hosts the NPC greeting bubble, which is the same
 * billboard machinery with no burst attached.
 *
 * Self-contained on purpose — world.js's box/mat/place helpers are module
 * private, and nothing here can use the shared `matCache` anyway: every
 * material needs its own animated `opacity`, and cached materials must never be
 * mutated or disposed.
 *
 * Symbols are procedural geometry rather than an emoji CanvasTexture: no
 * dependency on the kiosk's system emoji font, and flat shapes match the
 * low-poly look. MeshBasicMaterial throughout so they read identically in the
 * day and night lighting.
 */

import * as THREE from 'three'

// Per-animal flavor. `spread` is horizontal particle speed, `size` the cube
// edge in world units. Burst color is the rainbow ramp below, not per-kind.
const KINDS = {
  chicken: { symbol: 'bang', symbolColor: 0xfff4d6, count: 10, spread: 2.2, size: 0.07 },
  pig: { symbol: 'heart', symbolColor: 0xf2748f, count: 8, spread: 1.5, size: 0.06 },
  cow: { symbol: 'spark', symbolColor: 0xfff0b8, count: 9, spread: 1.7, size: 0.06 },
}

// Integrated-graphics kiosk: cap concurrent bursts. Past the cap the symbol
// still plays, so a mashed tap never looks like nothing happened.
const MAX_BURSTS = 4

const BURST_DUR = 0.85
const SYMBOL_DUR = 1.15
const BUBBLE_DUR = 1.9
const GRAVITY = 4.2

// Rainbow ramp: particles walk the full hue circle so each burst reads as a
// spectrum rather than random confetti. Lightness is kept high because these
// are unlit and have to stay legible against dark grass and the night sky.
const PART_SAT = 0.85
const PART_LIGHT = 0.62

const BUBBLE_COLOR = 0xfbfbf5 // matches the white HUD cards
const BUBBLE_DOT_COLOR = 0x3a4a45

const rand = (a, b) => a + Math.random() * (b - a)

/** Flat "!" — a tapered bar over a dot, as two planes in one group. */
function bangShapes() {
  return [
    { geo: new THREE.PlaneGeometry(0.15, 0.4), y: 0.13 },
    { geo: new THREE.PlaneGeometry(0.15, 0.15), y: -0.16 },
  ]
}

function heartShape() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.34)
  s.bezierCurveTo(-0.46, 0.06, -0.28, 0.46, 0, 0.22)
  s.bezierCurveTo(0.28, 0.46, 0.46, 0.06, 0, -0.34)
  return new THREE.ShapeGeometry(s)
}

function sparkShape() {
  const pts = []
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 0.36 : 0.12
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r))
  }
  return new THREE.ShapeGeometry(new THREE.Shape(pts))
}

/** Rounded speech-bubble outline with a tail hanging off the bottom edge. */
function bubbleShape() {
  const w = 0.34 // half width
  const h = 0.22 // half height
  const r = 0.12 // corner radius
  const s = new THREE.Shape()
  s.moveTo(-w + r, -h)
  s.lineTo(-0.16, -h)
  s.lineTo(-0.10, -h - 0.20) // tail tip, offset left so it points at the head
  s.lineTo(0.02, -h)
  s.lineTo(w - r, -h)
  s.quadraticCurveTo(w, -h, w, -h + r)
  s.lineTo(w, h - r)
  s.quadraticCurveTo(w, h, w - r, h)
  s.lineTo(-w + r, h)
  s.quadraticCurveTo(-w, h, -w, h - r)
  s.lineTo(-w, -h + r)
  s.quadraticCurveTo(-w, -h, -w + r, -h)
  return new THREE.ShapeGeometry(s)
}

/**
 * @param {object} opts
 * @param {THREE.Scene} opts.scene
 * @param {THREE.Camera} opts.camera — symbols billboard to this every frame
 * @param {Function} opts.tween — world.js's tween(dur, onUpdate, opts)
 */
export function createCritterFx({ scene, camera, tween }) {
  // Geometry is built once per world and shared by every symbol/particle of
  // that kind; only materials are per-effect. Disposed in dispose().
  const geoCache = new Map()
  const partGeo = new Map()
  const symbols = [] // live symbol groups — billboarded in update()
  const bursts = []  // live bursts — { parts, mats }, so dispose() can claim them
  const bubbles = [] // live NPC bubbles — { group, anchor, topY, mats, dots }
  const box3 = new THREE.Box3()
  const _wp = new THREE.Vector3()
  let bubbleGeo = null
  let dotGeo = null
  let disposed = false

  function symbolGeo(kind) {
    if (!geoCache.has(kind)) {
      geoCache.set(kind, kind === 'heart' ? [{ geo: heartShape(), y: 0 }]
        : kind === 'spark' ? [{ geo: sparkShape(), y: 0 }]
          : bangShapes())
    }
    return geoCache.get(kind)
  }

  function particleGeo(size) {
    const key = size.toFixed(3)
    if (!partGeo.has(key)) partGeo.set(key, new THREE.BoxGeometry(size, size, size))
    return partGeo.get(key)
  }

  /** Symbol pops in with a back-ease, rises, then fades over the last stretch. */
  function playSymbol(pos, cfg) {
    const group = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.symbolColor,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    })
    symbolGeo(cfg.symbol).forEach(({ geo, y }) => {
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = y
      group.add(mesh)
    })
    group.position.copy(pos)
    group.position.y += 0.25
    group.scale.setScalar(0.001)
    scene.add(group)
    symbols.push(group)

    const baseY = group.position.y
    tween(SYMBOL_DUR, (p) => {
      // pop over the first third, then hold
      const pop = Math.min(1, p * 3)
      group.scale.setScalar(0.001 + (1 - Math.pow(1 - pop, 3)) * (1 + Math.sin(pop * Math.PI) * 0.25))
      group.position.y = baseY + p * 0.75
      mat.opacity = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4
    }, {
      ease: t => t,
      onDone: () => {
        scene.remove(group)
        const i = symbols.indexOf(group)
        if (i >= 0) symbols.splice(i, 1)
        mat.dispose()
      },
    })
  }

  /**
   * Tumbling cubes thrown outward, arcing back down under fake gravity. Each
   * particle gets its own material so the burst can fan across the hue circle;
   * the shared geometry keeps the mesh count where it was.
   */
  function playBurst(pos, cfg) {
    if (bursts.length >= MAX_BURSTS) return
    const geo = particleGeo(cfg.size)
    const h0 = Math.random() // rotate the ramp so repeat taps aren't identical
    const parts = []
    const mats = []
    for (let i = 0; i < cfg.count; i++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 })
      mat.color.setHSL((h0 + i / cfg.count) % 1, PART_SAT, PART_LIGHT)
      mats.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      scene.add(mesh)
      const a = Math.random() * Math.PI * 2
      const sp = cfg.spread * rand(0.45, 1.15)
      parts.push({
        mesh,
        vx: Math.cos(a) * sp,
        vy: rand(1.5, 3.1),
        vz: Math.sin(a) * sp,
        rx: rand(-7, 7),
        rz: rand(-7, 7),
      })
    }
    const entry = { parts, mats }
    bursts.push(entry)
    tween(BURST_DUR, (p) => {
      const s = p * BURST_DUR
      parts.forEach(q => {
        q.mesh.position.set(
          pos.x + q.vx * s,
          Math.max(0.05, pos.y + q.vy * s - GRAVITY * s * s),
          pos.z + q.vz * s,
        )
        q.mesh.rotation.x = q.rx * s
        q.mesh.rotation.z = q.rz * s
      })
      const o = 0.95 * (1 - p * p)
      mats.forEach(m => { m.opacity = o })
    }, {
      ease: t => t,
      onDone: () => {
        parts.forEach(q => scene.remove(q.mesh))
        mats.forEach(m => m.dispose())
        const i = bursts.indexOf(entry)
        if (i >= 0) bursts.splice(i, 1)
      },
    })
  }

  /**
   * Fire the burst + symbol for one animal.
   * @param {THREE.Object3D} animal — world position and height read from it
   * @param {'chicken'|'pig'|'cow'} kind
   */
  function playReaction(animal, kind) {
    if (disposed) return
    const cfg = KINDS[kind] || KINDS.cow
    // Box3 rather than a hardcoded height: animals carry per-instance random
    // scales and the pasture cows sit under a placed, rotated station group.
    box3.setFromObject(animal)
    const pos = new THREE.Vector3()
    animal.getWorldPosition(pos)
    pos.y = box3.max.y
    playBurst(pos, cfg)
    playSymbol(pos, cfg)
  }

  /**
   * Wordless "I've got something to say" bubble over an NPC's head — no burst.
   * Deliberately textless: the real dialogue is a DOM bubble with the actual
   * line in it, and a CanvasTexture here would be the module's only texture.
   *
   * The bubble tracks the NPC every frame instead of sitting still in world
   * space like the critter symbols, because NPCs keep strolling through it.
   *
   * @param {THREE.Object3D} anchor — the NPC's world wrapper group
   */
  function playNpcBubble(anchor) {
    if (disposed || bubbles.some(b => b.anchor === anchor)) return
    if (!bubbleGeo) bubbleGeo = bubbleShape()
    if (!dotGeo) dotGeo = new THREE.CircleGeometry(0.045, 12)

    const group = new THREE.Group()
    const shellMat = new THREE.MeshBasicMaterial({
      color: BUBBLE_COLOR, transparent: true, opacity: 1, side: THREE.DoubleSide,
    })
    const dotMat = new THREE.MeshBasicMaterial({
      color: BUBBLE_DOT_COLOR, transparent: true, opacity: 1, side: THREE.DoubleSide,
    })
    group.add(new THREE.Mesh(bubbleGeo, shellMat))
    const dots = [-0.14, 0, 0.14].map(x => {
      const d = new THREE.Mesh(dotGeo, dotMat)
      d.position.set(x, 0, 0.01) // nudged forward so it never z-fights the shell
      group.add(d)
      return d
    })
    group.scale.setScalar(0.001)
    scene.add(group)

    // Height offset measured once, relative to the anchor — the NPC's own
    // vertical bob during the walk cycle would otherwise jitter the bubble.
    box3.setFromObject(anchor)
    anchor.getWorldPosition(_wp)
    const entry = {
      group, anchor, dots, mats: [shellMat, dotMat],
      topY: box3.max.y - _wp.y + 0.34,
      rise: 0,
    }
    bubbles.push(entry)

    tween(BUBBLE_DUR, (p) => {
      const pop = Math.min(1, p * 5) // snappier than the critter symbols
      group.scale.setScalar(0.001 + (1 - Math.pow(1 - pop, 3)) * (1 + Math.sin(pop * Math.PI) * 0.2))
      entry.rise = p * 0.18
      const o = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25
      shellMat.opacity = o
      dotMat.opacity = o
    }, { ease: t => t, onDone: () => removeBubble(entry) })
  }

  function removeBubble(entry) {
    scene.remove(entry.group)
    entry.mats.forEach(m => m.dispose())
    const i = bubbles.indexOf(entry)
    if (i >= 0) bubbles.splice(i, 1)
  }

  /** Drop any live greeting bubbles — called when a real dialogue opens, so
      the 3D bubble and the DOM bubble are never on screen together. */
  function clearNpcBubbles() {
    bubbles.slice().forEach(removeBubble)
  }

  /**
   * Billboard live effects and keep NPC bubbles glued to their walker.
   * @param {number} t — world elapsed seconds, drives the dot bounce
   */
  function update(t = 0) {
    for (const s of symbols) s.quaternion.copy(camera.quaternion)
    for (const b of bubbles) {
      b.group.quaternion.copy(camera.quaternion)
      b.anchor.getWorldPosition(_wp)
      b.group.position.set(_wp.x, _wp.y + b.topY + b.rise, _wp.z)
      b.dots.forEach((d, i) => { d.position.y = Math.sin(t * 7 - i * 0.8) * 0.035 })
    }
  }

  function dispose() {
    disposed = true
    // Claim everything this module made rather than leaving live effects for
    // world.js's teardown traverse: the traverse would double-dispose the
    // shared particle geometry, and would miss it entirely when no burst
    // happens to be in flight.
    symbols.forEach(s => {
      scene.remove(s)
      if (s.children[0]) s.children[0].material.dispose()
    })
    symbols.length = 0
    bursts.forEach(({ parts, mats }) => {
      parts.forEach(q => scene.remove(q.mesh))
      mats.forEach(m => m.dispose())
    })
    bursts.length = 0
    clearNpcBubbles()
    geoCache.forEach(list => list.forEach(({ geo }) => geo.dispose()))
    geoCache.clear()
    partGeo.forEach(g => g.dispose())
    partGeo.clear()
    if (bubbleGeo) { bubbleGeo.dispose(); bubbleGeo = null }
    if (dotGeo) { dotGeo.dispose(); dotGeo = null }
  }

  return { playReaction, playNpcBubble, clearNpcBubbles, update, dispose }
}
