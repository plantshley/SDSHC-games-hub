import { navigate } from '../router.js'
import { onTap } from '../utils/tap.js'
import { LEVELS, INSTRUCTIONS } from '../data/content/drag-drop.js'
import { mountNarrowGate } from '../utils/narrow-gate.js'

/**
 * Game 8: Drag & Drop Match — Meadow Makers
 *
 * P1: Intro / level select (6 levels)
 * P2: Gameplay — Mode A (word-to-image) or Mode B (word-to-diagram-position)
 * P3: Completion overlay per level
 */

const LEVEL_ICONS = [
  '/assets/sprites/onion-pixel.png',
  '/assets/sprites/corn-pixel.png',
  '/assets/sprites/coconut-pixel.png',
  '/assets/sprites/grape-pixel.png',
  '/assets/sprites/lettuce-pixel2.png',
  '/assets/sprites/radish-pixel.png',
]

// ─── PARTICLES ───

function spawnParticles(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'cc-particle dd-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 80
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = `hsl(${Math.round(Math.random() * 60 + 290)} 70% 65%)`
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    container.appendChild(p)
    p.addEventListener('animationend', () => p.remove())
  }
}

// ─── SCREEN TRANSITIONS ───

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

// ─── P1: INTRO / LEVEL SELECT ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen dd-intro'

  const levelsHtml = LEVELS.map((lvl, i) => `
    <button class="dd-level-card" data-level="${i}">
      <img src="${LEVEL_ICONS[i]}" alt="" class="dd-level-card-icon">
      <span class="dd-level-card-title">${lvl.title}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="dd-intro-bg"></div>
    <div class="dd-intro-header">
      <button class="home-btn" id="dd-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="dd-intro-title">Drag & Drop Match</h2>
    </div>
    <div class="dd-intro-body">
      <div class="dd-intro-left">
        <div class="dd-speech-bubble">
          <span class="dd-speech-text" id="dd-intro-typing"></span>
        </div>
        <img class="dd-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="dd-intro-right">
        ${levelsHtml}
      </div>
    </div>
  `

  // Typing animation
  const typingEl = el.querySelector('#dd-intro-typing')
  const introText = INSTRUCTIONS.intro
  let charIdx = 0
  let typingTimer = null
  function typeChar() {
    if (charIdx < introText.length && el.parentNode) {
      typingEl.textContent += introText[charIdx++]
      typingTimer = setTimeout(typeChar, 40)
    }
  }
  typingTimer = setTimeout(typeChar, 400)

  onTap(el.querySelector('#dd-intro-home'), () => navigate('game-select/meadow'))
  el.querySelectorAll('.dd-level-card').forEach(card => {
    onTap(card, () => {
      clearTimeout(typingTimer)
      const levelIdx = parseInt(card.dataset.level)
      transitionTo(el, createGameplayScreen(levelIdx))
    })
  })

  return el
}

// ─── LEVEL NAV BAR ───

function buildLevelNavHtml(activeLevelIdx) {
  return LEVELS.map((lvl, i) => `
    <button class="dd-level-nav-item${i === activeLevelIdx ? ' dd-nav-active' : ''}" data-level="${i}">
      <span class="dd-level-nav-label">${lvl.title}</span>
    </button>
  `).join('')
}

function wireLevelNav(el, currentLevelIdx, instrTimer) {
  el.querySelectorAll('.dd-level-nav-item').forEach(btn => {
    onTap(btn, () => {
      const idx = parseInt(btn.dataset.level)
      if (idx === currentLevelIdx) return
      clearTimeout(instrTimer)
      transitionTo(el, createGameplayScreen(idx))
    })
  })
}

// ─── P2: GAMEPLAY DISPATCHER ───

function createGameplayScreen(levelIdx) {
  const level = LEVELS[levelIdx]
  if (level.mode === 'word-to-position') {
    return createWordToPositionScreen(level, levelIdx)
  }
  return createWordToImageScreen(level, levelIdx)
}

// ─── MODE A: WORD-TO-IMAGE ───

function createWordToImageScreen(level, levelIdx) {
  const el = document.createElement('div')
  el.className = 'screen dd-game'
  mountNarrowGate(el, { onBack: () => navigate('grade-select'), rotatePrompt: true })

  const matchedSet = new Set()
  let dragging = false

  const shuffledItems = [...level.items].sort(() => Math.random() - 0.5)
  const shuffledCards = [...level.items].sort(() => Math.random() - 0.5)

  const wordsHtml = shuffledItems.map(item => `
    <div class="dd-word-item" data-item-id="${item.id}">
      <span class="dd-word-label">${item.label}</span>
    </div>
  `).join('')

  const cardsHtml = shuffledCards.map(item => `
    <div class="dd-image-card" data-accepts-id="${item.id}">
      <img src="${item.image}" alt="" class="dd-card-image" draggable="false">
      <span class="dd-card-description">${item.clue}</span>
      <span class="dd-card-label"></span>
    </div>
  `).join('')

  el.innerHTML = `
    <div class="dd-game-bg"></div>
    <div class="dd-game-header">
      <button class="home-btn" id="dd-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="dd-game-title">${level.title}</h2>
      <span class="dd-progress" id="dd-progress">0/${level.items.length}</span>
    </div>
    <div class="dd-level-nav">${buildLevelNavHtml(levelIdx)}</div>
    <div class="dd-game-body">
      <div class="dd-left-panel">
        <div class="dd-panel" id="dd-panel">
          <span class="dd-panel-heading">Words</span>
          <div class="dd-panel-items" id="dd-panel-items">
            ${wordsHtml}
          </div>
          <button class="dd-quit-btn" id="dd-quit">Quit \u2715</button>
        </div>
      </div>
      <div class="dd-canvas-panel">
        <div class="dd-image-grid">
          ${cardsHtml}
        </div>
        <div class="dd-fact-modal" id="dd-fact-modal">
          <div class="dd-fact-card">
            <span class="dd-fact-title" id="dd-fact-title"></span>
            <p id="dd-fact-text"></p>
            <button class="dd-fact-continue" id="dd-fact-continue">Continue</button>
          </div>
        </div>
      </div>
    </div>
  `

  // Type instruction
  const instrEl = el.querySelector('#dd-instruction-text')
  const instrText = INSTRUCTIONS.gameplayMatch
  let instrIdx = 0
  let instrTimer = null
  function typeInstr() {
    if (instrEl && instrIdx < instrText.length && el.parentNode) {
      instrEl.textContent += instrText[instrIdx++]
      instrTimer = setTimeout(typeInstr, 35)
    }
  }
  instrTimer = setTimeout(typeInstr, 400)

  const progressEl = el.querySelector('#dd-progress')
  const factModal = el.querySelector('#dd-fact-modal')
  const factTitle = el.querySelector('#dd-fact-title')
  const factText = el.querySelector('#dd-fact-text')
  const factContinueBtn = el.querySelector('#dd-fact-continue')

  let factDismissCallback = null

  function showFact(item, onDismiss) {
    factTitle.textContent = item.label
    factText.textContent = item.fact
    factDismissCallback = onDismiss || null
    factModal.classList.add('dd-fact-visible')
  }

  onTap(factContinueBtn, () => {
    factModal.classList.remove('dd-fact-visible')
    if (factDismissCallback) {
      factDismissCallback()
      factDismissCallback = null
    }
  })

  function showHint(item) {
    if (!instrEl) return
    instrEl.textContent = `\u{1F4A1} Try matching "${item.label}" to a different image.`
  }

  function resetInstruction() {
    if (!instrEl) return
    instrEl.textContent = INSTRUCTIONS.gameplayMatch
  }

  // ─── Drag from sidebar ───
  el.querySelectorAll('.dd-word-item').forEach(wordEl => {
    let clone = null

    wordEl.addEventListener('pointerdown', (e) => {
      if (wordEl.classList.contains('dd-item-done') || dragging) return
      if (factModal.classList.contains('dd-fact-visible')) return
      e.preventDefault()
      dragging = true

      clone = document.createElement('div')
      clone.className = 'dd-drag-clone'
      clone.textContent = wordEl.querySelector('.dd-word-label').textContent
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
      document.body.appendChild(clone)
      wordEl.setPointerCapture(e.pointerId)
    })

    wordEl.addEventListener('pointermove', (e) => {
      if (!dragging || !clone) return
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
    })

    function cleanupDrag() {
      if (clone) { clone.remove(); clone = null }
      dragging = false
    }

    wordEl.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return

      // Capture drop coordinates before removing clone
      const dropX = e.clientX
      const dropY = e.clientY
      cleanupDrag()

      const itemId = wordEl.dataset.itemId
      const item = level.items.find(i => i.id === itemId)
      if (!item) return

      // Hit test against image cards
      const cards = el.querySelectorAll('.dd-image-card')
      let targetCard = null
      for (const card of cards) {
        if (card.classList.contains('dd-card-matched')) continue
        const cr = card.getBoundingClientRect()
        if (dropX >= cr.left && dropX <= cr.right &&
            dropY >= cr.top && dropY <= cr.bottom) {
          targetCard = card
          break
        }
      }

      if (!targetCard) return

      const acceptsId = targetCard.dataset.acceptsId

      if (itemId === acceptsId) {
        // Correct match
        matchedSet.add(itemId)
        wordEl.classList.add('dd-item-done')
        targetCard.classList.add('dd-card-matched')
        targetCard.querySelector('.dd-card-label').textContent = item.label

        // Particles
        const canvasPanel = el.querySelector('.dd-canvas-panel')
        const cr = targetCard.getBoundingClientRect()
        const pr = canvasPanel.getBoundingClientRect()
        spawnParticles(canvasPanel, cr.left - pr.left + cr.width / 2, cr.top - pr.top + cr.height / 2, 10)

        progressEl.textContent = `${matchedSet.size}/${level.items.length}`

        // Check completion
        if (matchedSet.size === level.items.length) {
          showFact(item, () => {
            setTimeout(() => showCompletion(el, levelIdx), 600)
          })
        } else {
          showFact(item)
        }
      } else {
        // Wrong — shake + hint
        targetCard.classList.add('dd-card-wrong')
        setTimeout(() => targetCard.classList.remove('dd-card-wrong'), 400)
        showHint(item)
        setTimeout(resetInstruction, 3000)
      }
    })

    wordEl.addEventListener('pointercancel', cleanupDrag)
  })

  // Home + quit buttons
  onTap(el.querySelector('#dd-game-home'), () => {
    clearTimeout(instrTimer)
    transitionTo(el, createIntroScreen())
  })
  onTap(el.querySelector('#dd-quit'), () => {
    clearTimeout(instrTimer)
    transitionTo(el, createIntroScreen())
  })

  // Level navigation pills
  wireLevelNav(el, levelIdx, instrTimer)

  return el
}

// ─── MODE B: WORD-TO-DIAGRAM-POSITION ───

function createWordToPositionScreen(level, levelIdx) {
  const el = document.createElement('div')
  el.className = 'screen dd-game'
  mountNarrowGate(el, { onBack: () => navigate('grade-select'), rotatePrompt: true })

  const matchedSet = new Set()
  let dragging = false

  const shuffledItems = [...level.items].sort(() => Math.random() - 0.5)

  const wordsHtml = shuffledItems.map(item => `
    <div class="dd-word-item" data-item-id="${item.id}">
      <span class="dd-word-label">${item.label}</span>
    </div>
  `).join('')

  const zonesHtml = level.items.map(item => `
    <div class="dd-drop-zone" data-accepts-id="${item.id}"
         style="left:${item.snapX}%;top:${item.snapY}%;">
      <span class="dd-zone-label">?</span>
    </div>
  `).join('')

  el.innerHTML = `
    <div class="dd-game-bg"></div>
    <div class="dd-game-header">
      <button class="home-btn" id="dd-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="dd-game-title">${level.title}</h2>
      <span class="dd-progress" id="dd-progress">0/${level.items.length}</span>
    </div>
    <div class="dd-level-nav">${buildLevelNavHtml(levelIdx)}</div>
    <div class="dd-game-body">
      <div class="dd-left-panel">
        <div class="dd-panel" id="dd-panel">
          <span class="dd-panel-heading">Labels</span>
          <div class="dd-panel-items" id="dd-panel-items">
            ${wordsHtml}
          </div>
          <button class="dd-quit-btn" id="dd-quit">Quit \u2715</button>
        </div>
      </div>
      <div class="dd-canvas-panel">
        <div class="dd-diagram-container" id="dd-diagram">
          <img src="${level.diagram}" class="dd-diagram-bg" alt="${level.title}" draggable="false">
          ${zonesHtml}
          <div class="dd-fact-modal" id="dd-fact-modal">
            <div class="dd-fact-card">
              <span class="dd-fact-title" id="dd-fact-title"></span>
              <p id="dd-fact-text"></p>
              <button class="dd-fact-continue" id="dd-fact-continue">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Type instruction
  const instrEl = el.querySelector('#dd-instruction-text')
  const instrText = INSTRUCTIONS.gameplayDiagram
  let instrIdx = 0
  let instrTimer = null
  function typeInstr() {
    if (instrEl && instrIdx < instrText.length && el.parentNode) {
      instrEl.textContent += instrText[instrIdx++]
      instrTimer = setTimeout(typeInstr, 35)
    }
  }
  instrTimer = setTimeout(typeInstr, 400)

  const diagram = el.querySelector('#dd-diagram')
  const progressEl = el.querySelector('#dd-progress')
  const factModal = el.querySelector('#dd-fact-modal')
  const factTitle = el.querySelector('#dd-fact-title')
  const factText = el.querySelector('#dd-fact-text')
  const factContinueBtn = el.querySelector('#dd-fact-continue')

  let factDismissCallback = null

  function showFact(item, onDismiss) {
    factTitle.textContent = item.label
    factText.textContent = item.fact
    factDismissCallback = onDismiss || null
    factModal.classList.add('dd-fact-visible')
  }

  onTap(factContinueBtn, () => {
    factModal.classList.remove('dd-fact-visible')
    if (factDismissCallback) {
      factDismissCallback()
      factDismissCallback = null
    }
  })

  function showHint(item) {
    if (!instrEl) return
    instrEl.textContent = `\u{1F4A1} Try a different spot for "${item.label}".`
  }

  function resetInstruction() {
    if (!instrEl) return
    instrEl.textContent = INSTRUCTIONS.gameplayDiagram
  }

  // ─── Drag from sidebar ───
  el.querySelectorAll('.dd-word-item').forEach(wordEl => {
    let clone = null

    wordEl.addEventListener('pointerdown', (e) => {
      if (wordEl.classList.contains('dd-item-done') || dragging) return
      if (factModal.classList.contains('dd-fact-visible')) return
      e.preventDefault()
      dragging = true

      clone = document.createElement('div')
      clone.className = 'dd-drag-clone'
      clone.textContent = wordEl.querySelector('.dd-word-label').textContent
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
      document.body.appendChild(clone)
      wordEl.setPointerCapture(e.pointerId)
    })

    wordEl.addEventListener('pointermove', (e) => {
      if (!dragging || !clone) return
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
    })

    function cleanupDrag() {
      if (clone) { clone.remove(); clone = null }
      dragging = false
    }

    wordEl.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return

      const dropX = e.clientX
      const dropY = e.clientY
      cleanupDrag()

      const itemId = wordEl.dataset.itemId
      const item = level.items.find(i => i.id === itemId)
      if (!item) return

      // Hit test against drop zones
      const zones = diagram.querySelectorAll('.dd-drop-zone')
      let targetZone = null
      for (const zone of zones) {
        if (zone.classList.contains('dd-zone-filled')) continue
        const zr = zone.getBoundingClientRect()
        if (dropX >= zr.left && dropX <= zr.right &&
            dropY >= zr.top && dropY <= zr.bottom) {
          targetZone = zone
          break
        }
      }

      if (!targetZone) return

      const acceptsId = targetZone.dataset.acceptsId

      if (itemId === acceptsId) {
        // Correct placement
        matchedSet.add(itemId)
        wordEl.classList.add('dd-item-done')
        targetZone.classList.add('dd-zone-filled')
        targetZone.querySelector('.dd-zone-label').textContent = item.label

        // Particles
        const zr = targetZone.getBoundingClientRect()
        const dr = diagram.getBoundingClientRect()
        spawnParticles(diagram, zr.left - dr.left + zr.width / 2, zr.top - dr.top + zr.height / 2, 10)

        progressEl.textContent = `${matchedSet.size}/${level.items.length}`

        if (matchedSet.size === level.items.length) {
          showFact(item, () => {
            setTimeout(() => showCompletion(el, levelIdx), 600)
          })
        } else {
          showFact(item)
        }
      } else {
        // Wrong — shake + hint
        targetZone.classList.add('dd-zone-wrong')
        setTimeout(() => targetZone.classList.remove('dd-zone-wrong'), 400)
        showHint(item)
        setTimeout(resetInstruction, 3000)
      }
    })

    wordEl.addEventListener('pointercancel', cleanupDrag)
  })

  // Home + quit buttons
  onTap(el.querySelector('#dd-game-home'), () => {
    clearTimeout(instrTimer)
    transitionTo(el, createIntroScreen())
  })
  onTap(el.querySelector('#dd-quit'), () => {
    clearTimeout(instrTimer)
    transitionTo(el, createIntroScreen())
  })

  // Level navigation pills
  wireLevelNav(el, levelIdx, instrTimer)

  return el
}

// ─── COMPLETION ───

function showCompletion(container, levelIdx) {
  const isLastLevel = levelIdx >= LEVELS.length - 1
  const rightBtnLabel = isLastLevel ? 'Back to Levels' : 'Next Level'

  const overlay = document.createElement('div')
  overlay.className = 'dd-completion-overlay'
  overlay.innerHTML = `
    <div class="dd-completion-content">
      <div class="dd-completion-bubble">
        <span class="dd-completion-text">${INSTRUCTIONS.complete}</span>
      </div>
      <img class="dd-completion-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="">
      <div class="dd-completion-buttons">
        <button class="dd-completion-btn" id="dd-replay-btn">Play Again</button>
        <button class="dd-completion-btn dd-completion-btn-primary" id="dd-next-btn">${rightBtnLabel}</button>
      </div>
    </div>
  `
  container.querySelector('.dd-canvas-panel').appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('dd-show'))

  // Particles
  const canvas = container.querySelector('.dd-canvas-panel')
  const cr = canvas.getBoundingClientRect()
  spawnParticles(canvas, cr.width / 2, cr.height / 2, 20)

  onTap(overlay.querySelector('#dd-replay-btn'), () => {
    transitionTo(container, createGameplayScreen(levelIdx))
  })

  onTap(overlay.querySelector('#dd-next-btn'), () => {
    if (isLastLevel) {
      transitionTo(container, createIntroScreen())
    } else {
      transitionTo(container, createGameplayScreen(levelIdx + 1))
    }
  })
}

// ─── EXPORT ───

export function createDragDropGame() {
  return createIntroScreen()
}
