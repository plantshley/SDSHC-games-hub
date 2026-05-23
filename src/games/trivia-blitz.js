import { navigate } from '../router.js'
import { LEVELS, INSTRUCTIONS } from '../data/content/trivia-blitz.js'
import { processAssetSVG, clearSVGCache } from '../utils/svg-recolor.js'

/**
 * Soil Health Trivia Blitz
 * Game 10: Harvest Guardians (Middle & High School)
 *
 * Intro: choose Topic Mode or Endless Shuffle Mode
 * Topic: 9 rounds, 60s each, sidebar navigation
 * Endless: random questions from all rounds, wrong answer = game over
 */

const ROUND_TIME = 60
const POINTS_BASE = 100
const POINTS_FAST = 50
const POINTS_QUICK = 25

// ─── INTRO SCREEN ───
// Mirrors planting-sim intro: ps-intro-bg, ps-intro-header, ps-intro-body (left/right)

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen tb-intro'

  el.innerHTML = `
    <div class="tb-intro-bg"></div>
    <div class="tb-intro-header">
      <button class="home-btn" id="tb-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="tb-intro-title">Soil Health Trivia Blitz</h2>
    </div>
    <div class="tb-intro-body">
      <div class="tb-intro-left">
        <div class="tb-speech-bubble">
          <span class="tb-speech-text" id="tb-intro-typing"></span>
        </div>
        <img class="tb-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="tb-intro-right">
        <button class="tb-mode-card" data-mode="topic">
          <img src="/assets/sprites/Basic_Grass_Biom_things_tree-apple.png" alt="" class="tb-mode-card-icon">
          <span class="tb-mode-card-title">Topic Mode</span>
        </button>
        <button class="tb-mode-card" data-mode="endless">
          <img src="/assets/sprites/Basic_Grass_Biom_things_tree2.png" alt="" class="tb-mode-card-icon">
          <span class="tb-mode-card-title">Endless Shuffle</span>
        </button>
      </div>
    </div>
  `

  // Typing animation
  const typingEl = el.querySelector('#tb-intro-typing')
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

  el.querySelector('#tb-intro-home').addEventListener('pointerdown', () => {
    clearTimeout(typingTimer)
    navigate('game-select/guardians')
  })

  el.querySelectorAll('.tb-mode-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      clearTimeout(typingTimer)
      transitionTo(el, createGameplayScreen(card.dataset.mode))
    })
  })

  return el
}

// ─── GAMEPLAY SCREEN ───
// Mirrors planting-sim gameplay: ps-game-bg, ps-game-header, ps-game-body (panel + canvas-panel)

function createGameplayScreen(mode) {
  const el = document.createElement('div')
  el.className = 'screen tb-game'

  const state = {
    mode,
    currentRound: 0,
    questionIdx: 0,
    score: 0,
    roundScores: new Array(LEVELS.length).fill(null),
    roundQuestions: [],
    timerStart: 0,
    timerInterval: null,
    questionStart: 0,
    answering: false,
    endlessPool: [],
    endlessIdx: 0,
    endlessAnswered: 0,
    endlessCorrect: 0,
    endlessWrong: 0,
  }

  if (mode === 'endless') {
    state.endlessPool = LEVELS.flatMap((lvl, li) =>
      lvl.questions.map(q => ({ ...q, levelIdx: li }))
    )
    shuffleArray(state.endlessPool)
  }

  // Sidebar rounds (topic mode)
  const sidebarContent = mode === 'topic'
    ? `
      <span class="tb-panel-heading">Rounds</span>
      <div class="tb-rounds-list">
        ${LEVELS.map((lvl, i) => `
          <button class="tb-round-item ${i === 0 ? 'tb-round-current' : 'tb-round-locked'}" data-round="${i}">
            <span class="tb-round-num">${i + 1}</span>
            <span class="tb-round-topic">${lvl.title}</span>
            <span class="tb-round-status"></span>
          </button>
        `).join('')}
      </div>
      <div class="tb-panel-divider"></div>
      <div class="tb-panel-btn-row">
        <button class="tb-skip-btn tb-skip-half" id="tb-quit-topic">Quit ✕</button>
        <button class="tb-skip-btn tb-skip-half" id="tb-skip">Skip ▸</button>
      </div>
      <div class="tb-panel-divider"></div>
      <div class="tb-panel-score">
        <span class="tb-panel-score-label">Score</span>
        <span class="tb-panel-score-value" id="tb-score">0</span>
      </div>
    `
    : `
      <span class="tb-panel-heading">Endless Shuffle</span>
      <div class="tb-endless-stats">
        <div class="tb-endless-stat">
          <span class="tb-endless-stat-label">Correct</span>
          <span class="tb-endless-stat-value tb-stat-correct" id="tb-endless-correct">0</span>
        </div>
        <div class="tb-endless-stat">
          <span class="tb-endless-stat-label">Wrong</span>
          <span class="tb-endless-stat-value tb-stat-wrong" id="tb-endless-wrong">0</span>
        </div>
        <div class="tb-panel-divider"></div>
        <div class="tb-endless-stat">
          <span class="tb-endless-stat-label">Score</span>
          <span class="tb-panel-score-value" id="tb-score">0</span>
        </div>
        <div class="tb-panel-divider"></div>
        <div class="tb-endless-progress">
          <span class="tb-endless-stat-label">Progress</span>
          <div class="tb-endless-progress-bar">
            <div class="tb-endless-progress-fill" id="tb-endless-progress"></div>
          </div>
          <span class="tb-endless-progress-text" id="tb-endless-progress-text">0/${state.endlessPool.length}</span>
        </div>
      </div>
      <div class="tb-panel-divider"></div>
      <button class="tb-skip-btn" id="tb-quit">Quit ✕</button>
      <div class="tb-panel-creature">
        <img src="/assets/gifs/flowers-gif.gif" alt="" class="tb-panel-creature-img">
      </div>
    `

  el.innerHTML = `
    <div class="tb-game-bg"></div>
    <div class="tb-game-header">
      <button class="home-btn" id="tb-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="tb-game-title">Soil Health Trivia Blitz</h2>
      <button class="tb-mode-toggle" id="tb-mode-toggle">${mode === 'topic' ? 'Topic Mode ⇄ Endless Shuffle' : 'Endless Shuffle ⇄ Topic Mode'}</button>
    </div>
    <div class="tb-game-body">
      <div class="tb-panel">
        ${sidebarContent}
      </div>
      <div class="tb-canvas-panel">
        <div class="tb-timer-bar" id="tb-timer-bar">
          <div class="tb-timer-fill" id="tb-timer-fill"></div>
          <span class="tb-timer-text" id="tb-timer-text">${ROUND_TIME}s</span>
        </div>
        <div class="tb-question-area" id="tb-question-area">
          <div class="tb-asset-display" id="tb-asset"></div>
          <p class="tb-question-text" id="tb-question"></p>
          <span class="tb-question-counter" id="tb-counter"></span>
        </div>
        <div class="tb-choices" id="tb-choices">
          <button class="tb-choice" data-idx="0"></button>
          <button class="tb-choice" data-idx="1"></button>
          <button class="tb-choice" data-idx="2"></button>
          <button class="tb-choice" data-idx="3"></button>
        </div>
        <div class="tb-overlay-bottom">
          <img class="tb-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
    </div>
  `

  // DOM refs
  const timerFill = el.querySelector('#tb-timer-fill')
  const timerText = el.querySelector('#tb-timer-text')
  const timerBar = el.querySelector('#tb-timer-bar')
  const questionArea = el.querySelector('#tb-question-area')
  const assetDisplay = el.querySelector('#tb-asset')
  const questionText = el.querySelector('#tb-question')
  const counterText = el.querySelector('#tb-counter')
  const choiceButtons = el.querySelectorAll('.tb-choice')
  const scoreEl = el.querySelector('#tb-score')

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

    timerBar.classList.remove('tb-timer-green', 'tb-timer-yellow', 'tb-timer-red')
    if (remaining > 30) timerBar.classList.add('tb-timer-green')
    else if (remaining > 10) timerBar.classList.add('tb-timer-yellow')
    else timerBar.classList.add('tb-timer-red')

    if (remaining <= 0) {
      stopTimer()
      onRoundTimeUp()
    }
  }

  // ── Score ──

  function addScore(points) {
    state.score += points
    scoreEl.textContent = state.score
    scoreEl.classList.add('tb-score-pop')
    setTimeout(() => scoreEl.classList.remove('tb-score-pop'), 300)
  }

  // ── Asset Preloading ──

  function preloadUpcoming() {
    const questions = state.mode === 'endless' ? state.endlessPool : state.roundQuestions
    const startIdx = state.mode === 'endless' ? state.endlessIdx : state.questionIdx
    for (let i = startIdx; i < Math.min(startIdx + 5, questions.length); i++) {
      const q = questions[i]
      if (q && q.asset) processAssetSVG(q.asset, null)
    }
  }

  // ── Question Display ──

  function getCurrentQuestion() {
    if (state.mode === 'endless') return state.endlessPool[state.endlessIdx] || null
    return state.roundQuestions[state.questionIdx] || null
  }

  async function showQuestion() {
    const q = getCurrentQuestion()
    if (!q) { onRoundComplete(); return }

    state.answering = false
    state.questionStart = Date.now()
    preloadUpcoming()

    choiceButtons.forEach(btn => {
      btn.classList.remove('tb-correct', 'tb-wrong')
      btn.disabled = false
    })

    questionText.textContent = q.text

    if (state.mode === 'topic') {
      counterText.textContent = `Q ${state.questionIdx + 1}/${state.roundQuestions.length}`
    } else {
      counterText.textContent = `Q ${state.endlessAnswered + 1}`
    }

    // Shuffle choices
    const indices = [0, 1, 2, 3]
    shuffleArray(indices)
    const correctShuffledIdx = indices.indexOf(q.correct)
    choiceButtons.forEach((btn, i) => {
      btn.textContent = q.choices[indices[i]]
      btn.dataset.originalIdx = indices[i]
    })
    questionArea.dataset.correctBtn = correctShuffledIdx

    // Asset display
    assetDisplay.innerHTML = ''
    if (q.asset) {
      questionArea.classList.add('tb-has-asset')
      questionArea.classList.remove('tb-no-asset')
      try {
        const dataUrl = await processAssetSVG(q.asset, null) // transparent fills
        if (getCurrentQuestion() === q) {
          const img = document.createElement('img')
          img.src = dataUrl
          img.alt = ''
          img.className = 'tb-asset-img'
          assetDisplay.appendChild(img)
        }
      } catch {
        questionArea.classList.remove('tb-has-asset')
        questionArea.classList.add('tb-no-asset')
      }
    } else if (q.emoji) {
      questionArea.classList.add('tb-has-asset')
      questionArea.classList.remove('tb-no-asset')
      const emojiEl = document.createElement('span')
      emojiEl.className = 'tb-asset-emoji'
      emojiEl.textContent = q.emoji
      assetDisplay.appendChild(emojiEl)
    } else {
      questionArea.classList.remove('tb-has-asset')
      questionArea.classList.add('tb-no-asset')
    }
  }

  function handleAnswer(btnIdx) {
    if (state.answering) return
    state.answering = true

    const q = getCurrentQuestion()
    const correctBtn = parseInt(questionArea.dataset.correctBtn)
    const isCorrect = btnIdx === correctBtn
    const elapsed = (Date.now() - state.questionStart) / 1000

    choiceButtons.forEach(btn => btn.disabled = true)
    if (isCorrect) {
      choiceButtons[btnIdx].classList.add('tb-correct')
      let points = POINTS_BASE
      if (elapsed <= 5) points += POINTS_FAST
      else if (elapsed <= 10) points += POINTS_QUICK
      addScore(points)
    } else {
      choiceButtons[btnIdx].classList.add('tb-wrong')
      choiceButtons[correctBtn].classList.add('tb-correct')
    }

    if (state.mode === 'topic') {
      if (!state.roundScores[state.currentRound]) {
        state.roundScores[state.currentRound] = { correct: 0, total: 0, points: 0 }
      }
      state.roundScores[state.currentRound].total++
      if (isCorrect) state.roundScores[state.currentRound].correct++
    }

    const delay = isCorrect ? 600 : 1000
    setTimeout(() => {
      if (state.mode === 'endless') {
        state.endlessAnswered++
        if (isCorrect) state.endlessCorrect++
        else state.endlessWrong++
        state.endlessIdx++
        updateEndlessStats()
        if (state.endlessIdx >= state.endlessPool.length) {
          stopTimer()
          showGameOver()
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
    const correctEl = el.querySelector('#tb-endless-correct')
    const wrongEl = el.querySelector('#tb-endless-wrong')
    const progressFill = el.querySelector('#tb-endless-progress')
    const progressText = el.querySelector('#tb-endless-progress-text')
    if (correctEl) correctEl.textContent = state.endlessCorrect
    if (wrongEl) wrongEl.textContent = state.endlessWrong
    if (progressFill) {
      const pct = (state.endlessIdx / state.endlessPool.length) * 100
      progressFill.style.width = `${pct}%`
    }
    if (progressText) progressText.textContent = `${state.endlessIdx}/${state.endlessPool.length}`
  }

  // ── Round management ──

  function startRound(roundIdx) {
    state.currentRound = roundIdx
    state.questionIdx = 0
    state.roundQuestions = [...LEVELS[roundIdx].questions]
    shuffleArray(state.roundQuestions)
    updateSidebar()
    startTimer()
    showQuestion()
  }

  function onRoundComplete() {
    stopTimer()
    if (state.mode === 'topic') {
      if (!state.roundScores[state.currentRound]) {
        state.roundScores[state.currentRound] = { correct: 0, total: 0, points: 0 }
      }
      state.roundScores[state.currentRound].points = state.score
      showRoundComplete()
    }
  }

  function onRoundTimeUp() {
    if (state.mode === 'endless') { startTimer(); return }
    onRoundComplete()
  }

  function showRoundComplete() {
    const rs = state.roundScores[state.currentRound] || { correct: 0, total: 0 }
    const isLastRound = state.currentRound >= LEVELS.length - 1

    const overlay = document.createElement('div')
    overlay.className = 'tb-completion-overlay'
    overlay.innerHTML = `
      <div class="tb-completion-content">
        <div class="tb-completion-bubble">
          <span class="tb-completion-text">
            Round ${state.currentRound + 1} Complete!<br>
            ${LEVELS[state.currentRound].title}<br><br>
            ${rs.correct}/${rs.total} Correct<br>
            Total Score: ${state.score}
          </span>
        </div>
        <div class="tb-completion-bubble-tail"></div>
        <img class="tb-completion-worm" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        <div class="tb-completion-buttons">
          <button class="tb-completion-btn tb-completion-btn-primary" id="tb-round-next">
            ${isLastRound ? 'See Results' : 'Next Round'}
          </button>
        </div>
      </div>
    `

    const canvasPanel = el.querySelector('.tb-canvas-panel')
    canvasPanel.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('tb-show'))

    overlay.querySelector('#tb-round-next').addEventListener('pointerdown', () => {
      overlay.classList.remove('tb-show')
      setTimeout(() => overlay.remove(), 300)
      if (isLastRound) showCompletion()
      else startRound(state.currentRound + 1)
    })

    updateSidebar()
  }

  function updateSidebar() {
    if (state.mode !== 'topic') return
    el.querySelectorAll('.tb-round-item').forEach((item, i) => {
      item.classList.remove('tb-round-current', 'tb-round-complete', 'tb-round-locked')
      if (i === state.currentRound) item.classList.add('tb-round-current')
      else if (state.roundScores[i]) item.classList.add('tb-round-complete')
      else if (i < state.currentRound) { /* skipped but accessible */ }
      else item.classList.add('tb-round-locked')
    })
  }

  function handleSkip() {
    if (state.mode !== 'topic') return
    stopTimer()
    if (state.currentRound < LEVELS.length - 1) startRound(state.currentRound + 1)
  }

  function handleRoundClick(roundIdx) {
    if (state.mode !== 'topic') return
    if (roundIdx > state.currentRound && !state.roundScores[roundIdx]) return
    stopTimer()
    startRound(roundIdx)
  }

  // ── Game Over (Endless) ──

  function showGameOver() {
    const overlay = document.createElement('div')
    overlay.className = 'tb-completion-overlay'
    overlay.innerHTML = `
      <div class="tb-completion-content">
        <div class="tb-completion-bubble">
          <span class="tb-completion-text">
            All Done!<br><br>
            ${state.endlessCorrect}/${state.endlessAnswered} Correct<br>
            Final Score: ${state.score}
          </span>
        </div>
        <div class="tb-completion-bubble-tail"></div>
        <img class="tb-completion-worm" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        <div class="tb-completion-buttons">
          <button class="tb-completion-btn tb-completion-btn-primary" id="tb-retry">Try Again</button>
          <button class="tb-completion-btn" id="tb-go-home">Home</button>
        </div>
      </div>
    `

    const canvasPanel = el.querySelector('.tb-canvas-panel')
    canvasPanel.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('tb-show'))

    overlay.querySelector('#tb-retry').addEventListener('pointerdown', () => {
      overlay.classList.remove('tb-show')
      setTimeout(() => overlay.remove(), 300)
      state.score = 0
      state.endlessAnswered = 0
      state.endlessCorrect = 0
      state.endlessWrong = 0
      state.endlessIdx = 0
      shuffleArray(state.endlessPool)
      scoreEl.textContent = '0'
      updateEndlessStats()
      startTimer()
      showQuestion()
    })

    overlay.querySelector('#tb-go-home').addEventListener('pointerdown', () => {
      stopTimer()
      clearSVGCache()
      transitionTo(el, createIntroScreen())
    })
  }

  // ── Completion (Topic) ──

  function showCompletion(fromQuit = false) {
    const totalCorrect = state.roundScores.reduce((sum, rs) => sum + (rs ? rs.correct : 0), 0)
    const totalQs = state.roundScores.reduce((sum, rs) => sum + (rs ? rs.total : 0), 0)
    const roundsPlayed = state.roundScores.filter(rs => rs !== null).length

    const heading = fromQuit ? '✨ Results ✨' : 'Trivia Champion!🌟'
    const detail = fromQuit
      ? `${roundsPlayed}/${LEVELS.length} Rounds Attempted<br>`
      : `${INSTRUCTIONS.completion}<br><br>`

    const overlay = document.createElement('div')
    overlay.className = 'tb-completion-overlay'
    overlay.innerHTML = `
      <div class="tb-completion-content">
        <div class="tb-completion-bubble">
          <span class="tb-completion-text">
            ${heading}<br><br>
            ${detail}
            ${totalCorrect}/${totalQs} Total Correct<br>
            Final Score: ${state.score}
          </span>
        </div>
        <div class="tb-completion-bubble-tail"></div>
        <img class="tb-completion-worm" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        <div class="tb-completion-buttons">
          <button class="tb-completion-btn tb-completion-btn-primary" id="tb-play-again">Play Again</button>
          <button class="tb-completion-btn" id="tb-go-home2">Home</button>
        </div>
      </div>
    `

    const canvasPanel = el.querySelector('.tb-canvas-panel')
    canvasPanel.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('tb-show'))

    overlay.querySelector('#tb-play-again').addEventListener('pointerdown', () => {
      stopTimer()
      clearSVGCache()
      transitionTo(el, createIntroScreen())
    })

    overlay.querySelector('#tb-go-home2').addEventListener('pointerdown', () => {
      stopTimer()
      clearSVGCache()
      transitionTo(el, createIntroScreen())
    })
  }

  // ── Event bindings ──

  el.querySelector('#tb-game-home').addEventListener('pointerdown', () => {
    stopTimer()
    clearSVGCache()
    transitionTo(el, createIntroScreen())
  })

  choiceButtons.forEach((btn, i) => {
    btn.addEventListener('pointerdown', () => handleAnswer(i))
  })

  el.querySelector('#tb-mode-toggle').addEventListener('pointerdown', () => {
    stopTimer()
    clearSVGCache()
    const newMode = mode === 'topic' ? 'endless' : 'topic'
    transitionTo(el, createGameplayScreen(newMode))
  })

  if (mode === 'topic') {
    el.querySelector('#tb-skip').addEventListener('pointerdown', handleSkip)
    el.querySelector('#tb-quit-topic').addEventListener('pointerdown', () => {
      stopTimer()
      showCompletion(true)
    })
    el.querySelectorAll('.tb-round-item').forEach(item => {
      item.addEventListener('pointerdown', () => {
        handleRoundClick(parseInt(item.dataset.round))
      })
    })
  } else {
    el.querySelector('#tb-quit').addEventListener('pointerdown', () => {
      stopTimer()
      showGameOver()
    })
  }

  // Preload first batch of assets immediately (before transition finishes)
  if (mode === 'topic') {
    const firstRoundQs = [...LEVELS[0].questions]
    firstRoundQs.forEach(q => { if (q.asset) processAssetSVG(q.asset, null) })
  } else {
    for (let i = 0; i < Math.min(5, state.endlessPool.length); i++) {
      const q = state.endlessPool[i]
      if (q && q.asset) processAssetSVG(q.asset, null)
    }
  }

  // Start after transition
  if (mode === 'topic') {
    setTimeout(() => startRound(0), 350)
  } else {
    setTimeout(() => { startTimer(); showQuestion() }, 350)
  }

  return el
}

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

// ─── EXPORT ───

export function createTriviaBlitzGame() {
  clearSVGCache()
  return createIntroScreen()
}
