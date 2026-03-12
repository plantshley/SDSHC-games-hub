import { navigate } from '../router.js'
import { PAGES, PALETTE, DECORATIONS, INSTRUCTIONS } from '../data/content/coloring.js'

/**
 * Soil Critter Coloring Game
 * P1: Intro screen — page picker grid
 * P2: Gameplay — side panel (palette, mode buttons, decos, nav) + canvas
 *
 * SVG assets are raster PNGs in SVG wrappers. Preprocessing removes white
 * backgrounds and crops to content. Fill uses BFS flood fill with a post-fill
 * anti-alias pass that recolors fringe pixels around outlines to eliminate
 * the white halo effect (BuildYourOwnV2 technique).
 */

let currentPageIndex = 0
let selectedColor = null
let paintMode = false
let brushSize = 5
let canvasPanelEl = null
let pageCanvasStates = new Map()
let canvasReady = false
let undoStack = []       // array of ImageData snapshots
let originalImageData = null  // the preprocessed image for reset

// ─── CATMULL-ROM STROKE SMOOTHING ───

function rdpSimplify(points, tolerance) {
  if (points.length <= 2) return points
  let maxDist = 0, index = 0
  const end = points.length - 1
  for (let i = 1; i < end; i++) {
    const dx = points[end].x - points[0].x
    const dy = points[end].y - points[0].y
    let dist
    if (dx === 0 && dy === 0) {
      dist = Math.hypot(points[i].x - points[0].x, points[i].y - points[0].y)
    } else {
      dist = Math.abs(dy * points[i].x - dx * points[i].y + points[end].x * points[0].y - points[end].y * points[0].x) / Math.hypot(dx, dy)
    }
    if (dist > maxDist) { maxDist = dist; index = i }
  }
  if (maxDist > tolerance) {
    const left = rdpSimplify(points.slice(0, index + 1), tolerance)
    const right = rdpSimplify(points.slice(index), tolerance)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[end]]
}

function catmullRomPoint(p0, p1, p2, p3, t, tension) {
  const t2 = t * t, t3 = t2 * t
  const v0x = (p2.x - p0.x) * tension, v1x = (p3.x - p1.x) * tension
  const x = p1.x + v0x * t + (3 * (p2.x - p1.x) - 2 * v0x - v1x) * t2 + (2 * (p1.x - p2.x) + v0x + v1x) * t3
  const v0y = (p2.y - p0.y) * tension, v1y = (p3.y - p1.y) * tension
  const y = p1.y + v0y * t + (3 * (p2.y - p1.y) - 2 * v0y - v1y) * t2 + (2 * (p1.y - p2.y) + v0y + v1y) * t3
  return { x, y }
}

function smoothStroke(rawPoints) {
  if (rawPoints.length < 3) return rawPoints
  const simplified = rdpSimplify(rawPoints, 1.5)
  if (simplified.length < 3) return simplified
  const smoothed = [simplified[0]]
  for (let i = 0; i < simplified.length - 1; i++) {
    const p0 = simplified[Math.max(0, i - 1)]
    const p1 = simplified[i]
    const p2 = simplified[i + 1]
    const p3 = simplified[Math.min(simplified.length - 1, i + 2)]
    for (let t = 0; t < 8; t++) {
      smoothed.push(catmullRomPoint(p0, p1, p2, p3, t / 8, 0.5))
    }
  }
  smoothed.push(simplified[simplified.length - 1])
  return smoothed
}

// ─── P1: INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen cc-intro'

  const gridHtml = PAGES.map((p, i) => `
    <button class="cc-page-btn" data-index="${i}">
      <span class="cc-page-emoji">${p.emoji}</span>
      <span class="cc-page-label">${p.name}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="cc-intro-bg"></div>
    <div class="cc-intro-header">
      <button class="home-btn" id="cc-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="cc-intro-title">Soil Critter Coloring</h2>
    </div>
    <div class="cc-intro-body">
      <div class="cc-intro-left">
        <div class="cc-speech-bubble">
          <span class="cc-speech-text" id="cc-intro-typing"></span>
        </div>
        <img class="cc-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="cc-intro-right">
        <div class="cc-page-grid">
          ${gridHtml}
        </div>
      </div>
    </div>
  `

  const typingEl = el.querySelector('#cc-intro-typing')
  const introText = INSTRUCTIONS.intro
  let charIdx = 0
  function typeChar() {
    if (charIdx < introText.length) {
      typingEl.textContent += introText[charIdx++]
      setTimeout(typeChar, 40)
    }
  }
  setTimeout(typeChar, 400)

  el.querySelector('#cc-intro-home').addEventListener('pointerdown', () => navigate('game-select/sprouts'))

  el.querySelectorAll('.cc-page-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      currentPageIndex = parseInt(btn.dataset.index)
      transitionTo(el, createGameplayScreen())
    })
  })

  return el
}

function transitionTo(oldEl, newEl) {
  const parent = oldEl.parentNode
  oldEl.classList.remove('active')
  oldEl.classList.add('exiting')
  oldEl.addEventListener('animationend', () => oldEl.remove(), { once: true })
  setTimeout(() => { if (oldEl.parentNode) oldEl.remove() }, 400)
  parent.appendChild(newEl)
  newEl.offsetHeight
  newEl.classList.add('active', 'entering')
  newEl.addEventListener('animationend', () => newEl.classList.remove('entering'), { once: true })
}

// ─── P2: GAMEPLAY ───

function createGameplayScreen() {
  const el = document.createElement('div')
  el.className = 'screen cc-game'

  const paletteHtml = PALETTE.map(c => `
    <button class="cc-color-swatch" data-color="${c.hex}" title="${c.name}">
      <div class="cc-swatch-circle" style="background:${c.hex};"></div>
    </button>
  `).join('')

  const decosHtml = DECORATIONS.map(d => `
    <div class="cc-deco-item" data-emoji="${d.emoji}">
      <span class="cc-deco-emoji">${d.emoji}</span>
    </div>
  `).join('')

  const navHtml = PAGES.map((p, i) => `
    <button class="cc-page-nav-item${i === currentPageIndex ? ' active' : ''}" data-index="${i}">
      <span>${p.emoji}</span><span class="cc-nav-label">${p.name}</span>
    </button>
  `).join('')

  // Brush size options: small(3), medium(5), large(8), xlarge(12)
  const brushSizes = [
    { size: 3, dotPx: 6, btnPx: 28 },
    { size: 5, dotPx: 10, btnPx: 32 },
    { size: 8, dotPx: 14, btnPx: 36 },
    { size: 12, dotPx: 18, btnPx: 40 },
  ]
  const brushHtml = brushSizes.map(b => `
    <button class="cc-brush-btn${b.size === brushSize ? ' active' : ''}"
            data-size="${b.size}"
            style="width:${b.btnPx}px;height:${b.btnPx}px;">
      <span class="cc-brush-dot" style="width:${b.dotPx}px;height:${b.dotPx}px;"></span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="cc-game-bg"></div>
    <div class="cc-game-header">
      <button class="home-btn" id="cc-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="cc-game-title">Soil Critter Coloring</h2>
    </div>
    <div class="cc-page-nav">${navHtml}</div>
    <div class="cc-game-body">
      <div class="cc-panel">
        <span class="cc-panel-heading">Colors</span>
        <div class="cc-palette">${paletteHtml}</div>
        <div class="cc-panel-divider"></div>
        <div class="cc-mode-btns">
          <button class="cc-mode-btn active" id="cc-fill-btn">🎨 Fill</button>
          <button class="cc-mode-btn" id="cc-paint-btn">✏️ Paint</button>
        </div>
        <div class="cc-brush-size" id="cc-brush-size">
          <span class="cc-brush-size-label">Brush Size</span>
          <div class="cc-brush-sizes">${brushHtml}</div>
        </div>
        <div class="cc-panel-divider"></div>
        <span class="cc-panel-heading">Stickers</span>
        <div class="cc-panel-decos">${decosHtml}</div>
        <div class="cc-nav-btns">
          <button class="cc-skip-btn" id="cc-prev">◀ Prev</button>
          <button class="cc-skip-btn" id="cc-next">Next ▶</button>
        </div>
      </div>
      <div class="cc-canvas-panel" id="cc-canvas-panel">
        <div class="cc-canvas-actions">
          <button class="cc-action-btn" id="cc-undo" disabled>↩ Undo</button>
          <button class="cc-action-btn" id="cc-reset">🔄 Reset</button>
        </div>
        <canvas id="cc-draw-canvas"></canvas>
        <div class="cc-canvas-wrapper" id="cc-wrapper">
          <canvas id="cc-canvas"></canvas>
        </div>
        <div class="cc-dropped-decos" id="cc-dropped"></div>
        <div class="cc-subject-label" id="cc-subject">${PAGES[currentPageIndex].name}</div>
        <div class="cc-overlay-bottom">
          <div class="cc-instructions">
            <p id="cc-instruction-text">${INSTRUCTIONS.gameplay}</p>
          </div>
          <img class="cc-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
    </div>
  `

  requestAnimationFrame(() => {
    loadPage(el, currentPageIndex)
    initPalette(el)
    initModeButtons(el)
    initBrushSize(el)
    initDecorations(el)
    initNavigation(el)
    initFillMode(el)
    initPaintMode(el)
    initCanvasActions(el)
  })

  el.querySelector('#cc-game-home').addEventListener('pointerdown', () => navigate('game-select/sprouts'))
  return el
}

// ─── WHITE REMOVAL + CROP PREPROCESSING ───

function isLight(r, g, b) { return r > 100 && g > 100 && b > 100 }
function isDark(r, g, b) { return r < 80 && g < 80 && b < 80 }

function removeWhiteBackground(data, width, height) {
  const total = width * height
  const visited = new Uint8Array(total)
  const flooded = new Uint8Array(total)
  const queue = []

  function seedPixel(x, y) {
    const idx = y * width + x
    if (visited[idx]) return
    const pi = idx * 4
    const r = data[pi], g = data[pi + 1], b = data[pi + 2], a = data[pi + 3]
    if (a === 0) { visited[idx] = 1; flooded[idx] = 1; queue.push(idx); return }
    if (isLight(r, g, b)) {
      visited[idx] = 1; flooded[idx] = 1; data[pi + 3] = 0; queue.push(idx)
    }
  }

  for (let x = 0; x < width; x++) { seedPixel(x, 0); seedPixel(x, height - 1) }
  for (let y = 1; y < height - 1; y++) { seedPixel(0, y); seedPixel(width - 1, y) }

  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const x = idx % width, y = (idx - x) / width
    const neighbors = []
    if (x > 0) neighbors.push(idx - 1)
    if (x < width - 1) neighbors.push(idx + 1)
    if (y > 0) neighbors.push(idx - width)
    if (y < height - 1) neighbors.push(idx + width)
    for (const ni of neighbors) {
      if (visited[ni]) continue
      visited[ni] = 1
      const pi = ni * 4
      const r = data[pi], g = data[pi + 1], b = data[pi + 2], a = data[pi + 3]
      if (a === 0) { flooded[ni] = 1; queue.push(ni); continue }
      if (isLight(r, g, b)) { flooded[ni] = 1; data[pi + 3] = 0; queue.push(ni) }
    }
  }

  // Erosion pass
  for (let i = 0; i < total; i++) {
    if (!flooded[i]) continue
    const x = i % width, y = (i - x) / width
    const en = []
    if (x > 0) en.push(i - 1)
    if (x < width - 1) en.push(i + 1)
    if (y > 0) en.push(i - width)
    if (y < height - 1) en.push(i + width)
    if (x > 0 && y > 0) en.push(i - width - 1)
    if (x < width - 1 && y > 0) en.push(i - width + 1)
    if (x > 0 && y < height - 1) en.push(i + width - 1)
    if (x < width - 1 && y < height - 1) en.push(i + width + 1)
    for (const ni of en) {
      if (flooded[ni]) continue
      const pi = ni * 4
      if (data[pi + 3] === 0) continue
      const r = data[pi], g = data[pi + 1], b = data[pi + 2]
      if (!isDark(r, g, b) && isLight(r, g, b)) data[pi + 3] = 0
    }
  }

  // Make ALL remaining interior light pixels transparent
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    if (isLight(data[i], data[i + 1], data[i + 2])) data[i + 3] = 0
  }
}

/** Crop canvas to bounding box of visible pixels + padding */
function cropToContent(canvas, ctx, padding = 10) {
  const w = canvas.width, h = canvas.height
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  let minX = w, minY = h, maxX = 0, maxY = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) return // nothing visible

  minX = Math.max(0, minX - padding)
  minY = Math.max(0, minY - padding)
  maxX = Math.min(w - 1, maxX + padding)
  maxY = Math.min(h - 1, maxY + padding)

  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const cropped = ctx.getImageData(minX, minY, cw, ch)

  canvas.width = cw
  canvas.height = ch
  ctx.putImageData(cropped, 0, 0)
}

// ─── PAGE LOADING ───

function loadPage(container, pageIndex) {
  const canvas = container.querySelector('#cc-canvas')
  const drawCanvas = container.querySelector('#cc-draw-canvas')

  if (canvasReady) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
    pageCanvasStates.set(currentPageIndex, {
      main: ctx.getImageData(0, 0, canvas.width, canvas.height),
      draw: dCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height),
      displayW: parseInt(canvas.style.width),
      displayH: parseInt(canvas.style.height),
    })
  }

  currentPageIndex = pageIndex
  const page = PAGES[pageIndex]
  undoStack = []
  updateUndoBtn(container)

  container.querySelectorAll('.cc-page-nav-item').forEach((item, i) => {
    item.classList.toggle('active', i === pageIndex)
  })
  container.querySelector('#cc-subject').textContent = page.name
  container.querySelector('#cc-prev').disabled = pageIndex === 0
  container.querySelector('#cc-next').disabled = pageIndex === PAGES.length - 1
  container.querySelector('#cc-dropped').innerHTML = ''

  if (pageCanvasStates.has(pageIndex)) {
    const saved = pageCanvasStates.get(pageIndex)
    const sw = saved.main.width, sh = saved.main.height
    canvas.width = sw; canvas.height = sh
    canvas.style.width = saved.displayW + 'px'
    canvas.style.height = saved.displayH + 'px'
    const wrapper = container.querySelector('#cc-wrapper')
    wrapper.style.width = saved.displayW + 'px'
    wrapper.style.height = saved.displayH + 'px'
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.putImageData(saved.main, 0, 0)
    // Restore draw canvas (panel-sized)
    drawCanvas.width = saved.draw.width
    drawCanvas.height = saved.draw.height
    const dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
    dCtx.putImageData(saved.draw, 0, 0)
    canvasReady = true
    canvasPanelEl = container.querySelector('#cc-canvas-panel')
    return
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const panel = container.querySelector('.cc-canvas-panel')
    const pr = panel.getBoundingClientRect()
    const maxW = pr.width - 40
    const maxH = pr.height - 90

    // Internal canvas at native res (capped at 2000px)
    const natW = img.naturalWidth, natH = img.naturalHeight
    const maxDim = 2000
    const canvasScale = Math.min(1, maxDim / Math.max(natW, natH))
    let cw = Math.floor(natW * canvasScale)
    let ch = Math.floor(natH * canvasScale)

    canvas.width = cw
    canvas.height = ch

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, cw, ch)

    // Preprocess: remove white, leave outlines
    const imageData = ctx.getImageData(0, 0, cw, ch)
    removeWhiteBackground(imageData.data, cw, ch)
    ctx.putImageData(imageData, 0, 0)

    // Crop to content bounding box
    cropToContent(canvas, ctx, 12)
    cw = canvas.width
    ch = canvas.height

    // Save original for reset
    originalImageData = ctx.getImageData(0, 0, cw, ch)

    // Calculate display size preserving aspect ratio
    const displayScale = Math.min(maxW / cw, maxH / ch)
    const displayW = Math.floor(cw * displayScale)
    const displayH = Math.floor(ch * displayScale)

    // Draw canvas covers full panel (sized via CSS inset:0 width/height:100%)
    // Set its internal resolution to match panel pixel size
    const pw = Math.floor(pr.width)
    const ph = Math.floor(pr.height)
    drawCanvas.width = pw
    drawCanvas.height = ph
    const dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
    dCtx.clearRect(0, 0, pw, ph)

    // CSS display size for image canvas
    canvas.style.width = displayW + 'px'
    canvas.style.height = displayH + 'px'

    const wrapper = container.querySelector('#cc-wrapper')
    wrapper.style.width = displayW + 'px'
    wrapper.style.height = displayH + 'px'

    canvasReady = true
    canvasPanelEl = container.querySelector('#cc-canvas-panel')
  }
  img.onerror = () => console.warn('Failed to load image:', page.svg)
  img.src = page.svg
}

// ─── UNDO / RESET ───

function pushUndo(container) {
  const canvas = container.querySelector('#cc-canvas')
  const drawCanvas = container.querySelector('#cc-draw-canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
  undoStack.push({
    main: ctx.getImageData(0, 0, canvas.width, canvas.height),
    draw: dCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height),
  })
  if (undoStack.length > 20) undoStack.shift()
  updateUndoBtn(container)
}

function updateUndoBtn(container) {
  const btn = container.querySelector('#cc-undo')
  if (btn) btn.disabled = undoStack.length === 0
}

function initCanvasActions(container) {
  container.querySelector('#cc-undo').addEventListener('pointerdown', () => {
    if (undoStack.length === 0) return
    const prev = undoStack.pop()
    const canvas = container.querySelector('#cc-canvas')
    const drawCanvas = container.querySelector('#cc-draw-canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
    ctx.putImageData(prev.main, 0, 0)
    dCtx.putImageData(prev.draw, 0, 0)
    updateUndoBtn(container)
  })

  container.querySelector('#cc-reset').addEventListener('pointerdown', () => {
    if (!originalImageData) return
    pushUndo(container)
    const canvas = container.querySelector('#cc-canvas')
    const drawCanvas = container.querySelector('#cc-draw-canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
    ctx.putImageData(originalImageData, 0, 0)
    dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
  })
}

// ─── FLOOD FILL (with anti-alias halo fix) ───

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function floodFill(ctx, startX, startY, fillHex) {
  const w = ctx.canvas.width, h = ctx.canvas.height
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const fill = hexToRgb(fillHex)

  const si = (startY * w + startX) * 4
  const tr = d[si], tg = d[si + 1], tb = d[si + 2], ta = d[si + 3]

  // Don't fill dark outline pixels
  if (ta > 128 && tr < 80 && tg < 80 && tb < 80) return false
  // Already this exact color?
  if (ta > 200 && Math.abs(tr - fill.r) < 3 && Math.abs(tg - fill.g) < 3 && Math.abs(tb - fill.b) < 3) return false

  const tolerance = 45

  function matches(i) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3]
    if (a > 128 && r < 80 && g < 80 && b < 80) return false
    return Math.abs(r - tr) <= tolerance &&
           Math.abs(g - tg) <= tolerance &&
           Math.abs(b - tb) <= tolerance &&
           Math.abs(a - ta) <= tolerance
  }

  const total = w * h
  const visited = new Uint8Array(total)
  const filled = new Uint8Array(total)  // track which pixels we filled
  const stack = [startY * w + startX]
  visited[stack[0]] = 1
  let filledCount = 0

  while (stack.length > 0) {
    const idx = stack.pop()
    const pi = idx * 4

    d[pi] = fill.r
    d[pi + 1] = fill.g
    d[pi + 2] = fill.b
    if (d[pi + 3] < 30) d[pi + 3] = 255
    filled[idx] = 1
    filledCount++

    const x = idx % w, y = (idx - x) / w
    if (x > 0 && !visited[idx - 1])     { visited[idx - 1] = 1; if (matches((idx - 1) * 4)) stack.push(idx - 1) }
    if (x < w - 1 && !visited[idx + 1]) { visited[idx + 1] = 1; if (matches((idx + 1) * 4)) stack.push(idx + 1) }
    if (y > 0 && !visited[idx - w])     { visited[idx - w] = 1; if (matches((idx - w) * 4)) stack.push(idx - w) }
    if (y < h - 1 && !visited[idx + w]) { visited[idx + w] = 1; if (matches((idx + w) * 4)) stack.push(idx + w) }
  }

  if (filledCount <= 2) return false

  // ── Anti-alias halo fix ──
  // For every filled pixel, check neighbors. If a neighbor has alpha > 0
  // but wasn't filled (it's an anti-aliased fringe pixel near an outline),
  // recolor its RGB to the fill color while keeping its original alpha.
  // This blends the fringe into the fill instead of leaving gray halos.
  for (let i = 0; i < total; i++) {
    if (!filled[i]) continue
    const x = i % w, y = (i - x) / w
    const nn = []
    if (x > 0) nn.push(i - 1)
    if (x < w - 1) nn.push(i + 1)
    if (y > 0) nn.push(i - w)
    if (y < h - 1) nn.push(i + w)
    // 8-connected for better coverage
    if (x > 0 && y > 0) nn.push(i - w - 1)
    if (x < w - 1 && y > 0) nn.push(i - w + 1)
    if (x > 0 && y < h - 1) nn.push(i + w - 1)
    if (x < w - 1 && y < h - 1) nn.push(i + w + 1)
    for (const ni of nn) {
      if (filled[ni]) continue
      const pi = ni * 4
      const a = d[pi + 3]
      if (a === 0) continue
      // Recolor this fringe pixel — keep its alpha for smooth anti-aliasing
      d[pi] = fill.r
      d[pi + 1] = fill.g
      d[pi + 2] = fill.b
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return true
}

// ─── FILL MODE INTERACTION ───

function initFillMode(container) {
  const canvas = container.querySelector('#cc-canvas')
  canvas.addEventListener('pointerdown', (e) => {
    if (paintMode) return
    if (!selectedColor) {
      container.querySelector('#cc-instruction-text').textContent = 'Pick a color first!'
      return
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    pushUndo(container)
    const did = floodFill(ctx, x, y, selectedColor)
    if (did) {
      const panelRect = container.querySelector('#cc-canvas-panel').getBoundingClientRect()
      spawnFillParticles(container, e.clientX - panelRect.left, e.clientY - panelRect.top)
      container.querySelector('#cc-instruction-text').textContent = 'Nice! Keep coloring!'
    } else {
      // Remove the undo entry if fill didn't actually change anything
      undoStack.pop()
      updateUndoBtn(container)
    }
  })
}

// ─── PAINT MODE (Catmull-Rom smoothed strokes) ───

function initPaintMode(container) {
  const drawCanvas = container.querySelector('#cc-draw-canvas')
  let dCtx = null
  let isDrawing = false
  let rawPoints = []
  let preStrokeData = null

  // Draw canvas covers full panel — scale brush to its resolution
  function scaledBrush() {
    const rect = drawCanvas.getBoundingClientRect()
    const ratio = drawCanvas.width / rect.width
    return brushSize * ratio * 4
  }

  function ensureDrawCanvasSize() {
    const panel = container.querySelector('#cc-canvas-panel')
    const pr = panel.getBoundingClientRect()
    const pw = Math.floor(pr.width)
    const ph = Math.floor(pr.height)
    if (drawCanvas.width !== pw || drawCanvas.height !== ph) {
      // Save existing content
      const oldData = dCtx ? dCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height) : null
      drawCanvas.width = pw
      drawCanvas.height = ph
      dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
      if (oldData) dCtx.putImageData(oldData, 0, 0)
    }
    if (!dCtx) dCtx = drawCanvas.getContext('2d', { willReadFrequently: true })
  }

  function drawStroke(ctx, points, lw) {
    ctx.strokeStyle = selectedColor
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
  }

  drawCanvas.addEventListener('pointerdown', (e) => {
    if (!paintMode) return
    if (!selectedColor) {
      container.querySelector('#cc-instruction-text').textContent = 'Pick a color first!'
      return
    }
    ensureDrawCanvasSize()
    isDrawing = true
    rawPoints = []
    preStrokeData = dCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    drawCanvas.setPointerCapture(e.pointerId)
    const rect = drawCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (drawCanvas.width / rect.width)
    const y = (e.clientY - rect.top) * (drawCanvas.height / rect.height)
    rawPoints.push({ x, y })
  })

  drawCanvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return
    const rect = drawCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (drawCanvas.width / rect.width)
    const y = (e.clientY - rect.top) * (drawCanvas.height / rect.height)
    rawPoints.push({ x, y })
    // Redraw preview: restore clean + draw current stroke
    dCtx.putImageData(preStrokeData, 0, 0)
    if (rawPoints.length >= 2) {
      drawStroke(dCtx, rawPoints, scaledBrush())
    }
  })

  drawCanvas.addEventListener('pointerup', () => {
    if (!isDrawing) return
    isDrawing = false

    if (rawPoints.length >= 2) {
      // Push pre-stroke state as undo point (main canvas unchanged, draw canvas saved)
      const mainCanvas = container.querySelector('#cc-canvas')
      const mCtx = mainCanvas.getContext('2d', { willReadFrequently: true })
      undoStack.push({
        main: mCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height),
        draw: preStrokeData,
      })
      if (undoStack.length > 20) undoStack.shift()
      updateUndoBtn(container)

      // Restore clean state, draw smoothed final stroke
      dCtx.putImageData(preStrokeData, 0, 0)
      const smoothed = smoothStroke(rawPoints)
      drawStroke(dCtx, smoothed, scaledBrush())
    }
    rawPoints = []
    preStrokeData = null
  })
}

// ─── PALETTE ───

function initPalette(container) {
  container.querySelectorAll('.cc-color-swatch').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected')
        selectedColor = null
        return
      }
      container.querySelectorAll('.cc-color-swatch').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
      selectedColor = btn.dataset.color
    })
  })
}

// ─── BRUSH SIZE ───

function initBrushSize(container) {
  container.querySelectorAll('.cc-brush-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      container.querySelectorAll('.cc-brush-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      brushSize = parseInt(btn.dataset.size)
    })
  })
}

// ─── MODE BUTTONS ───

function initModeButtons(container) {
  const fillBtn = container.querySelector('#cc-fill-btn')
  const paintBtn = container.querySelector('#cc-paint-btn')
  const drawCanvas = container.querySelector('#cc-draw-canvas')
  const mainCanvas = container.querySelector('#cc-canvas')
  const brushPanel = container.querySelector('#cc-brush-size')

  const wrapper = container.querySelector('#cc-wrapper')

  function updateMode() {
    fillBtn.classList.toggle('active', !paintMode)
    paintBtn.classList.toggle('active', paintMode)
    brushPanel.classList.toggle('visible', paintMode)
    // Draw canvas always stays at z-index 1 (behind wrapper) so strokes
    // render behind outlines. In paint mode, set wrapper to pointer-events:none
    // so touches pass through to the draw canvas underneath.
    if (paintMode) {
      drawCanvas.style.pointerEvents = 'auto'
      wrapper.style.pointerEvents = 'none'
      mainCanvas.style.pointerEvents = 'none'
      container.querySelector('#cc-instruction-text').textContent = INSTRUCTIONS.paint
    } else {
      drawCanvas.style.pointerEvents = 'none'
      wrapper.style.pointerEvents = ''
      mainCanvas.style.pointerEvents = 'auto'
      container.querySelector('#cc-instruction-text').textContent = INSTRUCTIONS.gameplay
    }
  }

  fillBtn.addEventListener('pointerdown', () => { paintMode = false; updateMode() })
  paintBtn.addEventListener('pointerdown', () => { paintMode = true; updateMode() })
  updateMode()
}

// ─── NAVIGATION ───

function initNavigation(container) {
  container.querySelector('#cc-prev').addEventListener('pointerdown', () => {
    if (currentPageIndex > 0) loadPage(container, currentPageIndex - 1)
  })
  container.querySelector('#cc-next').addEventListener('pointerdown', () => {
    if (currentPageIndex < PAGES.length - 1) loadPage(container, currentPageIndex + 1)
  })
  container.querySelectorAll('.cc-page-nav-item').forEach(item => {
    item.addEventListener('pointerdown', () => {
      const idx = parseInt(item.dataset.index)
      if (idx !== currentPageIndex) loadPage(container, idx)
    })
  })
}

// ─── DECORATIONS ───

function initDecorations(container) {
  const dropped = container.querySelector('#cc-dropped')

  container.querySelectorAll('.cc-deco-item').forEach(item => {
    let dragging = false, clone = null, ox = 0, oy = 0

    item.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      dragging = true
      const r = item.getBoundingClientRect()
      ox = e.clientX - r.left
      oy = e.clientY - r.top
      clone = document.createElement('div')
      clone.className = 'cc-drag-clone'
      clone.textContent = item.dataset.emoji
      clone.style.left = (e.clientX - ox) + 'px'
      clone.style.top = (e.clientY - oy) + 'px'
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
      if (!canvasPanelEl) return
      const cr = canvasPanelEl.getBoundingClientRect()
      if (e.clientX >= cr.left && e.clientX <= cr.right && e.clientY >= cr.top && e.clientY <= cr.bottom) {
        const em = document.createElement('span')
        em.className = 'cc-placed-deco'
        em.textContent = item.dataset.emoji
        em.style.left = (e.clientX - cr.left) + 'px'
        em.style.top = (e.clientY - cr.top) + 'px'
        dropped.appendChild(em)
        makePlacedDecoDraggable(em)
      }
    })
  })
}

function makePlacedDecoDraggable(el) {
  let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    startX = e.clientX
    startY = e.clientY
    origX = parseFloat(el.style.left)
    origY = parseFloat(el.style.top)
    el.setPointerCapture(e.pointerId)
    el.style.zIndex = '10'
    el.style.transform = 'translate(-50%, -50%) scale(1.2)'
  })

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return
    el.style.left = (origX + e.clientX - startX) + 'px'
    el.style.top = (origY + e.clientY - startY) + 'px'
  })

  el.addEventListener('pointerup', (e) => {
    if (!dragging) return
    dragging = false
    el.style.zIndex = ''
    el.style.transform = 'translate(-50%, -50%) scale(1)'
    if (!canvasPanelEl) return
    const cr = canvasPanelEl.getBoundingClientRect()
    if (e.clientX < cr.left || e.clientX > cr.right || e.clientY < cr.top || e.clientY > cr.bottom) {
      el.remove()
    }
  })
}

// ─── PARTICLE EFFECT ───

function spawnFillParticles(container, x, y) {
  const panel = container.querySelector('#cc-canvas-panel')
  if (!panel) return
  const count = 14
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    particle.className = 'cc-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 70
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    particle.style.setProperty('--dx', dx + 'px')
    particle.style.setProperty('--dy', dy + 'px')
    const randomHue = Math.round(Math.random() * 359)
    particle.style.backgroundColor = `hsl(${randomHue} 100% 75%)`
    particle.style.left = x + 'px'
    particle.style.top = y + 'px'
    panel.appendChild(particle)
    particle.addEventListener('animationend', () => particle.remove())
  }
}

// ─── EXPORT ───

export function createColoringGame() {
  currentPageIndex = 0
  selectedColor = null
  paintMode = false
  brushSize = 5
  canvasPanelEl = null
  pageCanvasStates = new Map()
  canvasReady = false
  undoStack = []
  originalImageData = null
  return createIntroScreen()
}
