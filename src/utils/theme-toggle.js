/**
 * Shared dark/light theme toggle for advanced mode screens.
 */

import { trackThemeToggle } from './analytics.js'

export function getTheme() {
  return localStorage.getItem('sdshc-theme') || 'dark'
}

export function setTheme(theme) {
  localStorage.setItem('sdshc-theme', theme)
  const app = document.getElementById('app')
  if (theme === 'light') {
    app.dataset.theme = 'light'
  } else {
    delete app.dataset.theme
  }
  window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }))
}

/**
 * Creates a theme toggle button element and wires up the click handler.
 * @returns {HTMLButtonElement}
 */
export function createThemeToggle() {
  const btn = document.createElement('button')
  btn.className = 'adv-theme-toggle'
  btn.title = 'Toggle dark/light theme'
  btn.textContent = getTheme() === 'dark' ? '\u2600' : '\u263E'

  btn.addEventListener('pointerdown', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    trackThemeToggle(next)
    btn.textContent = next === 'dark' ? '\u2600' : '\u263E'
  })

  return btn
}
