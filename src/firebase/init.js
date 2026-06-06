/**
 * Lazy Firebase initialization.
 *
 * Nothing here runs at import time — `initializeApp` only fires on the first
 * `getDb()` / `getFirebaseAuth()` call. That keeps the firebase SDK inert until
 * the Firestore backend is actually exercised, so importing this module (or the
 * Firestore data layer) can't throw just because config is still a placeholder.
 *
 * Firestore is created with `persistentLocalCache` so the kiosk works fully
 * offline at an event: reads serve from the last-synced cloud snapshot, writes
 * queue locally, and everything auto-syncs to the cloud on reconnect. See
 * docs/pwa_kiosk_guide.md §4 for the host/admin sync workflow.
 *
 * Single-tab manager (not multi-tab): the kiosk runs one installed PWA window,
 * which is the supported configuration and avoids multi-tab lock overhead.
 */

import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { firebaseConfig, FIREBASE_CONFIGURED } from './config.js'

let _app = null
let _db = null
let _auth = null

function ensureApp() {
  if (!FIREBASE_CONFIGURED) {
    throw new Error(
      'Firebase is not configured. Fill in src/firebase/config.js with the ' +
        'real firebaseConfig values before enabling the Firestore backend.'
    )
  }
  if (!_app) _app = initializeApp(firebaseConfig)
  return _app
}

export function getDb() {
  if (!_db) {
    _db = initializeFirestore(ensureApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager(),
      }),
    })
  }
  return _db
}

export function getFirebaseAuth() {
  if (!_auth) _auth = getAuth(ensureApp())
  return _auth
}
