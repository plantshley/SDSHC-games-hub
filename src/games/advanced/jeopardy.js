/**
 * Soil Jeopardy
 * Dark-themed, multiplayer (1-4 players), turn-based.
 * 6 categories × 5 point values. Daily doubles. Multiple choice answers.
 */

import { navigate } from '../../router.js'
import {
  CATEGORIES, DAILY_DOUBLE_COUNT, PLAYER_COLORS, INSTRUCTIONS, IMPACT_MESSAGES, RULES,
} from '../../data/content/advanced/jeopardy.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { typewriter } from '../../utils/typewriter.js'

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
  el.className = 'screen adv-jp-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0] }]

  function renderNames() {
    const container = el.querySelector('#adv-jp-names')
    if (!container) return
    container.innerHTML = players.map((p, i) => `
      <div class="adv-sw-name-row">
        <span class="adv-sw-name-dot" style="background: ${p.color}"></span>
        <input class="adv-sw-name-input" data-idx="${i}" value="${p.name}" maxlength="16" spellcheck="false" />
      </div>
    `).join('')
    container.querySelectorAll('.adv-sw-name-input').forEach(input => {
      input.addEventListener('input', () => {
        players[parseInt(input.dataset.idx)].name = input.value || `Player ${parseInt(input.dataset.idx) + 1}`
      })
    })
  }

  function updateCount(delta) {
    playerCount = Math.max(1, Math.min(4, playerCount + delta))
    while (players.length < playerCount) players.push({ name: `Player ${players.length + 1}`, color: PLAYER_COLORS[players.length] })
    while (players.length > playerCount) players.pop()
    el.querySelector('#adv-jp-count').textContent = playerCount
    renderNames()
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-jp-back">← Back</button>
        <h1 class="adv-sw-intro-title">Soil Jeopardy</h1>
      </div>
      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>
      <div class="adv-sw-player-setup">
        <span class="adv-sw-setup-label">Players</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-jp-minus">−</button>
          <span class="adv-sw-picker-count" id="adv-jp-count">1</span>
          <button class="adv-sw-picker-btn" id="adv-jp-plus">+</button>
        </div>
        <div class="adv-sw-names" id="adv-jp-names"></div>
      </div>
      <button class="adv-sw-start-btn" id="adv-jp-start">Start Game</button>
    </div>
  `

  addGradientBackground(el, 'jeopardy')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Soil Jeopardy', RULES))
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-jp-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-jp-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-jp-plus').addEventListener('pointerdown', () => updateCount(1))
  el.querySelector('#adv-jp-start').addEventListener('pointerdown', () => {
    transitionTo(el, createGameplayScreen(players))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players) {
  const el = document.createElement('div')
  el.className = 'screen adv-jp-game'

  const isMultiplayer = players.length > 1

  // Build board state
  const board = CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.map(q => ({ ...q, answered: false, dailyDouble: false })),
  }))

  // Assign daily doubles randomly
  const allCells = []
  board.forEach((cat, ci) => cat.questions.forEach((q, qi) => allCells.push({ ci, qi })))
  shuffleArray(allCells)
  for (let i = 0; i < Math.min(DAILY_DOUBLE_COUNT, allCells.length); i++) {
    board[allCells[i].ci].questions[allCells[i].qi].dailyDouble = true
  }

  const state = {
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    phase: 'board', // board | question | daily-double | feedback | complete
    questionsRemaining: allCells.length,
    currentQuestion: null,
    currentCatIdx: null,
    currentQIdx: null,
    ddWager: 0,
    missedQuestions: [],
  }

  const totalCells = allCells.length

  // ── Build DOM ──

  el.innerHTML = `
    <div class="adv-sw-topbar">
      <button class="adv-game-topbar-btn" id="adv-jp-home">← Back</button>
      <h2 class="adv-sw-game-title">Soil Jeopardy</h2>
      ${isMultiplayer ? `
        <div class="adv-sw-turn-indicator" id="adv-jp-turn">
          <span class="adv-sw-turn-dot" id="adv-jp-turn-dot"></span>
          <span class="adv-sw-turn-name" id="adv-jp-turn-name"></span>
        </div>
      ` : ''}
    </div>

    <div class="adv-jp-body">
      <div class="adv-jp-board-area" id="adv-jp-board-area">
        <div class="adv-jp-board" id="adv-jp-board">
          ${board.map((cat, ci) => `
            <div class="adv-jp-col">
              <div class="adv-jp-cat-header">${cat.title}</div>
              ${cat.questions.map((q, qi) => `
                <button class="adv-jp-cell" data-ci="${ci}" data-qi="${qi}">
                  ${q.points}
                </button>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <div class="adv-jp-scorebar" id="adv-jp-scorebar">
          ${state.players.map((p, i) => `
            <div class="adv-jp-score-chip ${i === 0 ? 'adv-jp-chip-active' : ''}" data-player="${i}" id="adv-jp-chip-${i}">
              <span class="adv-jp-chip-dot" style="background: ${p.color}"></span>
              <span class="adv-jp-chip-name">${p.name}</span>
              <span class="adv-jp-chip-score" id="adv-jp-score-${i}">0</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="adv-jp-question-overlay" id="adv-jp-overlay" style="display:none">
        <div class="adv-jp-question-card" id="adv-jp-card">
          <span class="adv-jp-q-cat" id="adv-jp-q-cat"></span>
          <span class="adv-jp-q-points" id="adv-jp-q-points"></span>
          <p class="adv-jp-q-text" id="adv-jp-q-text"></p>
          <div class="adv-jp-q-choices" id="adv-jp-q-choices"></div>
        </div>
      </div>

      <div class="adv-jp-dd-overlay" id="adv-jp-dd" style="display:none">
        <div class="adv-jp-dd-card">
          <h3 class="adv-jp-dd-title">Daily Double!</h3>
          <p class="adv-jp-dd-text">How much do you want to wager?</p>
          <div class="adv-jp-dd-wager-row">
            <button class="adv-jp-dd-btn" data-wager="100">100</button>
            <button class="adv-jp-dd-btn" data-wager="250">250</button>
            <button class="adv-jp-dd-btn" data-wager="500">500</button>
            <button class="adv-jp-dd-btn" data-wager="max">All In</button>
          </div>
        </div>
      </div>
    </div>
  `

  addGradientBackground(el, 'jeopardy')
  const jpTopbar = el.querySelector('.adv-sw-topbar')
  jpTopbar.appendChild(createHelpButton('Soil Jeopardy', RULES))
  jpTopbar.appendChild(createThemeToggle())

  // ── DOM refs ──
  const boardArea = el.querySelector('#adv-jp-board-area')
  const overlay = el.querySelector('#adv-jp-overlay')
  const ddOverlay = el.querySelector('#adv-jp-dd')
  const qCat = el.querySelector('#adv-jp-q-cat')
  const qPoints = el.querySelector('#adv-jp-q-points')
  const qText = el.querySelector('#adv-jp-q-text')
  const qChoices = el.querySelector('#adv-jp-q-choices')

  // ── Board Interaction ──

  el.querySelectorAll('.adv-jp-cell').forEach(cell => {
    cell.addEventListener('pointerdown', () => {
      if (state.phase !== 'board') return
      const ci = parseInt(cell.dataset.ci)
      const qi = parseInt(cell.dataset.qi)
      const q = board[ci].questions[qi]
      if (q.answered) return

      state.currentCatIdx = ci
      state.currentQIdx = qi
      state.currentQuestion = q

      if (q.dailyDouble) {
        showDailyDouble()
      } else {
        showQuestion(q.points)
      }
    })
  })

  // ── Daily Double ──

  function showDailyDouble() {
    state.phase = 'daily-double'
    ddOverlay.style.display = 'flex'

    ddOverlay.querySelectorAll('.adv-jp-dd-btn').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const wagerStr = btn.dataset.wager
        const currentScore = Math.max(state.players[state.currentPlayer].score, 100)
        state.ddWager = wagerStr === 'max' ? currentScore : Math.min(parseInt(wagerStr), currentScore)
        ddOverlay.style.display = 'none'
        showQuestion(state.ddWager)
      }, { once: true })
    })
  }

  // ── Question Display ──

  function showQuestion(pointValue) {
    state.phase = 'question'
    const q = state.currentQuestion
    const cat = board[state.currentCatIdx]

    overlay.style.display = 'flex'
    qCat.textContent = cat.title
    qPoints.textContent = q.dailyDouble ? `Daily Double — ${pointValue} pts` : `${pointValue} pts`
    qPoints.style.color = q.dailyDouble ? '#b8e84a' : '#38cebc'
    qText.textContent = q.text

    const indices = []
    for (let i = 0; i < q.choices.length; i++) indices.push(i)
    shuffleArray(indices)
    const correctShuffled = indices.indexOf(q.correct)

    qChoices.innerHTML = indices.map((origIdx, btnIdx) => `
      <button class="adv-sw-choice" data-idx="${btnIdx}">${q.choices[origIdx]}</button>
    `).join('')

    qChoices.dataset.correctBtn = correctShuffled

    qChoices.querySelectorAll('.adv-sw-choice').forEach(btn => {
      btn.addEventListener('pointerdown', () => handleAnswer(parseInt(btn.dataset.idx), pointValue))
    })
  }

  function handleAnswer(btnIdx, pointValue) {
    if (state.phase !== 'question') return
    state.phase = 'feedback'

    const correctBtn = parseInt(qChoices.dataset.correctBtn)
    const isCorrect = btnIdx === correctBtn
    const buttons = qChoices.querySelectorAll('.adv-sw-choice')

    buttons.forEach(btn => btn.style.pointerEvents = 'none')
    if (isCorrect) {
      buttons[btnIdx].classList.add('adv-sw-correct')
      state.players[state.currentPlayer].score += pointValue
    } else {
      buttons[btnIdx].classList.add('adv-sw-wrong')
      buttons[correctBtn].classList.add('adv-sw-correct')
      if (state.currentQuestion.dailyDouble) {
        state.players[state.currentPlayer].score -= state.ddWager
      }
      const q = state.currentQuestion
      state.missedQuestions.push({
        question: q.text,
        correctAnswer: q.choices[q.correct],
        category: board[state.currentCatIdx].title,
        points: q.points,
      })
    }

    // Mark answered
    state.currentQuestion.answered = true
    state.questionsRemaining--
    updateScores()
    markCellAnswered(state.currentCatIdx, state.currentQIdx)

    setTimeout(() => {
      overlay.style.display = 'none'
      state.ddWager = 0

      if (state.questionsRemaining <= 0) {
        showCompletion()
        return
      }

      // Advance turn
      if (isMultiplayer) {
        state.currentPlayer = (state.currentPlayer + 1) % state.players.length
        updateTurnDisplay()
      }
      state.phase = 'board'
    }, isCorrect ? 800 : 1200)
  }

  function markCellAnswered(ci, qi) {
    const cell = el.querySelector(`.adv-jp-cell[data-ci="${ci}"][data-qi="${qi}"]`)
    if (cell) {
      cell.classList.add('adv-jp-cell-done')
      cell.textContent = ''
    }
  }

  // ── Scores ──

  function updateScores() {
    state.players.forEach((p, i) => {
      const el2 = el.querySelector(`#adv-jp-score-${i}`)
      if (el2) el2.textContent = p.score
    })
  }

  function updateTurnDisplay() {
    if (!isMultiplayer) return
    const p = state.players[state.currentPlayer]
    const dot = el.querySelector('#adv-jp-turn-dot')
    const name = el.querySelector('#adv-jp-turn-name')
    if (dot) dot.style.background = p.color
    if (name) name.textContent = `${p.name}'s Turn`

    el.querySelectorAll('.adv-jp-score-chip').forEach((chip, i) => {
      chip.classList.toggle('adv-jp-chip-active', i === state.currentPlayer)
    })
  }

  // ── Impact Overlay ──

  function showImpactOverlay(onDone) {
    const available = Object.keys(IMPACT_MESSAGES)
    if (available.length === 0) { onDone(); return }

    const id = available[Math.floor(Math.random() * available.length)]
    const msg = IMPACT_MESSAGES[id]
    const cat = CATEGORIES.find(c => c.id === id)

    const impactEl = document.createElement('div')
    impactEl.className = 'adv-sw-impact-overlay'
    impactEl.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${cat?.title || ''}</span>
        <p class="adv-sw-impact-msg">${msg}</p>
        <span class="adv-sw-impact-dismiss">Tap to continue</span>
      </div>
    `
    el.appendChild(impactEl)
    requestAnimationFrame(() => impactEl.classList.add('adv-sw-impact-show'))

    let dismissed = false
    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      impactEl.classList.remove('adv-sw-impact-show')
      setTimeout(() => { impactEl.remove(); onDone() }, 300)
    }
    impactEl.addEventListener('pointerdown', dismiss)
    setTimeout(dismiss, 8000)
  }

  // ── Completion ──

  function showCompletion(fromQuit = false) {
    state.phase = 'complete'

    const afterImpact = () => {
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

      const answered = totalCells - state.questionsRemaining

      const hasMissed = state.missedQuestions.length > 0
      const completionEl = document.createElement('div')
      completionEl.className = 'adv-sw-completion-overlay'
      completionEl.innerHTML = `
        <div class="adv-sw-completion-content">
          <h2 class="adv-sw-completion-heading">${heading}</h2>
          <p class="adv-sw-completion-detail">${fromQuit ? `${answered}/${totalCells} answered` : INSTRUCTIONS.completion}</p>
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
            ${hasMissed ? '<button class="adv-sw-comp-btn" id="adv-jp-review">\u2716 Review Missed</button>' : ''}
            <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-jp-again">Play Again</button>
            <button class="adv-sw-comp-btn" id="adv-jp-home2">Back to Games</button>
          </div>
        </div>
      `

      el.appendChild(completionEl)
      requestAnimationFrame(() => completionEl.classList.add('adv-sw-popup-show'))

      if (hasMissed) {
        completionEl.querySelector('#adv-jp-review').addEventListener('pointerdown', () => {
          showReviewOverlay(completionEl)
        })
      }
      completionEl.querySelector('#adv-jp-again').addEventListener('pointerdown', () => {
        transitionTo(el, createIntroScreen())
      })
      completionEl.querySelector('#adv-jp-home2').addEventListener('pointerdown', () => {
        navigate('game-select')
      })
    }

    if (fromQuit) {
      afterImpact()
    } else {
      showImpactOverlay(afterImpact)
    }
  }

  function showReviewOverlay(parentOverlay) {
    const reviewEl = document.createElement('div')
    reviewEl.className = 'adv-sw-completion-overlay'
    reviewEl.innerHTML = `
      <div class="adv-sw-completion-content adv-review-content">
        <h2 class="adv-sw-completion-heading">Missed Questions</h2>
        <div class="adv-review-list">
          ${state.missedQuestions.map(q => `
            <div class="adv-review-item">
              <span class="adv-review-cat">${q.category} \u2014 ${q.points} pts</span>
              <span class="adv-review-question">${q.question}</span>
              <span class="adv-review-answer">\u2714 ${q.correctAnswer}</span>
            </div>
          `).join('')}
        </div>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-jp-review-back">\u2190 Back</button>
        </div>
      </div>
    `

    parentOverlay.style.display = 'none'
    el.appendChild(reviewEl)
    requestAnimationFrame(() => reviewEl.classList.add('adv-sw-popup-show'))

    reviewEl.querySelector('#adv-jp-review-back').addEventListener('pointerdown', () => {
      reviewEl.remove()
      parentOverlay.style.display = ''
    })
  }

  // ── Event Bindings ──

  el.querySelector('#adv-jp-home').addEventListener('pointerdown', () => navigate('game-select'))

  // Quit button in lower right corner
  const quitBtn = document.createElement('button')
  quitBtn.className = 'adv-sw-quit-btn adv-jp-quit-btn'
  quitBtn.textContent = 'Quit'
  el.querySelector('.adv-jp-body').appendChild(quitBtn)
  quitBtn.addEventListener('pointerdown', () => showCompletion(true))

  // ── Initialize ──

  updateTurnDisplay()
  updateScores()

  return el
}

// ─── EXPORT ───

export function createAdvancedJeopardyGame() {
  return createIntroScreen()
}
