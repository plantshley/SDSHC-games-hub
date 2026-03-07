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
import { createSoilCakeGame } from './games/soil-cake.js'

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
    case 'game': {
      const game = getGameById(route.gameId)

      // Route to implemented games
      if (route.gameId === 'soil-cake') {
        switchScreen(createSoilCakeGame())
        break
      }

      // Placeholder for unimplemented games
      const placeholder = document.createElement('div')
      placeholder.className = 'screen game-placeholder'
      placeholder.innerHTML = `
        <div class="game-placeholder-topbar">
          <button class="home-btn" id="game-back">
            <img src="/assets/sprites/ui_board-home.png" alt="Back">
          </button>
          <span class="game-placeholder-title">${game ? game.title : route.gameId}</span>
          <span class="game-placeholder-level">Level ${route.level + 1}</span>
        </div>
        <div class="game-placeholder-body">
          <p>Game coming soon!</p>
        </div>
      `
      placeholder.querySelector('#game-back').addEventListener('pointerdown', () => {
        navigate(`game-select/${game ? game.tier : 'sprouts'}`)
      })
      switchScreen(placeholder)
      break
    }
  }
}

// Initialize
onRoute(handleRoute)
initRouter()

initIdleTimer(() => {
  clearProgress()
  navigate('splash')
})
