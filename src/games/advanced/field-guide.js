/**
 * Advanced Field Guide — Photo Identification Game
 * Progressive clue reveal: identify SD plants, crops, practices, equipment from photos.
 * Multiplayer (1-4 players), dark/light theme.
 */

import { navigate } from '../../router.js'
import {
  CATEGORIES, PLAYER_COLORS, INSTRUCTIONS, RULES, IMPACT_MESSAGES, EXTRA_DISTRACTORS,
} from '../../data/content/advanced/field-guide.js'
import { addGradientBackground } from '../../utils/gradient-bg.js'
import { createThemeToggle } from '../../utils/theme-toggle.js'
import { createHelpButton } from '../../utils/help-overlay.js'
import { createLeaderboardButton } from '../../utils/leaderboard-modal.js'
import { renderTeamPlayerRows } from '../../utils/team-input.js'
import { recordScores } from '../../utils/leaderboard-api.js'
import { getScoreEventId } from '../../screens/advanced-play-mode.js'
import { typewriter } from '../../utils/typewriter.js'
import { shuffleArray, transitionTo } from '../../utils/game-helpers.js'
import { trackGameStart, trackGameComplete, trackGameQuit, trackTopicSelect } from '../../utils/analytics.js'

function genRunId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

// ─── HELPERS ───

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const preloadCache = []
function preloadImage(src) {
  const img = new Image()
  img.onerror = () => { img.onerror = null }
  img.src = src
  preloadCache.push(img)
  if (preloadCache.length > 4) preloadCache.shift()
}

// Questions per level (and per category in All mode), tuned so every player gets
// an equal number of turns: 6 for 3 players, 4 for 1 / 2 / 4 players.
function questionsPerLevel(playerCount) {
  return playerCount === 3 ? 6 : 4
}

// An item may carry multiple photos (variants). Returns its image list.
function itemImages(item) {
  return item.images && item.images.length ? item.images : [item.image]
}

// Tracks image srcs already shown, per category, across replays within this page
// session. Lets "Play Again" exhaust unused photos before repeating any.
const usedImagesByCategory = {}

// Pick up to `count` items from a pool, preferring items whose photos haven't been
// shown yet this session, and choose a specific (preferably unused) photo for each.
function pickItems(poolItems, count, catId) {
  const used = usedImagesByCategory[catId] || (usedImagesByCategory[catId] = new Set())
  const poolImgs = poolItems.flatMap(itemImages)
  // Whole pool exhausted -> free its photos so they can cycle again.
  if (poolImgs.length > 0 && poolImgs.every(src => used.has(src))) {
    poolImgs.forEach(src => used.delete(src))
  }
  const withUnused = []
  const allUsed = []
  poolItems.forEach(it => {
    (itemImages(it).some(src => !used.has(src)) ? withUnused : allUsed).push(it)
  })
  shuffleArray(withUnused)
  shuffleArray(allUsed)
  const ordered = [...withUnused, ...allUsed].slice(0, Math.min(count, poolItems.length))
  return ordered.map(it => {
    const imgs = itemImages(it)
    const unused = imgs.filter(src => !used.has(src))
    const pool = unused.length ? unused : imgs
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    used.add(chosen)
    return { ...it, chosenImage: chosen }
  })
}

// Like pickItems, but the pool spans multiple categories (used by "All: Random Shuffle").
// Entries are { it, cat }; image-exhaustion is tracked under each item's own
// category so it stays consistent with single/grouped plays in the same session.
function pickItemsPooled(entries, count) {
  const usedFor = cat => usedImagesByCategory[cat.id] || (usedImagesByCategory[cat.id] = new Set())
  const allImgs = entries.flatMap(({ it }) => itemImages(it))
  // Whole band exhausted -> free its photos (per their categories) so they cycle.
  if (allImgs.length > 0 && entries.every(({ it, cat }) => itemImages(it).every(s => usedFor(cat).has(s)))) {
    entries.forEach(({ it, cat }) => itemImages(it).forEach(s => usedFor(cat).delete(s)))
  }
  const withUnused = []
  const allUsed = []
  entries.forEach(e => {
    (itemImages(e.it).some(s => !usedFor(e.cat).has(s)) ? withUnused : allUsed).push(e)
  })
  shuffleArray(withUnused)
  shuffleArray(allUsed)
  const ordered = [...withUnused, ...allUsed].slice(0, Math.min(count, entries.length))
  return ordered.map(({ it, cat }) => {
    const imgs = itemImages(it)
    const used = usedFor(cat)
    const unused = imgs.filter(s => !used.has(s))
    const pool = unused.length ? unused : imgs
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    used.add(chosen)
    return { ...it, categoryId: cat.id, categoryTitle: cat.title, chosenImage: chosen }
  })
}

// Questions per topic in grouped multi-topic play. Targets ~30 total while keeping
// each topic's count a multiple of the player count so every player gets equal
// turns within a topic. (pickItems caps this at a topic's available photos.)
function groupedCount(playerCount, topicCount) {
  const ideal = 30 / topicCount
  return Math.max(playerCount, Math.round(ideal / playerCount) * playerCount)
}

// ─── INTRO SCREEN ───

function createIntroScreen() {
  const el = document.createElement('div')
  el.className = 'screen adv-sw-intro adv-fg-intro'

  let playerCount = 1
  let players = [{ name: 'Player 1', color: PLAYER_COLORS[0], teamId: null, teamName: '', teamStatus: null }]
  let selectedTopics = new Set()
  let randomized = false

  function renderNames() {
    const container = el.querySelector('#adv-fg-names')
    if (!container) return
    renderTeamPlayerRows(container, players)
  }

  function updateCount(delta) {
    playerCount = Math.max(1, Math.min(4, playerCount + delta))
    while (players.length < playerCount) {
      players.push({ name: `Player ${players.length + 1}`, color: PLAYER_COLORS[players.length], teamId: null, teamName: '', teamStatus: null })
    }
    while (players.length > playerCount) players.pop()
    const countEl = el.querySelector('#adv-fg-count')
    if (countEl) countEl.textContent = playerCount
    renderNames()
  }

  function updateStartBtn() {
    const btn = el.querySelector('#adv-fg-start')
    if (!btn) return
    const n = selectedTopics.size
    let label, disabled = false
    if (randomized) label = 'Start Game (Randomized)'
    else if (n === 0) { label = 'Select Topics to Start'; disabled = true }
    else if (n === 1) label = 'Start Game'
    else label = `Start Game (${n} topics)`
    btn.textContent = label
    btn.disabled = disabled
    btn.style.opacity = disabled ? '0.4' : '1'
  }

  function renderTopics() {
    el.querySelectorAll('.adv-cn-topic-card[data-id]').forEach(card => {
      card.classList.toggle('selected', !randomized && selectedTopics.has(card.dataset.id))
    })
    const allBtn = el.querySelector('#adv-fg-all')
    if (allBtn) allBtn.classList.toggle('selected', !randomized && selectedTopics.size === CATEGORIES.length)
    const randBtn = el.querySelector('#adv-fg-randomized')
    if (randBtn) randBtn.classList.toggle('selected', randomized)
    updateStartBtn()
  }

  el.innerHTML = `
    <div class="adv-sw-intro-inner">
      <div class="adv-sw-intro-topbar">
        <button class="adv-game-topbar-btn" id="adv-fg-back">\u2190 Back</button>
        <h1 class="adv-sw-intro-title">Field Guide</h1>
      </div>

      <p class="adv-sw-intro-desc">${INSTRUCTIONS.intro}</p>

      <div class="adv-cn-setup-columns">
        <div class="adv-sw-player-setup">
          <span class="adv-sw-setup-label">Players</span>
          <div class="adv-sw-picker-row">
            <button class="adv-sw-picker-btn" id="adv-fg-minus">\u2212</button>
            <span class="adv-sw-picker-count" id="adv-fg-count">1</span>
            <button class="adv-sw-picker-btn" id="adv-fg-plus">+</button>
          </div>
          <div class="adv-sw-names" id="adv-fg-names"></div>
        </div>

        <div class="adv-cn-topic-column">
          <span class="adv-sw-setup-label">Topics</span>
          <div class="adv-cn-topic-picker">
            ${CATEGORIES.map(c => `<button class="adv-cn-topic-card" data-id="${c.id}">${esc(c.title)}</button>`).join('')}
            <button class="adv-cn-topic-card adv-cn-topic-all" id="adv-fg-all">All: Grouped</button>
            <button class="adv-cn-topic-card adv-fg-randomized-btn" id="adv-fg-randomized">All: Random Shuffle</button>
          </div>
        </div>
      </div>

      <button class="adv-sw-start-btn" id="adv-fg-start" disabled>Select Topics to Start</button>
    </div>
  `

  addGradientBackground(el, 'field-guide')
  const introTopbar = el.querySelector('.adv-sw-intro-topbar')
  introTopbar.appendChild(createHelpButton('Field Guide', RULES))
  introTopbar.appendChild(createLeaderboardButton())
  introTopbar.appendChild(createThemeToggle())
  typewriter(el.querySelector('.adv-sw-intro-desc'))

  el.querySelector('#adv-fg-back').addEventListener('pointerdown', () => navigate('game-select'))
  el.querySelector('#adv-fg-minus').addEventListener('pointerdown', () => updateCount(-1))
  el.querySelector('#adv-fg-plus').addEventListener('pointerdown', () => updateCount(1))

  el.querySelectorAll('.adv-cn-topic-card[data-id]').forEach(card => {
    card.addEventListener('pointerdown', () => {
      randomized = false
      const id = card.dataset.id
      if (selectedTopics.has(id)) selectedTopics.delete(id)
      else selectedTopics.add(id)
      renderTopics()
    })
  })

  el.querySelector('#adv-fg-all').addEventListener('pointerdown', () => {
    randomized = false
    if (selectedTopics.size === CATEGORIES.length) selectedTopics.clear()
    else CATEGORIES.forEach(c => selectedTopics.add(c.id))
    renderTopics()
  })

  el.querySelector('#adv-fg-randomized').addEventListener('pointerdown', () => {
    randomized = !randomized
    if (randomized) selectedTopics.clear()
    renderTopics()
  })

  el.querySelector('#adv-fg-start').addEventListener('pointerdown', () => {
    let selection
    if (randomized) {
      selection = { mode: 'randomized', topicIds: CATEGORIES.map(c => c.id) }
    } else if (selectedTopics.size === 0) {
      return
    } else if (selectedTopics.size === 1) {
      selection = { mode: 'single', topicIds: [...selectedTopics] }
    } else {
      selection = { mode: 'grouped', topicIds: [...selectedTopics] }
    }
    const titles = selection.topicIds.map(id => {
      const c = CATEGORIES.find(cc => cc.id === id)
      return c ? c.title : id
    })
    trackGameStart('adv-field-guide', 'advanced', { playerCount: players.length })
    trackTopicSelect('adv-field-guide', randomized ? ['All: Random Shuffle'] : titles)
    transitionTo(el, createGameplayScreen(players, selection))
  })

  setTimeout(() => renderNames(), 0)
  return el
}

// ─── GAMEPLAY SCREEN ───

function createGameplayScreen(players, selection) {
  const el = document.createElement('div')
  el.className = 'screen adv-fg-game'

  // Selection: { mode: 'single' | 'grouped' | 'randomized', topicIds: [...] }
  const mode = selection.mode
  const isSingle = mode === 'single'
  const isGrouped = mode === 'grouped'
  const isRandomized = mode === 'randomized'
  const selCats = selection.topicIds.map(id => CATEGORIES.find(c => c.id === id)).filter(Boolean)
  if (selCats.length === 0) { navigate('game-select'); return document.createElement('div') }

  // Build flat items array (sequential play order)
  let items = []
  const categoryOrder = []
  const categoryProgress = {}
  let isLeveled = false

  if (isRandomized) {
    // One pool of every item across all topics, banded by difficulty into levels.
    // Each question is a random topic; harder levels = less-recognizable items.
    isLeveled = true
    const pool = []
    selCats.forEach(cat => cat.items.forEach(it => pool.push({ it, cat })))
    const maxLevel = pool.reduce((m, { it }) => Math.max(m, it.difficulty || 1), 1)
    const perLevel = questionsPerLevel(players.length)
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      const band = pool.filter(({ it }) => (it.difficulty || 1) === lvl)
      if (band.length === 0) continue
      pickItemsPooled(band, perLevel).forEach(item => items.push({ ...item, level: lvl }))
    }
  } else if (isSingle) {
    const cat = selCats[0]
    categoryOrder.push(cat.id)
    const perLevel = questionsPerLevel(players.length)
    // Topics whose items carry a `difficulty` play as numbered levels of rising
    // difficulty; any without fall back to a single shuffled round.
    if (cat.items.some(it => it.difficulty)) {
      isLeveled = true
      const maxLevel = cat.items.reduce((m, it) => Math.max(m, it.difficulty || 1), 1)
      for (let lvl = 1; lvl <= maxLevel; lvl++) {
        const band = cat.items.filter(it => (it.difficulty || 1) === lvl)
        if (band.length === 0) continue
        const picked = pickItems(band, perLevel, cat.id)
        picked.forEach(item => items.push({ ...item, categoryId: cat.id, categoryTitle: cat.title, level: lvl }))
      }
    } else {
      const picked = pickItems(cat.items, cat.items.length, cat.id)
      picked.forEach(item => items.push({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
    }
    categoryProgress[cat.id] = { answered: 0, total: items.length }
  } else {
    // Grouped: questions per topic scaled by player + topic count, grouped by topic.
    const perTopic = groupedCount(players.length, selCats.length)
    selCats.forEach(cat => {
      const picked = pickItems(cat.items, perTopic, cat.id)
      picked.forEach(item => items.push({ ...item, categoryId: cat.id, categoryTitle: cat.title }))
      categoryOrder.push(cat.id)
      categoryProgress[cat.id] = { answered: 0, total: picked.length }
    })
  }

  const totalRounds = items.length
  const isMultiplayer = players.length > 1
  let cancelled = false

  // Pending staggered clue/significance reveals from the feedback phase. The clue
  // DOM nodes are reused each round, so these must be cancelled when advancing —
  // otherwise tapping "Next" early lets them fire on the next question's clues.
  let clueRevealTimers = []
  function clearClueRevealTimers() {
    clueRevealTimers.forEach(clearTimeout)
    clueRevealTimers = []
  }

  // The active "Next"/"Finish" handler on the more-clues button (set during
  // feedback). Tracked so manual navigation can detach a stale one.
  let nextBtnHandler = null

  const state = {
    runId: genRunId(),
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

  // Determine which topics to show in the sidebar. Randomized shows a single
  // static "All Topics" entry (its progress is the level pills); single & grouped
  // show their selected topic(s). Only grouped lets you tap to jump between them.
  const visibleCategories = isRandomized
    ? [{ id: '__all__', title: 'All Topics' }]
    : selCats

  // Level metadata for the sidebar indicator (leveled mode only).
  // Each entry: { level, total, endIdx } where endIdx is the last item index.
  const levels = []
  if (isLeveled) {
    items.forEach((it, idx) => {
      let lv = levels.find(l => l.level === it.level)
      if (!lv) { lv = { level: it.level, total: 0, endIdx: idx }; levels.push(lv) }
      lv.total++
      lv.endIdx = idx
    })
  }

  // Navigable segments for Previous / Skip: one per level (leveled mode) or one
  // per category (all-categories mode). Each is a contiguous range of `items`.
  const navSegments = []
  if (isLeveled) {
    levels.forEach(lv => navSegments.push({ startIdx: lv.endIdx - lv.total + 1, endIdx: lv.endIdx }))
  } else if (isGrouped) {
    let seg = null
    items.forEach((it, idx) => {
      if (!seg || seg.catId !== it.categoryId) {
        seg = { catId: it.categoryId, startIdx: idx, endIdx: idx }
        navSegments.push(seg)
      }
      seg.endIdx = idx
    })
  }
  const showNav = navSegments.length > 1

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
        <span class="adv-sw-sidebar-heading">Topics</span>
        <div class="adv-sw-categories" id="adv-fg-categories">
          ${visibleCategories.map(cat => {
            const prog = categoryProgress[cat.id]
            return `
              <div class="adv-sw-cat-btn${isGrouped ? ' adv-sw-cat-choosable' : ''}" data-cat="${cat.id}">
                <span class="adv-sw-cat-title">${esc(cat.title)}</span>
                <span class="adv-sw-cat-count" id="adv-fg-cat-${cat.id}">${prog ? `0/${prog.total}` : ''}</span>
              </div>
            `
          }).join('')}
        </div>

        ${isLeveled ? `
          <div class="adv-fg-levels" id="adv-fg-levels">
            ${levels.map(lv => `
              <div class="adv-fg-level-pill" id="adv-fg-level-${lv.level}">
                <span class="adv-fg-level-num">Level ${lv.level}</span>
                <span class="adv-fg-level-check">✓</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

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
  topbar.appendChild(createLeaderboardButton())
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

  // ── Level Indicator ──

  function updateLevelIndicator() {
    if (!isLeveled) return
    const curLevel = items[state.round] ? items[state.round].level : null
    levels.forEach(lv => {
      const pill = el.querySelector(`#adv-fg-level-${lv.level}`)
      if (!pill) return
      // "Done" only when every question in the level was actually answered —
      // skipping past a level (state.round advancing) must NOT mark it complete.
      const startIdx = lv.endIdx - lv.total + 1
      let answered = 0
      for (let i = startIdx; i <= lv.endIdx; i++) {
        if (state.answeredIds.has(items[i].id)) answered++
      }
      pill.classList.toggle('adv-fg-level-active', lv.level === curLevel)
      pill.classList.toggle('adv-fg-level-done', answered >= lv.total)
    })
  }

  // ── Jump to Category ──
  // User can tap a sidebar category to skip ahead to items from that category.
  // Reorders the remaining items so that category's unplayed items come next.

  // ── Navigation (Previous / Skip, level pills, category buttons) ──

  // Jump straight to a round, abandoning the current question. Used by all the
  // manual navigation controls. Keeps the current player's turn (facilitator
  // override rather than a normal turn advance).
  function goToRound(idx) {
    if (cancelled || state.phase === 'complete' || state.phase === 'init') return
    state.round = Math.max(0, Math.min(totalRounds - 1, idx))
    showRound()
  }

  function currentSegmentIdx() {
    return navSegments.findIndex(s => state.round >= s.startIdx && state.round <= s.endIdx)
  }

  function goToSegment(targetIdx) {
    if (targetIdx < 0 || targetIdx >= navSegments.length) return
    goToRound(navSegments[targetIdx].startIdx)
  }

  function updateNavButtons() {
    if (!showNav) return
    const cur = currentSegmentIdx()
    const prevBtn = el.querySelector('#adv-fg-nav-prev')
    const skipBtn = el.querySelector('#adv-fg-nav-skip')
    if (prevBtn) prevBtn.disabled = cur <= 0
    if (skipBtn) skipBtn.disabled = cur >= navSegments.length - 1
  }

  // Tap a sidebar category (all mode) to jump to that category's block.
  function jumpToCategory(catId) {
    const segIdx = navSegments.findIndex(s => items[s.startIdx].categoryId === catId)
    if (segIdx >= 0) goToSegment(segIdx)
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
    if (isMultiplayer) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length
    }
    state.round++

    if (state.round >= totalRounds) {
      showCompletion()
      return
    }

    const prevItem = items[state.round - 1]
    const nextItem = items[state.round]

    const proceed = () => {
      if (isMultiplayer) showTurnPopup(() => showRound())
      else showRound()
    }

    // Crossed a topic boundary (grouped mode) -> show that topic's impact fact
    if (isGrouped && prevItem.categoryId !== nextItem.categoryId) {
      if (IMPACT_MESSAGES[prevItem.categoryId] && !state.shownImpactIds.has(prevItem.categoryId)) {
        state.shownImpactIds.add(prevItem.categoryId)
        showCategoryImpact(prevItem.categoryId, proceed)
        return
      }
    }

    // Crossed into a new level (leveled category mode) -> announce the level
    if (isLeveled && nextItem.level !== prevItem.level) {
      showLevelPopup(nextItem.level, proceed)
      return
    }

    proceed()
  }

  // ── Level Popup ──

  function showLevelPopup(level, onDone) {
    const popup = document.createElement('div')
    popup.className = 'adv-sw-turn-popup adv-fg-level-popup'
    popup.innerHTML = `
      <div class="adv-fg-level-content">
        <span class="adv-fg-level-badge">Level ${level}</span>
      </div>
    `
    mainEl.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => { popup.remove(); onDone() }, 300)
    }, 1500)
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
    mainEl.appendChild(popup)
    requestAnimationFrame(() => popup.classList.add('adv-sw-popup-show'))
    setTimeout(() => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => { popup.remove(); onDone() }, 300)
    }, 1500)
  }

  // ── Generate Choices ──

  function generateChoices(currentItem) {
    const catId = currentItem.categoryId
    const subtype = currentItem.subtype
    const difficulty = currentItem.difficulty || 0
    const catExtras = EXTRA_DISTRACTORS[catId] || {}
    const cat = CATEGORIES.find(c => c.id === catId)

    // Distractor name pools, split by whether they share the item's subtype.
    const sameTypeExtras = shuffleArray((catExtras[subtype] || []).slice())
    const otherTypeExtras = shuffleArray(
      Object.entries(catExtras).filter(([st]) => st !== subtype).flatMap(([, names]) => names),
    )
    const inGame = cat ? cat.items.filter(it => it.id !== currentItem.id && !state.answeredIds.has(it.id)) : []
    const sameTypeItems = shuffleArray(inGame.filter(it => it.subtype === subtype).map(it => it.name))
    const otherTypeItems = shuffleArray(inGame.filter(it => it.subtype !== subtype).map(it => it.name))

    // Difficulty shapes how confusable the choices are:
    //   1   -> lean on cross-type options so the answer stands out (easiest)
    //   3+  -> same-subtype look-alikes only (hardest)
    //   2 / untagged -> balanced, same-type first (original behavior)
    let pref
    if (difficulty >= 3) {
      pref = [...sameTypeExtras, ...sameTypeItems, ...otherTypeExtras, ...otherTypeItems]
    } else if (difficulty === 1) {
      pref = [...otherTypeItems, ...otherTypeExtras, ...sameTypeExtras, ...sameTypeItems]
    } else {
      pref = [...sameTypeExtras, ...otherTypeExtras, ...sameTypeItems, ...otherTypeItems]
    }

    const distractorNames = []
    for (const name of pref) {
      if (distractorNames.length >= 3) break
      if (name === currentItem.name || distractorNames.includes(name)) continue
      distractorNames.push(name)
    }

    const options = [currentItem.name, ...distractorNames]
    shuffleArray(options)
    return {
      options,
      correctIdx: options.indexOf(currentItem.name),
    }
  }

  // ── Show Round ──

  function showRound() {
    state.phase = 'viewing'
    state.cluesRevealed = 0
    clearClueRevealTimers()
    // Detach any stale Next/Finish handler (e.g. navigating mid-feedback).
    if (nextBtnHandler) {
      moreCluesBtn.removeEventListener('pointerdown', nextBtnHandler)
      nextBtnHandler = null
      moreCluesBtn.classList.remove('adv-fg-next-mode')
    }
    updateTurnDisplay()

    const item = items[state.round]
    state.playedCategories.add(item.categoryId)

    // Update topbar + sidebar
    if (isLeveled && item.level) {
      const levelTotal = items.filter(it => it.level === item.level).length
      const qInLevel = items.slice(0, state.round).filter(it => it.level === item.level).length + 1
      el.querySelector('#adv-fg-round-counter').textContent = `Level ${item.level} · Q${qInLevel} of ${levelTotal}`
    } else {
      el.querySelector('#adv-fg-round-counter').textContent = `Q${state.round + 1} of ${totalRounds}`
    }
    highlightCategory(isRandomized ? '__all__' : item.categoryId)
    updateLevelIndicator()
    updateNavButtons()

    // Generate choices
    const { options, correctIdx } = generateChoices(item)
    state.choices = options
    state.correctIdx = correctIdx

    // Load photo
    photoEl.style.display = ''
    placeholderEl.classList.remove('adv-fg-show')
    photoEl.alt = 'Identify this'
    photoEl.onload = () => {
      if (!photoEl.isConnected) return
      photoEl.onerror = null
    }
    photoEl.onerror = () => {
      if (!photoEl.isConnected) return
      photoEl.style.display = 'none'
      placeholderEl.classList.add('adv-fg-show')
      placeholderEl.textContent = '?'
    }
    photoEl.src = item.chosenImage || item.image

    // Preload next image
    if (state.round + 1 < totalRounds) {
      const next = items[state.round + 1]
      preloadImage(next.chosenImage || next.image)
    }

    // Set clues — all start hidden, player taps "Show Clue" to reveal first
    clueEls[0].textContent = item.clues[0]
    clueEls[0].classList.add('adv-fg-clue-hidden')
    clueEls[1].textContent = item.clues[1]
    clueEls[1].classList.add('adv-fg-clue-hidden')
    clueEls[2].textContent = item.clues[2]
    clueEls[2].classList.add('adv-fg-clue-hidden')

    // Controls — start at 400 pts with "Show Clue" button
    controlsEl.style.display = ''
    ptsEl.style.display = ''
    ptsEl.textContent = '400 pts available'
    moreCluesBtn.style.display = ''
    moreCluesBtn.textContent = 'Show Clue (\u2212100 pts)'

    // Hide significance
    significanceEl.classList.add('adv-fg-clue-hidden')
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
    } else {
      moreCluesBtn.textContent = 'More Clues (\u2212100 pts)'
    }
  }

  // ── Handle Answer ──

  function handleAnswer(btnIdx) {
    if (state.phase !== 'viewing') return
    state.phase = 'feedback'

    const item = items[state.round]
    const isCorrect = btnIdx === state.correctIdx
    const buttons = answersEl.querySelectorAll('.adv-fg-answer-btn')

    // Update category progress (skip if this item was already answered, e.g.
    // revisited via the Previous button — avoids over-counting).
    if (categoryProgress[item.categoryId] && !state.answeredIds.has(item.id)) {
      categoryProgress[item.categoryId].answered++
      updateCategoryProgress()
    }

    // Disable all answer buttons
    buttons.forEach(btn => { btn.style.pointerEvents = 'none' })

    // Track this item as answered (correct or not) so it won't appear as a distractor
    state.answeredIds.add(item.id)
    updateLevelIndicator()

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
        image: item.chosenImage || item.image,
      })
    }

    // Reveal remaining clues with staggered fade-in, then significance.
    // Track the timers so advancing early (showRound) can cancel them.
    const hiddenClues = clueEls.filter(c => c.classList.contains('adv-fg-clue-hidden'))
    hiddenClues.forEach((c, i) => {
      clueRevealTimers.push(setTimeout(() => c.classList.remove('adv-fg-clue-hidden'), (i + 1) * 600))
    })

    // Show significance after all clues are revealed
    const sigDelay = (hiddenClues.length + 1) * 600
    significanceEl.textContent = `Significance: ${item.significance}`
    clueRevealTimers.push(setTimeout(() => significanceEl.classList.remove('adv-fg-clue-hidden'), sigDelay))

    // Replace controls with Next/Finish button (reuse More Clues button styling)
    ptsEl.style.display = 'none'
    moreCluesBtn.textContent = state.round + 1 >= totalRounds ? 'Finish' : 'Next \u2192'
    moreCluesBtn.style.display = ''
    moreCluesBtn.classList.add('adv-fg-next-mode')

    // Swap handler: remove old revealClue, add advance.
    // `advanced` makes this idempotent — a fast double-tap on the touchscreen
    // can't advance the round twice (which could overrun the items array).
    let advanced = false
    const nextHandler = () => {
      if (cancelled || advanced || state.phase === 'complete') return
      advanced = true
      moreCluesBtn.removeEventListener('pointerdown', nextHandler)
      nextBtnHandler = null
      moreCluesBtn.classList.remove('adv-fg-next-mode')

      // Last item of a single-topic game -> show that topic's impact, then finish.
      // (Grouped/randomized end via advanceTurn -> showCompletion's impact overlay.)
      if (state.round + 1 >= totalRounds && isSingle) {
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
    nextBtnHandler = nextHandler
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
    trackGameComplete('adv-field-guide', 'advanced', { playerCount: state.players.length, score: Math.max(...state.players.map(p => p.score)) })
    recordScores({
      gameId: 'adv-field-guide',
      runId: state.runId,
      entries: state.players.map(p => ({ playerName: p.name, teamId: p.teamId, points: p.score })),
      eventId: getScoreEventId(),
    }).catch(err => console.error('recordScores failed', err))

    function afterImpact() {
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

      const answered = state.round
      const maxPts = totalRounds * 400
      const detail = fromQuit
        ? `${answered}/${totalRounds} questions completed`
        : isMultiplayer
          ? `${INSTRUCTIONS.completion}`
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

  // ── Confirm Back ──

  function confirmBack() {
    if (state.round === 0 && state.phase === 'viewing' && state.cluesRevealed === 0) {
      cancelled = true
      transitionTo(el, createIntroScreen())
      return
    }
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
    popup.querySelector('#adv-confirm-stay').addEventListener('pointerdown', () => {
      popup.classList.remove('adv-sw-popup-show')
      setTimeout(() => popup.remove(), 300)
    })
    popup.querySelector('#adv-confirm-leave').addEventListener('pointerdown', () => {
      cancelled = true
      transitionTo(el, createIntroScreen())
    })
  }

  // ── Event Bindings ──

  el.querySelector('#adv-fg-home').addEventListener('pointerdown', () => confirmBack())

  moreCluesBtn.addEventListener('pointerdown', () => revealClue())

  answersEl.querySelectorAll('.adv-fg-answer-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      handleAnswer(parseInt(btn.dataset.idx))
    })
  })

  // Category click handlers (grouped mode only) — tap to jump to that topic's block
  if (isGrouped) {
    el.querySelectorAll('.adv-sw-cat-btn').forEach(btn => {
      btn.addEventListener('pointerdown', () => jumpToCategory(btn.dataset.cat))
    })
  }

  // Level pills (leveled mode) — tap to jump to any level, even ahead
  el.querySelectorAll('.adv-fg-level-pill').forEach(pill => {
    pill.addEventListener('pointerdown', () => {
      const lvNum = parseInt(pill.id.replace('adv-fg-level-', ''), 10)
      const segIdx = navSegments.findIndex(s => items[s.startIdx].level === lvNum)
      if (segIdx >= 0) goToSegment(segIdx)
    })
  })

  // Previous / Skip navigation row (above Quit), shown only when there is more
  // than one segment to move between (levels, or categories in All mode).
  if (showNav) {
    const navRow = document.createElement('div')
    navRow.className = 'adv-fg-nav-row'
    navRow.innerHTML = `
      <button class="adv-fg-nav-btn" id="adv-fg-nav-prev">← Previous</button>
      <button class="adv-fg-nav-btn" id="adv-fg-nav-skip">${isLeveled ? 'Skip Level →' : 'Next Topic →'}</button>
    `
    el.querySelector('.adv-sw-sidebar').appendChild(navRow)
    navRow.querySelector('#adv-fg-nav-prev').addEventListener('pointerdown', () => {
      const cur = currentSegmentIdx()
      if (cur > 0) goToSegment(cur - 1)
    })
    navRow.querySelector('#adv-fg-nav-skip').addEventListener('pointerdown', () => {
      const cur = currentSegmentIdx()
      if (cur >= 0 && cur < navSegments.length - 1) goToSegment(cur + 1)
    })
  }

  // Quit button in sidebar
  const quitBtn = document.createElement('button')
  quitBtn.className = 'adv-fg-quit-btn'
  quitBtn.textContent = 'Quit'
  el.querySelector('.adv-sw-sidebar').appendChild(quitBtn)
  quitBtn.addEventListener('pointerdown', () => { cancelled = true; trackGameQuit('adv-field-guide', 'advanced', state.round); showCompletion(true) })

  // ── Initialize ──

  updateTurnDisplay()
  updateScores()
  updateCategoryProgress()
  updateLevelIndicator()
  updateNavButtons()

  if (isLeveled) {
    const firstName = state.players[state.currentPlayer].name
    setTimeout(() => showLevelPopup(items[0].level, () => {
      if (isMultiplayer) showTurnPopup(() => showRound(), `${firstName} goes first!`)
      else showRound()
    }), 400)
  } else if (isMultiplayer) {
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
