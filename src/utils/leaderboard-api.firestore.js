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
 *   /teams/{teamId}    { name, normalized, status, schoolId?, color1, color2, createdAt, createdByKiosk }
 *   /schools/{id}      { name, normalized, status, createdAt, createdByKiosk }
 *   /events/{eventId}  { name, group?, startedAt, scheduledStart, endedAt, status, roster: [...] }
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
import { effectivelyOpen, eventEndsAt, DEFAULT_EVENT_DURATION_MS } from './event-status.js'
import {
  normalizeName,
  joinRoster,
  resolveTeamIdentity,
  aggregateLeaderboard,
} from './leaderboard-shared.js'

const K_ACTIVE = 'sdshc-lb-active-event'
const K_KIOSK = 'sdshc-lb-kiosk-id'

const C_TEAMS = 'teams'
const C_SCHOOLS = 'schools'
const C_EVENTS = 'events'
const C_SCORES = 'scores'

const BATCH_LIMIT = 450 // Firestore hard cap is 500 ops/batch; stay under it.

/* ─── ID generation ─── */

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
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

/* ─── Firestore write helper ─── */

/**
 * Await a write only when online. With offline persistence, a write applies to
 * the local cache immediately but its promise does NOT settle until reconnect —
 * so awaiting it offline hangs the caller indefinitely. Offline we let the write
 * replay in the background (logging failures) and resolve right away, so flows
 * that need to continue (team create → tag a score, roster add) don't block.
 * Online behaviour is unchanged: we await, surfacing real write errors.
 */
function settleWrite(writePromise) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    writePromise.catch(err => console.error('offline write (queued) failed', err))
    return Promise.resolve()
  }
  return writePromise
}

/**
 * Delete a list of doc refs in chunks under the per-batch cap.
 */
async function deleteRefsInChunks(refs) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(getDb())
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) batch.delete(ref)
    await settleWrite(batch.commit())
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
  await Promise.all([readAll(C_TEAMS), readAll(C_SCHOOLS), readAll(C_EVENTS), readAll(C_SCORES)])
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
 * Look up a team by name + school; return it if found (any status), else
 * create one with status "pending". See `resolveTeamIdentity` in
 * leaderboard-shared.js for how `schoolId` and `autoMatch` pick the team.
 * `colors` sets the accent pair on creation; omitted → deterministic pair
 * derived from the new id. Existing teams are returned unchanged (colors never
 * overwritten here).
 *
 * Offline caveat: the name lookup only sees teams already in the local cache,
 * so two devices inventing the same name offline can create duplicates — clean
 * up with admin merge/rename. Single-kiosk-per-event is unaffected.
 */
export async function getOrCreateTeam(name, colors, { schoolId = null, autoMatch = false } = {}) {
  const cleaned = String(name || '').trim()
  if (!cleaned) throw new Error('Team name required')

  const norm = normalizeName(cleaned)
  const [sameName, schools] = await Promise.all([
    teamsNamed(norm),
    autoMatch ? readAll(C_SCHOOLS) : [],
  ])
  const resolved = resolveTeamIdentity({ name: cleaned, teams: sameName, schools, schoolId, autoMatch })
  const existing = resolved.existing
  if (existing) {
    return { teamId: existing.id, status: existing.status, name: existing.name, schoolId: existing.schoolId || null }
  }

  const id = genId()
  const picked = colors && colors.color1 && colors.color2 ? colors : deriveTeamColors(id)
  const newTeam = {
    name: cleaned,
    normalized: norm,
    status: 'pending',
    schoolId: resolved.schoolId,
    color1: picked.color1,
    color2: picked.color2,
    createdAt: Date.now(),
    createdByKiosk: getKioskId(),
  }
  // settleWrite: offline this returns the client-generated id immediately
  // (the doc is cached + replays on reconnect) instead of hanging on the write,
  // so a team created offline can still tag scores. Online it awaits as before.
  await settleWrite(setDoc(doc(getDb(), C_TEAMS, id), newTeam))
  return { teamId: id, status: newTeam.status, name: newTeam.name, schoolId: newTeam.schoolId }
}

/** Every team sharing a normalized name (any school). */
async function teamsNamed(norm) {
  const snap = await getDocs(query(collection(getDb(), C_TEAMS), where('normalized', '==', norm)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
  const self = await readDoc(C_TEAMS, id)
  if (!self) throw new Error('Team not found')
  // If another team at the SAME school already uses this name, merge into it.
  // Same name at a different school is a different team.
  const collision = (await teamsNamed(norm)).find(t =>
    t.id !== id && (t.schoolId || null) === (self.schoolId || null)
  )
  if (collision) {
    await mergeTeams(id, collision.id)
    return collision
  }
  return updateTeam(id, { name: cleaned, normalized: norm })
}

export async function setTeamColors(id, color1, color2) {
  return updateTeam(id, { color1, color2 })
}

/**
 * Set or clear a team's school (admin). If a team with the same name already
 * belongs to the target school, the two are the same team: merge into it.
 */
export async function setTeamSchool(id, schoolId) {
  const sid = schoolId || null
  const self = await readDoc(C_TEAMS, id)
  if (!self) throw new Error('Team not found')
  const collision = (await teamsNamed(self.normalized)).find(t =>
    t.id !== id && (t.schoolId || null) === sid
  )
  if (collision) {
    await mergeTeams(id, collision.id)
    return collision
  }
  return updateTeam(id, { schoolId: sid })
}

async function updateTeam(id, patch) {
  const ref = doc(getDb(), C_TEAMS, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Team not found')
  await settleWrite(updateDoc(ref, patch))
  return { id, ...snap.data(), ...patch }
}

/**
 * Delete a team and ALL its score entries AND its entries in every event's
 * roster (mirrors local impl — prevents orphan roster refs and "zombie"
 * teams reappearing when a name is re-typed).
 */
export async function deleteTeam(id) {
  await settleWrite(deleteDoc(doc(getDb(), C_TEAMS, id)))

  const scoreSnap = await getDocs(
    query(collection(getDb(), C_SCORES), where('teamId', '==', id))
  )
  await deleteRefsInChunks(scoreSnap.docs.map(d => d.ref))

  const events = await readAll(C_EVENTS)
  for (const ev of events) {
    if (ev.roster && ev.roster.some(r => r.teamId === id)) {
      await settleWrite(updateDoc(doc(getDb(), C_EVENTS, ev.id), {
        roster: ev.roster.filter(r => r.teamId !== id),
      }))
    }
  }
}

/**
 * Rename `fromId` into `toId`: all scores re-tagged, every event roster
 * re-pointed, source team removed. Mirroring `deleteTeam`'s roster sweep keeps
 * a merge from leaving an orphaned "(deleted team)" entry behind and carries
 * the loser's event approval onto the merged team.
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
    await settleWrite(batch.commit())
  }

  const events = await readAll(C_EVENTS)
  for (const ev of events) {
    const next = reconcileRoster(ev.roster, fromId, toId)
    if (next) {
      await settleWrite(updateDoc(doc(getDb(), C_EVENTS, ev.id), { roster: next }))
    }
  }

  // A survivor with no school adopts the loser's, so a merge never drops a
  // school link the organizer set.
  const fromSchool = fromSnap.data().schoolId
  if (!toSnap.data().schoolId && fromSchool) {
    await settleWrite(updateDoc(doc(getDb(), C_TEAMS, toId), { schoolId: fromSchool }))
  }

  await settleWrite(deleteDoc(fromRef))
}

/**
 * Re-point a single event's roster from `fromId` to `toId` during a merge.
 * Returns the new roster array, or `null` if the event isn't affected (so the
 * caller can skip the write). If both teams are on the roster, the loser entry
 * is dropped and the survivor keeps the MORE-approved of the two statuses so a
 * merge never silently downgrades a visibility the organizer set.
 */
function reconcileRoster(roster, fromId, toId) {
  if (!Array.isArray(roster)) return null
  const fromEntry = roster.find(r => r.teamId === fromId)
  if (!fromEntry) return null
  const toEntries = roster.filter(r => r.teamId === toId)
  if (toEntries.length === 0) {
    // Winner not yet on the roster: just re-point the loser's entry onto it.
    return roster.map(r => (r.teamId === fromId ? { ...r, teamId: toId } : r))
  }
  // Winner already present: drop the loser and collapse to a single winner row
  // (defensive — a corrupt/colliding write could in theory leave duplicates),
  // keeping the FIRST winner entry so its addedAt/join-time stands. More-approved
  // wins (explicit 'pending' fallback so a future third status can't slip through).
  const status = fromEntry.status === 'approved' || toEntries.some(e => e.status === 'approved')
    ? 'approved'
    : 'pending'
  let keptWinner = false
  return roster
    .filter(r => r.teamId !== fromId)
    .filter(r => {
      if (r.teamId !== toId) return true
      if (keptWinner) return false
      keptWinner = true
      return true
    })
    .map(r => (r.teamId === toId ? { ...r, status } : r))
}

/* ─── Schools ─── */

/**
 * Look up a school by normalized name (any status); create it as "pending" if
 * missing. Kiosk path: a typed-in new school waits for admin approval before it
 * appears on any board or in kiosk search.
 *
 * Offline caveat (same as teams): the name lookup only sees cached schools, so
 * a device offline with a cold cache can create a duplicate pending school.
 * Clean up with admin Merge into….
 * @returns {Promise<{ schoolId: string, status: string, name: string }>}
 */
export async function getOrCreateSchool(name) {
  const cleaned = String(name || '').trim()
  if (!cleaned) throw new Error('School name required')
  const norm = normalizeName(cleaned)
  const snap = await getDocs(
    query(collection(getDb(), C_SCHOOLS), where('normalized', '==', norm), fbLimit(1))
  )
  if (!snap.empty) {
    const d = snap.docs[0]
    const s = d.data()
    return { schoolId: d.id, status: s.status, name: s.name }
  }
  const id = genId()
  const school = {
    name: cleaned,
    normalized: norm,
    status: 'pending',
    createdAt: Date.now(),
    createdByKiosk: getKioskId(),
  }
  // settleWrite: offline, the id is usable right away and the doc replays later.
  await settleWrite(setDoc(doc(getDb(), C_SCHOOLS, id), school))
  return { schoolId: id, status: school.status, name: school.name }
}

/**
 * Admin path: create a school already approved, or approve the existing one
 * with that name. Either way, an unlinked team named exactly like it is linked.
 */
export async function createApprovedSchool(name) {
  const { schoolId } = await getOrCreateSchool(name)
  return approveSchool(schoolId)
}

export async function listApprovedSchools() {
  return (await readAll(C_SCHOOLS)).filter(s => s.status === 'approved')
}

export async function listPendingSchools() {
  return (await readAll(C_SCHOOLS)).filter(s => s.status === 'pending')
}

export async function listAllSchools() {
  return readAll(C_SCHOOLS)
}

export async function getSchoolById(id) {
  return readDoc(C_SCHOOLS, id)
}

export async function approveSchool(id) {
  const updated = await updateSchool(id, { status: 'approved' })
  await linkTeamsToSchool(updated)
  return updated
}

export async function hideSchool(id) {
  return updateSchool(id, { status: 'hidden' })
}

export async function renameSchool(id, newName) {
  const cleaned = String(newName || '').trim()
  if (!cleaned) throw new Error('Name required')
  const norm = normalizeName(cleaned)
  const snap = await getDocs(
    query(collection(getDb(), C_SCHOOLS), where('normalized', '==', norm))
  )
  const collision = snap.docs.find(d => d.id !== id)
  if (collision) {
    await mergeSchools(id, collision.id)
    return { id: collision.id, ...collision.data() }
  }
  return updateSchool(id, { name: cleaned, normalized: norm })
}

/**
 * Fold `fromId` into `toId`: every team re-pointed, source school removed. A
 * team that now collides by name with a team already at `toId` merges into it.
 */
export async function mergeSchools(fromId, toId) {
  if (fromId === toId) return
  const [from, to] = await Promise.all([readDoc(C_SCHOOLS, fromId), readDoc(C_SCHOOLS, toId)])
  if (!from || !to) throw new Error('School not found')
  const snap = await getDocs(query(collection(getDb(), C_TEAMS), where('schoolId', '==', fromId)))
  for (const d of snap.docs) await setTeamSchool(d.id, toId)
  await settleWrite(deleteDoc(doc(getDb(), C_SCHOOLS, fromId)))
}

/** Delete a school. Its teams and their scores stay, just unlinked. */
export async function deleteSchool(id) {
  const snap = await getDocs(query(collection(getDb(), C_TEAMS), where('schoolId', '==', id)))
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(getDb())
    for (const d of snap.docs.slice(i, i + BATCH_LIMIT)) batch.update(d.ref, { schoolId: null })
    await settleWrite(batch.commit())
  }
  await settleWrite(deleteDoc(doc(getDb(), C_SCHOOLS, id)))
}

async function updateSchool(id, patch) {
  const ref = doc(getDb(), C_SCHOOLS, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('School not found')
  await settleWrite(updateDoc(ref, patch))
  return { id, ...snap.data(), ...patch }
}

/**
 * Link an unlinked team whose name exactly matches this school's ("link on
 * save" for a team created before the school existed). Skipped when the school
 * already has a team by that name, which would make two identical teams.
 */
async function linkTeamsToSchool(school) {
  const sameName = await teamsNamed(school.normalized)
  if (sameName.some(t => t.schoolId === school.id)) return
  const team = sameName.find(t => !t.schoolId)
  if (!team) return
  await settleWrite(updateDoc(doc(getDb(), C_TEAMS, team.id), { schoolId: school.id }))
}

/* ─── Events ─── */

export async function listEvents() {
  return (await listEventsWithSource()).events
}

/**
 * listEvents plus whether the result came from the local cache. An empty list
 * from the SERVER means every event really was deleted; an empty list from a
 * cold offline cache means nothing. Event auto-join needs to tell them apart.
 */
export async function listEventsWithSource() {
  const snap = await getDocs(collection(getDb(), C_EVENTS))
  const events = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.startedAt - a.startedAt)
  return { events, fromCache: snap.metadata.fromCache }
}

/**
 * Events running right now, per the derived clock rules in event-status.js —
 * NOT a raw `status === 'open'` filter. This is what lets a scheduled event
 * become joinable at its start time without anyone writing to it, and what
 * keeps a forgotten event from staying joinable forever.
 */
export async function listOpenEvents() {
  const now = Date.now()
  return (await listEvents()).filter(e => effectivelyOpen(e, now))
}

export async function getEventById(id) {
  return readDoc(C_EVENTS, id)
}

/**
 * Create a new event. With `options.scheduledStart` in the future, the event
 * is created "scheduled"; otherwise it opens immediately. `options.endsAt`
 * overrides the default 24h window (a multi-day event needs this, or it would
 * age out overnight). `options.group` ties events (e.g. a morning and an
 * afternoon session) into one Day leaderboard.
 */
export async function startEvent(name, options = {}) {
  const cleaned = String(name || '').trim() || 'Untitled Event'
  const { scheduledStart = null, endsAt = null, group = null } = options
  const now = Date.now()
  const id = genId()
  const startedAt = scheduledStart || now
  const event = {
    name: cleaned,
    group: String(group || '').trim() || null,
    startedAt,
    scheduledStart: scheduledStart || null,
    endedAt: null,
    endsAt: endsAt || startedAt + DEFAULT_EVENT_DURATION_MS,
    status: scheduledStart && scheduledStart > now ? 'scheduled' : 'open',
    roster: [],
  }
  await settleWrite(setDoc(doc(getDb(), C_EVENTS, id), event))
  return { id, ...event }
}

/**
 * Promote a scheduled event early. Re-anchors `startedAt` to now (it was set to
 * the future scheduledStart) so the 24h window runs from the real start, not
 * from a time that hasn't happened. Also refuses to leave a lapsed `endsAt`
 * behind, which would derive the event straight back to "ended" on the next read.
 */
export async function openScheduledEvent(eventId) {
  const now = Date.now()
  const ev = await readDoc(C_EVENTS, eventId)
  const patch = { status: 'open' }
  if (ev && typeof ev.startedAt === 'number' && ev.startedAt > now) {
    patch.startedAt = now
  }
  if (!ev || !(eventEndsAt(ev) > now)) {
    patch.endsAt = now + DEFAULT_EVENT_DURATION_MS
  }
  return updateEvent(eventId, patch)
}

export async function endEvent(id) {
  const updated = await updateEvent(id, { status: 'ended', endedAt: Date.now() })
  if (getActiveEventId() === id) setActiveEventId(null)
  return updated
}

/**
 * Re-open an ended event. Pushes `endsAt` forward — without this, reopening an
 * event that aged out would leave it instantly derived-ended again.
 */
export async function reopenEvent(id) {
  const now = Date.now()
  return updateEvent(id, {
    status: 'open',
    endedAt: null,
    endsAt: now + DEFAULT_EVENT_DURATION_MS,
  })
}

/** Set or clear an event's group (Day). Admin-only per firestore.rules. */
export async function setEventGroup(id, group) {
  return updateEvent(id, { group: String(group || '').trim() || null })
}

/** Move an event's auto-end time (admin-only per firestore.rules). */
export async function setEventEndsAt(id, endsAt) {
  return updateEvent(id, { endsAt })
}

/**
 * Delete an event AND all its tagged scores.
 */
export async function deleteEvent(id) {
  await settleWrite(deleteDoc(doc(getDb(), C_EVENTS, id)))

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
  await settleWrite(updateDoc(ref, patch))
  return { id, ...snap.data(), ...patch }
}

/* ─── Event Rosters (array field on the event doc) ─── */

export async function addTeamToEventRoster(eventId, teamId) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) throw new Error('Event not found')
  const roster = ev.roster || []
  if (roster.find(r => r.teamId === teamId)) return ev
  roster.push({ teamId, status: 'pending', addedAt: Date.now() })
  // settleWrite: don't hang on the roster write offline — the cache reflects it
  // immediately (so getEventRoster reads it back) and it replays on reconnect.
  await settleWrite(updateDoc(doc(getDb(), C_EVENTS, eventId), { roster }))
  return { ...ev, roster }
}

export async function removeTeamFromEventRoster(eventId, teamId) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) throw new Error('Event not found')
  const roster = (ev.roster || []).filter(r => r.teamId !== teamId)
  await settleWrite(updateDoc(doc(getDb(), C_EVENTS, eventId), { roster }))
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
  await settleWrite(updateDoc(doc(getDb(), C_EVENTS, eventId), { roster }))
  return { ...ev, roster }
}

/**
 * Returns the event's roster joined to team records.
 */
export async function getEventRoster(eventId) {
  const ev = await readDoc(C_EVENTS, eventId)
  if (!ev) return []
  const [teams, schools] = await Promise.all([readAll(C_TEAMS), readAll(C_SCHOOLS)])
  return joinRoster(ev, teams, schools, getTeamColors)
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
  // Wrapped in try/catch because getDoc throws offline ("client is offline")
  // for a doc id the cache has never seen — which a fresh runId always is.
  // The guard is only an optimization: the deterministic doc ids (`{runId}__{i}`)
  // + set() below keep the write idempotent on replay regardless, so when the
  // guard can't run (offline) we skip it and queue the write instead of
  // aborting — otherwise every score earned offline would be silently lost.
  try {
    const firstExisting = await getDoc(doc(getDb(), C_SCORES, `${runId}__0`))
    if (firstExisting.exists()) return
  } catch {
    // Intentionally broad: the guard is only an optimization, so fail OPEN on
    // ANY getDoc error (offline throws for an uncached id — that must never
    // abort the write, or offline scores are lost). Deterministic ids + set()
    // keep replay idempotent, and a genuine error (e.g. permission-denied)
    // still surfaces when batch.commit() runs below.
  }

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
  await settleWrite(deleteDoc(doc(getDb(), C_SCORES, id)))
}

/* ─── Leaderboards ─── */

/**
 * Aggregated leaderboard rows. See `aggregateLeaderboard` in
 * leaderboard-shared.js for scopes and row shape. Computed at read time so
 * changing a `par` re-normalizes the whole history.
 */
export async function getLeaderboard({ scope, eventId, groupBy = 'team' } = {}) {
  const [teams, schools, events, scores] = await Promise.all([
    readAll(C_TEAMS),
    readAll(C_SCHOOLS),
    readAll(C_EVENTS),
    readAll(C_SCORES),
  ])
  return aggregateLeaderboard({
    teams,
    schools,
    events,
    scores,
    scope,
    eventId,
    groupBy,
    getPar: getGamePar,
    getColors: getTeamColors,
  })
}
