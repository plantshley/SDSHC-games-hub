import { navigate } from '../router.js'
import {
  CATEGORIES, WHEEL_SLICES, WIN_THRESHOLD, PLANT_STAGES,
  PLAYER_NAMES, PLAYER_COLORS, INSTRUCTIONS,
} from '../data/content/spin-wheel.js'

/**
 * Spin the Soil Wheel
 * Game 6: Meadow Makers (3rd-5th Grade)
 *
 * Spin a wheel, pick a category, answer trivia.
 * 1-4 players, turn-based. Grow a plant to win!
 */

const TAU = 2 * Math.PI

// ─── HELPERS ───

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateName(usedNames) {
  const { adjectives, nouns } = PLAYER_NAMES
  for (let attempts = 0; attempts < 50; attempts++) {
    const name = adjectives[Math.floor(Math.random() * adjectives.length)] +
      ' ' + nouns[Math.floor(Math.random() * nouns.length)]
    if (!usedNames.has(name)) { usedNames.add(name); return name }
  }
  return 'Player ' + (usedNames.size + 1)
}

function getPlantStage(score) {
  let stage = PLANT_STAGES[0]
  for (const s of PLANT_STAGES) {
    if (score >= s.threshold) stage = s
  }
  return stage
}

function transitionTo(currentEl, newEl) {
  const parent = currentEl.parentNode
  currentEl.classList.remove('active')
  currentEl.classList.add('exiting')
  currentEl.addEventListener('animationend', () => currentEl.remove(), { once: true })
  setTimeout(() => { if (currentEl.parentNode) currentEl.remove() }, 400)
  parent.appendChild(newEl)
  newEl.offsetHeight
  newEl.classList.add('active', 'entering')
  newEl.addEventListener('animationend', () => newEl.classList.remove('entering'), { once: true })
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen sw-intro'

  let playerCount = 1
  const usedNames = new Set()
  let players = [{ name: generateName(usedNames), color: PLAYER_COLORS[0] }]

  function renderNames() {
    const container = el.querySelector('#sw-names')
    if (!container) return
    container.innerHTML = players.map((p, i) => `
      <span class="sw-name-pill" style="background: ${p.color}">${p.name}</span>
    `).join('')
  }

  function updateCount(delta) {
    playerCount = Math.max(1, Math.min(4, playerCount + delta))
    while (players.length < playerCount) {
      players.push({ name: generateName(usedNames), color: PLAYER_COLORS[players.length] })
    }
    while (players.length > playerCount) {
      const removed = players.pop()
      usedNames.delete(removed.name)
    }
    const countEl = el.querySelector('#sw-count')
    if (countEl) countEl.textContent = playerCount
    renderNames()
  }

  el.innerHTML = `
    <div class="sw-intro-bg"></div>
    <div class="sw-intro-header">
      <button class="home-btn" id="sw-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="sw-intro-title">Spin the Soil Wheel</h2>
    </div>
    <div class="sw-intro-body">
      <div class="sw-intro-left">
        <div class="sw-speech-bubble">
          <span class="sw-speech-text" id="sw-intro-typing"></span>
        </div>
        <img class="sw-intro-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="Character">
      </div>
      <div class="sw-intro-right">
        <div class="sw-player-picker">
          <span class="sw-picker-label">Players</span>
          <div class="sw-picker-row">
            <button class="sw-picker-btn" id="sw-minus">−</button>
            <span class="sw-picker-count" id="sw-count">1</span>
            <button class="sw-picker-btn" id="sw-plus">+</button>
          </div>
          <div class="sw-player-names" id="sw-names"></div>
        </div>
        <button class="sw-start-btn" id="sw-start">Start!</button>
      </div>
    </div>
  `

  // Typing animation
  const typingEl = el.querySelector('#sw-intro-typing')
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

  el.querySelector('#sw-intro-home').addEventListener('pointerdown', () => {
    clearTimeout(typingTimer)
    navigate('game-select/meadow')
  })

  el.querySelector('#sw-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#sw-plus').addEventListener('pointerdown', () => updateCount(1))

  el.querySelector('#sw-start').addEventListener('pointerdown', () => {
    clearTimeout(typingTimer)
    transitionTo(el, createGameplayScreen(players))
  })

  // Initial render
  setTimeout(() => renderNames(), 0)

  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players) {
  const el = document.createElement('div')
  el.className = 'screen sw-game'

  const state = {
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: 0,
    phase: 'ready', // ready | spinning | choosing | answering | feedback | complete
    spunValue: null,
    forcedCategory: null, // set by Wild Card
    categoryQueues: {},
    categoryProgress: {},
    ang: 0,
    angVel: 0,
    spinFrame: null,
    feedbackTimeout: null,
    currentCatId: null,
    currentQuestion: null,
  }

  // Build per-category shuffled question queues
  CATEGORIES.forEach(cat => {
    state.categoryQueues[cat.id] = shuffleArray([...cat.questions])
    state.categoryProgress[cat.id] = { answered: 0, total: cat.questions.length }
  })

  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0)
  const isMultiplayer = state.players.length > 1

  // ── Build DOM ──

  el.innerHTML = `
    <div class="sw-game-bg"></div>
    <div class="sw-game-header">
      <button class="home-btn" id="sw-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="sw-game-title">Spin the Soil Wheel</h2>
      ${isMultiplayer ? `
        <div class="sw-turn-indicator" id="sw-turn">
          <span class="sw-turn-dot" id="sw-turn-dot"></span>
          <span class="sw-turn-name" id="sw-turn-name"></span>
        </div>
      ` : ''}
    </div>
    <div class="sw-game-body">
      <div class="sw-panel">
        <span class="sw-panel-heading">Categories</span>
        <div class="sw-categories-list" id="sw-categories">
          ${CATEGORIES.map((cat, i) => `
            <button class="sw-cat-item" data-cat="${cat.id}">
              <span class="sw-cat-num">${i + 1}</span>
              <span class="sw-cat-title">${cat.title}</span>
              <span class="sw-cat-count" id="sw-cat-count-${cat.id}">0/${cat.questions.length}</span>
            </button>
          `).join('')}
        </div>
        <div class="sw-panel-divider"></div>
        ${isMultiplayer ? `
          <span class="sw-panel-heading">Players</span>
          <div class="sw-players-list" id="sw-players">
            ${state.players.map((p, i) => `
              <div class="sw-player-card" data-player="${i}" id="sw-player-${i}">
                <span class="sw-player-dot" style="background: ${p.color}"></span>
                <span class="sw-player-name">${p.name}</span>
                <span class="sw-player-score" id="sw-pscore-${i}">0</span>
              </div>
            `).join('')}
          </div>
          <div class="sw-panel-divider"></div>
        ` : `
          <div class="sw-panel-score">
            <span class="sw-panel-score-label">Score</span>
            <span class="sw-panel-score-value" id="sw-pscore-0">0</span>
          </div>
          <div class="sw-panel-divider"></div>
        `}
        <button class="sw-quit-btn" id="sw-quit">Quit ✕</button>
      </div>
      <div class="sw-canvas-panel" id="sw-canvas-panel">
        <div class="sw-wheel-area" id="sw-wheel-area">
          <div class="sw-wheel-container" id="sw-wheel-wrap">
            <div class="sw-wheel-pointer"></div>
            <canvas id="sw-wheel-canvas"></canvas>
            <button class="sw-spin-btn" id="sw-spin-btn">SPIN!</button>
          </div>
          <div class="sw-spun-value" id="sw-spun-value"></div>
        </div>
        <div class="sw-question-area" id="sw-question-area" style="display:none">
          <p class="sw-question-text" id="sw-question"></p>
          <div class="sw-choices" id="sw-choices">
            <button class="sw-choice" data-idx="0"></button>
            <button class="sw-choice" data-idx="1"></button>
            <button class="sw-choice" data-idx="2"></button>
            <button class="sw-choice" data-idx="3"></button>
          </div>
        </div>
        <div class="sw-plants-bar" id="sw-plants-bar">
          ${state.players.map((p, i) => `
            <div class="sw-plant-slot" data-player="${i}">
              <img src="${PLANT_STAGES[0].asset}" alt="" class="sw-plant-img" id="sw-plant-${i}">
              <span class="sw-plant-name" style="color: ${p.color}">${p.name}</span>
              <span class="sw-plant-score" id="sw-plant-score-${i}">0</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `

  // ── DOM refs ──
  const canvas = el.querySelector('#sw-wheel-canvas')
  const ctx = canvas.getContext('2d')
  const spinBtn = el.querySelector('#sw-spin-btn')
  const spunValueEl = el.querySelector('#sw-spun-value')
  const wheelArea = el.querySelector('#sw-wheel-area')
  const questionArea = el.querySelector('#sw-question-area')
  const questionText = el.querySelector('#sw-question')
  const choiceButtons = el.querySelectorAll('.sw-choice')
  const canvasPanel = el.querySelector('#sw-canvas-panel')

  // ── Canvas DPR scaling for crisp rendering ──
  const WHEEL_CSS_SIZE = 420
  const dpr = window.devicePixelRatio || 1
  canvas.width = WHEEL_CSS_SIZE * dpr
  canvas.height = WHEEL_CSS_SIZE * dpr
  canvas.style.width = WHEEL_CSS_SIZE + 'px'
  canvas.style.height = WHEEL_CSS_SIZE + 'px'
  ctx.scale(dpr, dpr)

  // ── Wheel Drawing ──

  const sliceColors = WHEEL_SLICES.map(s => {
    if (s === 'steal') return '#ff6193'
    if (s === 'wild') return '#4ae4cf'
    return s <= 50 ? '#f2c8ec' : s <= 100 ? '#e496d7' : s <= 150 ? '#d07cc4' : s < 300 ? '#cf4db7' : '#a52186'
  })

  function drawWheel() {
    const cx = WHEEL_CSS_SIZE / 2, cy = WHEEL_CSS_SIZE / 2, r = WHEEL_CSS_SIZE / 2 - 10
    const sliceArc = TAU / WHEEL_SLICES.length

    ctx.clearRect(0, 0, WHEEL_CSS_SIZE, WHEEL_CSS_SIZE)

    for (let i = 0; i < WHEEL_SLICES.length; i++) {
      const startAngle = state.ang + i * sliceArc
      // Slice
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceArc)
      ctx.closePath()
      if (WHEEL_SLICES[i] === 'wild') {
        // Rainbow gradient for wild slice
        const midAngle = startAngle + sliceArc / 2
        const gx = cx + Math.cos(midAngle) * r * 0.5
        const gy = cy + Math.sin(midAngle) * r * 0.5
        const grad = ctx.createLinearGradient(cx, cy, gx * 2 - cx, gy * 2 - cy)
        grad.addColorStop(0, '#ff6b6b')
        grad.addColorStop(0.2, '#ffa94d')
        grad.addColorStop(0.4, '#ffe066')
        grad.addColorStop(0.6, '#69db7c')
        grad.addColorStop(0.8, '#74c0fc')
        grad.addColorStop(1, '#b197fc')
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = sliceColors[i]
      }
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + sliceArc / 2)
      ctx.fillStyle = '#3d2b1f'
      ctx.font = 'bold 22px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = WHEEL_SLICES[i] === 'steal' ? 'STEAL' : WHEEL_SLICES[i] === 'wild' ? 'WILD' : WHEEL_SLICES[i].toString()
      ctx.fillText(label, r * 0.62, 0)
      ctx.restore()
    }

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 38, 0, TAU)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#c06ab0'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // ── Spin ──

  function spinWheel() {
    state.phase = 'spinning'
    spinBtn.style.display = 'none'
    spunValueEl.textContent = ''
    state.angVel = 0.25 + Math.random() * 0.2

    function frame() {
      state.ang += state.angVel
      state.angVel *= 0.991

      drawWheel()

      if (state.angVel < 0.002) {
        onSpinComplete()
        return
      }
      state.spinFrame = requestAnimationFrame(frame)
    }
    state.spinFrame = requestAnimationFrame(frame)
  }

  function onSpinComplete() {
    // Pointer is at top (12 o'clock = -π/2 in canvas coords)
    // Slice i is drawn starting at (state.ang + i * sliceArc)
    // The pointer angle in wheel-space is -π/2 (top of canvas)
    // We need to find which slice covers the angle -π/2
    // Slice i covers [state.ang + i*sliceArc, state.ang + (i+1)*sliceArc]
    // So we solve: state.ang + i*sliceArc <= -π/2 + 2πk < state.ang + (i+1)*sliceArc
    // Rearranged: i = floor((-π/2 - state.ang) / sliceArc) mod numSlices
    const sliceArc = TAU / WHEEL_SLICES.length
    const pointerAngle = -Math.PI / 2
    const offset = ((pointerAngle - state.ang) % TAU + TAU) % TAU
    const sliceIdx = Math.floor(offset / sliceArc) % WHEEL_SLICES.length
    state.spunValue = WHEEL_SLICES[sliceIdx]

    // Show landed value + prompt to choose
    if (state.spunValue === 'steal') {
      spunValueEl.textContent = 'STEAL! — choose a category!'
      spunValueEl.style.color = '#ff6193'
    } else if (state.spunValue === 'wild') {
      spunValueEl.textContent = 'WILD CARD! — choose a category!'
      spunValueEl.style.color = '#4ae4cf'
    } else {
      spunValueEl.textContent = `${state.spunValue} pts — choose a category!`
      spunValueEl.style.color = '#c06ab0'
    }
    spunValueEl.classList.add('sw-value-pop')
    setTimeout(() => spunValueEl.classList.remove('sw-value-pop'), 400)

    // Check if all questions answered
    if (allQuestionsAnswered()) {
      let winnerIdx = 0
      state.players.forEach((p, i) => { if (p.score > state.players[winnerIdx].score) winnerIdx = i })
      setTimeout(() => celebrateWinner(winnerIdx, () => showCompletion()), 1000)
      return
    }

    // If forced category from Wild Card
    if (state.forcedCategory) {
      const catId = state.forcedCategory
      state.forcedCategory = null
      // If forced category is exhausted, fall through to normal choosing
      const prog = state.categoryProgress[catId]
      if (prog.answered < prog.total) {
        setTimeout(() => pickCategory(catId), 1200)
        return
      }
    }

    // Enter choosing phase
    state.phase = 'choosing'
    enableCategories()
  }

  // ── Categories ──

  function enableCategories() {
    el.querySelectorAll('.sw-cat-item').forEach(btn => {
      const catId = btn.dataset.cat
      const prog = state.categoryProgress[catId]
      if (prog.answered < prog.total) {
        btn.classList.add('sw-cat-choosable')
      }
    })
  }

  function disableCategories() {
    el.querySelectorAll('.sw-cat-item').forEach(btn => {
      btn.classList.remove('sw-cat-choosable')
    })
  }

  function updateCategoryDisplay() {
    CATEGORIES.forEach(cat => {
      const countEl = el.querySelector(`#sw-cat-count-${cat.id}`)
      const prog = state.categoryProgress[cat.id]
      if (countEl) countEl.textContent = `${prog.answered}/${prog.total}`
      const btn = el.querySelector(`.sw-cat-item[data-cat="${cat.id}"]`)
      if (btn) {
        btn.classList.toggle('sw-cat-done', prog.answered >= prog.total)
      }
    })
  }

  function pickCategory(catId) {
    state.phase = 'answering'
    state.currentCatId = catId
    disableCategories()

    const queue = state.categoryQueues[catId]
    state.currentQuestion = queue.shift()
    if (!state.currentQuestion) {
      // Category exhausted mid-pick — go back to choosing
      state.phase = 'choosing'
      enableCategories()
      return
    }

    showQuestionView()
  }

  // ── Question ──

  function showQuestionView() {
    wheelArea.style.display = 'none'
    questionArea.style.display = 'flex'

    const q = state.currentQuestion
    questionText.textContent = q.text

    // Shuffle choices
    const indices = [0, 1, 2, 3]
    shuffleArray(indices)
    const correctShuffledIdx = indices.indexOf(q.correct)
    choiceButtons.forEach((btn, i) => {
      btn.textContent = q.choices[indices[i]]
      btn.classList.remove('sw-correct', 'sw-wrong')
      btn.disabled = false
    })
    questionArea.dataset.correctBtn = correctShuffledIdx
  }

  function showWheelView() {
    questionArea.style.display = 'none'
    wheelArea.style.display = 'flex'
    spinBtn.style.display = ''
    spunValueEl.textContent = 'Spin!'
    spunValueEl.style.color = '#c06ab0'
  }

  function handleAnswer(btnIdx) {
    if (state.phase !== 'answering') return
    state.phase = 'feedback'

    const correctBtn = parseInt(questionArea.dataset.correctBtn)
    const isCorrect = btnIdx === correctBtn

    choiceButtons.forEach(btn => btn.disabled = true)
    if (isCorrect) {
      choiceButtons[btnIdx].classList.add('sw-correct')
      applyScore()
    } else {
      choiceButtons[btnIdx].classList.add('sw-wrong')
      choiceButtons[correctBtn].classList.add('sw-correct')
    }

    // Update category progress
    state.categoryProgress[state.currentCatId].answered++
    updateCategoryDisplay()

    // Show special effect popup for steal/wild on correct answer
    let specialMsg = null
    if (isCorrect && state.spunValue === 'steal') {
      if (isMultiplayer) {
        // Find who was stolen from
        let target = null, maxScore = -1
        state.players.forEach((op, i) => {
          if (i !== state.currentPlayer && op.score > maxScore) { maxScore = op.score; target = i }
        })
        if (target !== null && maxScore >= 50) {
          specialMsg = `Stole 50 pts from ${state.players[target].name}!`
        } else {
          specialMsg = '+100 pts — no one to steal from!'
        }
      } else {
        specialMsg = 'Steal bonus! +150 pts!'
      }
    } else if (isCorrect && state.spunValue === 'wild') {
      if (isMultiplayer) {
        specialMsg = '+350 pts — now pick a category for the next player!'
      } else {
        specialMsg = 'Wild Card bonus! +350 pts!'
      }
    }

    if (specialMsg) {
      showSpecialPopup(specialMsg, state.spunValue)
    }

    const delay = isCorrect ? (specialMsg ? 2200 : 800) : 1200
    state.feedbackTimeout = setTimeout(() => {
      // Check win
      if (isMultiplayer && state.players[state.currentPlayer].score >= WIN_THRESHOLD) {
        celebrateWinner(state.currentPlayer, () => showCompletion())
        return
      }
      if (allQuestionsAnswered()) {
        // Find highest scorer for celebration
        let winnerIdx = 0
        state.players.forEach((p, i) => { if (p.score > state.players[winnerIdx].score) winnerIdx = i })
        celebrateWinner(winnerIdx, () => showCompletion())
        return
      }

      // Handle Wild Card: if correct on wild, force next player's category
      if (isCorrect && state.spunValue === 'wild' && isMultiplayer) {
        // Enter choosing phase for current player to pick NEXT player's category
        state.phase = 'choosing-for-opponent'
        showWheelView()
        spunValueEl.textContent = "Pick next player's category!"
        spunValueEl.style.color = '#e4c84a'
        enableCategories()
        return
      }

      advanceTurn()
    }, delay)
  }

  function applyScore() {
    const p = state.players[state.currentPlayer]
    if (state.spunValue === 'steal') {
      p.score += 100
      if (isMultiplayer) {
        // Steal 50 from highest-scoring opponent
        let target = null
        let maxScore = -1
        state.players.forEach((op, i) => {
          if (i !== state.currentPlayer && op.score > maxScore) {
            maxScore = op.score
            target = i
          }
        })
        if (target !== null && state.players[target].score >= 50) {
          state.players[target].score -= 50
          p.score += 50
        }
      } else {
        p.score += 50 // single player: just 150 total
      }
    } else if (state.spunValue === 'wild') {
      p.score += 200 + 150 // wild = 200 base + 150 bonus
    } else {
      p.score += state.spunValue
    }
    updateAllScores()
    updatePlantGrowth()
  }

  function showSpecialPopup(msg, type) {
    const popup = document.createElement('div')
    popup.className = 'sw-special-popup'
    const color = type === 'steal' ? '#ff6193' : '#4ae4cf'
    const icon = type === 'steal' ? '🔄' : '🌈'
    popup.innerHTML = `
      <div class="sw-special-popup-content" style="border-color: ${color}">
        <span class="sw-special-popup-icon">${icon}</span>
        <span class="sw-special-popup-msg">${msg}</span>
      </div>
    `
    canvasPanel.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('sw-special-popup-show'))
    setTimeout(() => {
      popup.classList.remove('sw-special-popup-show')
      setTimeout(() => popup.remove(), 300)
    }, 1800)
  }

  // ── Win Celebration ──

  function celebrateWinner(playerIdx, onDone) {
    // Switch to wheel view so plants are visible
    showWheelView()
    spunValueEl.textContent = ''

    // Swap winner's plant to fruit gif
    const plantImg = el.querySelector(`#sw-plant-${playerIdx}`)
    if (plantImg) {
      plantImg.src = '/assets/gifs/fruit-gif.gif'
      plantImg.classList.add('sw-plant-grow')
      setTimeout(() => plantImg.classList.remove('sw-plant-grow'), 500)
    }

    // Spawn particles around the winner's plant
    const plantSlot = el.querySelector(`.sw-plant-slot[data-player="${playerIdx}"]`)
    if (plantSlot) {
      const rect = plantSlot.getBoundingClientRect()
      const panelRect = canvasPanel.getBoundingClientRect()
      const cx = rect.left - panelRect.left + rect.width / 2
      const cy = rect.top - panelRect.top + rect.height / 2
      spawnWinParticles(cx, cy)
    }

    // Delay then show completion
    setTimeout(onDone, 4000)
  }

  function spawnWinParticles(x, y) {
    const count = 18
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      particle.className = 'sw-win-particle'
      const angle = (TAU * i) / count + (Math.random() - 0.5) * 0.6
      const dist = 40 + Math.random() * 80
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist
      particle.style.setProperty('--dx', dx + 'px')
      particle.style.setProperty('--dy', dy + 'px')
      const hue = Math.round(Math.random() * 359)
      particle.style.backgroundColor = `hsl(${hue} 100% 70%)`
      particle.style.left = x + 'px'
      particle.style.top = y + 'px'
      canvasPanel.appendChild(particle)
      particle.addEventListener('animationend', () => particle.remove())
    }
  }

  // ── Scores & Plants ──

  function updateAllScores() {
    state.players.forEach((p, i) => {
      const scoreEl = el.querySelector(`#sw-pscore-${i}`)
      if (scoreEl) scoreEl.textContent = p.score
      const plantScoreEl = el.querySelector(`#sw-plant-score-${i}`)
      if (plantScoreEl) plantScoreEl.textContent = p.score
    })
  }

  function updatePlantGrowth() {
    state.players.forEach((p, i) => {
      const plantImg = el.querySelector(`#sw-plant-${i}`)
      if (!plantImg) return
      const stage = getPlantStage(p.score)
      if (!plantImg.src.endsWith(stage.asset)) {
        plantImg.src = stage.asset
        plantImg.classList.add('sw-plant-grow')
        setTimeout(() => plantImg.classList.remove('sw-plant-grow'), 500)
      }
    })
  }

  // ── Turn Management ──

  function advanceTurn() {
    if (isMultiplayer) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length
    }
    updateTurnDisplay()
    showWheelView()

    if (isMultiplayer) {
      showTurnPopup(() => { state.phase = 'ready' })
    } else {
      state.phase = 'ready'
    }
  }

  function showTurnPopup(onDone) {
    const p = state.players[state.currentPlayer]
    const popup = document.createElement('div')
    popup.className = 'sw-turn-popup'
    popup.innerHTML = `
      <div class="sw-turn-popup-content">
        <span class="sw-turn-popup-dot" style="background: ${p.color}"></span>
        <span class="sw-turn-popup-name">${p.name}'s Turn!</span>
      </div>
    `
    canvasPanel.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('sw-turn-popup-show'))
    setTimeout(() => {
      popup.classList.remove('sw-turn-popup-show')
      setTimeout(() => { popup.remove(); onDone() }, 300)
    }, 1200)
  }

  function updateTurnDisplay() {
    const p = state.players[state.currentPlayer]

    // Header turn indicator
    if (isMultiplayer) {
      const dot = el.querySelector('#sw-turn-dot')
      const name = el.querySelector('#sw-turn-name')
      if (dot) dot.style.background = p.color
      if (name) name.textContent = `${p.name}'s Turn`
    }

    // Canvas panel border color
    if (isMultiplayer) {
      canvasPanel.style.borderColor = p.color
    }

    // Highlight current player in sidebar
    el.querySelectorAll('.sw-player-card').forEach((card, i) => {
      card.classList.toggle('sw-player-current', i === state.currentPlayer)
    })
  }

  // ── Game State Checks ──

  function allQuestionsAnswered() {
    return Object.values(state.categoryProgress).every(cp => cp.answered >= cp.total)
  }

  // ── Completion ──

  function showCompletion(fromQuit = false) {
    cancelAnimationFrame(state.spinFrame)
    clearTimeout(state.feedbackTimeout)

    let heading, detail
    if (fromQuit) {
      heading = 'Results'
    } else if (isMultiplayer) {
      const winner = [...state.players].sort((a, b) => b.score - a.score)[0]
      heading = `${winner.name} Wins!`
    } else {
      heading = 'Great Job!'
    }

    const scoreList = state.players.map(p =>
      `${p.name}: ${p.score} pts`
    ).join('<br>')

    const totalAnswered = Object.values(state.categoryProgress)
      .reduce((sum, cp) => sum + cp.answered, 0)

    detail = fromQuit
      ? `${totalAnswered}/${totalQuestions} Questions Answered`
      : INSTRUCTIONS.completion

    const overlay = document.createElement('div')
    overlay.className = 'sw-completion-overlay'
    overlay.innerHTML = `
      <div class="sw-completion-content">
        <div class="sw-completion-bubble">
          <span class="sw-completion-text">
            ${heading}<br><br>
            ${detail}<br><br>
            ${scoreList}
          </span>
        </div>
        <div class="sw-completion-bubble-tail"></div>
        <img class="sw-completion-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        <div class="sw-completion-buttons">
          <button class="sw-completion-btn sw-completion-btn-primary" id="sw-play-again">Play Again</button>
          <button class="sw-completion-btn" id="sw-go-home">Home</button>
        </div>
      </div>
    `

    canvasPanel.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('sw-show'))

    overlay.querySelector('#sw-play-again').addEventListener('pointerdown', () => {
      cancelAnimationFrame(state.spinFrame)
      transitionTo(el, createIntroScreen())
    })
    overlay.querySelector('#sw-go-home').addEventListener('pointerdown', () => {
      cancelAnimationFrame(state.spinFrame)
      navigate('game-select/meadow')
    })
  }

  // ── Event Bindings ──

  el.querySelector('#sw-game-home').addEventListener('pointerdown', () => {
    cancelAnimationFrame(state.spinFrame)
    clearTimeout(state.feedbackTimeout)
    navigate('game-select/meadow')
  })

  spinBtn.addEventListener('pointerdown', () => {
    if (state.phase !== 'ready') return
    spinWheel()
  })

  el.querySelectorAll('.sw-cat-item').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      const catId = btn.dataset.cat
      if (state.phase === 'choosing-for-opponent') {
        // Wild Card: force next player's category
        const prog = state.categoryProgress[catId]
        if (prog.answered >= prog.total) return
        disableCategories()
        state.forcedCategory = catId
        spunValueEl.textContent = ''
        advanceTurn()
        return
      }
      if (state.phase !== 'choosing') return
      if (!btn.classList.contains('sw-cat-choosable')) return
      pickCategory(catId)
    })
  })

  choiceButtons.forEach((btn, i) => {
    btn.addEventListener('pointerdown', () => handleAnswer(i))
  })

  el.querySelector('#sw-quit').addEventListener('pointerdown', () => {
    cancelAnimationFrame(state.spinFrame)
    clearTimeout(state.feedbackTimeout)
    showCompletion(true)
  })

  // ── Initialize ──

  updateCategoryDisplay()
  updateTurnDisplay()
  drawWheel()

  // Show initial turn popup after transition
  if (isMultiplayer) {
    setTimeout(() => {
      showTurnPopup(() => { state.phase = 'ready' })
    }, 400)
  }

  return el
}

// ─── EXPORT ───

export function createSpinWheelGame() {
  return createIntroScreen()
}
