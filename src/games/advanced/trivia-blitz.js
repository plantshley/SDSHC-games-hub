/**
 * Advanced Trivia Blitz
 * Dark-themed, no pixel art, multiplayer (1-4 players).
 * Topic mode (12 rounds, 60s each) or Endless mode.
 */

import { navigate } from '../../router.js'
import {
  ROUNDS, ROUND_TIME, PLAYER_COLORS, INSTRUCTIONS, IMPACT_MESSAGES, RULES,
} from '../../data/content/advanced/trivia-blitz.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { typewriter } from '../../utils/typewriter.js'

const POINTS_BASE = 100
const POINTS_FAST = 50  // answered in <= 5s
const POINTS_QUICK = 25 // answered in <= 10s

// ─── HELPERS ───

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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
  el.className = 'screen adv-tb-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0] }]

  function renderNames() {
    const container = el.querySelector('#adv-tb-names')
    if (!container) return
    container.innerHTML = players.map((p, i) => `
      <div class="adv-sw-name-row">
        <span class="adv-sw-name-dot" style="background: ${p.color}"></span>
        <input class="adv-sw-name-input" data-idx="${i}" value="${p.name}" maxlength="16" spellcheck="false" />
      </div>
    `).join('')

    container.querySelectorAll('.adv-sw-name-input').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.dataset.idx)
        players[idx].name = input.value || `Player ${idx + 1}`
      })
    })
  }

  function updateCount(delta) {
    playerCount = Math.max(1, Math.min(4, playerCount + delta))
    while (players.length < playerCount) {
      players.push({ name: `Player ${players.length + 1}`, color: PLAYER_COLORS[players.length] })
    }
    while (players.length > playerCount) players.pop()
    const countEl = el.querySelector('#adv-tb-count')
    if (countEl) countEl.textContent = playerCount
    renderNames()
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-tb-back">← Back</button>
        <h1 class="adv-sw-intro-title">Trivia Blitz</h1>
      </div>

      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>

      <div class="adv-sw-player-setup">
        <span class="adv-sw-setup-label">Players</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-tb-minus">−</button>
          <span class="adv-sw-picker-count" id="adv-tb-count">1</span>
          <button class="adv-sw-picker-btn" id="adv-tb-plus">+</button>
        </div>
        <div class="adv-sw-names" id="adv-tb-names"></div>
      </div>

      <div class="adv-tb-mode-select">
        <button class="adv-tb-mode-card" data-mode="topic">
          <span class="adv-tb-mode-title">Topic Mode</span>
          <span class="adv-tb-mode-desc">${INSTRUCTIONS.topicMode}</span>
        </button>
        <button class="adv-tb-mode-card" data-mode="endless">
          <span class="adv-tb-mode-title">Endless Shuffle</span>
          <span class="adv-tb-mode-desc">${INSTRUCTIONS.endlessMode}</span>
        </button>
      </div>
    </div>
  `

  addGradientBackground(el, 'trivia-blitz')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Trivia Blitz', RULES))
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-tb-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-tb-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-tb-plus').addEventListener('pointerdown', () => updateCount(1))

  el.querySelectorAll('.adv-tb-mode-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      transitionTo(el, createGameplayScreen(players, card.dataset.mode))
    })
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players, mode) {
  const el = document.createElement('div')
  el.className = 'screen adv-tb-game'

  const isMultiplayer = players.length > 1

  const state = {
    mode,
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    currentRound: 0,
    questionIdx: 0,
    roundQuestions: [],
    roundScores: new Array(ROUNDS.length).fill(null),
    timerStart: 0,
    timerInterval: null,
    questionStart: 0,
    answering: false,
    missedQuestions: [],
    // Endless mode
    endlessPool: [],
    endlessIdx: 0,
    endlessAnswered: 0,
    endlessCorrect: 0,
  }

  if (mode === 'endless') {
    state.endlessPool = ROUNDS.flatMap(r => r.questions.map(q => ({ ...q })))
    shuffleArray(state.endlessPool)
  }

  // ── Build DOM ──

  el.innerHTML = `
    <div class="adv-sw-topbar">
      <button class="adv-game-topbar-btn" id="adv-tb-home">← Back</button>
      <h2 class="adv-sw-game-title">Trivia Blitz</h2>
      ${isMultiplayer ? `
        <div class="adv-sw-turn-indicator" id="adv-tb-turn">
          <span class="adv-sw-turn-dot" id="adv-tb-turn-dot"></span>
          <span class="adv-sw-turn-name" id="adv-tb-turn-name"></span>
        </div>
      ` : ''}
    </div>

    <div class="adv-sw-body">
      <div class="adv-sw-sidebar">
        ${mode === 'topic' ? `
          <span class="adv-sw-sidebar-heading">Rounds</span>
          <div class="adv-tb-rounds" id="adv-tb-rounds">
            ${ROUNDS.map((r, i) => `
              <button class="adv-tb-round-btn ${i === 0 ? 'adv-tb-round-current' : 'adv-tb-round-locked'}" data-round="${i}">
                <span class="adv-tb-round-num">${i + 1}</span>
                <span class="adv-tb-round-title">${r.title}</span>
              </button>
            `).join('')}
          </div>
        ` : `
          <span class="adv-sw-sidebar-heading">Endless Shuffle</span>
          <div class="adv-tb-endless-stats">
            <div class="adv-tb-stat-row">
              <span class="adv-tb-stat-label">Correct</span>
              <span class="adv-tb-stat-value" id="adv-tb-endless-correct" style="color: #4ade80">0</span>
            </div>
            <div class="adv-tb-stat-row">
              <span class="adv-tb-stat-label">Answered</span>
              <span class="adv-tb-stat-value" id="adv-tb-endless-answered">0</span>
            </div>
            <div class="adv-tb-stat-row">
              <span class="adv-tb-stat-label">Remaining</span>
              <span class="adv-tb-stat-value" id="adv-tb-endless-remaining">${state.endlessPool.length}</span>
            </div>
          </div>
        `}

        <div class="adv-sw-sidebar-divider"></div>

        ${isMultiplayer ? `
          <span class="adv-sw-sidebar-heading">Scores</span>
          <div class="adv-sw-players" id="adv-tb-players">
            ${state.players.map((p, i) => `
              <div class="adv-sw-player-row" data-player="${i}" id="adv-tb-player-${i}">
                <span class="adv-sw-player-dot" style="background: ${p.color}"></span>
                <span class="adv-sw-player-name">${p.name}</span>
                <span class="adv-sw-player-score" id="adv-tb-pscore-${i}">0</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="adv-sw-solo-score">
            <span class="adv-sw-solo-label">Score</span>
            <span class="adv-sw-solo-value" id="adv-tb-pscore-0">0</span>
          </div>
        `}

        <div class="adv-sw-sidebar-divider"></div>

        ${mode === 'topic' ? `
          <div class="adv-tb-sidebar-btns">
            <button class="adv-sw-quit-btn" id="adv-tb-skip">Skip Round</button>
            <button class="adv-sw-quit-btn" id="adv-tb-quit">Quit</button>
          </div>
        ` : `
          <button class="adv-sw-quit-btn" id="adv-tb-quit">Quit</button>
        `}
      </div>

      <div class="adv-tb-main" id="adv-tb-main">
        <div class="adv-tb-timer-bar" id="adv-tb-timer-bar">
          <div class="adv-tb-timer-fill" id="adv-tb-timer-fill"></div>
          <span class="adv-tb-timer-text" id="adv-tb-timer-text">${ROUND_TIME}s</span>
        </div>

        <div class="adv-tb-question-zone">
          <span class="adv-tb-counter" id="adv-tb-counter"></span>
          <p class="adv-tb-question-text" id="adv-tb-question"></p>
          <div class="adv-tb-choices" id="adv-tb-choices"></div>
        </div>
      </div>
    </div>
  `

  addGradientBackground(el, 'trivia-blitz')
  const tbTopbar = el.querySelector('.adv-sw-topbar')
  tbTopbar.appendChild(createHelpButton('Trivia Blitz', RULES))
  tbTopbar.appendChild(createThemeToggle())

  // ── DOM refs ──
  const timerFill = el.querySelector('#adv-tb-timer-fill')
  const timerText = el.querySelector('#adv-tb-timer-text')
  const timerBar = el.querySelector('#adv-tb-timer-bar')
  const questionText = el.querySelector('#adv-tb-question')
  const counterText = el.querySelector('#adv-tb-counter')
  const choicesContainer = el.querySelector('#adv-tb-choices')
  const mainPanel = el.querySelector('#adv-tb-main')

  // ── Timer ──

  function startTimer() {
    state.timerStart = Date.now()
    updateTimerDisplay()
    state.timerInterval = setInterval(updateTimerDisplay, 100)
  }

  function stopTimer() {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }

  function updateTimerDisplay() {
    const elapsed = (Date.now() - state.timerStart) / 1000
    const remaining = Math.max(0, ROUND_TIME - elapsed)
    const seconds = Math.ceil(remaining)
    const pct = (remaining / ROUND_TIME) * 100

    timerText.textContent = `${seconds}s`
    timerFill.style.width = `${pct}%`

    // Color: semi-transparent player color in multiplayer, time-based in solo
    if (isMultiplayer) {
      const pColor = state.players[state.currentPlayer].color
      // Convert hex to rgba with 0.3 opacity
      const r = parseInt(pColor.slice(1, 3), 16)
      const g = parseInt(pColor.slice(3, 5), 16)
      const b = parseInt(pColor.slice(5, 7), 16)
      timerFill.style.background = remaining > 10 ? `rgba(${r},${g},${b},0.3)` : 'rgba(255,97,147,0.6)'
    } else {
      if (remaining > 30) timerFill.style.background = '#38cebc'
      else if (remaining > 10) timerFill.style.background = '#b8e84a'
      else timerFill.style.background = '#ff6193'
    }

    timerBar.classList.remove('adv-tb-timer-green', 'adv-tb-timer-yellow', 'adv-tb-timer-red')
    if (remaining > 30) timerBar.classList.add('adv-tb-timer-green')
    else if (remaining > 10) timerBar.classList.add('adv-tb-timer-yellow')
    else timerBar.classList.add('adv-tb-timer-red')

    if (remaining <= 0) {
      stopTimer()
      onRoundTimeUp()
    }
  }

  // ── Score ──

  function addScore(points) {
    state.players[state.currentPlayer].score += points
    updateAllScores()
  }

  function updateAllScores() {
    state.players.forEach((p, i) => {
      const scoreEl = el.querySelector(`#adv-tb-pscore-${i}`)
      if (scoreEl) scoreEl.textContent = p.score
    })
  }

  // ── Turn ──

  function advancePlayer() {
    if (isMultiplayer) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length
      updateTurnDisplay()
    }
  }

  function updateTurnDisplay() {
    if (!isMultiplayer) return
    const p = state.players[state.currentPlayer]
    const dot = el.querySelector('#adv-tb-turn-dot')
    const name = el.querySelector('#adv-tb-turn-name')
    if (dot) dot.style.background = p.color
    if (name) name.textContent = `${p.name}'s Turn`

    el.querySelectorAll('.adv-sw-player-row').forEach((row, i) => {
      row.classList.toggle('adv-sw-player-active', i === state.currentPlayer)
    })
  }

  function showTurnPopup(text, duration = 1500) {
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
      setTimeout(() => popup.remove(), 300)
    }, duration)
  }

  // ── Question Display ──

  function getCurrentQuestion() {
    if (state.mode === 'endless') return state.endlessPool[state.endlessIdx] || null
    return state.roundQuestions[state.questionIdx] || null
  }

  function showQuestion() {
    const q = getCurrentQuestion()
    if (!q) { onRoundComplete(); return }

    state.answering = false
    state.questionStart = Date.now()

    questionText.textContent = q.text

    if (state.mode === 'topic') {
      counterText.textContent = `Round ${state.currentRound + 1}: ${ROUNDS[state.currentRound].title} — Q${state.questionIdx + 1}/${state.roundQuestions.length}`
    } else {
      counterText.textContent = `Question ${state.endlessAnswered + 1}`
    }

    // Shuffle choices
    const indices = []
    for (let i = 0; i < q.choices.length; i++) indices.push(i)
    shuffleArray(indices)
    const correctShuffledIdx = indices.indexOf(q.correct)

    choicesContainer.innerHTML = indices.map((origIdx, btnIdx) => `
      <button class="adv-sw-choice" data-idx="${btnIdx}">${q.choices[origIdx]}</button>
    `).join('')

    choicesContainer.dataset.correctBtn = correctShuffledIdx

    choicesContainer.querySelectorAll('.adv-sw-choice').forEach(btn => {
      btn.addEventListener('pointerdown', () => handleAnswer(parseInt(btn.dataset.idx)))
    })
  }

  function handleAnswer(btnIdx) {
    if (state.answering) return
    state.answering = true

    const correctBtn = parseInt(choicesContainer.dataset.correctBtn)
    const isCorrect = btnIdx === correctBtn
    const elapsed = (Date.now() - state.questionStart) / 1000

    const buttons = choicesContainer.querySelectorAll('.adv-sw-choice')
    buttons.forEach(btn => btn.style.pointerEvents = 'none')

    if (isCorrect) {
      buttons[btnIdx].classList.add('adv-sw-correct')
      let points = POINTS_BASE
      if (elapsed <= 5) points += POINTS_FAST
      else if (elapsed <= 10) points += POINTS_QUICK
      addScore(points)
    } else {
      buttons[btnIdx].classList.add('adv-sw-wrong')
      buttons[correctBtn].classList.add('adv-sw-correct')
      const q = getCurrentQuestion()
      if (q) {
        state.missedQuestions.push({
          question: q.text,
          correctAnswer: q.choices[q.correct],
          round: ROUNDS[state.currentRound].title,
        })
      }
    }

    if (state.mode === 'topic') {
      if (!state.roundScores[state.currentRound]) {
        state.roundScores[state.currentRound] = { correct: 0, total: 0 }
      }
      state.roundScores[state.currentRound].total++
      if (isCorrect) state.roundScores[state.currentRound].correct++
    }

    const delay = isCorrect ? 2000 : 2800
    setTimeout(() => {
      // In topic mode, rotate turns per question. In endless, turns rotate on timer expiry.
      if (state.mode === 'topic') advancePlayer()

      if (state.mode === 'endless') {
        state.endlessAnswered++
        if (isCorrect) state.endlessCorrect++
        state.endlessIdx++
        updateEndlessStats()
        if (state.endlessIdx >= state.endlessPool.length) {
          stopTimer()
          showCompletion()
          return
        }
        showQuestion()
      } else {
        state.questionIdx++
        if (state.questionIdx >= state.roundQuestions.length) {
          onRoundComplete()
        } else {
          showQuestion()
        }
      }
    }, delay)
  }

  function updateEndlessStats() {
    const correctEl = el.querySelector('#adv-tb-endless-correct')
    const answeredEl = el.querySelector('#adv-tb-endless-answered')
    const remainingEl = el.querySelector('#adv-tb-endless-remaining')
    if (correctEl) correctEl.textContent = state.endlessCorrect
    if (answeredEl) answeredEl.textContent = state.endlessAnswered
    if (remainingEl) remainingEl.textContent = state.endlessPool.length - state.endlessIdx
  }

  // ── Round Management (Topic Mode) ──

  function startRound(roundIdx) {
    state.currentRound = roundIdx
    state.questionIdx = 0
    state.roundQuestions = shuffleArray([...ROUNDS[roundIdx].questions])
    updateSidebar()
    startTimer()
    showQuestion()
  }

  function onRoundComplete() {
    stopTimer()
    if (state.mode === 'topic') {
      const roundId = ROUNDS[state.currentRound].id
      if (IMPACT_MESSAGES[roundId]) {
        showRoundImpact(roundId, () => showRoundComplete())
      } else {
        showRoundComplete()
      }
    }
  }

  function showRoundImpact(roundId, onDone) {
    const msg = IMPACT_MESSAGES[roundId]
    const title = ROUNDS.find(r => r.id === roundId)?.title || ''

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${title}</span>
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

  function flashMessage(text, color, duration = 1500) {
    const msg = document.createElement('div')
    msg.className = 'adv-wg-flash'
    msg.textContent = text
    msg.style.color = color
    mainPanel.appendChild(msg)
    requestAnimationFrame(() => msg.classList.add('adv-wg-flash-show'))
    setTimeout(() => {
      msg.classList.remove('adv-wg-flash-show')
      setTimeout(() => msg.remove(), 300)
    }, duration)
  }

  function onRoundTimeUp() {
    state.answering = true // block further answers
    if (state.mode === 'endless') {
      // In endless multiplayer, switch to next player
      if (isMultiplayer) {
        advancePlayer()
        flashMessage(`Time's up! ${state.players[state.currentPlayer].name}'s turn`, '#b8e84a', 2500)
      } else {
        flashMessage("Time's up!", '#ff6193', 2500)
      }
      setTimeout(() => {
        startTimer()
        state.answering = false
        showQuestion()
      }, 2500)
      return
    }
    flashMessage("Time's up! Round over", '#ff6193')
    setTimeout(() => onRoundComplete(), 1500)
  }

  function showRoundComplete() {
    const rs = state.roundScores[state.currentRound] || { correct: 0, total: 0 }
    const isLastRound = state.currentRound >= ROUNDS.length - 1

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-completion-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">Round ${state.currentRound + 1} Complete</h2>
        <p class="adv-sw-completion-detail">
          ${ROUNDS[state.currentRound].title}<br>
          ${rs.correct}/${rs.total} Correct
        </p>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-tb-round-next">
            ${isLastRound ? 'See Results' : 'Next Round'}
          </button>
        </div>
      </div>
    `

    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-popup-show'))

    overlay.querySelector('#adv-tb-round-next').addEventListener('pointerdown', () => {
      overlay.classList.remove('adv-sw-popup-show')
      setTimeout(() => overlay.remove(), 300)
      if (isLastRound) showCompletion()
      else startRound(state.currentRound + 1)
    })

    updateSidebar()
  }

  function updateSidebar() {
    if (state.mode !== 'topic') return
    el.querySelectorAll('.adv-tb-round-btn').forEach((btn, i) => {
      btn.classList.remove('adv-tb-round-current', 'adv-tb-round-complete', 'adv-tb-round-locked')
      if (i === state.currentRound) btn.classList.add('adv-tb-round-current')
      else if (state.roundScores[i]) btn.classList.add('adv-tb-round-complete')
      else btn.classList.add('adv-tb-round-locked')
    })
  }

  // ── Impact Overlay ──

  function showImpactOverlay(onDone) {
    const playedRoundIds = state.mode === 'topic'
      ? ROUNDS.filter((_, i) => state.roundScores[i]).map(r => r.id)
      : [...new Set(ROUNDS.map(r => r.id))] // endless plays all

    const available = playedRoundIds.filter(id => IMPACT_MESSAGES[id])
    if (available.length === 0) { onDone(); return }

    const roundId = available[Math.floor(Math.random() * available.length)]
    const msg = IMPACT_MESSAGES[roundId]
    const title = ROUNDS.find(r => r.id === roundId)?.title || ''

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${title}</span>
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

  function showCompletion(fromQuit = false) {
    stopTimer()
    state.answering = true // block further answers

    if (fromQuit) {
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

    let detail
    if (state.mode === 'topic') {
      const totalCorrect = state.roundScores.reduce((s, rs) => s + (rs ? rs.correct : 0), 0)
      const totalQs = state.roundScores.reduce((s, rs) => s + (rs ? rs.total : 0), 0)
      const roundsPlayed = state.roundScores.filter(rs => rs !== null).length
      detail = fromQuit
        ? `${roundsPlayed}/${ROUNDS.length} rounds played`
        : `${totalCorrect}/${totalQs} correct across all rounds`
    } else {
      detail = `${state.endlessCorrect}/${state.endlessAnswered} correct`
    }

    const hasMissed = state.missedQuestions.length > 0
    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-completion-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">${heading}</h2>
        <p class="adv-sw-completion-detail">${fromQuit ? detail : `${INSTRUCTIONS.completion}<br><br>${detail}`}</p>
        <div class="adv-sw-completion-scores">
          ${state.players.map(p => `
            <div class="adv-sw-completion-row">
              <span class="adv-sw-completion-dot" style="background: ${p.color}"></span>
              <span class="adv-sw-completion-name">${p.name}</span>
              <span class="adv-sw-completion-pts">${p.score} pts</span>
            </div>
          `).join('')}
        </div>
        <div class="adv-sw-completion-btns">
          ${hasMissed ? '<button class="adv-sw-comp-btn" id="adv-tb-review">\u2716 Review Missed</button>' : ''}
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-tb-again">Play Again</button>
          <button class="adv-sw-comp-btn" id="adv-tb-home2">Back to Games</button>
        </div>
      </div>
    `

    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-popup-show'))

    if (hasMissed) {
      overlay.querySelector('#adv-tb-review').addEventListener('pointerdown', () => {
        showReviewOverlay(overlay)
      })
    }
    overlay.querySelector('#adv-tb-again').addEventListener('pointerdown', () => {
      transitionTo(el, createIntroScreen())
    })
    overlay.querySelector('#adv-tb-home2').addEventListener('pointerdown', () => {
      navigate('game-select')
    })
  }

  function showReviewOverlay(parentOverlay) {
    // Group missed questions by round name
    const grouped = {}
    state.missedQuestions.forEach(q => {
      const roundName = q.round || 'Unknown'
      if (!grouped[roundName]) grouped[roundName] = []
      grouped[roundName].push(q)
    })

    const reviewEl = document.createElement('div')
    reviewEl.className = 'adv-sw-completion-overlay'
    reviewEl.innerHTML = `
      <div class="adv-sw-completion-content adv-review-content">
        <h2 class="adv-sw-completion-heading">Missed Questions</h2>
        <div class="adv-review-list">
          ${Object.entries(grouped).map(([round, qs]) => `
            <div class="adv-review-category-group">
              <button class="adv-review-cat-toggle">
                <span class="adv-review-arrow">\u25B6</span>
                ${round} (${qs.length})
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
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-tb-review-back">\u2190 Back</button>
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

    reviewEl.querySelector('#adv-tb-review-back').addEventListener('pointerdown', () => {
      reviewEl.remove()
      parentOverlay.style.display = ''
    })
  }

  // ── Event Bindings ──

  el.querySelector('#adv-tb-home').addEventListener('pointerdown', () => {
    stopTimer()
    navigate('game-select')
  })

  el.querySelector('#adv-tb-quit').addEventListener('pointerdown', () => {
    stopTimer()
    showCompletion(true)
  })

  if (mode === 'topic') {
    const skipBtn = el.querySelector('#adv-tb-skip')
    if (skipBtn) {
      skipBtn.addEventListener('pointerdown', () => {
        stopTimer()
        if (state.currentRound < ROUNDS.length - 1) startRound(state.currentRound + 1)
      })
    }

    el.querySelectorAll('.adv-tb-round-btn').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const idx = parseInt(btn.dataset.round)
        if (idx > state.currentRound && !state.roundScores[idx]) return
        stopTimer()
        startRound(idx)
      })
    })
  }

  // ── Initialize ──

  updateTurnDisplay()

  if (isMultiplayer) {
    const firstName = state.players[state.currentPlayer].name
    showTurnPopup(`${firstName} goes first!`, 1800)
  }

  const initDelay = isMultiplayer ? 2200 : 350
  if (mode === 'topic') {
    setTimeout(() => startRound(0), initDelay)
  } else {
    setTimeout(() => { startTimer(); showQuestion() }, initDelay)
  }

  return el
}

// ─── EXPORT ───

export function createAdvancedTriviaBlitzGame() {
  return createIntroScreen()
}
