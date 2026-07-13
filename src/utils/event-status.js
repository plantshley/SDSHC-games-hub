/**
 * Event status, derived at read time.
 *
 * The stored `status` field is only ever a MANUAL override ("I opened this",
 * "I ended this"). The status a device actually acts on is computed from the
 * clock every time it's read — the same pattern `getLeaderboard()` uses for
 * `par`, where changing one number re-normalizes the whole history instantly.
 *
 * Two things fall out of this for free:
 *
 *   1. A `scheduled` event opens itself the moment `scheduledStart` passes,
 *      on every device, with nobody signed in. It has to work this way:
 *      firestore.rules only permits `/events` writes from an admin (or a
 *      roster-only diff), so an unauthenticated kiosk physically cannot flip
 *      `status` to "open". Deriving needs no write at all.
 *
 *   2. An event nobody remembered to End closes itself once `endsAt` passes,
 *      so "join whatever is open" can't capture every device forever.
 *
 * Both work offline, because they're arithmetic over event docs already in the
 * local cache. They trust the device clock — the same clock every score's `ts`
 * already trusts.
 */

/** Fallback event length when `endsAt` wasn't stored (legacy docs). */
export const DEFAULT_EVENT_DURATION_MS = 24 * 60 * 60 * 1000

/**
 * When this event stops accepting play. Explicit `endsAt` wins; otherwise fall
 * back to a day after it started, which back-fills events created before
 * `endsAt` existed. Returns null only if the event has no start at all.
 */
export function eventEndsAt(ev) {
  if (!ev) return null
  if (typeof ev.endsAt === 'number') return ev.endsAt
  if (typeof ev.startedAt === 'number') return ev.startedAt + DEFAULT_EVENT_DURATION_MS
  return null
}

/** Ended by hand, or aged out. */
export function effectivelyEnded(ev, now = Date.now()) {
  if (!ev) return true
  if (ev.status === 'ended' || ev.endedAt != null) return true
  const ends = eventEndsAt(ev)
  return ends != null && now > ends
}

/**
 * Running right now: opened by hand, or scheduled for a time that has passed.
 * An aged-out event is never open, whatever its stored status says.
 */
export function effectivelyOpen(ev, now = Date.now()) {
  if (!ev || effectivelyEnded(ev, now)) return false
  if (ev.status === 'open') return true
  if (ev.status === 'scheduled') {
    return typeof ev.scheduledStart === 'number' && ev.scheduledStart <= now
  }
  return false
}

/**
 * The status to SHOW. Admin renders this rather than `ev.status`, which would
 * otherwise claim "open" for an event that aged out hours ago.
 * @returns {'open' | 'scheduled' | 'ended'}
 */
export function derivedEventStatus(ev, now = Date.now()) {
  if (effectivelyEnded(ev, now)) return 'ended'
  if (effectivelyOpen(ev, now)) return 'open'
  return 'scheduled'
}

/**
 * Which event this device should be in. Pure, so it can be tested without a
 * DOM; main.js wraps it with the localStorage reads/writes.
 *
 *   joined    — `eventId` is running. Persist it.
 *   ambiguous — several running. Don't guess; let the player pick.
 *   none      — nothing running. Clear any stale pointer.
 *   unknown   — can't tell (cold cache). Change NOTHING and don't prompt.
 *
 * Why `unknown` exists: offline, an unwarmed Firestore cache returns an empty
 * events list, which is indistinguishable from "no events exist". Clearing the
 * pointer there would drop a device out of its event mid-session, so an empty
 * list plus an existing pointer is treated as ignorance, not absence.
 *
 * Why a pointer does NOT win when several are open: the check runs on each fresh
 * Advanced Mode entry (never mid-session — main.js only calls this when no play
 * mode is set yet). Honoring a stale pointer there would silently re-join last
 * session's pick, so a device aimed at the wrong event of two could never be
 * corrected without the admin panel. Re-prompting every entry lets staff fix it
 * from the picker. In the common single-open case the pointer still sticks.
 *
 * Why no "closest start time" tiebreak: that resolves to the most recently
 * started event, so an event created at 2pm would silently capture a device
 * already running a 9am event. Any automatic pick mis-tags someone.
 *
 * @param {Array|null} events   all known events (any status)
 * @param {string|null} activeId this device's current pointer
 * @returns {{ decision: 'joined'|'ambiguous'|'none'|'unknown', eventId: string|null }}
 */
export function chooseEvent(events, activeId, now = Date.now()) {
  if (!Array.isArray(events)) return { decision: 'unknown', eventId: activeId || null }

  if (events.length === 0) {
    return activeId
      ? { decision: 'unknown', eventId: activeId }
      : { decision: 'none', eventId: null }
  }

  const open = events.filter(e => effectivelyOpen(e, now))

  // Several running at once: never auto-pick and never stick to a prior pick —
  // the device may have been aimed at the wrong one. Re-prompt so staff can
  // correct it from the picker. (See the header note on why the pointer loses.)
  if (open.length > 1) return { decision: 'ambiguous', eventId: null }

  // Exactly one open: a pointer already aimed at it wins (admin override, or a
  // choice made this session); otherwise join the sole open event.
  if (open.length === 1) return { decision: 'joined', eventId: open[0].id }

  // A pointer to something that's no longer open, and nothing else open either.
  return { decision: 'none', eventId: null }
}
