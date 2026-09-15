/**
 * Farm World — string lights.
 *
 * Lights straddling the walking-path edges, blinking rainbow lights over the
 * landmark tree's canopy, and a set on each station's own structures that
 * switches on in animated rainbow once the station is restored.
 *
 * These are NOT real lights. The scene runs on exactly two (a hemisphere and
 * one shadow-casting directional), and every added PointLight would force a
 * shader recompile across every Lambert material in the world plus per-fragment
 * cost on the kiosk's integrated graphics. Instead each bulb is an unlit
 * MeshBasicMaterial sphere, which against a dark night scene reads as a light
 * without illuminating anything. The whole world's bulbs — several hundred —
 * live in ONE InstancedMesh, so the entire system is a single draw call.
 *
 * Per-instance color carries both the bulb hue and its day/night level, so day
 * and night are a color lerp toward `OFF` rather than a second material.
 */

import * as THREE from 'three'

const MAX_BULBS = 800
const BULB_R = 0.075

// Classic warm string-light palette. Deliberately NOT multicolor: the restored
// stations are the only rainbow in the world, so they stay the payoff.
const WARM = [0xfff2cf, 0xffe1a3, 0xfff8e8, 0xffd894]

// An unlit bead in daylight. Bulbs lerp between this and their lit color.
const OFF = new THREE.Color(0x9a9282)

const RAINBOW_SAT = 0.88
const RAINBOW_LIGHT = 0.6
const RAINBOW_SPEED = 0.14 // hue circles per second

// Warm bulbs are dull beads by day and full glow at night; the rainbow on a
// restored station stays bright in both, since it is a reward, not scenery.
const WARM_DAY = 0.3
const RAINBOW_DAY = 0.62

// Blinking bulbs (the landmark tree): each cycles at its own rate and phase and
// drops to a low glow while its sine is below BLINK_OFF_BELOW, about 40% of
// each cycle. Rates stay near one blink a second, well under the
// three-flashes-a-second photosensitivity guideline, and the staggered phases
// keep them from flashing in unison.
const BLINK_HZ_MIN = 0.5
const BLINK_HZ_MAX = 1.1
const BLINK_OFF_BELOW = -0.3
const BLINK_OFF_LEVEL = 0.12

const _d = new THREE.Object3D()
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const _c = new THREE.Color()
const _lit = new THREE.Color()

/**
 * @param {object} opts
 * @param {THREE.Scene} opts.scene
 * @param {Function} opts.tween — world.js's tween(dur, onUpdate, opts)
 */
export function createLightStrings({ scene, tween }) {
  const geo = new THREE.SphereGeometry(BULB_R, 6, 5)
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const mesh = new THREE.InstancedMesh(geo, material, MAX_BULBS)
  mesh.count = 0
  // Assigned before the first render so the shader picks up the instancing-color
  // define; setting it later would need material.needsUpdate.
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_BULBS * 3), 3)
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  // Bulbs span both islands, so the bounds are effectively the whole world and
  // culling would never pay for itself.
  mesh.frustumCulled = false
  mesh.castShadow = false
  mesh.receiveShadow = false
  scene.add(mesh)

  const bulbs = []            // every bulb, in instance order
  const liveBulbs = []        // repainted every frame: rainbow or blinking
  const stationStrings = new Map() // stationId → { bulbs, lit }
  let nightP = 0
  let colorDirty = true
  let disposed = false
  let warnedFull = false

  function writeMatrix(b) {
    _d.position.set(b.px, b.py, b.pz)
    _d.scale.setScalar(b.s * b.on)
    _d.rotation.set(0, 0, 0)
    _d.updateMatrix()
    mesh.setMatrixAt(b.i, _d.matrix)
  }

  /**
   * Add bulbs at the given world-space points.
   * @param {Array<{x:number,y:number,z:number}>} points
   * @param {object} [opts]
   * @param {boolean} [opts.on] — false starts the bulb dark and zero-scaled
   * @param {boolean} [opts.rainbow] — animated hue instead of a warm bulb
   * @param {number} [opts.scale]
   * @param {number} [opts.dim] — 0..1 brightness multiplier, for strands that
   *   should read quieter than the station rainbows
   * @param {number[]} [opts.hues] — per-point starting hue, parallel to
   *   `points`. Without it the hue spreads evenly across the strand, which is
   *   wrong when consecutive points are a left/right pair that should match.
   * @param {boolean} [opts.blink] — each bulb blinks at its own rate and phase
   * @returns {Array} the bulb records, for later switch-on
   */
  function addBulbs(points, { on = true, rainbow = false, scale = 1, dim = 1, hues = null, blink = false } = {}) {
    const made = []
    points.forEach((p, k) => {
      if (mesh.count >= MAX_BULBS) {
        // Silent truncation would drop lights off whichever island is built
        // last, which is a confusing thing to debug from the symptom.
        if (!warnedFull) {
          warnedFull = true
          console.warn(`[farm-world] string lights hit the ${MAX_BULBS}-bulb cap; raise MAX_BULBS`)
        }
        return
      }
      const b = {
        i: mesh.count++,
        px: p.x, py: p.y, pz: p.z,
        s: scale * (0.85 + Math.random() * 0.3),
        on: on ? 1 : 0,
        rainbow,
        dim,
        blink,
        blinkRate: blink ? Math.PI * 2 * (BLINK_HZ_MIN + Math.random() * (BLINK_HZ_MAX - BLINK_HZ_MIN)) : 0,
        blinkPhase: Math.random() * Math.PI * 2,
        warm: WARM[(k + bulbs.length) % WARM.length],
        // spread hue along the strand so a string reads as a travelling rainbow
        // fall back if `hues` is short: a missing entry would reach setHSL as
        // NaN and paint the bulb black, which is a baffling symptom to chase
        hue0: hues && hues[k] != null ? hues[k] : k / Math.max(1, points.length),
      }
      bulbs.push(b)
      made.push(b)
      writeMatrix(b)
      if (rainbow || blink) liveBulbs.push(b)
    })
    mesh.instanceMatrix.needsUpdate = true
    colorDirty = true
    return made
  }

  /** Register a station's ring, dark until the station is restored. */
  function addStationString(id, points) {
    stationStrings.set(id, { bulbs: addBulbs(points, { on: false }), lit: false })
  }

  /**
   * Switch a restored station's ring on: bulbs chase alight around the ring,
   * then stay on as an animated rainbow.
   */
  function lightStation(id) {
    const st = stationStrings.get(id)
    if (disposed || !st || st.lit) return
    st.lit = true
    const n = st.bulbs.length
    st.bulbs.forEach(b => {
      b.rainbow = true
      liveBulbs.push(b)
    })
    colorDirty = true
    tween(0.9, p => {
      st.bulbs.forEach((b, k) => {
        b.on = Math.min(1, Math.max(0, p * (n + 2) - k))
        writeMatrix(b)
      })
      mesh.instanceMatrix.needsUpdate = true
    }, { ease: t => t })
  }

  /** Day/night blend, 0 = day, 1 = night. Driven by setTimeOfDay's tween. */
  function setNight(p) {
    nightP = p
    colorDirty = true
  }

  function paint(b, t) {
    // `dim` scales how far the bulb lerps off the unlit grey, so a quieter
    // strand desaturates toward the bead color instead of just going darker.
    let level
    if (b.rainbow) {
      _lit.setHSL((b.hue0 + t * RAINBOW_SPEED) % 1, RAINBOW_SAT, RAINBOW_LIGHT)
      level = (RAINBOW_DAY + (1 - RAINBOW_DAY) * nightP) * b.dim
    } else {
      _lit.setHex(b.warm)
      level = (WARM_DAY + (1 - WARM_DAY) * nightP) * b.dim
    }
    if (b.blink && Math.sin(t * b.blinkRate + b.blinkPhase) < BLINK_OFF_BELOW) level *= BLINK_OFF_LEVEL
    _c.lerpColors(OFF, _lit, clamp01(level))
    mesh.instanceColor.setXYZ(b.i, _c.r, _c.g, _c.b)
  }

  /**
   * Repaint animating bulbs. Warm bulbs only need a repaint when the day/night
   * level moves, so the steady-state cost is the rainbow and blinking subset.
   * @param {number} t — world elapsed seconds
   */
  function update(t) {
    if (disposed) return
    // plain loops: this runs every frame, and forEach would allocate a closure
    if (colorDirty) {
      for (let i = 0; i < bulbs.length; i++) paint(bulbs[i], t)
      colorDirty = false
    } else if (liveBulbs.length) {
      for (let i = 0; i < liveBulbs.length; i++) paint(liveBulbs[i], t)
    } else {
      return
    }
    mesh.instanceColor.needsUpdate = true
  }

  function dispose() {
    disposed = true
    // Claim the mesh rather than leaving it for world.js's teardown traverse,
    // which would dispose the same geometry and material a second time.
    scene.remove(mesh)
    mesh.dispose()
    geo.dispose()
    material.dispose()
    bulbs.length = 0
    liveBulbs.length = 0
    stationStrings.clear()
  }

  return { addBulbs, addStationString, lightStation, setNight, update, dispose }
}

/** Evenly spaced points on a circle — bank, rim, and cap rings on the stations. */
export function ring(cx, cz, r, y, count, phase = 0) {
  const pts = []
  for (let k = 0; k < count; k++) {
    const a = phase + (k / count) * Math.PI * 2
    pts.push({ x: cx + Math.cos(a) * r, y, z: cz + Math.sin(a) * r })
  }
  return pts
}
