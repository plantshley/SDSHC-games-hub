import { navigate } from '../router.js'
import { LEVELS, INSTRUCTIONS } from '../data/content/dont-belong.js'
import { mountNarrowGate } from '../utils/narrow-gate.js'
import { onTap } from '../utils/tap.js'

/**
 * Game 3: Things That Don't Belong — Little Sprouts
 *
 * P1: Intro screen
 * P2: Gameplay — 4 items in a 2×2 grid, tap the odd one out
 */

let instrTyped = false

// ─── PARTICLES ───

function spawnParticles(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'cc-particle db-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 80
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = `hsl(${Math.round(Math.random() * 40 + 80)} 60% 55%)`
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

// ─── P1: INTRO ───

function createIntroScreen() {
  instrTyped = false
  const el = document.createElement('div')
  el.className = 'screen db-intro'

  el.innerHTML = `
    <div class="db-intro-bg"></div>
    <div class="db-intro-header">
      <button class="home-btn" id="db-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="db-intro-title">Things That Don't Belong</h2>
    </div>
    <div class="db-intro-body">
      <div class="db-intro-left">
        <div class="db-speech-bubble">
          <span class="db-speech-text" id="db-intro-typing"></span>
        </div>
        <img class="db-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="db-intro-right">
        <button class="db-go-btn" id="db-go-btn"><span>Let's Go! <span class="db-arrow-nudge">➜</span></span></button>
      </div>
    </div>
  `

  // Typing animation
  const typingEl = el.querySelector('#db-intro-typing')
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

  onTap(el.querySelector('#db-intro-home'), () => navigate('game-select/sprouts'))
  onTap(el.querySelector('#db-go-btn'), () => {
    clearTimeout(typingTimer)
    transitionTo(el, createGameplayScreen(0))
  })

  return el
}

// ─── LEVEL NAV BAR ───

function buildLevelNavHtml(activeLevelIdx) {
  return LEVELS.map((lvl, i) => `
    <button class="db-level-nav-item${i === activeLevelIdx ? ' db-nav-active' : ''}" data-level="${i}">
      <span class="db-level-nav-label">Level ${i + 1}</span>
    </button>
  `).join('')
}

function wireLevelNav(el, currentLevelIdx, timerRef) {
  el.querySelectorAll('.db-level-nav-item').forEach(btn => {
    onTap(btn, () => {
      const idx = parseInt(btn.dataset.level)
      if (idx === currentLevelIdx) return
      clearTimeout(timerRef.id)
      transitionTo(el, createGameplayScreen(idx))
    })
  })
}

// ─── P2: GAMEPLAY ───

function createGameplayScreen(levelIdx) {
  const level = LEVELS[levelIdx]
  const el = document.createElement('div')
  el.className = 'screen db-game'
  mountNarrowGate(el, { onBack: () => navigate('grade-select') })

  let answered = false

  const shuffledItems = [...level.items].sort(() => Math.random() - 0.5)
  const isPhotoLevel = level.items.some(i => i.asset.endsWith('.webp'))

  const itemsHtml = shuffledItems.map(item => `
    <button class="db-item-card" data-item-id="${item.id}">
      <img class="db-item-img" src="${item.asset}" alt="${item.label}" draggable="false">
      <span class="db-item-label">${item.label}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="db-game-bg"></div>
    <div class="db-game-header">
      <button class="home-btn" id="db-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="db-game-title">Things That Don't Belong</h2>
      <span class="db-progress">Level ${levelIdx + 1}/${LEVELS.length}</span>
    </div>
    <div class="db-level-nav">${buildLevelNavHtml(levelIdx)}</div>
    <div class="db-game-body">
      <div class="db-left-panel">
        <div class="db-panel">
          <div class="db-speech-bubble db-game-speech">
            <span class="db-speech-text" id="db-feedback-text"></span>
          </div>
          <img class="db-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
          <button class="db-quit-btn" id="db-quit">Quit ✕</button>
        </div>
      </div>
      <div class="db-canvas-panel">
        <div class="db-item-grid${isPhotoLevel ? ' db-photo-grid' : ''}" id="db-item-grid">
          ${itemsHtml}
        </div>
        <div class="db-category-reveal" id="db-category-reveal">
          <span class="db-reveal-text" id="db-reveal-text"></span>
        </div>
        <div class="db-completion-overlay" id="db-completion-overlay">
          <div class="db-completion-content">
            <div class="db-completion-bubble">
              <span class="db-completion-text">${INSTRUCTIONS.complete}</span>
            </div>
            <img class="db-completion-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="">
            <div class="db-completion-buttons">
              <button class="db-completion-btn" id="db-play-again">Play Again</button>
              <button class="db-completion-btn db-completion-btn-primary" id="db-back-games">Back to Games</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  const feedbackEl = el.querySelector('#db-feedback-text')
  const canvasPanel = el.querySelector('.db-canvas-panel')
  const categoryReveal = el.querySelector('#db-category-reveal')
  const revealText = el.querySelector('#db-reveal-text')
  const completionOverlay = el.querySelector('#db-completion-overlay')
  const isLastLevel = levelIdx >= LEVELS.length - 1
  const instrTimerRef = { id: null }

  // Type gameplay instruction into speech bubble (only animate on first level)
  const instrText = INSTRUCTIONS.gameplay
  if (instrTyped) {
    feedbackEl.textContent = instrText
  } else {
    let instrIdx = 0
    function typeInstr() {
      if (instrIdx < instrText.length && el.parentNode) {
        feedbackEl.textContent += instrText[instrIdx++]
        instrTimerRef.id = setTimeout(typeInstr, 35)
      }
    }
    instrTimerRef.id = setTimeout(typeInstr, 400)
    instrTyped = true
  }

  // ─── Item tap handlers ───
  el.querySelectorAll('.db-item-card').forEach(card => {
    onTap(card, () => {
      if (answered) return

      const itemId = card.dataset.itemId

      if (itemId === level.answer) {
        // Correct!
        answered = true
        card.classList.add('db-correct')

        // Disable all other cards
        el.querySelectorAll('.db-item-card').forEach(c => {
          if (c !== card) c.classList.add('db-disabled')
        })

        // Random praise
        const praise = INSTRUCTIONS.correct[Math.floor(Math.random() * INSTRUCTIONS.correct.length)]
        feedbackEl.textContent = praise

        // Particles from the correct card
        const cr = card.getBoundingClientRect()
        const pr = canvasPanel.getBoundingClientRect()
        spawnParticles(canvasPanel, cr.left - pr.left + cr.width / 2, cr.top - pr.top + cr.height / 2, 15)

        // Show category reveal
        revealText.textContent = level.categoryReveal
        setTimeout(() => categoryReveal.classList.add('db-reveal-visible'), 600)

        // Auto-advance after delay
        setTimeout(() => {
          if (!el.parentNode) return
          if (isLastLevel) {
            categoryReveal.classList.remove('db-reveal-visible')
            requestAnimationFrame(() => completionOverlay.classList.add('db-show'))
            spawnParticles(canvasPanel, canvasPanel.offsetWidth / 2, canvasPanel.offsetHeight / 2, 20)
          } else {
            transitionTo(el, createGameplayScreen(levelIdx + 1))
          }
        }, 3500)
      } else {
        // Wrong — shake
        card.classList.add('db-wrong')
        setTimeout(() => card.classList.remove('db-wrong'), 400)
        feedbackEl.textContent = INSTRUCTIONS.tryAgain
        setTimeout(() => {
          if (!answered && el.parentNode) feedbackEl.textContent = INSTRUCTIONS.gameplay
        }, 2000)
      }
    })
  })

  // Completion overlay buttons
  onTap(el.querySelector('#db-play-again'), () => transitionTo(el, createGameplayScreen(0)))
  onTap(el.querySelector('#db-back-games'), () => navigate('game-select/sprouts'))

  // Home + quit
  onTap(el.querySelector('#db-game-home'), () => {
    clearTimeout(instrTimerRef.id)
    transitionTo(el, createIntroScreen())
  })
  onTap(el.querySelector('#db-quit'), () => {
    clearTimeout(instrTimerRef.id)
    transitionTo(el, createIntroScreen())
  })

  // Level navigation pills
  wireLevelNav(el, levelIdx, instrTimerRef)

  return el
}

// ─── EXPORT ───

export function createDontBelongGame() {
  return createIntroScreen()
}
