/**
 * Firebase web SDK config + backend feature flag.
 *
 * ── What goes here ──────────────────────────────────────────────────────────
 * Paste the `firebaseConfig` object from the Firebase Console:
 *   Project settings (gear) → "Your apps" → Web app (</>) → copy the config.
 *
 * This config is SAFE TO COMMIT. The apiKey is a public client identifier, not
 * a secret — access is enforced by Firestore security rules (see
 * /firestore.rules), not by hiding these values. The admin PASSWORD is never
 * here; it lives hashed on Firebase's servers, set from the Console.
 *
 * ── Flipping the backend on ─────────────────────────────────────────────────
 * `USE_FIRESTORE` selects which leaderboard data layer the app uses:
 *   false → localStorage (Phase 1A, current default — works with no config)
 *   true  → Firestore + offline persistence (Phase 1B)
 * Leave it false until the real config below is filled in and verified, then
 * set it to true. The leaderboard-api selector reads this flag.
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyAYpNdvevLmVAc_If25LswgLo6YXtSJyus',
  authDomain: 'sdshc-games-hub.firebaseapp.com',
  projectId: 'sdshc-games-hub',
  storageBucket: 'sdshc-games-hub.firebasestorage.app',
  messagingSenderId: '795948743297',
  appId: '1:795948743297:web:25612a9868e05372f2eb80',
}

/**
 * The dummy email the admin sign-in uses under the hood. The admin screen only
 * shows a password field; internally it calls
 * signInWithEmailAndPassword(ADMIN_EMAIL, password). Create this exact user in
 * the Firebase Console (Authentication → Users) with a password of your choice.
 */
export const ADMIN_EMAIL = 'admin@sdshc.local'

/**
 * Master switch for the Firestore backend. Keep false until `firebaseConfig`
 * above is real, then flip to true to go live on Phase 1B.
 */
export const USE_FIRESTORE = true

/** True once the placeholder values have actually been replaced. */
export const FIREBASE_CONFIGURED =
  firebaseConfig.apiKey !== 'REPLACE_ME' &&
  firebaseConfig.projectId !== 'REPLACE_ME'
