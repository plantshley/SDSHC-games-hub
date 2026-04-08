import { navigate } from '../router.js'
import { LEVELS, INSTRUCTIONS } from '../data/content/farm-manager.js'

/**
 * Game 9: Farm Manager Simulator — Harvest Guardians
 *
 * P1: Intro / level select (8 levels)
 * P2: Gameplay — scenario + 4 options, greyscale-to-color reveal
 * P3: Completion overlay per level
 */

let instrTyped = false

// ─── PARTICLES ───

function spawnParticles(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'cc-particle fm-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 80
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = `hsl(${Math.round(Math.random() * 40 + 160)} 60% 55%)`
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
  instrTyped = false
  const el = document.createElement('div')
  el.className = 'screen fm-intro'

  el.innerHTML = `
    <div class="fm-intro-bg"></div>
    <div class="fm-intro-header">
      <button class="home-btn" id="fm-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="fm-intro-title">Farm Manager Simulator</h2>
    </div>
    <div class="fm-intro-body">
      <div class="fm-intro-left">
        <div class="fm-speech-bubble">
          <span class="fm-speech-text" id="fm-intro-typing"></span>
        </div>
        <img class="fm-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="fm-intro-right">
        <button class="fm-go-btn" id="fm-go-btn"><span>Let's Go! <span class="fm-arrow-nudge">➜</span></span></button>
      </div>
    </div>
  `

  // Typing animation
  const typingEl = el.querySelector('#fm-intro-typing')
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

  el.querySelector('#fm-intro-home').addEventListener('pointerdown', () => navigate('game-select/guardians'))
  el.querySelector('#fm-go-btn').addEventListener('pointerdown', () => {
    clearTimeout(typingTimer)
    transitionTo(el, createGameplayScreen(0))
  })

  return el
}

// ─── LEVEL NAV BAR ───

function buildLevelNavHtml(activeLevelIdx) {
  return LEVELS.map((lvl, i) => `
    <button class="fm-level-nav-item${i === activeLevelIdx ? ' fm-nav-active' : ''}" data-level="${i}">
      <span class="fm-level-nav-label">${lvl.title}</span>
    </button>
  `).join('')
}

function wireLevelNav(el, currentLevelIdx, timerRef) {
  el.querySelectorAll('.fm-level-nav-item').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
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
  el.className = 'screen fm-game'

  let answered = false

  const shuffledOptions = [...level.options].sort(() => Math.random() - 0.5)

  const optionsHtml = shuffledOptions.map(opt => `
    <button class="fm-option-card" data-option-id="${opt.id}">
      <span class="fm-option-label">${opt.label}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="fm-game-bg"></div>
    <div class="fm-game-header">
      <button class="home-btn" id="fm-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="fm-game-title">Farm Manager Simulator</h2>
      <span class="fm-progress" id="fm-progress">Level ${levelIdx + 1}/${LEVELS.length}</span>
    </div>
    <div class="fm-level-nav">${buildLevelNavHtml(levelIdx)}</div>
    <div class="fm-game-body">
      <div class="fm-left-panel">
        <div class="fm-panel" id="fm-panel">
          <div class="fm-scenario-section">
            <span class="fm-scenario-icon">\u26A0\uFE0F</span>
            <p class="fm-scenario-text">${level.scenario}</p>
          </div>
          <div class="fm-options" id="fm-options">
            ${optionsHtml}
          </div>
          <button class="fm-quit-btn" id="fm-quit">Quit \u2715</button>
        </div>
        <div class="fm-panel-bottom">
          <div class="fm-instructions">
            <p id="fm-instruction-text"></p>
          </div>
          <img class="fm-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
      <div class="fm-canvas-panel">
        <div class="fm-farm-display" id="fm-farm-display">
          <img class="fm-farm-image" id="fm-farm-image" src="${level.image}" alt="${level.title}" draggable="false">
          <p class="fm-practice-description" id="fm-practice-desc">${level.description}</p>
        </div>
        <div class="fm-fact-modal" id="fm-fact-modal">
          <div class="fm-fact-card">
            <span class="fm-fact-title" id="fm-fact-title"></span>
            <p id="fm-fact-text"></p>
            <span class="fm-fact-source" id="fm-fact-source"></span>
            <div class="fm-fact-buttons">
              <button class="fm-fact-continue" id="fm-fact-continue">Next Level</button>
            </div>
          </div>
        </div>
        <div class="fm-completion-overlay" id="fm-completion-overlay">
          <div class="fm-completion-content">
            <div class="fm-completion-bubble">
              <span class="fm-completion-text">${INSTRUCTIONS.complete}</span>
            </div>
            <img class="fm-completion-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="">
            <div class="fm-completion-buttons">
              <button class="fm-completion-btn" id="fm-play-again">Play Again</button>
              <button class="fm-completion-btn fm-completion-btn-primary" id="fm-back-games">Back to Games</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Type instruction (only animate on first level entry)
  const instrEl = el.querySelector('#fm-instruction-text')
  const instrText = INSTRUCTIONS.gameplay
  const instrTimerRef = { id: null }
  if (instrTyped) {
    instrEl.textContent = instrText
  } else {
    let instrIdx = 0
    function typeInstr() {
      if (instrIdx < instrText.length && el.parentNode) {
        instrEl.textContent += instrText[instrIdx++]
        instrTimerRef.id = setTimeout(typeInstr, 35)
      }
    }
    instrTimerRef.id = setTimeout(typeInstr, 400)
    instrTyped = true
  }

  const farmImage = el.querySelector('#fm-farm-image')
  const practiceDesc = el.querySelector('#fm-practice-desc')
  const factModal = el.querySelector('#fm-fact-modal')
  const factTitle = el.querySelector('#fm-fact-title')
  const factText = el.querySelector('#fm-fact-text')
  const factSource = el.querySelector('#fm-fact-source')
  const factContinueBtn = el.querySelector('#fm-fact-continue')


  const isLastLevel = levelIdx >= LEVELS.length - 1

  const completionOverlay = el.querySelector('#fm-completion-overlay')
  const canvasPanel = el.querySelector('.fm-canvas-panel')

  function showFact(lvl) {
    factTitle.textContent = lvl.options.find(o => o.id === lvl.correctId).label
    factText.textContent = lvl.fact
    factSource.textContent = `Source: ${lvl.source}`
    factContinueBtn.textContent = isLastLevel ? 'Continue' : 'Next Level'
    factModal.classList.add('fm-fact-visible')
  }

  factContinueBtn.addEventListener('pointerdown', () => {
    factModal.classList.remove('fm-fact-visible')
    if (isLastLevel) {
      requestAnimationFrame(() => completionOverlay.classList.add('fm-show'))
      const r = canvasPanel.getBoundingClientRect()
      spawnParticles(canvasPanel, r.width / 2, r.height / 2, 20)
    } else {
      transitionTo(el, createGameplayScreen(levelIdx + 1))
    }
  })

  el.querySelector('#fm-play-again').addEventListener('pointerdown', () => transitionTo(el, createGameplayScreen(0)))
  el.querySelector('#fm-back-games').addEventListener('pointerdown', () => navigate('game-select/guardians'))

  // ─── Option tap handlers ───
  el.querySelectorAll('.fm-option-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      if (answered) return
      if (factModal.classList.contains('fm-fact-visible')) return

      const optionId = card.dataset.optionId

      if (optionId === level.correctId) {
        // Correct!
        answered = true
        card.classList.add('fm-option-correct')

        // Disable all other options
        el.querySelectorAll('.fm-option-card').forEach(c => {
          if (c !== card) c.classList.add('fm-option-disabled')
        })

        // Swap to reveal image — wait for it to load, then transition in
        practiceDesc.classList.add('fm-desc-hidden')
        if (level.revealImage) {
          farmImage.addEventListener('load', () => {
            requestAnimationFrame(() => {
              farmImage.classList.add('fm-farm-healthy')
            })
          }, { once: true })
          farmImage.src = level.revealImage
        } else {
          farmImage.classList.add('fm-farm-healthy')
        }

        // Show fact modal after letting the reveal image breathe
        setTimeout(() => showFact(level), 5000)
      } else {
        // Wrong — shake + hint
        card.classList.add('fm-option-wrong')
        setTimeout(() => card.classList.remove('fm-option-wrong'), 400)
        instrEl.textContent = INSTRUCTIONS.wrongHint
        setTimeout(() => {
          if (!answered && el.parentNode) instrEl.textContent = INSTRUCTIONS.gameplay
        }, 3000)
      }
    })
  })

  // Home + quit buttons
  el.querySelector('#fm-game-home').addEventListener('pointerdown', () => {
    clearTimeout(instrTimerRef.id)
    navigate('game-select/guardians')
  })
  el.querySelector('#fm-quit').addEventListener('pointerdown', () => {
    clearTimeout(instrTimerRef.id)
    transitionTo(el, createIntroScreen())
  })

  // Level navigation pills
  wireLevelNav(el, levelIdx, instrTimerRef)

  return el
}

// ─── EXPORT ───

export function createFarmManagerGame() {
  return createIntroScreen()
}
