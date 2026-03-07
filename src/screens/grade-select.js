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
    icon: '/assets/sprites/Basic_Grass_Biom_things_tree1.png',
  },
]

function createFoliage() {
  const container = document.createElement('div')
  container.className = 'foliage-decor'

  const decorItems = [
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree2.png', style: 'left:40px;bottom:60px;width:120px;height:160px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_tree-apple.png', style: 'right:60px;bottom:60px;width:110px;height:150px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'left:180px;bottom:50px;width:80px;height:60px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_bushes.png', style: 'right:200px;bottom:50px;width:80px;height:60px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'left:300px;bottom:65px;width:48px;height:48px;' },
    { src: '/assets/gifs/flowers-gif.gif', style: 'right:320px;bottom:65px;width:48px;height:48px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_sunflower.png', style: 'left:80px;bottom:65px;width:40px;height:64px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_rock.png', style: 'right:140px;bottom:55px;width:48px;height:36px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_mushroom.png', style: 'left:500px;bottom:58px;width:32px;height:32px;' },
    { src: '/assets/gifs/ducks-gif.gif', style: 'left:650px;bottom:70px;width:64px;height:48px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_flower2.png', style: 'right:450px;bottom:65px;width:32px;height:40px;' },
    { src: '/assets/sprites/Basic_Grass_Biom_things_flower3.png', style: 'right:500px;bottom:62px;width:32px;height:40px;' },
  ]

  for (const item of decorItems) {
    const img = document.createElement('img')
    img.src = item.src
    img.alt = ''
    img.setAttribute('style', item.style)
    container.appendChild(img)
  }

  return container
}

export function createGradeSelectScreen() {
  const el = document.createElement('div')
  el.className = 'screen grade-screen'

  // Buttons
  const buttonsHtml = TIERS.map(tier => `
    <button class="tier-btn" data-tier="${tier.id}">
      <div class="tier-accent"></div>
      <img class="tier-icon" src="${tier.icon}" alt="">
      <span class="tier-title">${tier.title}</span>
      <span class="tier-grades">${tier.grades}</span>
    </button>
  `).join('')

  el.innerHTML = `
    <div class="grade-content">
      <div class="grade-buttons stagger-children">
        ${buttonsHtml}
      </div>
    </div>
    <div class="character-area">
      <div class="speech-bubble">
        <span class="speech-bubble-text">Choose a level!</span>
      </div>
      <img class="character-wave" src="/assets/sprites/Basic_Charakter_wave.png" alt="Farmer waving">
      <div class="ground-strip"></div>
    </div>
  `

  // Foliage
  el.appendChild(createFoliage())

  // Button handlers
  el.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      navigate(`game-select/${btn.dataset.tier}`)
    })
  })

  return el
}
