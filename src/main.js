import './styles/base.css'
import './styles/hub.css'
import './styles/transitions.css'
import './styles/games.css'

import { initRouter, onRoute, navigate } from './router.js'
import { initIdleTimer, clearProgress } from './idle-timer.js'
import { createSplashScreen } from './screens/splash.js'
import { createGradeSelectScreen } from './screens/grade-select.js'
import { createGameSelectScreen } from './screens/game-select.js'
import { getGameById } from './data/game-registry.js'

const app = document.getElementById('app')
let currentScreen = null

function switchScreen(newScreenEl) {
  if (currentScreen) {
    currentScreen.classList.remove('active')
    currentScreen.classList.add('exiting')

    const old = currentScreen
    old.addEventListener('animationend', () => {
      old.remove()
    }, { once: true })

    // Fallback removal if animation doesn't fire
    setTimeout(() => {
      if (old.parentNode) old.remove()
    }, 400)
  }

  app.appendChild(newScreenEl)

  // Force reflow before adding active class for animation
  newScreenEl.offsetHeight
  newScreenEl.classList.add('active', 'entering')

  newScreenEl.addEventListener('animationend', () => {
    newScreenEl.classList.remove('entering')
  }, { once: true })

  currentScreen = newScreenEl
}

function handleRoute(route) {
  switch (route.screen) {
    case 'splash':
      switchScreen(createSplashScreen())
      break
    case 'grade-select':
      switchScreen(createGradeSelectScreen())
      break
    case 'game-select':
      switchScreen(createGameSelectScreen(route.tier))
      break
    case 'game':
      // Placeholder: will load game modules later
      const placeholder = document.createElement('div')
      placeholder.className = 'screen'
      placeholder.style.cssText = 'background:var(--color-cream);'
      placeholder.innerHTML = `
        <div class="game-topbar">
          <button class="game-topbar-home" id="game-back">
            <img src="/assets/sprites/ui_board-home.png" alt="Back">
          </button>
          <span class="game-topbar-title">${route.gameId}</span>
          <span class="game-topbar-level">Level ${route.level + 1}</span>
        </div>
        <div class="game-content" style="display:flex;align-items:center;justify-content:center;">
          <p style="font-family:var(--font-header);font-size:24px;color:var(--color-text);">
            Game coming soon!
          </p>
        </div>
      `
      placeholder.querySelector('#game-back').addEventListener('pointerdown', () => {
        const game = getGameById(route.gameId)
        navigate(`game-select/${game ? game.tier : 'sprouts'}`)
      })
      switchScreen(placeholder)
      break
  }
}

// Initialize
onRoute(handleRoute)
initRouter()

initIdleTimer(() => {
  clearProgress()
  navigate('splash')
})
