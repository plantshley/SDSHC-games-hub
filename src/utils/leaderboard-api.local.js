/**
 * Leaderboard data layer — Phase 1A (localStorage only).
 *
 * All functions return Promises so Phase 1B can swap the bodies for Firestore
 * calls without touching any caller. Function signatures are frozen.
 *
 * Keys:
 *   sdshc-lb-teams        { schemaVersion, teams: [{ id, name, normalized, status, color1, color2, createdAt }] }
 *   sdshc-lb-events       { events: [{ id, name, startedAt, endedAt|null, status }] }
 *   sdshc-lb-scores       { scores: [ScoreEntry] }
 *   sdshc-lb-active-event eventId|null (per-kiosk)
 *   sdshc-lb-kiosk-id     stable UUID for this device
 *
 *   ScoreEntry = { id, runId, ts, gameId, playerName, teamId|null, points,
 *                  eventId|null, kioskId }
 *
 * Team status (`team.status`): "pending" | "approved" | "hidden". Controls
 * visibility on the statewide (this-month / all-time) leaderboards.
 *
 * Event roster (`event.roster`): [{ teamId, status: "pending"|"approved" }].
 * Independent of statewide approval. The event leaderboard shows teams only
 * if they're on the event roster with status "approved". This separation
 * lets an organizer approve a team for a specific event without committing
 * to statewide visibility, and vice versa.
 */

import { getGamePar } from '../data/advanced-game-registry.js'
import { deriveTeamColors, getTeamColors } from './team-colors.js'

const K_TEAMS = 'sdshc-lb-teams'
const K_EVENTS = 'sdshc-lb-events'
const K_SCORES = 'sdshc-lb-scores'
const K_ACTIVE = 'sdshc-lb-active-event'
const K_KIOSK = 'sdshc-lb-kiosk-id'

const SCHEMA_VERSION = 1

/* ─── ID generation ─── */

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/* ─── Raw storage helpers ─── */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('leaderboard-api: failed to write', key, err)
  }
}

function getTeamsRaw() {
  return readJSON(K_TEAMS, { schemaVersion: SCHEMA_VERSION, teams: [] })
}

function getEventsRaw() {
  return readJSON(K_EVENTS, { events: [] })
}

function getScoresRaw() {
  return readJSON(K_SCORES, { scores: [] })
}

/* ─── Cache warm-up (no-op for localStorage; real in the Firestore backend) ─── */

/**
 * Parity stub so the backend selector exposes the same surface in both modes.
 * localStorage has nothing to pre-fetch, so this resolves immediately.
 */
export async function warmLeaderboardCache() {}

/* ─── Kiosk identity ─── */

export function getKioskId() {
  let id = localStorage.getItem(K_KIOSK)
  if (!id) {
    id = genId()
    localStorage.setItem(K_KIOSK, id)
  }
  return id
}

/* ─── Teams ─── */

/**
 * Look up a team by name. Returns its current record if found (in any status),
 * else creates one with status "pending" and returns it.
 *
 * Optional `colors` sets the team's accent pair on creation (manual pick from
 * the roster screen). When omitted — e.g. a player just typing a new name on a
 * game intro — a deterministic pair is auto-derived from the new team's id.
 * An existing team is returned unchanged; its colors are never overwritten here.
 *
 * @param {string} name
 * @param {{ color1: string, color2: string }} [colors]
 * @returns {Promise<{ teamId: string, status: 'pending'|'approved'|'hidden', name: string }>}
 */
export async function getOrCreateTeam(name, colors) {
  const cleaned = String(name || '').trim()
  if (!cleaned) throw new Error('Team name required')

  const norm = normalizeName(cleaned)
  const data = getTeamsRaw()
  const existing = data.teams.find(t => t.normalized === norm)
  if (existing) {
    return { teamId: existing.id, status: existing.status, name: existing.name }
  }

  const id = genId()
  const picked = colors && colors.color1 && colors.color2 ? colors : deriveTeamColors(id)
  const newTeam = {
    id,
    name: cleaned,
    normalized: norm,
    status: 'pending',
    color1: picked.color1,
    color2: picked.color2,
    createdAt: Date.now(),
    createdByKiosk: getKioskId(),
  }
  data.teams.push(newTeam)
  data.schemaVersion = SCHEMA_VERSION
  writeJSON(K_TEAMS, data)
  return { teamId: newTeam.id, status: newTeam.status, name: newTeam.name }
}

export async function listApprovedTeams() {
  return getTeamsRaw().teams.filter(t => t.status === 'approved')
}

export async function listPendingTeams() {
  return getTeamsRaw().teams.filter(t => t.status === 'pending')
}

export async function listAllTeams() {
  return [...getTeamsRaw().teams]
}

export async function getTeamById(id) {
  return getTeamsRaw().teams.find(t => t.id === id) || null
}

export async function approveTeam(id) {
  return updateTeam(id, { status: 'approved' })
}

export async function hideTeam(id) {
  return updateTeam(id, { status: 'hidden' })
}

export async function renameTeam(id, newName) {
  const cleaned = String(newName || '').trim()
  if (!cleaned) throw new Error('Name required')
  const norm = normalizeName(cleaned)
  const data = getTeamsRaw()
  // If another team already uses this normalized name, merge into it.
  const collision = data.teams.find(t => t.normalized === norm && t.id !== id)
  if (collision) {
    return mergeTeams(id, collision.id)
  }
  return updateTeam(id, { name: cleaned, normalized: norm })
}

export async function setTeamColors(id, color1, color2) {
  return updateTeam(id, { color1, color2 })
}

function updateTeam(id, patch) {
  const data = getTeamsRaw()
  const idx = data.teams.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Team not found')
  data.teams[idx] = { ...data.teams[idx], ...patch }
  writeJSON(K_TEAMS, data)
  return data.teams[idx]
}

/**
 * Delete a team and ALL its score entries AND its entries in every event's
 * roster. Without the roster cleanup, an orphan roster entry can reference a
 * deleted teamId — and worse, when a player re-types the same name on a game
 * intro, `getOrCreateTeam` creates a fresh team with the same name (different
 * id) and adds it to the roster, making the "deleted" team appear to come
 * back. Wiping rosters here ensures delete really means delete.
 */
export async function deleteTeam(id) {
  const teamsData = getTeamsRaw()
  teamsData.teams = teamsData.teams.filter(t => t.id !== id)
  writeJSON(K_TEAMS, teamsData)

  const scoresData = getScoresRaw()
  scoresData.scores = scoresData.scores.filter(s => s.teamId !== id)
  writeJSON(K_SCORES, scoresData)

  const eventsData = getEventsRaw()
  let changed = false
  for (const ev of eventsData.events) {
    if (ev.roster && ev.roster.some(r => r.teamId === id)) {
      ev.roster = ev.roster.filter(r => r.teamId !== id)
      changed = true
    }
  }
  if (changed) writeJSON(K_EVENTS, eventsData)
}

/**
 * Rename `fromId` into `toId`: all scores re-tagged, source team removed.
 * Adopts the destination team's name and status.
 */
export async function mergeTeams(fromId, toId) {
  if (fromId === toId) return
  const teamsData = getTeamsRaw()
  const fromIdx = teamsData.teams.findIndex(t => t.id === fromId)
  const toIdx = teamsData.teams.findIndex(t => t.id === toId)
  if (fromIdx === -1 || toIdx === -1) throw new Error('Team not found')

  const scoresData = getScoresRaw()
  scoresData.scores.forEach(s => {
    if (s.teamId === fromId) s.teamId = toId
  })
  writeJSON(K_SCORES, scoresData)

  teamsData.teams.splice(fromIdx, 1)
  writeJSON(K_TEAMS, teamsData)
}

/* ─── Events ─── */

export async function listEvents() {
  return [...getEventsRaw().events].sort((a, b) => b.startedAt - a.startedAt)
}

export async function listOpenEvents() {
  return (await listEvents()).filter(e => e.status === 'open')
}

export async function getEventById(id) {
  if (!id) return null
  return getEventsRaw().events.find(e => e.id === id) || null
}

/**
 * Create a new event.
 *
 * @param {string} name
 * @param {Object} [options]
 * @param {number|null} [options.scheduledStart] - if set, the event is
 *   created with status "scheduled" and starts at that timestamp; otherwise
 *   it opens immediately at now.
 */
export async function startEvent(name, options = {}) {
  const cleaned = String(name || '').trim() || 'Untitled Event'
  const { scheduledStart = null } = options
  const data = getEventsRaw()
  const now = Date.now()
  const event = {
    id: genId(),
    name: cleaned,
    startedAt: scheduledStart || now,
    scheduledStart: scheduledStart || null,
    endedAt: null,
    status: scheduledStart && scheduledStart > now ? 'scheduled' : 'open',
    roster: [],
  }
  data.events.push(event)
  writeJSON(K_EVENTS, data)
  return event
}

/**
 * Mark a "scheduled" event as "open" if its scheduledStart has passed.
 * Called by admin when promoting manually or auto-checked on listOpenEvents.
 */
export async function openScheduledEvent(eventId) {
  const data = getEventsRaw()
  const idx = data.events.findIndex(e => e.id === eventId)
  if (idx === -1) throw new Error('Event not found')
  data.events[idx] = { ...data.events[idx], status: 'open' }
  writeJSON(K_EVENTS, data)
  return data.events[idx]
}

export async function endEvent(id) {
  const data = getEventsRaw()
  const idx = data.events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Event not found')
  data.events[idx] = { ...data.events[idx], status: 'ended', endedAt: Date.now() }
  writeJSON(K_EVENTS, data)

  // If the ended event was active on this kiosk, clear that.
  if (getActiveEventId() === id) setActiveEventId(null)
  return data.events[idx]
}

/**
 * Re-open a previously ended event. Scores and roster are preserved (they
 * were never deleted on end), so setting the kiosk to this event will show
 * its prior leaderboard immediately. New scores write to the same eventId.
 */
export async function reopenEvent(id) {
  const data = getEventsRaw()
  const idx = data.events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Event not found')
  data.events[idx] = { ...data.events[idx], status: 'open', endedAt: null }
  writeJSON(K_EVENTS, data)
  return data.events[idx]
}

/**
 * Delete an event AND all its tagged scores.
 */
export async function deleteEvent(id) {
  const data = getEventsRaw()
  data.events = data.events.filter(e => e.id !== id)
  writeJSON(K_EVENTS, data)

  const scoresData = getScoresRaw()
  scoresData.scores = scoresData.scores.filter(s => s.eventId !== id)
  writeJSON(K_SCORES, scoresData)

  if (getActiveEventId() === id) setActiveEventId(null)
}

/* ─── Event Rosters ─── */

/**
 * Add a team to the active event's roster with status "pending". If the team
 * is already on the roster, this is a no-op (does not downgrade an approved
 * roster entry back to pending).
 */
export async function addTeamToEventRoster(eventId, teamId) {
  const data = getEventsRaw()
  const idx = data.events.findIndex(e => e.id === eventId)
  if (idx === -1) throw new Error('Event not found')
  const ev = data.events[idx]
  ev.roster = ev.roster || []
  if (ev.roster.find(r => r.teamId === teamId)) return ev
  ev.roster.push({ teamId, status: 'pending', addedAt: Date.now() })
  writeJSON(K_EVENTS, data)
  return ev
}

export async function removeTeamFromEventRoster(eventId, teamId) {
  const data = getEventsRaw()
  const idx = data.events.findIndex(e => e.id === eventId)
  if (idx === -1) throw new Error('Event not found')
  const ev = data.events[idx]
  ev.roster = (ev.roster || []).filter(r => r.teamId !== teamId)
  writeJSON(K_EVENTS, data)
  return ev
}

export async function approveTeamForEvent(eventId, teamId) {
  return updateRosterEntry(eventId, teamId, { status: 'approved' })
}

export async function unapproveTeamForEvent(eventId, teamId) {
  return updateRosterEntry(eventId, teamId, { status: 'pending' })
}

function updateRosterEntry(eventId, teamId, patch) {
  const data = getEventsRaw()
  const eIdx = data.events.findIndex(e => e.id === eventId)
  if (eIdx === -1) throw new Error('Event not found')
  const ev = data.events[eIdx]
  ev.roster = ev.roster || []
  const rIdx = ev.roster.findIndex(r => r.teamId === teamId)
  if (rIdx === -1) {
    ev.roster.push({ teamId, status: patch.status || 'pending', addedAt: Date.now() })
  } else {
    ev.roster[rIdx] = { ...ev.roster[rIdx], ...patch }
  }
  writeJSON(K_EVENTS, data)
  return ev
}

/**
 * Returns the event's roster joined to team records.
 * @returns {Promise<Array<{ teamId, teamName, rosterStatus, teamStatus }>>}
 */
export async function getEventRoster(eventId) {
  const ev = await getEventById(eventId)
  if (!ev) return []
  const teams = getTeamsRaw().teams
  const teamMap = new Map(teams.map(t => [t.id, t]))
  return (ev.roster || []).map(r => {
    const t = teamMap.get(r.teamId)
    const colors = getTeamColors(t)
    return {
      teamId: r.teamId,
      teamName: t ? t.name : '(deleted team)',
      rosterStatus: r.status,
      teamStatus: t ? t.status : 'hidden',
      color1: colors.color1,
      color2: colors.color2,
      addedAt: r.addedAt,
    }
  })
}

/* ─── Per-kiosk active event ─── */

/**
 * Per-kiosk active event setting. Sync getter so screens can read at render.
 */
export function getActiveEventId() {
  const v = localStorage.getItem(K_ACTIVE)
  return v || null
}

export function setActiveEventId(eventId) {
  if (eventId) localStorage.setItem(K_ACTIVE, eventId)
  else localStorage.removeItem(K_ACTIVE)
}

/* ─── Scores ─── */

/**
 * Record per-player scores from a completed game run. Idempotent: passing the
 * same runId twice writes only once.
 *
 * @param {Object} args
 * @param {string} args.gameId
 * @param {string} args.runId - stable id for this single game session
 * @param {{ playerName: string, teamId: string|null, points: number }[]} args.entries
 * @param {string|null} [args.eventId]
 */
export async function recordScores({ gameId, runId, entries, eventId }) {
  if (!gameId) throw new Error('gameId required')
  if (!runId) throw new Error('runId required')
  if (!Array.isArray(entries)) throw new Error('entries must be an array')

  const data = getScoresRaw()
  // Idempotency: skip entire batch if any entry already used this runId
  if (data.scores.some(s => s.runId === runId)) return

  const ts = Date.now()
  const kioskId = getKioskId()
  for (const e of entries) {
    if (!e || typeof e.points !== 'number') continue
    data.scores.push({
      id: genId(),
      runId,
      ts,
      gameId,
      playerName: String(e.playerName || ''),
      teamId: e.teamId || null,
      points: Math.round(e.points),
      eventId: eventId || null,
      kioskId,
    })
  }
  writeJSON(K_SCORES, data)
}

export async function listRecentScores(limit = 50) {
  const data = getScoresRaw()
  return data.scores.slice().sort((a, b) => b.ts - a.ts).slice(0, limit)
}

export async function deleteScore(id) {
  const data = getScoresRaw()
  data.scores = data.scores.filter(s => s.id !== id)
  writeJSON(K_SCORES, data)
}

/* ─── Leaderboards ─── */

/**
 * Aggregated leaderboard rows for a given scope.
 *
 * @param {Object} args
 * @param {'event'|'month'|'all'} args.scope
 * @param {string} [args.eventId] - required when scope === 'event'
 * @returns {Promise<Array<{ teamId, teamName, normPoints, points, gamesPlayed, color1, color2 }>>}
 *   `normPoints` is the per-game-normalized total (the headline ranking metric);
 *   `points` is the raw sum (shown alongside). `color1`/`color2` are the team's
 *   accent pair (stored or auto-derived). Rows are sorted by normPoints.
 */
export async function getLeaderboard({ scope, eventId } = {}) {
  const teamsData = getTeamsRaw()
  const scoresData = getScoresRaw()
  const teamMap = new Map(teamsData.teams.map(t => [t.id, t]))

  // Build the visibility predicate based on scope:
  // - scope=event: team must be on this event's roster with status=approved
  // - scope=month / scope=all: team.status (statewide) must be approved
  let visibilityCheck
  if (scope === 'event') {
    if (!eventId) return []
    const ev = getEventsRaw().events.find(e => e.id === eventId)
    if (!ev) return []
    const approvedRosterIds = new Set(
      (ev.roster || []).filter(r => r.status === 'approved').map(r => r.teamId)
    )
    visibilityCheck = (teamId) => approvedRosterIds.has(teamId)
  } else {
    visibilityCheck = (teamId) => teamMap.get(teamId)?.status === 'approved'
  }

  let filtered = scoresData.scores.filter(s => s.teamId && visibilityCheck(s.teamId))

  if (scope === 'event') {
    filtered = filtered.filter(s => s.eventId === eventId)
  } else if (scope === 'month') {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    filtered = filtered.filter(s => s.ts >= monthStart)
  }
  // scope === 'all' — no time filter

  const agg = new Map()
  for (const s of filtered) {
    const t = teamMap.get(s.teamId)
    const row = agg.get(s.teamId) || {
      teamId: s.teamId,
      teamName: t ? t.name : '(deleted)',
      points: 0,
      normPoints: 0,
      gamesPlayed: 0,
      runs: new Set(),
    }
    row.points += s.points
    // Per-game normalization: a run worth ~par scores ~100. Negative runs
    // (e.g. Word game wrong-solve penalties) floor at 0 so they can't drag a
    // team's normalized total below what they earned elsewhere.
    row.normPoints += Math.max(0, s.points) / getGamePar(s.gameId) * 100
    row.runs.add(s.runId)
    agg.set(s.teamId, row)
  }

  return [...agg.values()]
    .map(r => {
      const colors = getTeamColors(teamMap.get(r.teamId))
      return {
        teamId: r.teamId,
        teamName: r.teamName,
        normPoints: Math.round(r.normPoints),
        points: r.points,
        gamesPlayed: r.runs.size,
        color1: colors.color1,
        color2: colors.color2,
      }
    })
    .sort((a, b) => b.normPoints - a.normPoints || b.points - a.points)
}
