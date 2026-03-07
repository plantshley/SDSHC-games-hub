import { navigate } from '../router.js'

const TIERS = [
  {
    id: 'sprouts',
    title: 'Little Sprouts',
    grades: 'Pre-K \u2013 2nd Grade',
    icon: '/assets/sprites/Basic_Grass_Biom_things_sprout.png',
  },
  {
    id: 'meadow',
    title: 'Meadow Makers',
    grades: '3rd \u2013 5th Grade',
    icon: '/assets/sprites/Basic_Grass_Biom_things_flower1.png',
  },
  {
    id: 'guardians',
    title: 'Harvest Guardians',
    grades: 'Middle & High School',
    icon: '/assets/sprites/Basic_Grass_Biom_things_tree-apple.png',
  },
]

// Foliage - height only to preserve aspect ratio. Some flipped for variety.
const FOLIAGE = [
  { src: '/assets/sprites/Basic_Grass_Biom_things_tree2.png', style: 'left:30px;bottom:60px;height:180px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_tree-apple.png', style: 'right:40px;bottom:60px;height:170px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'left:200px;bottom:50px;height:70px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'right:220px;bottom:50px;height:70px;transform:scaleX(-1);' },
  { src: '/assets/gifs/flowers-gif.gif', style: 'left:320px;bottom:55px;height:80px;' },
  { src: '/assets/gifs/flowers-gif.gif', style: 'right:340px;bottom:55px;height:80px;transform:scaleX(-1);' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'left:100px;bottom:55px;height:90px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'right:100px;bottom:55px;height:90px;transform:scaleX(-1);' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_rock.png', style: 'right:160px;bottom:52px;height:40px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom.png', style: 'left:520px;bottom:56px;height:40px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_flower2.png', style: 'right:480px;bottom:58px;height:50px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_flower3.png', style: 'right:540px;bottom:56px;height:50px;transform:scaleX(-1);' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_rock-sm.png', style: 'left:440px;bottom:52px;height:28px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_sprout.png', style: 'left:280px;bottom:56px;height:36px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom3.png', style: 'left:700px;bottom:54px;height:36px;' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom2.png', style: 'right:600px;bottom:54px;height:40px;transform:scaleX(-1);' },
  { src: '/assets/gifs/flowers-gif.gif', style: 'left:600px;bottom:55px;height:72px;transform:scaleX(-1);' },
  { src: '/assets/sprites/Basic_Grass_Biom_things_tree1.png', style: 'left:800px;bottom:58px;height:140px;' },
]

function createFoliage() {
  const container = document.createElement('div')
  container.className = 'foliage-decor'

  for (const item of FOLIAGE) {
    const img = document.createElement('img')
    img.src = item.src
    img.alt = ''
    img.setAttribute('style', item.style)
    container.appendChild(img)
  }

  return container
}

function addSparkles(el, count = 14) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div')
    sparkle.className = 'sparkle'
    sparkle.style.left = `${Math.random() * 100}%`
    sparkle.style.top = `${Math.random() * 60}%`
    sparkle.style.animationDelay = `${Math.random() * 3}s`
    sparkle.style.animationDuration = `${1.5 + Math.random() * 2}s`
    const size = 4 + Math.random() * 6
    sparkle.style.width = `${size}px`
    sparkle.style.height = `${size}px`
    el.appendChild(sparkle)
  }
}

export function createGradeSelectScreen() {
  const el = document.createElement('div')
  el.className = 'screen grade-screen'

  const buttonsHtml = TIERS.map(tier => `
    <button class="tier-btn" data-tier="${tier.id}">
      <div class="tier-btn-outer">
        <div class="tier-btn-inner">
          <img class="tier-icon" src="${tier.icon}" alt="">
          <span class="tier-title">${tier.title}</span>
          <span class="tier-grades">${tier.grades}</span>
        </div>
      </div>
    </button>
  `).join('')

  // No .grade-bg div — background is on .grade-screen itself via CSS
  el.innerHTML = `
    <div class="grade-content">
      <div class="grade-buttons">
        ${buttonsHtml}
      </div>
    </div>
    <div class="character-area">
      <div class="speech-bubble">
        <span class="speech-bubble-text">Choose a level!</span>
      </div>
      <img class="character-wave" src="/assets/sprites/Basic_Charakter_wave.png" alt="Farmer waving">
      <div class="ground-strip"></div>
      <img class="walking-animal walk-right-flip" src="/assets/gifs/ducks-gif.gif" style="height:56px;bottom:58px;animation-delay:-5s;animation-duration:32s;" alt="">
      <img class="walking-animal walk-left-flip" src="/assets/gifs/cow-gif.gif" style="height:64px;bottom:48px;animation-delay:-10s;animation-duration:40s;" alt="">
      <img class="fixed-animal" src="/assets/sprites/Free_Chicken_Sprites_1.png" style="height:40px;bottom:60px;left:180px;" alt="">
    </div>
  `

  el.appendChild(createFoliage())
  addSparkles(el)

  el.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      navigate(`game-select/${btn.dataset.tier}`)
    })
  })

  return el
}
