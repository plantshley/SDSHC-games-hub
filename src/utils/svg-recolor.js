/**
 * SVG Recolor Utility
 *
 * Two-phase canvas approach:
 * 1. Edge flood-fill: make outer white background transparent
 *    (BFS from borders, black outlines act as walls)
 * 2. Optionally recolor remaining white/light fills with accent color
 *
 * Also crops to tight bounding box around visible content.
 * Avoids "white halo" by eroding 1px at flood boundary edges.
 */

const cache = new Map()

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function isLight(r, g, b) {
  return r > 100 && g > 100 && b > 100
}

function isDark(r, g, b) {
  return r < 80 && g < 80 && b < 80
}

/**
 * BFS flood-fill from all edge pixels to make outer background transparent.
 * Black outlines block the flood. Includes 1px erosion for tight edges.
 */
function makeBackgroundTransparent(data, width, height) {
  const total = width * height
  const visited = new Uint8Array(total)
  const flooded = new Uint8Array(total)
  const queue = []

  function seedPixel(x, y) {
    const idx = y * width + x
    if (visited[idx]) return
    const pi = idx * 4
    const r = data[pi], g = data[pi + 1], b = data[pi + 2], a = data[pi + 3]
    if (a === 0) {
      visited[idx] = 1
      flooded[idx] = 1
      queue.push(idx)
      return
    }
    if (isLight(r, g, b)) {
      visited[idx] = 1
      flooded[idx] = 1
      data[pi + 3] = 0
      queue.push(idx)
    }
  }

  for (let x = 0; x < width; x++) {
    seedPixel(x, 0)
    seedPixel(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    seedPixel(0, y)
    seedPixel(width - 1, y)
  }

  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const x = idx % width
    const y = (idx - x) / width
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
      if (isLight(r, g, b)) {
        flooded[ni] = 1
        data[pi + 3] = 0
        queue.push(ni)
      }
    }
  }

  // Erosion pass — also make transparent any light pixel adjacent to flooded area
  for (let i = 0; i < total; i++) {
    if (!flooded[i]) continue
    const x = i % width
    const y = (i - x) / width
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
      const a = data[pi + 3]
      if (a === 0) continue
      const r = data[pi], g = data[pi + 1], b = data[pi + 2]
      if (!isDark(r, g, b) && isLight(r, g, b)) {
        data[pi + 3] = 0
      }
    }
  }
}

/**
 * Make remaining visible light pixels (interior fills) transparent too.
 * Keeps only dark outlines visible.
 */
function makeInteriorTransparent(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (isLight(r, g, b)) {
      data[i + 3] = 0
    }
  }
}

/**
 * Recolor remaining visible light pixels with accent color.
 */
function recolorFills(data, fillColor) {
  const { r: fr, g: fg, b: fb } = hexToRgb(fillColor)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (isLight(r, g, b)) {
      data[i] = fr
      data[i + 1] = fg
      data[i + 2] = fb
    }
  }
}

/**
 * Find bounding box of visible (non-transparent) pixels and return a cropped canvas.
 */
function cropToContent(canvas, ctx) {
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

  if (maxX < minX || maxY < minY) return canvas // nothing visible

  // Add 2px padding
  minX = Math.max(0, minX - 2)
  minY = Math.max(0, minY - 2)
  maxX = Math.min(w - 1, maxX + 2)
  maxY = Math.min(h - 1, maxY + 2)

  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const cropped = document.createElement('canvas')
  cropped.width = cw
  cropped.height = ch
  const cctx = cropped.getContext('2d')
  cctx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch)
  return cropped
}

/**
 * Process an SVG asset:
 * - flood-fill outer background → transparent
 * - optionally recolor fills or make them transparent
 * - crop to content bounding box
 *
 * @param {string} svgPath
 * @param {string|null} fillColor - hex color for fills, or null for transparent fills
 * @returns {Promise<string>} data URL
 */
export function processAssetSVG(svgPath, fillColor = null) {
  const cacheKey = `${svgPath}|${fillColor}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      makeBackgroundTransparent(imageData.data, canvas.width, canvas.height)

      if (fillColor) {
        recolorFills(imageData.data, fillColor)
      } else {
        makeInteriorTransparent(imageData.data)
      }

      ctx.putImageData(imageData, 0, 0)

      const cropped = cropToContent(canvas, ctx)
      resolve(cropped.toDataURL())
    }
    img.onerror = () => reject(new Error(`Failed to load SVG: ${svgPath}`))
    img.src = svgPath
  })

  cache.set(cacheKey, promise)
  return promise
}

export function clearSVGCache() {
  cache.clear()
}
