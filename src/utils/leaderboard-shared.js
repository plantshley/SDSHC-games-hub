/**
 * Backend-agnostic leaderboard logic shared by leaderboard-api.local.js and
 * leaderboard-api.firestore.js. Pure functions over plain arrays, so both
 * backends aggregate identically and the logic is testable without a DOM or
 * a database.
 */

/** Same rule both backends have always used for team-name dedupe. */
export function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Separator between a team's name and its school in labels ("Team 1 · Brookings"). */
export const LABEL_SEP = ' · '

/**
 * Display label for a team: "Name · School" when it has a school the caller
 * can see, else just the name. `schoolMap` is id → school.
 */
export function teamLabel(team, schoolMap) {
  if (!team) return ''
  const school = team.schoolId && schoolMap ? schoolMap.get(team.schoolId) : null
  return school ? `${team.name}${LABEL_SEP}${school.name}` : team.name
}

/**
 * Event roster joined to team and school records, for the roster screen, the
 * game-intro team picker, and the admin roster views. Labels and `schoolName`
 * only use APPROVED schools, so a pending or hidden school name never reaches
 * a kiosk. `schoolId` is the team's real link (any status) so a picker can
 * keep the team's identity intact.
 */
export function joinRoster(ev, teams, schools, getColors) {
  const teamMap = new Map(teams.map(t => [t.id, t]))
  const schoolMap = new Map(schools.filter(s => s.status === 'approved').map(s => [s.id, s]))
  return (ev.roster || []).map(r => {
    const t = teamMap.get(r.teamId)
    const colors = getColors(t)
    const school = t && t.schoolId ? schoolMap.get(t.schoolId) : null
    return {
      teamId: r.teamId,
      teamName: t ? t.name : '(deleted team)',
      label: t ? teamLabel(t, schoolMap) : '(deleted team)',
      schoolId: t ? t.schoolId || null : null,
      schoolName: school ? school.name : '',
      rosterStatus: r.status,
      teamStatus: t ? t.status : 'hidden',
      color1: colors.color1,
      color2: colors.color2,
      addedAt: r.addedAt,
    }
  })
}

/**
 * Exact (normalized) school-name match for the "link on save" path. Only
 * approved and pending schools qualify; a hidden school was moderated away and
 * must not quietly collect teams.
 */
export function findSchoolByExactName(schools, name) {
  const norm = normalizeName(name)
  if (!norm) return null
  return (schools || []).find(s => s.normalized === norm && s.status !== 'hidden') || null
}

/**
 * Team identity is name + school, so "Team 1" from two schools stays two teams.
 * Given the existing teams that share the normalized name, decide which school
 * the team belongs to and which existing team (if any) it is.
 *
 *   autoMatch false (a school picker was shown): `schoolId` is final, null
 *     included. Match only a team with exactly that school.
 *   autoMatch true (game-intro free text, no picker): an exact school-name
 *     match wins. Otherwise reuse the only team with that name (a returning
 *     team keeps its history), or the unschooled one when several share it.
 *
 * @returns {{ schoolId: string|null, existing: object|null }}
 */
export function resolveTeamIdentity({ name, teams = [], schools = [], schoolId = null, autoMatch = false }) {
  const norm = normalizeName(name)
  const sameName = teams.filter(t => t.normalized === norm)
  const sid = (t) => t.schoolId || null
  if (!autoMatch) {
    const want = schoolId || null
    return { schoolId: want, existing: sameName.find(t => sid(t) === want) || null }
  }
  const match = findSchoolByExactName(schools, name)
  if (match) {
    return { schoolId: match.id, existing: sameName.find(t => sid(t) === match.id) || null }
  }
  if (sameName.length === 1) return { schoolId: sid(sameName[0]), existing: sameName[0] }
  return { schoolId: null, existing: sameName.find(t => !t.schoolId) || null }
}

/**
 * Ids of every event in the same group (Day) as `eventId`. An event with no
 * group is a group of one, so the Day scope degrades to the Session scope
 * instead of showing nothing.
 */
export function groupEventIds(events, eventId) {
  const ev = (events || []).find(e => e.id === eventId)
  if (!ev) return []
  const g = normalizeName(ev.group)
  if (!g) return [ev.id]
  return events.filter(e => normalizeName(e.group) === g).map(e => e.id)
}

/**
 * Aggregated leaderboard rows.
 *
 * Scopes:
 *   event — scores tagged with `eventId`; team approved on that event's roster.
 *   group — scores tagged with any event in `eventId`'s group; team approved on
 *           the roster of the event each score belongs to.
 *   month — this calendar month; team approved statewide.
 *   all   — everything; team approved statewide.
 *
 * groupBy 'school' runs the same team visibility first, then rolls visible
 * scores up to the team's school. Only approved schools render, so a school's
 * total always equals the sum of its visible team rows in the same scope.
 *
 * Rows: { id, name, normPoints, points, gamesPlayed, color1, color2 } plus
 *   team rows:   teamId, teamName, schoolName (approved school or '')
 *   school rows: schoolId, teamCount, avgPerTeam
 */
export function aggregateLeaderboard({
  teams = [],
  schools = [],
  events = [],
  scores = [],
  scope,
  eventId,
  groupBy = 'team',
  getPar,
  getColors,
  now = Date.now(),
}) {
  const teamMap = new Map(teams.map(t => [t.id, t]))
  const schoolMap = new Map(schools.map(s => [s.id, s]))

  let inScope
  if (scope === 'event' || scope === 'group') {
    if (!eventId) return []
    const ids = scope === 'event'
      ? (events.some(e => e.id === eventId) ? [eventId] : [])
      : groupEventIds(events, eventId)
    if (ids.length === 0) return []
    // eventId → approved team ids on that event's roster.
    const approvedByEvent = new Map()
    for (const ev of events) {
      if (!ids.includes(ev.id)) continue
      approvedByEvent.set(
        ev.id,
        new Set((ev.roster || []).filter(r => r.status === 'approved').map(r => r.teamId))
      )
    }
    // Require the team to still exist: a stale roster entry pointing at a
    // deleted team must not surface as a "(deleted)" row.
    inScope = (s) => approvedByEvent.get(s.eventId)?.has(s.teamId) && teamMap.has(s.teamId)
  } else {
    const isApproved = (s) => teamMap.get(s.teamId)?.status === 'approved'
    if (scope === 'month') {
      const d = new Date(now)
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      inScope = (s) => isApproved(s) && s.ts >= monthStart
    } else {
      inScope = isApproved
    }
  }

  const approvedSchool = (id) => {
    const s = id ? schoolMap.get(id) : null
    return s && s.status === 'approved' ? s : null
  }

  const keyOf = groupBy === 'school'
    ? (s) => approvedSchool(teamMap.get(s.teamId)?.schoolId)?.id || null
    : (s) => s.teamId

  const agg = new Map()
  for (const s of scores) {
    if (!s.teamId || !inScope(s)) continue
    const key = keyOf(s)
    if (!key) continue
    let row = agg.get(key)
    if (!row) {
      row = { key, points: 0, normPoints: 0, runs: new Set(), teamIds: new Set() }
      agg.set(key, row)
    }
    row.points += s.points
    // Per-game normalization: a run worth ~par scores ~100. Negative runs
    // (e.g. Word game wrong-solve penalties) floor at 0 so they can't drag a
    // total below what was earned elsewhere.
    row.normPoints += Math.max(0, s.points) / getPar(s.gameId) * 100
    row.runs.add(s.runId)
    row.teamIds.add(s.teamId)
  }

  return [...agg.values()]
    .map(r => {
      const base = {
        id: r.key,
        normPoints: Math.round(r.normPoints),
        points: r.points,
        gamesPlayed: r.runs.size,
      }
      if (groupBy === 'school') {
        const school = schoolMap.get(r.key)
        const colors = getColors(school)
        const teamCount = r.teamIds.size
        return {
          ...base,
          schoolId: r.key,
          name: school.name,
          teamCount,
          avgPerTeam: Math.round(r.normPoints / teamCount),
          color1: colors.color1,
          color2: colors.color2,
        }
      }
      const team = teamMap.get(r.key)
      const colors = getColors(team)
      const name = team ? team.name : '(deleted)'
      return {
        ...base,
        teamId: r.key,
        teamName: name,
        name,
        schoolName: approvedSchool(team?.schoolId)?.name || '',
        color1: colors.color1,
        color2: colors.color2,
      }
    })
    .sort((a, b) => b.normPoints - a.normPoints || b.points - a.points)
}
