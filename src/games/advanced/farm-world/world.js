/**
 * Farm World — 3D scene, player character, and animation loop.
 *
 * All geometry is procedural (three.js primitives): no textures, no image
 * assets, in keeping with the Advanced Mode no-image rule. Low-poly, flat
 * shaded, pastel — inspired by Merci-Michel's Coastal World.
 *
 * The module exposes one factory, `createFarmWorld`, which owns the renderer,
 * scene and RAF loop, and hands back a small facade (dispose / upgradeStation /
 * setMovementEnabled). The DOM shell, HUD and quiz flow live in index.js.
 */

import * as THREE from 'three'
import { createProceduralCharacter } from './procedural-character.js'
import { NPCS } from '../../../data/content/advanced/farm-world-npcs.js'

// ─── Palette ───

const C = {
  // Coastal World-style pastels: vivid grass, bright cyan sky/sea, pale
  // concrete paths, sandy island cliffs, candy-colored accent trees.
  sky: 0x7fd4f5,
  grass: 0x77cb51,
  grassDark: 0x68bb45,
  sand: 0xe9d3a0,
  sandDark: 0xd9bd82,
  dirtDark: 0x6e4a33,
  soil: 0x8a6244,
  soilRidge: 0x97704f,
  soilRich: 0x3b2a1c,
  soilPale: 0xa89272,
  path: 0xdedbd1,
  barnRed: 0xe96f56,
  roof: 0x5b6b8c,
  trim: 0xfaf6ec,
  silo: 0xe8eef2,
  tractorGreen: 0x44b85c,
  wheel: 0x2b2b33,
  hub: 0xd8d8d8,
  glass: 0xcfeef5,
  water: 0x35b1e8,
  trunk: 0x9a7451,
  deadwood: 0x6e5b4a,
  foliage: [0x5cc257, 0x7ad35e, 0x49ae4e],
  accentFoliage: [0xf0955c, 0xe87fae, 0xf2c94e], // orange / pink / yellow trees
  pine: 0x3da45c,
  rock: 0xc4c4cc,
  cowWhite: 0xf5f2ea,
  cowBlack: 0x3a3a3f,
  cowNose: 0xe8a3a0,
  chickenBody: 0xf3ede2,
  chickenComb: 0xdd5b4e,
  chickenBeak: 0xf0a83c,
  pigBody: 0xe6a6ad,
  pigSnout: 0xd98a94,
  pigHoof: 0x6b4f47,
  hay: 0xe0c068,
  tipi: 0xe8dcc4,
  tipiBand: 0xc06040,
  corn: 0x6fbe5e,
  tassel: 0xf2d54a,
  squash: 0xe8963c,
  flowerPink: 0xe87fb0,
  flowerYellow: 0xf2d54a,
  cattail: 0x6b4f2f,
  stubble: 0xcbb089,
  rust: 0x8a4b32,
  suit: 0xb9b0e6,   // mascot body — lavender
  beanie: 0xf2cf3e, // mascot beanie — yellow
  shoe: 0x4a7fe0,   // mascot shoes — blue
  pack: 0x5a8ff0,   // mascot backpack
  beacon: 0x38cebc,       // --adv-accent
  beaconDone: 0xb8e84a,   // --adv-accent-secondary
  sun: 0xfff3b0,
  cloud: 0xffffff,
  // trail-island station accents
  prairieGold: 0xcaa94e,  // tallgrass prairie strips
  bufferGreen: 0x4e9e57,  // buffer / cover vegetation
  algae: 0x74a03a,        // algae-choked runoff (pre)
  ochreY: 0xe0a83c,       // iron-oxide ochre — yellow
  ochreR: 0xb5502e,       // ochre — red
  ochreBrown: 0x7d4a2e,   // ochre — brown
  adobe: 0xcf9866,        // adobe / rammed earth
  pottery: 0x9c5a3c,      // onggi / clay vessels
  charcoal: 0x453f3a,     // charcoal-black pigment (soil-art palette)
  labWall: 0xeef1ee,      // research cabin walls
  metal: 0x9aa0ad,        // instrument metal
  salt: 0xe6e3da,         // salt crust (pre)
  gypsum: 0xdcdfe4,       // gypsum remediation piles
  solar: 0x2b3a5c,        // solar panel / antenna plate
  sensorOrange: 0xe8873c, // sensor instrument housing
  flowerWhite: 0xf3f0e8,  // second scatter flower color
}

// ─── Small builders ───

const matCache = new Map()
function mat(color, opts) {
  if (!opts) {
    if (!matCache.has(color)) {
      matCache.set(color, new THREE.MeshLambertMaterial({ color, flatShading: true }))
    }
    return matCache.get(color)
  }
  return new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts })
}

function setShadow(mesh, cast = true, receive = false) {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  return mesh
}

function place(mesh, x = 0, y = 0, z = 0, ry = 0) {
  mesh.position.set(x, y, z)
  if (ry) mesh.rotation.y = ry
  return mesh
}

function box(w, h, d, color, opts) {
  return setShadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)))
}

function cyl(rTop, rBot, h, color, seg = 12, opts) {
  return setShadow(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat(color, opts)))
}

function cone(r, h, color, seg = 8) {
  return setShadow(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color)))
}

function sph(r, color, seg = 8, opts) {
  return setShadow(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), mat(color, opts)))
}

function flatDisc(r, color, seg = 24) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, seg), mat(color))
  m.rotation.x = -Math.PI / 2
  m.receiveShadow = true
  return m
}

/** Instanced copies of one geometry. transforms: [{x,y,z,ry,s,sx,sy,sz}] */
function instanced(geo, color, transforms) {
  const m = new THREE.InstancedMesh(geo, mat(color), transforms.length)
  const d = new THREE.Object3D()
  transforms.forEach((tr, i) => {
    d.position.set(tr.x || 0, tr.y || 0, tr.z || 0)
    d.rotation.set(0, tr.ry || 0, 0)
    const s = tr.s != null ? tr.s : 1
    d.scale.set(tr.sx != null ? tr.sx : s, tr.sy != null ? tr.sy : s, tr.sz != null ? tr.sz : s)
    d.updateMatrix()
    m.setMatrixAt(i, d.matrix)
  })
  m.castShadow = true
  return m
}

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ─── Props ───

function makeTree(scale = 1, color = null) {
  const g = new THREE.Group()
  g.add(place(cyl(0.18, 0.26, 1.4, C.trunk, 7), 0, 0.7, 0))
  const c = color || pick(C.foliage)
  g.add(place(sph(1.05, c, 7), 0, 2.1, 0))
  g.add(place(sph(0.7, c, 6), rand(-0.5, 0.5), 2.8, rand(-0.4, 0.4)))
  g.scale.setScalar(scale)
  return g
}

function makePine(scale = 1) {
  const g = new THREE.Group()
  g.add(place(cyl(0.14, 0.2, 1.0, C.trunk, 6), 0, 0.5, 0))
  g.add(place(cone(1.0, 1.5, C.pine, 8), 0, 1.6, 0))
  g.add(place(cone(0.75, 1.3, C.pine, 8), 0, 2.5, 0))
  g.add(place(cone(0.5, 1.1, C.pine, 8), 0, 3.3, 0))
  g.scale.setScalar(scale)
  return g
}

/**
 * Landmark rainbow tree — a grand pastel-rainbow canopy on a stout trunk,
 * planted once at the far end of the trail island as a reward-in-the-distance.
 * Same low-poly blob language as makeTree, just bigger and technicolor.
 */
function makeRainbowTree() {
  const g = new THREE.Group()
  // stout trunk + root flares
  g.add(place(cyl(0.55, 0.85, 4.6, C.trunk, 9), 0, 2.3, 0))
  for (let i = 0; i < 4; i++) {
    const holder = new THREE.Group()
    holder.rotation.y = (i * Math.PI * 2) / 4 + 0.4
    const root = cyl(0.14, 0.34, 1.4, C.trunk, 6)
    root.position.set(0.8, 0.45, 0)
    root.rotation.z = 0.55
    holder.add(root)
    g.add(holder)
  }
  const RAINBOW = [0xe0596e, 0xf0955c, 0xf2d54a, 0x5cc257, 0x38cebc, 0x5a8ff0, 0x8f6ae0, 0xe87fae]
  let ci = 0
  const blobRing = (n, ringR, y, blobR, offset) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + offset
      g.add(place(sph(blobR * rand(0.9, 1.1), RAINBOW[ci++ % RAINBOW.length], 8),
        Math.cos(a) * ringR, y + rand(-0.15, 0.15), Math.sin(a) * ringR))
    }
  }
  blobRing(6, 1.9, 4.7, 1.15, 0)   // bottom dome ring
  blobRing(4, 1.2, 6.0, 1.0, 0.5)  // upper ring
  g.add(place(sph(0.95, RAINBOW[ci % RAINBOW.length], 8), 0, 7.0, 0)) // crown
  // fallen petals dotting the grass under the canopy
  const petalT = []
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2), r = rand(1.4, 3.0)
    petalT.push({ x: Math.cos(a) * r, y: 0.06, z: Math.sin(a) * r, s: rand(0.5, 0.9) })
  }
  RAINBOW.slice(0, 3).forEach((c, i) => {
    const petals = instanced(new THREE.SphereGeometry(0.12, 6, 5), c, petalT.filter((_, pi) => pi % 3 === i))
    petals.castShadow = false
    g.add(petals)
  })
  return g
}

function makeDeadTree() {
  const g = new THREE.Group()
  g.add(place(cyl(0.12, 0.22, 2.2, C.deadwood, 6), 0, 1.1, 0))
  const b1 = place(cyl(0.06, 0.1, 1.2, C.deadwood, 5), 0.35, 2.2, 0)
  b1.rotation.z = -0.7
  const b2 = place(cyl(0.05, 0.09, 1.0, C.deadwood, 5), -0.3, 1.9, 0.1)
  b2.rotation.z = 0.85
  g.add(b1, b2)
  return g
}

function makeRock(scale = 1) {
  const m = setShadow(new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), mat(C.rock)))
  m.scale.set(scale, scale * rand(0.55, 0.8), scale)
  m.rotation.y = rand(0, Math.PI)
  return m
}

function makeCloud() {
  // pure-white unlit puffs — Coastal World clouds have no shading
  const g = new THREE.Group()
  const m = new THREE.MeshBasicMaterial({ color: C.cloud })
  const n = 4 + Math.floor(Math.random() * 3)
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(rand(1.6, 3.0), 7, 6), m)
    s.position.set(i * rand(1.5, 2.2) - n, rand(-0.3, 0.5), rand(-1.0, 1.0))
    s.scale.y = 0.55
    g.add(s)
  }
  return g
}

function makeCow(scale = 1) {
  const g = new THREE.Group()
  g.add(place(box(1.5, 0.9, 0.8, C.cowWhite), 0, 0.95, 0))
  // patches
  g.add(place(box(0.5, 0.5, 0.82, C.cowBlack), 0.35, 1.1, 0))
  g.add(place(box(0.4, 0.4, 0.82, C.cowBlack), -0.45, 0.85, 0))
  // head
  const head = new THREE.Group()
  head.position.set(0.95, 1.15, 0)
  head.add(place(box(0.55, 0.5, 0.5, C.cowWhite), 0, 0, 0))
  head.add(place(box(0.2, 0.22, 0.42, C.cowNose), 0.3, -0.12, 0))
  head.add(place(box(0.08, 0.18, 0.2, C.cowWhite), -0.1, 0.32, 0.3))
  head.add(place(box(0.08, 0.18, 0.2, C.cowBlack), -0.1, 0.32, -0.3))
  g.add(head)
  g.userData.head = head
  // legs
  ;[[0.55, 0.28], [0.55, -0.28], [-0.55, 0.28], [-0.55, -0.28]].forEach(([x, z]) => {
    g.add(place(cyl(0.1, 0.1, 0.55, C.cowBlack, 6), x, 0.28, z))
  })
  // tail — hangs off the rear, swishes in the frame loop
  const tail = new THREE.Group()
  tail.position.set(-0.78, 1.3, 0)
  tail.add(place(cyl(0.035, 0.03, 0.5, C.cowWhite, 5), 0, -0.25, 0))
  tail.add(place(sph(0.08, C.cowBlack, 6), 0, -0.52, 0))
  g.add(tail)
  g.userData.tail = tail
  g.scale.setScalar(scale)
  return g
}

// A plump box-style chicken in the same low-poly aesthetic as the cow. `head`
// (comb + wattle + beak) dips to peck while grazing; `tail` feathers swish —
// both driven by updateCow via the userData hooks.
function makeChicken(scale = 1) {
  const g = new THREE.Group()
  g.add(place(box(0.5, 0.42, 0.36, C.chickenBody), 0, 0.42, 0)) // body
  // upswept tail feathers
  const tail = new THREE.Group()
  tail.position.set(-0.26, 0.55, 0)
  const tf = place(box(0.26, 0.3, 0.28, C.chickenBody), -0.04, 0.02, 0)
  tf.rotation.z = 0.7
  tail.add(tf)
  g.add(tail)
  g.userData.tail = tail
  // head on a short neck
  const head = new THREE.Group()
  head.position.set(0.24, 0.62, 0)
  head.add(place(box(0.26, 0.26, 0.24, C.chickenBody), 0, 0, 0))
  head.add(place(box(0.06, 0.12, 0.18, C.chickenComb), 0.02, 0.2, 0))  // comb
  head.add(place(box(0.05, 0.1, 0.08, C.chickenComb), 0.13, -0.14, 0)) // wattle
  head.add(place(box(0.15, 0.08, 0.1, C.chickenBeak), 0.18, 0, 0))     // beak
  g.add(head)
  g.userData.head = head
  ;[[0.05, 0.1], [0.05, -0.1]].forEach(([x, z]) => {
    g.add(place(cyl(0.03, 0.03, 0.3, C.chickenBeak, 5), x, 0.15, z)) // legs
  })
  g.scale.setScalar(scale)
  return g
}

// A stout box-style pig. `head` (with darker snout) roots the ground while
// grazing; `tail` gives a little curl-wag. Same updateCow hooks as the cow.
function makePig(scale = 1) {
  const g = new THREE.Group()
  g.add(place(box(1.05, 0.62, 0.62, C.pigBody), 0, 0.62, 0))  // barrel body
  g.add(place(box(0.5, 0.56, 0.58, C.pigBody), -0.4, 0.6, 0)) // rump
  // head + snout + ears
  const head = new THREE.Group()
  head.position.set(0.62, 0.66, 0)
  head.add(place(box(0.46, 0.44, 0.46, C.pigBody), 0, 0, 0))
  head.add(place(box(0.16, 0.18, 0.24, C.pigSnout), 0.28, -0.06, 0))    // snout
  head.add(place(box(0.06, 0.14, 0.14, C.pigBody), -0.02, 0.26, 0.16))  // ear
  head.add(place(box(0.06, 0.14, 0.14, C.pigBody), -0.02, 0.26, -0.16)) // ear
  g.add(head)
  g.userData.head = head
  // curly tail
  const tail = new THREE.Group()
  tail.position.set(-0.62, 0.78, 0)
  tail.add(place(cyl(0.04, 0.04, 0.24, C.pigBody, 5), 0, 0, 0))
  g.add(tail)
  g.userData.tail = tail
  ;[[0.42, 0.22], [0.42, -0.22], [-0.42, 0.22], [-0.42, -0.22]].forEach(([x, z]) => {
    g.add(place(cyl(0.1, 0.09, 0.34, C.pigHoof, 6), x, 0.2, z)) // stubby legs
  })
  g.scale.setScalar(scale)
  return g
}

/**
 * Ambient cow behavior: a tiny state machine per cow (idle / graze / walk)
 * driving head dips, tail swishes, an amble-bob and slow wandering. Positions
 * are in the pasture's local space; `bounds` keeps the cow inside the fence.
 * Cows flagged `ai.still` (the calf) never wander.
 */
function updateCow(cow, bounds, dt, t) {
  const u = cow.userData
  const ai = u.ai
  if (!ai) return
  ai.timer -= dt
  if (ai.timer <= 0) {
    const r = Math.random()
    ai.mode = r < 0.4 ? 'idle' : r < 0.75 ? 'graze' : 'walk'
    if (ai.still && ai.mode === 'walk') ai.mode = 'graze'
    ai.timer = ai.mode === 'walk' ? rand(2, 5) : rand(2.5, 6)
    if (ai.mode === 'walk') ai.heading = rand(0, Math.PI * 2)
  }

  // head: dip and nibble while grazing, lazy sway otherwise
  const headTarget = ai.mode === 'graze'
    ? -0.55 + Math.sin(t * 7 + u.phase) * 0.05
    : Math.sin(t * 0.8 + u.phase) * 0.12
  u.head.rotation.z += (headTarget - u.head.rotation.z) * Math.min(1, dt * 5)

  // tail swish — livelier while grazing (swatting flies)
  u.tail.rotation.x = Math.sin(t * (ai.mode === 'graze' ? 4.5 : 2.2) + u.phase) * 0.3

  if (ai.mode === 'walk') {
    const speed = u.speed ?? 0.55
    const nx = cow.position.x + Math.cos(ai.heading) * speed * dt
    const nz = cow.position.z + Math.sin(ai.heading) * speed * dt
    // bounds are either a rectangular pasture fence ({w,d}, group-local) or a
    // circular island region ({cx,cz,r}, world space) for free roamers
    const out = bounds.r != null
      ? Math.hypot(nx - bounds.cx, nz - bounds.cz) > bounds.r
      : (Math.abs(nx) > bounds.w || Math.abs(nz) > bounds.d)
    if (out) {
      // turn back toward the middle of the region
      ai.heading = bounds.r != null
        ? Math.atan2(bounds.cz - cow.position.z, bounds.cx - cow.position.x) + rand(-0.5, 0.5)
        : Math.atan2(-cow.position.z, -cow.position.x) + rand(-0.5, 0.5)
    } else {
      cow.position.x = nx
      cow.position.z = nz
    }
    // face travel direction (model faces +x) and amble-bob
    let dr = -ai.heading - cow.rotation.y
    while (dr > Math.PI) dr -= Math.PI * 2
    while (dr < -Math.PI) dr += Math.PI * 2
    cow.rotation.y += dr * Math.min(1, dt * 3)
    cow.position.y = Math.abs(Math.sin(t * 5 + u.phase)) * 0.04
  } else {
    cow.position.y += (0 - cow.position.y) * Math.min(1, dt * 5)
  }
}

/**
 * Procedural-doll walk cycle, shared by the player doll and the NPCs. `limbs`
 * are the shoulder/hip pivots; `carrier` is the scaled holder group that bobs
 * (and stashes walkT). While moving, limbs swing and the body bobs; idle, they
 * settle to neutral with a gentle breathing bob. `amp` scales the limb arcs
 * and `freq` the cycle rate — the slow-strolling NPCs use gentler values so
 * their arms/legs don't windmill at player-sprint intensity.
 */
function stepGait(limbs, carrier, moving, dt, t, { phase = 0, amp = 1, freq = 10.5 } = {}) {
  if (moving) {
    carrier.userData.walkT = (carrier.userData.walkT || 0) + dt * freq
    const s = Math.sin(carrier.userData.walkT)
    limbs.legL.rotation.x = s * 0.65 * amp
    limbs.legR.rotation.x = -s * 0.65 * amp
    limbs.armL.rotation.x = -s * 0.5 * amp
    limbs.armR.rotation.x = s * 0.5 * amp
    carrier.position.y = Math.abs(s) * 0.05 * amp
    carrier.rotation.x = 0.05 // slight forward lean
  } else {
    const settle = Math.min(1, dt * 8)
    ;[limbs.legL, limbs.legR, limbs.armL, limbs.armR].forEach(p => { p.rotation.x -= p.rotation.x * settle })
    carrier.rotation.x -= carrier.rotation.x * settle
    carrier.position.y += (0.02 + Math.sin(t * 2.2 + phase) * 0.02 - carrier.position.y) * settle
  }
}

function makeBarn() {
  const g = new THREE.Group()
  g.add(place(box(7, 4.2, 5.5, C.barnRed), 0, 2.1, 0))
  // gable roof: a 45°-rotated box whose lower half hides in the walls
  const roof = box(4.6, 4.6, 7.6, C.roof)
  roof.rotation.z = Math.PI / 4
  roof.rotation.y = Math.PI / 2
  place(roof, 0, 4.2, 0)
  g.add(roof)
  // door + trim
  g.add(place(box(2.2, 2.6, 0.12, C.trim), 0, 1.3, 2.78))
  g.add(place(box(2.0, 2.4, 0.06, C.dirtDark), 0, 1.2, 2.85))
  g.add(place(box(7.2, 0.3, 5.7, C.trim), 0, 0.15, 0))
  return g
}

function makeSilo() {
  const g = new THREE.Group()
  g.add(place(cyl(1.6, 1.6, 6.5, C.silo, 14), 0, 3.25, 0))
  g.add(place(sph(1.6, C.barnRed, 14), 0, 6.5, 0))
  g.add(place(cyl(1.66, 1.66, 0.25, C.barnRed, 14), 0, 2.2, 0))
  return g
}

function makeWindmill() {
  const g = new THREE.Group()
  g.add(place(cyl(0.3, 0.85, 7.5, 0x9aa0ad, 7), 0, 3.75, 0))
  const rotor = new THREE.Group()
  rotor.position.set(0, 7.6, 0.55)
  rotor.add(place(sph(0.32, C.roof, 8), 0, 0, 0.1))
  for (let i = 0; i < 4; i++) {
    const blade = box(0.16, 2.4, 0.05, C.trim)
    blade.position.set(Math.sin((i * Math.PI) / 2) * 1.25, Math.cos((i * Math.PI) / 2) * 1.25, 0)
    blade.rotation.z = -(i * Math.PI) / 2
    rotor.add(blade)
  }
  g.add(rotor)
  g.userData.rotor = rotor
  return g
}

function makeCattail() {
  const g = new THREE.Group()
  g.add(place(cyl(0.03, 0.04, 1.1, 0x5fae54, 5), 0, 0.55, 0))
  g.add(place(cyl(0.09, 0.09, 0.38, C.cattail, 6), 0, 1.2, 0))
  return g
}

function makeSign() {
  const g = new THREE.Group()
  g.add(place(box(0.18, 1.8, 0.18, C.trunk), -1.0, 0.9, 0))
  g.add(place(box(0.18, 1.8, 0.18, C.trunk), 1.0, 0.9, 0))
  g.add(place(box(2.7, 1.15, 0.14, 0xb08a5e), 0, 1.55, 0))
  g.add(place(box(2.2, 0.16, 0.16, C.tractorGreen), 0, 1.75, 0.02))
  g.add(place(box(1.6, 0.12, 0.16, C.trim), 0, 1.42, 0.02))
  return g
}

function makeFlag() {
  const g = new THREE.Group()
  g.add(place(cyl(0.06, 0.09, 6, 0x9aa0ad, 6), 0, 3, 0))
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(2.0, -0.35)
  shape.lineTo(0, -0.7)
  const pennant = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshLambertMaterial({ color: C.beacon, side: THREE.DoubleSide })
  )
  pennant.position.set(0.05, 5.9, 0)
  g.add(pennant)
  return g
}

function makeTrough() {
  const g = new THREE.Group()
  g.add(place(box(1.9, 0.5, 0.9, 0x7d8896), 0, 0.25, 0))
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.7), mat(C.water))
  water.rotation.x = -Math.PI / 2
  water.position.y = 0.46
  g.add(water)
  return g
}

function makeCorn() {
  const g = new THREE.Group()
  g.add(place(cyl(0.05, 0.07, 1.5, C.corn, 5), 0, 0.75, 0))
  const l1 = place(cone(0.3, 0.7, C.corn, 4), 0.2, 0.8, 0)
  l1.rotation.z = -1.1
  const l2 = place(cone(0.28, 0.65, C.corn, 4), -0.2, 1.0, 0)
  l2.rotation.z = 1.1
  g.add(l1, l2)
  g.add(place(cone(0.07, 0.4, C.tassel, 5), 0, 1.65, 0))
  return g
}

function makeSquash() {
  const g = new THREE.Group()
  const s1 = place(sph(0.28, C.squash, 8), 0.15, 0.16, 0.1)
  s1.scale.y = 0.7
  const s2 = place(sph(0.2, C.squash, 8), -0.25, 0.12, -0.15)
  s2.scale.y = 0.7
  g.add(s1, s2)
  g.add(place(flatDisc(0.45, pick(C.foliage), 7), -0.05, 0.05, 0.25))
  return g
}

function makeBeanPole() {
  const g = new THREE.Group()
  g.add(place(cyl(0.04, 0.04, 1.4, C.trunk, 5), 0, 0.7, 0))
  g.add(place(sph(0.22, 0x5fae54, 6), 0.05, 0.7, 0.05))
  g.add(place(sph(0.18, 0x6fbe5e, 6), -0.08, 1.05, -0.05))
  return g
}

function makeBeacon() {
  const g = new THREE.Group()

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.09, 8, 28),
    new THREE.MeshLambertMaterial({ color: C.beacon, emissive: C.beacon, emissiveIntensity: 0.55 })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.14
  g.add(ring)

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 3.4, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: C.beacon, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide })
  )
  glow.position.y = 1.8
  g.add(glow)

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42),
    new THREE.MeshLambertMaterial({ color: C.beacon, emissive: C.beacon, emissiveIntensity: 0.7 })
  )
  gem.position.y = 3.4
  g.add(gem)

  g.userData = { ring, glow, gem, gemBaseY: 3.4, phase: rand(0, Math.PI * 2) }
  return g
}

function makeTractor() {
  const g = new THREE.Group()
  // body — built facing +z
  g.add(place(box(1.6, 0.85, 2.6, C.tractorGreen), 0, 1.05, 0))
  g.add(place(box(1.3, 0.5, 1.1, C.tractorGreen), 0, 1.55, 0.65)) // hood
  g.add(place(box(1.45, 1.05, 1.15, C.glass, { transparent: true, opacity: 0.55 }), 0, 2.05, -0.55)) // cabin
  g.add(place(box(1.55, 0.14, 1.3, C.tractorGreen), 0, 2.62, -0.55)) // cabin roof
  g.add(place(cyl(0.07, 0.09, 0.7, C.wheel, 6), 0.45, 2.0, 1.0)) // exhaust
  g.add(place(box(0.3, 0.18, 0.1, C.tassel), 0.45, 1.45, 1.32)) // headlight
  g.add(place(box(0.3, 0.18, 0.1, C.tassel), -0.45, 1.45, 1.32))

  const wheels = []
  const mkWheel = (r, w, x, z) => {
    const wheel = new THREE.Group()
    const tire = cyl(r, r, w, C.wheel, 12)
    tire.rotation.z = Math.PI / 2
    const hubcap = cyl(r * 0.45, r * 0.45, w + 0.06, C.hub, 8)
    hubcap.rotation.z = Math.PI / 2
    wheel.add(tire, hubcap)
    wheel.position.set(x, r, z)
    g.add(wheel)
    wheels.push({ group: wheel, r })
  }
  mkWheel(0.78, 0.5, 0.95, -0.75)
  mkWheel(0.78, 0.5, -0.95, -0.75)
  mkWheel(0.5, 0.4, 0.85, 1.0)
  mkWheel(0.5, 0.4, -0.85, 1.0)

  g.userData.wheels = wheels
  return g
}

/**
 * The player — a Coastal World-style mascot: blob body, hat, shoes and
 * backpack. Built facing +z. Limb pivots and the bobbing body group live on
 * userData for the walk cycle; recolorable materials and the hat variants
 * live on userData.mats / userData.hats for the customizer. The recolorable
 * parts use dedicated material instances (never the shared matCache ones) so
 * changing their color can't repaint the rest of the world.
 */
function makeFarmer() {
  const g = new THREE.Group()
  const bodyG = new THREE.Group() // everything above the legs bobs as one
  g.add(bodyG)

  const bodyMat = mat(C.suit, {})
  const hatMat = mat(C.beanie, {})
  const shoeMat = mat(C.shoe, {})
  const packMat = mat(C.pack, {})

  // teardrop blob body
  const body = setShadow(new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 12), bodyMat))
  body.scale.set(0.8, 1.3, 0.7)
  body.position.y = 1.02
  bodyG.add(body)

  // face — two dot eyes on the upper front
  ;[-0.15, 0.15].forEach(x => {
    const eye = sph(0.05, 0x30304a, 6)
    eye.castShadow = false
    bodyG.add(place(eye, x, 1.38, 0.4))
  })

  // hat option A — beanie: flattened dome + brim + pom
  const beanieG = new THREE.Group()
  const dome = setShadow(new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), hatMat))
  dome.scale.set(0.86, 0.55, 0.8)
  dome.position.y = 1.72
  beanieG.add(dome)
  const brim = setShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), hatMat))
  brim.position.y = 1.6
  beanieG.add(brim)
  beanieG.add(place(sph(0.11, C.trim, 8), 0, 1.98, 0))
  bodyG.add(beanieG)

  // hat option B — straw farm hat: wide brim + crown, band takes the hat color
  const strawG = new THREE.Group()
  const strawMat = mat(C.hay, {})
  const sBrim = setShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.07, 12), strawMat))
  sBrim.position.y = 1.62
  strawG.add(sBrim)
  const sCrown = setShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.34, 10), strawMat))
  sCrown.position.y = 1.8
  strawG.add(sCrown)
  const sBand = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.41, 0.13, 10), hatMat)
  sBand.position.y = 1.71
  strawG.add(sBand)
  strawG.visible = false
  bodyG.add(strawG)

  // backpack on the back (-z) with a pocket bump
  const pack = setShadow(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.26), packMat))
  pack.position.set(0, 1.15, -0.5)
  bodyG.add(pack)
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.1), packMat)
  pocket.position.set(0, 1.02, -0.66)
  bodyG.add(pocket)

  // arms — pivot groups at the shoulders so they swing while walking
  const mkArm = (side) => {
    const pivot = new THREE.Group()
    pivot.position.set(0.52 * side, 1.28, 0)
    const arm = setShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.42, 3, 8), bodyMat))
    arm.position.y = -0.28
    pivot.add(arm)
    bodyG.add(pivot)
    return pivot
  }
  const armL = mkArm(1)
  const armR = mkArm(-1)

  // legs — pivot groups at the hips, shoes with a slight toe
  const mkLeg = (side) => {
    const pivot = new THREE.Group()
    pivot.position.set(0.17 * side, 0.5, 0)
    const leg = setShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 3, 8), bodyMat))
    leg.position.y = -0.18
    pivot.add(leg)
    const shoe = setShadow(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.34), shoeMat))
    shoe.position.set(0, -0.38, 0.05)
    pivot.add(shoe)
    g.add(pivot)
    return pivot
  }
  const legL = mkLeg(1)
  const legR = mkLeg(-1)

  g.scale.setScalar(1.15)
  g.userData = {
    bodyG, armL, armR, legL, legR, walkT: 0,
    mats: { body: bodyMat, hat: hatMat, shoe: shoeMat, pack: packMat },
    hats: { beanie: beanieG, straw: strawG },
  }
  return g
}

// ─── Station builders ───
// Each returns { group, pre, post, colliders } — `pre` is the degraded state
// visible at start, `post` is the restored state (mounted at scale ≈ 0 and
// popped in by upgradeStation). Colliders are local {x,z,r} circles.

function buildCropField() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // whole field sits back from the hub a bit so the visit beacon's ring
  // lands on grass instead of clipping into the raised bed
  const Z_OFF = -1.6
  const bed = place(box(16, 0.3, 11, C.soil), 0, 0.15, Z_OFF)
  group.add(bed)
  const walkables = [bed]
  for (let i = -2; i <= 2; i++) {
    const ridge = place(box(15, 0.3, 0.9, C.soilRidge), 0, 0.36, i * 2.1 + Z_OFF)
    group.add(ridge)
    walkables.push(ridge)
  }

  // pre: dry stubble
  const stubbleT = []
  for (let row = -2; row <= 2; row++) {
    for (let i = 0; i < 8; i++) {
      stubbleT.push({ x: -6.5 + i * 1.9 + rand(-0.3, 0.3), y: 0.5, z: row * 2.1, s: rand(0.6, 1.1) })
    }
  }
  pre.add(instanced(new THREE.ConeGeometry(0.14, 0.5, 5), C.stubble, stubbleT))

  // post: lush cover crop rows (two greens, alternating)
  const cropA = []
  const cropB = []
  for (let row = -2; row <= 2; row++) {
    for (let i = 0; i < 8; i++) {
      const t = { x: -6.5 + i * 1.9 + rand(-0.2, 0.2), y: 0.95, z: row * 2.1, s: rand(0.8, 1.15) }
      ;(row % 2 === 0 ? cropA : cropB).push(t)
    }
  }
  post.add(instanced(new THREE.ConeGeometry(0.4, 1.5, 6), C.foliage[0], cropA))
  post.add(instanced(new THREE.ConeGeometry(0.4, 1.5, 6), C.foliage[1], cropB))

  pre.position.z = Z_OFF
  post.position.z = Z_OFF
  group.add(pre, post)
  return { group, pre, post, colliders: [], walkables }
}

function buildFarmstead() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  const barn = makeBarn()
  place(barn, 0, 0, -2.5, Math.PI) // door faces the island center
  group.add(barn)
  group.add(place(makeSilo(), 5.4, 0, -3.5))
  group.add(place(makeWindmill(), -5.6, 0, -2.5))
  group.userData.windmill = group.children[group.children.length - 1]
  group.add(place(makeTractor(), -4.4, 0, 3.6, 2.3)) // parked by the barn

  // pre: rusty tillage plow on cracked, bare ground
  pre.add(place(flatDisc(3, C.stubble, 18), 0.5, 0.05, 4.5))
  const plow = new THREE.Group()
  plow.add(place(box(2.8, 0.22, 0.22, C.rust), 0, 0.7, 0))
  for (let i = 0; i < 4; i++) {
    const shank = place(box(0.12, 0.7, 0.3, C.rust), -1.05 + i * 0.7, 0.35, 0.25)
    shank.rotation.x = 0.5
    plow.add(shank)
  }
  const plowWheel = cyl(0.35, 0.35, 0.12, C.wheel, 10)
  plowWheel.rotation.z = Math.PI / 2
  plow.add(place(plowWheel, 1.5, 0.35, -0.2))
  place(plow, 0.5, 0, 4.5, 0.6)
  pre.add(plow)

  // post: green no-till drill + cover-crop strip
  const drill = new THREE.Group()
  drill.add(place(box(3.2, 0.7, 1.0, C.tractorGreen), 0, 0.85, 0))
  drill.add(place(box(1.2, 0.7, 0.9, C.tassel), 0, 1.55, 0)) // seed hopper
  for (let i = 0; i < 6; i++) {
    const disc = cyl(0.3, 0.3, 0.08, C.hub, 10)
    disc.rotation.z = Math.PI / 2
    drill.add(place(disc, -1.25 + i * 0.5, 0.3, 0.55))
  }
  place(drill, 0.5, 0, 4.5, 0.4)
  post.add(drill)
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), mat(C.grassDark))
  strip.rotation.x = -Math.PI / 2
  strip.position.set(4.6, 0.06, 3.5)
  post.add(strip)
  const tufts = []
  for (let i = 0; i < 10; i++) tufts.push({ x: 4.6 + rand(-1.7, 1.7), y: 0.25, z: 3.5 + rand(-0.8, 0.8), s: rand(0.6, 1) })
  post.add(instanced(new THREE.ConeGeometry(0.15, 0.5, 5), C.grassDark, tufts))

  group.add(pre, post)
  return {
    group, pre, post,
    colliders: [
      { x: 0, z: -2.5, r: 4.4 },  // barn
      { x: 5.4, z: -3.5, r: 2.1 }, // silo
      { x: -5.6, z: -2.5, r: 1.3 }, // windmill
      { x: -4.4, z: 3.6, r: 1.9 }, // parked tractor
    ],
  }
}

function buildSoilPit() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // the pit itself (floor + raised rim curbs — all standable)
  const walkables = [
    place(box(5.2, 0.16, 4.2, 0x2e2018), 0, 0.06, 0.6),
    place(box(5.6, 0.24, 0.35, C.path), 0, 0.12, 2.75),
    place(box(5.6, 0.24, 0.35, C.path), 0, 0.12, -1.55),
    place(box(0.35, 0.24, 4.65, C.path), 2.65, 0.12, 0.6),
    place(box(0.35, 0.24, 4.65, C.path), -2.65, 0.12, 0.6),
  ]
  walkables.forEach(m => group.add(m))

  // exposed soil profile wall behind the pit
  group.add(place(box(5.2, 1.2, 0.9, C.stubble), 0, 0.6, -2.6))   // parent material
  group.add(place(box(5.2, 0.9, 0.92, C.soilRidge), 0, 1.65, -2.6)) // subsoil

  const sign = makeSign()
  sign.scale.setScalar(0.7)
  place(sign, 3.6, 0, 1.8, -0.5)
  group.add(sign)

  // pre: thin, pale, compacted topsoil layer
  pre.add(place(box(5.2, 0.35, 0.94, C.soilPale), 0, 2.28, -2.6))

  // post: thick dark topsoil + worms + sprouts
  post.add(place(box(5.2, 0.9, 0.94, C.soilRich), 0, 2.55, -2.6))
  for (let i = 0; i < 3; i++) {
    const worm = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.07, 6, 10, Math.PI),
      mat(C.cowNose)
    )
    worm.position.set(-1.6 + i * 1.5, 3.02, -2.35)
    worm.rotation.x = -Math.PI / 2 + rand(-0.3, 0.3)
    worm.rotation.z = rand(0, Math.PI)
    setShadow(worm)
    post.add(worm)
  }
  for (let i = 0; i < 4; i++) {
    post.add(place(cone(0.14, 0.5, C.foliage[1], 5), -1.9 + i * 1.25, 3.2, -2.55))
  }

  group.add(pre, post)
  return { group, pre, post, colliders: [{ x: 0, z: -2.6, r: 2.4 }], walkables }
}

function buildPasture() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()
  const colliders = []

  // fence rectangle 13 × 9 with a gate on the side facing the hub (+z).
  // GATE_HALF must leave room for the player: adjacent posts block a circle
  // of (post r 0.45 + PLAYER_R), so the walkable corridor is
  // 2 × (GATE_HALF − that sum) — 2.6 gives a comfortably wide opening.
  const W = 6.5, D = 4.5
  const GATE_HALF = 2.6
  const postT = []
  const rails = []
  const addSide = (x1, z1, x2, z2, gate) => {
    const len = Math.hypot(x2 - x1, z2 - z1)
    const steps = Math.round(len / 2.1)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = x1 + (x2 - x1) * t
      const z = z1 + (z2 - z1) * t
      if (gate && Math.abs(x) < GATE_HALF) continue // gate opening
      postT.push({ x, y: 0.55, z })
      colliders.push({ x, z, r: 0.45 })
    }
    rails.push({ x1, z1, x2, z2, gate })
  }
  addSide(-W, -D, W, -D, false)
  addSide(-W, D, W, D, true)
  addSide(-W, -D, -W, D, false)
  addSide(W, -D, W, D, false)
  group.add(instanced(new THREE.BoxGeometry(0.26, 1.1, 0.26), C.trunk, postT))
  rails.forEach(({ x1, z1, x2, z2, gate }) => {
    const len = Math.hypot(x2 - x1, z2 - z1)
    const ry = Math.atan2(x2 - x1, z2 - z1) + Math.PI / 2
    ;[0.42, 0.82].forEach(y => {
      if (gate) {
        // two rail segments leaving the middle open
        const seg = (len - GATE_HALF * 2) / 2
        ;[-1, 1].forEach(side => {
          const cx = (x1 + x2) / 2 + side * (GATE_HALF + seg / 2) * Math.sign(x2 - x1 || 1)
          group.add(place(box(seg, 0.09, 0.09, C.trunk), cx, y, z1, ry))
        })
      } else {
        group.add(place(box(len, 0.09, 0.09, C.trunk), (x1 + x2) / 2, y, (z1 + z2) / 2, ry))
      }
    })
  })

  // cows — each carries a little AI state for updateCow
  const cows = []
  ;[[-3, -1.5, 0.4], [2, -2.5, -0.8], [3.5, 1, 2.4]].forEach(([x, z, ry]) => {
    const cow = makeCow(rand(0.85, 1.05))
    place(cow, x, 0, z, ry)
    cow.userData.phase = rand(0, Math.PI * 2)
    cow.userData.ai = { mode: 'idle', timer: rand(1, 4), heading: rand(0, Math.PI * 2) }
    group.add(cow)
    cows.push(cow)
  })
  group.userData.cows = cows
  group.userData.cowBounds = { w: W - 1.3, d: D - 1.3 }

  group.add(place(makeTrough(), -4.8, 0, 2.8, 0.3))

  // pre: bare dirt patches
  ;[[-2, 0.5, 1.3], [1.5, 1.8, 1.0], [4, -2, 1.5], [-4.5, -2.5, 1.1], [0.5, -3, 0.8]].forEach(([x, z, r]) => {
    pre.add(place(flatDisc(r, C.soilPale, 10), x, 0.04, z))
  })

  // post: thick grass + hay bale + calf
  const tuftT = []
  for (let i = 0; i < 34; i++) {
    tuftT.push({ x: rand(-W + 0.8, W - 0.8), y: 0.22, z: rand(-D + 0.8, D - 0.8), s: rand(0.5, 1.05) })
  }
  const pastureTufts = instanced(new THREE.ConeGeometry(0.16, 0.5, 5), C.grassDark, tuftT)
  pastureTufts.castShadow = false
  post.add(pastureTufts)
  const bale = cyl(0.75, 0.75, 1.2, C.hay, 12)
  bale.rotation.z = Math.PI / 2
  post.add(place(bale, 5.2, 0.75, -2.8, 0.3))
  const calf = makeCow(0.55)
  place(calf, -0.5, 0, 0.5, 1.8)
  calf.userData.phase = rand(0, Math.PI * 2)
  calf.userData.ai = { mode: 'idle', timer: rand(1, 3), heading: 0, still: true }
  post.add(calf)
  cows.push(calf)

  group.add(pre, post)
  return { group, pre, post, colliders }
}

function buildPond() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, 26),
    new THREE.MeshPhongMaterial({ color: C.water, shininess: 90, transparent: true, opacity: 0.85 })
  )
  water.rotation.x = -Math.PI / 2
  water.position.y = 0.08
  group.add(water)
  group.userData.water = water

  const bank = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.5, 26), mat(C.path))
  bank.rotation.x = -Math.PI / 2
  bank.position.y = 0.06
  bank.receiveShadow = true
  group.add(bank)

  // pre: eroded gully + dead tree + rocks
  const gully = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6), mat(C.soilPale))
  gully.rotation.x = -Math.PI / 2
  gully.position.set(0, 0.05, 7.5)
  pre.add(gully)
  pre.add(place(makeDeadTree(), -5.8, 0, -3.2))
  pre.add(place(makeRock(0.9), 5.6, 0, -2.6))
  pre.add(place(makeRock(0.6), 6.2, 0, -1.4))

  // post: windbreak row behind the pond + cattails + lily pads
  ;[-6.5, -3.5, 3.5, 6.5].forEach((x, i) => {
    const tree = i % 2 === 0 ? makePine(rand(0.9, 1.1)) : makeTree(rand(0.95, 1.15))
    place(tree, x, 0, -6.2 + rand(-0.4, 0.4))
    post.add(tree)
  })
  for (let i = 0; i < 5; i++) {
    const a = rand(0, Math.PI * 2)
    post.add(place(makeCattail(), Math.cos(a) * 5.0, 0, Math.sin(a) * 5.0))
  }
  post.add(place(flatDisc(0.45, C.foliage[1], 8), 1.5, 0.1, 1.0))
  post.add(place(flatDisc(0.35, C.foliage[0], 8), -1.2, 0.1, -1.6))

  group.add(pre, post)
  return {
    group, pre, post,
    // water-only collider (r + PLAYER_R keeps the player's center at ~4.8,
    // just inside the bank ring) so the bank itself is walkable
    colliders: [{ x: 0, z: 0, r: 3.8 }, { x: -5.8, z: -3.2, r: 0.8 }],
    walkables: [bank],
  }
}

function buildGreenhouse() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  group.add(place(box(6.6, 0.2, 4.6, C.trim), 0, 0.1, 0))
  const glassMat = { transparent: true, opacity: 0.35 }
  group.add(place(box(6.4, 2.4, 4.4, C.glass, glassMat), 0, 1.4, 0))
  const roof = box(3.3, 3.3, 4.5, C.glass, glassMat)
  roof.rotation.z = Math.PI / 4
  roof.scale.y = 0.7
  place(roof, 0, 2.7, 0)
  group.add(roof)
  // frame
  ;[[-3.2, -2.2], [3.2, -2.2], [-3.2, 2.2], [3.2, 2.2]].forEach(([x, z]) => {
    group.add(place(box(0.16, 2.6, 0.16, C.trim), x, 1.3, z))
  })
  group.add(place(box(6.6, 0.16, 0.16, C.trim), 0, 3.9, 0))
  group.add(place(box(1.1, 1.9, 0.1, C.trim), 0, 0.95, 2.24))

  // soil beds inside
  group.add(place(box(2.4, 0.5, 1.1, C.soilRich), -1.6, 0.45, 0))
  group.add(place(box(2.4, 0.5, 1.1, C.soilRich), 1.6, 0.45, 0))

  // pre: wilted brown plants
  ;[-2.2, -1.0, 1.0, 2.2].forEach(x => {
    const wilt = place(cone(0.18, 0.5, C.deadwood, 5), x, 0.85, 0)
    wilt.rotation.z = rand(-0.6, 0.6)
    pre.add(wilt)
  })

  // post: bushes + blooms on the beds, flower boxes outside
  ;[-2.2, -1.0, 1.0, 2.2].forEach(x => {
    post.add(place(sph(0.34, pick(C.foliage), 7), x, 0.95, 0))
    post.add(place(sph(0.1, x < 0 ? C.flowerPink : C.flowerYellow, 6), x + 0.1, 1.25, 0.1))
    post.add(place(sph(0.08, C.trim, 6), x - 0.12, 1.18, -0.1))
  })
  ;[-1.5, 1.5].forEach(x => {
    post.add(place(box(1.4, 0.35, 0.4, C.trunk), x, 0.3, 2.5))
    post.add(place(sph(0.16, C.flowerPink, 6), x - 0.3, 0.55, 2.5))
    post.add(place(sph(0.16, C.flowerYellow, 6), x + 0.3, 0.55, 2.5))
  })

  group.add(pre, post)
  return { group, pre, post, colliders: [{ x: 0, z: 0, r: 4.2 }] }
}

function buildHeritage() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // tipi with crossing poles
  const tipi = new THREE.Group()
  tipi.add(place(cone(2.2, 4.2, C.tipi, 10), 0, 2.1, 0))
  tipi.add(place(cyl(2.24, 2.24, 0.45, C.tipiBand, 10), 0, 0.9, 0))
  for (let i = 0; i < 3; i++) {
    const pole = cyl(0.05, 0.05, 5.4, C.trunk, 5)
    pole.position.y = 2.7
    pole.rotation.z = 0.18
    pole.rotation.y = (i * Math.PI * 2) / 3
    const holder = new THREE.Group()
    holder.rotation.y = (i * Math.PI * 2) / 3
    holder.add(pole)
    tipi.add(holder)
  }
  place(tipi, -3.4, 0, -2.6)
  group.add(tipi)

  // fire ring
  group.add(place(flatDisc(0.7, C.dirtDark, 10), 0.5, 0.05, -3.4))
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6
    group.add(place(makeRock(0.35), 0.5 + Math.cos(a) * 0.9, 0, -3.4 + Math.sin(a) * 0.9))
  }

  // four planting mounds
  const moundPos = [[-1.2, 1.6], [1.2, 0.6], [3.4, 1.8], [1.2, 3.2]]
  moundPos.forEach(([x, z]) => {
    const mound = sph(0.85, C.soilRidge, 9)
    mound.scale.y = 0.38
    place(mound, x, 0.1, z)
    group.add(mound)
  })

  // pre: bare mounds — a few dry stalks
  moundPos.forEach(([x, z], i) => {
    if (i % 2 === 0) {
      const stalk = place(cyl(0.03, 0.05, 0.6, C.stubble, 5), x, 0.55, z)
      stalk.rotation.z = rand(-0.4, 0.4)
      pre.add(stalk)
    }
  })

  // post: the Three Sisters growing on each mound
  moundPos.forEach(([x, z]) => {
    post.add(place(makeCorn(), x, 0.28, z))
    post.add(place(makeBeanPole(), x + 0.5, 0.24, z + 0.3))
    post.add(place(makeSquash(), x - 0.45, 0.28, z - 0.35))
  })

  group.add(pre, post)
  return {
    group, pre, post,
    // tipi + one circle per planting mound
    colliders: [{ x: -3.4, z: -2.6, r: 2.5 }, ...moundPos.map(([x, z]) => ({ x, z, r: 0.85 }))],
  }
}

// A small "4R Nutrient Stewardship" signboard: post + four colored R-bars.
function make4RSign() {
  const g = new THREE.Group()
  g.add(place(box(0.16, 1.6, 0.16, C.trunk), 0, 0.8, 0))
  g.add(place(box(1.5, 1.1, 0.12, C.trim), 0, 1.55, 0))
  ;[C.beacon, C.beaconDone, C.flowerYellow, C.sensorOrange].forEach((c, i) => {
    g.add(place(box(0.28, 0.7, 0.06, c), -0.52 + i * 0.35, 1.55, 0.1))
  })
  return g
}

// ── Trail-island station builders ──
// Same { group, pre, post, colliders } contract as the ring builders. Colliders
// sit only on persistent (always-visible) group props, never on pre/post-only
// pieces — so restoring a station never leaves an invisible wall behind.

function buildConservation() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // a thin stream across the back with low banks (persistent)
  const stream = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 2.2),
    new THREE.MeshPhongMaterial({ color: C.water, shininess: 80, transparent: true, opacity: 0.85 })
  )
  stream.rotation.x = -Math.PI / 2
  stream.position.set(0, 0.07, -4.2)
  group.add(stream)
  group.userData.water = stream
  const walkables = [
    place(box(13, 0.24, 0.5, C.soilRidge), 0, 0.12, -3.0),
    place(box(13, 0.24, 0.5, C.soilRidge), 0, 0.12, -5.4),
  ]
  walkables.forEach(m => group.add(m))

  // pre: eroded gully + bare soil + a rusty tile outlet dumping to the stream
  pre.add(place(flatDisc(2.4, C.soilPale, 12), -1.5, 0.05, 1.5))
  const gully = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5), mat(C.dirtDark))
  gully.rotation.x = -Math.PI / 2
  gully.position.set(1.5, 0.05, -0.8)
  pre.add(gully)
  pre.add(place(makeRock(0.7), 3.2, 0, 0.5))
  pre.add(place(makeRock(0.5), -3.4, 0, -0.6))
  const outlet = cyl(0.28, 0.28, 1.2, C.rust, 8)
  outlet.rotation.x = Math.PI / 2
  pre.add(place(outlet, 1.5, 0.35, -2.7))

  // post: banded contour prairie strips (tallgrass + buffer + wildflowers)
  ;[2.6, 0.9, -0.8].forEach((z, bi) => {
    const tall = [], midg = []
    for (let i = 0; i < 14; i++) {
      const x = -6 + i * 0.92 + rand(-0.15, 0.15)
      ;(i % 2 === 0 ? tall : midg).push({ x, y: 0.6, z: z + rand(-0.3, 0.3), s: rand(0.8, 1.15), ry: rand(0, Math.PI) })
    }
    post.add(instanced(new THREE.ConeGeometry(0.16, 1.5, 5), C.prairieGold, tall))
    post.add(instanced(new THREE.ConeGeometry(0.2, 1.0, 5), C.bufferGreen, midg))
    const fl = []
    for (let i = 0; i < 6; i++) fl.push({ x: -5.5 + rand(0, 11), y: 0.75, z: z + rand(-0.3, 0.3), s: rand(0.7, 1.1) })
    post.add(instanced(new THREE.SphereGeometry(0.12, 6, 5), bi % 2 ? C.flowerPink : C.flowerWhite, fl))
  })
  // riparian buffer trees lining the stream
  ;[-5, -1.5, 2, 5].forEach((x, i) => {
    post.add(place(i % 2 ? makeTree(rand(0.85, 1.05), C.foliage[2]) : makePine(rand(0.85, 1.05)), x, 0, -3.6 + rand(-0.3, 0.3)))
  })

  group.add(pre, post)
  return { group, pre, post, colliders: [], walkables }
}

function buildPhosphorus() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // catch pond that collects field runoff (persistent)
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 24),
    new THREE.MeshPhongMaterial({ color: C.water, shininess: 90, transparent: true, opacity: 0.85 })
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(0, 0.08, -3.2)
  group.add(water)
  group.userData.water = water
  const bank = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.2, 24), mat(C.path))
  bank.rotation.x = -Math.PI / 2
  bank.position.set(0, 0.06, -3.2)
  bank.receiveShadow = true
  group.add(bank)
  // the field above the pond (soil bed with rows — standable)
  const walkables = [place(box(11, 0.3, 6, C.soil), 0, 0.15, 3.0)]
  for (let i = -2; i <= 2; i++) walkables.push(place(box(10.5, 0.32, 0.5, C.soilRidge), 0, 0.34, 3.0 + i * 1.1))
  walkables.forEach(m => group.add(m))

  // pre: algae-choked green water + a bare runoff channel + a dead tree
  const algae = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 20),
    new THREE.MeshBasicMaterial({ color: C.algae, transparent: true, opacity: 0.85 })
  )
  algae.rotation.x = -Math.PI / 2
  algae.position.set(0, 0.11, -3.2)
  pre.add(algae)
  const channel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 4.5), mat(C.soilPale))
  channel.rotation.x = -Math.PI / 2
  channel.position.set(0, 0.34, 0.4)
  pre.add(channel)
  pre.add(place(makeDeadTree(), -3.8, 0, 0.2))

  // post: clear water + cattail ring + a vegetated buffer + a 4R sign
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    post.add(place(makeCattail(), Math.cos(a) * 3.7, 0, -3.2 + Math.sin(a) * 3.7))
  }
  const buf = []
  for (let i = 0; i < 22; i++) buf.push({ x: -5 + rand(0, 10), y: 0.4, z: -0.4 + rand(-0.5, 0.5), s: rand(0.7, 1.1), ry: rand(0, Math.PI) })
  post.add(instanced(new THREE.ConeGeometry(0.16, 0.9, 5), C.bufferGreen, buf))
  const fl = []
  for (let i = 0; i < 10; i++) fl.push({ x: -5 + rand(0, 10), y: 0.6, z: -0.4 + rand(-0.5, 0.5), s: rand(0.7, 1.1) })
  post.add(instanced(new THREE.SphereGeometry(0.12, 6, 5), C.flowerYellow, fl))
  post.add(place(make4RSign(), 4.2, 0, -0.6, -0.5))
  post.add(place(flatDisc(0.4, C.foliage[1], 8), 1.2, 0.1, -3.6))
  post.add(place(flatDisc(0.3, C.foliage[0], 8), -1.0, 0.1, -2.6))
  // the field itself greens up too: healthy crop rows along the ridges
  const cropA = [], cropB = []
  for (let row = -2; row <= 2; row++) {
    for (let i = 0; i < 7; i++) {
      const tr = { x: -4.5 + i * 1.5 + rand(-0.2, 0.2), y: 1.0, z: 3.0 + row * 1.1, s: rand(0.8, 1.15), ry: rand(0, Math.PI) }
      ;(row % 2 === 0 ? cropA : cropB).push(tr)
    }
  }
  post.add(instanced(new THREE.ConeGeometry(0.3, 1.2, 6), C.foliage[0], cropA))
  post.add(instanced(new THREE.ConeGeometry(0.3, 1.2, 6), C.foliage[1], cropB))

  group.add(pre, post)
  return { group, pre, post, colliders: [{ x: 0, z: -3.2, r: 3.0 }], walkables }
}

function buildSoilArt() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // paved plaza floor (persistent)
  group.add(place(flatDisc(4.6, C.adobe, 24), 0, 0.04, 0))

  // pre: a blank weathered earthen wall + empty pots + dull ground
  pre.add(place(box(4.6, 2.2, 0.5, C.soilPale), 0, 1.1, -3.4))
  ;[-1.4, 0, 1.4].forEach(x => pre.add(place(cyl(0.35, 0.28, 0.5, C.pottery, 8), x, 0.25, 2.4)))

  // post: adobe archway + painted pigment panels + polished vessels + terra
  // preta + geoglyphs + a mosaic tile ring — the full earth-pigment palette
  // (yellow/red/brown ochre, chalk white, charcoal black)
  const arch = new THREE.Group()
  ;[-1.9, 1.9].forEach(x => arch.add(place(box(0.7, 3.0, 0.7, C.adobe), x, 1.5, 0)))
  arch.add(place(box(4.5, 0.7, 0.7, C.adobe), 0, 3.2, 0))
  // pennant string swinging under the crossbar, alternating pigment colors
  arch.add(place(box(3.4, 0.03, 0.03, C.trunk), 0, 2.82, 0.1))
  ;[C.ochreY, C.ochreR, C.salt, C.charcoal, C.ochreY].forEach((c, i) => {
    arch.add(place(box(0.22, 0.32, 0.04, c), -1.3 + i * 0.65, 2.62, 0.1))
  })
  place(arch, 0, 0, -3.2)
  post.add(arch)
  // pigment panel gallery — seven panels, varied heights
  ;[C.ochreY, C.ochreR, C.salt, C.ochreBrown, C.charcoal, C.ochreR, C.ochreY].forEach((c, i) => {
    const h = i % 2 === 0 ? 1.5 : 1.2
    post.add(place(box(0.62, h, 0.18, c), -2.25 + i * 0.75, h / 2 + 0.15, -2.4))
  })
  post.add(place(sph(0.4, C.soilRich, 10), -1.6, 0.4, 1.6)) // dorodango (polished dark ball)
  // onggi vessel + striped painted pots
  post.add(place(cyl(0.5, 0.35, 0.9, C.pottery, 10), 1.4, 0.45, 1.8))
  post.add(place(cyl(0.51, 0.42, 0.16, C.ochreY, 10), 1.4, 0.62, 1.8)) // painted band
  post.add(place(cyl(0.3, 0.24, 0.55, C.pottery, 9), 2.2, 0.28, 1.2))
  post.add(place(cyl(0.31, 0.27, 0.1, C.salt, 9), 2.2, 0.38, 1.2))
  post.add(place(sph(0.3, C.ochreR, 9), 0.2, 0.3, 2.2))
  // terra preta bed (dark fertile soil + sprouts)
  post.add(place(box(2.4, 0.3, 1.0, C.soilRich), 0, 0.15, 3.4))
  for (let i = 0; i < 5; i++) post.add(place(cone(0.12, 0.5, C.foliage[0], 5), -0.9 + i * 0.45, 0.4, 3.4))
  // a Nazca-style spiral geoglyph scratched into the plaza
  for (let i = 0; i < 5; i++) {
    const rr = 0.6 + i * 0.32
    const glyph = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.06, 22, 1, 0, Math.PI * 1.6), mat(C.salt))
    glyph.rotation.x = -Math.PI / 2
    glyph.rotation.z = i * 0.5
    glyph.position.set(0, 0.06, 0.2)
    post.add(glyph)
  }
  // second geoglyph: concentric ochre rings with a charcoal center dot
  ;[0.35, 0.7].forEach(rr => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.07, 20), mat(C.ochreR))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(2.6, 0.06, -0.4)
    post.add(ring)
  })
  post.add(place(flatDisc(0.14, C.charcoal, 10), 2.6, 0.06, -0.4))
  // mosaic tile ring inlaid around the plaza rim, colors alternating
  const tileColors = [C.ochreR, C.salt, C.ochreY]
  const tileT = tileColors.map(() => [])
  const TILE_N = 21
  for (let i = 0; i < TILE_N; i++) {
    const a = (i / TILE_N) * Math.PI * 2
    tileT[i % 3].push({ x: Math.cos(a) * 4.05, y: 0.07, z: Math.sin(a) * 4.05, ry: -a + Math.PI / 2 })
  }
  tileColors.forEach((c, ci) => {
    const tiles = instanced(new THREE.BoxGeometry(0.55, 0.05, 0.32), c, tileT[ci])
    tiles.castShadow = false
    post.add(tiles)
  })

  group.add(pre, post)
  // no colliders: the pre wall and post archway swap at the same spot, and a
  // circle there would block walking under the restored arch
  return { group, pre, post, colliders: [] }
}

function buildResearch() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // research field lab cabin (persistent)
  const cabin = new THREE.Group()
  cabin.add(place(box(4.0, 2.4, 3.0, C.labWall), 0, 1.2, 0))
  const roof = box(2.4, 2.4, 3.3, C.roof)
  roof.rotation.z = Math.PI / 4
  roof.scale.y = 0.8
  cabin.add(place(roof, 0, 2.4, 0))
  cabin.add(place(box(0.9, 1.5, 0.12, C.trunk), 0, 0.95, 1.52)) // door
  cabin.add(place(box(1.0, 0.8, 0.12, C.glass, { transparent: true, opacity: 0.5 }), -1.2, 1.5, 1.52))
  place(cabin, 0, 0, -3.4)
  group.add(cabin)

  // gridded research plots (persistent low beds — standable)
  const beds = []
  const walkables = []
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const bx = -3 + c * 3, bz = 1.2 + r * 2.0
    const bed = place(box(2.4, 0.24, 1.5, C.soil), bx, 0.12, bz)
    group.add(bed)
    walkables.push(bed)
    beds.push([bx, bz])
  }

  // pre: leaning "closed" sign + weeds + a broken instrument
  const lean = makeSign()
  lean.scale.setScalar(0.7)
  lean.rotation.z = 0.25
  place(lean, 3.4, 0, -1.4, -0.5)
  pre.add(lean)
  const broken = place(cyl(0.1, 0.1, 1.4, C.rust, 6), -3.6, 0.5, -1.4)
  broken.rotation.z = 0.5
  pre.add(broken)
  const weedT = []
  beds.forEach(([bx, bz]) => { for (let i = 0; i < 4; i++) weedT.push({ x: bx + rand(-0.9, 0.9), y: 0.4, z: bz + rand(-0.5, 0.5), s: rand(0.6, 1) }) })
  pre.add(instanced(new THREE.ConeGeometry(0.12, 0.5, 5), C.stubble, weedT))

  // post: planted plots + colored trial flags + a GPS mast + a soil auger
  beds.forEach(([bx, bz], i) => {
    post.add(place(makeCorn(), bx - 0.6, 0.28, bz))
    post.add(place(makeCorn(), bx + 0.6, 0.28, bz))
    const flag = new THREE.Group()
    flag.add(place(cyl(0.03, 0.03, 0.8, C.trim, 5), 0, 0.4, 0))
    flag.add(place(box(0.3, 0.2, 0.02, [C.beacon, C.flowerYellow, C.sensorOrange][i % 3]), 0.16, 0.7, 0))
    post.add(place(flag, bx + 0.95, 0, bz - 0.55))
  })
  const mast = new THREE.Group()
  mast.add(place(cyl(0.1, 0.14, 3.2, C.metal, 7), 0, 1.6, 0))
  mast.add(place(box(0.7, 0.12, 0.7, C.solar), 0, 3.3, 0))
  mast.add(place(sph(0.16, C.beacon, 8), 0, 3.55, 0))
  place(mast, 3.6, 0, 1.4)
  post.add(mast)
  const auger = new THREE.Group()
  auger.add(place(cyl(0.04, 0.04, 2.0, C.metal, 6), 0, 1.0, 0))
  auger.add(place(box(0.5, 0.06, 0.06, C.trunk), 0, 1.95, 0)) // T-handle
  auger.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.02, 0.5, 8), mat(C.metal)), 0, 0.15, 0))
  auger.rotation.z = 0.25
  place(auger, -3.5, 0, 0.4)
  post.add(auger)

  group.add(pre, post)
  // cabin only — the GPS mast lives in `post`, and a collider on a
  // not-yet-visible prop would read as an invisible wall
  return { group, pre, post, colliders: [{ x: 0, z: -3.4, r: 2.4 }], walkables }
}

function buildSalinity() {
  const group = new THREE.Group()
  const pre = new THREE.Group()
  const post = new THREE.Group()

  // the field the rig monitors (persistent, standable)
  const field = place(box(9, 0.3, 6, C.soil), 0, 0.15, 1.5)
  group.add(field)
  const walkables = [field]

  // pre: salt-crusted barren patches + stunted crops + a broken sensor pole
  ;[[-2, 1.5, 1.6], [1.5, 2.5, 1.3], [2.5, 0.5, 1.0]].forEach(([x, z, r]) => pre.add(place(flatDisc(r, C.salt, 12), x, 0.32, z)))
  const stunt = []
  for (let i = 0; i < 14; i++) stunt.push({ x: -3.5 + rand(0, 7), y: 0.4, z: rand(-1.5, 2.5), s: rand(0.4, 0.7) })
  pre.add(instanced(new THREE.ConeGeometry(0.14, 0.5, 5), C.stubble, stunt))
  const brokenPole = place(cyl(0.09, 0.09, 1.6, C.metal, 6), -3.4, 0.6, -1.6)
  brokenPole.rotation.z = 0.6
  pre.add(brokenPole)

  // post: EMI sensor sled + data mast (solar panel + spinning anemometer) +
  // gypsum remediation piles + recovering green crops
  const sled = new THREE.Group()
  sled.add(place(box(2.6, 0.16, 0.8, C.metal), 0, 0.2, 0)) // skid deck
  ;[-1.0, 1.0].forEach(x => sled.add(place(box(0.12, 0.16, 1.0, C.wheel), x, 0.08, 0))) // runners
  sled.add(place(box(1.4, 0.5, 0.6, C.sensorOrange), 0, 0.5, 0)) // coil/instrument box
  sled.add(place(cyl(0.04, 0.04, 1.2, C.metal, 5), 1.2, 0.3, 0.7)) // tow bar
  place(sled, -1.5, 0, 3.4, 0.3)
  post.add(sled)
  const rig = new THREE.Group()
  rig.add(place(cyl(0.09, 0.12, 3.4, C.metal, 7), 0, 1.7, 0))
  const panel = place(box(1.0, 0.08, 0.7, C.solar), 0.5, 3.0, 0)
  panel.rotation.z = 0.35
  rig.add(panel)
  const rotor = new THREE.Group()
  rotor.position.set(0, 3.5, 0)
  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group()
    holder.rotation.y = (i * Math.PI * 2) / 3
    holder.add(place(box(0.5, 0.04, 0.04, C.trim), 0, 0, 0))
    holder.add(place(sph(0.1, C.trim, 6), 0.28, 0, 0))
    rotor.add(holder)
  }
  rig.add(rotor)
  rig.userData.rotor = rotor
  place(rig, 3.0, 0, -0.5)
  post.add(rig)
  group.userData.anemometer = rig
  ;[[-3.2, 2.5], [3.2, 2.8]].forEach(([x, z]) => post.add(place(cone(0.6, 0.7, C.gypsum, 7), x, 0.35, z)))
  const crop = []
  for (let i = 0; i < 16; i++) crop.push({ x: -3.5 + rand(0, 7), y: 0.5, z: rand(-1.5, 2.5), s: rand(0.8, 1.15) })
  post.add(instanced(new THREE.ConeGeometry(0.18, 0.9, 6), C.foliage[0], crop))

  group.add(pre, post)
  // the sensor rig lives in `post` — no collider until it's actually visible
  // (a thin pole is fine to pass through; matches the pre/post contract)
  return { group, pre, post, colliders: [], walkables }
}

// ─── Layout ───
// The original stations sit on a ring of radius 26; rot turns each toward the
// island hub. Trail-island stations are placed explicitly (see below).

const STATION_R = 26

// ── Second island (trail island) geometry ──
// A sibling island to the southwest (heading 235° — the mid-gap between the
// heritage and farmstead stations), reached by a walkable bridge. Its five
// stations follow a winding trail instead of a ring.
const NEW_ISLAND_DIST = 78
const NEW_ISLAND_R = 30
const NEW_ISLAND_CLAMP_R = 26
const NH = (235 * Math.PI) / 180
const NC = { x: Math.cos(NH) * NEW_ISLAND_DIST, z: Math.sin(NH) * NEW_ISLAND_DIST }
// local frame on the new island: NU points back toward the main island (the
// bridge landing); NPERP is 90° from it. Stations are authored in this frame.
const NU = { x: -Math.cos(NH), z: -Math.sin(NH) }
const NPERP = { x: -NU.z, z: NU.x }
function trailPoint(a, s) {
  return { x: NC.x + NU.x * a + NPERP.x * s, z: NC.z + NU.z * a + NPERP.z * s }
}
// each: a = distance along NU (positive = toward the main island),
// s = station center's perpendicular offset from the island spine,
// wp = where the trail itself winds at that point,
// as = the beacon/anchor offset — just past the path edge on the station's
// side, so beacons sit beside the trail instead of on it
// (beacon ring reaches ~1.35 from its anchor and the planks are 2.6 wide, so
// |as| − |wp| ≥ 2.7 keeps the ring fully beside the path, and |s| − |as| ≥ 6.5
// keeps it clear of the station geometry it fronts)
const TRAIL_STATIONS = [
  // conservation is the widest build (13-unit stream + strip rows along the
  // spine), so it sits closer in than the others — at s 13 its stream jutted
  // past the island rim
  { id: 'conservation-practices', a: 16, s: 10.5, wp: 2, as: 5.2 },
  { id: 'phosphorus', a: 8, s: -13, wp: -2, as: -5.2 },
  { id: 'soil-art-culture', a: -2, s: 13, wp: 2, as: 5.2 },
  { id: 'agronomy-careers', a: -11, s: -13, wp: -2, as: -5.2 },
  { id: 'electrical-conductivity', a: -19, s: 10.5, wp: 1.2, as: 4.2 },
]

const STATION_LAYOUT = {
  'crop-field': { angle: 0 },
  pond: { angle: 51.4 },
  greenhouse: { angle: 102.9 },
  pasture: { angle: 154.3 },
  heritage: { angle: 205.7 },
  farmstead: { angle: 257.1 },
  'soil-pit': { angle: 308.6 },
}
TRAIL_STATIONS.forEach(ts => {
  const pos = trailPoint(ts.a, ts.s)
  const anchor = trailPoint(ts.a, ts.as)
  const rot = Math.atan2(anchor.x - pos.x, anchor.z - pos.z) // local +z faces the approach
  STATION_LAYOUT[ts.id] = { trail: true, x: pos.x, z: pos.z, rot, anchor }
})

// The trail spine: bridge landing → a winding point beside each station →
// tail. Rendered as plank segments (walkable) and reused as the NPC patrol
// path on this island. Deliberately NOT through the anchors: beacons sit just
// off the path edge on each station's side.
const TRAIL_WAYPOINTS = [
  trailPoint(31, 0),
  ...TRAIL_STATIONS.map(ts => trailPoint(ts.a, ts.wp)),
  trailPoint(-25, 0),
]

// NPC patrol routes (absolute world coords). Kept here — not in the NPC data
// file — so the content stays coordinate-free. Old-island loops sit in the gaps
// between the ring stations; the trail loops follow the plank waypoints so the
// NPCs stay on the path.
const NPC_ROUTES = {
  hubLoop: [{ x: 10.0, z: 4.6 }, { x: -6.8, z: 8.7 }, { x: -6.9, z: -8.5 }, { x: 9.9, z: -4.8 }],
  oldOuter: [{ x: 3.6, z: 15.6 }, { x: -16, z: 0 }, { x: 3.6, z: -15.6 }, { x: 14.5, z: 6.8 }],
  // beside the trail, deliberately off the station anchors so an idling NPC
  // doesn't stand inside a beacon ring
  trailNear: [trailPoint(27, -3), trailPoint(21, -5), trailPoint(13, 3.5), trailPoint(4, -4.5)],
  trailFar: [trailPoint(0, -3.5), trailPoint(-7, 4), trailPoint(-15, -4), trailPoint(-22, -1)],
}

const BUILDERS = {
  'crop-field': buildCropField,
  pond: buildPond,
  greenhouse: buildGreenhouse,
  pasture: buildPasture,
  heritage: buildHeritage,
  farmstead: buildFarmstead,
  'soil-pit': buildSoilPit,
  'conservation-practices': buildConservation,
  phosphorus: buildPhosphorus,
  'soil-art-culture': buildSoilArt,
  'agronomy-careers': buildResearch,
  'electrical-conductivity': buildSalinity,
}

const ISLAND_R = 40
const PLAYER_CLAMP_R = 36
const PLAYER_R = 1.0
const NPC_BLOCK_R = 0.6 // NPC personal-space radius for player push-out
const SPEED = 10
const INTERACT_R = 6.2
// Talking needs you right next to the person (beacons trigger from further
// away) — also keeps a wandering NPC from stealing a station's prompt
const NPC_TALK_R = 3.4

// Player-walkable regions: the two islands (circles) + the bridge corridor
// (capsule between endpoints that overlap each island circle). Movement is
// clamped to the union of these. Away from the bridge only the main-island
// circle can match, so old-island movement is identical to the single-circle
// clamp it replaces.
const BRIDGE_A = { x: Math.cos(NH) * 30, z: Math.sin(NH) * 30 }
const BRIDGE_B = { x: Math.cos(NH) * 56, z: Math.sin(NH) * 56 }
const REGIONS = [
  { type: 'circle', x: 0, z: 0, r: PLAYER_CLAMP_R },
  { type: 'circle', x: NC.x, z: NC.z, r: NEW_ISLAND_CLAMP_R },
  { type: 'capsule', ax: BRIDGE_A.x, az: BRIDGE_A.z, bx: BRIDGE_B.x, bz: BRIDGE_B.z, r: 3.5 },
]
function closestOnSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az
  const len2 = dx * dx + dz * dz
  let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  return { x: ax + dx * t, z: az + dz * t }
}
// NOTE: inputs are always within one movement step (or a small collider
// push-out) of a point already inside a region, so the projection below only
// ever moves a point a comparable small distance. Far-outside points would
// snap across region seams — but they can't occur in gameplay.
function clampToRegions(x, z) {
  for (const rg of REGIONS) {
    if (rg.type === 'circle') {
      if (Math.hypot(x - rg.x, z - rg.z) <= rg.r) return { x, z }
    } else {
      const c = closestOnSegment(x, z, rg.ax, rg.az, rg.bx, rg.bz)
      if (Math.hypot(x - c.x, z - c.z) <= rg.r) return { x, z }
    }
  }
  // outside every region → project onto the nearest region boundary
  let best = { x, z }, bestD = Infinity
  for (const rg of REGIONS) {
    let cx, cz
    if (rg.type === 'circle') { cx = rg.x; cz = rg.z } else {
      const c = closestOnSegment(x, z, rg.ax, rg.az, rg.bx, rg.bz); cx = c.x; cz = c.z
    }
    const d = Math.hypot(x - cx, z - cz)
    if (d < 0.0001) continue
    const proj = { x: cx + ((x - cx) / d) * rg.r, z: cz + ((z - cz) / d) * rg.r }
    const pd = Math.hypot(x - proj.x, z - proj.z)
    if (pd < bestD) { bestD = pd; best = proj }
  }
  return best
}
// Default follow-camera orbit (equivalent to the old fixed offset
// (0, 7.8, 11.4)). Yaw 0 = behind the player. The player can drag to orbit,
// wheel/pinch to zoom, and reset via the ⊙ topbar button.
const CAM_DIST = 13.8
const CAM_PITCH = 0.6
const CAM_DIST_MIN = 6
const CAM_DIST_MAX = 26
const CAM_PITCH_MIN = 0.18
const CAM_PITCH_MAX = 1.25

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
const easeOutBack = t => {
  const c1 = 1.70158
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Build and run the 3D farm.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.host — container the canvas is appended to
 * @param {string[]} opts.stationIds — station ids to mount (from content file)
 * @param {() => {x:number, y:number}} opts.getInput — normalized input vector
 * @param {(target: {type:'station'|'npc', id:string}|null) => void} opts.onNearTarget
 *   — nearest interactable (uncompleted station or NPC) in range changed
 * @param {() => void} [opts.onDisposed]
 * @returns {{ dispose, upgradeStation, setMovementEnabled, resetCamera,
 *   applyLook, getDollCharacter, setCustomizeFocus, setTimeOfDay }}
 */
export function createFarmWorld({ host, stationIds, getInput, onNearTarget, onDisposed }) {
  // ── Renderer / scene / camera ──
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(C.sky)
  scene.fog = new THREE.Fog(C.sky, 95, 200)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 320)
  camera.position.set(0, 48, 66) // start high — the follow-lerp swoops in
  camera.lookAt(0, 0, 0)

  // ── Camera orbit (drag to rotate, wheel / two-finger pinch to zoom) ──
  // Listeners live on the canvas itself: HUD elements sit above it and swallow
  // their own pointer events, and the joystick uses pointer capture — so
  // nothing here can steal from them.
  let camYaw = 0
  let camPitch = CAM_PITCH
  let camDist = CAM_DIST
  let camSaved = null // stashed orbit while the customizer holds the camera
  let customizeFocus = false // frames the player beside the customizer panel
  let talkingNpc = null // npc record mid-conversation — camera frames the pair
  let talkSaved = null // stashed orbit while a conversation holds the camera

  const canvas = renderer.domElement
  const dragPts = new Map()
  let lastPinch = 0
  canvas.addEventListener('pointerdown', (e) => {
    // orbiting stays enabled during customize so you can spin around the
    // explorer (e.g. to see the backpack); the frame-loop pan keeps them framed
    canvas.setPointerCapture(e.pointerId)
    dragPts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (dragPts.size === 2) {
      const [a, b] = [...dragPts.values()]
      lastPinch = Math.hypot(a.x - b.x, a.y - b.y)
    }
  })
  canvas.addEventListener('pointermove', (e) => {
    const p = dragPts.get(e.pointerId)
    if (!p) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    p.x = e.clientX
    p.y = e.clientY
    if (dragPts.size === 1) {
      camYaw -= dx * 0.005
      camPitch = clamp(camPitch + dy * 0.004, CAM_PITCH_MIN, CAM_PITCH_MAX)
    } else if (dragPts.size === 2) {
      const [a, b] = [...dragPts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (lastPinch > 0 && d > 0) {
        camDist = clamp(camDist * (lastPinch / d), CAM_DIST_MIN, CAM_DIST_MAX)
      }
      lastPinch = d
    }
  })
  const endDrag = (e) => {
    dragPts.delete(e.pointerId)
    lastPinch = 0
  }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault() // don't let the page scroll under the world
    camDist = clamp(camDist * (1 + e.deltaY * 0.0012), CAM_DIST_MIN, CAM_DIST_MAX)
  }, { passive: false })

  // ── Lights ──
  // Strong hemisphere + softer sun = the flat, bright, low-contrast pastel
  // look of the reference; shadows stay visible but gentle.
  const hemi = new THREE.HemisphereLight(0xe8f7ff, 0xa8c98a, 1.3)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.8)
  sun.position.set(35, 55, 25)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -52
  sun.shadow.camera.right = 52
  sun.shadow.camera.top = 52
  sun.shadow.camera.bottom = -52
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 140
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.bias = -0.0004
  scene.add(sun)
  scene.add(sun.target)
  // the sun's offset from its target — kept constant so the light direction
  // never changes; only the shadow frustum re-centers under the player each
  // frame (so shadows work on the far island without enlarging the map)
  const SUN_OFFSET = sun.position.clone()

  // ── Island ──
  const grassTop = cyl(ISLAND_R, ISLAND_R, 1.4, C.grass, 44)
  grassTop.position.y = -0.7
  grassTop.receiveShadow = true
  scene.add(grassTop)
  const dirtBase = cyl(ISLAND_R, ISLAND_R * 0.76, 9, C.sand, 44)
  dirtBase.position.y = -5.9
  scene.add(dirtBase)
  const bottomCap = cyl(ISLAND_R * 0.76, ISLAND_R * 0.55, 3, C.sandDark, 44)
  bottomCap.position.y = -11.9
  scene.add(bottomCap)

  // second island (trail island) — same three-layer profile as the main island
  const nGrass = cyl(NEW_ISLAND_R, NEW_ISLAND_R, 1.4, C.grass, 40)
  nGrass.position.set(NC.x, -0.7, NC.z)
  nGrass.receiveShadow = true
  scene.add(nGrass)
  const nDirt = cyl(NEW_ISLAND_R, NEW_ISLAND_R * 0.76, 9, C.sand, 40)
  nDirt.position.set(NC.x, -5.9, NC.z)
  scene.add(nDirt)
  const nCap = cyl(NEW_ISLAND_R * 0.76, NEW_ISLAND_R * 0.55, 3, C.sandDark, 40)
  nCap.position.set(NC.x, -11.9, NC.z)
  scene.add(nCap)

  // the sea — a huge unlit disc far below. fog: false keeps it solid blue all
  // the way out, so the horizon is a crisp sea-meets-sky line like the
  // reference (with fog it would dissolve into the sky and vanish).
  const sea = new THREE.Mesh(new THREE.CircleGeometry(260, 40), new THREE.MeshBasicMaterial({ color: C.water, fog: false }))
  sea.rotation.x = -Math.PI / 2
  sea.position.y = -13.2
  scene.add(sea)

  // decorative sun disc (fog: false — it sits beyond the fog far-plane);
  // doubles as the moon at night via a color swap in setTimeOfDay
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshBasicMaterial({ color: C.sun, fog: false }))
  sunDisc.position.set(75, 55, -110)
  sunDisc.lookAt(0, 0, 0)
  scene.add(sunDisc)

  // stars — a dome of tiny unlit dots, faded in at night
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false })
  const starGeo = new THREE.SphereGeometry(0.5, 4, 3)
  const STAR_N = 130
  const stars = new THREE.InstancedMesh(starGeo, starMat, STAR_N)
  {
    const d = new THREE.Object3D()
    for (let i = 0; i < STAR_N; i++) {
      const a = rand(0, Math.PI * 2)
      const elev = rand(0.12, Math.PI / 2 - 0.06)
      const R = 230
      d.position.set(Math.cos(a) * Math.cos(elev) * R, Math.sin(elev) * R, Math.sin(a) * Math.cos(elev) * R)
      d.scale.setScalar(rand(0.5, 1.4))
      d.updateMatrix()
      stars.setMatrixAt(i, d.matrix)
    }
  }
  stars.visible = false
  scene.add(stars)

  // ── Hub plaza + paths ──
  scene.add(place(flatDisc(4.5, C.path, 26), 0, 0.03, 0))
  const sign = makeSign()
  place(sign, -2.2, 0, -3.2, 0.5)
  scene.add(sign)
  scene.add(place(makeFlag(), 2.6, 0, -3.0))

  const colliders = [
    { x: -2.2, z: -3.2, r: 1.1 }, // sign
    { x: 2.6, z: -3.0, r: 0.5 },  // flag
  ]

  // ── Stations ──
  const stations = {}
  const stationList = []
  const walkables = [] // meshes the player can stand on top of (ground-height raycast)
  const cowColliders = [] // roaming cows — world position read fresh each frame
  stationIds.forEach(id => {
    const layout = STATION_LAYOUT[id]
    const builder = BUILDERS[id]
    if (!layout || !builder) return

    let x, z, rot, anchor
    if (layout.trail) {
      x = layout.x; z = layout.z; rot = layout.rot; anchor = layout.anchor
    } else {
      const a = (layout.angle * Math.PI) / 180
      x = Math.cos(a) * STATION_R
      z = Math.sin(a) * STATION_R
      rot = -a - Math.PI / 2 // local +z faces the island hub
      anchor = { x: Math.cos(a) * (STATION_R - 6), z: Math.sin(a) * (STATION_R - 6) }
    }

    const built = builder()
    place(built.group, x, 0, z, rot)
    built.post.scale.setScalar(0.001)
    scene.add(built.group)

    // ring stations get a radial sidewalk from the plaza; trail stations share
    // the winding trail path (built once, below) instead
    if (!layout.trail) {
      const a = (layout.angle * Math.PI) / 180
      const pathLen = STATION_R - 9
      const px = Math.cos(a) * (4.5 + pathLen / 2)
      const pz = Math.sin(a) * (4.5 + pathLen / 2)
      const path = box(2.4, 0.1, pathLen, C.path)
      path.castShadow = false
      path.receiveShadow = true
      place(path, px, 0.05, pz, -a + Math.PI / 2)
      scene.add(path)
      walkables.push(path)
    }
    if (built.walkables) walkables.push(...built.walkables)
    if (built.group.userData.cows) cowColliders.push(...built.group.userData.cows)

    // beacon on the path, just before the station
    const beacon = makeBeacon()
    place(beacon, anchor.x, 0, anchor.z)
    scene.add(beacon)

    // transform local colliders to world space
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    built.colliders.forEach(c => {
      colliders.push({ x: x + c.x * cos + c.z * sin, z: z - c.x * sin + c.z * cos, r: c.r })
    })

    const station = { id, ...built, beacon, anchor, completed: false }
    stations[id] = station
    stationList.push(station)
  })

  // ── Bridge (walkable boardwalk between the two islands) ──
  const bridgeRy = -NH + Math.PI / 2
  const bridgeMid = { x: Math.cos(NH) * 44, z: Math.sin(NH) * 44 }
  const BRIDGE_LEN = 22
  const deck = box(7.4, 0.22, BRIDGE_LEN, C.trunk)
  deck.castShadow = false
  deck.receiveShadow = true
  place(deck, bridgeMid.x, 0.0, bridgeMid.z, bridgeRy) // top ≈ 0.11, matches paths
  scene.add(deck)
  walkables.push(deck)
  // plank battens across the deck for texture
  const battenT = []
  for (let i = 0; i < 14; i++) battenT.push({ x: 0, y: 0.12, z: -BRIDGE_LEN / 2 + 0.9 + i * 1.6 })
  const battens = new THREE.InstancedMesh(new THREE.BoxGeometry(7.2, 0.05, 0.25), mat(0x8a6a4a), battenT.length)
  {
    const d = new THREE.Object3D()
    battenT.forEach((tr, i) => { d.position.set(tr.x, tr.y, tr.z); d.updateMatrix(); battens.setMatrixAt(i, d.matrix) })
  }
  battens.castShadow = false
  const bridgeDeckGroup = new THREE.Group()
  place(bridgeDeckGroup, bridgeMid.x, 0.0, bridgeMid.z, bridgeRy)
  bridgeDeckGroup.add(battens)
  scene.add(bridgeDeckGroup)
  // low railings + support posts (decorative; the clamp keeps the player on deck)
  const railPostT = [], underPostT = []
  for (let i = 0; i <= 8; i++) {
    const lz = -BRIDGE_LEN / 2 + i * (BRIDGE_LEN / 8)
    ;[-3.5, 3.5].forEach(lx => {
      railPostT.push({ x: lx, y: 0.55, z: lz })
      underPostT.push({ x: lx, y: -6.5, z: lz })
    })
  }
  const railPosts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), mat(C.trunk), railPostT.length)
  const underPosts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 13, 0.22), mat(C.deadwood), underPostT.length)
  {
    const d = new THREE.Object3D()
    railPostT.forEach((tr, i) => { d.position.set(tr.x, tr.y, tr.z); d.updateMatrix(); railPosts.setMatrixAt(i, d.matrix) })
    underPostT.forEach((tr, i) => { d.position.set(tr.x, tr.y, tr.z); d.updateMatrix(); underPosts.setMatrixAt(i, d.matrix) })
  }
  railPosts.castShadow = false
  underPosts.castShadow = false
  bridgeDeckGroup.add(railPosts, underPosts)
  ;[-3.5, 3.5].forEach(lx => {
    const rail = box(0.1, 0.1, BRIDGE_LEN, C.trunk)
    rail.castShadow = false
    place(rail, lx, 0.95, 0)
    bridgeDeckGroup.add(rail)
  })

  // ── Trail (winding walkable path across the new island) ──
  for (let i = 0; i < TRAIL_WAYPOINTS.length - 1; i++) {
    const p1 = TRAIL_WAYPOINTS[i]
    const p2 = TRAIL_WAYPOINTS[i + 1]
    const dx = p2.x - p1.x, dz = p2.z - p1.z
    const len = Math.hypot(dx, dz)
    const plank = box(2.6, 0.1, len + 0.7, C.path)
    plank.castShadow = false
    plank.receiveShadow = true
    place(plank, (p1.x + p2.x) / 2, 0.05, (p1.z + p2.z) / 2, Math.atan2(dx, dz))
    scene.add(plank)
    walkables.push(plank)
  }

  // ── Landmark: rainbow tree at the trail's end ──
  const rtPos = trailPoint(-27.5, 0)
  const rainbowTree = makeRainbowTree()
  place(rainbowTree, rtPos.x, 0, rtPos.z, rand(0, Math.PI * 2))
  scene.add(rainbowTree)
  colliders.push({ x: rtPos.x, z: rtPos.z, r: 1.4 })

  // ── Decorations ──
  // Scatter greenery on an island: perimeter trees/rocks, grass tufts, three
  // flower colors and mottled splotches — skipping stations, the trail and the
  // island hub. Runs for both islands (denser than the original single pass).
  const nearStationCluster = (x, z, pad) =>
    stationList.some(s => Math.hypot(s.group.position.x - x, s.group.position.z - z) < pad)
  const nearTrail = (x, z, pad) => {
    for (let i = 0; i < TRAIL_WAYPOINTS.length - 1; i++) {
      const p1 = TRAIL_WAYPOINTS[i], p2 = TRAIL_WAYPOINTS[i + 1]
      const c = closestOnSegment(x, z, p1.x, p1.z, p2.x, p2.z)
      if (Math.hypot(x - c.x, z - c.z) < pad) return true
    }
    return false
  }
  // keep decorations (especially collider-carrying trees) off the bridge
  // corridor so a random spawn can never block the crossing
  const nearBridge = (x, z, pad) => {
    const c = closestOnSegment(x, z, BRIDGE_A.x, BRIDGE_A.z, BRIDGE_B.x, BRIDGE_B.z)
    return Math.hypot(x - c.x, z - c.z) < pad
  }
  // keep random scatter from crowding the landmark rainbow tree
  const nearLandmark = (x, z) => Math.hypot(x - rtPos.x, z - rtPos.z) < 6
  const addScatter = (mesh) => { mesh.castShadow = false; scene.add(mesh); return mesh }

  function scatterIsland({ cx, cz, radius, hubR, treeCount, tuftCount, splotchCount }) {
    for (let i = 0; i < treeCount; i++) {
      const a = (i / treeCount) * Math.PI * 2 + 0.28
      const r = radius * rand(0.82, 0.94)
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r
      if (nearStationCluster(x, z, 9) || nearTrail(x, z, 3.5) || nearBridge(x, z, 5.5) || nearLandmark(x, z)) continue
      const tree = i % 3 === 0
        ? makePine(rand(0.85, 1.25))
        : makeTree(rand(0.85, 1.3), i % 2 === 0 ? pick(C.accentFoliage) : null)
      place(tree, x, 0, z, rand(0, Math.PI * 2))
      scene.add(tree)
      colliders.push({ x, z, r: 0.9 })
    }
    for (let i = 0; i < Math.round(treeCount * 0.6); i++) {
      const a = rand(0, Math.PI * 2), r = radius * rand(0.75, 0.92)
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r
      if (nearStationCluster(x, z, 9) || nearTrail(x, z, 2.5) || nearBridge(x, z, 4.5) || nearLandmark(x, z)) continue
      const rock = makeRock(rand(0.5, 1.1))
      rock.castShadow = false
      scene.add(place(rock, x, 0, z))
    }
    // tufts + three flower colors
    const tuftT = [], flowerPT = [], flowerYT = [], flowerWT = []
    for (let i = 0; i < tuftCount; i++) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * (radius - 4)
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r
      if (nearStationCluster(x, z, 8) || nearTrail(x, z, 2.4) || nearBridge(x, z, 4.5) || nearLandmark(x, z) || (hubR && Math.hypot(x - cx, z - cz) < hubR)) continue
      const t = { x, y: 0.2, z, s: rand(0.5, 1), ry: rand(0, Math.PI) }
      if (i % 5 === 0) flowerPT.push(t)
      else if (i % 5 === 1) flowerYT.push(t)
      else if (i % 5 === 2) flowerWT.push(t)
      else tuftT.push(t)
    }
    addScatter(instanced(new THREE.ConeGeometry(0.15, 0.45, 5), C.grassDark, tuftT))
    addScatter(instanced(new THREE.SphereGeometry(0.14, 6, 5), C.flowerPink, flowerPT))
    addScatter(instanced(new THREE.SphereGeometry(0.14, 6, 5), C.flowerYellow, flowerYT))
    addScatter(instanced(new THREE.SphereGeometry(0.13, 6, 5), C.flowerWhite, flowerWT))
    // mottled darker-green lawn splotches
    const splotchGeo = new THREE.CircleGeometry(1, 12)
    splotchGeo.rotateX(-Math.PI / 2)
    const splotchT = []
    for (let i = 0; i < splotchCount; i++) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * (radius - 5)
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r
      if (nearStationCluster(x, z, 9) || nearTrail(x, z, 2.4) || nearBridge(x, z, 4.5) || nearLandmark(x, z) || (hubR && Math.hypot(x - cx, z - cz) < hubR)) continue
      splotchT.push({ x, y: 0.02, z, s: rand(1.3, 3.2), sy: 1, ry: rand(0, Math.PI) })
    }
    const splotches = instanced(splotchGeo, C.grassDark, splotchT)
    splotches.castShadow = false
    splotches.receiveShadow = true
    scene.add(splotches)
  }
  // main island — denser than before, hub kept clear
  scatterIsland({ cx: 0, cz: 0, radius: 38, hubR: 6.5, treeCount: 14, tuftCount: 130, splotchCount: 32 })
  // trail island
  scatterIsland({ cx: NC.x, cz: NC.z, radius: 30, hubR: 0, treeCount: 10, tuftCount: 90, splotchCount: 22 })

  // clouds — cover both islands
  const clouds = []
  for (let i = 0; i < 11; i++) {
    const cloud = makeCloud()
    place(cloud, rand(-95, 60), rand(22, 34), rand(-95, 45))
    cloud.userData.speed = rand(0.6, 1.6)
    scene.add(cloud)
    clouds.push(cloud)
  }
  // one shared material per cloud (see makeCloud) — collected for day/night tint
  const cloudMats = clouds.map(c => c.children[0].material)

  // circling birds — a rotating carrier over each island
  function makeBirdCarrier(cx, cz, baseR, baseY) {
    const carrier = new THREE.Group()
    carrier.position.set(cx, 0, cz)
    for (let i = 0; i < 3; i++) {
      const bird = new THREE.Group()
      const w1 = box(0.5, 0.04, 0.14, C.roof); w1.rotation.z = 0.5; w1.position.x = -0.2
      const w2 = box(0.5, 0.04, 0.14, C.roof); w2.rotation.z = -0.5; w2.position.x = 0.2
      bird.add(w1, w2)
      place(bird, baseR + i * 2.5, baseY + i * 1.2, i * 3)
      bird.rotation.y = Math.PI / 2
      carrier.add(bird)
    }
    scene.add(carrier)
    return carrier
  }
  const birdCarrier = makeBirdCarrier(0, 0, 24, 19)
  const birdCarrier2 = makeBirdCarrier(NC.x, NC.z, 20, 17)

  // ── NPCs ──
  // Wandering doll characters the player can walk up to and talk to. Each is a
  // procedural character (its own geometry + materials — fine at 4, not dozens)
  // on a 1.7 scaled holder, driven along a patrol route by updateNpc.
  const npcs = []
  const npcColliders = [] // wrappers whose XZ blocks the player (like cows)
  NPCS.forEach(def => {
    const char = createProceduralCharacter(def.look || {})
    char.root.traverse(obj => {
      if (obj.isMesh && !obj.material.transparent && obj.material.type !== 'MeshBasicMaterial') obj.castShadow = true
    })
    const holder = new THREE.Group()
    holder.scale.setScalar(1.7)
    holder.userData.walkT = 0
    holder.add(char.root)
    const g = new THREE.Group() // world wrapper: position + heading
    g.add(holder)
    const route = NPC_ROUTES[def.route] || NPC_ROUTES.hubLoop
    g.position.set(route[0].x, 0, route[0].z)
    scene.add(g)
    npcs.push({
      def, char, holder, root: g, route,
      wpIndex: 0, mode: 'walk', timer: rand(0.5, 2.5), heading: 0, phase: rand(0, Math.PI * 2),
    })
    npcColliders.push(g)
  })

  // ── Roaming barnyard animals ──
  // Chickens and pigs amble around both islands with the same idle/graze/walk
  // state machine as the pasture cows (updateCow), but bounded to a circle per
  // island instead of a rectangular fence. Pigs are solid enough to nudge the
  // player (pushed into cowColliders); chickens are too small to bother.
  const roamers = []
  const spawnRoamer = (make, scale, cx, cz, roamR, speed, blocks) => {
    const a = make(scale)
    const ang = rand(0, Math.PI * 2)
    const rr = Math.sqrt(Math.random()) * roamR * 0.8 // bias inward, off the rim
    a.position.set(cx + Math.cos(ang) * rr, 0, cz + Math.sin(ang) * rr)
    a.rotation.y = rand(0, Math.PI * 2)
    a.userData.phase = rand(0, Math.PI * 2)
    a.userData.speed = speed
    a.userData.ai = { mode: 'idle', timer: rand(0.5, 4), heading: rand(0, Math.PI * 2) }
    a.userData.bounds = { cx, cz, r: roamR }
    scene.add(a)
    roamers.push(a)
    if (blocks) cowColliders.push(a)
  }
  // main island (center 0,0) — a small flock + a couple of pigs
  for (let i = 0; i < 3; i++) spawnRoamer(makeChicken, rand(0.42, 0.5), 0, 0, 30, 0.7, false)
  for (let i = 0; i < 2; i++) spawnRoamer(makePig, rand(0.6, 0.72), 0, 0, 30, 0.5, true)
  // trail island
  for (let i = 0; i < 2; i++) spawnRoamer(makeChicken, rand(0.42, 0.5), NC.x, NC.z, 22, 0.7, false)
  spawnRoamer(makePig, rand(0.6, 0.72), NC.x, NC.z, 22, 0.5, true)

  // ── Player ──
  // `player` is a movable wrapper: movement/heading/camera all target it, and
  // it carries whichever character is active — the fairy-worlds doll (default,
  // built lazily by the initial applyLook) or the farmer mascot.
  const player = new THREE.Group()
  const farmer = makeFarmer()
  player.add(farmer)
  player.position.set(0, 0, 8)
  scene.add(player)
  let heading = Math.PI // facing the hub sign
  player.rotation.y = heading

  let doll = null // procedural character handle (see procedural-character.js)
  let dollG = null // scaled holder; also carries the doll's walk bob/waddle
  let activeCharacter = 'farmer'
  let lastLook = null // stashed by applyLook so ensureDoll can seed state

  // The doll casts shadows like the farmer — but skip flat face decals
  // (basic-material circles) and transparent parts (wings, sticker blush),
  // whose shadows would read as floating smudges.
  function applyDollShadows() {
    if (!doll) return
    doll.root.traverse(obj => {
      if (obj.isMesh && !obj.material.transparent && obj.material.type !== 'MeshBasicMaterial') {
        obj.castShadow = true
      }
    })
  }

  function ensureDoll() {
    if (doll) return doll
    doll = createProceduralCharacter(lastLook?.doll || {})
    doll.setOnRebuild(applyDollShadows) // variant swaps create fresh meshes
    applyDollShadows()
    dollG = new THREE.Group()
    // fairy-worlds doll is ~1.36 units tall vs the farmer's ~2.3 — scale to match
    dollG.scale.setScalar(1.7)
    dollG.add(doll.root)
    dollG.userData.walkT = 0
    dollG.visible = false
    player.add(dollG)
    return doll
  }

  // ── Tweens ──
  const tweens = []
  function tween(dur, onUpdate, { ease = easeOutCubic, onDone, delay = 0 } = {}) {
    tweens.push({ t: -delay, dur, onUpdate, ease, onDone })
  }
  function stepTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]
      tw.t += dt
      if (tw.t < 0) continue
      const p = Math.min(1, tw.t / tw.dur)
      tw.onUpdate(tw.ease(p))
      if (p >= 1) {
        tweens.splice(i, 1)
        if (tw.onDone) tw.onDone()
      }
    }
  }

  // ── State ──
  let movementEnabled = true
  let nearTargetKey = null
  let disposed = false
  const clock = new THREE.Clock()

  // ── Resize ──
  function resize() {
    const w = host.clientWidth || 1
    const h = host.clientHeight || 1
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  // ── Movement + collisions ──
  // Raised standable surfaces (sidewalks, crop-field bed + ridges, soil-pit
  // floor + curbs, pond bank) are registered in `walkables`; a downward ray
  // reports the surface height under the player so feet ride on top instead
  // of sinking through. Everything else sits at y ≈ 0.
  const groundRay = new THREE.Raycaster(undefined, undefined, 0, 12)
  const groundOrigin = new THREE.Vector3()
  const GROUND_DOWN = new THREE.Vector3(0, -1, 0)
  const groundHits = []
  function groundHeightAt(x, z) {
    groundOrigin.set(x, 6, z)
    groundRay.set(groundOrigin, GROUND_DOWN)
    groundHits.length = 0
    groundRay.intersectObjects(walkables, false, groundHits)
    return groundHits.length ? Math.max(0, groundHits[0].point.y) : 0
  }

  const camTarget = new THREE.Vector3()
  // eased lookAt target — smooths the view-point jump when a talk/customize
  // focus grabs the camera, instead of snapping the frame
  const lookCur = new THREE.Vector3(0, 1.7, 8)
  const lookGoal = new THREE.Vector3()
  const cowPos = new THREE.Vector3()
  const cowScl = new THREE.Vector3()
  function movePlayer(dt) {
    const input = getInput()
    let ix = input.x
    let iy = input.y
    const mag = Math.hypot(ix, iy)
    if (!movementEnabled || mag < 0.15) return 0
    if (mag > 1) { ix /= mag; iy /= mag }

    // input is screen-relative — rotate it by the camera's yaw so "up" always
    // means away from the camera, whatever the current orbit
    const cy = Math.cos(camYaw)
    const sy = Math.sin(camYaw)
    const wx = ix * cy + iy * sy
    const wz = -ix * sy + iy * cy

    const dist = SPEED * dt * Math.min(1, mag)
    let nx = player.position.x + wx * dist
    let nz = player.position.z + wz * dist

    // island edges + bridge corridor
    const clamped = clampToRegions(nx, nz)
    nx = clamped.x
    nz = clamped.z
    // circle colliders — push out
    for (const c of colliders) {
      const dx = nx - c.x
      const dz = nz - c.z
      const d = Math.hypot(dx, dz)
      const min = c.r + PLAYER_R
      if (d < min && d > 0.0001) {
        nx = c.x + (dx / d) * min
        nz = c.z + (dz / d) * min
      }
    }
    // cows roam, so their blocking circles follow their world position; the
    // radius follows world scale (calf is 0.55, and it lives in the pasture's
    // `post` group, which stays at ~0.001 until the station is restored)
    for (const cow of cowColliders) {
      cow.getWorldPosition(cowPos)
      const s = cow.getWorldScale(cowScl).x
      if (s < 0.4) continue
      const min = 1.15 * s + PLAYER_R
      const dx = nx - cowPos.x
      const dz = nz - cowPos.z
      const d = Math.hypot(dx, dz)
      if (d < min && d > 0.0001) {
        nx = cowPos.x + (dx / d) * min
        nz = cowPos.z + (dz / d) * min
      }
    }
    // NPCs block the player too (they stay full-scale on the ground)
    for (const g of npcColliders) {
      const dx = nx - g.position.x
      const dz = nz - g.position.z
      const d = Math.hypot(dx, dz)
      const min = NPC_BLOCK_R + PLAYER_R
      if (d < min && d > 0.0001) {
        nx = g.position.x + (dx / d) * min
        nz = g.position.z + (dz / d) * min
      }
    }
    // re-clamp: a push-out could otherwise shove the player off a region
    // (the bridge corridor is only 3.5 wide — an NPC squeeze-past matters)
    const reclamped = clampToRegions(nx, nz)
    nx = reclamped.x
    nz = reclamped.z

    player.position.x = nx
    player.position.z = nz

    // smooth turn toward travel direction
    const target = Math.atan2(wx, wz)
    let delta = target - heading
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta < -Math.PI) delta += Math.PI * 2
    heading += delta * Math.min(1, dt * 10)
    player.rotation.y = heading

    return dist
  }

  // ── Frame loop ──
  function frame() {
    if (!host.isConnected) { dispose(); return }
    const dt = Math.min(clock.getDelta(), 0.1)
    const t = clock.elapsedTime

    const moved = movePlayer(dt)

    // step up/down onto raised platforms — sidewalks, crop beds, pit curbs
    // (eased so it reads as a hop, not a snap); the walk-cycle bob below rides
    // on child groups, so the two never fight over the same transform
    player.position.y += (groundHeightAt(player.position.x, player.position.z) - player.position.y) * Math.min(1, dt * 14)

    // walk cycle — limbs swing while moving, everything settles when idle
    if (activeCharacter === 'farmer') {
      const pu = farmer.userData
      if (moved > 0) {
        pu.walkT += dt * 10.5
        const s = Math.sin(pu.walkT)
        pu.legL.rotation.x = s * 0.75
        pu.legR.rotation.x = -s * 0.75
        pu.armL.rotation.x = -s * 0.55
        pu.armR.rotation.x = s * 0.55
        pu.bodyG.position.y = Math.abs(s) * 0.09
        pu.bodyG.rotation.x = 0.07 // slight forward lean
      } else {
        const settle = Math.min(1, dt * 8)
        ;[pu.legL, pu.legR, pu.armL, pu.armR].forEach(p => { p.rotation.x -= p.rotation.x * settle })
        pu.bodyG.rotation.x -= pu.bodyG.rotation.x * settle
        // gentle idle breathing bob
        pu.bodyG.position.y += (0.02 + Math.sin(t * 2.2) * 0.02 - pu.bodyG.position.y) * settle
      }
    } else if (dollG) {
      // the doll's shoulder/hip pivots carry the limbs AND their outfit parts
      // (sleeves, socks, trouser legs), so the shared gait swings everything
      stepGait(doll.limbs, dollG, moved > 0, dt, t)
    }

    // NPCs — patrol their routes, ride ground height, walk-cycle their limbs
    npcs.forEach(npc => updateNpc(npc, dt, t))

    // keep the shadow frustum under the player so shadows work on both islands
    sun.position.set(player.position.x + SUN_OFFSET.x, SUN_OFFSET.y, player.position.z + SUN_OFFSET.z)
    sun.target.position.set(player.position.x, 0, player.position.z)

    // camera: orbitable follow with exponential smoothing — snappier while a
    // drag is active so orbiting doesn't feel like it's dragging through mud.
    // The orbit anchor is the player, except mid-conversation, where it's the
    // player↔NPC midpoint so the zoomed talk framing holds both characters.
    let ax = player.position.x
    let ay = player.position.y
    let az = player.position.z
    if (talkingNpc) {
      ax = (ax + talkingNpc.root.position.x) / 2
      ay = (ay + talkingNpc.root.position.y) / 2
      az = (az + talkingNpc.root.position.z) / 2
    }
    const cp = Math.cos(camPitch)
    camTarget.set(
      ax + Math.sin(camYaw) * cp * camDist,
      ay + Math.sin(camPitch) * camDist,
      az + Math.cos(camYaw) * cp * camDist
    )
    const k = 1 - Math.exp(-(dragPts.size > 0 ? 10 : 2.6) * dt)
    camera.position.lerp(camTarget, k)
    if (customizeFocus) {
      // pan toward screen-left so the player stands clear of the customizer
      // panel (docked on the left ⇒ character framed in the right half)
      const rx = Math.cos(camYaw)
      const rz = -Math.sin(camYaw)
      lookGoal.set(player.position.x - rx * 1.45, player.position.y + 1.1, player.position.z - rz * 1.45)
    } else if (talkingNpc) {
      // aim well above head height: the pair drops into the lower half of the
      // frame, leaving the upper half clear for the speech bubble
      lookGoal.set(ax, ay + 2.55, az)
    } else {
      lookGoal.set(player.position.x, player.position.y + 1.7, player.position.z)
    }
    lookCur.lerp(lookGoal, 1 - Math.exp(-5.5 * dt))
    camera.lookAt(lookCur)

    // beacons
    stationList.forEach(s => {
      const u = s.beacon.userData
      u.gem.rotation.y += dt * 1.4
      u.gem.position.y = u.gemBaseY + Math.sin(t * 2 + u.phase) * 0.3
      if (!s.completed) {
        const pulse = 1 + Math.sin(t * 3 + u.phase) * 0.07
        u.ring.scale.setScalar(pulse)
        u.glow.material.opacity = 0.11 + (Math.sin(t * 3 + u.phase) + 1) * 0.045
      }
    })

    // ambient life
    stationList.forEach(s => {
      if (s.group.userData.cows) {
        const bounds = s.group.userData.cowBounds
        s.group.userData.cows.forEach(cow => updateCow(cow, bounds, dt, t))
      }
      if (s.group.userData.windmill) {
        s.group.userData.windmill.userData.rotor.rotation.z += dt * 1.3
      }
      if (s.group.userData.anemometer) {
        s.group.userData.anemometer.userData.rotor.rotation.y += dt * 2.5
      }
      if (s.group.userData.water) {
        s.group.userData.water.material.opacity = 0.8 + Math.sin(t * 1.4) * 0.06
      }
    })
    roamers.forEach(a => updateCow(a, a.userData.bounds, dt, t))
    clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * dt
      if (cloud.position.x > 100) cloud.position.x = -100
    })
    birdCarrier.rotation.y += dt * 0.12
    birdCarrier2.rotation.y -= dt * 0.09

    stepTweens(dt)

    // proximity → HUD prompt. One nearest interactable among uncompleted
    // station anchors and NPCs (you can only visit-or-talk to one at a time).
    let target = null
    let nearestD = Infinity
    stationList.forEach(s => {
      if (s.completed) return
      const d = Math.hypot(player.position.x - s.anchor.x, player.position.z - s.anchor.z)
      if (d < INTERACT_R && d < nearestD) { nearestD = d; target = { type: 'station', id: s.id } }
    })
    npcs.forEach(npc => {
      const d = Math.hypot(player.position.x - npc.root.position.x, player.position.z - npc.root.position.z)
      if (d < NPC_TALK_R && d < nearestD) { nearestD = d; target = { type: 'npc', id: npc.def.id } }
    })
    const key = target ? `${target.type}:${target.id}` : null
    if (key !== nearTargetKey) {
      nearTargetKey = key
      onNearTarget(target)
    }

    renderer.render(scene, camera)
  }
  renderer.setAnimationLoop(frame)

  // NPC patrol: walk toward the current waypoint, idle a beat on arrival, then
  // advance (looping). Rides ground height like the player and drives the gait.
  function updateNpc(npc, dt, t) {
    const g = npc.root
    if (npc.talking) {
      // mid-conversation: stand still and face the player
      const dx = player.position.x - g.position.x
      const dz = player.position.z - g.position.z
      if (Math.hypot(dx, dz) > 0.001) {
        const targetH = Math.atan2(dx, dz)
        let delta = targetH - npc.heading
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        npc.heading += delta * Math.min(1, dt * 6)
        g.rotation.y = npc.heading
      }
      stepGait(npc.char.limbs, npc.holder, false, dt, t, { phase: npc.phase })
      return
    }
    npc.timer -= dt
    if (npc.mode === 'idle') {
      if (npc.timer <= 0) { npc.mode = 'walk'; npc.wpIndex = (npc.wpIndex + 1) % npc.route.length }
    } else {
      const wp = npc.route[npc.wpIndex]
      const dx = wp.x - g.position.x
      const dz = wp.z - g.position.z
      const d = Math.hypot(dx, dz)
      if (d < 0.4) {
        npc.mode = 'idle'
        npc.timer = rand(2, 5)
      } else {
        const step = Math.min(d, (npc.def.speed || 1.4) * dt)
        g.position.x += (dx / d) * step
        g.position.z += (dz / d) * step
        const targetH = Math.atan2(dx, dz) // model faces +z
        let delta = targetH - npc.heading
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        npc.heading += delta * Math.min(1, dt * 6)
        g.rotation.y = npc.heading
      }
    }
    g.position.y += (groundHeightAt(g.position.x, g.position.z) - g.position.y) * Math.min(1, dt * 14)
    // gentler arcs + slower cadence than the player: NPCs stroll at ~1.4 u/s
    stepGait(npc.char.limbs, npc.holder, npc.mode === 'walk', dt, t, { phase: npc.phase, amp: 0.55, freq: 6.5 })
  }

  // ── Facade ──

  /** Swap a station from degraded to restored, with a pop animation. */
  function upgradeStation(id, onDone) {
    const s = stations[id]
    if (!s || s.completed) { if (onDone) onDone(); return }
    s.completed = true

    // beacon → "done" green
    const u = s.beacon.userData
    ;[u.ring.material, u.gem.material].forEach(m => {
      m.color.setHex(C.beaconDone)
      m.emissive.setHex(C.beaconDone)
    })
    u.glow.material.color.setHex(C.beaconDone)
    u.glow.material.opacity = 0.08
    u.ring.scale.setScalar(1)

    // celebratory ring pulse
    const pulse = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.1, 8, 30),
      new THREE.MeshBasicMaterial({ color: C.beaconDone, transparent: true, opacity: 0.8 })
    )
    pulse.rotation.x = -Math.PI / 2
    pulse.position.copy(s.beacon.position)
    pulse.position.y = 0.2
    scene.add(pulse)
    tween(1.1, p => {
      pulse.scale.setScalar(1 + p * 6)
      pulse.material.opacity = 0.8 * (1 - p)
    }, {
      onDone: () => {
        scene.remove(pulse)
        pulse.geometry.dispose()
        pulse.material.dispose()
      },
    })

    // degraded state shrinks away, restored state pops in
    tween(0.35, p => { s.pre.scale.setScalar(Math.max(0.001, 1 - p)) }, {
      onDone: () => { s.pre.visible = false },
    })
    tween(0.9, p => { s.post.scale.setScalar(Math.max(0.001, p)) }, {
      ease: easeOutBack,
      delay: 0.3,
      onDone,
    })
  }

  function setMovementEnabled(v) {
    movementEnabled = v
  }

  /** Pause an NPC's patrol while its dialogue is open (it turns to face the
      player) and zoom the camera in on the two of them — a side-on two-shot
      the speech bubble floats over; pass null to resume everyone. */
  function setTalkingNpc(id) {
    npcs.forEach(npc => { npc.talking = npc.def.id === id })
    const npc = id != null ? npcs.find(n => n.def.id === id) || null : null
    if (npc && !talkingNpc) {
      talkSaved = { yaw: camYaw, pitch: camPitch, dist: camDist }
      // aim perpendicular to the player→NPC axis so both stand in frame,
      // swinging toward whichever side is closer to the current orbit
      const axis = Math.atan2(npc.root.position.x - player.position.x, npc.root.position.z - player.position.z)
      const turn = (a) => {
        let d = a - camYaw
        while (d > Math.PI) d -= Math.PI * 2
        while (d < -Math.PI) d += Math.PI * 2
        return d
      }
      const d1 = turn(axis + Math.PI / 2)
      const d2 = turn(axis - Math.PI / 2)
      camYaw += Math.abs(d1) <= Math.abs(d2) ? d1 : d2
      camPitch = 0.3
      camDist = 7.5
    } else if (!npc && talkSaved) {
      camYaw = talkSaved.yaw
      camPitch = talkSaved.pitch
      camDist = talkSaved.dist
      talkSaved = null
    }
    talkingNpc = npc
  }

  /** Return the camera orbit to the default behind-the-player view. */
  function resetCamera() {
    if (camSaved) {
      // customizer holds the camera — reset what gets restored on close
      camSaved = { yaw: 0, pitch: CAM_PITCH, dist: CAM_DIST }
    } else if (talkSaved) {
      // conversation holds the camera — same deal
      talkSaved = { yaw: 0, pitch: CAM_PITCH, dist: CAM_DIST }
    } else {
      camYaw = 0
      camPitch = CAM_PITCH
      camDist = CAM_DIST
    }
  }

  /**
   * Recolor / re-hat the player and switch the active character.
   * look: { character: 'farmer'|'doll', body, hat, hatColor, shoes, pack,
   *         doll: <procedural character state|null> }
   */
  function applyLook(look) {
    lastLook = look
    const u = farmer.userData
    // .set() accepts '#rrggbb' strings and legacy numeric hex alike
    u.mats.body.color.set(look.body)
    u.mats.hat.color.set(look.hatColor)
    u.mats.shoe.color.set(look.shoes)
    u.mats.pack.color.set(look.pack)
    u.hats.beanie.visible = look.hat === 'beanie'
    u.hats.straw.visible = look.hat === 'straw'

    activeCharacter = look.character === 'doll' ? 'doll' : 'farmer'
    if (activeCharacter === 'doll') ensureDoll()
    farmer.visible = activeCharacter === 'farmer'
    if (dollG) dollG.visible = activeCharacter === 'doll'
  }

  /**
   * Handle to the second character for the customizer's granular edits
   * (setColor / setVariant / setAccessory / setAccessoryColor / getState).
   * State persistence stays in index.js — it saves getState() into the look.
   */
  function getDollCharacter() {
    return ensureDoll()
  }

  /** Swing the camera around to the player's face while the customizer is
      open; restore the previous orbit when it closes. */
  function setCustomizeFocus(on) {
    if (on && !camSaved) {
      camSaved = { yaw: camYaw, pitch: camPitch, dist: camDist }
      camYaw = heading // offset along the facing direction = in front
      camPitch = 0.3
      camDist = 6.3
      customizeFocus = true
    } else if (!on && camSaved) {
      camYaw = camSaved.yaw
      camPitch = camSaved.pitch
      camDist = camSaved.dist
      camSaved = null
      customizeFocus = false
    }
  }

  // ── Day / night ──
  // Preset pairs lerped by a tween; the theme-toggle slot in the world topbar
  // drives this instead of the app theme (the HUD is theme-invariant white).
  const TOD = {
    day: {
      sky: new THREE.Color(C.sky), hemiSky: new THREE.Color(0xe8f7ff), hemiGround: new THREE.Color(0xa8c98a),
      hemiI: 1.3, sunI: 1.8, sunC: new THREE.Color(0xfff6e0), sea: new THREE.Color(C.water),
      disc: new THREE.Color(C.sun), cloud: new THREE.Color(0xffffff), stars: 0,
    },
    night: {
      sky: new THREE.Color(0x1e2a52), hemiSky: new THREE.Color(0x7d90cc), hemiGround: new THREE.Color(0x2e3d55),
      hemiI: 0.55, sunI: 0.75, sunC: new THREE.Color(0xc3d3ff), sea: new THREE.Color(0x143a68),
      disc: new THREE.Color(0xf0f4ff), cloud: new THREE.Color(0x93a3c8), stars: 0.9,
    },
  }

  /** Fade the world between 'day' and 'night' (default day). */
  function setTimeOfDay(mode) {
    const to = TOD[mode] || TOD.day
    const from = {
      sky: scene.background.clone(),
      hemiSky: hemi.color.clone(),
      hemiGround: hemi.groundColor.clone(),
      hemiI: hemi.intensity,
      sunI: sun.intensity,
      sunC: sun.color.clone(),
      sea: sea.material.color.clone(),
      disc: sunDisc.material.color.clone(),
      cloud: cloudMats[0] ? cloudMats[0].color.clone() : new THREE.Color(0xffffff),
      stars: starMat.opacity,
    }
    stars.visible = true
    tween(0.9, p => {
      scene.background.lerpColors(from.sky, to.sky, p)
      scene.fog.color.copy(scene.background)
      hemi.color.lerpColors(from.hemiSky, to.hemiSky, p)
      hemi.groundColor.lerpColors(from.hemiGround, to.hemiGround, p)
      hemi.intensity = from.hemiI + (to.hemiI - from.hemiI) * p
      sun.intensity = from.sunI + (to.sunI - from.sunI) * p
      sun.color.lerpColors(from.sunC, to.sunC, p)
      sea.material.color.lerpColors(from.sea, to.sea, p)
      sunDisc.material.color.lerpColors(from.disc, to.disc, p)
      cloudMats.forEach(m => m.color.lerpColors(from.cloud, to.cloud, p))
      starMat.opacity = from.stars + (to.stars - from.stars) * p
    }, {
      onDone: () => { if (to.stars === 0) stars.visible = false },
    })
  }

  function dispose() {
    if (disposed) return
    disposed = true
    renderer.setAnimationLoop(null)
    ro.disconnect()
    // The module-level matCache is shared across instances and kept for the
    // app's lifetime (a few dozen tiny Lambert materials) — never dispose
    // those, only per-instance geometries and non-cached materials.
    const cached = new Set(matCache.values())
    scene.traverse(obj => {
      // InstancedMesh.dispose() releases the GPU-side instanceMatrix buffer —
      // geometry/material disposal alone doesn't cover it.
      if (obj.isInstancedMesh) obj.dispose()
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => { if (!cached.has(m)) m.dispose() })
      }
    })
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    if (onDisposed) onDisposed()
  }

  return { dispose, upgradeStation, setMovementEnabled, setTalkingNpc, resetCamera, applyLook, getDollCharacter, setCustomizeFocus, setTimeOfDay }
}
