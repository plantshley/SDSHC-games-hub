import { navigate } from '../router.js'
import { LEVELS } from '../data/content/dot-to-dot.js'

/**
 * Dot-to-Dot ("What Does Soil Make?") — Little Sprouts
 *
 * Intro: level picker (4 levels)
 * Game: dark starfield, glowing numbered dots, canvas connection lines,
 *       particle burst on each tap, label + celebration on completion.
 * Layout mirrors coloring game (header → page-nav → body).
 */

// ─── MODULE STATE ───

let currentLevelIdx = 0
let currentPuzzleIdx = 0

// ─── TRANSITIONS ───

function transitionTo(oldEl, newEl) {
  const parent = oldEl.parentNode
  if (!parent) return
  oldEl.classList.remove('active')
  oldEl.classList.add('exiting')
  oldEl.addEventListener('animationend', () => oldEl.remove(), { once: true })
  setTimeout(() => { if (oldEl.parentNode) oldEl.remove() }, 400)
  parent.appendChild(newEl)
  newEl.offsetHeight
  newEl.classList.add('active', 'entering')
  newEl.addEventListener('animationend', () => newEl.classList.remove('entering'), { once: true })
}

// ─── PARTICLES (mirrors coloring game's cc-particle pattern) ───

function spawnParticles(container, x, y, count = 14) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'cc-particle dtd-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * (count > 14 ? 110 : 70)
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = `hsl(${Math.round(Math.random() * 359)} 100% 75%)`
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    container.appendChild(p)
    p.addEventListener('animationend', () => p.remove())
  }
}

// ─── DOT COLOR ───

function dotColor(idx, total) {
  return `hsl(${Math.round((idx / total) * 360)} 100% 65%)`
}

// ─── P1: INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen dtd-intro'

  const levelsHtml = LEVELS.map((level, i) => `
    <button class="dtd-level-btn" data-idx="${i}">
      <span class="dtd-level-icon">${level.icon}</span>
      <span class="dtd-level-title">${level.title}</span>
      <span class="dtd-level-count">${'♡'.repeat(level.puzzles.length)}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="dtd-intro-bg"></div>
    <div class="dtd-intro-header">
      <button class="home-btn" id="dtd-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="dtd-intro-title">What Does Soil Make?</h2>
    </div>
    <div class="dtd-intro-body">
      <div class="dtd-intro-left">
        <div class="dtd-speech-bubble">
          <span class="dtd-speech-text" id="dtd-intro-typing"></span>
        </div>
        <img class="dtd-intro-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="Character">
      </div>
      <div class="dtd-intro-right">
        <div class="dtd-level-grid">
          ${levelsHtml}
        </div>
      </div>
    </div>
  `

  // Typing animation
  const typingEl = el.querySelector('#dtd-intro-typing')
  const introText = 'Connect the dots to see what soil makes!'
  let charIdx = 0
  function typeChar() {
    if (charIdx < introText.length) {
      typingEl.textContent += introText[charIdx++]
      setTimeout(typeChar, 40)
    }
  }
  setTimeout(typeChar, 400)

  el.querySelector('#dtd-intro-home').addEventListener('pointerdown', () => {
    navigate('game-select/sprouts')
  })

  el.querySelectorAll('.dtd-level-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      currentLevelIdx = parseInt(btn.dataset.idx)
      currentPuzzleIdx = 0
      transitionTo(el, createGameScreen())
    })
  })

  return el
}

// ─── P2: GAME SCREEN ───

function createGameScreen() {
  const level = LEVELS[currentLevelIdx]
  const el = document.createElement('div')
  el.className = 'screen dtd-game'

  const navHtml = level.puzzles.map((p, i) => `
    <button class="dtd-page-nav-item${i === currentPuzzleIdx ? ' active' : ''}" data-idx="${i}">
      <span class="dtd-nav-emoji">${p.emoji}</span>${p.name}
    </button>
  `).join('')

  el.innerHTML = `
    <div class="dtd-game-bg"></div>
    <div class="dtd-game-header">
      <button class="home-btn" id="dtd-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="dtd-game-title">What Does Soil Make?</h2>
      <div class="dtd-page-nav" id="dtd-page-nav">${navHtml}</div>
      <button class="dtd-levels-btn" id="dtd-back-levels">◀ Levels</button>
    </div>
    <div class="dtd-game-body">
      <div class="dtd-puzzle-area" id="dtd-puzzle-area">
        <canvas class="dtd-canvas" id="dtd-canvas"></canvas>
        <div class="dtd-dots-overlay" id="dtd-dots-overlay"></div>
        <div class="dtd-reveal-label" id="dtd-reveal-label"></div>
        <div class="dtd-completion-overlay" id="dtd-completion-overlay">
          <div class="dtd-completion-content">
            <div class="dtd-completion-bubble">
              <span class="dtd-completion-text">Great job! You completed all the puzzles!</span>
            </div>
            <img class="dtd-completion-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="">
            <div class="dtd-completion-buttons">
              <button class="dtd-completion-btn" id="dtd-play-again">Play Again</button>
              <button class="dtd-completion-btn dtd-completion-btn-primary" id="dtd-back-games">Back to Games</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  el.querySelector('#dtd-play-again').addEventListener('pointerdown', () => {
    clearTimeout(pendingCompleteTimer)
    clearTimeout(pendingLevelTimer)
    transitionTo(el, createGameScreen())
  })
  el.querySelector('#dtd-back-games').addEventListener('pointerdown', () => {
    clearTimeout(pendingCompleteTimer)
    clearTimeout(pendingLevelTimer)
    navigate('game-select/sprouts')
  })

  el.querySelector('#dtd-game-home').addEventListener('pointerdown', () => {
    clearTimeout(pendingCompleteTimer)
    clearTimeout(pendingLevelTimer)
    navigate('game-select/sprouts')
  })

  el.querySelector('#dtd-back-levels').addEventListener('pointerdown', () => {
    clearTimeout(pendingCompleteTimer)
    clearTimeout(pendingLevelTimer)
    transitionTo(el, createIntroScreen())
  })

  // ─── Puzzle state ───
  const LINE_DRAW_MS = 500
  let nextDotIdx = 0
  let connectedPts = []
  let dotMeta = []   // [{screenX, screenY, el}]
  let completed = false
  let closingLoop = false
  let pendingCompleteTimer = null
  let pendingLevelTimer = null
  let segmentAnimId = null
  let heldDotEl = null      // the dot currently held at full bloom

  // ─── Canvas ───
  const canvas = el.querySelector('#dtd-canvas')
  const ctx = canvas.getContext('2d')
  const area = el.querySelector('#dtd-puzzle-area')
  const overlay = el.querySelector('#dtd-dots-overlay')
  const labelEl = el.querySelector('#dtd-reveal-label')

  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1
    const w = area.clientWidth
    const h = area.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // ─── Play rect (centered square within puzzle area) ───
  function computePlayRect() {
    const w = area.clientWidth
    const h = area.clientHeight
    const size = Math.min(w * 0.93, h * 0.93)
    return {
      x: (w - size) / 2,
      y: (h - size) / 2,
      w: size,
      h: size,
    }
  }

  // ─── Box-shadow-style glow line drawing ───
  // Mirrors the CodeSandbox CSS pattern: multiple shadowBlur layers stacked
  // from wide/faint → narrow/bright (same as CSS box-shadow comma layers).
  function drawGlowPath(pts) {
    if (pts.length < 2) return
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const path = () => {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    }

    // Outer bloom (wide shadowBlur, faint — like box-shadow 80px/100px)
    path()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 100
    ctx.stroke()

    path()
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1
    ctx.shadowBlur = 60
    ctx.stroke()

    path()
    ctx.strokeStyle = 'rgba(255,255,255,0.40)'
    ctx.lineWidth = 1
    ctx.shadowBlur = 40
    ctx.stroke()

    // Core (narrow, bright — like box-shadow 10px/20px)
    path()
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 2
    ctx.shadowBlur = 20
    ctx.stroke()

    path()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 10
    ctx.stroke()

    ctx.restore()
  }

  // ─── Detail lines (revealed after completion) ───
  let revealedDetails = []  // screen-coord polylines already revealed
  let detailAnimId = null

  // Convert a detail line's fractional coords to screen coords
  function detailToScreen(detailLine) {
    const play = computePlayRect()
    return detailLine.map(pt => ({
      x: play.x + pt[0] * play.w,
      y: play.y + pt[1] * play.h,
    }))
  }

  // Draw all currently revealed detail lines on canvas
  function drawDetailLines() {
    if (revealedDetails.length === 0) return
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    revealedDetails.forEach(line => {
      if (line.length < 2) return
      const path = () => {
        ctx.beginPath()
        ctx.moveTo(line[0].x, line[0].y)
        for (let i = 1; i < line.length; i++) ctx.lineTo(line[i].x, line[i].y)
      }
      // Soft glow
      path()
      ctx.strokeStyle = 'rgba(255,255,255,0.30)'
      ctx.lineWidth = 1
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = 40
      ctx.stroke()

      // Core
      path()
      ctx.strokeStyle = 'rgba(255,255,255,0.90)'
      ctx.lineWidth = 2
      ctx.shadowBlur = 10
      ctx.stroke()
    })

    ctx.restore()
  }

  // Animate detail lines appearing one by one, each drawing point-to-point
  function revealDetails(puzzle, onAllDone) {
    if (!puzzle.details || puzzle.details.length === 0) {
      if (onAllDone) onAllDone()
      return
    }
    revealedDetails = []
    const allLines = puzzle.details.map(d => detailToScreen(d))
    let lineIdx = 0

    function revealNextLine() {
      if (lineIdx >= allLines.length) {
        detailAnimId = null
        if (onAllDone) onAllDone()
        return
      }
      const screenLine = allLines[lineIdx]
      lineIdx++
      // Animate this line drawing point-to-point
      let ptIdx = 1
      const partialLine = [screenLine[0]]
      revealedDetails.push(partialLine)

      function animateSegment() {
        if (ptIdx >= screenLine.length) {
          // This line done, start next after a short pause
          setTimeout(revealNextLine, 80)
          return
        }
        const from = screenLine[ptIdx - 1]
        const to = screenLine[ptIdx]
        const segStart = performance.now()
        const segDuration = 120  // fast per-segment

        function segFrame(now) {
          const rawT = Math.min((now - segStart) / segDuration, 1)
          const t = 1 - Math.pow(1 - rawT, 3)
          const cur = {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          }

          // Replace trailing partial point
          if (partialLine.length > ptIdx) partialLine.pop()
          partialLine.push(cur)

          // Redraw everything
          ctx.clearRect(0, 0, area.clientWidth, area.clientHeight)
          drawGlowPath(connectedPts)
          drawDetailLines()

          if (rawT < 1) {
            detailAnimId = requestAnimationFrame(segFrame)
          } else {
            // Finalize this point
            partialLine[partialLine.length - 1] = to
            ptIdx++
            animateSegment()
          }
        }
        detailAnimId = requestAnimationFrame(segFrame)
      }
      animateSegment()
    }
    revealNextLine()
  }

  // ─── Animated trail segment ───
  function animateNewSegment(fromPt, toPt, onComplete) {
    if (segmentAnimId) cancelAnimationFrame(segmentAnimId)
    const start = performance.now()

    function frame(now) {
      const rawT = Math.min((now - start) / LINE_DRAW_MS, 1)
      const t = 1 - Math.pow(1 - rawT, 3) // ease-out cubic
      const px = fromPt.x + (toPt.x - fromPt.x) * t
      const py = fromPt.y + (toPt.y - fromPt.y) * t

      ctx.clearRect(0, 0, area.clientWidth, area.clientHeight)
      const committed = connectedPts.slice(0, -1)
      if (committed.length >= 2) drawGlowPath(committed)
      drawGlowPath([fromPt, { x: px, y: py }])

      if (rawT < 1) {
        segmentAnimId = requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, area.clientWidth, area.clientHeight)
        drawGlowPath(connectedPts)
        segmentAnimId = null
        if (onComplete) onComplete()
      }
    }

    segmentAnimId = requestAnimationFrame(frame)
  }

  // ─── Load puzzle ───
  function loadPuzzle(puzzleIdx) {
    // Retry if layout hasn't settled yet
    if (area.clientWidth === 0) {
      requestAnimationFrame(() => loadPuzzle(puzzleIdx))
      return
    }

    // Cancel any in-flight timers and animations
    clearTimeout(pendingCompleteTimer)
    clearTimeout(pendingLevelTimer)
    pendingCompleteTimer = null
    pendingLevelTimer = null
    if (segmentAnimId) { cancelAnimationFrame(segmentAnimId); segmentAnimId = null }
    if (detailAnimId) { cancelAnimationFrame(detailAnimId); detailAnimId = null }
    revealedDetails = []

    currentPuzzleIdx = puzzleIdx
    nextDotIdx = 0
    connectedPts = []
    completed = false
    closingLoop = false
    heldDotEl = null
    labelEl.textContent = ''
    labelEl.classList.remove('dtd-label-visible', 'dtd-label-big')

    const puzzle = level.puzzles[puzzleIdx]
    sizeCanvas()
    ctx.clearRect(0, 0, area.clientWidth, area.clientHeight)

    const play = computePlayRect()
    overlay.innerHTML = ''
    dotMeta = []

    puzzle.dots.forEach((coord, i) => {
      const sx = play.x + coord[0] * play.w
      const sy = play.y + coord[1] * play.h
      const color = dotColor(i, puzzle.dots.length)

      const dotEl = document.createElement('div')
      dotEl.className = 'dtd-dot dtd-dot-waiting'
      dotEl.style.left = sx + 'px'
      dotEl.style.top = sy + 'px'
      dotEl.style.background = color
      dotEl.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}, 0 0 80px ${color}, 0 0 100px ${color}`
      dotEl.style.color = '#fff'
      dotEl.textContent = i + 1
      overlay.appendChild(dotEl)

      dotMeta.push({ x: sx, y: sy, el: dotEl })
    })

    // Activate first dot
    activateDot(0)
  }

  function activateDot(idx) {
    if (idx >= dotMeta.length) return
    dotMeta[idx].el.classList.remove('dtd-dot-waiting', 'dtd-dot-done', 'dtd-dot-tapped', 'dtd-dot-connect')
    dotMeta[idx].el.classList.add('dtd-dot-next')
  }

  // Starts the 2s ease-back-to-pinprick (CodeSandbox transition: 2s un-hover).
  // Color stays rainbow — forwards fill holds scale(0.1) at the end.
  function flashDot(dotEl) {
    dotEl.classList.remove('dtd-dot-tapped')
    dotEl.classList.add('dtd-dot-connect')
  }

  // ─── Hit detection ───
  overlay.addEventListener('pointerdown', e => {
    if (completed) return
    const rect = overlay.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    let nearest = null
    let nearestDist = Infinity
    dotMeta.forEach((dot, i) => {
      const dx = dot.x - px
      const dy = dot.y - py
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < nearestDist) { nearest = { dot, i }; nearestDist = dist }
    })

    if (!nearest || nearestDist > 52) return

    if (closingLoop && nearest.i === 0) {
      // Close the loop back to dot 1
      const dot = dotMeta[0]
      const prevPt = connectedPts[connectedPts.length - 1]
      // Shrink previous held dot immediately (don't rely on line callback —
      // rapid taps cancel in-flight animations and their callbacks never fire)
      if (heldDotEl) flashDot(heldDotEl)
      dot.el.classList.remove('dtd-dot-next')
      dot.el.classList.add('dtd-dot-tapped')
      connectedPts.push({ x: dot.x, y: dot.y })
      animateNewSegment(prevPt, { x: dot.x, y: dot.y }, () => {
        flashDot(dot.el)  // shrink closing dot when line finishes
      })
      heldDotEl = null
      onPuzzleComplete()
    } else if (!closingLoop && nearest.i === nextDotIdx) {
      // Correct sequential dot
      const dot = nearest.dot
      const prevPt = connectedPts.length > 0 ? connectedPts[connectedPts.length - 1] : null
      // Shrink previous held dot immediately on tap
      if (heldDotEl) flashDot(heldDotEl)
      dot.el.classList.remove('dtd-dot-next', 'dtd-dot-waiting')
      dot.el.classList.add('dtd-dot-tapped')

      connectedPts.push({ x: dot.x, y: dot.y })
      if (prevPt) {
        animateNewSegment(prevPt, { x: dot.x, y: dot.y })
      }
      // This dot stays held until the next dot is tapped
      heldDotEl = dot.el

      nextDotIdx++
      if (nextDotIdx < dotMeta.length) {
        activateDot(nextDotIdx)
      } else {
        // All dots connected — re-activate dot 1 to close the shape
        closingLoop = true
        dotMeta[0].el.classList.remove('dtd-dot-done', 'dtd-dot-tapped', 'dtd-dot-connect', 'dtd-dot-waiting')
        dotMeta[0].el.classList.add('dtd-dot-next')
      }
    } else {
      // Wrong dot — shake
      const wrongEl = nearest.dot.el
      wrongEl.classList.add('dtd-dot-shake')
      wrongEl.addEventListener('animationend', () => wrongEl.classList.remove('dtd-dot-shake'), { once: true })
    }
  })

  // ─── Puzzle complete ───
  function onPuzzleComplete() {
    completed = true
    const completedIdx = currentPuzzleIdx
    const puzzle = level.puzzles[completedIdx]

    // Big particle burst from center
    pendingCompleteTimer = setTimeout(() => {
      // Bail if user navigated away via nav pills
      if (currentPuzzleIdx !== completedIdx) return

      const cx = area.clientWidth / 2
      const cy = area.clientHeight / 2
      spawnParticles(area, cx, cy, 28)

      // Show label
      labelEl.textContent = `${puzzle.emoji} ${puzzle.name}!`
      labelEl.classList.add('dtd-label-visible')

      // Mark nav pill done
      const navItems = el.querySelectorAll('.dtd-page-nav-item')
      if (navItems[completedIdx]) {
        navItems[completedIdx].classList.add('dtd-nav-done')
      }

      // Reveal detail lines, then auto-advance after they finish
      revealDetails(puzzle, () => {
        // Auto-advance 3s after details are done
        pendingLevelTimer = setTimeout(() => {
          if (currentPuzzleIdx !== completedIdx) return
          const nextIdx = completedIdx + 1
          if (nextIdx < level.puzzles.length) {
            labelEl.classList.remove('dtd-label-visible')
            el.querySelectorAll('.dtd-page-nav-item').forEach(b => b.classList.remove('active'))
            if (navItems[nextIdx]) navItems[nextIdx].classList.add('active')
            loadPuzzle(nextIdx)
          } else {
            showLevelComplete()
          }
        }, 3000)
      })
    }, 300)
  }

  function showLevelComplete() {
    labelEl.textContent = '🌟 Level Complete!'
    labelEl.classList.add('dtd-label-visible', 'dtd-label-big')
    const cx = area.clientWidth / 2
    const cy = area.clientHeight / 2
    spawnParticles(area, cx, cy, 36)

    const completionOverlay = el.querySelector('#dtd-completion-overlay')
    pendingLevelTimer = setTimeout(() => {
      labelEl.classList.remove('dtd-label-visible', 'dtd-label-big')
      requestAnimationFrame(() => completionOverlay.classList.add('dtd-show'))
      spawnParticles(area, cx, cy, 20)
    }, 2000)
  }

  // ─── Nav pill switching ───
  el.querySelector('#dtd-page-nav').addEventListener('pointerdown', e => {
    const btn = e.target.closest('.dtd-page-nav-item')
    if (!btn) return
    const idx = parseInt(btn.dataset.idx)
    el.querySelectorAll('.dtd-page-nav-item').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    loadPuzzle(idx)
  })

  // ─── Init after layout ───
  requestAnimationFrame(() => {
    loadPuzzle(currentPuzzleIdx)
  })

  return el
}

// ─── EXPORT ───

export function createDotToDotGame() {
  currentLevelIdx = 0
  currentPuzzleIdx = 0
  return createIntroScreen()
}
