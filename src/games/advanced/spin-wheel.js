/**
 * Advanced Spin the Wheel
 * Dark-themed, no pixel art, multiplayer (1-4 players).
 * Spin wheel → pick category → answer question → score points.
 */

import { navigate } from '../../router.js'
import {
  CATEGORIES, WHEEL_SLICES, WIN_THRESHOLD,
  PLAYER_COLORS, INSTRUCTIONS, IMPACT_MESSAGES, RULES,
} from '../../data/content/advanced/spin-wheel.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { createLeaderboardButton } from '../../utils/leaderboard-modal.js'
import { renderTeamPlayerRows } from '../../utils/team-input.js'
import { recordScores } from '../../utils/leaderboard-api.js'
import { getScoreEventId } from '../../screens/advanced-play-mode.js'
import { typewriter } from '../../utils/typewriter.js'
import { shuffleArray, transitionTo } from '../../utils/game-helpers.js'
import { trackGameStart, trackGameComplete, trackGameQuit, trackTopicSelect } from '../../utils/analytics.js'

function genRunId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

const TAU = 2 * Math.PI

// ─── HELPERS ───

const BURST_COLORS = ['#38cebc', '#b8e84a', '#ff71ce', '#01cdfe', '#b967ff']

function spawnBurstParticles(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'adv-burst-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 70
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = BURST_COLORS[i % BURST_COLORS.length]
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    container.appendChild(p)
    p.addEventListener('animationend', () => p.remove())
  }
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-sw-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0], teamId: null, teamName: '', teamStatus: null }]

  function renderNames() {
    const container = el.querySelector('#adv-sw-names')
    if (!container) return
    renderTeamPlayerRows(container, players)
  }

  function updateCount(delta) {
    playerCount = Math.max(1, Math.min(4, playerCount + delta))
    while (players.length < playerCount) {
      players.push({ name: `Player ${players.length + 1}`, color: PLAYER_COLORS[players.length], teamId: null, teamName: '', teamStatus: null })
    }
    while (players.length > playerCount) players.pop()
    const countEl = el.querySelector('#adv-sw-count')
    if (countEl) countEl.textContent = playerCount
    renderNames()
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-sw-back">← Back</button>
        <h1 class="adv-sw-intro-title">Spin the Wheel</h1>
      </div>

      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>

      <div class="adv-sw-player-setup">
        <span class="adv-sw-setup-label">Players</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-sw-minus">−</button>
          <span class="adv-sw-picker-count" id="adv-sw-count">1</span>
          <button class="adv-sw-picker-btn" id="adv-sw-plus">+</button>
        </div>
        <div class="adv-sw-names" id="adv-sw-names"></div>
      </div>

      <button class="adv-sw-start-btn" id="adv-sw-start">Start Game</button>
    </div>
  `

  addGradientBackground(el, 'spin-wheel')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Spin the Wheel', RULES))
  introTopbar.appendChild(createLeaderboardButton())
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-sw-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-sw-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-sw-plus').addEventListener('pointerdown', () => updateCount(1))
  el.querySelector('#adv-sw-start').addEventListener('pointerdown', () => {
    trackGameStart('adv-spin-wheel', 'advanced', { playerCount: players.length })
    trackTopicSelect('adv-spin-wheel', CATEGORIES.map(c => c.title))
    transitionTo(el, createGameplayScreen(players))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players) {
  const el = document.createElement('div')
  el.className = 'screen adv-sw-game'

  const state = {
    runId: genRunId(),
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    phase: 'ready', // ready | spinning | choosing | answering | feedback | choosing-for-opponent | complete
    spunValue: null,
    forcedCategory: null,
    categoryQueues: {},
    categoryProgress: {},
    ang: 0,
    angVel: 0,
    spinFrame: null,
    feedbackTimeout: null,
    currentCatId: null,
    currentQuestion: null,
    missedQuestions: [],
  }

  CATEGORIES.forEach(cat => {
    state.categoryQueues[cat.id] = shuffleArray([...cat.questions])
    state.categoryProgress[cat.id] = { answered: 0, total: cat.questions.length }
  })

  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0)
  const isMultiplayer = state.players.length > 1

  // ── Build DOM ──

  el.innerHTML = `
    <div class="adv-sw-topbar">
      <button class="adv-game-topbar-btn" id="adv-sw-home">← Back</button>
      <h2 class="adv-sw-game-title">Spin the Wheel</h2>
      ${isMultiplayer ? `
        <div class="adv-sw-turn-indicator" id="adv-sw-turn">
          <span class="adv-sw-turn-dot" id="adv-sw-turn-dot"></span>
          <span class="adv-sw-turn-name" id="adv-sw-turn-name"></span>
        </div>
      ` : ''}
    </div>

    <div class="adv-sw-body">
      <div class="adv-sw-sidebar">
        <span class="adv-sw-sidebar-heading">Categories</span>
        <div class="adv-sw-categories" id="adv-sw-categories">
          ${CATEGORIES.map(cat => `
            <button class="adv-sw-cat-btn" data-cat="${cat.id}">
              <span class="adv-sw-cat-title">${cat.title}</span>
              <span class="adv-sw-cat-count" id="adv-sw-cat-${cat.id}">0/${cat.questions.length}</span>
            </button>
          `).join('')}
        </div>

        <div class="adv-sw-sidebar-divider"></div>

        ${isMultiplayer ? `
          <span class="adv-sw-sidebar-heading">Scores</span>
          <div class="adv-sw-players" id="adv-sw-players">
            ${state.players.map((p, i) => `
              <div class="adv-sw-player-row" data-player="${i}" id="adv-sw-player-${i}">
                <span class="adv-sw-player-dot" style="background: ${p.color}"></span>
                <span class="adv-sw-player-name">${p.name}</span>
                <span class="adv-sw-player-score" id="adv-sw-pscore-${i}">0</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="adv-sw-solo-score">
            <span class="adv-sw-solo-label">Score</span>
            <span class="adv-sw-solo-value" id="adv-sw-pscore-0">0</span>
          </div>
        `}

        <div class="adv-sw-sidebar-divider"></div>
        <button class="adv-sw-quit-btn" id="adv-sw-quit">Quit</button>
      </div>

      <div class="adv-sw-main" id="adv-sw-main">
        <div class="adv-sw-wheel-area" id="adv-sw-wheel-area">
          <div class="adv-sw-wheel-wrap">
            <div class="adv-sw-wheel-pointer">▼</div>
            <canvas id="adv-sw-canvas"></canvas>
            <button class="adv-sw-spin-btn" id="adv-sw-spin">SPIN</button>
          </div>
          <div class="adv-sw-spun-value" id="adv-sw-spun-value">Spin the wheel!</div>
        </div>

        <div class="adv-sw-question-area" id="adv-sw-question-area" style="display:none">
          <p class="adv-sw-question-text" id="adv-sw-question"></p>
          <div class="adv-sw-choices" id="adv-sw-choices"></div>
        </div>
      </div>
    </div>
  `

  addGradientBackground(el, 'spin-wheel')
  const swTopbar = el.querySelector('.adv-sw-topbar')
  swTopbar.appendChild(createHelpButton('Spin the Wheel', RULES))
  swTopbar.appendChild(createLeaderboardButton())
  swTopbar.appendChild(createThemeToggle())

  // ── DOM refs ──
  const canvas = el.querySelector('#adv-sw-canvas')
  const ctx = canvas.getContext('2d')
  const spinBtn = el.querySelector('#adv-sw-spin')
  const spunValueEl = el.querySelector('#adv-sw-spun-value')
  const wheelArea = el.querySelector('#adv-sw-wheel-area')
  const questionArea = el.querySelector('#adv-sw-question-area')
  const questionText = el.querySelector('#adv-sw-question')
  const choicesContainer = el.querySelector('#adv-sw-choices')
  const mainPanel = el.querySelector('#adv-sw-main')

  // ── Canvas DPR scaling ──
  const WHEEL_CSS_SIZE = 420
  const dpr = window.devicePixelRatio || 1
  canvas.width = WHEEL_CSS_SIZE * dpr
  canvas.height = WHEEL_CSS_SIZE * dpr
  canvas.style.width = WHEEL_CSS_SIZE + 'px'
  canvas.style.height = WHEEL_CSS_SIZE + 'px'
  ctx.scale(dpr, dpr)

  // ── Wheel Drawing ──

  function getSliceColors() {
    const isLight = document.getElementById('app')?.dataset.theme === 'light'
    return WHEEL_SLICES.map(s => {
      if (s === 'steal') return '#ff61ff8f'
      if (s === 'wild') return '#4ae4cfb4'
      if (isLight) {
        return s <= 100 ? '#b0f1ea' : s <= 200 ? '#a8dcd6' : s <= 300 ? '#b5ddb5' : s <= 400 ? '#cde89a' : '#dff080d7'
      }
      return s <= 100 ? '#1e3a5f' : s <= 200 ? '#1a4a4a' : s <= 300 ? '#2a4a3a' : s <= 400 ? '#3a5a2a' : '#4a6a1a'
    })
  }

  function drawWheel() {
    const cx = WHEEL_CSS_SIZE / 2, cy = WHEEL_CSS_SIZE / 2, r = WHEEL_CSS_SIZE / 2 - 10
    const sliceArc = TAU / WHEEL_SLICES.length
    const isLight = document.getElementById('app')?.dataset.theme === 'light'
    const sliceColors = getSliceColors()

    ctx.clearRect(0, 0, WHEEL_CSS_SIZE, WHEEL_CSS_SIZE)

    for (let i = 0; i < WHEEL_SLICES.length; i++) {
      const startAngle = state.ang + i * sliceArc

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceArc)
      ctx.closePath()

      if (WHEEL_SLICES[i] === 'wild') {
        const midAngle = startAngle + sliceArc / 2
        const gx = cx + Math.cos(midAngle) * r * 0.5
        const gy = cy + Math.sin(midAngle) * r * 0.5
        const grad = ctx.createLinearGradient(cx, cy, gx * 2 - cx, gy * 2 - cy)
        grad.addColorStop(0, '#38cebda5')
        grad.addColorStop(0.33, '#f0e4629c') 
        grad.addColorStop(0.66, '#ffa528a2')
        grad.addColorStop(1, '#ff61ff8f')
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = sliceColors[i]
      }
      ctx.fill()
      ctx.strokeStyle = isLight ? 'rgba(0, 80, 70, 0.3)' : 'rgba(56, 206, 188, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + sliceArc / 2)
      ctx.fillStyle = isLight ? '#1a2a2e' : '#e0e0e0'
      ctx.font = 'bold 18px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = WHEEL_SLICES[i] === 'steal' ? 'STEAL' : WHEEL_SLICES[i] === 'wild' ? 'WILD' : WHEEL_SLICES[i].toString()
      ctx.fillText(label, r * 0.62, 0)
      ctx.restore()
    }

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 38, 0, TAU)
    ctx.fillStyle = isLight ? '#e8edf3' : '#0a0a14'
    ctx.fill()
    ctx.strokeStyle = isLight ? '#1a9e8f' : '#38cebc'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Redraw wheel when theme changes (stored ref for cleanup)
  const onThemeChange = () => drawWheel()
  window.addEventListener('theme-change', onThemeChange)

  // ── Spin ──

  function spinWheel() {
    state.phase = 'spinning'
    spinBtn.style.display = 'none'
    spunValueEl.textContent = ''
    state.angVel = 0.35 + Math.random() * 0.15

    function frame() {
      state.ang += state.angVel
      state.angVel *= 0.96
      drawWheel()

      if (state.angVel < 0.003) {
        onSpinComplete()
        return
      }
      state.spinFrame = requestAnimationFrame(frame)
    }
    state.spinFrame = requestAnimationFrame(frame)
  }

  function onSpinComplete() {
    const sliceArc = TAU / WHEEL_SLICES.length
    const pointerAngle = -Math.PI / 2
    const offset = ((pointerAngle - state.ang) % TAU + TAU) % TAU
    const sliceIdx = Math.floor(offset / sliceArc) % WHEEL_SLICES.length
    state.spunValue = WHEEL_SLICES[sliceIdx]

    if (state.spunValue === 'steal') {
      spunValueEl.textContent = 'STEAL! — Choose a category'
      spunValueEl.style.color = '#e84ae5'
    } else if (state.spunValue === 'wild') {
      spunValueEl.textContent = 'WILD CARD! — Choose a category'
      spunValueEl.style.color = '#e84ae5'
    } else {
      spunValueEl.textContent = `${state.spunValue} pts — Choose a category`
      spunValueEl.style.color = '#38cebc'
    }

    if (allQuestionsAnswered()) {
      let winnerIdx = 0
      state.players.forEach((p, i) => { if (p.score > state.players[winnerIdx].score) winnerIdx = i })
      setTimeout(() => showCompletion(), 1000)
      return
    }

    if (state.forcedCategory) {
      const catId = state.forcedCategory
      state.forcedCategory = null
      const prog = state.categoryProgress[catId]
      if (prog.answered < prog.total) {
        setTimeout(() => pickCategory(catId), 1200)
        return
      }
    }

    state.phase = 'choosing'
    enableCategories()
  }

  // ── Categories ──

  function enableCategories() {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      const catId = btn.dataset.cat
      const prog = state.categoryProgress[catId]
      if (prog.answered < prog.total) {
        btn.classList.add('adv-sw-cat-choosable')
      }
    })
  }

  function disableCategories() {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      btn.classList.remove('adv-sw-cat-choosable')
    })
  }

  function updateCategoryDisplay() {
    CATEGORIES.forEach(cat => {
      const countEl = el.querySelector(`#adv-sw-cat-${cat.id}`)
      const prog = state.categoryProgress[cat.id]
      if (countEl) countEl.textContent = `${prog.answered}/${prog.total}`
      const btn = el.querySelector(`.adv-sw-cat-btn[data-cat="${cat.id}"]`)
      if (btn) btn.classList.toggle('adv-sw-cat-done', prog.answered >= prog.total)
    })
  }

  function highlightCategory(catId) {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      btn.classList.toggle('adv-sw-cat-active', btn.dataset.cat === catId)
    })
  }

  function clearCategoryHighlight() {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      btn.classList.remove('adv-sw-cat-active')
    })
  }

  function pickCategory(catId) {
    state.phase = 'answering'
    state.currentCatId = catId
    disableCategories()
    highlightCategory(catId)

    const queue = state.categoryQueues[catId]
    state.currentQuestion = queue.shift()
    if (!state.currentQuestion) {
      state.phase = 'choosing'
      enableCategories()
      return
    }

    showQuestionView()
  }

  // ── Question View ──

  function showQuestionView() {
    wheelArea.style.display = 'none'
    questionArea.style.display = 'flex'

    const q = state.currentQuestion
    questionText.textContent = q.text

    const indices = []
    for (let i = 0; i < q.choices.length; i++) indices.push(i)
    shuffleArray(indices)
    const correctShuffledIdx = indices.indexOf(q.correct)

    choicesContainer.innerHTML = indices.map((origIdx, btnIdx) => `
      <button class="adv-sw-choice" data-idx="${btnIdx}">${q.choices[origIdx]}</button>
    `).join('')

    questionArea.dataset.correctBtn = correctShuffledIdx

    choicesContainer.querySelectorAll('.adv-sw-choice').forEach(btn => {
      btn.addEventListener('pointerdown', () => handleAnswer(parseInt(btn.dataset.idx)))
    })
  }

  function showWheelView() {
    questionArea.style.display = 'none'
    wheelArea.style.display = 'flex'
    spinBtn.style.display = ''
    spunValueEl.textContent = 'Spin the wheel!'
    spunValueEl.style.color = '#38cebc'
  }

  function handleAnswer(btnIdx) {
    if (state.phase !== 'answering') return
    state.phase = 'feedback'

    const correctBtn = parseInt(questionArea.dataset.correctBtn)
    const isCorrect = btnIdx === correctBtn

    const buttons = choicesContainer.querySelectorAll('.adv-sw-choice')
    buttons.forEach(btn => btn.style.pointerEvents = 'none')

    if (isCorrect) {
      buttons[btnIdx].classList.add('adv-sw-correct')
      applyScore()
    } else {
      buttons[btnIdx].classList.add('adv-sw-wrong')
      buttons[correctBtn].classList.add('adv-sw-correct')
      const q = state.currentQuestion
      if (q) {
        state.missedQuestions.push({
          question: q.text,
          correctAnswer: q.choices[q.correct],
          category: CATEGORIES.find(c => c.id === state.currentCatId)?.title || '',
        })
      }
    }

    state.categoryProgress[state.currentCatId].answered++
    updateCategoryDisplay()

    // Check if this category was just completed
    const catJustCompleted = state.categoryProgress[state.currentCatId].answered >= state.categoryProgress[state.currentCatId].total
    const completedCatId = state.currentCatId

    // Special popup for steal/wild
    let specialMsg = null
    if (isCorrect && state.spunValue === 'steal') {
      // Steal popup message — actual steal target is chosen via picker after this
      if (isMultiplayer) {
        specialMsg = 'STEAL! Choose a player to steal 100 pts from!'
      } else {
        specialMsg = 'Steal bonus! +150 pts!'
      }
    } else if (isCorrect && state.spunValue === 'wild') {
      const doubled = state.players[state.currentPlayer].score
      if (isMultiplayer) {
        specialMsg = `Score doubled to ${doubled}! Pick a category for the next player!`
      } else {
        specialMsg = `Wild Card! Score doubled to ${doubled}!`
      }
    }

    if (specialMsg) showSpecialPopup(specialMsg, state.spunValue)

    const delay = isCorrect ? (specialMsg ? 2800 : 2000) : 2800
    state.feedbackTimeout = setTimeout(() => {
      if (isMultiplayer && state.players[state.currentPlayer].score >= WIN_THRESHOLD) {
        showCompletion(false, true)
        return
      }
      if (allQuestionsAnswered()) {
        showCompletion()
        return
      }
      // Steal: let player choose who to steal from
      if (isCorrect && state.spunValue === 'steal' && isMultiplayer) {
        showStealPicker()
        return
      }
      // Wild: pick category for next player
      if (isCorrect && state.spunValue === 'wild' && isMultiplayer) {
        state.phase = 'choosing-for-opponent'
        showWheelView()
        spunValueEl.textContent = "Pick next player's category!"
        spunValueEl.style.color = '#e84ae5'
        enableCategories()
        return
      }
      // Show impact if category just completed
      if (catJustCompleted && IMPACT_MESSAGES[completedCatId]) {
        showCategoryImpact(completedCatId, () => advanceTurn())
      } else {
        advanceTurn()
      }
    }, delay)
  }

  function applyScore() {
    const p = state.players[state.currentPlayer]
    if (state.spunValue === 'steal') {
      // Points applied after steal target is chosen (or immediately in solo)
      if (!isMultiplayer) {
        p.score += 150
      }
      // In multiplayer, score transfer happens in showStealPicker
    } else if (state.spunValue === 'wild') {
      p.score = p.score * 2
    } else {
      p.score += state.spunValue
    }
    updateAllScores()
  }

  function showSpecialPopup(msg) {
    const popup = document.createElement('div')
    popup.className = 'adv-sw-special-popup'
    const color = '#e84ae5'
    popup.innerHTML = `
      <div class="adv-sw-special-content" style="border-color: ${color}; color: ${color}">
        ${msg}
      </div>
    `
    mainPanel.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => popup.remove(), 300)
    }, 1800)
  }

  function showStealPicker() {
    state.phase = 'stealing'
    const opponents = state.players
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => p.idx !== state.currentPlayer)

    const popup = document.createElement('div')
    popup.className = 'adv-sw-special-popup'
    popup.innerHTML = `
      <div class="adv-sw-special-content" style="border-color: #e84ae5; color: #e84ae5; flex-direction: column; gap: 24px;">
        <span style="font-size: 1.2rem; font-weight: bold;">Steal 100 pts from...</span>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-top: 8px;">
          ${opponents.map(op => `
            <button class="adv-sw-steal-target" data-idx="${op.idx}" style="
              padding: 14px 28px; border: 2px solid ${op.color}; border-radius: 10px;
              background: rgba(0,0,0,0.4); color: ${op.color}; font-family: var(--font-body), monospace;
              font-size: 1rem; cursor: pointer; min-width: 130px; text-shadow: 0 0 8px ${op.color};
            ">${op.name} (${op.score} pts)</button>
          `).join('')}
        </div>
      </div>
    `
    mainPanel.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))

    popup.querySelectorAll('.adv-sw-steal-target').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const targetIdx = parseInt(btn.dataset.idx)
        const stolen = Math.min(100, state.players[targetIdx].score)
        state.players[targetIdx].score -= stolen
        state.players[state.currentPlayer].score += stolen
        updateAllScores()

        popup.classList.remove('adv-sw-popup-show')
        setTimeout(() => {
          popup.remove()
          showSpecialPopup(`Stole ${stolen} pts from ${state.players[targetIdx].name}!`, 'steal')
          setTimeout(() => advanceTurn(), 1800)
        }, 300)
      })
    })
  }

  // ── Scores ──

  function updateAllScores() {
    state.players.forEach((p, i) => {
      const scoreEl = el.querySelector(`#adv-sw-pscore-${i}`)
      if (scoreEl) scoreEl.textContent = p.score
    })
  }

  // ── Turn Management ──

  function advanceTurn() {
    clearCategoryHighlight()
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

  function showTurnPopup(onDone, text) {
    const p = state.players[state.currentPlayer]
    const popup = document.createElement('div')
    popup.className = 'adv-sw-turn-popup'
    popup.innerHTML = `
      <div class="adv-sw-turn-content">
        <span class="adv-sw-turn-popup-dot" style="background: ${p.color}"></span>
        <span>${text || `${p.name}'s Turn`}</span>
      </div>
    `
    mainPanel.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => { popup.remove(); onDone() }, 300)
    }, 1500)
  }

  function updateTurnDisplay() {
    if (isMultiplayer) {
      const p = state.players[state.currentPlayer]
      const dot = el.querySelector('#adv-sw-turn-dot')
      const name = el.querySelector('#adv-sw-turn-name')
      if (dot) dot.style.background = p.color
      if (name) name.textContent = `${p.name}'s Turn`

      el.querySelectorAll('.adv-sw-player-row').forEach((row, i) => {
        row.classList.toggle('adv-sw-player-active', i === state.currentPlayer)
      })
    }
  }

  // ── Game State ──

  function allQuestionsAnswered() {
    return Object.values(state.categoryProgress).every(cp => cp.answered >= cp.total)
  }

  // ── Impact Overlay ──

  function showCategoryImpact(catId, onDone) {
    const msg = IMPACT_MESSAGES[catId]
    if (!msg) { onDone(); return }
    const catTitle = CATEGORIES.find(c => c.id === catId)?.title || ''

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${catTitle}</span>
        <p class="adv-sw-impact-msg">${msg}</p>
        <span class="adv-sw-impact-dismiss">Tap to continue</span>
      </div>
    `
    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-impact-show'))

    let dismissed = false
    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      overlay.classList.remove('adv-sw-impact-show')
      setTimeout(() => { overlay.remove(); onDone() }, 300)
    }
    overlay.addEventListener('pointerdown', dismiss)
    setTimeout(dismiss, 8000)
  }

  function showImpactOverlay(onDone) {
    // Gather categories that were played and have impact messages
    const playedCats = Object.entries(state.categoryProgress)
      .filter(([, prog]) => prog.answered > 0)
      .map(([id]) => id)
      .filter(id => IMPACT_MESSAGES[id])

    if (playedCats.length === 0) { onDone(); return }

    // Pick a random impact message from played categories
    const catId = playedCats[Math.floor(Math.random() * playedCats.length)]
    const msg = IMPACT_MESSAGES[catId]
    const catTitle = CATEGORIES.find(c => c.id === catId)?.title || ''

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${catTitle}</span>
        <p class="adv-sw-impact-msg">${msg}</p>
        <span class="adv-sw-impact-dismiss">Tap to continue</span>
      </div>
    `
    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-impact-show'))

    let dismissed = false
    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      overlay.classList.remove('adv-sw-impact-show')
      setTimeout(() => { overlay.remove(); onDone() }, 300)
    }

    overlay.addEventListener('pointerdown', dismiss)
    setTimeout(dismiss, 8000)
  }

  // ── Completion ──

  function showCompletion(fromQuit = false, skipImpact = false) {
    cancelAnimationFrame(state.spinFrame)
    clearTimeout(state.feedbackTimeout)
    state.phase = 'complete'
    trackGameComplete('adv-spin-wheel', 'advanced', { playerCount: state.players.length, score: Math.max(...state.players.map(p => p.score)) })
    recordScores({
      gameId: 'adv-spin-wheel',
      runId: state.runId,
      entries: state.players.map(p => ({ playerName: p.name, teamId: p.teamId, points: p.score })),
      eventId: getScoreEventId(),
    }).catch(err => console.error('recordScores failed', err))

    // Quit and win-by-threshold skip impact overlay
    if (fromQuit || skipImpact) {
      showCompletionScreen(fromQuit)
    } else {
      showImpactOverlay(() => showCompletionScreen(fromQuit))
    }
  }

  function showCompletionScreen(fromQuit) {
    let heading
    if (isMultiplayer) {
      const sorted = [...state.players].sort((a, b) => b.score - a.score)
      if (sorted[0].score === sorted[1]?.score) {
        heading = 'Tie Game!'
      } else {
        heading = `${sorted[0].name} Wins!`
      }
    } else if (fromQuit) {
      heading = 'Results'
    } else {
      heading = 'Great Job!'
    }

    const totalAnswered = Object.values(state.categoryProgress)
      .reduce((sum, cp) => sum + cp.answered, 0)

    const hasMissed = state.missedQuestions.length > 0
    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-completion-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">${heading}</h2>
        <p class="adv-sw-completion-detail">${fromQuit ? `${totalAnswered}/${totalQuestions} answered` : INSTRUCTIONS.completion}</p>
        <div class="adv-sw-completion-scores">
          ${[...state.players].sort((a, b) => b.score - a.score).map(p => `
            <div class="adv-sw-completion-row">
              <span class="adv-sw-completion-dot" style="background: ${p.color}"></span>
              <span class="adv-sw-completion-name">${p.name}</span>
              <span class="adv-sw-completion-pts">${p.score} pts</span>
            </div>
          `).join('')}
        </div>
        <div class="adv-sw-completion-btns">
          ${hasMissed ? '<button class="adv-sw-comp-btn" id="adv-sw-review">\u2716 Review Missed</button>' : ''}
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-sw-again">Play Again</button>
          <button class="adv-sw-comp-btn" id="adv-sw-home2">Back to Games</button>
        </div>
      </div>
    `

    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-popup-show'))

    if (hasMissed) {
      overlay.querySelector('#adv-sw-review').addEventListener('pointerdown', () => {
        showReviewOverlay(overlay)
      })
    }
    overlay.querySelector('#adv-sw-again').addEventListener('pointerdown', () => {
      cleanup()
      transitionTo(el, createIntroScreen())
    })
    overlay.querySelector('#adv-sw-home2').addEventListener('pointerdown', () => {
      cleanup()
      navigate('game-select')
    })
  }

  function showReviewOverlay(parentOverlay) {
    // Group missed questions by category
    const grouped = {}
    state.missedQuestions.forEach(q => {
      if (!grouped[q.category]) grouped[q.category] = []
      grouped[q.category].push(q)
    })

    const reviewEl = document.createElement('div')
    reviewEl.className = 'adv-sw-completion-overlay'
    reviewEl.innerHTML = `
      <div class="adv-sw-completion-content adv-review-content">
        <h2 class="adv-sw-completion-heading">Missed Questions</h2>
        <div class="adv-review-list">
          ${Object.entries(grouped).map(([cat, qs]) => `
            <div class="adv-review-category-group">
              <button class="adv-review-cat-toggle">
                <span class="adv-review-arrow">\u25B6</span>
                ${cat} (${qs.length})
              </button>
              <div class="adv-review-cat-items">
                ${qs.map(q => `
                  <div class="adv-review-item">
                    <span class="adv-review-question">${q.question}</span>
                    <span class="adv-review-answer">\u2714 ${q.correctAnswer}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-sw-review-back">\u2190 Back</button>
        </div>
      </div>
    `

    parentOverlay.style.display = 'none'
    el.appendChild(reviewEl)
    requestAnimationFrame(() => reviewEl.classList.add('adv-sw-popup-show'))

    // Toggle category dropdowns
    reviewEl.querySelectorAll('.adv-review-cat-toggle').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        btn.classList.toggle('adv-review-open')
        btn.nextElementSibling.classList.toggle('adv-review-items-open')
      })
    })

    reviewEl.querySelector('#adv-sw-review-back').addEventListener('pointerdown', () => {
      reviewEl.remove()
      parentOverlay.style.display = ''
    })
  }

  // ── Cleanup ──

  function cleanup() {
    cancelAnimationFrame(state.spinFrame)
    clearTimeout(state.feedbackTimeout)
    window.removeEventListener('theme-change', onThemeChange)
  }

  // ── Confirm Back ──

  function confirmBack() {
    if (state.phase === 'ready' && Object.values(state.categoryProgress).every(cp => cp.answered === 0)) {
      cleanup()
      navigate('game-select')
      return
    }
    const popup = document.createElement('div')
    popup.className = 'adv-sw-completion-overlay'
    popup.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">Leave Game?</h2>
        <p class="adv-sw-completion-detail">Your progress will be lost.</p>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-confirm-stay">Keep Playing</button>
          <button class="adv-sw-comp-btn" id="adv-confirm-leave">Leave</button>
        </div>
      </div>
    `
    el.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    popup.querySelector('#adv-confirm-stay').addEventListener('pointerdown', () => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => popup.remove(), 300)
    })
    popup.querySelector('#adv-confirm-leave').addEventListener('pointerdown', () => {
      cleanup()
      navigate('game-select')
    })
  }

  // ── Event Bindings ──

  el.querySelector('#adv-sw-home').addEventListener('pointerdown', () => {
    confirmBack()
  })

  spinBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    if (state.phase !== 'ready') return
    const rect = el.querySelector('.adv-sw-wheel-wrap').getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    spawnBurstParticles(el, rect.left - elRect.left + rect.width / 2, rect.top - elRect.top + rect.height / 2)
    spinWheel()
  })

  el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      const catId = btn.dataset.cat
      if (state.phase === 'choosing-for-opponent') {
        const prog = state.categoryProgress[catId]
        if (prog.answered >= prog.total) return
        disableCategories()
        state.forcedCategory = catId
        spunValueEl.textContent = ''
        advanceTurn()
        return
      }
      if (state.phase !== 'choosing') return
      if (!btn.classList.contains('adv-sw-cat-choosable')) return
      pickCategory(catId)
    })
  })

  el.querySelector('#adv-sw-quit').addEventListener('pointerdown', () => {
    cleanup()
    trackGameQuit('adv-spin-wheel', 'advanced', Object.values(state.categoryProgress).reduce((sum, cp) => sum + cp.answered, 0))
    showCompletion(true)
  })

  // ── Initialize ──

  updateCategoryDisplay()
  updateTurnDisplay()
  drawWheel()

  if (isMultiplayer) {
    const firstName = state.players[state.currentPlayer].name
    setTimeout(() => showTurnPopup(() => { state.phase = 'ready' }, `${firstName} goes first!`), 400)
  }

  return el
}

// ─── EXPORT ───

export function createAdvancedSpinWheelGame() {
  return createIntroScreen()
}
