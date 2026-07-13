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
    const nx = cow.position.x + Math.cos(ai.heading) * 0.55 * dt
    const nz = cow.position.z + Math.sin(ai.heading) * 0.55 * dt
    if (Math.abs(nx) > bounds.w || Math.abs(nz) > bounds.d) {
      // turn back toward the middle of the pasture
      ai.heading = Math.atan2(-cow.position.z, -cow.position.x) + rand(-0.5, 0.5)
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

  group.add(place(box(16, 0.3, 11, C.soil), 0, 0.15, 0))
  for (let i = -2; i <= 2; i++) {
    group.add(place(box(15, 0.3, 0.9, C.soilRidge), 0, 0.36, i * 2.1))
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

  group.add(pre, post)
  return { group, pre, post, colliders: [] }
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

  // the pit itself
  group.add(place(box(5.2, 0.16, 4.2, 0x2e2018), 0, 0.06, 0.6))
  group.add(place(box(5.6, 0.24, 0.35, C.path), 0, 0.12, 2.75))
  group.add(place(box(5.6, 0.24, 0.35, C.path), 0, 0.12, -1.55))
  group.add(place(box(0.35, 0.24, 4.65, C.path), 2.65, 0.12, 0.6))
  group.add(place(box(0.35, 0.24, 4.65, C.path), -2.65, 0.12, 0.6))

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
  return { group, pre, post, colliders: [{ x: 0, z: -2.6, r: 2.4 }] }
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
    colliders: [{ x: 0, z: 0, r: 5.4 }, { x: -5.8, z: -3.2, r: 0.8 }],
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
  return { group, pre, post, colliders: [{ x: -3.4, z: -2.6, r: 2.5 }] }
}

// ─── Layout ───
// Stations sit on a ring of radius 26; rot turns each toward the island hub.

const STATION_R = 26
const STATION_LAYOUT = {
  'crop-field': { angle: 0 },
  pond: { angle: 51.4 },
  greenhouse: { angle: 102.9 },
  pasture: { angle: 154.3 },
  heritage: { angle: 205.7 },
  farmstead: { angle: 257.1 },
  'soil-pit': { angle: 308.6 },
}

const BUILDERS = {
  'crop-field': buildCropField,
  pond: buildPond,
  greenhouse: buildGreenhouse,
  pasture: buildPasture,
  heritage: buildHeritage,
  farmstead: buildFarmstead,
  'soil-pit': buildSoilPit,
}

const ISLAND_R = 40
const PLAYER_CLAMP_R = 36
const PLAYER_R = 1.0
const SPEED = 10
const INTERACT_R = 6.2
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
 * @param {(id: string|null) => void} opts.onNearStation — nearest station in
 *   interact range changed (null = none)
 * @param {() => void} [opts.onDisposed]
 * @returns {{ dispose, upgradeStation, setMovementEnabled, resetCamera,
 *   applyLook, setCustomizeFocus, setTimeOfDay }}
 */
export function createFarmWorld({ host, stationIds, getInput, onNearStation, onDisposed }) {
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
  stationIds.forEach(id => {
    const layout = STATION_LAYOUT[id]
    const builder = BUILDERS[id]
    if (!layout || !builder) return

    const a = (layout.angle * Math.PI) / 180
    const x = Math.cos(a) * STATION_R
    const z = Math.sin(a) * STATION_R
    const rot = -a - Math.PI / 2 // local +z faces the island hub

    const built = builder()
    place(built.group, x, 0, z, rot)
    built.post.scale.setScalar(0.001)
    scene.add(built.group)

    // path from plaza to station
    const pathLen = STATION_R - 9
    const px = Math.cos(a) * (4.5 + pathLen / 2)
    const pz = Math.sin(a) * (4.5 + pathLen / 2)
    const path = box(2.4, 0.1, pathLen, C.path)
    path.castShadow = false
    path.receiveShadow = true
    place(path, px, 0.05, pz, -a + Math.PI / 2)
    scene.add(path)

    // beacon on the path, just before the station
    const bx = Math.cos(a) * (STATION_R - 6)
    const bz = Math.sin(a) * (STATION_R - 6)
    const beacon = makeBeacon()
    place(beacon, bx, 0, bz)
    scene.add(beacon)

    // transform local colliders to world space
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    built.colliders.forEach(c => {
      colliders.push({ x: x + c.x * cos + c.z * sin, z: z - c.x * sin + c.z * cos, r: c.r })
    })

    const station = { id, ...built, beacon, anchor: { x: bx, z: bz }, completed: false }
    stations[id] = station
    stationList.push(station)
  })

  // ── Decorations ──
  const perimeterTrees = []
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.28 // offset so trees fall between stations
    const r = rand(32.5, 36.5)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    // skip spots too close to a station cluster
    if (stationList.some(s => Math.hypot(s.group.position.x - x, s.group.position.z - z) < 9)) continue
    // every other broadleaf gets a candy accent color (orange/pink/yellow)
    const tree = i % 3 === 0
      ? makePine(rand(0.85, 1.25))
      : makeTree(rand(0.85, 1.3), i % 2 === 0 ? pick(C.accentFoliage) : null)
    place(tree, x, 0, z, rand(0, Math.PI * 2))
    scene.add(tree)
    colliders.push({ x, z, r: 0.9 })
    perimeterTrees.push(tree)
  }
  for (let i = 0; i < 6; i++) {
    const a = rand(0, Math.PI * 2)
    const r = rand(30, 37)
    const rock = makeRock(rand(0.5, 1.1))
    place(rock, Math.cos(a) * r, 0, Math.sin(a) * r)
    scene.add(rock)
  }

  // scattered grass tufts + flowers (instanced, island-wide)
  const tuftT = []
  const flowerT = []
  for (let i = 0; i < 90; i++) {
    const a = rand(0, Math.PI * 2)
    const r = Math.sqrt(Math.random()) * 35
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (stationList.some(s => Math.hypot(s.group.position.x - x, s.group.position.z - z) < 8.5)) continue
    if (Math.hypot(x, z) < 5.5) continue
    ;(i % 3 === 0 ? flowerT : tuftT).push({ x, y: 0.2, z, s: rand(0.5, 1), ry: rand(0, Math.PI) })
  }
  // decorative scatter — no shadow casting (biggest cheap GPU saving on iGPU)
  const scatterTufts = instanced(new THREE.ConeGeometry(0.15, 0.45, 5), C.grassDark, tuftT)
  scatterTufts.castShadow = false
  scene.add(scatterTufts)
  const scatterFlowers = instanced(new THREE.SphereGeometry(0.14, 6, 5), C.flowerPink, flowerT)
  scatterFlowers.castShadow = false
  scene.add(scatterFlowers)

  // darker-green grass splotches — the mottled lawn look from the reference
  const splotchGeo = new THREE.CircleGeometry(1, 12)
  splotchGeo.rotateX(-Math.PI / 2)
  const splotchT = []
  for (let i = 0; i < 22; i++) {
    const a = rand(0, Math.PI * 2)
    const r = Math.sqrt(Math.random()) * 33
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (stationList.some(s => Math.hypot(s.group.position.x - x, s.group.position.z - z) < 9)) continue
    if (Math.hypot(x, z) < 6.5) continue
    splotchT.push({ x, y: 0.02, z, s: rand(1.3, 3.2), sy: 1, ry: rand(0, Math.PI) })
  }
  const splotches = instanced(splotchGeo, C.grassDark, splotchT)
  splotches.castShadow = false
  splotches.receiveShadow = true
  scene.add(splotches)

  // clouds
  const clouds = []
  for (let i = 0; i < 7; i++) {
    const cloud = makeCloud()
    place(cloud, rand(-80, 80), rand(22, 34), rand(-70, 40))
    cloud.userData.speed = rand(0.6, 1.6)
    scene.add(cloud)
    clouds.push(cloud)
  }
  // one shared material per cloud (see makeCloud) — collected for day/night tint
  const cloudMats = clouds.map(c => c.children[0].material)

  // circling birds — two thin boxes in a V, on a rotating carrier
  const birdCarrier = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const bird = new THREE.Group()
    const w1 = box(0.5, 0.04, 0.14, C.roof)
    w1.rotation.z = 0.5
    w1.position.x = -0.2
    const w2 = box(0.5, 0.04, 0.14, C.roof)
    w2.rotation.z = -0.5
    w2.position.x = 0.2
    bird.add(w1, w2)
    place(bird, 24 + i * 2.5, 19 + i * 1.2, i * 3)
    bird.rotation.y = Math.PI / 2
    birdCarrier.add(bird)
  }
  scene.add(birdCarrier)

  // ── Player ──
  const player = makeFarmer()
  player.position.set(0, 0, 8)
  scene.add(player)
  let heading = Math.PI // facing the hub sign
  player.rotation.y = heading

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
  let nearStationId = null
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
  const camTarget = new THREE.Vector3()
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

    // island edge
    const r = Math.hypot(nx, nz)
    if (r > PLAYER_CLAMP_R) {
      nx = (nx / r) * PLAYER_CLAMP_R
      nz = (nz / r) * PLAYER_CLAMP_R
    }
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

    // walk cycle — limbs swing while moving, everything settles when idle
    const pu = player.userData
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

    // camera: orbitable follow with exponential smoothing — snappier while a
    // drag is active so orbiting doesn't feel like it's dragging through mud
    const cp = Math.cos(camPitch)
    camTarget.set(
      player.position.x + Math.sin(camYaw) * cp * camDist,
      player.position.y + Math.sin(camPitch) * camDist,
      player.position.z + Math.cos(camYaw) * cp * camDist
    )
    const k = 1 - Math.exp(-(dragPts.size > 0 ? 10 : 2.6) * dt)
    camera.position.lerp(camTarget, k)
    if (customizeFocus) {
      // pan toward screen-left so the player stands clear of the customizer
      // panel (docked on the left ⇒ character framed in the right half)
      const rx = Math.cos(camYaw)
      const rz = -Math.sin(camYaw)
      camera.lookAt(player.position.x - rx * 1.7, player.position.y + 1.1, player.position.z - rz * 1.7)
    } else {
      camera.lookAt(player.position.x, player.position.y + 1.7, player.position.z)
    }

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
      if (s.group.userData.water) {
        s.group.userData.water.material.opacity = 0.8 + Math.sin(t * 1.4) * 0.06
      }
    })
    clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * dt
      if (cloud.position.x > 95) cloud.position.x = -95
    })
    birdCarrier.rotation.y += dt * 0.12

    stepTweens(dt)

    // proximity → HUD prompt
    let nearest = null
    let nearestD = Infinity
    stationList.forEach(s => {
      if (s.completed) return
      const d = Math.hypot(player.position.x - s.anchor.x, player.position.z - s.anchor.z)
      if (d < INTERACT_R && d < nearestD) { nearest = s.id; nearestD = d }
    })
    if (nearest !== nearStationId) {
      nearStationId = nearest
      onNearStation(nearest)
    }

    renderer.render(scene, camera)
  }
  renderer.setAnimationLoop(frame)

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

  /** Return the camera orbit to the default behind-the-player view. */
  function resetCamera() {
    if (camSaved) {
      // customizer holds the camera — reset what gets restored on close
      camSaved = { yaw: 0, pitch: CAM_PITCH, dist: CAM_DIST }
    } else {
      camYaw = 0
      camPitch = CAM_PITCH
      camDist = CAM_DIST
    }
  }

  /** Recolor / re-hat the player. look: { body, hat, hatColor, shoes, pack } */
  function applyLook(look) {
    const u = player.userData
    // .set() accepts '#rrggbb' strings and legacy numeric hex alike
    u.mats.body.color.set(look.body)
    u.mats.hat.color.set(look.hatColor)
    u.mats.shoe.color.set(look.shoes)
    u.mats.pack.color.set(look.pack)
    u.hats.beanie.visible = look.hat === 'beanie'
    u.hats.straw.visible = look.hat === 'straw'
  }

  /** Swing the camera around to the player's face while the customizer is
      open; restore the previous orbit when it closes. */
  function setCustomizeFocus(on) {
    if (on && !camSaved) {
      camSaved = { yaw: camYaw, pitch: camPitch, dist: camDist }
      camYaw = heading // offset along the facing direction = in front
      camPitch = 0.3
      camDist = 7.6
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

  return { dispose, upgradeStation, setMovementEnabled, resetCamera, applyLook, setCustomizeFocus, setTimeOfDay }
}
