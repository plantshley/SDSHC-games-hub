/**
 * Soil Jeopardy
 * Dark-themed, multiplayer (1-4 players), turn-based.
 * 6 categories × 5 point values. Daily doubles. Multiple choice answers.
 */

import { navigate } from '../../router.js'
import { onTap } from '../../utils/tap.js'
import {
  CATEGORIES, DAILY_DOUBLE_COUNT, PLAYER_COLORS, INSTRUCTIONS, IMPACT_MESSAGES, RULES,
} from '../../data/content/advanced/jeopardy.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { createLeaderboardButton } from '../../utils/leaderboard-modal.js'
import { renderTeamPlayerRows } from '../../utils/team-input.js'
import { recordScoresWithStatus } from '../../utils/score-save-status.js'
import { getScoreEventId } from '../../screens/advanced-play-mode.js'
import { typewriter } from '../../utils/typewriter.js'
import { shuffleArray, transitionTo } from '../../utils/game-helpers.js'
import { trackGameStart, trackGameComplete, trackGameQuit } from '../../utils/analytics.js'
import { mountNarrowGate } from '../../utils/narrow-gate.js'

function genRunId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-jp-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0], teamId: null, teamName: '', teamStatus: null }]

  function renderNames() {
    const container = el.querySelector('#adv-jp-names')
    if (!container) return
    renderTeamPlayerRows(container, players)
  }

  function updateCount(delta) {
    playerCount = Math.max(1, Math.min(4, playerCount + delta))
    while (players.length < playerCount) players.push({ name: `Player ${players.length + 1}`, color: PLAYER_COLORS[players.length], teamId: null, teamName: '', teamStatus: null })
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
  introTopbar.appendChild(createLeaderboardButton())
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  onTap(el.querySelector('#adv-jp-back'), () => navigate('game-select'))
  onTap(el.querySelector('#adv-jp-minus'), () => updateCount(-1))
  onTap(el.querySelector('#adv-jp-plus'), () => updateCount(1))
  onTap(el.querySelector('#adv-jp-start'), () => {
    trackGameStart('adv-jeopardy', 'advanced', { playerCount: players.length })
    transitionTo(el, createGameplayScreen(players))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players) {
  const el = document.createElement('div')
  el.className = 'screen adv-jp-game'
  mountNarrowGate(el)

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
    runId: genRunId(),
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
  jpTopbar.appendChild(createLeaderboardButton())
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
    onTap(cell, () => {
      if (state.phase !== 'board') return
      const ci = parseInt(cell.dataset.ci)
      const qi = parseInt(cell.dataset.qi)
      const q = board[ci].questions[qi]
      if (q.answered) return

      state.currentCatIdx = ci
      state.currentQIdx = qi
      state.currentQuestion = q

      if (q.dailyDouble && state.players[state.currentPlayer].score > 0) {
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
      onTap(btn, () => {
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
      onTap(btn, () => handleAnswer(parseInt(btn.dataset.idx), pointValue))
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

    // Check if this category is now fully answered
    const catComplete = board[state.currentCatIdx].questions.every(q => q.answered)
    const catId = board[state.currentCatIdx].id

    setTimeout(() => {
      overlay.style.display = 'none'
      state.ddWager = 0

      if (state.questionsRemaining <= 0) {
        // If last question also completed a category, show that category's impact first
        if (catComplete && IMPACT_MESSAGES[catId]) {
          showCategoryImpact(catId, () => showCompletion(false, true))
        } else {
          showCompletion()
        }
        return
      }

      const afterImpact = () => {
        if (isMultiplayer) {
          state.currentPlayer = (state.currentPlayer + 1) % state.players.length
          updateTurnDisplay()
          showTurnPopup(() => { state.phase = 'board' })
        } else {
          state.phase = 'board'
        }
      }

      // Show impact message when a category is completed (if available)
      if (catComplete && IMPACT_MESSAGES[catId]) {
        showCategoryImpact(catId, afterImpact)
      } else {
        afterImpact()
      }
    }, isCorrect ? 2000 : 2800)
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
    el.querySelector('.adv-jp-body').appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => { popup.remove(); onDone() }, 300)
    }, 1500)
  }

  // ── Impact Overlay ──

  function showCategoryImpact(catId, onDone) {
    const msg = IMPACT_MESSAGES[catId]
    if (!msg) { onDone(); return }
    const cat = CATEGORIES.find(c => c.id === catId)

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
    onTap(impactEl, dismiss)
    setTimeout(dismiss, 8000)
  }

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
    onTap(impactEl, dismiss)
    setTimeout(dismiss, 8000)
  }

  // ── Completion ──

  function showCompletion(fromQuit = false, skipImpact = false) {
    state.phase = 'complete'
    trackGameComplete('adv-jeopardy', 'advanced', { playerCount: state.players.length, score: Math.max(...state.players.map(p => p.score)) })
    recordScoresWithStatus({
      gameId: 'adv-jeopardy',
      runId: state.runId,
      entries: state.players.map(p => ({ playerName: p.name, teamId: p.teamId, points: p.score })),
      eventId: getScoreEventId(),
    })

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
        onTap(completionEl.querySelector('#adv-jp-review'), () => {
          showReviewOverlay(completionEl)
        })
      }
      onTap(completionEl.querySelector('#adv-jp-again'), () => {
        transitionTo(el, createIntroScreen())
      })
      onTap(completionEl.querySelector('#adv-jp-home2'), () => {
        navigate('game-select')
      })
    }

    if (fromQuit || skipImpact) {
      afterImpact()
    } else {
      showImpactOverlay(afterImpact)
    }
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
                    <span class="adv-review-cat">${q.points} pts</span>
                    <span class="adv-review-question">${q.question}</span>
                    <span class="adv-review-answer">\u2714 ${q.correctAnswer}</span>
                  </div>
                `).join('')}
              </div>
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

    // Toggle category dropdowns
    reviewEl.querySelectorAll('.adv-review-cat-toggle').forEach(btn => {
      onTap(btn, () => {
        btn.classList.toggle('adv-review-open')
        btn.nextElementSibling.classList.toggle('adv-review-items-open')
      })
    })

    onTap(reviewEl.querySelector('#adv-jp-review-back'), () => {
      reviewEl.remove()
      parentOverlay.style.display = ''
    })
  }

  // ── Confirm Back ──

  function confirmBack() {
    if (state.questionsRemaining === totalCells) {
      transitionTo(el, createIntroScreen())
      return
    }
    state.phase = 'confirm'
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
    onTap(popup.querySelector('#adv-confirm-stay'), () => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => { popup.remove(); state.phase = 'board' }, 300)
    })
    onTap(popup.querySelector('#adv-confirm-leave'), () => {
      transitionTo(el, createIntroScreen())
    })
  }

  // ── Event Bindings ──

  onTap(el.querySelector('#adv-jp-home'), () => confirmBack())

  // Quit button in lower right corner
  const quitBtn = document.createElement('button')
  quitBtn.className = 'adv-sw-quit-btn adv-jp-quit-btn'
  quitBtn.textContent = 'Quit'
  el.querySelector('.adv-jp-body').appendChild(quitBtn)
  onTap(quitBtn, () => { state.phase = 'complete'; trackGameQuit('adv-jeopardy', 'advanced', totalCells - state.questionsRemaining); showCompletion(true) })

  // ── Initialize ──

  updateTurnDisplay()
  updateScores()

  if (isMultiplayer) {
    state.phase = 'waiting'
    const firstName = state.players[state.currentPlayer].name
    setTimeout(() => showTurnPopup(() => { state.phase = 'board' }, `${firstName} goes first!`), 400)
  }

  return el
}

// ─── EXPORT ───

export function createAdvancedJeopardyGame() {
  return createIntroScreen()
}
