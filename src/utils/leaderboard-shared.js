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
 * Display name for an event: "Event · Session" for a session, else the name.
 */
export function eventLabel(ev) {
  if (!ev) return ''
  const session = String(ev.session || '').trim()
  return session ? `${ev.name}${LABEL_SEP}${session}` : ev.name
}

/**
 * Teams a picker may suggest by name: approved statewide, or approved on any
 * event's roster (an admin has seen the name either way). Hidden teams never.
 */
export function selectableTeams(teams, events) {
  const eventApproved = new Set()
  for (const ev of events || []) {
    for (const r of ev.roster || []) if (r.status === 'approved') eventApproved.add(r.teamId)
  }
  return (teams || []).filter(t =>
    t.status !== 'hidden' && (t.status === 'approved' || eventApproved.has(t.id))
  )
}

/**
 * Event roster joined to team and school records, for the roster screen, the
 * game-intro team picker, and the admin roster views. Labels and `schoolName`
 * only use APPROVED schools, so a pending or hidden school name never reaches
 * the game-intro dropdown. `pendingSchoolName` carries a pending school's name
 * for the roster lists, which show it with a pending pill. `schoolId` is the
 * team's real link (any status) so a picker can keep the team's identity intact.
 */
export function joinRoster(ev, teams, schools, getColors) {
  const teamMap = new Map(teams.map(t => [t.id, t]))
  const allSchools = new Map(schools.map(s => [s.id, s]))
  const schoolMap = new Map(schools.filter(s => s.status === 'approved').map(s => [s.id, s]))
  return (ev.roster || []).map(r => {
    const t = teamMap.get(r.teamId)
    const colors = getColors(t)
    const school = t && t.schoolId ? schoolMap.get(t.schoolId) : null
    const linked = t && t.schoolId ? allSchools.get(t.schoolId) : null
    return {
      teamId: r.teamId,
      teamName: t ? t.name : '(deleted team)',
      label: t ? teamLabel(t, schoolMap) : '(deleted team)',
      schoolId: t ? t.schoolId || null : null,
      schoolName: school ? school.name : '',
      pendingSchoolName: linked && linked.status === 'pending' ? linked.name : '',
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
 * Which Day a session belongs to. Sessions made in one "Create sessions" share
 * a `dayId`, so their start dates, "Open now", and Starts edits never split
 * them. Older sessions without one fall back to the normalized event name plus
 * the local calendar date they start (scheduled date first). Null for an event
 * with no session.
 */
export function eventDayKey(ev) {
  if (!ev || !String(ev.session || '').trim()) return null
  if (ev.dayId) return `id|${ev.dayId}`
  const start = typeof ev.scheduledStart === 'number' ? ev.scheduledStart : ev.startedAt
  if (typeof start !== 'number') return null
  const d = new Date(start)
  return `${normalizeName(ev.name)}|${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/**
 * Ids of every session in the same Day as `eventId`. An event with no session
 * is a Day of one, so the Day scope degrades to the Session scope instead of
 * showing nothing.
 */
export function dayEventIds(events, eventId) {
  const ev = (events || []).find(e => e.id === eventId)
  if (!ev) return []
  const key = eventDayKey(ev)
  if (!key) return [ev.id]
  return events.filter(e => eventDayKey(e) === key).map(e => e.id)
}

/**
 * Ids of teams approved on `eventId`'s roster or any other session of its Day.
 * The roster and game-intro pickers suggest these, so a team approved for the
 * morning can be picked again in the afternoon. Approval itself stays per
 * session: picking it adds the team to the new session as pending.
 */
export function dayApprovedTeamIds(events, eventId) {
  const ids = new Set(dayEventIds(events, eventId))
  const out = new Set()
  for (const e of events || []) {
    if (!ids.has(e.id)) continue
    for (const r of e.roster || []) if (r.status === 'approved') out.add(r.teamId)
  }
  return out
}

/**
 * Aggregated leaderboard rows.
 *
 * Scopes:
 *   event — scores tagged with `eventId`; team approved on that event's roster.
 *   day   — scores tagged with any session in `eventId`'s Day; team approved
 *           on the roster of the session each score belongs to.
 *   month — this calendar month; team approved statewide.
 *   all   — everything; team approved statewide.
 *
 * groupBy 'school' runs the same team visibility first, then rolls visible
 * scores up to the team's school. Only approved schools render. On the
 * statewide scopes (month, all) a school also collects school-play scores:
 * no team, a `schoolId`, recorded with no event running. So a school's total
 * equals the sum of its visible team rows plus its school-play points, and
 * Avg / team divides only the team points.
 *
 * Rows: { id, name, rank, normPoints, points, gamesPlayed, color1, color2 } plus
 *   team rows:   teamId, teamName, schoolName (approved school or '')
 *   school rows: schoolId, teamCount, avgPerTeam (null with no teams)
 * `rank` is shared by rows with the same displayed score (1, 1, 3).
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
  // School-play scores count only on the statewide school board.
  let schoolPlayInScope = () => false
  if (scope === 'event' || scope === 'day') {
    if (!eventId) return []
    const ids = scope === 'event'
      ? (events.some(e => e.id === eventId) ? [eventId] : [])
      : dayEventIds(events, eventId)
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
      if (groupBy === 'school') schoolPlayInScope = (s) => s.ts >= monthStart
    } else {
      inScope = isApproved
      if (groupBy === 'school') schoolPlayInScope = () => true
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
    let key
    if (s.teamId) {
      if (!inScope(s)) continue
      key = keyOf(s)
    } else {
      if (!s.schoolId || !schoolPlayInScope(s)) continue
      key = approvedSchool(s.schoolId)?.id || null
    }
    if (!key) continue
    let row = agg.get(key)
    if (!row) {
      row = { key, points: 0, normPoints: 0, teamNorm: 0, runs: new Set(), teamIds: new Set() }
      agg.set(key, row)
    }
    row.points += s.points
    // Per-game normalization: a run worth ~par scores ~100. Negative runs
    // (e.g. Word game wrong-solve penalties) floor at 0 so they can't drag a
    // total below what was earned elsewhere.
    const norm = Math.max(0, s.points) / getPar(s.gameId) * 100
    row.normPoints += norm
    row.runs.add(s.runId)
    if (s.teamId) {
      row.teamNorm += norm
      row.teamIds.add(s.teamId)
    }
  }

  const rows = [...agg.values()]
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
          avgPerTeam: teamCount ? Math.round(r.teamNorm / teamCount) : null,
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

  // Competition ranking on the displayed score: ties share a rank (1, 1, 3).
  // Raw points still order tied rows, but don't break the tie.
  let rank = 0
  return rows.map((r, i) => {
    if (i === 0 || rows[i - 1].normPoints !== r.normPoints) rank = i + 1
    return { ...r, rank }
  })
}
