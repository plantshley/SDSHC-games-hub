import { navigate } from '../router.js'
import { LEVELS, ROUND_TIME, INSTRUCTIONS } from '../data/content/odd-one-out.js'

/**
 * Game 7: Odd One Out — Meadow Makers
 *
 * P1: Intro screen
 * P2: Gameplay — 4 items in a 2×2 grid, timed rounds, scoring
 */

let instrTyped = false

// ─── PARTICLES ───

function spawnParticles(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'cc-particle oo-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 80
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = `hsl(${Math.round(Math.random() * 40 + 290)} 60% 65%)`
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
  el.className = 'screen oo-intro'

  el.innerHTML = `
    <div class="oo-intro-bg"></div>
    <div class="oo-intro-header">
      <button class="home-btn" id="oo-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="oo-intro-title">Odd One Out</h2>
    </div>
    <div class="oo-intro-body">
      <div class="oo-intro-left">
        <div class="oo-speech-bubble">
          <span class="oo-speech-text" id="oo-intro-typing"></span>
        </div>
        <img class="oo-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="oo-intro-right">
        <button class="oo-go-btn" id="oo-go-btn"><span>Let's Go! <span class="oo-arrow-nudge">➜</span></span></button>
      </div>
    </div>
  `

  const typingEl = el.querySelector('#oo-intro-typing')
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

  el.querySelector('#oo-intro-home').addEventListener('pointerdown', () => navigate('game-select/meadow'))
  el.querySelector('#oo-go-btn').addEventListener('pointerdown', () => {
    clearTimeout(typingTimer)
    transitionTo(el, createGameplayScreen(0, 0, 0))
  })

  return el
}

// ─── LEVEL NAV BAR ───

function buildLevelNavHtml(activeLevelIdx) {
  return LEVELS.map((lvl, i) => `
    <button class="oo-level-nav-item${i === activeLevelIdx ? ' oo-nav-active' : ''}" data-level="${i}">
      <span class="oo-level-nav-label">${lvl.title}</span>
    </button>
  `).join('')
}

// ─── P2: GAMEPLAY ───

function createGameplayScreen(levelIdx, roundIdx, totalScore) {
  const level = LEVELS[levelIdx]
  const round = level.rounds[roundIdx]
  const el = document.createElement('div')
  el.className = 'screen oo-game'

  let answered = false
  let score = totalScore
  let roundStart = 0
  let timerInterval = null

  const shuffledItems = [...round.items].sort(() => Math.random() - 0.5)

  const itemsHtml = shuffledItems.map(item => `
    <button class="oo-item-card" data-item-id="${item.id}">
      <img class="oo-item-img" src="${item.asset}" alt="${item.label}" draggable="false">
      <span class="oo-item-label">${item.label}</span>
    </button>
  `).join('')

  const roundDotsHtml = level.rounds.map((_, i) => `
    <span class="oo-round-dot${i < roundIdx ? ' oo-dot-done' : ''}${i === roundIdx ? ' oo-dot-current' : ''}"></span>
  `).join('')

  el.innerHTML = `
    <div class="oo-game-bg"></div>
    <div class="oo-game-header">
      <button class="home-btn" id="oo-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="oo-game-title">Odd One Out</h2>
      <span class="oo-progress">Level ${levelIdx + 1}/${LEVELS.length}</span>
    </div>
    <div class="oo-level-nav">${buildLevelNavHtml(levelIdx)}</div>
    <div class="oo-game-body">
      <div class="oo-left-panel">
        <div class="oo-panel">
          <div class="oo-panel-section">
            <span class="oo-panel-heading">Round ${roundIdx + 1} of ${level.rounds.length}</span>
            <div class="oo-round-dots">${roundDotsHtml}</div>
          </div>
          <div class="oo-panel-divider"></div>
          <div class="oo-panel-section">
            <span class="oo-panel-heading">Score</span>
            <span class="oo-score-value" id="oo-score">${score}</span>
          </div>
          <div class="oo-panel-divider"></div>
          <div class="db-speech-bubble db-game-speech">
            <span class="oo-speech-text" id="oo-instruction-text"></span>
          </div>
          <img class="oo-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
          <button class="oo-quit-btn" id="oo-quit">Quit ✕</button>
        </div>
      </div>
      <div class="oo-canvas-panel">
        <div class="oo-timer-bar">
          <div class="oo-timer-fill" id="oo-timer-fill"></div>
          <span class="oo-timer-text" id="oo-timer-text">${ROUND_TIME}s</span>
        </div>
        <div class="oo-round-label">Round ${roundIdx + 1} of ${level.rounds.length}</div>
        <div class="oo-item-grid" id="oo-item-grid">
          ${itemsHtml}
        </div>
        <div class="oo-fact-modal" id="oo-fact-modal">
          <div class="oo-fact-card">
            <p id="oo-fact-text"></p>
            <button class="oo-fact-continue" id="oo-fact-continue">Continue</button>
          </div>
        </div>
        <div class="oo-completion-overlay" id="oo-completion-overlay">
          <div class="oo-completion-content">
            <div class="oo-completion-bubble">
              <span class="oo-completion-text" id="oo-comp-text"></span>
            </div>
            <img class="oo-completion-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="">
            <div class="oo-completion-buttons" id="oo-comp-buttons"></div>
          </div>
        </div>
      </div>
    </div>
  `

  // Type instruction
  const instrEl = el.querySelector('#oo-instruction-text')
  const instrText = INSTRUCTIONS.gameplay
  if (instrTyped) {
    instrEl.textContent = instrText
  } else {
    let instrIdx = 0
    function typeInstr() {
      if (instrIdx < instrText.length && el.parentNode) {
        instrEl.textContent += instrText[instrIdx++]
        setTimeout(typeInstr, 35)
      }
    }
    setTimeout(typeInstr, 400)
    instrTyped = true
  }

  const scoreEl = el.querySelector('#oo-score')
  const timerFill = el.querySelector('#oo-timer-fill')
  const timerText = el.querySelector('#oo-timer-text')
  const canvasPanel = el.querySelector('.oo-canvas-panel')
  const factModal = el.querySelector('#oo-fact-modal')
  const factText = el.querySelector('#oo-fact-text')
  const factContinueBtn = el.querySelector('#oo-fact-continue')
  const completionOverlay = el.querySelector('#oo-completion-overlay')
  const compButtons = el.querySelector('#oo-comp-buttons')

  // ─── Timer ───
  function startTimer() {
    roundStart = Date.now()
    timerInterval = setInterval(() => {
      if (!el.parentNode) { clearInterval(timerInterval); return }
      const elapsed = (Date.now() - roundStart) / 1000
      const remaining = Math.max(0, ROUND_TIME - elapsed)
      const pct = (remaining / ROUND_TIME) * 100
      timerFill.style.width = pct + '%'
      timerText.textContent = Math.ceil(remaining) + 's'

      // Color states
      timerFill.classList.toggle('oo-timer-green', remaining > ROUND_TIME * 0.5)
      timerFill.classList.toggle('oo-timer-yellow', remaining <= ROUND_TIME * 0.5 && remaining > ROUND_TIME * 0.25)
      timerFill.classList.toggle('oo-timer-red', remaining <= ROUND_TIME * 0.25)

      if (remaining <= 0) {
        clearInterval(timerInterval)
        if (!answered) onTimeUp()
      }
    }, 100)
  }

  function stopTimer() {
    clearInterval(timerInterval)
  }

  function onTimeUp() {
    answered = true
    instrEl.textContent = INSTRUCTIONS.timeUp
    // Highlight correct answer
    el.querySelectorAll('.oo-item-card').forEach(c => {
      if (c.dataset.itemId === round.answer) {
        c.classList.add('oo-correct')
      } else {
        c.classList.add('oo-disabled')
      }
    })
    setTimeout(() => showExplanation(), 800)
  }

  function showExplanation() {
    factText.textContent = round.explanation
    factModal.classList.add('oo-fact-visible')
  }

  function showCompletion() {
    const isLastLevel = levelIdx >= LEVELS.length - 1
    const compText = el.querySelector('#oo-comp-text')

    if (isLastLevel) {
      compText.innerHTML = `${INSTRUCTIONS.complete}<br><br>Final Score: ${score}`
      compButtons.innerHTML = `
        <button class="oo-completion-btn" id="oo-play-again">Play Again</button>
        <button class="oo-completion-btn oo-completion-btn-primary" id="oo-back-games">Back to Games</button>
      `
      compButtons.querySelector('#oo-play-again').addEventListener('pointerdown', () => {
        transitionTo(el, createGameplayScreen(0, 0, 0))
      })
      compButtons.querySelector('#oo-back-games').addEventListener('pointerdown', () => {
        navigate('game-select/meadow')
      })
    } else {
      compText.innerHTML = `${level.title} Complete!<br><br>Score: ${score}`
      compButtons.innerHTML = `<button class="oo-completion-btn oo-completion-btn-primary" id="oo-next-level">Next Level</button>`
      compButtons.querySelector('#oo-next-level').addEventListener('pointerdown', () => {
        transitionTo(el, createGameplayScreen(levelIdx + 1, 0, 0))
      })
    }

    requestAnimationFrame(() => completionOverlay.classList.add('oo-show'))

    // Particles
    setTimeout(() => {
      if (!el.parentNode) return
      const r = canvasPanel.getBoundingClientRect()
      spawnParticles(canvasPanel, r.width / 2, r.height / 2, 20)
    }, 300)
  }

  function advanceRound() {
    factModal.classList.remove('oo-fact-visible')
    const nextRound = roundIdx + 1
    if (nextRound < level.rounds.length) {
      transitionTo(el, createGameplayScreen(levelIdx, nextRound, score))
    } else {
      showCompletion()
    }
  }

  factContinueBtn.addEventListener('pointerdown', advanceRound)

  // ─── Item tap handlers ───
  el.querySelectorAll('.oo-item-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      if (answered) return
      if (factModal.classList.contains('oo-fact-visible')) return

      const itemId = card.dataset.itemId

      if (itemId === round.answer) {
        answered = true
        stopTimer()
        card.classList.add('oo-correct')

        el.querySelectorAll('.oo-item-card').forEach(c => {
          if (c !== card) c.classList.add('oo-disabled')
        })

        // Calculate points
        const elapsed = (Date.now() - roundStart) / 1000
        let points = 100
        if (elapsed <= 5) points += 50
        else if (elapsed <= 10) points += 25
        score += points
        scoreEl.textContent = score
        scoreEl.classList.add('oo-score-pop')
        setTimeout(() => scoreEl.classList.remove('oo-score-pop'), 400)

        // Particles
        const cr = card.getBoundingClientRect()
        const pr = canvasPanel.getBoundingClientRect()
        spawnParticles(canvasPanel, cr.left - pr.left + cr.width / 2, cr.top - pr.top + cr.height / 2, 12)

        setTimeout(() => showExplanation(), 800)
      } else {
        card.classList.add('oo-wrong')
        card.style.pointerEvents = 'none'
        setTimeout(() => {
          card.classList.remove('oo-wrong')
          card.style.pointerEvents = ''
        }, 800)
      }
    })
  })

  // ─── Level nav pills ───
  el.querySelectorAll('.oo-level-nav-item').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      const idx = parseInt(btn.dataset.level)
      if (idx === levelIdx) return
      stopTimer()
      transitionTo(el, createGameplayScreen(idx, 0, 0))
    })
  })

  // Home + quit
  el.querySelector('#oo-game-home').addEventListener('pointerdown', () => {
    stopTimer()
    navigate('game-select/meadow')
  })
  el.querySelector('#oo-quit').addEventListener('pointerdown', () => {
    stopTimer()
    transitionTo(el, createIntroScreen())
  })

  // Start the timer
  startTimer()

  return el
}

// ─── EXPORT ───

export function createOddOneOutGame() {
  return createIntroScreen()
}
