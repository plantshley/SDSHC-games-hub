import { navigate } from '../router.js'

export function createSplashScreen() {
  const el = document.createElement('div')
  el.className = 'screen splash-screen'
  el.innerHTML = `
    <div class="splash-bg"></div>
    <div class="splash-content">
      <h1 class="splash-title">SDSHC Games Hub</h1>
      <p class="splash-subtitle">Tap to Start!</p>
    </div>
  `

  el.addEventListener('pointerdown', () => {
    navigate('grade-select')
  })

  return el
}
