/**
 * Farm World — 3D farm explorer (Advanced Mode).
 *
 * A Coastal World-inspired explorable 3D farm. The player walks a mascot
 * around a low-poly island and visits 7 stations, each teaching one soil
 * health topic (content sourced from the existing Advanced Mode games).
 * Answering a station's questions "restores" that corner of the farm.
 *
 * Not in the game grid or leaderboard — launched from the 𖧧 button in the
 * advanced game-select header. Single-player, no score recording.
 */

import '../../../styles/farm-world.css'

import { navigate } from '../../../router.js'
import { onTap } from '../../../utils/tap.js'
import { addGradientBackground } from '../../../utils/gradient-bg.js'
import { createThemeToggle } from '../../../utils/theme-toggle.js'
import { createHelpButton } from '../../../utils/help-overlay.js'
import { typewriter } from '../../../utils/typewriter.js'
import { shuffleArray, transitionTo } from '../../../utils/game-helpers.js'
import { mountNarrowGate } from '../../../utils/narrow-gate.js'
import { trackGameStart, trackGameComplete, trackGameQuit } from '../../../utils/analytics.js'
import { STATIONS, QUESTIONS_PER_STATION, INSTRUCTIONS, RULES } from '../../../data/content/advanced/farm-world.js'
import { createFarmWorld } from './world.js'
import { createJoystick, createKeyboardInput } from './controls.js'

const GAME_ID = 'adv-farm-world'
const POINTS_FIRST_TRY = 100
const POINTS_SECOND_TRY = 50

// ── Player look (customizer) ──

const LOOK_KEY = 'sdshc-fw-look'
const LOOK_DEFAULT = { body: 0xb9b0e6, hat: 'beanie', hatColor: 0xf2cf3e, shoes: 0x4a7fe0, pack: 0x5a8ff0 }
const BODY_COLORS = [0xb9b0e6, 0x92dbb4, 0xf2a3b0, 0x8fc9f5, 0xf5d98f, 0xf0eee8]
const HAT_COLORS = [0xf2cf3e, 0xe0596e, 0x38cebc, 0x3b4a8c, 0xe87fae, 0x5cc257]
const SHOE_COLORS = [0x4a7fe0, 0xe0596e, 0x3a3a3f, 0xf2cf3e]
const PACK_COLORS = [0x5a8ff0, 0xe0784a, 0x5cc257, 0x8f6ae0]
const HAT_STYLES = [['beanie', 'Beanie'], ['straw', 'Straw Hat'], ['none', 'No Hat']]

function loadLook() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOOK_KEY))
    if (raw && typeof raw === 'object') return { ...LOOK_DEFAULT, ...raw }
  } catch { /* corrupted or unavailable — fall through to the default */ }
  return { ...LOOK_DEFAULT }
}

function saveLook(look) {
  try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)) } catch { /* look just won't persist */ }
}

function esc(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}

/** Shuffle a question's choices, re-pointing the correct index. */
function shuffledQuestion(q) {
  const order = shuffleArray(q.choices.map((_, i) => i))
  return {
    text: q.text,
    choices: order.map(i => q.choices[i]),
    correct: order.indexOf(q.correct),
  }
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-sw-intro adv-fw-intro'

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-fw-back">← Back</button>
        <h1 class="adv-sw-intro-title">Farm World</h1>
      </div>

      <p class="adv-sw-intro-desc">${esc(INSTRUCTIONS.intro)}</p>

      <div class="adv-fw-intro-features">
        <div class="adv-fw-feature">
          <span class="adv-fw-feature-icon">✛</span>
          <span class="adv-fw-feature-title">Walk</span>
          <span class="adv-fw-feature-desc">Stroll the farm with the joystick or WASD / arrow keys</span>
        </div>
        <div class="adv-fw-feature">
          <span class="adv-fw-feature-icon">◈</span>
          <span class="adv-fw-feature-title">Explore</span>
          <span class="adv-fw-feature-desc">Find the 7 glowing stations around the farm</span>
        </div>
        <div class="adv-fw-feature">
          <span class="adv-fw-feature-icon">☘</span>
          <span class="adv-fw-feature-title">Restore</span>
          <span class="adv-fw-feature-desc">Answer soil health questions to bring the farm back to life</span>
        </div>
      </div>

      <button class="adv-sw-start-btn" id="adv-fw-start">Start Exploring</button>
    </div>
  `

  addGradientBackground(el, 'farm-world')
  const topbar = el.querySelector('.adv-sw-intro-topbar')
  topbar.appendChild(createHelpButton('Farm World', RULES))
  topbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  onTap(el.querySelector('#adv-fw-back'), () => navigate('game-select'))
  onTap(el.querySelector('#adv-fw-start'), () => {
    trackGameStart(GAME_ID, 'advanced', { playerCount: 1 })
    transitionTo(el, createWorldScreen())
  })

  return el
}

// ─── WORLD SCREEN ───

function createWorldScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-fw-world'
  mountNarrowGate(el)

  // Per-run state: sample and shuffle each station's questions
  const runStations = STATIONS.map(def => ({
    def,
    questions: shuffleArray([...def.questions]).slice(0, QUESTIONS_PER_STATION).map(shuffledQuestion),
    completed: false,
  }))
  const totalStations = runStations.length
  const totalQuestions = totalStations * QUESTIONS_PER_STATION

  let score = 0
  let firstTryCorrect = 0
  let completedCount = 0
  let overlayOpen = false
  let customizerOpen = false
  let nearId = null
  let finished = false
  const look = loadLook()

  el.innerHTML = `
    <div class="adv-fw-canvas" id="adv-fw-canvas"></div>

    <div class="adv-sw-topbar adv-fw-topbar">
      <button class="adv-game-topbar-btn" id="adv-fw-home">← Back</button>
      <h2 class="adv-sw-game-title">Farm World</h2>
    </div>

    <div class="adv-fw-meter">
      <span class="adv-fw-meter-label">Soil Health</span>
      <div class="adv-fw-meter-bar"><div class="adv-fw-meter-fill" id="adv-fw-fill"></div></div>
      <div class="adv-fw-meter-row">
        <span id="adv-fw-count">0/${totalStations} restored</span>
        <span id="adv-fw-score">0 pts</span>
      </div>
    </div>

    <div class="adv-fw-prompt" id="adv-fw-prompt">
      <span class="adv-fw-prompt-name" id="adv-fw-prompt-name"></span>
      <button class="adv-fw-prompt-btn" id="adv-fw-visit">Visit</button>
      <span class="adv-fw-prompt-key">or press E</span>
    </div>

    <div class="adv-fw-keys-hint">WASD / arrow keys to walk</div>
  `

  const topbar = el.querySelector('.adv-fw-topbar')
  topbar.appendChild(createHelpButton('Farm World', RULES))
  const camResetBtn = document.createElement('button')
  camResetBtn.className = 'adv-help-btn adv-fw-topbar-btn'
  camResetBtn.textContent = '⊙'
  camResetBtn.title = 'Reset view'
  topbar.appendChild(camResetBtn)
  const customizeBtn = document.createElement('button')
  customizeBtn.className = 'adv-help-btn adv-fw-topbar-btn'
  customizeBtn.textContent = '☺'
  customizeBtn.title = 'Customize your explorer'
  topbar.appendChild(customizeBtn)
  // In the world, the theme-toggle slot switches the WORLD's time of day
  // instead of the app theme (the in-world HUD is theme-invariant white).
  // Same class as the app toggle so it inherits the round style + placement.
  const dayNightBtn = document.createElement('button')
  dayNightBtn.className = 'adv-theme-toggle adv-fw-topbar-btn'
  dayNightBtn.textContent = '☾'
  dayNightBtn.title = 'Switch to night'
  let isNight = false
  topbar.appendChild(dayNightBtn)

  const promptEl = el.querySelector('#adv-fw-prompt')
  const promptName = el.querySelector('#adv-fw-prompt-name')

  // ── Input + 3D world ──

  const input = { x: 0, y: 0 }
  const joystick = createJoystick(input)
  el.appendChild(joystick.el)
  const disposeKeyboard = createKeyboardInput(input)

  // The global idle timer resets on discrete events (pointerdown/move,
  // keydown). A held key auto-repeats keydown, but a touch held perfectly
  // still on the joystick emits nothing — so while input is active, ping a
  // synthetic pointermove occasionally to keep an actively-driving player
  // from being idle-reset mid-game.
  let lastIdlePing = 0
  function getInput() {
    if ((input.x !== 0 || input.y !== 0) && Date.now() - lastIdlePing > 20000) {
      lastIdlePing = Date.now()
      document.dispatchEvent(new Event('pointermove'))
    }
    return input
  }

  let world = null
  try {
    world = createFarmWorld({
      host: el.querySelector('#adv-fw-canvas'),
      stationIds: runStations.map(s => s.def.id),
      getInput,
      onNearStation: (id) => {
        nearId = id
        if (id && !overlayOpen && !customizerOpen) {
          const station = runStations.find(s => s.def.id === id)
          promptName.textContent = station ? station.def.name : ''
          promptEl.classList.add('adv-fw-prompt-show')
        } else {
          promptEl.classList.remove('adv-fw-prompt-show')
        }
      },
      onDisposed: () => {
        disposeKeyboard()
        window.removeEventListener('keydown', onInteractKey)
      },
    })
  } catch (err) {
    console.error('Farm World: WebGL init failed', err)
    disposeKeyboard()
    // If the renderer got as far as creating a canvas before throwing,
    // release its GPU context rather than leaking it.
    const canvas = el.querySelector('#adv-fw-canvas canvas')
    if (canvas) {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      const lose = gl && gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
      canvas.remove()
    }
    el.innerHTML = `
      <div class="adv-fw-fallback">
        <h2>3D isn’t available on this device</h2>
        <p>Farm World needs WebGL to run. Try another browser or device.</p>
        <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-fw-fallback-back">← Back to Games</button>
      </div>
    `
    onTap(el.querySelector('#adv-fw-fallback-back'), () => navigate('game-select'))
    return el
  }

  world.applyLook(look)

  // ── Player customizer ──

  function openCustomizer() {
    if (customizerOpen || overlayOpen) return
    customizerOpen = true
    el.classList.add('adv-fw-customizing')
    world.setMovementEnabled(false)
    world.setCustomizeFocus(true)
    promptEl.classList.remove('adv-fw-prompt-show')

    const panel = document.createElement('div')
    panel.className = 'adv-fw-custom'
    el.appendChild(panel)

    const hex = c => '#' + c.toString(16).padStart(6, '0')
    const applyAndRender = () => {
      saveLook(look)
      world.applyLook(look)
      render()
    }

    function swatchRow(label, colors, key) {
      const row = document.createElement('div')
      row.className = 'adv-fw-custom-row'
      const lab = document.createElement('span')
      lab.className = 'adv-fw-custom-label'
      lab.textContent = label
      row.appendChild(lab)
      colors.forEach(c => {
        const b = document.createElement('button')
        b.className = 'adv-fw-swatch' + (look[key] === c ? ' adv-fw-swatch-active' : '')
        b.style.background = hex(c)
        b.title = `${label}: ${hex(c)}`
        onTap(b, () => { look[key] = c; applyAndRender() })
        row.appendChild(b)
      })
      return row
    }

    function chipRow(label, options, key) {
      const row = document.createElement('div')
      row.className = 'adv-fw-custom-row'
      const lab = document.createElement('span')
      lab.className = 'adv-fw-custom-label'
      lab.textContent = label
      row.appendChild(lab)
      options.forEach(([value, name]) => {
        const b = document.createElement('button')
        b.className = 'adv-fw-chip' + (look[key] === value ? ' adv-fw-chip-active' : '')
        b.textContent = name
        onTap(b, () => { look[key] = value; applyAndRender() })
        row.appendChild(b)
      })
      return row
    }

    function render() {
      panel.innerHTML = ''
      panel.appendChild(chipRow('Hat', HAT_STYLES, 'hat'))
      panel.appendChild(swatchRow('Hat color', HAT_COLORS, 'hatColor'))
      panel.appendChild(swatchRow('Body', BODY_COLORS, 'body'))
      panel.appendChild(swatchRow('Shoes', SHOE_COLORS, 'shoes'))
      panel.appendChild(swatchRow('Backpack', PACK_COLORS, 'pack'))

      const foot = document.createElement('div')
      foot.className = 'adv-fw-custom-foot'
      const randomBtn = document.createElement('button')
      randomBtn.className = 'adv-fw-chip'
      randomBtn.textContent = '⚄ Random'
      onTap(randomBtn, () => {
        look.hat = pickFrom(HAT_STYLES)[0]
        look.hatColor = pickFrom(HAT_COLORS)
        look.body = pickFrom(BODY_COLORS)
        look.shoes = pickFrom(SHOE_COLORS)
        look.pack = pickFrom(PACK_COLORS)
        applyAndRender()
      })
      const doneBtn = document.createElement('button')
      doneBtn.className = 'adv-fw-card-btn adv-fw-custom-done'
      doneBtn.textContent = '✓ Done'
      onTap(doneBtn, closeCustomizer)
      foot.appendChild(randomBtn)
      foot.appendChild(doneBtn)
      panel.appendChild(foot)
    }

    function closeCustomizer() {
      customizerOpen = false
      el.classList.remove('adv-fw-customizing')
      panel.remove()
      world.setCustomizeFocus(false)
      world.setMovementEnabled(true)
      // re-show the prompt if still parked at an unfinished station
      if (nearId) {
        const near = runStations.find(s => s.def.id === nearId)
        if (near && !near.completed) {
          promptName.textContent = near.def.name
          promptEl.classList.add('adv-fw-prompt-show')
        }
      }
    }

    render()
  }

  const pickFrom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  // ── HUD updates ──

  function updateMeter() {
    el.querySelector('#adv-fw-fill').style.width = `${(completedCount / totalStations) * 100}%`
    el.querySelector('#adv-fw-count').textContent = `${completedCount}/${totalStations} restored`
    el.querySelector('#adv-fw-score').textContent = `${score} pts`
  }

  // ── Station overlay: lesson → questions → fact ──

  function openStation(stationRun) {
    if (overlayOpen || stationRun.completed) return
    overlayOpen = true
    world.setMovementEnabled(false)
    promptEl.classList.remove('adv-fw-prompt-show')

    const { def, questions } = stationRun
    const overlay = document.createElement('div')
    overlay.className = 'adv-fw-overlay'
    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-fw-overlay-show'))

    function renderCard(inner) {
      overlay.innerHTML = `<div class="adv-fw-card">${inner}</div>`
    }

    function showLesson() {
      renderCard(`
        <button class="adv-fw-card-close" id="adv-fw-card-close" title="Not now">✕</button>
        <span class="adv-fw-card-tag">${esc(def.tag)}</span>
        <h2 class="adv-fw-card-title">${esc(def.name)}</h2>
        <p class="adv-fw-card-lesson">${esc(def.lesson)}</p>
        <button class="adv-fw-card-btn" id="adv-fw-lesson-next">Quiz Me</button>
      `)
      onTap(overlay.querySelector('#adv-fw-lesson-next'), () => showQuestion(0))
      // Escape hatch for accidental visits — only on the lesson phase; once
      // the questions start, the station plays out to the end.
      onTap(overlay.querySelector('#adv-fw-card-close'), () => closeOverlay())
    }

    function showQuestion(qi) {
      const q = questions[qi]
      let attempts = 0
      let answered = false

      renderCard(`
        <span class="adv-fw-card-tag">${esc(def.name)} • Question ${qi + 1} of ${questions.length}</span>
        <p class="adv-fw-card-question">${esc(q.text)}</p>
        <div class="adv-fw-choices">
          ${q.choices.map((c, i) => `<button class="adv-fw-choice" data-i="${i}">${esc(c)}</button>`).join('')}
        </div>
        <p class="adv-fw-card-feedback" id="adv-fw-feedback"></p>
      `)

      const feedback = overlay.querySelector('#adv-fw-feedback')
      const next = () => (qi + 1 < questions.length ? showQuestion(qi + 1) : showFact())

      overlay.querySelectorAll('.adv-fw-choice').forEach(btn => {
        onTap(btn, () => {
          if (answered || btn.disabled) return
          const i = parseInt(btn.dataset.i, 10)

          if (i === q.correct) {
            answered = true
            btn.classList.add('adv-fw-choice-correct')
            const pts = attempts === 0 ? POINTS_FIRST_TRY : POINTS_SECOND_TRY
            if (attempts === 0) firstTryCorrect++
            score += pts
            updateMeter()
            feedback.textContent = `Correct! +${pts} pts`
            feedback.className = 'adv-fw-card-feedback adv-fw-feedback-good'
            setTimeout(next, 1100)
            return
          }

          attempts++
          btn.classList.add('adv-fw-choice-wrong')
          btn.disabled = true
          if (attempts === 1) {
            feedback.textContent = 'Not quite — try again for half points.'
            feedback.className = 'adv-fw-card-feedback adv-fw-feedback-bad'
          } else {
            answered = true
            const correctBtn = overlay.querySelector(`.adv-fw-choice[data-i="${q.correct}"]`)
            if (correctBtn) correctBtn.classList.add('adv-fw-choice-correct')
            feedback.textContent = 'The correct answer is highlighted.'
            feedback.className = 'adv-fw-card-feedback adv-fw-feedback-bad'
            setTimeout(next, 1800)
          }
        })
      })
    }

    function showFact() {
      renderCard(`
        <span class="adv-fw-card-tag">Did You Know?</span>
        <h2 class="adv-fw-card-title">${esc(def.name)}</h2>
        <p class="adv-fw-card-lesson">${esc(def.fact)}</p>
        <button class="adv-fw-card-btn" id="adv-fw-restore">✦ Restore</button>
      `)
      onTap(overlay.querySelector('#adv-fw-restore'), () => {
        completeStation(stationRun) // marks completed before closeOverlay checks it
        closeOverlay()
      })
    }

    function closeOverlay() {
      overlay.classList.remove('adv-fw-overlay-show')
      setTimeout(() => overlay.remove(), 300)
      overlayOpen = false
      world.setMovementEnabled(true)
      // Re-show the prompt if the player is still parked at an unfinished
      // station (proximity hasn't changed, so onNearStation won't re-fire).
      if (nearId) {
        const near = runStations.find(s => s.def.id === nearId)
        if (near && !near.completed) {
          promptName.textContent = near.def.name
          promptEl.classList.add('adv-fw-prompt-show')
        }
      }
    }

    showLesson()
  }

  function completeStation(stationRun) {
    if (stationRun.completed) return
    stationRun.completed = true
    completedCount++
    updateMeter()

    // Record completion the moment the last station is done — not when the
    // overlay shows — so backing out during the restore animation still counts.
    if (completedCount === totalStations && !finished) {
      finished = true
      trackGameComplete(GAME_ID, 'advanced', { playerCount: 1, score })
    }

    world.upgradeStation(stationRun.def.id, () => {
      showRestoredToast(stationRun.def.restoredLabel)
      if (completedCount === totalStations) {
        setTimeout(showCompletion, 1600)
      }
    })
  }

  function showRestoredToast(text) {
    const toast = document.createElement('div')
    toast.className = 'adv-fw-toast'
    toast.textContent = text
    el.appendChild(toast)
    requestAnimationFrame(() => toast.classList.add('adv-fw-toast-show'))
    setTimeout(() => {
      toast.classList.remove('adv-fw-toast-show')
      setTimeout(() => toast.remove(), 400)
    }, 2600)
  }

  // ── Completion ──

  let completionShown = false
  function showCompletion() {
    if (completionShown || !el.isConnected) return
    completionShown = true
    world.setMovementEnabled(false)

    const overlay = document.createElement('div')
    overlay.className = 'adv-sw-completion-overlay'
    overlay.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">Farm Restored!</h2>
        <p class="adv-sw-completion-detail">${esc(INSTRUCTIONS.completion)}</p>
        <div class="adv-sw-completion-scores">
          <div class="adv-sw-completion-row">
            <span class="adv-sw-completion-name">Score</span>
            <span class="adv-sw-completion-pts">${score} pts</span>
          </div>
          <div class="adv-sw-completion-row">
            <span class="adv-sw-completion-name">First-try answers</span>
            <span class="adv-sw-completion-pts">${firstTryCorrect}/${totalQuestions}</span>
          </div>
        </div>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn" id="adv-fw-explore">Keep Exploring</button>
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-fw-again">Play Again</button>
          <button class="adv-sw-comp-btn" id="adv-fw-done">Back to Games</button>
        </div>
      </div>
    `
    el.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('adv-sw-popup-show'))

    onTap(overlay.querySelector('#adv-fw-explore'), () => {
      overlay.classList.remove('adv-sw-popup-show')
      setTimeout(() => overlay.remove(), 300)
      world.setMovementEnabled(true)
    })
    onTap(overlay.querySelector('#adv-fw-again'), () => {
      world.dispose()
      transitionTo(el, createIntroScreen())
    })
    onTap(overlay.querySelector('#adv-fw-done'), () => {
      world.dispose()
      navigate('game-select')
    })
  }

  // ── Back / leave confirmation ──

  function confirmBack() {
    const inProgress = completedCount > 0 && completedCount < totalStations
    if (!inProgress) {
      if (!finished && completedCount === 0) trackGameQuit(GAME_ID, 'advanced', 0)
      world.dispose()
      navigate('game-select')
      return
    }

    world.setMovementEnabled(false)
    const popup = document.createElement('div')
    popup.className = 'adv-sw-completion-overlay'
    popup.innerHTML = `
      <div class="adv-sw-completion-content">
        <h2 class="adv-sw-completion-heading">Leave the Farm?</h2>
        <p class="adv-sw-completion-detail">${completedCount}/${totalStations} stations restored — progress will be lost.</p>
        <div class="adv-sw-completion-btns">
          <button class="adv-sw-comp-btn adv-sw-comp-primary" id="adv-fw-stay">Keep Playing</button>
          <button class="adv-sw-comp-btn" id="adv-fw-leave">Leave</button>
        </div>
      </div>
    `
    el.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))

    onTap(popup.querySelector('#adv-fw-stay'), () => {
      popup.remove()
      if (!overlayOpen && !customizerOpen) world.setMovementEnabled(true)
    })
    onTap(popup.querySelector('#adv-fw-leave'), () => {
      trackGameQuit(GAME_ID, 'advanced', completedCount)
      world.dispose()
      navigate('game-select')
    })
  }

  // ── Interact wiring ──

  function tryInteract() {
    if (!nearId || overlayOpen || customizerOpen) return
    const stationRun = runStations.find(s => s.def.id === nearId)
    if (stationRun) openStation(stationRun)
  }

  function onInteractKey(e) {
    if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
      tryInteract()
    }
  }
  window.addEventListener('keydown', onInteractKey)

  onTap(el.querySelector('#adv-fw-visit'), () => tryInteract())
  onTap(el.querySelector('#adv-fw-home'), () => confirmBack())
  onTap(camResetBtn, () => world.resetCamera())
  onTap(customizeBtn, () => openCustomizer())
  onTap(dayNightBtn, () => {
    isNight = !isNight
    world.setTimeOfDay(isNight ? 'night' : 'day')
    dayNightBtn.textContent = isNight ? '☀' : '☾'
    dayNightBtn.title = isNight ? 'Switch to day' : 'Switch to night'
  })

  updateMeter()
  return el
}

// ─── EXPORT ───

export function createFarmWorldGame() {
  return createIntroScreen()
}

export default createFarmWorldGame
