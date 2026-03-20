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

  // Build flat items array (sequential play order)
  let items = []
  const categoryOrder = []

  if (selectedCategory === 'all') {
    // 4 random items per category, grouped by category
    CATEGORIES.forEach(cat => {
      const shuffled = shuffleArray([...cat.items])
      const picked = shuffled.slice(0, 4)
      picked.forEach(item => items.push({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
      categoryOrder.push(cat.id)
    })
  } else {
    const cat = CATEGORIES.find(c => c.id === selectedCategory)
    if (!cat) { navigate('game-select'); return document.createElement('div') }
    const shuffled = shuffleArray([...cat.items])
    shuffled.forEach(item => items.push({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
    categoryOrder.push(cat.id)
  }

  const totalRounds = items.length
  const isMultiplayer = players.length > 1
  let cancelled = false

  // Category progress tracking
  const categoryProgress = {}
  if (selectedCategory === 'all') {
    CATEGORIES.forEach(cat => { categoryProgress[cat.id] = { answered: 0, total: 4 } })
  } else {
    const cat = CATEGORIES.find(c => c.id === selectedCategory)
    if (cat) categoryProgress[cat.id] = { answered: 0, total: cat.items.length }
  }

  const state = {
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    phase: 'init', // init | viewing | feedback | complete
    round: 0,
    cluesRevealed: 1,
    choices: [],
    correctIdx: -1,
    missedItems: [],
    answeredIds: new Set(),
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
      <span class="adv-fg-round-counter" id="adv-fg-round-counter"></span>
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
              <div class="adv-sw-cat-btn adv-sw-cat-choosable" data-cat="${cat.id}">
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
              <p class="adv-fg-clue-text adv-fg-clue-hidden" id="adv-fg-clue-1"></p>
              <p class="adv-fg-clue-text adv-fg-clue-hidden" id="adv-fg-clue-2"></p>
              <p class="adv-fg-clue-text adv-fg-clue-hidden" id="adv-fg-clue-3"></p>
              <div class="adv-fg-significance" id="adv-fg-significance"></div>
            </div>
            <div class="adv-fg-controls" id="adv-fg-controls" style="display: none">
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
  const controlsEl = el.querySelector('#adv-fg-controls')
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

  // ── Jump to Category ──
  // User can tap a sidebar category to skip ahead to items from that category.
  // Reorders the remaining items so that category's unplayed items come next.

  function jumpToCategory(catId) {
    if (state.phase !== 'viewing' && state.phase !== 'feedback') return
    const prog = categoryProgress[catId]
    if (!prog || prog.answered >= prog.total) return

    // Find the first unplayed item from this category in the remaining queue
    const remaining = items.slice(state.round)
    const fromCat = remaining.filter(it => it.categoryId === catId)
    const notFromCat = remaining.filter(it => it.categoryId !== catId)

    if (fromCat.length === 0) return

    // Reorder: put this category's items first, then the rest
    items = [...items.slice(0, state.round), ...fromCat, ...notFromCat]

    // If currently in feedback (waiting for Next), just let them tap Next
    // to see the newly-reordered items. If viewing, load the new round.
    if (state.phase === 'viewing') {
      showRound()
    }
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
      if (!mainEl.isConnected) return
      flash.classList.add('adv-fg-pts-show')
      setTimeout(() => {
        if (!mainEl.isConnected) { flash.remove(); return }
        flash.classList.add('adv-fg-pts-fade')
        setTimeout(() => flash.remove(), 800)
      }, 1200)
    })
  }

  // ── Advance Turn ──

  function advanceTurn() {
    // Hide controls before any popup shows (prevents ghost behind overlay)
    controlsEl.style.display = 'none'

    if (isMultiplayer) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length
    }
    state.round++

    if (state.round >= totalRounds) {
      showCompletion()
      return
    }

    // Check if we crossed a category boundary -> show impact
    const prevItem = items[state.round - 1]
    const nextItem = items[state.round]
    if (selectedCategory === 'all' && prevItem.categoryId !== nextItem.categoryId) {
      if (IMPACT_MESSAGES[prevItem.categoryId] && !state.shownImpactIds.has(prevItem.categoryId)) {
        state.shownImpactIds.add(prevItem.categoryId)
        showCategoryImpact(prevItem.categoryId, () => {
          if (isMultiplayer) {
            showTurnPopup(() => showRound())
          } else {
            showRound()
          }
        })
        return
      }
    }

    if (isMultiplayer) {
      showTurnPopup(() => showRound())
    } else {
      showRound()
    }
  }

  // ── Turn Popup ──

  function showTurnPopup(onDone, text) {
    const p = state.players[state.currentPlayer]
    const label = text || `${p.name}'s Turn`
    const popup = document.createElement('div')
    popup.className = 'adv-sw-turn-popup'
    popup.innerHTML = `
      <div class="adv-sw-turn-content">
        <span class="adv-sw-turn-popup-dot" style="background: ${p.color}"></span>
        <span>${esc(label)}</span>
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
    // Exclude previously answered items from distractors to make choices trickier
    let others = cat.items.filter(it => it.id !== currentItem.id && !state.answeredIds.has(it.id))
    // If not enough distractors after filtering, fall back to full pool
    if (others.length < 3) {
      others = cat.items.filter(it => it.id !== currentItem.id)
    }
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

    const item = items[state.round]
    state.playedCategories.add(item.categoryId)

    // Update topbar + sidebar
    el.querySelector('#adv-fg-round-counter').textContent = `Q${state.round + 1} of ${totalRounds}`
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

    // Preload next image
    if (state.round + 1 < totalRounds) {
      preloadImage(items[state.round + 1].image)
    }

    // Set clues — first clue fades in after a brief delay
    clueEls[0].textContent = item.clues[0]
    clueEls[0].classList.add('adv-fg-clue-hidden')
    clueEls[1].textContent = item.clues[1]
    clueEls[1].classList.add('adv-fg-clue-hidden')
    clueEls[2].textContent = item.clues[2]
    clueEls[2].classList.add('adv-fg-clue-hidden')
    // Fade in first clue after photo loads
    setTimeout(() => clueEls[0].classList.remove('adv-fg-clue-hidden'), 300)

    // Controls
    controlsEl.style.display = ''
    const initialPts = (4 - state.cluesRevealed) * 100
    ptsEl.style.display = ''
    ptsEl.textContent = `${initialPts} pts available`
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

    const item = items[state.round]
    const isCorrect = btnIdx === state.correctIdx
    const buttons = answersEl.querySelectorAll('.adv-fg-answer-btn')

    // Update category progress
    if (categoryProgress[item.categoryId]) {
      categoryProgress[item.categoryId].answered++
      updateCategoryProgress()
    }

    // Disable all answer buttons
    buttons.forEach(btn => { btn.style.pointerEvents = 'none' })

    // Track this item as answered (correct or not) so it won't appear as a distractor
    state.answeredIds.add(item.id)

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

    // Reveal remaining clues with staggered fade-in
    const hiddenClues = clueEls.filter(c => c.classList.contains('adv-fg-clue-hidden'))
    hiddenClues.forEach((c, i) => setTimeout(() => c.classList.remove('adv-fg-clue-hidden'), (i + 1) * 200))

    // Replace controls with Next/Finish button (reuse More Clues button styling)
    ptsEl.style.display = 'none'
    moreCluesBtn.textContent = state.round + 1 >= totalRounds ? 'Finish' : 'Next \u2192'
    moreCluesBtn.style.display = ''
    moreCluesBtn.classList.add('adv-fg-next-mode')

    // Swap handler: remove old revealClue, add advance
    const nextHandler = () => {
      if (cancelled || state.phase === 'complete') return
      moreCluesBtn.removeEventListener('pointerdown', nextHandler)
      moreCluesBtn.classList.remove('adv-fg-next-mode')

      // Check if this is the last item in a single-category game
      if (state.round + 1 >= totalRounds && selectedCategory !== 'all') {
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
    }
    moreCluesBtn.addEventListener('pointerdown', nextHandler)
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

      const maxPts = totalRounds * 300
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
    if (available.length === 0) {
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

  // Category click handlers — tap to jump to that category's items
  el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      if (state.phase !== 'viewing') return
      jumpToCategory(btn.dataset.cat)
    })
  })

  // Quit button in sidebar
  const quitBtn = document.createElement('button')
  quitBtn.className = 'adv-fg-quit-btn'
  quitBtn.textContent = 'Quit'
  el.querySelector('.adv-sw-sidebar').appendChild(quitBtn)
  quitBtn.addEventListener('pointerdown', () => { cancelled = true; showCompletion(true) })

  // ── Initialize ──

  updateTurnDisplay()
  updateScores()
  updateCategoryProgress()

  if (isMultiplayer) {
    const firstName = state.players[state.currentPlayer].name
    setTimeout(() => showTurnPopup(() => showRound(), `${firstName} goes first!`), 400)
  } else {
    showRound()
  }

  return el
}

// ─── EXPORT ───

export function createAdvancedFieldGuideGame() {
  return createIntroScreen()
}
