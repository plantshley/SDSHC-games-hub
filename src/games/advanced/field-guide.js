/**
 * Advanced Field Guide — Photo Identification Game
 * Progressive clue reveal: identify SD plants, crops, practices, equipment from photos.
 * Multiplayer (1-4 players), dark/light theme.
 */

import { navigate } from '../../router.js'
import {
  CATEGORIES, PLAYER_COLORS, INSTRUCTIONS, RULES, IMPACT_MESSAGES,
} from '../../data/content/advanced/field-guide.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { typewriter } from '../../utils/typewriter.js'

// ─── HELPERS ───

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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

const preloadCache = []
function preloadImage(src) {
  const img = new Image()
  img.src = src
  preloadCache.push(img)
  if (preloadCache.length > 4) preloadCache.shift()
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-fg-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0] }]

  // Category picker state
  const categoryOptions = [
    { id: 'all', title: 'All Categories' },
    ...CATEGORIES.map(c => ({ id: c.id, title: c.title })),
  ]
  let categoryIdx = 0

  function renderNames() {
    const container = el.querySelector('#adv-fg-names')
    if (!container) return
    container.innerHTML = players.map((p, i) => `
      <div class="adv-sw-name-row">
        <span class="adv-sw-name-dot" style="background: ${p.color}"></span>
        <input class="adv-sw-name-input" data-idx="${i}" value="${esc(p.name)}" maxlength="16" spellcheck="false" />
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
    const countEl = el.querySelector('#adv-fg-count')
    if (countEl) countEl.textContent = playerCount
    renderNames()
  }

  function updateCategoryDisplay() {
    const label = el.querySelector('#adv-fg-cat-label')
    if (label) label.textContent = categoryOptions[categoryIdx].title
  }

  function cycleCategory(delta) {
    categoryIdx = (categoryIdx + delta + categoryOptions.length) % categoryOptions.length
    updateCategoryDisplay()
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-fg-back">\u2190 Back</button>
        <h1 class="adv-sw-intro-title">Field Guide</h1>
      </div>

      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>

      <div class="adv-sw-player-setup">
        <span class="adv-sw-setup-label">Players</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-fg-minus">\u2212</button>
          <span class="adv-sw-picker-count" id="adv-fg-count">1</span>
          <button class="adv-sw-picker-btn" id="adv-fg-plus">+</button>
        </div>
        <div class="adv-sw-names" id="adv-fg-names"></div>
      </div>

      <div class="adv-sw-player-setup">
        <span class="adv-sw-setup-label">Category</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-fg-cat-prev">\u2190</button>
          <span class="adv-fg-cat-label" id="adv-fg-cat-label">All Categories</span>
          <button class="adv-sw-picker-btn" id="adv-fg-cat-next">\u2192</button>
        </div>
      </div>

      <button class="adv-sw-start-btn" id="adv-fg-start">Start Game</button>
    </div>
  `

  addGradientBackground(el, 'field-guide')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Field Guide', RULES))
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-fg-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-fg-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-fg-plus').addEventListener('pointerdown', () => updateCount(1))
  el.querySelector('#adv-fg-cat-prev').addEventListener('pointerdown', () => cycleCategory(-1))
  el.querySelector('#adv-fg-cat-next').addEventListener('pointerdown', () => cycleCategory(1))
  el.querySelector('#adv-fg-start').addEventListener('pointerdown', () => {
    const selectedCat = categoryOptions[categoryIdx].id
    transitionTo(el, createGameplayScreen(players, selectedCat))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players, selectedCategory) {
  const el = document.createElement('div')
  el.className = 'screen adv-fg-game'

  // Build category queues instead of flat items array
  const categoryQueues = {}
  const categoryOrder = []
  let totalItems = 0

  if (selectedCategory === 'all') {
    CATEGORIES.forEach(cat => {
      const shuffled = shuffleArray([...cat.items])
      const picked = shuffled.slice(0, 4)
      categoryQueues[cat.id] = picked.map(item => ({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
      totalItems += picked.length
      categoryOrder.push(cat.id)
    })
  } else {
    const cat = CATEGORIES.find(c => c.id === selectedCategory)
    if (!cat) { navigate('game-select'); return document.createElement('div') }
    const shuffled = shuffleArray([...cat.items])
    categoryQueues[cat.id] = shuffled.map(item => ({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
    totalItems += shuffled.length
    categoryOrder.push(cat.id)
  }

  const isMultiplayer = players.length > 1
  let cancelled = false

  // Category progress tracking
  const categoryProgress = {}
  Object.entries(categoryQueues).forEach(([catId, queue]) => {
    categoryProgress[catId] = { answered: 0, total: queue.length }
  })

  const state = {
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    phase: 'choosing', // choosing | viewing | feedback | complete
    totalAnswered: 0,
    currentCatId: null,
    currentItem: null,
    cluesRevealed: 1,
    choices: [],
    correctIdx: -1,
    missedItems: [],
    playedCategories: new Set(),
    shownImpactIds: new Set(),
  }

  // Determine which categories to show in sidebar
  const visibleCategories = selectedCategory === 'all'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.id === selectedCategory)

  // ── Build DOM ──

  el.innerHTML = `
    <div class="adv-sw-topbar">
      <button class="adv-game-topbar-btn" id="adv-fg-home">\u2190 Back</button>
      <h2 class="adv-sw-game-title">Field Guide</h2>
      <span class="adv-fg-round-counter" id="adv-fg-round-counter">0/${totalItems}</span>
      ${isMultiplayer ? `
        <div class="adv-sw-turn-indicator" id="adv-fg-turn">
          <span class="adv-sw-turn-dot" id="adv-fg-turn-dot"></span>
          <span class="adv-sw-turn-name" id="adv-fg-turn-name"></span>
        </div>
      ` : ''}
    </div>

    <div class="adv-sw-body">
      <div class="adv-sw-sidebar">
        <span class="adv-sw-sidebar-heading">Categories</span>
        <div class="adv-sw-categories" id="adv-fg-categories">
          ${visibleCategories.map(cat => {
            const prog = categoryProgress[cat.id]
            return `
              <div class="adv-sw-cat-btn" data-cat="${cat.id}">
                <span class="adv-sw-cat-title">${cat.title}</span>
                <span class="adv-sw-cat-count" id="adv-fg-cat-${cat.id}">${prog ? `0/${prog.total}` : ''}</span>
              </div>
            `
          }).join('')}
        </div>

        <div class="adv-sw-sidebar-divider"></div>

        ${isMultiplayer ? `
          <span class="adv-sw-sidebar-heading">Scores</span>
          <div class="adv-sw-players" id="adv-fg-players">
            ${state.players.map((p, i) => `
              <div class="adv-sw-player-row" data-player="${i}">
                <span class="adv-sw-player-dot" style="background: ${p.color}"></span>
                <span class="adv-sw-player-name">${esc(p.name)}</span>
                <span class="adv-sw-player-score" id="adv-fg-pscore-${i}">0</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="adv-sw-solo-score">
            <span class="adv-sw-solo-label">Score</span>
            <span class="adv-sw-solo-value" id="adv-fg-pscore-0">0</span>
          </div>
        `}
      </div>

      <div class="adv-fg-main" id="adv-fg-main">
        <div class="adv-fg-top-row">
          <div class="adv-fg-photo-container" id="adv-fg-photo-container">
            <img class="adv-fg-photo" id="adv-fg-photo" alt="Identify this" />
            <div class="adv-fg-photo-placeholder" id="adv-fg-placeholder">?</div>
          </div>

          <div class="adv-fg-right-panel">
            <div class="adv-fg-clue-area" id="adv-fg-clue-area">
              <p class="adv-fg-clue-text" id="adv-fg-clue-1"></p>
              <p class="adv-fg-clue-text adv-fg-clue-hidden" id="adv-fg-clue-2"></p>
              <p class="adv-fg-clue-text adv-fg-clue-hidden" id="adv-fg-clue-3"></p>
              <div class="adv-fg-significance" id="adv-fg-significance"></div>
            </div>
            <div class="adv-fg-controls">
              <button class="adv-fg-more-clues-btn" id="adv-fg-more-clues">More Clues (\u2212100 pts)</button>
              <span class="adv-fg-pts-available" id="adv-fg-pts">300 pts available</span>
            </div>
          </div>
        </div>

        <div class="adv-fg-answers" id="adv-fg-answers">
          <button class="adv-fg-answer-btn" data-idx="0"></button>
          <button class="adv-fg-answer-btn" data-idx="1"></button>
          <button class="adv-fg-answer-btn" data-idx="2"></button>
          <button class="adv-fg-answer-btn" data-idx="3"></button>
        </div>
      </div>
    </div>
  `

  addGradientBackground(el, 'field-guide')
  const topbar = el.querySelector('.adv-sw-topbar')
  topbar.appendChild(createHelpButton('Field Guide', RULES))
  topbar.appendChild(createThemeToggle())

  // ── References ──

  const photoEl = el.querySelector('#adv-fg-photo')
  const placeholderEl = el.querySelector('#adv-fg-placeholder')
  const clueEls = [
    el.querySelector('#adv-fg-clue-1'),
    el.querySelector('#adv-fg-clue-2'),
    el.querySelector('#adv-fg-clue-3'),
  ]
  const moreCluesBtn = el.querySelector('#adv-fg-more-clues')
  const ptsEl = el.querySelector('#adv-fg-pts')
  const answersEl = el.querySelector('#adv-fg-answers')
  const significanceEl = el.querySelector('#adv-fg-significance')
  const mainEl = el.querySelector('#adv-fg-main')

  // ── Scores ──

  function updateScores() {
    state.players.forEach((p, i) => {
      const scoreEl = el.querySelector(`#adv-fg-pscore-${i}`)
      if (scoreEl) scoreEl.textContent = p.score
    })
  }

  // ── Category Progress ──

  function updateCategoryProgress() {
    visibleCategories.forEach(cat => {
      const countEl = el.querySelector(`#adv-fg-cat-${cat.id}`)
      const prog = categoryProgress[cat.id]
      if (countEl && prog) countEl.textContent = `${prog.answered}/${prog.total}`
      const btn = el.querySelector(`.adv-sw-cat-btn[data-cat="${cat.id}"]`)
      if (btn && prog) btn.classList.toggle('adv-sw-cat-done', prog.answered >= prog.total)
    })
  }

  function highlightCategory(catId) {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      btn.classList.toggle('adv-sw-cat-active', btn.dataset.cat === catId)
    })
  }

  // ── Category Selection (choosable pattern) ──

  function enableCategories() {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      const catId = btn.dataset.cat
      const prog = categoryProgress[catId]
      if (prog && prog.answered < prog.total) {
        btn.classList.add('adv-sw-cat-choosable')
      }
    })
  }

  function disableCategories() {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      btn.classList.remove('adv-sw-cat-choosable')
    })
  }

  function selectCategory(catId) {
    const prog = categoryProgress[catId]
    if (!prog || prog.answered >= prog.total) return
    state.currentCatId = catId
    disableCategories()
    highlightCategory(catId)
    showRound()
  }

  function showChoosingView() {
    photoEl.style.display = 'none'
    placeholderEl.classList.add('adv-fg-show')
    placeholderEl.textContent = '?'
    clueEls.forEach(c => { c.textContent = ''; c.classList.add('adv-fg-clue-hidden') })
    significanceEl.style.display = 'none'
    moreCluesBtn.style.display = 'none'
    ptsEl.textContent = 'Pick a category'
    ptsEl.style.display = ''
    answersEl.querySelectorAll('.adv-fg-answer-btn').forEach(btn => {
      btn.textContent = ''
      btn.style.pointerEvents = 'none'
      btn.className = 'adv-fg-answer-btn'
    })
  }

  function enterChoosingPhase() {
    state.phase = 'choosing'
    showChoosingView()
    enableCategories()
    updateTurnDisplay()
  }

  // ── Turn Display ──

  function updateTurnDisplay() {
    if (!isMultiplayer) return
    const p = state.players[state.currentPlayer]
    const dot = el.querySelector('#adv-fg-turn-dot')
    const name = el.querySelector('#adv-fg-turn-name')
    if (dot) dot.style.background = p.color
    if (name) name.textContent = `${p.name}'s Turn`
  }

  // ── Floating Points Flash ──

  function showPtsFlash(text, isCorrect) {
    const flash = document.createElement('div')
    flash.className = 'adv-fg-pts-flash'
    flash.textContent = text
    if (!isCorrect) flash.style.color = '#f44336'
    mainEl.appendChild(flash)
    requestAnimationFrame(() => {
      flash.classList.add('adv-fg-pts-show')
      setTimeout(() => {
        flash.classList.add('adv-fg-pts-fade')
        setTimeout(() => flash.remove(), 800)
      }, 1200)
    })
  }

  // ── Advance Turn ──

  function advanceTurn() {
    if (isMultiplayer) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length
    }

    // Check if category just completed -> show impact
    const catProg = state.currentCatId ? categoryProgress[state.currentCatId] : null
    const catJustCompleted = catProg && catProg.answered >= catProg.total

    function afterCatImpact() {
      if (state.totalAnswered >= totalItems) {
        showCompletion()
        return
      }

      if (selectedCategory === 'all') {
        // All mode: enter choosing phase
        if (isMultiplayer) {
          showTurnPopup(() => enterChoosingPhase())
        } else {
          enterChoosingPhase()
        }
      } else {
        // Single category: auto-advance
        if (isMultiplayer) {
          showTurnPopup(() => showRound())
        } else {
          showRound()
        }
      }
    }

    if (catJustCompleted && IMPACT_MESSAGES[state.currentCatId] && !state.shownImpactIds.has(state.currentCatId)) {
      state.shownImpactIds.add(state.currentCatId)
      showCategoryImpact(state.currentCatId, afterCatImpact)
    } else {
      afterCatImpact()
    }
  }

  // ── Turn Popup ──

  function showTurnPopup(onDone, text) {
    const p = state.players[state.currentPlayer]
    const label = text || `${esc(p.name)}'s Turn`
    const popup = document.createElement('div')
    popup.className = 'adv-sw-turn-popup'
    popup.innerHTML = `
      <div class="adv-sw-turn-content">
        <span class="adv-sw-turn-popup-dot" style="background: ${p.color}"></span>
        <span>${label}</span>
      </div>
    `
    el.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => { popup.remove(); onDone() }, 300)
    }, 1500)
  }

  // ── Generate Choices ──

  function generateChoices(currentItem) {
    const cat = CATEGORIES.find(c => c.id === currentItem.categoryId)
    if (!cat) return { options: [currentItem.name], correctIdx: 0 }
    const others = cat.items.filter(it => it.id !== currentItem.id)
    shuffleArray(others)
    const distractors = others.slice(0, 3)
    const choices = [currentItem, ...distractors]
    shuffleArray(choices)
    return {
      options: choices.map(c => c.name),
      correctIdx: choices.indexOf(currentItem),
    }
  }

  // ── Show Round ──

  function showRound() {
    state.phase = 'viewing'
    state.cluesRevealed = 1
    updateTurnDisplay()
    disableCategories()

    // Pull next item from current category queue
    const queue = categoryQueues[state.currentCatId]
    if (!queue || queue.length === 0) {
      // Category exhausted — enter choosing or complete
      if (selectedCategory === 'all') {
        enterChoosingPhase()
      } else {
        showCompletion()
      }
      return
    }
    const item = queue.shift()
    state.currentItem = item
    state.playedCategories.add(item.categoryId)

    // Update topbar + sidebar
    el.querySelector('#adv-fg-round-counter').textContent = `${state.totalAnswered + 1}/${totalItems}`
    highlightCategory(item.categoryId)

    // Generate choices
    const { options, correctIdx } = generateChoices(item)
    state.choices = options
    state.correctIdx = correctIdx

    // Load photo
    photoEl.style.display = ''
    placeholderEl.classList.remove('adv-fg-show')
    photoEl.src = item.image
    photoEl.alt = 'Identify this'
    photoEl.onerror = () => {
      photoEl.style.display = 'none'
      placeholderEl.classList.add('adv-fg-show')
      placeholderEl.textContent = '?'
    }

    // Preload next image from same category
    const nextInQueue = queue[0]
    if (nextInQueue) {
      preloadImage(nextInQueue.image)
    }

    // Set clues
    clueEls[0].textContent = item.clues[0]
    clueEls[0].classList.remove('adv-fg-clue-hidden')
    clueEls[1].textContent = item.clues[1]
    clueEls[1].classList.add('adv-fg-clue-hidden')
    clueEls[2].textContent = item.clues[2]
    clueEls[2].classList.add('adv-fg-clue-hidden')

    // Points
    const initialPts = (4 - state.cluesRevealed) * 100
    ptsEl.textContent = `${initialPts} pts available`
    ptsEl.style.display = ''
    moreCluesBtn.style.display = ''
    moreCluesBtn.textContent = 'More Clues (\u2212100 pts)'

    // Hide significance
    significanceEl.style.display = 'none'
    significanceEl.textContent = ''

    // Set answer buttons
    const buttons = answersEl.querySelectorAll('.adv-fg-answer-btn')
    buttons.forEach((btn, i) => {
      btn.className = 'adv-fg-answer-btn'
      if (i < options.length) {
        btn.textContent = options[i]
        btn.style.display = ''
        btn.style.pointerEvents = ''
      } else {
        btn.textContent = ''
        btn.style.display = 'none'
      }
    })
  }

  // ── Reveal Clue ──

  function revealClue() {
    if (state.phase !== 'viewing') return
    if (state.cluesRevealed >= 3) return

    clueEls[state.cluesRevealed].classList.remove('adv-fg-clue-hidden')
    state.cluesRevealed++

    const ptsAvailable = (4 - state.cluesRevealed) * 100
    ptsEl.textContent = `${ptsAvailable} pts available`

    if (state.cluesRevealed >= 3) {
      moreCluesBtn.style.display = 'none'
    }
  }

  // ── Handle Answer ──

  function handleAnswer(btnIdx) {
    if (state.phase !== 'viewing') return
    state.phase = 'feedback'

    const item = state.currentItem
    const isCorrect = btnIdx === state.correctIdx
    const buttons = answersEl.querySelectorAll('.adv-fg-answer-btn')

    state.totalAnswered++

    // Update category progress
    if (categoryProgress[item.categoryId]) {
      categoryProgress[item.categoryId].answered++
      updateCategoryProgress()
    }

    // Disable all buttons + hide controls
    buttons.forEach(btn => { btn.style.pointerEvents = 'none' })
    moreCluesBtn.style.display = 'none'
    ptsEl.style.display = 'none'

    if (isCorrect) {
      buttons[btnIdx].classList.add('adv-fg-correct')
      const pts = (4 - state.cluesRevealed) * 100
      state.players[state.currentPlayer].score += pts
      updateScores()
      showPtsFlash(`+${pts}`, true)
    } else {
      buttons[btnIdx].classList.add('adv-fg-wrong')
      buttons[state.correctIdx].classList.add('adv-fg-correct')
      showPtsFlash('0 pts', false)

      state.missedItems.push({
        name: item.name,
        category: item.categoryTitle,
        clue: item.clues[0],
        significance: item.significance,
        image: item.image,
      })
    }

    // Show significance
    significanceEl.textContent = item.significance
    significanceEl.style.display = ''

    // Reveal all clues
    clueEls.forEach(c => c.classList.remove('adv-fg-clue-hidden'))

    const delay = isCorrect ? 3500 : 4500
    setTimeout(() => {
      if (cancelled || state.phase === 'complete') return

      // Single-category: check if last item
      if (state.totalAnswered >= totalItems && selectedCategory !== 'all') {
        const catId = item.categoryId
        if (IMPACT_MESSAGES[catId] && !state.shownImpactIds.has(catId)) {
          state.shownImpactIds.add(catId)
          showCategoryImpact(catId, () => showCompletion())
        } else {
          showCompletion()
        }
        return
      }

      advanceTurn()
    }, delay)
  }

  // ── Category Impact ──

  function showCategoryImpact(catId, onDone) {
    const msg = IMPACT_MESSAGES[catId]
    if (!msg) { onDone(); return }

    const cat = CATEGORIES.find(c => c.id === catId)
    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${cat ? cat.title : ''}</span>
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
    state.phase = 'complete'

    function afterImpact() {
      const sorted = [...state.players].sort((a, b) => b.score - a.score)
      const winner = sorted[0]
      const isTie = isMultiplayer && sorted.length > 1 && sorted[0].score === sorted[1].score

      let heading
      if (fromQuit) {
        heading = 'Game Over'
      } else if (isMultiplayer) {
        heading = isTie ? 'Tie Game!' : `${esc(winner.name)} Wins!`
      } else {
        heading = 'Great Job!'
      }

      const maxPts = totalItems * 300
      const detail = isMultiplayer
        ? ''
        : `You scored ${winner.score} out of ${maxPts} possible points.`

      const overlay = document.createElement('div')
      overlay.className = 'adv-sw-completion-overlay'
      overlay.innerHTML = `
        <div class="adv-sw-completion-content">
          <h2 class="adv-sw-completion-heading">${heading}</h2>
          ${detail ? `<p class="adv-sw-completion-detail">${detail}</p>` : ''}
          <div class="adv-sw-completion-scores">
            ${sorted.map(p => `
              <div class="adv-sw-completion-row">
                <span class="adv-sw-completion-dot" style="background: ${p.color}"></span>
                <span class="adv-sw-completion-name">${esc(p.name)}</span>
                <span class="adv-sw-completion-pts">${p.score} pts</span>
              </div>
            `).join('')}
          </div>
          <div class="adv-sw-completion-btns">
            ${state.missedItems.length > 0 ? `
              <button class="adv-sw-comp-btn" id="adv-fg-review">\u2716 Review Missed</button>
            ` : ''}
            <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-fg-again">Play Again</button>
            <button class="adv-sw-comp-btn" id="adv-fg-home2">Back to Games</button>
          </div>
        </div>
      `

      el.appendChild(overlay)
      requestAnimationFrame(() => overlay.classList.add('adv-sw-popup-show'))

      if (state.missedItems.length > 0) {
        overlay.querySelector('#adv-fg-review').addEventListener('pointerdown', () => {
          showReviewOverlay(overlay)
        })
      }
      overlay.querySelector('#adv-fg-again').addEventListener('pointerdown', () => {
        transitionTo(el, createIntroScreen())
      })
      overlay.querySelector('#adv-fg-home2').addEventListener('pointerdown', () => {
        navigate('game-select')
      })
    }

    if (fromQuit) {
      afterImpact()
    } else {
      showImpactOverlay(afterImpact)
    }
  }

  // ── Impact Overlay (end-of-game) ──

  function showImpactOverlay(onDone) {
    const available = [...state.playedCategories].filter(id => IMPACT_MESSAGES[id] && !state.shownImpactIds.has(id))
    if (available.length === 0 || (selectedCategory !== 'all' && available.length <= 1)) {
      onDone()
      return
    }

    const id = available[Math.floor(Math.random() * available.length)]
    const msg = IMPACT_MESSAGES[id]
    const cat = CATEGORIES.find(c => c.id === id)

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${cat ? cat.title : ''}</span>
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

  // ── Full-Screen Image Viewer ──

  function showFullScreenImage(src, alt, parentEl) {
    const overlay = document.createElement('div')
    overlay.className = 'adv-fg-fullscreen-overlay'
    overlay.innerHTML = `
      <img class="adv-fg-fullscreen-img" src="${src}" alt="${esc(alt)}" />
      <span class="adv-fg-fullscreen-label">${esc(alt)}</span>
      <span class="adv-fg-fullscreen-dismiss">Tap to close</span>
    `
    parentEl.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-fg-fullscreen-show'))
    overlay.addEventListener('pointerdown', () => {
      overlay.classList.remove('adv-fg-fullscreen-show')
      setTimeout(() => overlay.remove(), 300)
    })
  }

  // ── Review Overlay ──

  function showReviewOverlay(parentOverlay) {
    const grouped = {}
    state.missedItems.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    })

    const reviewEl = document.createElement('div')
    reviewEl.className = 'adv-sw-completion-overlay'
    reviewEl.innerHTML = `
      <div class="adv-sw-completion-content adv-review-content">
        <h2 class="adv-sw-completion-heading">Missed Items</h2>
        <div class="adv-review-list">
          ${Object.entries(grouped).map(([cat, missedItems]) => `
            <div class="adv-review-category-group">
              <button class="adv-review-cat-toggle">
                <span class="adv-review-arrow">\u25B6</span>
                ${cat} (${missedItems.length})
              </button>
              <div class="adv-review-cat-items">
                ${missedItems.map(item => `
                  <div class="adv-review-item adv-fg-review-item">
                    <img class="adv-fg-review-thumb" src="${item.image}" alt="${esc(item.name)}" data-fullsrc="${item.image}" />
                    <div class="adv-fg-review-info">
                      <span class="adv-review-question">${item.name}</span>
                      <span class="adv-review-answer">${item.significance}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-fg-review-back">\u2190 Back</button>
        </div>
      </div>
    `

    parentOverlay.style.display = 'none'
    el.appendChild(reviewEl)
    requestAnimationFrame(() => reviewEl.classList.add('adv-sw-popup-show'))

    reviewEl.querySelectorAll('.adv-review-cat-toggle').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        btn.classList.toggle('adv-review-open')
        btn.nextElementSibling.classList.toggle('adv-review-items-open')
      })
    })

    // Thumbnail tap -> full-screen view
    reviewEl.querySelectorAll('.adv-fg-review-thumb').forEach(thumb => {
      thumb.addEventListener('pointerdown', (e) => {
        e.stopPropagation()
        showFullScreenImage(thumb.dataset.fullsrc, thumb.alt, reviewEl)
      })
    })

    reviewEl.querySelector('#adv-fg-review-back').addEventListener('pointerdown', () => {
      reviewEl.remove()
      parentOverlay.style.display = ''
    })
  }

  // ── Event Bindings ──

  el.querySelector('#adv-fg-home').addEventListener('pointerdown', () => { cancelled = true; navigate('game-select') })

  moreCluesBtn.addEventListener('pointerdown', () => revealClue())

  answersEl.querySelectorAll('.adv-fg-answer-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      handleAnswer(parseInt(btn.dataset.idx))
    })
  })

  // Category click handlers (choosable pattern)
  el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      if (state.phase !== 'choosing') return
      if (!btn.classList.contains('adv-sw-cat-choosable')) return
      selectCategory(btn.dataset.cat)
    })
  })

  // Quit button in sidebar
  const quitBtn = document.createElement('button')
  quitBtn.className = 'adv-sw-quit-btn adv-jp-quit-btn'
  quitBtn.textContent = 'Quit'
  el.querySelector('.adv-sw-sidebar').appendChild(quitBtn)
  quitBtn.addEventListener('pointerdown', () => showCompletion(true))

  // ── Initialize ──

  updateTurnDisplay()
  updateScores()
  updateCategoryProgress()

  if (selectedCategory !== 'all') {
    // Single category — start directly
    state.currentCatId = categoryOrder[0]
    if (isMultiplayer) {
      const firstName = esc(state.players[state.currentPlayer].name)
      setTimeout(() => showTurnPopup(() => showRound(), `${firstName} goes first!`), 400)
    } else {
      showRound()
    }
  } else {
    // All categories — enter choosing phase
    if (isMultiplayer) {
      const firstName = esc(state.players[state.currentPlayer].name)
      setTimeout(() => showTurnPopup(() => {
        enterChoosingPhase()
      }, `${firstName} goes first!`), 400)
    } else {
      enterChoosingPhase()
    }
  }

  return el
}

// ─── EXPORT ───

export function createAdvancedFieldGuideGame() {
  return createIntroScreen()
}
