/**
 * Shared animated gradient sphere background for advanced mode screens.
 * Each screen gets a unique color/position variant.
 */

const VARIANTS = {
  'game-select': {
    sphere1: 'linear-gradient(40deg, rgba(56, 206, 188, 0.6), rgba(0, 100, 80, 0.3))',
    sphere2: 'linear-gradient(200deg, rgba(0, 80, 120, 0.6), rgba(56, 206, 188, 0.3))',
    sphere3: 'linear-gradient(320deg, rgba(184, 232, 74, 0.35), rgba(56, 206, 188, 0.2))',
    pos1: 'top: -15%; right: -5%;',
    pos2: 'bottom: -20%; left: -10%;',
    pos3: 'top: 50%; left: 50%;',
  },
  'spin-wheel': {
    sphere1: 'linear-gradient(60deg, rgba(0, 150, 136, 0.7), rgba(56, 206, 188, 0.3))',
    sphere2: 'linear-gradient(220deg, rgba(184, 232, 74, 0.5), rgba(100, 180, 60, 0.25))',
    sphere3: 'linear-gradient(140deg, rgba(0, 80, 100, 0.5), rgba(56, 206, 188, 0.2))',
    pos1: 'top: -20%; left: -15%;',
    pos2: 'bottom: -15%; right: -10%;',
    pos3: 'top: 30%; right: 30%;',
  },
  'trivia-blitz': {
    sphere1: 'linear-gradient(80deg, rgba(56, 206, 188, 0.6), rgba(0, 120, 100, 0.3))',
    sphere2: 'linear-gradient(260deg, rgba(163, 107, 255, 0.4), rgba(56, 206, 188, 0.2))',
    sphere3: 'linear-gradient(160deg, rgba(184, 232, 74, 0.4), rgba(0, 150, 80, 0.2))',
    pos1: 'top: -10%; right: -20%;',
    pos2: 'bottom: -25%; left: -5%;',
    pos3: 'top: 60%; left: 10%;',
  },
  'jeopardy': {
    sphere1: 'linear-gradient(30deg, rgba(184, 232, 74, 0.5), rgba(56, 206, 188, 0.3))',
    sphere2: 'linear-gradient(210deg, rgba(0, 100, 80, 0.7), rgba(56, 206, 188, 0.3))',
    sphere3: 'linear-gradient(100deg, rgba(56, 206, 188, 0.4), rgba(0, 60, 80, 0.25))',
    pos1: 'top: -20%; left: 10%;',
    pos2: 'bottom: -10%; right: -15%;',
    pos3: 'top: 40%; left: -10%;',
  },
  'word-game': {
    sphere1: 'linear-gradient(50deg, rgba(0, 180, 160, 0.6), rgba(56, 206, 188, 0.25))',
    sphere2: 'linear-gradient(230deg, rgba(100, 180, 60, 0.5), rgba(184, 232, 74, 0.2))',
    sphere3: 'linear-gradient(130deg, rgba(56, 206, 188, 0.5), rgba(0, 80, 100, 0.3))',
    pos1: 'top: -10%; left: -20%;',
    pos2: 'bottom: -20%; right: 5%;',
    pos3: 'top: 70%; left: 40%;',
  },
  'field-guide': {
    sphere1: 'linear-gradient(70deg, rgba(56, 206, 188, 0.5), rgba(0, 120, 60, 0.4))',
    sphere2: 'linear-gradient(240deg, rgba(120, 200, 80, 0.5), rgba(56, 206, 188, 0.2))',
    sphere3: 'linear-gradient(150deg, rgba(0, 100, 80, 0.4), rgba(184, 232, 74, 0.3))',
    pos1: 'top: -15%; right: -10%;',
    pos2: 'bottom: -15%; left: -15%;',
    pos3: 'top: 45%; left: -5%;',
  },
  'connections': {
    sphere1: 'linear-gradient(45deg, rgba(153, 115, 255, 0.5), rgba(56, 206, 188, 0.3))',
    sphere2: 'linear-gradient(225deg, rgba(255, 113, 206, 0.4), rgba(184, 232, 74, 0.2))',
    sphere3: 'linear-gradient(135deg, rgba(56, 206, 188, 0.5), rgba(153, 115, 255, 0.25))',
    pos1: 'top: -15%; left: -10%;',
    pos2: 'bottom: -20%; right: -5%;',
    pos3: 'top: 55%; left: 30%;',
  },
}

const PARTICLE_COUNT = 60

function animateParticle(particle) {
  const posX = Math.random() * 100
  const posY = Math.random() * 100
  particle.style.left = `${posX}%`
  particle.style.top = `${posY}%`
  particle.style.opacity = '0'
  particle.style.transition = 'none'

  const duration = Math.random() * 10 + 10
  const delay = Math.random() * 5

  setTimeout(() => {
    if (!particle.parentNode) return
    particle.style.transition = `all ${duration}s linear`
    particle.style.opacity = String(Math.random() * 0.25 + 0.05)
    const moveX = posX + (Math.random() * 20 - 10)
    const moveY = posY - Math.random() * 30
    particle.style.left = `${moveX}%`
    particle.style.top = `${moveY}%`

    setTimeout(() => {
      if (particle.parentNode) animateParticle(particle)
    }, duration * 1000)
  }, delay * 1000)
}

function initParticles(container) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div')
    p.className = 'adv-gradient-particle'
    const size = Math.random() * 3 + 1
    p.style.width = `${size}px`
    p.style.height = `${size}px`
    container.appendChild(p)
    animateParticle(p)
  }
}

/**
 * Creates the gradient sphere background HTML and prepends it to the given element.
 * @param {HTMLElement} el - The screen element to add the background to
 * @param {string} variant - Key from VARIANTS (e.g., 'game-select', 'spin-wheel')
 */
export function addGradientBackground(el, variant = 'game-select') {
  const v = VARIANTS[variant] || VARIANTS['game-select']

  const bg = document.createElement('div')
  bg.className = 'adv-gradient-bg'
  bg.innerHTML = `
    <div class="adv-gradient-sphere adv-gradient-sphere-1" style="background: ${v.sphere1}; ${v.pos1}"></div>
    <div class="adv-gradient-sphere adv-gradient-sphere-2" style="background: ${v.sphere2}; ${v.pos2}"></div>
    <div class="adv-gradient-sphere adv-gradient-sphere-3" style="background: ${v.sphere3}; ${v.pos3}"></div>
    <div class="adv-gradient-grid"></div>
    <div class="adv-gradient-noise"></div>
    <div class="adv-gradient-particles"></div>
  `
  el.prepend(bg)

  // Initialize floating particles
  const particlesContainer = bg.querySelector('.adv-gradient-particles')
  initParticles(particlesContainer)
}
