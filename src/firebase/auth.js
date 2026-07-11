/**
 * Admin authentication for the leaderboard admin panel (Phase 1B).
 *
 * The admin UI presents only a password field. The email is the hardcoded dummy
 * `ADMIN_EMAIL` from config.js — the user never sees or types it. A successful
 * sign-in produces a real Firebase Auth session, which is what the Firestore
 * security rules check (`request.auth.uid` must be in /admins) to permit
 * moderation writes. Session persists across reloads (browserLocalPersistence).
 *
 * These functions are only called when the Firestore backend is active; in the
 * localStorage backend the admin panel has no gate.
 *
 * Persistence is deliberately SESSION-scoped, not local. On a shared event
 * device the danger is a signed-in admin session outliving the person who
 * signed in — staff sets up, walks away, and a curious student later opens
 * #advanced/admin to a wide-open panel. `browserSessionPersistence` drops the
 * session when the app window/tab closes; main.js additionally signs out the
 * moment the admin screen is navigated away from. Together: the panel is only
 * ever unlocked while an admin is actively on it.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { getFirebaseAuth } from './init.js'
import { ADMIN_EMAIL } from './config.js'

/**
 * Sign in with the admin password. Throws on bad password / network error so
 * the caller can show feedback.
 * @param {string} password
 */
export async function adminSignIn(password) {
  const auth = getFirebaseAuth()
  await setPersistence(auth, browserSessionPersistence)
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, String(password || ''))
}

export async function adminSignOut() {
  await signOut(getFirebaseAuth())
}

/**
 * Subscribe to admin auth state. Calls `cb(isSignedIn)` immediately with the
 * restored session, then on every change. Returns an unsubscribe function.
 * @param {(signedIn: boolean) => void} cb
 */
export function onAdminAuthChange(cb) {
  return onAuthStateChanged(getFirebaseAuth(), (user) => cb(!!user))
}

export function isAdminSignedIn() {
  return !!getFirebaseAuth().currentUser
}
