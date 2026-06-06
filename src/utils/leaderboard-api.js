/**
 * Leaderboard data layer — backend selector.
 *
 * Every consumer imports from THIS file. The actual implementation is chosen by
 * the `USE_FIRESTORE` flag in src/firebase/config.js:
 *   false → ./leaderboard-api.local.js     (Phase 1A, localStorage)
 *   true  → ./leaderboard-api.firestore.js (Phase 1B, Firestore + offline cache)
 *
 * Both modules export the identical function surface, so flipping the flag
 * swaps the backend with no changes to any caller. Keeping both statically
 * imported means the per-kiosk synchronous helpers (getActiveEventId,
 * setActiveEventId, getKioskId) stay synchronous in both modes.
 */

import { USE_FIRESTORE } from '../firebase/config.js'
import * as local from './leaderboard-api.local.js'
import * as firestore from './leaderboard-api.firestore.js'

const impl = USE_FIRESTORE ? firestore : local

export const warmLeaderboardCache = impl.warmLeaderboardCache
export const getKioskId = impl.getKioskId
export const getOrCreateTeam = impl.getOrCreateTeam
export const listApprovedTeams = impl.listApprovedTeams
export const listPendingTeams = impl.listPendingTeams
export const listAllTeams = impl.listAllTeams
export const getTeamById = impl.getTeamById
export const approveTeam = impl.approveTeam
export const hideTeam = impl.hideTeam
export const renameTeam = impl.renameTeam
export const setTeamColors = impl.setTeamColors
export const deleteTeam = impl.deleteTeam
export const mergeTeams = impl.mergeTeams
export const listEvents = impl.listEvents
export const listOpenEvents = impl.listOpenEvents
export const getEventById = impl.getEventById
export const startEvent = impl.startEvent
export const openScheduledEvent = impl.openScheduledEvent
export const endEvent = impl.endEvent
export const reopenEvent = impl.reopenEvent
export const deleteEvent = impl.deleteEvent
export const addTeamToEventRoster = impl.addTeamToEventRoster
export const removeTeamFromEventRoster = impl.removeTeamFromEventRoster
export const approveTeamForEvent = impl.approveTeamForEvent
export const unapproveTeamForEvent = impl.unapproveTeamForEvent
export const getEventRoster = impl.getEventRoster
export const getActiveEventId = impl.getActiveEventId
export const setActiveEventId = impl.setActiveEventId
export const recordScores = impl.recordScores
export const listRecentScores = impl.listRecentScores
export const deleteScore = impl.deleteScore
export const getLeaderboard = impl.getLeaderboard
