/**
 * Word Game (Wheel of Fortune style)
 * Dark-themed, multiplayer (1-4 players), take turns guessing letters.
 * Solve button lets players guess the full word for bonus points.
 * Configurable round count with option to extend after completion.
 */

import { navigate } from '../../router.js'
import {
  WORDS, MAX_WRONG, PLAYER_COLORS, INSTRUCTIONS, IMPACT_MESSAGES, RULES,
} from '../../data/content/advanced/word-game.js'
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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

// Points
const PTS_LETTER = 50       // per occurrence of a correct consonant
const PTS_COMPLETE = 100    // completing a word via letters
const PTS_SOLVE = 300       // solving the whole word at once
const PTS_WRONG_SOLVE = -100 // penalty for wrong solve attempt

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-wg-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0] }]
  let rounds = 5

  function renderNames() {
    const container = el.querySelector('#adv-wg-names')
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
    el.querySelector('#adv-wg-count').textContent = playerCount
    renderNames()
  }

  function updateRounds(delta) {
    rounds = Math.max(3, Math.min(15, rounds + delta))
    el.querySelector('#adv-wg-rounds').textContent = rounds
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-wg-back">\u2190 Back</button>
        <h1 class="adv-sw-intro-title">Word Game</h1>
      </div>
      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>
      <div class="adv-sw-player-setup">
        <span class="adv-sw-setup-label">Players</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-wg-minus">\u2212</button>
          <span class="adv-sw-picker-count" id="adv-wg-count">1</span>
          <button class="adv-sw-picker-btn" id="adv-wg-plus">+</button>
        </div>
        <div class="adv-sw-names" id="adv-wg-names"></div>

        <span class="adv-sw-setup-label" style="margin-top: 12px">Rounds</span>
        <div class="adv-sw-picker-row">
          <button class="adv-sw-picker-btn" id="adv-wg-rminus">\u2212</button>
          <span class="adv-sw-picker-count" id="adv-wg-rounds">5</span>
          <button class="adv-sw-picker-btn" id="adv-wg-rplus">+</button>
        </div>
      </div>
      <button class="adv-sw-start-btn" id="adv-wg-start">Start Game</button>
    </div>
  `

  addGradientBackground(el, 'word-game')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Word Game', RULES))
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-wg-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-wg-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-wg-plus').addEventListener('pointerdown', () => updateCount(1))
  el.querySelector('#adv-wg-rminus').addEventListener('pointerdown', () => updateRounds(-1))
  el.querySelector('#adv-wg-rplus').addEventListener('pointerdown', () => updateRounds(1))
  el.querySelector('#adv-wg-start').addEventListener('pointerdown', () => {
    transitionTo(el, createGameplayScreen(players, rounds))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players, totalRounds) {
  const el = document.createElement('div')
  el.className = 'screen adv-wg-game'

  const isMultiplayer = players.length > 1
  const wordPool = shuffleArray([...WORDS])

  const state = {
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: Math.floor(Math.random() * players.length),
    wordIdx: 0,
    guessedLetters: new Set(),
    wrongCount: 0,
    phase: 'playing', // playing | solving | revealed | roundEnd | complete
    wordsCompleted: 0,
    wordsTotal: Math.min(wordPool.length, totalRounds),
    totalRounds,
  }

  function currentWord() {
    return wordPool[state.wordIdx]
  }

  // ── Build DOM ──

  el.innerHTML = `
    <div class="adv-sw-topbar">
      <button class="adv-game-topbar-btn" id="adv-wg-home">\u2190 Back</button>
      <h2 class="adv-sw-game-title">Word Game</h2>
      ${isMultiplayer ? `
        <div class="adv-sw-turn-indicator" id="adv-wg-turn">
          <span class="adv-sw-turn-dot" id="adv-wg-turn-dot"></span>
          <span class="adv-sw-turn-name" id="adv-wg-turn-name"></span>
        </div>
      ` : ''}
    </div>

    <div class="adv-wg-body">
      <div class="adv-wg-main" id="adv-wg-main">
        <div class="adv-wg-progress-area">
          <span class="adv-wg-progress-label">Round <span id="adv-wg-word-num">1</span>/${state.wordsTotal}</span>
          <div class="adv-wg-health-bar">
            <div class="adv-wg-health-fill" id="adv-wg-health"></div>
          </div>
          <span class="adv-wg-wrong-count" id="adv-wg-wrong">${MAX_WRONG} guesses left</span>
        </div>

        <div class="adv-wg-clue-area">
          <span class="adv-wg-category" id="adv-wg-category"></span>
          <span class="adv-wg-hint" id="adv-wg-hint"></span>
        </div>

        <div class="adv-wg-blanks" id="adv-wg-blanks"></div>

        <div class="adv-wg-actions">
          <button class="adv-wg-solve-btn" id="adv-wg-solve">\Solve</button>
          <button class="adv-wg-quit-btn" id="adv-wg-quit">Quit</button>
        </div>

        <div class="adv-wg-keyboard" id="adv-wg-keyboard">
          ${ALPHABET.map(l => `
            <button class="adv-wg-key" data-letter="${l}">${l}</button>
          `).join('')}
        </div>

        <div class="adv-wg-scorebar">
          ${state.players.map((p, i) => `
            <div class="adv-jp-score-chip ${i === 0 ? 'adv-jp-chip-active' : ''}" data-player="${i}" id="adv-wg-chip-${i}">
              <span class="adv-jp-chip-dot" style="background: ${p.color}"></span>
              <span class="adv-jp-chip-name">${p.name}</span>
              <span class="adv-jp-chip-score" id="adv-wg-score-${i}">0</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `

  addGradientBackground(el, 'word-game')
  const gameTopbar = el.querySelector('.adv-sw-topbar')
  gameTopbar.appendChild(createHelpButton('Word Game', RULES))
  gameTopbar.appendChild(createThemeToggle())

  // ── DOM refs ──
  const blanksEl = el.querySelector('#adv-wg-blanks')
  const categoryEl = el.querySelector('#adv-wg-category')
  const hintEl = el.querySelector('#adv-wg-hint')
  const healthFill = el.querySelector('#adv-wg-health')
  const wrongText = el.querySelector('#adv-wg-wrong')
  const wordNumEl = el.querySelector('#adv-wg-word-num')
  const keyboard = el.querySelector('#adv-wg-keyboard')
  const solveBtn = el.querySelector('#adv-wg-solve')

  // ── Word Display ──

  function renderWord() {
    const word = currentWord()
    categoryEl.textContent = word.category
    hintEl.textContent = word.hint

    const chars = word.term.split('')
    blanksEl.innerHTML = chars.map((ch, idx) => {
      if (ch === ' ') return '<span class="adv-wg-blank adv-wg-space"></span>'
      const revealed = state.guessedLetters.has(ch) || state.phase === 'revealed'
      return `<span class="adv-wg-blank ${revealed ? 'adv-wg-revealed' : ''}" data-idx="${idx}">${revealed ? ch : ''}</span>`
    }).join('')

    wordNumEl.textContent = state.wordsCompleted + 1
  }

  function updateHealth() {
    const pct = ((MAX_WRONG - state.wrongCount) / MAX_WRONG) * 100
    healthFill.style.width = `${pct}%`

    // Color based on current player in multiplayer, health-based in solo
    const playerColor = state.players[state.currentPlayer].color
    if (isMultiplayer) {
      healthFill.style.background = playerColor
    } else {
      if (pct > 60) healthFill.style.background = '#38cebc'
      else if (pct > 30) healthFill.style.background = '#b8e84a'
      else healthFill.style.background = '#ff6193'
    }

    wrongText.textContent = `${MAX_WRONG - state.wrongCount} guesses left`
  }

  function resetKeyboard() {
    keyboard.querySelectorAll('.adv-wg-key').forEach(key => {
      key.classList.remove('adv-wg-key-correct', 'adv-wg-key-wrong')
      key.disabled = false
    })
  }

  // ── Solve Mode ──

  function enterSolveMode() {
    if (state.phase !== 'playing') return
    state.phase = 'solving'

    const word = currentWord()
    const chars = word.term.split('')

    // Show blanks as tappable input slots — pre-fill already-guessed letters
    blanksEl.innerHTML = chars.map((ch, idx) => {
      if (ch === ' ') return '<span class="adv-wg-blank adv-wg-space"></span>'
      const known = state.guessedLetters.has(ch)
      return `<span class="adv-wg-blank adv-wg-solve-slot ${known ? 'adv-wg-revealed adv-wg-locked' : 'adv-wg-empty'}" data-idx="${idx}" data-expected="${ch}">${known ? ch : ''}</span>`
    }).join('')

    // Hide regular keyboard, show solve keyboard + submit/cancel
    keyboard.style.display = 'none'
    solveBtn.style.display = 'none'

    const solveUI = document.createElement('div')
    solveUI.className = 'adv-wg-solve-area'
    solveUI.id = 'adv-wg-solve-area'
    solveUI.innerHTML = `
      <p class="adv-wg-solve-prompt">Tap a blank, then tap a letter to fill it in</p>
      <div class="adv-wg-keyboard adv-wg-solve-keyboard">
        ${ALPHABET.map(l => `<button class="adv-wg-key adv-wg-solve-key" data-letter="${l}">${l}</button>`).join('')}
      </div>
      <div class="adv-wg-solve-btns">
        <button class="adv-wg-solve-submit" id="adv-wg-solve-submit">\u2714 Submit</button>
        <button class="adv-wg-solve-cancel" id="adv-wg-solve-cancel">\u2716 Cancel</button>
      </div>
    `
    el.querySelector('#adv-wg-main').appendChild(solveUI)

    let activeSlot = null

    // Tap a blank to select it
    blanksEl.querySelectorAll('.adv-wg-solve-slot:not(.adv-wg-locked)').forEach(slot => {
      slot.addEventListener('pointerdown', () => {
        blanksEl.querySelectorAll('.adv-wg-solve-slot').forEach(s => s.classList.remove('adv-wg-slot-active'))
        slot.classList.add('adv-wg-slot-active')
        activeSlot = slot
      })
    })

    // Auto-select first empty slot
    const firstEmpty = blanksEl.querySelector('.adv-wg-solve-slot.adv-wg-empty')
    if (firstEmpty) {
      firstEmpty.classList.add('adv-wg-slot-active')
      activeSlot = firstEmpty
    }

    // Tap a letter on the solve keyboard
    solveUI.querySelectorAll('.adv-wg-solve-key').forEach(key => {
      key.addEventListener('pointerdown', () => {
        if (!activeSlot) return
        activeSlot.textContent = key.dataset.letter
        activeSlot.classList.remove('adv-wg-empty')
        activeSlot.classList.add('adv-wg-filled')

        // Auto-advance to next empty slot
        const allSlots = [...blanksEl.querySelectorAll('.adv-wg-solve-slot:not(.adv-wg-locked)')]
        const curIdx = allSlots.indexOf(activeSlot)
        activeSlot.classList.remove('adv-wg-slot-active')
        const next = allSlots.find((s, i) => i > curIdx && s.classList.contains('adv-wg-empty'))
        if (next) {
          next.classList.add('adv-wg-slot-active')
          activeSlot = next
        } else {
          activeSlot = null
        }
      })
    })

    // Submit guess
    solveUI.querySelector('#adv-wg-solve-submit').addEventListener('pointerdown', () => {
      const slots = [...blanksEl.querySelectorAll('.adv-wg-solve-slot')]
      const guess = slots.map(s => s.textContent || '').join('')
      const answer = chars.filter(c => c !== ' ').join('')

      solveUI.remove()
      keyboard.style.display = ''
      solveBtn.style.display = ''

      if (guess === answer) {
        // Correct solve!
        state.phase = 'revealed'
        state.players[state.currentPlayer].score += PTS_SOLVE
        updateScores()
        renderWord()
        flashMessage('\Solved! +' + PTS_SOLVE + ' pts', '#4ade80')
        setTimeout(() => advanceRound(), 3000)
      } else {
        // Wrong solve — penalty + turn passes
        state.phase = 'playing'
        state.players[state.currentPlayer].score = Math.max(0, state.players[state.currentPlayer].score + PTS_WRONG_SOLVE)
        updateScores()
        renderWord()
        flashMessage('Wrong! ' + PTS_WRONG_SOLVE + ' pts', '#ff6193')

        if (isMultiplayer) {
          state.currentPlayer = (state.currentPlayer + 1) % state.players.length
          updateTurnDisplay()
          updateHealth()
        }
      }
    })

    // Cancel
    solveUI.querySelector('#adv-wg-solve-cancel').addEventListener('pointerdown', () => {
      solveUI.remove()
      keyboard.style.display = ''
      solveBtn.style.display = ''
      state.phase = 'playing'
      renderWord()
    })
  }

  function flashMessage(text, color) {
    const msg = document.createElement('div')
    msg.className = 'adv-wg-flash'
    msg.textContent = text
    msg.style.color = color
    el.querySelector('#adv-wg-main').appendChild(msg)
    requestAnimationFrame(() => msg.classList.add('adv-wg-flash-show'))
    setTimeout(() => {
      msg.classList.remove('adv-wg-flash-show')
      setTimeout(() => msg.remove(), 300)
    }, 1200)
  }

  // ── Guess Handling ──

  function handleGuess(letter) {
    if (state.phase !== 'playing') return

    state.guessedLetters.add(letter)
    const word = currentWord()
    const termLetters = word.term.replace(/\s/g, '')

    const keyBtn = keyboard.querySelector(`.adv-wg-key[data-letter="${letter}"]`)
    if (!keyBtn || keyBtn.disabled) return
    keyBtn.disabled = true

    if (termLetters.includes(letter)) {
      keyBtn.classList.add('adv-wg-key-correct')
      // Vowels reveal for free, only consonants earn points
      if (!VOWELS.has(letter)) {
        const occurrences = word.term.split('').filter(c => c === letter).length
        state.players[state.currentPlayer].score += occurrences * PTS_LETTER
        updateScores()
      }
    } else {
      keyBtn.classList.add('adv-wg-key-wrong')
      state.wrongCount++
      updateHealth()

      if (isMultiplayer) {
        state.currentPlayer = (state.currentPlayer + 1) % state.players.length
        updateTurnDisplay()
        updateHealth()
      }
    }

    renderWord()

    // Check if word is complete
    const uniqueLetters = new Set(termLetters.split(''))
    const allGuessed = [...uniqueLetters].every(l => state.guessedLetters.has(l))

    if (allGuessed) {
      state.phase = 'revealed'
      state.players[state.currentPlayer].score += PTS_COMPLETE
      updateScores()
      renderWord()
      flashMessage('\u2714 Complete! +' + PTS_COMPLETE + ' pts', '#4ade80')
      setTimeout(() => advanceRound(), 1800)
    } else if (state.wrongCount >= MAX_WRONG) {
      state.phase = 'revealed'
      renderWord()
      flashMessage('Out of guesses!', '#ff6193')
      setTimeout(() => advanceRound(), 2000)
    }
  }

  function advanceRound() {
    state.wordsCompleted++

    if (state.wordsCompleted >= state.wordsTotal) {
      showRoundEndPrompt()
      return
    }

    startNewWord()
  }

  function startNewWord() {
    state.wordIdx++
    if (state.wordIdx >= wordPool.length) {
      showCompletion()
      return
    }
    state.guessedLetters = new Set()
    state.wrongCount = 0
    state.phase = 'playing'

    resetKeyboard()
    updateHealth()
    renderWord()
  }

  // ── Round End Prompt ──

  function showRoundEndPrompt() {
    state.phase = 'roundEnd'

    const canContinue = state.wordIdx < wordPool.length - 1
    const prompt = document.createElement('div')
    prompt.className = 'adv-sw-completion-overlay'
    prompt.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">${state.wordsTotal} Rounds Complete!</h2>
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
          ${canContinue ? `<button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-wg-more">Play More Rounds</button>` : ''}
          <button class="adv-sw-comp-btn ${canContinue ? '' : 'adv-sw-comp-primary'}" id="adv-wg-finish">End Game</button>
        </div>
      </div>
    `
    el.appendChild(prompt)
    requestAnimationFrame(() => prompt.classList.add('adv-sw-popup-show'))

    if (canContinue) {
      prompt.querySelector('#adv-wg-more').addEventListener('pointerdown', () => {
        prompt.classList.remove('adv-sw-popup-show')
        setTimeout(() => {
          prompt.remove()
          // Add 5 more rounds
          const extra = Math.min(5, wordPool.length - state.wordIdx - 1)
          state.wordsTotal += extra
          state.phase = 'playing'
          startNewWord()
        }, 300)
      })
    }

    prompt.querySelector('#adv-wg-finish').addEventListener('pointerdown', () => {
      prompt.classList.remove('adv-sw-popup-show')
      setTimeout(() => {
        prompt.remove()
        showCompletion()
      }, 300)
    })
  }

  // ── Scores ──

  function updateScores() {
    state.players.forEach((p, i) => {
      const scoreEl = el.querySelector(`#adv-wg-score-${i}`)
      if (scoreEl) scoreEl.textContent = p.score
    })
  }

  function updateTurnDisplay() {
    if (!isMultiplayer) return
    const p = state.players[state.currentPlayer]
    const dot = el.querySelector('#adv-wg-turn-dot')
    const name = el.querySelector('#adv-wg-turn-name')
    if (dot) dot.style.background = p.color
    if (name) name.textContent = `${p.name}'s Turn`

    el.querySelectorAll('.adv-jp-score-chip').forEach((chip, i) => {
      chip.classList.toggle('adv-jp-chip-active', i === state.currentPlayer)
    })
  }

  // ── Impact Overlay ──

  function showImpactOverlay(onDone) {
    const categories = [...new Set(wordPool.slice(0, state.wordsCompleted).map(w => w.category))]
    const available = categories.filter(c => IMPACT_MESSAGES[c])
    if (available.length === 0) { onDone(); return }

    const cat = available[Math.floor(Math.random() * available.length)]
    const msg = IMPACT_MESSAGES[cat]

    const impactEl = document.createElement('div')
    impactEl.className = 'adv-sw-impact-overlay'
    impactEl.innerHTML = `
      <div class="adv-sw-impact-content">
        <span class="adv-sw-impact-label">Did You Know?</span>
        <span class="adv-sw-impact-cat">${cat}</span>
        <p class="adv-sw-impact-msg">${msg}</p>
        <span class="adv-sw-impact-dismiss">Tap to continue</span>
      </div>
    `
    el.appendChild(impactEl)
    requestAnimationFrame(() => impactEl.classList.add('adv-sw-impact-show'))

    const dismiss = () => {
      impactEl.classList.remove('adv-sw-impact-show')
      setTimeout(() => { impactEl.remove(); onDone() }, 300)
    }
    impactEl.addEventListener('pointerdown', dismiss)
    setTimeout(dismiss, 8000)
  }

  // ── Completion ──

  function showCompletion(fromQuit = false) {
    state.phase = 'complete'

    showImpactOverlay(() => {
      let heading
      if (fromQuit) {
        heading = 'Results'
      } else if (isMultiplayer) {
        const sorted = [...state.players].sort((a, b) => b.score - a.score)
        heading = sorted[0].score === sorted[1]?.score ? 'Tie Game!' : `${sorted[0].name} Wins!`
      } else {
        heading = 'Great Job!'
      }

      const completionEl = document.createElement('div')
      completionEl.className = 'adv-sw-completion-overlay'
      completionEl.innerHTML = `
        <div class="adv-sw-completion-content">
          <h2 class="adv-sw-completion-heading">${heading}</h2>
          <p class="adv-sw-completion-detail">${fromQuit ? `${state.wordsCompleted}/${state.wordsTotal} rounds` : INSTRUCTIONS.completion}</p>
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
            <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-wg-again">Play Again</button>
            <button class="adv-sw-comp-btn" id="adv-wg-home2">Back to Games</button>
          </div>
        </div>
      `

      el.appendChild(completionEl)
      requestAnimationFrame(() => completionEl.classList.add('adv-sw-popup-show'))

      completionEl.querySelector('#adv-wg-again').addEventListener('pointerdown', () => {
        transitionTo(el, createIntroScreen())
      })
      completionEl.querySelector('#adv-wg-home2').addEventListener('pointerdown', () => {
        navigate('game-select')
      })
    })
  }

  // ── Event Bindings ──

  el.querySelector('#adv-wg-home').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-wg-quit').addEventListener('pointerdown', () => showCompletion(true))
  solveBtn.addEventListener('pointerdown', () => enterSolveMode())

  keyboard.querySelectorAll('.adv-wg-key').forEach(key => {
    key.addEventListener('pointerdown', () => handleGuess(key.dataset.letter))
  })

  // ── Initialize ──

  updateTurnDisplay()
  updateHealth()
  renderWord()

  return el
}

// ─── EXPORT ───

export function createAdvancedWordGame() {
  return createIntroScreen()
}
