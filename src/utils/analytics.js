/**
 * Google Analytics 4 — lightweight wrapper
 * Measurement ID: G-P08D60FD2Y
 * Fails silently when offline or blocked.
 */

function gtag() {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(arguments)
}

/** Send a custom GA4 event. Silently no-ops if gtag isn't loaded. */
export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params)
    }
  } catch {
    // Silently fail — offline or blocked
  }
}

// ─── Specific event helpers ───

export function trackModeSelect(mode) {
  trackEvent('mode_select', { mode })
}

export function trackGradeTierSelect(tier) {
  trackEvent('grade_tier_select', { tier })
}

export function trackGameStart(gameId, mode, { tier = null, playerCount = 1 } = {}) {
  trackEvent('game_start', {
    game_id: gameId,
    mode,
    tier,
    player_count: playerCount,
  })
}

export function trackGameComplete(gameId, mode, { playerCount = 1, score = 0 } = {}) {
  trackEvent('game_complete', {
    game_id: gameId,
    mode,
    player_count: playerCount,
    score,
  })
}

export function trackGameQuit(gameId, mode, roundsPlayed = 0) {
  trackEvent('game_quit', {
    game_id: gameId,
    mode,
    rounds_played: roundsPlayed,
  })
}

export function trackIdleTimeout(mode, lastScreen) {
  trackEvent('idle_timeout', {
    mode,
    last_screen: lastScreen,
  })
}

export function trackTopicSelect(gameId, topics) {
  trackEvent('topic_select', {
    game_id: gameId,
    topics: Array.isArray(topics) ? topics.join(', ') : topics,
  })
}

export function trackPlayMoreRounds(gameId, roundsSoFar) {
  trackEvent('play_more_rounds', {
    game_id: gameId,
    rounds_so_far: roundsSoFar,
  })
}

export function trackThemeToggle(theme) {
  trackEvent('theme_toggle', { theme })
}
