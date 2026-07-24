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
import { NPCS } from '../../../data/content/advanced/farm-world-npcs.js'
import { createFarmWorld } from './world.js'
import { PROCEDURAL_CUSTOMIZATION_SCHEMA, PROCEDURAL_DEFAULTS } from './procedural-character.js'
import { createJoystick, createKeyboardInput } from './controls.js'

const GAME_ID = 'adv-farm-world'
const POINTS_FIRST_TRY = 100
const POINTS_SECOND_TRY = 50

// ── Player look (customizer) ──

const LOOK_KEY = 'sdshc-fw-look'
// Look lives in sessionStorage, not localStorage: it survives navigating away
// from the game and back (and page reloads) within the same browser tab, but
// resets to the default when the site is fully closed and reopened later.
// Colors are '#rrggbb' strings so the IDE shows inline swatch previews.
// three.js Color.set() accepts them directly (and still accepts old numeric
// values that may linger from before, so the format change is backward-safe).
// `character` picks the explorer: the fairy-worlds doll (default) or the
// farmer mascot (see procedural-character.js). `doll` holds the doll's full
// state (colors/variants/accessories) — null means its built-in defaults.
const LOOK_DEFAULT = { character: 'doll', body: '#e295df', hat: 'beanie', hatColor: '#ff35d0', shoes: '#cd35ff', pack: '#ff7ca8', doll: null }
const BODY_COLORS = ['#b9b0e6', '#92dbb4', '#f2a3b0', '#8fc9f5', '#e295df', '#f5d98f']
const HAT_COLORS = ['#f2cf3e', '#e0596e', '#38cebc', '#3b4a8c', '#ff35d0', '#5cc257']
const SHOE_COLORS = ['#ffa760', '#e0596e', '#3a3a3f', '#f2cf3e', '#cd35ff', '#38cebc']
const PACK_COLORS = ['#5a8ff0', '#e0784a', '#5cc257', '#8f6ae0', '#ff7ca8', '#f2cf3e']
const HAT_STYLES = [['beanie', 'Beanie'], ['straw', 'Straw Hat'], ['none', 'No Hat']]

function loadLook() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(LOOK_KEY))
    if (raw && typeof raw === 'object') return { ...LOOK_DEFAULT, ...raw }
  } catch { /* corrupted or unavailable — fall through to the default */ }
  return { ...LOOK_DEFAULT }
}

function saveLook(look) {
  try { sessionStorage.setItem(LOOK_KEY, JSON.stringify(look)) } catch { /* look just won't persist */ }
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
          <span class="adv-fw-feature-desc">Find the glowing stations across both islands</span>
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
  let nearTarget = null // { type: 'station'|'npc', id } | null
  let finished = false
  const look = loadLook()

  el.innerHTML = `
    <div class="adv-fw-canvas" id="adv-fw-canvas"></div>

    <div class="adv-sw-topbar adv-fw-topbar">
      <button class="adv-game-topbar-btn" id="adv-fw-home">← Back</button>
      <h2 class="adv-sw-game-title">Farm World</h2>
    </div>

    <div class="adv-fw-meter" id="adv-fw-meter">
      <div class="adv-fw-meter-head">
        <span class="adv-fw-meter-label">Soil Health</span>
        <span class="adv-fw-meter-caret">▾</span>
      </div>
      <div class="adv-fw-meter-bar"><div class="adv-fw-meter-fill" id="adv-fw-fill"></div></div>
      <div class="adv-fw-meter-row">
        <span id="adv-fw-count">0/${totalStations} restored</span>
        <span id="adv-fw-score">0 pts</span>
      </div>
      <div class="adv-fw-meter-list" id="adv-fw-meter-list"></div>
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
  // character swap — toggles between the farmer mascot and the doll explorer;
  // sits left of the customizer, which follows whichever character is active.
  // Currently DISABLED: the event only uses the doll explorer. Flip
  // ENABLE_CHARACTER_SWAP back to true to restore the topbar toggle — the swap
  // handler (onTap below) and both characters stay fully wired so it's a
  // one-line re-enable. With it off we also pin the look to the doll so a
  // stale saved 'farmer' look can't strand the player on a hidden character.
  const ENABLE_CHARACTER_SWAP = false
  if (!ENABLE_CHARACTER_SWAP) look.character = 'doll'
  const charBtn = document.createElement('button')
  charBtn.className = 'adv-help-btn adv-fw-topbar-btn'
  charBtn.textContent = '✿'
  charBtn.title = 'Switch character'
  charBtn.classList.toggle('adv-fw-charswap-on', look.character === 'doll')
  if (ENABLE_CHARACTER_SWAP) topbar.appendChild(charBtn)
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
  const promptBtn = el.querySelector('#adv-fw-visit')

  // resolve a proximity target ({type,id}) to its display name + action verb
  function targetInfo(target) {
    if (!target) return null
    if (target.type === 'npc') {
      const npc = NPCS.find(n => n.id === target.id)
      return npc ? { name: npc.name, verb: 'Talk', npc } : null
    }
    const station = runStations.find(s => s.def.id === target.id)
    return station && !station.completed ? { name: station.def.name, verb: 'Visit', station } : null
  }
  function showPromptFor(target) {
    const info = targetInfo(target)
    if (info && !overlayOpen && !customizerOpen) {
      promptName.textContent = info.name
      promptBtn.textContent = info.verb
      promptEl.classList.add('adv-fw-prompt-show')
    } else {
      promptEl.classList.remove('adv-fw-prompt-show')
    }
  }

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
      onNearTarget: (target) => {
        nearTarget = target
        showPromptFor(target)
      },
      onDisposed: () => {
        disposeKeyboard()
        window.removeEventListener('keydown', onInteractKey)
        delete window.fwExportLook
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

  let renderCustomizer = null // live while the panel is open, so the character
                              // toggle can re-render it for the other option set

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

    const applyAndRender = () => {
      saveLook(look)
      world.applyLook(look)
      render()
    }

    function rowShell(label) {
      const row = document.createElement('div')
      row.className = 'adv-fw-custom-row'
      const lab = document.createElement('span')
      lab.className = 'adv-fw-custom-label'
      lab.textContent = label
      row.appendChild(lab)
      return row
    }

    function swatchRow(label, colors, key) {
      const row = rowShell(label)
      colors.forEach(c => {
        const b = document.createElement('button')
        b.className = 'adv-fw-swatch' + (look[key] === c ? ' adv-fw-swatch-active' : '')
        b.style.background = c
        b.title = `${label}: ${c}`
        onTap(b, () => { look[key] = c; applyAndRender() })
        row.appendChild(b)
      })
      return row
    }

    function chipRow(label, options, key) {
      const row = rowShell(label)
      options.forEach(([value, name]) => {
        const b = document.createElement('button')
        b.className = 'adv-fw-chip' + (look[key] === value ? ' adv-fw-chip-active' : '')
        b.textContent = name
        onTap(b, () => { look[key] = value; applyAndRender() })
        row.appendChild(b)
      })
      return row
    }

    function renderFarmerRows() {
      panel.appendChild(chipRow('Hat', HAT_STYLES, 'hat'))
      panel.appendChild(swatchRow('Hat color', HAT_COLORS, 'hatColor'))
      panel.appendChild(swatchRow('Body', BODY_COLORS, 'body'))
      panel.appendChild(swatchRow('Shoes', SHOE_COLORS, 'shoes'))
      panel.appendChild(swatchRow('Backpack', PACK_COLORS, 'pack'))
    }

    // ── Doll rows (fairy-worlds character) — driven by its schema so the
    // panel always matches what the builder supports. Colors use native
    // pickers (any color, exactly like the source game); edits go straight
    // to the character handle and the resulting state is saved on the look. ──

    function colorSphere(name, initial, onChange) {
      const wrap = document.createElement('label')
      wrap.className = 'adv-fw-color'
      const sphere = document.createElement('span')
      sphere.className = 'adv-fw-sphere'
      sphere.style.background = initial
      const input = document.createElement('input')
      input.type = 'color'
      input.value = initial
      input.addEventListener('input', () => {
        sphere.style.background = input.value
        onChange(input.value)
      })
      sphere.appendChild(input)
      const txt = document.createElement('span')
      txt.className = 'adv-fw-color-name'
      txt.textContent = name
      wrap.appendChild(sphere)
      wrap.appendChild(txt)
      return wrap
    }

    function renderDollRows() {
      const doll = world.getDollCharacter()
      const state = doll.getState()
      const commit = () => { look.doll = doll.getState(); saveLook(look) }
      const schema = PROCEDURAL_CUSTOMIZATION_SCHEMA

      const colorRow = rowShell('Colors')
      schema.colors.forEach(({ id, label }) => {
        colorRow.appendChild(colorSphere(label, state.colors[id],
          hex => { doll.setColor(id, hex); commit() }))
      })
      // per-accessory color pickers — visible only while that accessory is worn
      const accSpheres = {}
      schema.accessories.forEach(({ id, label, defaultColor }) => {
        // `lashes` color always tints the eyeline, so its picker stays visible
        // even when the lash accessory is off — it just relabels "lashes"/"eyeline".
        const isLash = id === 'lashes'
        const shownLabel = isLash ? (state.accessories[id] ? 'lashes' : 'eyeline') : label
        const sphere = colorSphere(shownLabel, state.accessoryColors[id] ?? defaultColor,
          hex => { doll.setAccessoryColor(id, hex); commit() })
        sphere.hidden = isLash ? false : !state.accessories[id]
        accSpheres[id] = sphere
        colorRow.appendChild(sphere)
      })
      panel.appendChild(colorRow)

      schema.variants.forEach(({ id, label, options }) => {
        const row = rowShell(label)
        options.forEach(opt => {
          const b = document.createElement('button')
          b.className = 'adv-fw-chip' + (state.variants[id] === opt ? ' adv-fw-chip-active' : '')
          b.textContent = opt
          onTap(b, () => {
            doll.setVariant(id, opt)
            commit()
            row.querySelectorAll('.adv-fw-chip').forEach(c => c.classList.remove('adv-fw-chip-active'))
            b.classList.add('adv-fw-chip-active')
          })
          row.appendChild(b)
        })
        panel.appendChild(row)
      })

      const accRow = rowShell('Accessories')
      schema.accessories.forEach(({ id, label }) => {
        const b = document.createElement('button')
        b.className = 'adv-fw-chip' + (state.accessories[id] ? ' adv-fw-chip-active' : '')
        b.textContent = label
        onTap(b, () => {
          const on = !b.classList.contains('adv-fw-chip-active')
          b.classList.toggle('adv-fw-chip-active', on)
          doll.setAccessory(id, on)
          if (id === 'lashes') {
            // eyeline picker stays visible; only its label flips
            accSpheres[id].querySelector('.adv-fw-color-name').textContent = on ? 'lashes' : 'eyeline'
          } else {
            accSpheres[id].hidden = !on
          }
          commit()
        })
        accRow.appendChild(b)
      })
      panel.appendChild(accRow)
    }

    function randomizeDoll() {
      const doll = world.getDollCharacter()
      const schema = PROCEDURAL_CUSTOMIZATION_SCHEMA
      const randHex = () => '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')
      schema.colors.forEach(({ id }) => doll.setColor(id, randHex()))
      schema.variants.forEach(({ id, options }) => doll.setVariant(id, pickFrom(options)))
      schema.accessories.forEach(({ id }) => {
        doll.setAccessory(id, Math.random() < 0.35)
        doll.setAccessoryColor(id, randHex())
      })
      look.doll = doll.getState()
      saveLook(look)
      render() // refresh chips + spheres to the rolled state
    }

    function render() {
      panel.innerHTML = ''
      if (look.character === 'doll') renderDollRows()
      else renderFarmerRows()

      const foot = document.createElement('div')
      foot.className = 'adv-fw-custom-foot'
      const resetBtn = document.createElement('button')
      resetBtn.className = 'adv-fw-chip'
      resetBtn.textContent = '⟲ Reset'
      onTap(resetBtn, () => {
        if (look.character === 'doll') {
          const doll = world.getDollCharacter()
          doll.applyState(PROCEDURAL_DEFAULTS)
          look.doll = doll.getState()
          saveLook(look)
          render()
          return
        }
        look.hat = LOOK_DEFAULT.hat
        look.hatColor = LOOK_DEFAULT.hatColor
        look.body = LOOK_DEFAULT.body
        look.shoes = LOOK_DEFAULT.shoes
        look.pack = LOOK_DEFAULT.pack
        applyAndRender()
      })
      const randomBtn = document.createElement('button')
      randomBtn.className = 'adv-fw-chip'
      randomBtn.textContent = '⚄ Random'
      onTap(randomBtn, () => {
        if (look.character === 'doll') { randomizeDoll(); return }
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
      foot.appendChild(resetBtn)
      foot.appendChild(randomBtn)
      foot.appendChild(doneBtn)
      panel.appendChild(foot)
    }

    function closeCustomizer() {
      customizerOpen = false
      renderCustomizer = null
      el.classList.remove('adv-fw-customizing')
      panel.remove()
      world.setCustomizeFocus(false)
      world.setMovementEnabled(true)
      // re-show the prompt if still parked at an interactable
      showPromptFor(nearTarget)
    }

    render()
    renderCustomizer = render
  }

  const pickFrom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  // ── HUD updates ──

  function updateMeter() {
    el.querySelector('#adv-fw-fill').style.width = `${(completedCount / totalStations) * 100}%`
    el.querySelector('#adv-fw-count').textContent = `${completedCount}/${totalStations} restored`
    el.querySelector('#adv-fw-score').textContent = `${score} pts`
    // the tap-to-open dropdown: which stations are restored so far
    el.querySelector('#adv-fw-meter-list').innerHTML = runStations.map(s => `
      <div class="adv-fw-meter-item${s.completed ? ' adv-fw-meter-item-done' : ''}">
        <span class="adv-fw-meter-check">${s.completed ? '✓' : '○'}</span>${esc(s.def.name)}
      </div>`).join('')
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
      // station (proximity hasn't changed, so onNearTarget won't re-fire).
      showPromptFor(nearTarget)
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

  // ── NPC dialogue ──
  // A speech bubble floating over the pair (the camera zooms to frame player +
  // NPC together — see setTalkingNpc in world.js), NOT a scene-blurring modal.
  // The bubble frame (name, buttons) stays put; only the line text transitions.
  // Per-NPC, session-persistent line cursor so repeat chats surface new tips.
  const npcLineIndex = {}
  let npcAdvance = null // live while a bubble is open — E/Enter/Space advance it

  function openNpcDialogue(npc) {
    if (overlayOpen || customizerOpen) return
    overlayOpen = true
    world.setMovementEnabled(false)
    world.setTalkingNpc(npc.id) // pause their patrol; they turn to face you
    promptEl.classList.remove('adv-fw-prompt-show')

    const bubble = document.createElement('div')
    bubble.className = 'adv-fw-bubble'
    bubble.innerHTML = `
      <button class="adv-fw-card-close adv-fw-bubble-close" id="adv-fw-npc-close" title="Close">✕</button>
      <span class="adv-fw-card-tag">${esc(npc.role || 'Farm Folk')}</span>
      <h2 class="adv-fw-bubble-name">${esc(npc.name)}</h2>
      <p class="adv-fw-bubble-text" id="adv-fw-npc-text"></p>
      <button class="adv-fw-card-btn adv-fw-bubble-btn" id="adv-fw-npc-next">Next</button>
    `
    el.appendChild(bubble)
    requestAnimationFrame(() => bubble.classList.add('adv-fw-bubble-show'))

    const textEl = bubble.querySelector('#adv-fw-npc-text')
    const nextBtn = bubble.querySelector('#adv-fw-npc-next')
    const lines = npc.lines && npc.lines.length ? npc.lines : ['…']
    let i = npcLineIndex[npc.id] || 0
    if (i >= lines.length) i = 0
    let swapTimer = 0

    function setLine(idx, animate) {
      nextBtn.textContent = idx >= lines.length - 1 ? 'Bye' : 'Next'
      if (!animate) { textEl.textContent = lines[idx]; return }
      // float the old line out, swap, float the new one in
      textEl.classList.add('adv-fw-bubble-text-out')
      clearTimeout(swapTimer)
      swapTimer = setTimeout(() => {
        textEl.textContent = lines[idx]
        textEl.classList.remove('adv-fw-bubble-text-out')
        textEl.classList.add('adv-fw-bubble-text-in')
        // two frames so the -in start position paints before transitioning off
        requestAnimationFrame(() => requestAnimationFrame(() => textEl.classList.remove('adv-fw-bubble-text-in')))
      }, 170)
    }

    function close() {
      clearTimeout(swapTimer)
      npcAdvance = null
      bubble.classList.remove('adv-fw-bubble-show')
      setTimeout(() => bubble.remove(), 250)
      overlayOpen = false
      world.setMovementEnabled(true)
      world.setTalkingNpc(null)
      showPromptFor(nearTarget)
    }

    npcAdvance = () => {
      if (i >= lines.length - 1) { npcLineIndex[npc.id] = 0; close() }
      else { i++; npcLineIndex[npc.id] = i; setLine(i, true) }
    }
    onTap(bubble.querySelector('#adv-fw-npc-close'), close)
    onTap(nextBtn, () => npcAdvance && npcAdvance())
    setLine(i, false)
  }

  // ── Interact wiring ──

  function tryInteract() {
    if (!nearTarget || overlayOpen || customizerOpen) return
    if (nearTarget.type === 'npc') {
      const npc = NPCS.find(n => n.id === nearTarget.id)
      if (npc) openNpcDialogue(npc)
      return
    }
    const stationRun = runStations.find(s => s.def.id === nearTarget.id)
    if (stationRun) openStation(stationRun)
  }

  // Console helper: dump the current doll look as JSON to paste into an NPC's
  // `look`. Design a look in the customizer, then run fwExportLook() in devtools.
  window.fwExportLook = () => {
    let state = null
    try { state = world.getDollCharacter().getState() } catch { /* not built yet */ }
    if (!state) { try { state = JSON.parse(sessionStorage.getItem('sdshc-fw-look'))?.doll || null } catch { state = null } }
    // Prune accessoryColors for accessories that are turned off — an NPC `look`
    // only needs the colors for accessories it actually wears. `lashes` is kept
    // regardless: its color tints the eyeline even when the lash accessory is off.
    if (state && state.accessories && state.accessoryColors) {
      const pruned = {}
      for (const [k, v] of Object.entries(state.accessoryColors)) {
        if (state.accessories[k] || k === 'lashes') pruned[k] = v
      }
      state = { ...state, accessoryColors: pruned }
    }
    console.log('Farm World doll look:\n' + JSON.stringify(state, null, 2))
    return state
  }

  function onInteractKey(e) {
    if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
      if (e.repeat) return // a held key shouldn't machine-gun through dialogue
      if (npcAdvance) {
        // preventDefault stops a focused bubble button from ALSO firing its
        // native Enter/Space click — which would double-advance the dialogue
        e.preventDefault()
        npcAdvance()
        return
      }
      tryInteract()
    }
  }
  window.addEventListener('keydown', onInteractKey)

  onTap(el.querySelector('#adv-fw-visit'), () => tryInteract())
  onTap(el.querySelector('#adv-fw-home'), () => confirmBack())
  // Tap anywhere on the meter card to expand/collapse the restore checklist.
  // Toggle on pointerup, NOT click: on the physical kiosk touchscreen the
  // synthesized `click` fired unreliably across the card (only landing squarely
  // on the count row), even though headless Chrome toggles from every point.
  // pointerup fires natively for both touch and mouse on the actual element
  // released — no 300ms delay, no driver-specific click suppression. Events
  // bubble from whatever child was tapped (label, bar, row, caret), so the whole
  // card is one hit target. A small move guard keeps a stray drag from toggling.
  const meterEl = el.querySelector('#adv-fw-meter')
  let meterDownX = 0
  let meterDownY = 0
  let meterDown = false
  meterEl.addEventListener('pointerdown', (e) => {
    meterDown = true
    meterDownX = e.clientX
    meterDownY = e.clientY
  })
  meterEl.addEventListener('pointercancel', () => { meterDown = false })
  meterEl.addEventListener('pointerup', (e) => {
    if (!meterDown) return
    meterDown = false
    if (Math.hypot(e.clientX - meterDownX, e.clientY - meterDownY) > 16) return
    meterEl.classList.toggle('adv-fw-meter-open')
  })
  onTap(camResetBtn, () => world.resetCamera())
  onTap(charBtn, () => {
    look.character = look.character === 'doll' ? 'farmer' : 'doll'
    saveLook(look)
    world.applyLook(look) // builds the doll on first switch
    charBtn.classList.toggle('adv-fw-charswap-on', look.character === 'doll')
    if (renderCustomizer) renderCustomizer() // open panel follows the character
  })
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
