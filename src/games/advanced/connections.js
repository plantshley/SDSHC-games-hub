/**
 * Advanced Conservation Connections
 * NYT Connections-style grouping game: sort 16 tiles into 4 hidden groups.
 * Dark-themed, multiplayer (1-4 players), multi-round with topic selection.
 */

import { navigate } from '../../router.js'
import {
  PUZZLES, DIFFICULTY_COLORS,
  PLAYER_COLORS, INSTRUCTIONS, RULES, IMPACT_MESSAGES,
} from '../../data/content/advanced/connections.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { typewriter } from '../../utils/typewriter.js'
import { shuffleArray, transitionTo } from '../../utils/game-helpers.js'
import { trackGameStart, trackGameComplete, trackGameQuit, trackTopicSelect } from '../../utils/analytics.js'

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

function esc(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-sw-intro adv-cn-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0] }]
  let selectedTopics = new Set()

  function renderNames() {
    const container = el.querySelector('#adv-cn-names')
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
    const countEl = el.querySelector('#adv-cn-count')
    if (countEl) countEl.textContent = playerCount
    renderNames()
  }

  function updateStartBtn() {
    const btn = el.querySelector('#adv-cn-start')
    if (!btn) return
    const count = selectedTopics.size
    btn.textContent = count > 0 ? `Start Game (${count} round${count > 1 ? 's' : ''})` : 'Select Topics to Start'
    btn.disabled = count === 0
    btn.style.opacity = count === 0 ? '0.4' : '1'
  }

  function renderTopics() {
    el.querySelectorAll('.adv-cn-topic-card[data-id]').forEach(card => {
      card.classList.toggle('selected', selectedTopics.has(card.dataset.id))
    })
    const allBtn = el.querySelector('#adv-cn-all')
    if (allBtn) allBtn.classList.toggle('selected', selectedTopics.size === PUZZLES.length)
    updateStartBtn()
  }

  function randomTopics() {
    selectedTopics.clear()
    const ids = shuffleArray(PUZZLES.map(p => p.id)).slice(0, 3)
    ids.forEach(id => selectedTopics.add(id))
    renderTopics()
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-cn-back">\u2190 Back</button>
        <h1 class="adv-sw-intro-title">Conservation Connections</h1>
      </div>

      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>

      <div class="adv-cn-setup-columns">
        <div class="adv-sw-player-setup">
          <span class="adv-sw-setup-label">Players</span>
          <div class="adv-sw-picker-row">
            <button class="adv-sw-picker-btn" id="adv-cn-minus">\u2212</button>
            <span class="adv-sw-picker-count" id="adv-cn-count">1</span>
            <button class="adv-sw-picker-btn" id="adv-cn-plus">+</button>
          </div>
          <div class="adv-sw-names" id="adv-cn-names"></div>
        </div>

        <div class="adv-cn-topic-column">
          <span class="adv-sw-setup-label">Topics</span>
          <div class="adv-cn-topic-picker">
            ${PUZZLES.map(p => `<button class="adv-cn-topic-card" data-id="${p.id}">${esc(p.title)}</button>`).join('')}
            <button class="adv-cn-random-btn" id="adv-cn-random">Random 3</button>
            <button class="adv-cn-topic-card adv-cn-topic-all" id="adv-cn-all">All</button>
          </div>
        </div>
      </div>

      <button class="adv-sw-start-btn" id="adv-cn-start" disabled>Select Topics to Start</button>
    </div>
  `

  addGradientBackground(el, 'connections')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Conservation Connections', RULES))
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-cn-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-cn-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-cn-plus').addEventListener('pointerdown', () => updateCount(1))

  el.querySelectorAll('.adv-cn-topic-card[data-id]').forEach(card => {
    card.addEventListener('pointerdown', () => {
      const id = card.dataset.id
      if (selectedTopics.has(id)) selectedTopics.delete(id)
      else selectedTopics.add(id)
      renderTopics()
    })
  })

  el.querySelector('#adv-cn-random').addEventListener('pointerdown', () => randomTopics())
  el.querySelector('#adv-cn-all').addEventListener('pointerdown', () => {
    if (selectedTopics.size === PUZZLES.length) {
      selectedTopics.clear()
    } else {
      PUZZLES.forEach(p => selectedTopics.add(p.id))
    }
    renderTopics()
  })

  el.querySelector('#adv-cn-start').addEventListener('pointerdown', () => {
    if (selectedTopics.size === 0) return
    const rounds = shuffleArray([...selectedTopics].map(id => PUZZLES.find(p => p.id === id)))
    trackGameStart('adv-connections', 'advanced', { playerCount: players.length })
    trackTopicSelect('adv-connections', rounds.map(r => r.title))
    transitionTo(el, createGameplayScreen(players, rounds))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players, rounds) {
  const el = document.createElement('div')
  el.className = 'screen adv-cn-game'

  const isMultiplayer = players.length > 1

  const state = {
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    rounds,
    currentRound: 0,
    phase: 'selecting', // selecting | checking | feedback | round-end | complete
    board: [],           // [{text, groupIdx, id}]
    selectedIndices: [], // indices into board
    solvedGroups: [],    // solved group objects for current round
    livesRemaining: 4,
    mistakesThisRound: 0,
    guessHistory: [],    // Array of sorted guess keys to prevent duplicate guesses
    allRoundResults: [],  // [{puzzleId, solved: [], missed: [], perfect}]
    timerStart: 0,
    timerInterval: null,
  }

  const puzzle = () => state.rounds[state.currentRound]

  // Build board from puzzle
  function buildBoard() {
    const p = puzzle()
    const tiles = []
    p.groups.forEach((g, gi) => {
      g.items.forEach(item => {
        tiles.push({ text: item, groupIdx: gi })
      })
    })
    state.board = shuffleArray(tiles)
    state.selectedIndices = []
    state.solvedGroups = []
    state.livesRemaining = 4
    state.mistakesThisRound = 0
    state.guessHistory = []
  }

  // ── DOM refs ──
  let mainEl, gridEl, solvedEl, submitBtn, livesEl
  let timerFill, timerText, timerBar

  // ── Timer ──

  const TURN_TIME = 30

  function startTimer() {
    stopTimer()
    state.timerStart = Date.now()
    updateTimerDisplay()
    state.timerInterval = setInterval(updateTimerDisplay, 100)
  }

  function stopTimer() {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }

  function updateTimerDisplay() {
    if (!timerFill || !timerText || !timerBar) return
    if (!el.parentNode) { stopTimer(); return }
    const elapsed = (Date.now() - state.timerStart) / 1000
    const remaining = Math.max(0, TURN_TIME - elapsed)
    const seconds = Math.ceil(remaining)
    const pct = (remaining / TURN_TIME) * 100

    timerText.textContent = `${seconds}s`
    timerFill.style.width = `${pct}%`

    if (isMultiplayer) {
      timerFill.style.background = state.players[state.currentPlayer].color
      timerBar.classList.remove('adv-tb-timer-green', 'adv-tb-timer-yellow', 'adv-tb-timer-red')
    } else {
      timerFill.style.background = ''
      timerBar.classList.remove('adv-tb-timer-green', 'adv-tb-timer-yellow', 'adv-tb-timer-red')
      if (remaining > 15) timerBar.classList.add('adv-tb-timer-green')
      else if (remaining > 5) timerBar.classList.add('adv-tb-timer-yellow')
      else timerBar.classList.add('adv-tb-timer-red')
    }

    if (remaining <= 0) {
      stopTimer()
      onTimeUp()
    }
  }

  function onTimeUp() {
    if (state.phase !== 'selecting') return
    showToast('Time\u2019s up!', true)
    state.selectedIndices = []
    renderGrid()
    state.livesRemaining--
    state.mistakesThisRound++
    renderLives()

    if (state.livesRemaining <= 0) {
      revealRemaining()
      endRound(false)
    } else {
      advanceTurn()
    }
  }

  // ── Render ──

  function renderSidebar() {
    const roundsContainer = el.querySelector('#adv-cn-rounds')
    if (!roundsContainer) return
    roundsContainer.innerHTML = state.rounds.map((r, i) => {
      let cls = 'adv-tb-round-btn'
      if (i === state.currentRound) cls += ' adv-tb-round-current'
      else if (i < state.currentRound) cls += ' adv-tb-round-complete'
      else cls += ' adv-tb-round-locked'
      return `
        <div class="${cls}">
          <span class="adv-tb-round-num">${i + 1}</span>
          <span class="adv-tb-round-title">${esc(r.title)}</span>
        </div>
      `
    }).join('')
  }

  function renderGrid() {
    const unsolved = state.board.filter((t, i) => !state.solvedGroups.some(g => g.items.includes(t.text)))
    gridEl.innerHTML = unsolved.map((tile, vi) => {
      // Find original index
      const origIdx = state.board.indexOf(tile)
      const selected = state.selectedIndices.includes(origIdx)
      return `<button class="adv-cn-tile${selected ? ' adv-cn-selected' : ''}" data-idx="${origIdx}">${esc(tile.text)}</button>`
    }).join('')

    gridEl.querySelectorAll('.adv-cn-tile').forEach(btn => {
      btn.addEventListener('pointerdown', () => handleTileSelect(parseInt(btn.dataset.idx)))
    })

    // Update submit button
    const count = state.selectedIndices.length
    submitBtn.textContent = count === 4 ? 'Submit' : `Submit (${count}/4)`
    submitBtn.disabled = count !== 4
  }

  function renderSolved() {
    const p = puzzle()
    solvedEl.innerHTML = state.solvedGroups.map(sg => {
      const group = p.groups[sg.groupIdx]
      return `
        <div class="adv-cn-solved-bar" data-diff="${group.difficulty}">
          <div class="adv-cn-solved-category">${esc(group.category)} (difficulty ${group.difficulty} × order ${sg.mult != null ? sg.mult : 0} = ${sg.pts != null ? sg.pts : 0} pts)</div>
          <div class="adv-cn-solved-items">${group.items.map(esc).join(' \u2022 ')}</div>
        </div>
      `
    }).join('')
  }

  function renderLives() {
    livesEl.innerHTML = `<span class="adv-cn-lives-label">Lives</span>` +
      Array.from({ length: 4 }, (_, i) =>
        `<div class="adv-cn-life-dot${i >= state.livesRemaining ? ' lost' : ''}"></div>`
      ).join('')
  }

  function updateScores() {
    state.players.forEach((p, i) => {
      const scoreEl = el.querySelector(`#adv-cn-pscore-${i}`)
      if (scoreEl) scoreEl.textContent = p.score
    })
  }

  function updateTurnDisplay() {
    if (!isMultiplayer) return
    const dot = el.querySelector('#adv-cn-turn-dot')
    const name = el.querySelector('#adv-cn-turn-name')
    if (dot) dot.style.background = state.players[state.currentPlayer].color
    if (name) name.textContent = `${state.players[state.currentPlayer].name}'s Turn`
  }

  // ── Tile selection ──

  function handleTileSelect(idx) {
    if (state.phase !== 'selecting') return
    const pos = state.selectedIndices.indexOf(idx)
    if (pos >= 0) {
      state.selectedIndices.splice(pos, 1)
    } else if (state.selectedIndices.length < 4) {
      state.selectedIndices.push(idx)
    }
    renderGrid()
  }

  // ── Submit guess ──

  function handleSubmit() {
    if (state.phase !== 'selecting' || state.selectedIndices.length !== 4) return
    stopTimer()
    state.phase = 'checking'

    // Check for duplicate guess
    const guessKey = [...state.selectedIndices].sort().join(',')
    if (state.guessHistory.includes(guessKey)) {
      showToast('Already guessed!', false)
      state.phase = 'selecting'
      startTimer()
      return
    }
    state.guessHistory.push(guessKey)

    // Check guess
    const result = checkGuess()

    if (result.correct) {
      handleCorrect(result.groupIdx)
    } else if (result.oneAway) {
      handleWrong(true)
    } else {
      handleWrong(false)
    }
  }

  function checkGuess() {
    const groupCounts = {}
    state.selectedIndices.forEach(i => {
      const g = state.board[i].groupIdx
      groupCounts[g] = (groupCounts[g] || 0) + 1
    })

    for (const [groupIdx, count] of Object.entries(groupCounts)) {
      if (count === 4) return { correct: true, groupIdx: parseInt(groupIdx) }
      if (count === 3) return { correct: false, oneAway: true }
    }
    return { correct: false, oneAway: false }
  }

  // Order-based multipliers: earlier solves worth more (more tiles = harder)
  const ORDER_MULTIPLIERS = [150, 100, 50, 0]

  function handleCorrect(groupIdx) {
    const pz = puzzle()
    const group = pz.groups[groupIdx]
    const solveOrder = state.solvedGroups.length // 0,1,2,3
    const pts = group.difficulty * ORDER_MULTIPLIERS[solveOrder]

    // Animate tiles
    state.selectedIndices.forEach(idx => {
      const tile = gridEl.querySelector(`.adv-cn-tile[data-idx="${idx}"]`)
      if (tile) tile.classList.add('adv-cn-pop')
    })

    state.players[state.currentPlayer].score += pts
    state.solvedGroups.push({ groupIdx, items: group.items, pts, mult: ORDER_MULTIPLIERS[solveOrder] })

    setTimeout(() => {
      state.selectedIndices = []
      updateScores()

      // Show points flash
      showPtsFlash(`+${pts}`, pts > 0)

      // Check if round complete — skip renderSolved/renderGrid, let endRound handle display
      if (state.solvedGroups.length === 4) {
        setTimeout(() => endRound(true), 1200)
      } else {
        renderSolved()
        renderGrid()
        setTimeout(() => advanceTurn(), 1200)
      }
    }, 500)
  }

  function handleWrong(isOneAway) {
    state.livesRemaining--
    state.mistakesThisRound++
    renderLives()

    // Shake selected tiles
    state.selectedIndices.forEach(idx => {
      const tile = gridEl.querySelector(`.adv-cn-tile[data-idx="${idx}"]`)
      if (tile) tile.classList.add('adv-cn-shake')
    })

    if (isOneAway) {
      showToast('One away!', false)
    } else {
      showToast('Incorrect', true)
    }

    setTimeout(() => {
      state.selectedIndices = []
      renderGrid()

      if (state.livesRemaining <= 0) {
        // Mark remaining groups as missed (don't render yet — endRound will show them)
        revealRemaining()
        endRound(false)
      } else {
        advanceTurn()
      }
    }, 1200)
  }

  function revealRemaining() {
    const p = puzzle()
    p.groups.forEach((g, gi) => {
      if (!state.solvedGroups.some(sg => sg.groupIdx === gi)) {
        state.solvedGroups.push({ groupIdx: gi, items: g.items, missed: true })
      }
    })
  }

  // ── Points flash ──

  function showPtsFlash(text, isPositive) {
    const flash = document.createElement('div')
    flash.className = 'adv-fg-pts-flash'
    flash.textContent = text
    if (!isPositive) flash.style.color = 'var(--adv-text-muted)'
    mainEl.appendChild(flash)
    requestAnimationFrame(() => {
      flash.classList.add('adv-fg-pts-show')
      setTimeout(() => {
        flash.classList.add('adv-fg-pts-fade')
        setTimeout(() => flash.remove(), 800)
      }, 800)
    })
  }

  // ── Toast ──

  function showToast(msg, isWrong) {
    const existing = mainEl.querySelector('.adv-cn-toast')
    if (existing) existing.remove()
    const toast = document.createElement('div')
    toast.className = 'adv-cn-toast' + (isWrong ? ' adv-cn-toast-wrong' : '')
    toast.textContent = msg
    mainEl.appendChild(toast)
    setTimeout(() => { if (toast.parentNode) toast.remove() }, 1600)
  }

  // ── Turn management ──

  function advanceTurn() {
    if (!isMultiplayer) {
      state.phase = 'selecting'
      startTimer()
      return
    }
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length
    updateTurnDisplay()
    showTurnPopup(() => { state.phase = 'selecting'; startTimer() }, `${esc(state.players[state.currentPlayer].name)}'s Turn`)
  }

  function showTurnPopup(callback, message) {
    const popup = document.createElement('div')
    popup.className = 'adv-sw-turn-popup'
    const p = state.players[state.currentPlayer]
    popup.innerHTML = `
      <div class="adv-sw-turn-content">
        <span class="adv-sw-turn-popup-dot" style="background: ${p.color}"></span>
        <span>${message}</span>
      </div>
    `
    mainEl.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))

    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => {
        popup.remove()
        callback()
      }, 300)
    }, 1800)
  }

  // ── Round end ──

  function endRound(allSolved) {
    stopTimer()
    state.phase = 'round-end'

    // Record results
    const p = puzzle()
    state.allRoundResults.push({
      puzzleId: p.id,
      puzzleTitle: p.title,
      solved: state.solvedGroups.filter(sg => !sg.missed),
      missed: state.solvedGroups.filter(sg => sg.missed),
      perfect: state.mistakesThisRound === 0,
      groups: p.groups,
    })

    renderSidebar()

    const isLastRound = state.currentRound >= state.rounds.length - 1
    const solvedCount = state.solvedGroups.filter(sg => !sg.missed).length

    // Hide grid and controls, show all groups + next button inline
    gridEl.style.display = 'none'
    el.querySelector('.adv-cn-controls').style.display = 'none'

    // Re-render solved to show all 4 groups (including missed)
    renderSolved()

    // Add round summary + next button below solved bars
    const roundEnd = document.createElement('div')
    roundEnd.className = 'adv-cn-round-end'
    roundEnd.innerHTML = `
      <p class="adv-cn-round-summary">
        ${allSolved ? 'Round Complete!' : 'Round Over'} \u2014 ${solvedCount}/4 groups found
      </p>
      <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-cn-round-next">
        ${isLastRound ? 'See Results' : 'Next Round'}
      </button>
    `
    mainEl.appendChild(roundEnd)

    roundEnd.querySelector('#adv-cn-round-next').addEventListener('pointerdown', () => {
      roundEnd.remove()

      // Hide main panel content behind overlays
      mainEl.style.visibility = 'hidden'

      // Show impact message, then advance
      const impactMsg = IMPACT_MESSAGES[p.id]
      const advance = () => {
        mainEl.style.visibility = ''
        gridEl.style.display = ''
        el.querySelector('.adv-cn-controls').style.display = ''
        if (isLastRound) showCompletion()
        else startNextRound()
      }
      if (impactMsg) {
        showImpactOverlay(impactMsg, advance)
      } else {
        advance()
      }
    })
  }

  function startNextRound() {
    state.currentRound++
    buildBoard()
    state.currentPlayer = Math.floor(Math.random() * state.players.length)
    updateTurnDisplay()
    renderSidebar()
    renderSolved()
    renderGrid()
    renderLives()
    state.phase = 'selecting'

    if (isMultiplayer) {
      showTurnPopup(() => { startTimer() }, `${esc(state.players[state.currentPlayer].name)} goes first!`)
    } else {
      startTimer()
    }
  }

  // ── Shuffle ──

  function shuffleBoard() {
    if (state.phase !== 'selecting') return
    const solvedTexts = new Set(state.solvedGroups.flatMap(sg => sg.items))
    const unsolved = state.board.filter(t => !solvedTexts.has(t.text))
    const solved = state.board.filter(t => solvedTexts.has(t.text))
    shuffleArray(unsolved)
    state.board = [...solved, ...unsolved]
    state.selectedIndices = []
    renderGrid()
  }

  function deselectAll() {
    if (state.phase !== 'selecting') return
    state.selectedIndices = []
    renderGrid()
  }

  // ── Impact overlay ──

  function showImpactOverlay(msg, onDone) {
    const p = puzzle()
    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-impact-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${esc(p.title)}</span>
        <p class="adv-sw-impact-msg">${esc(msg)}</p>
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
    // Hide main panel content behind completion overlay
    mainEl.style.visibility = 'hidden'
    // Clean up any lingering impact overlays
    el.querySelectorAll('.adv-sw-impact-overlay').forEach(o => o.remove())

    // Record current round if quitting mid-round (unsolved groups count as missed)
    if (fromQuit) {
      const p = puzzle()
      const alreadyRecorded = state.allRoundResults.some(r => r.puzzleId === p.id)
      if (!alreadyRecorded) {
        const solvedGroupIdxs = new Set(state.solvedGroups.map(sg => sg.groupIdx))
        const missedGroups = p.groups
          .map((g, gi) => ({ groupIdx: gi, items: g.items, missed: true }))
          .filter(sg => !solvedGroupIdxs.has(sg.groupIdx))
        state.allRoundResults.push({
          puzzleId: p.id,
          puzzleTitle: p.title,
          solved: state.solvedGroups.filter(sg => !sg.missed),
          missed: missedGroups,
          perfect: false,
          groups: p.groups,
        })
      }
    }

    state.phase = 'complete'
    trackGameComplete('adv-connections', 'advanced', { playerCount: state.players.length, score: Math.max(...state.players.map(p => p.score)) })
    const sorted = [...state.players].sort((a, b) => b.score - a.score)
    const winner = sorted[0]
    const isTie = isMultiplayer && sorted.length > 1 && sorted[0].score === sorted[1].score

    let heading
    if (isMultiplayer) {
      heading = isTie ? 'Tie Game!' : `${esc(winner.name)} Wins!`
    } else if (fromQuit) {
      heading = 'Game Over'
    } else {
      heading = 'Great Job!'
    }

    const hasMissed = state.allRoundResults.some(r => r.missed.length > 0)

    const detail = fromQuit
      ? `${state.currentRound + 1}/${state.rounds.length} rounds played`
      : INSTRUCTIONS.completion

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-completion-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">${heading}</h2>
        <p class="adv-sw-completion-detail">${detail}</p>
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
          ${hasMissed ? '<button class="adv-sw-comp-btn" id="adv-cn-review">\u2716 Review Missed</button>' : ''}
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-cn-again">Play Again</button>
          <button class="adv-sw-comp-btn" id="adv-cn-done">Back to Games</button>
        </div>
      </div>
    `
    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-popup-show'))

    overlay.querySelector('#adv-cn-done').addEventListener('pointerdown', () => { cleanup(); navigate('game-select') })
    overlay.querySelector('#adv-cn-again').addEventListener('pointerdown', () => { cleanup(); transitionTo(el, createIntroScreen()) })
    if (hasMissed) {
      overlay.querySelector('#adv-cn-review').addEventListener('pointerdown', () => showReviewOverlay(overlay))
    }
  }

  function showReviewOverlay(parentOverlay) {
    const missedRounds = state.allRoundResults.filter(r => r.missed.length > 0)

    const reviewEl = document.createElement('div')
    reviewEl.className = 'adv-sw-completion-overlay'
    reviewEl.innerHTML = `
      <div class="adv-sw-completion-content adv-review-content">
        <h2 class="adv-sw-completion-heading">Missed Groups</h2>
        <div class="adv-review-list">
          ${missedRounds.map(r => `
            <div class="adv-review-category-group">
              <button class="adv-review-cat-toggle">
                <span class="adv-review-arrow">\u25B6</span>
                ${esc(r.puzzleTitle)} (${r.missed.length})
              </button>
              <div class="adv-review-cat-items">
                ${r.missed.map(sg => {
                  const group = r.groups[sg.groupIdx]
                  return `
                    <div class="adv-review-item">
                      <span class="adv-review-question">${esc(group.category)}</span>
                      <span class="adv-review-answer">${group.items.map(esc).join(' \u2022 ')}</span>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-cn-review-close">\u2190 Back</button>
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

    reviewEl.querySelector('#adv-cn-review-close').addEventListener('pointerdown', () => {
      reviewEl.remove()
      parentOverlay.style.display = ''
    })
  }

  // ── Build layout ──

  el.innerHTML = `
    <div class="adv-sw-topbar">
      <button class="adv-game-topbar-btn" id="adv-cn-home">\u2190 Back</button>
      <h2 class="adv-sw-game-title">Conservation Connections</h2>
      ${isMultiplayer ? `
        <div class="adv-sw-turn-indicator">
          <span class="adv-sw-turn-dot" id="adv-cn-turn-dot"></span>
          <span class="adv-sw-turn-name" id="adv-cn-turn-name"></span>
        </div>
      ` : ''}
    </div>

    <div class="adv-sw-body">
      <div class="adv-sw-sidebar">
        <span class="adv-sw-sidebar-heading">Rounds</span>
        <div class="adv-tb-rounds" id="adv-cn-rounds"></div>

        <div class="adv-sw-sidebar-divider"></div>

        <div class="adv-cn-lives" id="adv-cn-lives"></div>

        <div class="adv-sw-sidebar-divider"></div>

        ${isMultiplayer ? `
          <span class="adv-sw-sidebar-heading">Scores</span>
          <div class="adv-sw-players" id="adv-cn-scores">
            ${state.players.map((p, i) => `
              <div class="adv-sw-player-row" data-player="${i}">
                <span class="adv-sw-player-dot" style="background: ${p.color}"></span>
                <span class="adv-sw-player-name">${esc(p.name)}</span>
                <span class="adv-sw-player-score" id="adv-cn-pscore-${i}">0</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="adv-sw-solo-score">
            <span class="adv-sw-solo-label">Score</span>
            <span class="adv-sw-solo-value" id="adv-cn-pscore-0">0</span>
          </div>
        `}

        <div class="adv-sw-sidebar-divider"></div>

        <button class="adv-sw-quit-btn" id="adv-cn-quit">Quit</button>
      </div>

      <div class="adv-cn-main" id="adv-cn-main">
        <div class="adv-tb-timer-bar" id="adv-cn-timer-bar">
          <div class="adv-tb-timer-fill" id="adv-cn-timer-fill"></div>
          <span class="adv-tb-timer-text" id="adv-cn-timer-text">${TURN_TIME}s</span>
        </div>
        <div class="adv-cn-solved-groups" id="adv-cn-solved"></div>
        <div class="adv-cn-grid" id="adv-cn-grid"></div>
        <div class="adv-cn-controls">
          <button class="adv-cn-ctrl-btn" id="adv-cn-deselect">Deselect All</button>
          <button class="adv-cn-ctrl-btn" id="adv-cn-shuffle">Shuffle</button>
          <button class="adv-cn-ctrl-btn adv-cn-submit" id="adv-cn-submit" disabled>Submit (0/4)</button>
        </div>
      </div>
    </div>
  `

  addGradientBackground(el, 'connections')
  const topbar = el.querySelector('.adv-sw-topbar')
  topbar.appendChild(createHelpButton('Conservation Connections', RULES))
  topbar.appendChild(createThemeToggle())

  // Cache DOM refs
  mainEl = el.querySelector('#adv-cn-main')
  gridEl = el.querySelector('#adv-cn-grid')
  solvedEl = el.querySelector('#adv-cn-solved')
  submitBtn = el.querySelector('#adv-cn-submit')
  livesEl = el.querySelector('#adv-cn-lives')
  timerFill = el.querySelector('#adv-cn-timer-fill')
  timerText = el.querySelector('#adv-cn-timer-text')
  timerBar = el.querySelector('#adv-cn-timer-bar')

  // ── Cleanup ──

  function cleanup() {
    stopTimer()
  }

  // ── Leave confirmation (C16) ──

  function confirmBack() {
    // No progress — leave immediately
    const hasProgress = state.currentRound > 0 || state.solvedGroups.length > 0 || state.mistakesThisRound > 0
    if (!hasProgress) { cleanup(); navigate('game-select'); return }

    stopTimer()
    const prevPhase = state.phase
    state.phase = 'confirm'

    const popup = document.createElement('div')
    popup.className = 'adv-sw-completion-overlay'
    popup.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">Leave Game?</h2>
        <p class="adv-sw-completion-detail">Your progress will be lost.</p>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-cn-stay">Keep Playing</button>
          <button class="adv-sw-comp-btn" id="adv-cn-leave">Leave</button>
        </div>
      </div>
    `
    el.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))

    popup.querySelector('#adv-cn-stay').addEventListener('pointerdown', () => {
      popup.remove()
      state.phase = prevPhase
      if (prevPhase === 'selecting') startTimer()
    })
    popup.querySelector('#adv-cn-leave').addEventListener('pointerdown', () => {
      cleanup()
      navigate('game-select')
    })
  }

  // Wire events
  el.querySelector('#adv-cn-home').addEventListener('pointerdown', () => confirmBack())
  el.querySelector('#adv-cn-deselect').addEventListener('pointerdown', () => deselectAll())
  el.querySelector('#adv-cn-shuffle').addEventListener('pointerdown', () => shuffleBoard())
  submitBtn.addEventListener('pointerdown', () => handleSubmit())
  el.querySelector('#adv-cn-quit').addEventListener('pointerdown', () => { cleanup(); trackGameQuit('adv-connections', 'advanced', state.currentRound); showCompletion(true) })

  // Initialize
  buildBoard()
  renderSidebar()
  renderGrid()
  renderLives()
  updateScores()
  updateTurnDisplay()

  // First player popup
  if (isMultiplayer) {
    state.phase = 'selecting'
    showTurnPopup(() => { startTimer() }, `${esc(state.players[state.currentPlayer].name)} goes first!`)
  } else {
    startTimer()
  }

  return el
}

// ─── EXPORT ───

export function createAdvancedConnectionsGame() {
  return createIntroScreen()
}
