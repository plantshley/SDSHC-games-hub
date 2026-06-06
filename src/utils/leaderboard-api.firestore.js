/**
 * Leaderboard data layer — Phase 1B (Firebase Firestore + offline persistence).
 *
 * Drop-in replacement for leaderboard-api.local.js: every exported function has
 * the SAME name and signature, so game/screen code is untouched. The selector
 * in leaderboard-api.js chooses between this and the local impl via the
 * USE_FIRESTORE flag in src/firebase/config.js.
 *
 * Design notes:
 *  - Timestamps are plain `Date.now()` millis (not Firestore serverTimestamp).
 *    serverTimestamp resolves to null on offline writes until they sync, which
 *    would break offline sorting/month-filtering. Plain millis are written
 *    immediately and aggregate identically to the localStorage version.
 *  - Per-kiosk state (kiosk id, active event id) stays in localStorage — it's
 *    genuinely device-local even in Firebase mode, and several call sites read
 *    it synchronously at render time.
 *  - Event rosters live as an array field on each event doc (mirrors the local
 *    schema), so roster mutations are read-modify-write on the event doc.
 *  - Offline persistence is configured in src/firebase/init.js. Reads serve
 *    from cache when offline; writes queue and auto-sync on reconnect.
 *
 * Firestore collections:
 *   /teams/{teamId}    { name, normalized, status, color1, color2, createdAt, createdByKiosk }
 *   /events/{eventId}  { name, startedAt, scheduledStart, endedAt, status, roster: [...] }
 *   /scores/{scoreId}  { runId, ts, gameId, playerName, teamId, points, eventId, kioskId }
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from '../firebase/init.js'
import { getGamePar } from '../data/advanced-game-registry.js'
import { deriveTeamColors, getTeamColors } from './team-colors.js'

const K_ACTIVE = 'sdshc-lb-active-event'
const K_KIOSK = 'sdshc-lb-kiosk-id'

const C_TEAMS = 'teams'
const C_EVENTS = 'events'
const C_SCORES = 'scores'

const BATCH_LIMIT = 450 // Firestore hard cap is 500 ops/batch; stay under it.

/* ─── ID generation ─── */

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/* ─── Firestore read helpers ─── */

async function readAll(collName) {
  const snap = await getDocs(collection(getDb(), collName))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function readDoc(collName, id) {
  if (!id) return null
  const snap = await getDoc(doc(getDb(), collName, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Delete a list of doc refs in chunks under the per-batch cap.
 */
async function deleteRefsInChunks(refs) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(getDb())
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) batch.delete(ref)
    await batch.commit()
  }
}

/* ─── Cache warm-up ─── */

/**
 * Pre-load teams/events/scores into the offline cache. Firestore only caches
 * what's been queried, so call this once while online before going offline
 * (e.g. on Advanced Mode entry / first leaderboard open). No-op-safe to call
 * repeatedly. See docs/pwa_kiosk_guide.md §4.
 */
export async function warmLeaderboardCache() {
  await Promise.all([readAll(C_TEAMS), readAll(C_EVENTS), readAll(C_SCORES)])
}

/* ─── Kiosk identity (device-local) ─── */

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
 * Look up a team by normalized name; return it if found (any status), else
 * create one with status "pending". `colors` sets the accent pair on creation;
 * omitted → deterministic pair derived from the new id. Existing teams are
 * returned unchanged (colors never overwritten here).
 *
 * Offline caveat: the name lookup only sees teams already in the local cache,
 * so two devices inventing the same name offline can create duplicates — clean
 * up with admin merge/rename. Single-kiosk-per-event is unaffected.
 */
export async function getOrCreateTeam(name, colors) {
  const cleaned = String(name || '').trim()
  if (!cleaned) throw new Error('Team name required')

  const norm = normalizeName(cleaned)
  const snap = await getDocs(
    query(collection(getDb(), C_TEAMS), where('normalized', '==', norm), fbLimit(1))
  )
  if (!snap.empty) {
    const d = snap.docs[0]
    const t = d.data()
    return { teamId: d.id, status: t.status, name: t.name }
  }

  const id = genId()
  const picked = colors && colors.color1 && colors.color2 ? colors : deriveTeamColors(id)
  const newTeam = {
    name: cleaned,
    normalized: norm,
    status: 'pending',
    color1: picked.color1,
    color2: picked.color2,
    createdAt: Date.now(),
    createdByKiosk: getKioskId(),
  }
  await setDoc(doc(getDb(), C_TEAMS, id), newTeam)
  return { teamId: id, status: newTeam.status, name: newTeam.name }
}

export async function listApprovedTeams() {
  return (await readAll(C_TEAMS)).filter(t => t.status === 'approved')
}

export async function listPendingTeams() {
  return (await readAll(C_TEAMS)).filter(t => t.status === 'pending')
}

export async function listAllTeams() {
  return readAll(C_TEAMS)
}

export async function getTeamById(id) {
  return readDoc(C_TEAMS, id)
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
  // If another team already uses this normalized name, merge into it.
  const snap = await getDocs(
    query(collection(getDb(), C_TEAMS), where('normalized', '==', norm))
  )
  const collision = snap.docs.find(d => d.id !== id)
  if (collision) {
    await mergeTeams(id, collision.id)
    return { id: collision.id, ...collision.data() }
  }
  return updateTeam(id, { name: cleaned, normalized: norm })
}

export async function setTeamColors(id, color1, color2) {
  return updateTeam(id, { color1, color2 })
}

async function updateTeam(id, patch) {
  const ref = doc(getDb(), C_TEAMS, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Team not found')
  await updateDoc(ref, patch)
  return { id, ...snap.data(), ...patch }
}

/**
 * Delete a team and ALL its score entries AND its entries in every event's
 * roster (mirrors local impl — prevents orphan roster refs and "zombie"
 * teams reappearing when a name is re-typed).
 */
export async function deleteTeam(id) {
  await deleteDoc(doc(getDb(), C_TEAMS, id))

  const scoreSnap = await getDocs(
    query(collection(getDb(), C_SCORES), where('teamId', '==', id))
  )
  await deleteRefsInChunks(scoreSnap.docs.map(d => d.ref))

  const events = await readAll(C_EVENTS)
  for (const ev of events) {
    if (ev.roster && ev.roster.some(r => r.teamId === id)) {
      await updateDoc(doc(getDb(), C_EVENTS, ev.id), {
        roster: ev.roster.filter(r => r.teamId !== id),
      })
    }
  }
}

/**
 * Rename `fromId` into `toId`: all scores re-tagged, source team removed.
 */
export async function mergeTeams(fromId, toId) {
  if (fromId === toId) return
  const fromRef = doc(getDb(), C_TEAMS, fromId)
  const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(doc(getDb(), C_TEAMS, toId))])
  if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Team not found')

  const scoreSnap = await getDocs(
    query(collection(getDb(), C_SCORES), where('teamId', '==', fromId))
  )
  for (let i = 0; i < scoreSnap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(getDb())
    for (const d of scoreSnap.docs.slice(i, i + BATCH_LIMIT)) {
      batch.update(d.ref, { teamId: toId })
    }
    await batch.commit()
  }
  await deleteDoc(fromRef)
}

/* ─── Events ─── */

export async function listEvents() {
  return (await readAll(C_EVENTS)).sort((a, b) => b.startedAt - a.startedAt)
}

export async function listOpenEvents() {
  return (await listEvents()).filter(e => e.status === 'open')
}

export async function getEventById(id) {
  return readDoc(C_EVENTS, id)
}

/**
 * Create a new event. With `options.scheduledStart` in the future, the event
 * is created "scheduled"; otherwise it opens immediately.
 */
export async function startEvent(name, options = {}) {
  const cleaned = String(name || '').trim() || 'Untitled Event'
  const { scheduledStart = null } = options
  const now = Date.now()
  const id = genId()
  const event = {
    name: cleaned,
    startedAt: scheduledStart || now,
    scheduledStart: scheduledStart || null,
    endedAt: null,
    status: scheduledStart && scheduledStart > now ? 'scheduled' : 'open',
    roster: [],
  }
  await setDoc(doc(getDb(), C_EVENTS, id), event)
  return { id, ...event }
}

export async function openScheduledEvent(eventId) {
  return updateEvent(eventId, { status: 'open' })
}

export async function endEvent(id) {
  const updated = await updateEvent(id, { status: 'ended', endedAt: Date.now() })
  if (getActiveEventId() === id) setActiveEventId(null)
  return updated
}

export async function reopenEvent(id) {
  return updateEvent(id, { status: 'open', endedAt: null })
}

/**
 * Delete an event AND all its tagged scores.
 */
export async function deleteEvent(id) {
  await deleteDoc(doc(getDb(), C_EVENTS, id))

  const scoreSnap = await getDocs(
    query(collection(getDb(), C_SCORES), where('eventId', '==', id))
  )
  await deleteRefsInChunks(scoreSnap.docs.map(d => d.ref))

  if (getActiveEventId() === id) setActiveEventId(null)
}

async function updateEvent(id, patch) {
  const ref = doc(getDb(), C_EVENTS, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Event not found')
  await updateDoc(ref, patch)
  return { id, ...snap.data(), ...patch }
}

/* ─── Event Rosters (array field on the event doc) ─── */

export async function addTeamToEventRoster(eventId, teamId) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) throw new Error('Event not found')
  const roster = ev.roster || []
  if (roster.find(r => r.teamId === teamId)) return ev
  roster.push({ teamId, status: 'pending', addedAt: Date.now() })
  await updateDoc(doc(getDb(), C_EVENTS, eventId), { roster })
  return { ...ev, roster }
}

export async function removeTeamFromEventRoster(eventId, teamId) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) throw new Error('Event not found')
  const roster = (ev.roster || []).filter(r => r.teamId !== teamId)
  await updateDoc(doc(getDb(), C_EVENTS, eventId), { roster })
  return { ...ev, roster }
}

export async function approveTeamForEvent(eventId, teamId) {
  return updateRosterEntry(eventId, teamId, { status: 'approved' })
}

export async function unapproveTeamForEvent(eventId, teamId) {
  return updateRosterEntry(eventId, teamId, { status: 'pending' })
}

async function updateRosterEntry(eventId, teamId, patch) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) throw new Error('Event not found')
  const roster = ev.roster || []
  const rIdx = roster.findIndex(r => r.teamId === teamId)
  if (rIdx === -1) {
    roster.push({ teamId, status: patch.status || 'pending', addedAt: Date.now() })
  } else {
    roster[rIdx] = { ...roster[rIdx], ...patch }
  }
  await updateDoc(doc(getDb(), C_EVENTS, eventId), { roster })
  return { ...ev, roster }
}

/**
 * Returns the event's roster joined to team records.
 */
export async function getEventRoster(eventId) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) return []
  const teams = await readAll(C_TEAMS)
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

/* ─── Per-kiosk active event (device-local) ─── */

export function getActiveEventId() {
  return localStorage.getItem(K_ACTIVE) || null
}

export function setActiveEventId(eventId) {
  if (eventId) localStorage.setItem(K_ACTIVE, eventId)
  else localStorage.removeItem(K_ACTIVE)
}

/* ─── Scores ─── */

/**
 * Record per-player scores from a completed run. Idempotent via deterministic
 * doc ids (`{runId}__{i}`): re-calling with the same runId overwrites the same
 * docs instead of duplicating. A guard read short-circuits the common repeat.
 */
export async function recordScores({ gameId, runId, entries, eventId }) {
  if (!gameId) throw new Error('gameId required')
  if (!runId) throw new Error('runId required')
  if (!Array.isArray(entries)) throw new Error('entries must be an array')

  // Idempotency guard: if the first entry of this run already exists, skip.
  const firstExisting = await getDoc(doc(getDb(), C_SCORES, `${runId}__0`))
  if (firstExisting.exists()) return

  const ts = Date.now()
  const kioskId = getKioskId()
  const batch = writeBatch(getDb())
  let i = 0
  for (const e of entries) {
    if (!e || typeof e.points !== 'number') continue
    batch.set(doc(getDb(), C_SCORES, `${runId}__${i}`), {
      runId,
      ts,
      gameId,
      playerName: String(e.playerName || ''),
      teamId: e.teamId || null,
      points: Math.round(e.points),
      eventId: eventId || null,
      kioskId,
    })
    i++
  }
  if (i > 0) await batch.commit()
}

export async function listRecentScores(limit = 50) {
  const snap = await getDocs(
    query(collection(getDb(), C_SCORES), orderBy('ts', 'desc'), fbLimit(limit))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deleteScore(id) {
  await deleteDoc(doc(getDb(), C_SCORES, id))
}

/* ─── Leaderboards ─── */

/**
 * Aggregated leaderboard rows for a given scope. Same shape and normalization
 * as the local impl: `normPoints` (per-game-par normalized, the headline rank)
 * and `points` (raw sum). Computed at read time so changing a `par`
 * re-normalizes the whole history.
 */
export async function getLeaderboard({ scope, eventId } = {}) {
  const [teams, scores] = await Promise.all([readAll(C_TEAMS), readAll(C_SCORES)])
  const teamMap = new Map(teams.map(t => [t.id, t]))

  let visibilityCheck
  if (scope === 'event') {
    if (!eventId) return []
    const ev = await readDoc(C_EVENTS, eventId)
    if (!ev) return []
    const approvedRosterIds = new Set(
      (ev.roster || []).filter(r => r.status === 'approved').map(r => r.teamId)
    )
    visibilityCheck = (teamId) => approvedRosterIds.has(teamId)
  } else {
    visibilityCheck = (teamId) => teamMap.get(teamId)?.status === 'approved'
  }

  let filtered = scores.filter(s => s.teamId && visibilityCheck(s.teamId))

  if (scope === 'event') {
    filtered = filtered.filter(s => s.eventId === eventId)
  } else if (scope === 'month') {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    filtered = filtered.filter(s => s.ts >= monthStart)
  }

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
