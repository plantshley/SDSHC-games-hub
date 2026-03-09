import { navigate } from '../router.js'
import { LEVELS, INSTRUCTIONS } from '../data/content/planting-sim.js'

/**
 * Planting Simulation Game
 * Intro: level select (3 levels)
 * L1: Three Sisters — drag plants to correct snap positions on SVG
 * L2: Pollinator Garden — drag items into matching zones (unlimited re-drags)
 * L3: Year in Bloom — drag flowers to correct month slots on timeline
 */

const LEVEL_ICONS = [
  '/assets/sprites/Basic_Plants_wheat-grow4.png',
  '/assets/sprites/Basic_Grass_Biom_things_flower1.png',
  '/assets/sprites/Basic_Plants_fruit-grow3.png',
]

// Foliage decorations that bloom around placed plants (Three Sisters)
const FOLIAGE_EMOJIS = ['🌿', '🍃', '☘️', '🌱', '🌾', '💐', '🌻', '🌼', '🌸', '🪻']

// Per-type foliage emojis for Pollinator Garden
const POLLINATOR_FOLIAGE = {
  'short-flower':  ['🌸', '🌼', '🌺', '🌸', '🦋', '🌺'],
  'tall-flower':   ['🌻', '🌻', '🌼', '🐝'],
  'medium-flower': ['🌷', '🪻', '🌷', '🪻', '🐞'],
  'tall-grass':    ['🌾', '🌾', '🌿', '🌾'],
  'stones':        ['🪨', '🐛'],
  'puddle':        ['💧', '🐸', '💧'],
}

// ─── P1: INTRO / LEVEL SELECT ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen ps-intro'

  const levelsHtml = LEVELS.map((lvl, i) => `
    <button class="ps-level-card" data-level="${i}">
      <img src="${LEVEL_ICONS[i]}" alt="" class="ps-level-card-icon">
      <span class="ps-level-card-title">${lvl.title}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="ps-intro-bg"></div>
    <div class="ps-intro-header">
      <button class="home-btn" id="ps-intro-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="ps-intro-title">Planting Simulation</h2>
    </div>
    <div class="ps-intro-body">
      <div class="ps-intro-left">
        <div class="ps-speech-bubble">
          <span class="ps-speech-text" id="ps-intro-typing"></span>
        </div>
        <img class="ps-intro-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="Character">
      </div>
      <div class="ps-intro-right">
        ${levelsHtml}
      </div>
    </div>
  `

  // Typing animation with cleanup
  const typingEl = el.querySelector('#ps-intro-typing')
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

  el.querySelector('#ps-intro-home').addEventListener('pointerdown', () => navigate('game-select/meadow'))
  el.querySelectorAll('.ps-level-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      clearTimeout(typingTimer)
      const levelIdx = parseInt(card.dataset.level)
      const parent = el.parentNode
      const gameplay = createGameplayScreen(levelIdx)
      el.classList.remove('active')
      el.classList.add('exiting')
      el.addEventListener('animationend', () => el.remove(), { once: true })
      setTimeout(() => { if (el.parentNode) el.remove() }, 400)
      parent.appendChild(gameplay)
      gameplay.offsetHeight
      gameplay.classList.add('active', 'entering')
      gameplay.addEventListener('animationend', () => gameplay.classList.remove('entering'), { once: true })
    })
  })

  return el
}

// ─── P2: GAMEPLAY ───

function createGameplayScreen(levelIdx) {
  const level = LEVELS[levelIdx]

  switch (level.id) {
    case 'three-sisters': return createThreeSisters(level)
    case 'pollinator-garden': return createPollinatorGarden(level)
    case 'year-in-bloom': return createYearInBloom(level)
    default: return createThreeSisters(LEVELS[0])
  }
}

// ─── LEVEL 1: THREE SISTERS ───

function createThreeSisters(level) {
  const el = document.createElement('div')
  el.className = 'screen ps-game ps-three-sisters'

  const shuffled = [...level.plants].sort(() => Math.random() - 0.5)
  const plantsHtml = shuffled.map(p => `
    <div class="ps-plant-item ps-ts-plant-item" data-plant-id="${p.id}" draggable="false">
      <img src="${p.asset}" alt="${p.name}" class="ps-plant-img ps-ts-plant-img" draggable="false">
      <span class="ps-plant-label ps-ts-plant-label">?</span>
    </div>
  `).join('')

  el.innerHTML = `
    <div class="ps-game-bg ps-ts-bg"></div>
    <div class="ps-game-header">
      <button class="home-btn" id="ps-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="ps-game-title">${level.title}</h2>
    </div>
    <div class="ps-game-body">
      <div class="ps-panel">
        <span class="ps-panel-heading">Plants</span>
        <div class="ps-panel-items">
          ${plantsHtml}
        </div>
        <div class="ps-panel-divider"></div>
        <div class="ps-panel-instructions">
          <p class="ps-panel-instructions-text" id="ps-panel-typing"></p>
        </div>
      </div>
      <div class="ps-canvas-panel ps-ts-canvas">
        <div class="ps-diagram-container" id="ps-diagram">
          <img src="${level.diagram}" class="ps-diagram-img" alt="Three Sisters" draggable="false">
          <div class="ps-placed-plants" id="ps-placed"></div>
        </div>
        <div class="ps-overlay-bottom">
          <div class="ps-instructions">
            <p id="ps-instruction-text">Drag a plant onto the garden!</p>
          </div>
          <img class="ps-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
    </div>
  `

  // Type the gameplay instructions into the panel
  const panelTypingEl = el.querySelector('#ps-panel-typing')
  const panelText = INSTRUCTIONS.threeSisters.gameplay
  let pCharIdx = 0
  let panelTimer = null
  function typePanelChar() {
    if (pCharIdx < panelText.length) {
      panelTypingEl.textContent += panelText[pCharIdx++]
      panelTimer = setTimeout(typePanelChar, 30)
    }
  }
  panelTimer = setTimeout(typePanelChar, 300)

  const placed = new Set()
  let currentClue = null

  // Show clue for a random unplaced plant and track which one
  function showNextClue() {
    const unplaced = level.plants.filter(p => !placed.has(p.id))
    if (unplaced.length === 0) return
    currentClue = unplaced[Math.floor(Math.random() * unplaced.length)]
    el.querySelector('#ps-instruction-text').textContent = `? : ${currentClue.clue}`
  }

  requestAnimationFrame(() => showNextClue())

  // Drag from panel — only accept the plant matching the current clue
  el.querySelectorAll('.ps-plant-item').forEach(item => {
    let dragging = false, clone = null

    item.addEventListener('pointerdown', (e) => {
      if (item.classList.contains('done')) return
      e.preventDefault()
      dragging = true
      clone = item.querySelector('img').cloneNode()
      clone.className = 'ps-drag-clone'
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

    item.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return
      dragging = false
      clone.remove()
      clone = null

      const diagram = el.querySelector('#ps-diagram')
      if (!diagram) return
      const dr = diagram.getBoundingClientRect()

      if (e.clientX >= dr.left && e.clientX <= dr.right && e.clientY >= dr.top && e.clientY <= dr.bottom) {
        const plantId = item.dataset.plantId
        const plant = level.plants.find(p => p.id === plantId)

        if (plant && !placed.has(plantId) && currentClue && plantId === currentClue.id) {
          // Snap to correct position
          const wrapper = document.createElement('div')
          wrapper.className = 'ps-snapped-wrapper'
          wrapper.style.left = plant.snapX + '%'
          wrapper.style.top = plant.snapY + '%'

          const img = document.createElement('img')
          img.src = plant.asset
          img.className = 'ps-snapped-plant'
          if (plant.assetType === 'sprite') img.classList.add('ps-squash-bob')
          img.draggable = false
          wrapper.appendChild(img)

          el.querySelector('#ps-placed').appendChild(wrapper)

          // Spawn foliage decorations around the placed plant
          spawnFoliage(wrapper)

          placed.add(plantId)
          item.classList.add('done')
          item.querySelector('.ps-plant-label').textContent = plant.name

          if (placed.size >= level.plants.length) {
            clearTimeout(panelTimer)
            // Hide the clue overlay on completion
            const overlay = el.querySelector('.ps-overlay-bottom')
            if (overlay) overlay.style.display = 'none'
            // Delay completion screen
            setTimeout(() => showCompletion(el, INSTRUCTIONS.threeSisters.complete), 1800)
          } else {
            showNextClue()
          }
        } else if (plant && !placed.has(plantId)) {
          // Wrong plant for the current clue — shake then re-show clue
          item.classList.add('ps-wrong')
          setTimeout(() => item.classList.remove('ps-wrong'), 400)
          el.querySelector('#ps-instruction-text').textContent = 'Not quite! Read the clue again.'
          setTimeout(() => {
            if (currentClue && !placed.has(currentClue.id)) {
              el.querySelector('#ps-instruction-text').textContent = `? : ${currentClue.clue}`
            }
          }, 1500)
        }
      }
    })
  })

  el.querySelector('#ps-home').addEventListener('pointerdown', () => {
    clearTimeout(panelTimer)
    backToIntro(el)
  })
  return el
}

// Spawn foliage emoji decorations around a placed plant wrapper
function spawnFoliage(wrapper) {
  const count = 10 + Math.floor(Math.random() * 6)
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement('span')
    leaf.className = 'ps-foliage'
    leaf.textContent = FOLIAGE_EMOJIS[Math.floor(Math.random() * FOLIAGE_EMOJIS.length)]
    // Scatter in a wide radius around the plant center
    const angle = Math.random() * Math.PI * 2
    const dist = 40 + Math.random() * 90
    const ox = Math.cos(angle) * dist
    const oy = Math.sin(angle) * dist - 20
    leaf.style.setProperty('--ox', ox + 'px')
    leaf.style.setProperty('--oy', oy + 'px')
    leaf.style.animationDelay = (i * 60) + 'ms'
    wrapper.appendChild(leaf)
  }
}

// ─── LEVEL 2: POLLINATOR GARDEN ───

function createPollinatorGarden(level) {
  const el = document.createElement('div')
  el.className = 'screen ps-game ps-pollinator'

  const itemsHtml = level.items.map(item => `
    <div class="ps-deco-item" data-item-id="${item.id}" data-plant-type="${item.zoneType}" title="${item.name}">
      <img src="${item.asset}" alt="${item.name}" class="ps-deco-img" draggable="false">
    </div>
  `).join('')

  const zonesHtml = level.zonePositions.map(zp => {
    const zone = level.zones.find(z => z.id === zp.id)
    return `
      <div class="ps-drop-zone" data-zone-id="${zp.id}" data-plant-type="${zone.plantType}" data-required="${zone.required}"
           style="top:${zp.top}%;left:${zp.left}%;width:${zp.width}%;height:${zp.height}%;">
        <span class="ps-zone-label">${zone.label}</span>
        <span class="ps-zone-count">0/${zone.required}</span>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div class="ps-game-bg ps-poll-bg"></div>
    <div class="ps-game-header">
      <button class="home-btn" id="ps-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="ps-game-title">${level.title}</h2>
    </div>
    <div class="ps-game-body">
      <div class="ps-poll-left">
        <div class="ps-panel">
          <span class="ps-panel-heading">Garden Items</span>
          <div class="ps-panel-items ps-panel-items-grid">
            ${itemsHtml}
          </div>
        </div>
        <div class="ps-poll-overlay">
          <img class="ps-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
          <div class="ps-instructions">
            <p id="ps-instruction-text">${INSTRUCTIONS.pollinator.gameplay}</p>
          </div>
        </div>
      </div>
      <div class="ps-canvas-panel ps-poll-canvas">
        <div class="ps-garden-container" id="ps-garden">
          ${zonesHtml}
        </div>
      </div>
    </div>
  `

  // Type in the gameplay instruction
  const instrEl = el.querySelector('#ps-instruction-text')
  const instrText = INSTRUCTIONS.pollinator.gameplay
  instrEl.textContent = ''
  let instrIdx = 0
  function typeInstr() {
    if (instrIdx < instrText.length && el.parentNode) {
      instrEl.textContent += instrText[instrIdx++]
      setTimeout(typeInstr, 35)
    }
  }
  setTimeout(typeInstr, 400)

  const zoneCounts = {}
  level.zones.forEach(z => { zoneCounts[z.id] = 0 })

  // Make a placed item draggable within the garden canvas
  function makePlacedMoveable(placedEl, garden) {
    let dragging = false, clone = null

    placedEl.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragging = true
      clone = document.createElement('div')
      clone.className = 'ps-drag-clone-box'
      const srcImg = placedEl.querySelector('img')
      if (srcImg) {
        clone.appendChild(srcImg.cloneNode())
      }
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
      document.body.appendChild(clone)
      placedEl.style.opacity = '0.35'
      placedEl.setPointerCapture(e.pointerId)
    })

    placedEl.addEventListener('pointermove', (e) => {
      if (!dragging || !clone) return
      clone.style.left = e.clientX + 'px'
      clone.style.top = e.clientY + 'px'
    })

    placedEl.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return
      dragging = false
      clone.remove()
      clone = null
      placedEl.style.opacity = '1'

      const gr = garden.getBoundingClientRect()
      if (e.clientX >= gr.left && e.clientX <= gr.right && e.clientY >= gr.top && e.clientY <= gr.bottom) {
        placedEl.style.left = ((e.clientX - gr.left) / gr.width * 100) + '%'
        placedEl.style.top  = ((e.clientY - gr.top)  / gr.height * 100) + '%'
      }
    })
  }

  // Drag from panel (unlimited re-drags)
  el.querySelectorAll('.ps-deco-item').forEach(item => {
    let dragging = false, clone = null

    item.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      dragging = true
      const itemData = level.items.find(it => it.id === item.dataset.itemId)

      clone = document.createElement('div')
      clone.className = 'ps-drag-clone-box'
      const img = document.createElement('img')
      img.src = itemData.asset
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

    item.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return
      dragging = false
      clone.remove()
      clone = null

      const plantType = item.dataset.plantType
      const garden = el.querySelector('#ps-garden')
      if (!garden) return

      // Find which zone the drop lands in
      const zones = garden.querySelectorAll('.ps-drop-zone')
      let targetZone = null
      for (const zone of zones) {
        const zr = zone.getBoundingClientRect()
        if (e.clientX >= zr.left && e.clientX <= zr.right && e.clientY >= zr.top && e.clientY <= zr.bottom) {
          targetZone = zone
          break
        }
      }

      if (!targetZone) return

      const zoneId = targetZone.dataset.zoneId
      const zonePlantType = targetZone.dataset.plantType
      const required = parseInt(targetZone.dataset.required)

      if (plantType === zonePlantType) {
        if (zoneCounts[zoneId] >= required) return

        zoneCounts[zoneId]++
        targetZone.querySelector('.ps-zone-count').textContent = `${zoneCounts[zoneId]}/${required}`

        // Place item at exact drop coordinates on the garden canvas
        const itemData = level.items.find(it => it.id === item.dataset.itemId)
        const gr = garden.getBoundingClientRect()
        const px = ((e.clientX - gr.left) / gr.width * 100)
        const py = ((e.clientY - gr.top)  / gr.height * 100)

        const placedEl = document.createElement('div')
        placedEl.className = 'ps-poll-placed-item'
        placedEl.dataset.plantType = plantType
        if (plantType === 'tall-grass') placedEl.classList.add('ps-poll-tall-grass')
        if (plantType === 'puddle') placedEl.classList.add('ps-poll-puddle')
        if (plantType === 'stones') placedEl.classList.add('ps-poll-stone')
        placedEl.style.left = px + '%'
        placedEl.style.top  = py + '%'
        const img = document.createElement('img')
        img.src = itemData.asset
        img.alt = itemData.name
        img.draggable = false
        placedEl.appendChild(img)
        garden.appendChild(placedEl)
        makePlacedMoveable(placedEl, garden)

        // Foliage bloom at drop point
        spawnPollinatorFoliage(garden, e.clientX, e.clientY, POLLINATOR_FOLIAGE[plantType] || ['🌿', '🌱'])

        if (zoneCounts[zoneId] >= required) {
          targetZone.classList.add('ps-zone-complete')
        }

        // Check all zones complete
        const allDone = level.zones.every(z => zoneCounts[z.id] >= z.required)
        if (allDone) {
          el.querySelector('.ps-poll-overlay').style.display = 'none'
          setTimeout(() => showCompletion(el, INSTRUCTIONS.pollinator.complete), 1800)
        }
      } else {
        targetZone.classList.add('ps-wrong')
        setTimeout(() => targetZone.classList.remove('ps-wrong'), 400)
      }
    })
  })

  el.querySelector('#ps-home').addEventListener('pointerdown', () => backToIntro(el))
  return el
}

// Spawn foliage emojis on the garden canvas at a screen coordinate
function spawnPollinatorFoliage(garden, clientX, clientY, emojis) {
  const gr = garden.getBoundingClientRect()
  const px = ((clientX - gr.left) / gr.width * 100)
  const py = ((clientY - gr.top)  / gr.height * 100)
  const count = 6 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement('span')
    leaf.className = 'ps-foliage ps-poll-foliage'
    leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)]
    const angle = Math.random() * Math.PI * 2
    const dist = 25 + Math.random() * 55
    leaf.style.setProperty('--ox', (Math.cos(angle) * dist) + 'px')
    leaf.style.setProperty('--oy', (Math.sin(angle) * dist - 10) + 'px')
    leaf.style.left = px + '%'
    leaf.style.top  = py + '%'
    leaf.style.animationDelay = (i * 50) + 'ms'
    garden.appendChild(leaf)
  }
}

// ─── LEVEL 3: YEAR IN BLOOM ───

function createYearInBloom(level) {
  const el = document.createElement('div')
  el.className = 'screen ps-game'

  const shuffled = [...level.months].sort(() => Math.random() - 0.5)
  const flowersHtml = shuffled.map(m => `
    <div class="ps-plant-item ps-flower-item" data-month-id="${m.id}" draggable="false">
      <div class="ps-flower-swatch" style="background:${m.fillColor};"></div>
      <span class="ps-plant-label">${m.flower}</span>
    </div>
  `).join('')

  const timelineHtml = level.months.map(m => `
    <div class="ps-timeline-slot" data-month-id="${m.id}">
      <span class="ps-month-label">${m.month}</span>
      <div class="ps-slot-drop" data-month-id="${m.id}"></div>
    </div>
  `).join('')

  el.innerHTML = `
    <div class="ps-game-bg" style="background-image:url('${level.background}');"></div>
    <div class="ps-game-header">
      <button class="home-btn" id="ps-home">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="ps-game-title">${level.title}</h2>
    </div>
    <div class="ps-game-body">
      <div class="ps-panel">
        <span class="ps-panel-heading">Flowers</span>
        <div class="ps-panel-items">
          ${flowersHtml}
        </div>
      </div>
      <div class="ps-canvas-panel">
        <div class="ps-timeline" id="ps-timeline">
          ${timelineHtml}
        </div>
        <div class="ps-overlay-bottom">
          <div class="ps-instructions">
            <p id="ps-instruction-text">${INSTRUCTIONS.yearInBloom.gameplay}</p>
          </div>
          <img class="ps-game-character" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
        </div>
      </div>
    </div>
  `

  const placed = new Set()

  // Show a clue for a random unplaced flower
  function showNextClue() {
    const unplaced = level.months.filter(m => !placed.has(m.id))
    if (unplaced.length === 0) return
    const m = unplaced[Math.floor(Math.random() * unplaced.length)]
    el.querySelector('#ps-instruction-text').textContent = `? : ${m.clue}`
  }

  requestAnimationFrame(() => showNextClue())

  // Free-order: accept any correct flower-to-month match
  el.querySelectorAll('.ps-flower-item').forEach(item => {
    let dragging = false, clone = null

    item.addEventListener('pointerdown', (e) => {
      if (item.classList.contains('done')) return
      e.preventDefault()
      dragging = true
      clone = document.createElement('div')
      clone.className = 'ps-drag-clone-swatch'
      clone.style.background = item.querySelector('.ps-flower-swatch').style.background
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

    item.addEventListener('pointerup', (e) => {
      if (!dragging || !clone) return
      dragging = false
      clone.remove()
      clone = null

      const monthId = item.dataset.monthId

      // Find which slot the drop lands on
      const slots = el.querySelectorAll('.ps-slot-drop')
      let targetSlot = null
      for (const slot of slots) {
        const sr = slot.getBoundingClientRect()
        if (e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom) {
          targetSlot = slot
          break
        }
      }

      if (!targetSlot) return

      const slotMonthId = targetSlot.dataset.monthId

      // Correct if flower matches slot's month
      if (monthId === slotMonthId && !placed.has(monthId)) {
        const monthData = level.months.find(m => m.id === monthId)
        const bloom = document.createElement('div')
        bloom.className = 'ps-bloom'
        bloom.style.background = monthData.fillColor
        bloom.innerHTML = `<span class="ps-bloom-name">${monthData.flower}</span>`
        targetSlot.appendChild(bloom)

        placed.add(monthId)
        item.classList.add('done')
        targetSlot.parentElement.classList.add('ps-slot-filled')

        if (placed.size >= level.months.length) {
          const overlay = el.querySelector('.ps-overlay-bottom')
          if (overlay) overlay.style.display = 'none'
          setTimeout(() => showCompletion(el, INSTRUCTIONS.yearInBloom.complete), 1800)
        } else {
          showNextClue()
        }
      } else {
        // Wrong match — shake the item
        item.classList.add('ps-wrong')
        setTimeout(() => item.classList.remove('ps-wrong'), 400)
        el.querySelector('#ps-instruction-text').textContent = 'Not quite! Try a different month.'
      }
    })
  })

  el.querySelector('#ps-home').addEventListener('pointerdown', () => backToIntro(el))
  return el
}

// ─── SHARED UTILITIES ───

function showCompletion(container, message) {
  const overlay = document.createElement('div')
  overlay.className = 'ps-completion-overlay'
  overlay.innerHTML = `
    <div class="ps-completion-content">
      <div class="ps-completion-bubble">
        <span class="ps-completion-text">${message || 'Great job!'}</span>
      </div>
      <img class="ps-completion-worm" src="/assets/sprites/Basic_Charakter_plain.png" alt="">
      <button class="ps-completion-btn" id="ps-back-btn">Back to Levels</button>
    </div>
  `
  container.querySelector('.ps-canvas-panel').appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('ps-show'))

  overlay.querySelector('#ps-back-btn').addEventListener('pointerdown', () => {
    backToIntro(container)
  })
}

function backToIntro(currentEl) {
  const parent = currentEl.parentNode
  const intro = createIntroScreen()
  currentEl.classList.remove('active')
  currentEl.classList.add('exiting')
  currentEl.addEventListener('animationend', () => currentEl.remove(), { once: true })
  setTimeout(() => { if (currentEl.parentNode) currentEl.remove() }, 400)
  parent.appendChild(intro)
  intro.offsetHeight
  intro.classList.add('active', 'entering')
  intro.addEventListener('animationend', () => intro.classList.remove('entering'), { once: true })
}

// ─── EXPORT ───

export function createPlantingSimGame() {
  return createIntroScreen()
}
