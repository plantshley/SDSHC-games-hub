/**
 * First-line profanity filter for team/school name entry.
 * The moderation queue is the real protection — this just keeps the most
 * obvious junk out of the pending list. Substring match on lowercased input.
 *
 * Keep the list short and conservative. Real moderation happens in admin.
 */

const BLOCKED = [
  // Common profanity (substrings — cover variants)
  'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'cock', 'dick',
  'pussy', 'asshole', 'bastard', 'slut', 'whore', 'tit', 'piss',
  // Common slurs / hate
  'retard', 'nazi', 'hitler', 'kkk', 'rape',
  // Crude memes / placeholders kids try at events
  '69', '420', 'penis', 'vagina', 'sex',
]

/**
 * @param {string} name
 * @returns {boolean} true if the name passes the filter, false if blocked
 */
export function isClean(name) {
  const lower = String(name || '').toLowerCase()
  if (!lower.trim()) return false
  return !BLOCKED.some(bad => lower.includes(bad))
}
