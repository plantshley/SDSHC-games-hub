import { navigate } from '../router.js'
import { getGamesForTier, TIER_META } from '../data/game-registry.js'

// Manual line breaks for game titles to ensure 2-line wrapping
const TITLE_OVERRIDES = {
  'soil-cake': 'Build a<br>Soil Cake',
  'dot-to-dot': 'What Does<br>Soil Make?',
  'dont-belong': "Things That<br>Don't Belong",
  'coloring': 'Soil Critter<br>Coloring',
  'planting-sim': 'Planting<br>Simulation',
  'spin-wheel': 'Spin the<br>Soil Wheel',
  'odd-one-out': 'Odd<br>One Out',
  'drag-drop': 'Drag & Drop<br>Match',
  'farm-manager': 'Farm Manager<br>Simulator',
  'trivia-blitz': 'Soil Health<br>Trivia Blitz',
  'food-web': 'Soil Food<br>Web Builder',
}

// Tier color CSS variable mapping
const TIER_COLORS = {
  sprouts: { color: '#a6c264', dark: '#7a9a3a' },
  meadow: { color: '#e496d7', dark: '#c06ab0' },
  guardians: { color: '#38cebc', dark: '#1fa393' },
}

function createHearts(count) {
  return Array.from({ length: count }, () => '\u2661').join('')
}

function createDecorations() {
  const container = document.createElement('div')
  container.className = 'game-select-decor'

  const items = [
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree1.png', style: 'left:16px;bottom:10px;height:180px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree2.png', style: 'right:16px;bottom:10px;height:170px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree-apple.png', style: 'left:200px;bottom:10px;height:150px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree1.png', style: 'right:200px;bottom:10px;height:140px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'left:140px;bottom:8px;height:64px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'right:150px;bottom:8px;height:64px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'left:50%;bottom:8px;height:56px;transform:translateX(-50%);' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'left:300px;bottom:8px;height:90px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'right:300px;bottom:8px;height:90px;transform:scaleX(-1);' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'left:50%;bottom:8px;height:80px;transform:translateX(-120px);' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'left:50%;bottom:8px;height:80px;transform:translateX(40px) scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'left:60px;bottom:10px;height:100px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'right:60px;bottom:10px;height:100px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'left:440px;bottom:10px;height:80px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_flower1.png', style: 'left:480px;bottom:10px;height:52px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_flower2.png', style: 'right:480px;bottom:10px;height:52px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_flower3.png', style: 'left:560px;bottom:10px;height:52px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_flower3.png', style: 'right:560px;bottom:10px;height:52px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_rock-sm.png', style: 'left:360px;bottom:8px;height:0px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_rock.png', style: 'right:260px;bottom:6px;height:36px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_rock-sm.png', style: 'right:440px;bottom:8px;height:0px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom.png', style: 'left:420px;bottom:8px;height:36px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sprout.png', style: 'right:420px;bottom:10px;height:0px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom2.png', style: 'right:600px;bottom:8px;height:40px;transform:scaleX(-1);' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom3.png', style: 'left:700px;bottom:8px;height:32px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sprout.png', style: 'left:650px;bottom:10px;height:10px;transform:scaleX(-1);' },
    { src: '/assets/gifs/frog.gif', style: 'left:520px;bottom:30px;height:60px;' },
    { src: '/assets/gifs/bee-gif2.gif', style: 'right:430px;bottom:50px;height:50px;' },
    { src: '/assets/gifs/butterflies-gif.gif', style: 'left:100px;bottom:60px;height:100px;' },
  ]

  for (const item of items) {
    const img = document.createElement('img')
    img.src = item.src
    img.alt = ''
    img.setAttribute('style', item.style)
    container.appendChild(img)
  }

  // Floating character in bottom-right corner
  const character = document.createElement('img')
  character.className = 'corner-character'
  character.src = '/assets/sprites/Basic_Charakter_plain.png'
  character.alt = ''
  container.appendChild(character)

  return container
}

const TWINKLE_GIFS = [
  '/assets/gifs/d16-icon-twinkle.gif',
  '/assets/gifs/d17-icon-twinkle.gif',
  '/assets/gifs/d18-icon-twinkle.gif',
  '/assets/gifs/e21-icon-twinkle.gif',
  '/assets/gifs/f09-icon-twinkle.gif',
  '/assets/gifs/g04-icon-twinkle.gif',
  '/assets/gifs/g05-icon-twinkle.gif',
]

function addSparkles(el, count = 20) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('img')
    sparkle.className = 'sparkle'
    sparkle.src = TWINKLE_GIFS[Math.floor(Math.random() * TWINKLE_GIFS.length)]
    sparkle.alt = ''
    sparkle.style.left = `${5 + Math.random() * 90}%`
    sparkle.style.top = `${5 + Math.random() * 85}%`
    sparkle.style.animationDelay = `${Math.random() * 3}s`
    sparkle.style.animationDuration = `${1.5 + Math.random() * 2}s`
    const size = 20 + Math.random() * 20
    sparkle.style.width = `${size}px`
    sparkle.style.height = `${size}px`
    el.appendChild(sparkle)
  }
}

export function createGameSelectScreen(tier) {
  const el = document.createElement('div')
  el.className = 'screen game-select-screen'

  const tierInfo = TIER_META[tier]
  const tierColors = TIER_COLORS[tier]
  const games = getGamesForTier(tier)

  const gridCols = games.length <= 3 ? 'cols-3' : 'cols-4'

  const cardsHtml = games.map((game, i) => {
    const title = TITLE_OVERRIDES[game.id] || game.title
    return `
      <button class="game-card" data-tier="${tier}" data-game="${game.id}">
        <div class="game-card-outer" style="--card-color: ${tierColors.color}; --card-color-dark: ${tierColors.dark};">
          <div class="game-card-inner">
            <img class="game-card-icon" src="${game.icon}" alt="">
            <span class="game-card-title">${title}</span>
            <span class="game-card-levels">${game.description}</span>
          </div>
        </div>
      </button>
    `
  }).join('')

  el.innerHTML = `
    <div class="game-select-bg"></div>
    <div class="game-select-header">
      <button class="home-btn">
        <img src="/assets/sprites/ui_board-home.png" alt="Home">
      </button>
      <h2 class="game-select-title" data-tier="${tier}"><span class="typing-text">${tierInfo.name}</span></h2>
    </div>
    <div class="game-grid-wrapper">
      <div class="game-grid ${gridCols}">
        ${cardsHtml}
      </div>
    </div>
  `

  el.appendChild(createDecorations())
  addSparkles(el)

  el.querySelector('.home-btn').addEventListener('pointerdown', () => {
    navigate('grade-select')
  })

  el.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      navigate(`game/${card.dataset.game}/0`)
    })
  })

  return el
}
