/**
 * Fuzzy school suggestion for the roster school picker. Pure: no DOM, no data
 * layer, so it can be unit-tested directly.
 *
 * Only used where a person sees the suggestion and can change it (the picker).
 * The no-picker "link on save" path uses exact matching instead
 * (`findSchoolByExactName` in leaderboard-shared.js).
 */

// Common short forms expand to the words they stand for, so "Brookings HS"
// and "Brookings High School" tokenize the same.
const ABBREVIATIONS = {
  hs: ['high', 'school'],
  ms: ['middle', 'school'],
  jhs: ['junior', 'high', 'school'],
  jr: ['junior'],
  sr: ['senior'],
  elem: ['elementary'],
  el: ['elementary'],
  sch: ['school'],
  acad: ['academy'],
}

// Words that describe a kind of school rather than which school. They help
// break ties ("Brookings MS" prefers the middle school) but never match alone.
const GENERIC = new Set([
  'high', 'middle', 'junior', 'senior', 'elementary', 'school', 'schools',
  'academy', 'public', 'district', 'the', 'of', 'and',
])

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    // Join dotted initials before punctuation becomes spaces, so "H.S." and
    // "J.H.S." reach the abbreviation table as "hs" and "jhs".
    .replace(/(?<=\b\p{L})\.(?=\p{L}\b)/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap(t => (Object.hasOwn(ABBREVIATIONS, t) ? ABBREVIATIONS[t] : [t]))
}

/**
 * Rank approved schools against a typed team name.
 *
 * A school is a candidate when either:
 *   - every distinctive word of the school appears in the team name
 *     ("Brookings Eagles" → Brookings High School), or
 *   - every distinctive word of the team name appears in the school
 *     ("Lincoln HS" → Sioux Falls Lincoln High School).
 * Score = shared distinctive words + shared generic words; ties go to the
 * school with fewer words the team name didn't mention.
 *
 * @param {string} teamName
 * @param {Array<{ id: string, name: string }>} schools
 * @returns {{ match: object|null, candidates: object[] }} `match` is the single
 *   best school, or null when nothing qualifies or the best still ties.
 *   `candidates` is every qualifying school, best first.
 */
export function suggestSchool(teamName, schools) {
  const teamTokens = tokenize(teamName)
  const teamSet = new Set(teamTokens)
  const teamDistinctive = teamTokens.filter(t => !GENERIC.has(t))
  if (teamDistinctive.length === 0) return { match: null, candidates: [] }

  const scored = []
  for (const school of schools || []) {
    const tokens = tokenize(school.name)
    const distinctive = tokens.filter(t => !GENERIC.has(t))
    if (distinctive.length === 0) continue
    const schoolSet = new Set(distinctive)
    const schoolInTeam = distinctive.every(t => teamSet.has(t))
    const teamInSchool = teamDistinctive.every(t => schoolSet.has(t))
    if (!schoolInTeam && !teamInSchool) continue
    const shared = new Set(tokens.filter(t => teamSet.has(t)))
    // Tie-break: fewer school words the team name didn't mention wins, so
    // "Roosevelt HS" prefers Roosevelt High School over Roosevelt Junior High.
    const unmatched = new Set(tokens.filter(t => !teamSet.has(t))).size
    scored.push({ school, score: shared.size, unmatched })
  }
  if (scored.length === 0) return { match: null, candidates: [] }

  const better = (a, b) => b.score - a.score || a.unmatched - b.unmatched
  scored.sort((a, b) => better(a, b) || a.school.name.localeCompare(b.school.name))
  const tied = scored.filter(x => better(x, scored[0]) === 0).length > 1
  return {
    match: tied ? null : scored[0].school,
    candidates: scored.map(x => x.school),
  }
}
