/**
 * Intro Screen — Mode selection (Kid Mode / Advanced Mode)
 * Animated gradient spheres, floating particles, touch-interactive effects.
 */

import { navigateRaw } from '../router.js'

const PARTICLE_COUNT = 80

/**
 * Spawn burst particles at a given position inside a container.
 * Adapted from coloring.js spawnFillParticles().
 */
function spawnBurstParticles(container, x, y) {
  const count = 14
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    particle.className = 'intro-burst-particle'
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 50 + Math.random() * 80
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    particle.style.setProperty('--dx', dx + 'px')
    particle.style.setProperty('--dy', dy + 'px')
    const BURST_COLORS = ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96']
    particle.style.backgroundColor = BURST_COLORS[i % BURST_COLORS.length]
    particle.style.left = x + 'px'
    particle.style.top = y + 'px'
    container.appendChild(particle)
    particle.addEventListener('animationend', () => particle.remove())
  }
}

/**
 * Create and animate ambient floating particles.
 */
function initAmbientParticles(container) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    createAmbientParticle(container)
  }
}

function createAmbientParticle(container) {
  const particle = document.createElement('div')
  particle.className = 'intro-ambient-particle'
  const size = Math.random() * 3 + 1
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  container.appendChild(particle)
  animateParticle(particle)
}

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
    particle.style.opacity = String(Math.random() * 0.3 + 0.1)
    const moveX = posX + (Math.random() * 20 - 10)
    const moveY = posY - Math.random() * 30
    particle.style.left = `${moveX}%`
    particle.style.top = `${moveY}%`

    setTimeout(() => {
      if (particle.parentNode) animateParticle(particle)
    }, duration * 1000)
  }, delay * 1000)
}

/**
 * Handle touch/pointer interaction — spawn particles at touch point
 * and subtly shift gradient spheres.
 */
function initTouchInteraction(screen) {
  const particlesContainer = screen.querySelector('.intro-particles')
  const spheres = screen.querySelectorAll('.intro-sphere')

  screen.addEventListener('pointermove', (e) => {
    const mouseX = (e.clientX / window.innerWidth) * 100
    const mouseY = (e.clientY / window.innerHeight) * 100

    // Spawn touch particle
    const particle = document.createElement('div')
    particle.className = 'intro-ambient-particle'
    const size = Math.random() * 4 + 2
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    particle.style.left = `${mouseX}%`
    particle.style.top = `${mouseY}%`
    particle.style.opacity = '0.6'
    particlesContainer.appendChild(particle)

    setTimeout(() => {
      particle.style.transition = 'all 2s ease-out'
      particle.style.left = `${mouseX + (Math.random() * 10 - 5)}%`
      particle.style.top = `${mouseY + (Math.random() * 10 - 5)}%`
      particle.style.opacity = '0'
      setTimeout(() => particle.remove(), 2000)
    }, 10)

    // Subtle sphere shift
    const moveX = (e.clientX / window.innerWidth - 0.5) * 5
    const moveY = (e.clientY / window.innerHeight - 0.5) * 5
    spheres.forEach(sphere => {
      sphere.style.transform = `translate(${moveX}px, ${moveY}px)`
    })
  })
}

export function createIntroScreen() {
  const screen = document.createElement('div')
  screen.className = 'screen intro-screen'

  screen.innerHTML = `
    <img class="intro-logo" src="/assets/sdshc-logo.png" alt="" />
    <div class="intro-gradient-bg">
      <div class="intro-sphere intro-sphere-1"></div>
      <div class="intro-sphere intro-sphere-2"></div>
      <div class="intro-sphere intro-sphere-3"></div>
      <div class="intro-glow"></div>
      <div class="intro-grid"></div>
      <div class="intro-noise"></div>
      <div class="intro-particles"></div>
    </div>

    <div class="intro-content">
      <h1 class="intro-title">SDSHC Games Hub</h1>
      <p class="intro-subtitle">Choose a mode to test your soil health knowledge.</p>

      <div class="intro-buttons">
        <button class="intro-mode-btn intro-btn-kid" data-mode="kid">
          <span class="intro-ripple"></span>
          <span class="intro-btn-label">Kid Mode</span>
          <span class="intro-btn-desc">Pre-K through Middle School</span>
        </button>

        <button class="intro-mode-btn intro-btn-advanced" data-mode="advanced">
          <span class="intro-ripple"></span>
          <span class="intro-btn-label">Advanced Mode</span>
          <span class="intro-btn-desc">High School &amp; College</span>
        </button>
      </div>
    </div>
  `

  // Initialize ambient particles
  const particlesContainer = screen.querySelector('.intro-particles')
  initAmbientParticles(particlesContainer)

  // Initialize touch interaction
  initTouchInteraction(screen)

  // Button handlers
  const buttons = screen.querySelectorAll('.intro-mode-btn')
  buttons.forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      // Visual tap feedback
      btn.classList.add('tapped')

      // Particle burst at tap position
      const rect = screen.getBoundingClientRect()
      spawnBurstParticles(screen, e.clientX - rect.left, e.clientY - rect.top)

      // Navigate after a brief delay for the burst effect
      const mode = btn.dataset.mode
      setTimeout(() => {
        if (mode === 'kid') {
          navigateRaw('kid/grade-select')
        } else {
          navigateRaw('advanced/game-select')
        }
      }, 800)
    })
  })

  return screen
}
