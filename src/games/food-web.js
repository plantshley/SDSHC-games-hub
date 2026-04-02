import { navigate } from '../router.js'
import { ORGANISMS, QUIZ_QUESTIONS, INSTRUCTIONS } from '../data/content/food-web.js'

/**
 * Game 11: Soil Food Web Builder — Harvest Guardians
 *
 * P1: Intro screen (soil-cake style)
 * P2: Phase 1 — drag organisms to correct positions on arrows-only diagram
 * P3: Phase 2 — relationship quiz (sidebar transforms)
 * P4: Completion overlay
 */

// ─── TRANSITIONS ───

function transitionTo(oldEl, newEl) {
  const parent = oldEl.parentNode
  if (!parent) return
  oldEl.classList.remove('active')
  oldEl.classList.add('exiting')
  oldEl.addEventListener('animationend', () => oldEl.remove(), { once: true })
  setTimeout(() => { if (oldEl.parentNode) oldEl.remove() }, 400)
  parent.appendChild(newEl)
  newEl.offsetHeight
  newEl.classList.add('active', 'entering')
  newEl.addEventListener('animationend', () => newEl.classList.remove('entering'), { once: true })
}

// ─── PARTICLES ───

function spawnParticles(container, x, y, count = 14) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'cc-particle fw-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 40 + Math.random() * 80
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px')
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px')
    p.style.backgroundColor = `hsl(${Math.round(Math.random() * 120 + 80)} 70% 55%)`
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    container.appendChild(p)
    p.addEventListener('animationend', () => p.remove())
  }
}

// ─── P1: INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen fw-intro'

  el.innerHTML = `
    <div class="fw-intro-bg"></div>
    <div class="fw-intro-header">
      <button class="home-btn" id="fw-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="fw-intro-title">Soil Food Web Builder</h2>
    </div>
    <div class="fw-intro-body">
      <div class="fw-intro-center">
        <div class="fw-speech-bubble">
          <span class="fw-speech-text" id="fw-intro-typing"></span>
        </div>
        <img class="fw-intro-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="Character">
        <button class="fw-enter-btn" id="fw-enter"><span>Enter the Web <span class="fw-arrow-nudge">➜</span></span></button>
      </div>
    </div>
    <div class="fw-intro-ground"><div class="ground-strip"></div></div>
    <div class="fw-intro-decor"></div>
  `

  const decor = el.querySelector('.fw-intro-decor')
  const items = [
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree1.png', style: 'left:20px;bottom:70px;height:160px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree2.png', style: 'right:20px;bottom:70px;height:150px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'left:180px;bottom:65px;height:80px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'right:200px;bottom:65px;height:80px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'left:300px;bottom:65px;height:90px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'right:350px;bottom:58px;height:60px;' },
  ]
  for (const item of items) {
    const img = document.createElement('img')
    img.src = item.src
    img.alt = ''
    img.setAttribute('style', item.style)
    decor.appendChild(img)
  }

  // Typing animation
  const typingEl = el.querySelector('#fw-intro-typing')
  const introText = INSTRUCTIONS.intro
  let charIdx = 0
  function typeChar() {
    if (charIdx < introText.length) {
      typingEl.textContent += introText[charIdx++]
      setTimeout(typeChar, 40)
    }
  }
  setTimeout(typeChar, 400)

  el.querySelector('#fw-intro-home').addEventListener('pointerdown', () => navigate('game-select/guardians'))
  el.querySelector('#fw-enter').addEventListener('pointerdown', () => {
    transitionTo(el, createGameScreen())
  })

  return el
}

// ─── P2: GAME SCREEN (Phase 1 + Phase 2) ───

function createGameScreen() {
  const el = document.createElement('div')
  el.className = 'screen fw-game'

  const placedSet = new Set()
  let quizStarted = false
  let quizScore = 0
  let quizAdvanceTimer = null

  // Build organism sidebar items
  const itemsHtml = ORGANISMS.map(org => `
    <div class="fw-organism-item" data-org-id="${org.id}" title="${org.name.replace(/\n/g, ' ')}">
      <img src="${org.asset}" alt="${org.name.replace(/\n/g, ' ')}" class="fw-organism-img" draggable="false">
      <span class="fw-organism-label">${org.name.replace(/\n/g, ' ')}</span>
    </div>
  `).join('')

  // Build drop zones — sized proportionally to displaySize
  const zonesHtml = ORGANISMS.map(org => {
    const zoneSize = Math.round(org.displaySize * 0.55)
    return `
    <div class="fw-drop-zone" data-accepts-id="${org.id}" data-display-size="${org.displaySize}"
         style="left:${org.snapX}%;top:${org.snapY}%;width:${zoneSize}px;height:${zoneSize}px;">
      <span class="fw-zone-label">?</span>
    </div>
  `}).join('')

  el.innerHTML = `
    <div class="fw-game-bg"></div>
    <div class="fw-game-header">
      <button class="home-btn" id="fw-game-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="fw-game-title">Soil Food Web Builder</h2>
      <span class="fw-progress" id="fw-progress">0/${ORGANISMS.length}</span>
    </div>
    <div class="fw-game-body">
      <div class="fw-left-panel">
        <div class="fw-panel" id="fw-panel">
          <span class="fw-panel-heading">Organisms</span>
          <div class="fw-panel-items" id="fw-panel-items">
            ${itemsHtml}
          </div>
        </div>
        <div class="fw-panel-bottom">
          <div class="fw-instructions">
            <p id="fw-instruction-text"></p>
          </div>
          <img class="fw-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
      <div class="fw-canvas-panel">
        <div class="fw-diagram-container" id="fw-diagram">
          <img src="/assets/svg/soil-food-web-arrows-only.svg" class="fw-diagram-bg" alt="Food Web Arrows" draggable="false">
          ${zonesHtml}
          <div class="fw-fact-modal" id="fw-fact-modal">
            <div class="fw-fact-card">
              <span class="fw-fact-title" id="fw-fact-title"></span>
              <p id="fw-fact-text"></p>
              <button class="fw-fact-continue" id="fw-fact-continue">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Type gameplay instruction
  const instrEl = el.querySelector('#fw-instruction-text')
  const instrText = INSTRUCTIONS.gameplay
  instrEl.textContent = ''
  let instrIdx = 0
  function typeInstr() {
    if (instrIdx < instrText.length && el.parentNode) {
      instrEl.textContent += instrText[instrIdx++]
      setTimeout(typeInstr, 35)
    }
  }
  setTimeout(typeInstr, 400)

  const diagram = el.querySelector('#fw-diagram')
  const progressEl = el.querySelector('#fw-progress')
  const factModal = el.querySelector('#fw-fact-modal')
  const factTitle = el.querySelector('#fw-fact-title')
  const factText = el.querySelector('#fw-fact-text')
  const factContinueBtn = el.querySelector('#fw-fact-continue')

  // ─── Show fact modal ───
  function showFact(org) {
    factTitle.textContent = org.name.replace(/\n/g, ' ')
    factText.textContent = org.fact
    factModal.classList.add('fw-fact-visible')
  }

  factContinueBtn.addEventListener('pointerdown', () => {
    factModal.classList.remove('fw-fact-visible')
  })

  // ─── Show hint in instructions ───
  function showHint(org) {
    instrEl.textContent = `💡 ${org.hint}`
  }

  function resetInstruction() {
    instrEl.textContent = INSTRUCTIONS.gameplay
  }

  // ─── Drag from sidebar ───
  el.querySelectorAll('.fw-organism-item').forEach(item => {
    let dragging = false, clone = null

    item.addEventListener('pointerdown', (e) => {
      if (item.classList.contains('fw-item-done') || quizStarted || dragging) return
      e.preventDefault()
      dragging = true

      clone = document.createElement('div')
      clone.className = 'fw-drag-clone'
      const img = document.createElement('img')
      img.src = ORGANISMS.find(o => o.id === item.dataset.orgId).asset
      img.draggable = false
      clone.appendChild(img)
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
      document.body.appendChild(clone)
      item.setPointerCapture(e.pointerId)
    })

    item.addEventListener('pointermove', (e) => {
      if (!dragging || !clone) return
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
    })

    function cleanupDrag() {
      dragging = false
      if (clone) { clone.remove(); clone = null }
    }

    item.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return
      cleanupDrag()

      const orgId = item.dataset.orgId
      const org = ORGANISMS.find(o => o.id === orgId)

      // Find which drop zone the drop lands in
      const zones = diagram.querySelectorAll('.fw-drop-zone')
      let targetZone = null
      for (const zone of zones) {
        const zr = zone.getBoundingClientRect()
        if (e.clientX >= zr.left && e.clientX <= zr.right &&
            e.clientY >= zr.top && e.clientY <= zr.bottom) {
          targetZone = zone
          break
        }
      }

      if (!targetZone) return
      if (targetZone.classList.contains('fw-zone-filled')) return

      const acceptsId = targetZone.dataset.acceptsId

      if (orgId === acceptsId) {
        // Correct placement
        placedSet.add(orgId)
        item.classList.add('fw-item-done')
        targetZone.classList.add('fw-zone-filled')
        targetZone.querySelector('.fw-zone-label').textContent = ''

        // Place organism image in the zone — sized to displaySize
        const dSize = org.displaySize || 80
        const placedImg = document.createElement('img')
        placedImg.src = org.asset
        placedImg.alt = org.name.replace(/\n/g, ' ')
        placedImg.className = 'fw-placed-img'
        placedImg.draggable = false
        placedImg.style.width = dSize + 'px'
        placedImg.style.height = dSize + 'px'
        targetZone.appendChild(placedImg)

        // Add name label below placed image
        const nameLabel = document.createElement('span')
        nameLabel.className = 'fw-placed-name'
        nameLabel.textContent = org.name.replace(/\n/g, ' ')
        targetZone.appendChild(nameLabel)

        // Particles
        const zr = targetZone.getBoundingClientRect()
        const dr = diagram.getBoundingClientRect()
        spawnParticles(diagram, zr.left - dr.left + zr.width / 2, zr.top - dr.top + zr.height / 2, 12)

        // Update progress
        progressEl.textContent = `${placedSet.size}/${ORGANISMS.length}`

        // Show fact
        showFact(org)

        // Check completion — guard prevents double-trigger
        if (placedSet.size === ORGANISMS.length && !quizStarted) {
          quizStarted = true
          factModal.classList.remove('fw-fact-visible')
          setTimeout(() => startQuizPhase(), 2000)
        }
      } else {
        // Wrong placement — shake + hint
        targetZone.classList.add('fw-zone-wrong')
        setTimeout(() => targetZone.classList.remove('fw-zone-wrong'), 400)
        showHint(org)
        setTimeout(resetInstruction, 3000)
      }
    })

    item.addEventListener('pointercancel', cleanupDrag)
  })

  // ─── Phase 2: Quiz ───

  function startQuizPhase() {
    quizScore = 0

    // Update header
    progressEl.textContent = ''

    // Swap sidebar to quiz mode
    const panel = el.querySelector('#fw-panel')
    panel.innerHTML = `
      <span class="fw-panel-heading" id="fw-quiz-heading">Question 1/${QUIZ_QUESTIONS.length}</span>
      <div class="fw-quiz-panel" id="fw-quiz-panel"></div>
    `

    // Type quiz intro instruction
    instrEl.textContent = ''
    let idx = 0
    const quizIntro = INSTRUCTIONS.quizIntro
    function typeQuiz() {
      if (idx < quizIntro.length && el.parentNode) {
        instrEl.textContent += quizIntro[idx++]
        setTimeout(typeQuiz, 35)
      } else if (el.parentNode) {
        setTimeout(() => { if (el.parentNode) loadQuestion(0) }, 800)
      }
    }
    typeQuiz()
  }

  function loadQuestion(qIdx) {
    if (!el.parentNode) return
    const q = QUIZ_QUESTIONS[qIdx]

    const heading = el.querySelector('#fw-quiz-heading')
    heading.textContent = `Question ${qIdx + 1}/${QUIZ_QUESTIONS.length}`

    // Highlight organisms on diagram
    clearHighlights()
    q.highlightOrganisms.forEach(orgId => {
      const zone = diagram.querySelector(`.fw-drop-zone[data-accepts-id="${orgId}"]`)
      if (zone) zone.classList.add('fw-zone-highlight')
    })

    const quizPanel = el.querySelector('#fw-quiz-panel')
    const choicesHtml = q.choices.map((c, i) => `
      <button class="fw-quiz-choice" data-idx="${i}">${c.text}</button>
    `).join('')

    quizPanel.innerHTML = `
      <p class="fw-quiz-question">${q.question}</p>
      <div class="fw-quiz-choices">${choicesHtml}</div>
      <div class="fw-quiz-explanation" id="fw-explanation"></div>
    `

    quizPanel.querySelectorAll('.fw-quiz-choice').forEach(btn => {
      btn.addEventListener('pointerdown', () => handleAnswer(btn, qIdx))
    })
  }

  function handleAnswer(btn, qIdx) {
    const q = QUIZ_QUESTIONS[qIdx]
    const choiceIdx = parseInt(btn.dataset.idx)
    const choice = q.choices[choiceIdx]
    const allBtns = el.querySelectorAll('.fw-quiz-choice')

    // Disable all buttons
    allBtns.forEach(b => { b.style.pointerEvents = 'none' })

    if (choice.correct) {
      btn.classList.add('fw-choice-correct')
      quizScore++
    } else {
      btn.classList.add('fw-choice-wrong')
      // Highlight correct answer
      allBtns.forEach((b, i) => {
        if (q.choices[i].correct) b.classList.add('fw-choice-correct')
      })
    }

    // Show explanation
    const explEl = el.querySelector('#fw-explanation')
    explEl.textContent = q.explanation
    explEl.classList.add('fw-explanation-visible')

    // Auto-advance after delay
    quizAdvanceTimer = setTimeout(() => {
      if (!el.parentNode) return
      clearHighlights()
      if (qIdx + 1 < QUIZ_QUESTIONS.length) {
        loadQuestion(qIdx + 1)
      } else {
        showCompletion()
      }
    }, 4000)
  }

  function clearHighlights() {
    diagram.querySelectorAll('.fw-zone-highlight').forEach(z => z.classList.remove('fw-zone-highlight'))
  }

  // ─── Completion ───

  function showCompletion() {
    clearHighlights()
    const canvas = el.querySelector('.fw-canvas-panel')

    const overlay = document.createElement('div')
    overlay.className = 'fw-completion-overlay'
    overlay.innerHTML = `
      <div class="fw-completion-content">
        <div class="fw-completion-bubble">
          <span class="fw-completion-text">${INSTRUCTIONS.complete}</span>
          <span class="fw-completion-score">Quiz Score: ${quizScore}/${QUIZ_QUESTIONS.length}</span>
        </div>
        <img class="fw-completion-character" src="/assets/sprites/Basic_Charakter_wave.png" alt="">
        <div class="fw-completion-buttons">
          <button class="fw-completion-btn" id="fw-replay-btn">Play Again</button>
          <button class="fw-completion-btn fw-completion-btn-primary" id="fw-back-btn">Back to Games</button>
        </div>
      </div>
    `
    canvas.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('fw-show'))

    // Particles
    const cr = canvas.getBoundingClientRect()
    spawnParticles(canvas, cr.width / 2, cr.height / 2, 28)

    overlay.querySelector('#fw-replay-btn').addEventListener('pointerdown', () => {
      transitionTo(el, createGameScreen())
    })
    overlay.querySelector('#fw-back-btn').addEventListener('pointerdown', () => {
      navigate('game-select/guardians')
    })
  }

  // ─── Home button ───
  el.querySelector('#fw-game-home').addEventListener('pointerdown', () => {
    clearTimeout(quizAdvanceTimer)
    navigate('game-select/guardians')
  })

  return el
}

// ─── EXPORT ───

export function createFoodWebGame() {
  return createIntroScreen()
}
