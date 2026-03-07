import { navigate } from '../router.js'
import { HORIZONS, INSTRUCTIONS } from '../data/content/soil-cake.js'

/**
 * Soil Cake Game
 * P1: Intro screen with pixel-house background
 * P2: Gameplay — single left panel with colors + decorations,
 *     large canvas with cake, instructions + character overlaid on canvas
 */

// ─── P1: INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen soil-cake-intro'

  el.innerHTML = `
    <div class="sc-intro-bg"></div>
    <div class="sc-intro-header">
      <button class="home-btn" id="sc-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="sc-intro-title">Build a Soil Cake</h2>
    </div>
    <div class="sc-intro-body">
      <div class="sc-intro-center">
        <div class="sc-speech-bubble">
          <span class="sc-speech-text">${INSTRUCTIONS.intro}</span>
        </div>
        <img class="sc-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
        <button class="sc-enter-btn" id="sc-enter"><span>Enter Bakery ➜</span></button>
      </div>
    </div>
    <div class="sc-intro-ground"><div class="ground-strip"></div></div>
    <div class="sc-intro-decor"></div>
  `

  const decor = el.querySelector('.sc-intro-decor')
  const items = [
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree1.png', style: 'left:20px;bottom:70px;height:160px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree2.png', style: 'right:20px;bottom:70px;height:150px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'left:180px;bottom:65px;height:80px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'right:200px;bottom:65px;height:80px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'left:300px;bottom:65px;height:90px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'right:350px;bottom:58px;height:60px;' },
  ]
  for (const item of items) {
    const img = document.createElement('img')
    img.src = item.src
    img.alt = ''
    img.setAttribute('style', item.style)
    decor.appendChild(img)
  }

  el.querySelector('#sc-intro-home').addEventListener('pointerdown', () => navigate('game-select/sprouts'))
  el.querySelector('#sc-enter').addEventListener('pointerdown', () => {
    const parent = el.parentNode
    const gameplay = createGameplayScreen()
    el.classList.remove('active')
    el.classList.add('exiting')
    el.addEventListener('animationend', () => el.remove(), { once: true })
    setTimeout(() => { if (el.parentNode) el.remove() }, 400)
    parent.appendChild(gameplay)
    gameplay.offsetHeight
    gameplay.classList.add('active', 'entering')
    gameplay.addEventListener('animationend', () => gameplay.classList.remove('entering'), { once: true })
  })

  return el
}

// ─── P2: GAMEPLAY ───

const LAYER_ZONES = [
  { id: 'O', top: 12, bottom: 53 },
  { id: 'A', top: 53, bottom: 63 },
  { id: 'B', top: 63, bottom: 82 },
  { id: 'C', top: 82, bottom: 100 },
]

const DECORATIONS = [
  { emoji: '\u{1F352}', name: 'Cherry' },
  { emoji: '\u{1F353}', name: 'Strawberry' },
  { emoji: '\u{1F338}', name: 'Blossom' },
  { emoji: '\u{1F365}', name: 'Narutomaki' },
  { emoji: '\u{1F497}', name: 'Heart' },
  { emoji: '\u{1F7E2}', name: 'Green' },
  { emoji: '\u{1F90D}', name: 'White Heart' },
  { emoji: '\u2B50', name: 'Star' },
  { emoji: '\u{1F380}', name: 'Bow' },
  { emoji: '\u{1F330}', name: 'Chestnut' },
  { emoji: '🍭', name: 'Candy' },
  { emoji: '\u{1F36A}', name: 'Cookie' },
  { emoji: '🌈', name: 'Rainbow' },
  { emoji: '🥜', name: 'Peanut' },
  { emoji: '🌺', name: 'Hibiscus' },
]

let selectedColor = null
let selectedId = null
let filledLayers = new Set()
let cakeContainerEl = null

function createGameplayScreen() {
  const el = document.createElement('div')
  el.className = 'screen soil-cake-game'

  const shuffled = [...HORIZONS].sort(() => Math.random() - 0.5)
  const colorsHtml = shuffled.map(h => `
    <button class="sc-color-btn" data-color="${h.color}" data-id="${h.id}">
      <div class="sc-swatch" style="background:${h.color};"></div>
      <span class="sc-swatch-label">${h.cakeName}</span>
    </button>
  `).join('')

  const decosHtml = DECORATIONS.map(d => `
    <div class="sc-deco-item" data-emoji="${d.emoji}">
      <span class="sc-deco-emoji">${d.emoji}</span>
    </div>
  `).join('')

  el.innerHTML = `
    <div class="sc-game-bg"></div>
    <div class="sc-game-header">
      <button class="home-btn" id="sc-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="sc-game-title">Build a Soil Cake</h2>
    </div>
    <div class="sc-game-body">
      <div class="sc-panel">
        <span class="sc-panel-heading">Cake Layers</span>
        <div class="sc-panel-colors">
          ${colorsHtml}
        </div>
        <div class="sc-panel-divider"></div>
        <span class="sc-panel-heading">Decorations</span>
        <div class="sc-panel-decos">
          ${decosHtml}
        </div>
      </div>
      <div class="sc-canvas-panel">
        <div class="sc-cake-wrapper">
          <div class="sc-layer-labels" id="sc-labels"></div>
          <div class="sc-cake-container" id="sc-cake">
            <div class="sc-cake-layers" id="sc-layers"></div>
            <canvas id="sc-canvas"></canvas>
            <div class="sc-dropped-decos" id="sc-dropped"></div>
          </div>
        </div>
        <div class="sc-overlay-bottom">
          <div class="sc-instructions">
            <p id="sc-instruction-text">${INSTRUCTIONS.gameplay}</p>
          </div>
          <img class="sc-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
    </div>
  `

  requestAnimationFrame(() => {
    initCake(el)
    initPalette(el)
    initDecorations(el)
  })

  el.querySelector('#sc-game-home').addEventListener('pointerdown', () => navigate('game-select/sprouts'))
  return el
}

// ─── CAKE RENDERING ───

function initCake(container) {
  const canvas = container.querySelector('#sc-canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  cakeContainerEl = container.querySelector('#sc-cake')
  const layersDiv = container.querySelector('#sc-layers')

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const tmp = document.createElement('canvas')
    tmp.width = img.width
    tmp.height = img.height
    const tc = tmp.getContext('2d', { willReadFrequently: true })
    tc.drawImage(img, 0, 0)
    const raw = tc.getImageData(0, 0, img.width, img.height)

    // Crop to content
    const b = findBounds(raw, img.width, img.height)
    const pad = 5
    const cx = Math.max(0, b.left - pad)
    const cy = Math.max(0, b.top - pad)
    const cw = Math.min(img.width, b.right + pad) - cx
    const ch = Math.min(img.height, b.bottom + pad) - cy

    // Scale cake to fit canvas panel with padding for labels + overlay
    const panel = container.querySelector('.sc-canvas-panel')
    const pr = panel.getBoundingClientRect()
    const maxW = pr.width - 175 // room for layer labels on left
    const maxH = pr.height - 150 // room for overlay at bottom
    const scale = Math.min(maxW / cw, maxH / ch)
    const fw = Math.floor(cw * scale)
    const fh = Math.floor(ch * scale)

    canvas.width = fw
    canvas.height = fh
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, fw, fh)

    // Remove all white, clean edges
    const fd = ctx.getImageData(0, 0, fw, fh)
    //removeWhite(fd)
    ctx.putImageData(fd, 0, 0)

    // Size containers
    cakeContainerEl.style.width = fw + 'px'
    cakeContainerEl.style.height = fh + 'px'
    layersDiv.style.width = fw + 'px'
    layersDiv.style.height = fh + 'px'
    container.querySelector('#sc-dropped').style.width = fw + 'px'
    container.querySelector('#sc-dropped').style.height = fh + 'px'

    createLayerZones(container, layersDiv)
    createLayerLabels(container, fh)
    createPermanentFills(cakeContainerEl)
  }
  img.src = '/assets/svg/soil cake4.svg'
}

function findBounds(data, w, h) {
  let top = h, bot = 0, left = w, right = 0
  const d = data.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (d[i] < 200 || d[i+1] < 200 || d[i+2] < 200) {
        if (y < top) top = y
        if (y > bot) bot = y
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }
  return { top, bottom: bot, left, right }
}

function removeWhite(imageData) {
  const d = imageData.data
  const w = imageData.width, h = imageData.height

  // Simple approach: use luminance to set alpha.
  // Dark pixels (lines) stay opaque, light pixels (background) become transparent.
  // Anti-aliased edges get proportional alpha based on darkness.
  // Pass 1: aggressively remove anything that isn't clearly a dark line
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]
    if (lum > 140) {
      // Anything lighter than mid-gray → fully transparent
      d[i+3] = 0
    } else if (lum > 60) {
      // Anti-aliased edge zone → proportional alpha, darken toward black
      const t = (lum - 60) / 80 // 0 = dark, 1 = light
      d[i+3] = Math.floor(255 * (1 - t))
      // Force color to near-black to avoid gray fringe
      d[i] = Math.floor(d[i] * 0.3)
      d[i+1] = Math.floor(d[i+1] * 0.3)
      d[i+2] = Math.floor(d[i+2] * 0.3)
    }
    // lum <= 60: dark lines, keep fully opaque
  }

  // Pass 2: expand dark lines by 1px outward for clean edges
  const copy = new Uint8ClampedArray(d)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      if (copy[i+3] < 40) {
        // Check 8 neighbors for dark opaque pixels
        let nearDark = false
        for (let dy = -1; dy <= 1 && !nearDark; dy++) {
          for (let dx = -1; dx <= 1 && !nearDark; dx++) {
            if (dx === 0 && dy === 0) continue
            const ni = ((y+dy)*w + (x+dx)) * 4
            if (copy[ni+3] > 200) {
              const nlum = 0.299 * copy[ni] + 0.587 * copy[ni+1] + 0.114 * copy[ni+2]
              if (nlum < 60) nearDark = true
            }
          }
        }
        if (nearDark) {
          d[i] = 30; d[i+1] = 25; d[i+2] = 20; d[i+3] = 200
        }
      }
    }
  }
}

function createLayerZones(container, layersDiv) {
  for (const zone of LAYER_ZONES) {
    const div = document.createElement('div')
    div.className = 'sc-layer-zone'
    div.dataset.layer = zone.id
    div.style.cssText = `position:absolute;left:0;right:0;top:${zone.top}%;height:${zone.bottom - zone.top}%;cursor:pointer;border-radius:8px;`

    div.addEventListener('pointerdown', () => {
      if (!selectedColor || !selectedId) return
      const horizon = HORIZONS.find(h => h.id === selectedId)
      if (horizon && zone.id === horizon.id) {
        div.style.backgroundColor = horizon.color
        div.classList.add('filled')
        filledLayers.add(zone.id)
        const el = container.querySelector('#sc-instruction-text')
        el.textContent = `${horizon.name}: ${horizon.clue}`
        const btn = container.querySelector(`.sc-color-btn[data-id="${zone.id}"]`)
        if (btn) btn.classList.add('done')
      } else {
        div.classList.add('sc-wrong')
        setTimeout(() => div.classList.remove('sc-wrong'), 400)
        container.querySelector('#sc-instruction-text').textContent = 'Not quite! Try a different layer.'
      }
    })
    layersDiv.appendChild(div)
  }
}

function createLayerLabels(container, cakeHeight) {
  const labelsDiv = container.querySelector('#sc-labels')
  if (!labelsDiv) return
  labelsDiv.style.height = cakeHeight + 'px'
  for (const zone of LAYER_ZONES) {
    const midPct = (zone.top + zone.bottom) / 2
    const label = document.createElement('div')
    label.className = 'sc-label-item'
    label.dataset.layer = zone.id
    label.style.top = midPct + '%'
    label.innerHTML = `<span class="sc-label-text">${zone.id}</span><span class="sc-label-arrow">&rarr;</span>`
    labelsDiv.appendChild(label)
  }
}



function initPalette(container) {
  container.querySelectorAll('.sc-color-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      container.querySelectorAll('.sc-color-btn').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
      selectedColor = btn.dataset.color
      selectedId = btn.dataset.id
      const h = HORIZONS.find(h => h.id === btn.dataset.id)
      if (h) container.querySelector('#sc-instruction-text').textContent = `${h.name}: ${h.clue}`
    })
  })
}

// ─── DRAG AND DROP ───

function initDecorations(container) {
  const dropped = container.querySelector('#sc-dropped')

  container.querySelectorAll('.sc-deco-item').forEach(item => {
    let dragging = false, clone = null, ox = 0, oy = 0

    item.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      dragging = true
      const t = e
      const r = item.getBoundingClientRect()
      ox = t.clientX - r.left
      oy = t.clientY - r.top
      clone = document.createElement('div')
      clone.className = 'sc-drag-clone'
      clone.textContent = item.dataset.emoji
      clone.style.left = (t.clientX - ox) + 'px'
      clone.style.top = (t.clientY - oy) + 'px'
      document.body.appendChild(clone)
      item.setPointerCapture(e.pointerId)
    })

    item.addEventListener('pointermove', (e) => {
      if (!dragging || !clone) return
      clone.style.left = (e.clientX - ox) + 'px'
      clone.style.top = (e.clientY - oy) + 'px'
    })

    item.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return
      dragging = false
      clone.remove()
      clone = null
      if (!cakeContainerEl) return
      const cr = cakeContainerEl.getBoundingClientRect()
      if (e.clientX >= cr.left && e.clientX <= cr.right && e.clientY >= cr.top && e.clientY <= cr.bottom) {
        const em = document.createElement('span')
        em.className = 'sc-placed-deco'
        em.textContent = item.dataset.emoji
        em.style.left = (e.clientX - cr.left) + 'px'
        em.style.top = (e.clientY - cr.top) + 'px'
        dropped.appendChild(em)
      }
    })
  })
}

// ─── EXPORT ───

export function createSoilCakeGame() {
  selectedColor = null
  selectedId = null
  filledLayers = new Set()
  cakeContainerEl = null
  return createIntroScreen()
}
