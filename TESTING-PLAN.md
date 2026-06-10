# SDSHC Games Hub — Comprehensive Testing Plan

**Date:** 2026-06-10
**Purpose:** Validate event readiness — with emphasis on the newly-live Firebase Phase 1B backend (teams/events/scores online + offline), the admin panel, and the team-play flow — while confirming nothing originally implemented regressed.
**Companion doc:** [AUDIT-2026-06.md](AUDIT-2026-06.md) (static findings). Run this plan to establish a working/broken baseline, then fix audit + test findings together, then re-run the regression section.

---

## How this document is organized

Every test is tagged:

- **[C]** — *Claude can run it* via the browser console / DevTools against `npm run dev`, or by reading code/state. No physical multi-device or real-network setup needed.
- **[U]** — *You should run/confirm it* — anything needing two physical kiosks, real offline toggling (airplane mode / pulling Wi-Fi), the Firebase Console, touch input, or human visual judgment.
- **[C+U]** — Claude sets up / inspects state; you confirm the real-world half.

Each test lists: **Pre** (precondition) · **Steps** · **Expect** · **Observe** (how to see the result).

> **Setup note for [C] Firebase tests:** Firestore's `persistentLocalCache` uses `persistentSingleTabManager` — **single browser tab only**. Open exactly one tab for any Firebase test or the SDK throws on the second tab. For console inspection of Firestore, use the app's own imported functions (see snippets) rather than reaching into IndexedDB directly.

---

## Recommended execution order

1. **Kid-game regression** (Section 6) — fast, low-risk, no Firebase. Establishes "the original hub still works."
2. **Advanced-game regression** (Section 6) — load/play/exit each of the 6.
3. **Scoring/leaderboard math** (Section 5) — pure-function checks in console.
4. **Team-play flow** (Section 4) — play-mode, roster, profanity.
5. **Admin panel + auth** (Section 3).
6. **Firebase online** (Section 1).
7. **Firebase offline** (Section 2).
8. **Two-kiosk** (Section 2, last — needs your second device).

Rationale: prove the stable base first, then move outward to the new, network-dependent surface so that when something breaks you know it's the new layer, not a regression.

---

## Section 1 — Firebase: teams + scores, ONLINE

Pre (all): `USE_FIRESTORE === true` in [src/firebase/config.js](src/firebase/config.js) (confirmed live), online, one tab, dev server running.

### 1.1 [C+U] Create a team via roster → lands in Firestore as `pending`
- **Pre:** An open event is active on this kiosk (create one in admin first, Section 3.4). Play mode = team.
- **Steps:** Go to `#advanced/roster`, type a new school name (e.g. "Test High 0610"), pick colors, submit.
- **Expect:** Team created with `status: "pending"`, added to the event roster as `pending`. Returns to game-select.
- **Observe [C]:** In console:
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  console.table(await api.listAllTeams())          // new team present, status "pending"
  console.log(await api.getEventRoster(api.getActiveEventId()))
  ```
- **Observe [U]:** Firebase Console → Firestore → `/teams` shows the new doc; `/events/{id}.roster` contains it.

### 1.2 [C+U] Play an advanced game in team mode → score written correctly
- **Steps:** Enter any advanced game, in team mode assign the player to the team, complete one full run.
- **Expect:** A `/scores` doc per player with correct `gameId` (e.g. `adv-jeopardy`), `teamId`, `eventId`, `runId`, `points`, `kioskId`, `ts`.
- **Observe [C]:**
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  console.table(await api.listRecentScores(10))
  ```
  Confirm `eventId` is set (team mode + active event) and `teamId` matches the team from 1.1.
- **Observe [U]:** Firebase Console `/scores` shows the new doc(s).

### 1.3 [C] Idempotency — re-submitting the same runId does not double-count
- **Why:** Firestore impl uses deterministic doc IDs `${runId}__${i}` + a guard read on the first entry, so a retried/duplicate `recordScores` overwrites the same docs instead of creating new ones.
- **Steps (console):**
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  const runId = crypto.randomUUID()
  const payload = { gameId:'adv-trivia-blitz', runId,
    entries:[{ playerName:'Idem', teamId:null, points:900 }],
    eventId:null }
  await api.recordScores(payload)
  await api.recordScores(payload)   // same runId again
  console.table((await api.listRecentScores(20)).filter(s => s.runId === runId))
  ```
- **Expect:** Exactly **one** row for that runId (not two).

### 1.4 [C+U] Leaderboard read reflects the score; pending team stays hidden publicly
- **Steps:** Open the leaderboard modal (trophy button) on This-Month / All-Time tabs.
- **Expect:** A `pending` team's score does **not** appear on public boards; once approved (Section 3.5) it appears. Current-Event board follows the per-event roster status independently.
- **Observe [C]:**
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  console.log(await api.getLeaderboard({ scope:'all-time' }))
  ```

---

## Section 2 — Firebase: teams + scores, OFFLINE  *(the highest-value, least-tested area)*

### 2.1 [U] Cache warm-up while online
- **Pre:** Online. **Steps:** Open the leaderboard modal once (calls `warmLeaderboardCache()`), and/or use Admin → Offline → "Warm cache" button and watch the progress bar finish.
- **Expect:** Teams/events/scores + media pre-fetched into the Firestore/IndexedDB cache.
- **Note:** This step is mandatory before an offline event — an un-warmed cache has nothing to read offline.
- **Dev-server caveat:** asset warm-up (the Admin "Cache for offline" button) only works on the **built/deployed** kiosk — `asset-manifest.json` and the service worker don't exist under `npm run dev`, so the admin panel now shows "Offline caching runs in the production build only" there instead of a JSON error. Test offline caching against `npm run build` + `npm run preview` (or the deployed Pages site), not the dev server.

### 2.2 [U] Create team + record scores fully offline
- **Steps:** Hard offline (DevTools Network → Offline, or disable Wi-Fi). Create a team via roster, play a game in team mode to completion.
- **Expect:** UI behaves normally; reads serve from cached snapshot; writes queue in Firestore's local mutation queue. No crash, no infinite spinner.
- **Observe [C] (while offline):**
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  console.table(await api.listRecentScores(10))  // shows the offline-written score from cache
  ```
- **Watch for:** any uncaught promise rejection in console, a blocked UI, or a score the game *thinks* saved but isn't queued (see Section 2.5).

### 2.3 [U] Reconnect → auto-replay, no duplicates
- **Steps:** Re-enable network. Wait a few seconds.
- **Expect:** Firestore auto-flushes the mutation queue to the cloud. The offline-created team and scores now appear server-side; **no duplicates** of what was already written.
- **Observe [U]:** Firebase Console shows exactly the offline-created docs once each. **Observe [C]:** counts before/after reconnect match (no doubling).

### 2.4 [U] Two-kiosk offline name collision *(needs 2 devices)*
- **Pre:** Both kiosks offline, same active event.
- **Steps:** On each kiosk, create a team named the **same** (e.g. "Pierre HS"). Play a game on each. Bring both online.
- **Expect (documented, by design):** Two **separate** `Pierre HS` team docs sync up — neither kiosk saw the other's offline write. Scores attach to their respective doc.
- **Resolution:** In Admin, use rename + **merge** to combine them (`renameTeam`, `mergeTeams` re-tag all scores from one onto the other and delete the loser). Confirm merged team's score total = sum of both.
- **This is expected behavior, not a bug** — but confirm the merge tooling actually works end-to-end, since it's the only mitigation.

### 2.5 [C+U] Score-save status pill (audit E-1 — now implemented)
The fire-and-forget gap is fixed: advanced games call `recordScoresWithStatus()` ([src/utils/score-save-status.js](src/utils/score-save-status.js)), which shows a non-blocking pill. Verify all three states actually render:
- **Saved (online):** complete a run online → bottom-center pill flashes **"Saving score… → Score saved ✓"** then fades. *[U] visual.*
- **Saved offline:** go offline (DevTools → Offline), complete a run → pill shows **"Saved offline — will sync when online"** immediately (it does **not** wait on the commit, which stays pending until reconnect). Then reconnect and confirm the score lands server-side (ties into 2.3). *[U].*
- **Failure:** force a rejection from the console and confirm the **error** pill appears (not a silent console-only log):
  ```js
  const { recordScoresWithStatus } = await import('/src/utils/score-save-status.js')
  // points:NaN is skipped by the writer, so to force a reject, call while signed-out
  // against rules, or temporarily break the gameId; observe the pill, not just console.
  recordScoresWithStatus({ gameId:'adv-trivia-blitz', runId:crypto.randomUUID(),
    entries:[{playerName:'ErrTest', teamId:null, points:100}], eventId:null })
  ```
- **Expect:** the pill is visible and legible at kiosk size and on phones (`max-width: min(90vw, 460px)`), auto-dismisses, and never blocks the results overlay.

---

## Section 3 — Admin panel + auth

Route: `#advanced/admin`. Pre: `USE_FIRESTORE === true` shows the **sign-in gate**; localStorage mode renders with no gate.

### 3.1 [U] Firebase admin user exists
- **Pre (one-time, you, in Firebase Console):** Authentication → Users → add user `admin@sdshc.local` with a password. Then Firestore → create doc `/admins/{uid}` using that user's UID (this is what the security rules check via `isAdmin()`).
- **Expect:** Without the `/admins/{uid}` doc, sign-in succeeds but **writes are denied** by rules — good to verify both states.

### 3.2 [U] Sign-in gate behavior
- **Steps:** Visit `#advanced/admin`. Enter wrong password → expect shake animation + friendly error. Enter correct password → panel unlocks. Reload the page.
- **Expect:** Session persists across reload (`browserLocalPersistence`) — no re-login needed.

### 3.3 [C] Idle timer is disabled on admin
- **Steps (console on `#advanced/admin`):** confirm no idle-warning/reset fires while idle (the route force-disables the timer).
- **Observe:** Leave it untouched ~30s+; no countdown overlay, no redirect to intro.

### 3.4 [U] Event lifecycle
- **Steps:** Create event → Start now (and separately, Schedule for later → open scheduled). End event. Reopen. Delete a throwaway event.
- **Expect:** Status transitions `scheduled → open → ended → open(reopen)`. Setting an event active clears the session play-mode (re-prompts on next entry). Deleting an event cascades: its tagged scores removed, active-event cleared on this kiosk if it was active.
- **Observe [C]:**
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  console.table(await api.listEvents()); console.log(api.getActiveEventId())
  ```

### 3.5 [U] Team moderation
- **Steps:** Approve a pending team **statewide**; separately approve/unapprove a team **for the current event**; remove a team from the event roster; change a team's two colors via the picker.
- **Expect:** Statewide `status` controls This-Month/All-Time visibility; per-event roster status controls Current-Event visibility — **independently**. Color changes persist and show on leaderboard swatches.

### 3.6 [U] Score moderation
- **Steps:** In Recent Scores, delete a row (with confirm).
- **Expect:** Row removed; leaderboard totals recompute. (Deleting a team also cascades its scores — verify in Section 2.4 merge.)

### 3.7 [C] Security spot-check (read the rules, don't pen-test prod)
- **Confirm in [firestore.rules](firestore.rules):** writes to teams/events/scores require `isAdmin()` except the intentionally-open paths (pending-team create, roster append). Note these accepted soft-spots in the audit; no action unless the event threat model changes.

---

## Section 4 — Team-play flow / play-mode / roster

### 4.1 [C] play-mode session lifecycle
- **Steps (console):**
  ```js
  sessionStorage.getItem('sdshc-lb-play-mode')   // "team" | "casual" | null
  ```
  Choose Team on `#advanced/play-mode` → expect `"team"`. Navigate to `#intro` → expect it cleared. Re-enter advanced with an active event → expect re-prompt.
- **Also:** Changing the active event in admin clears it (forces re-prompt).

### 4.2 [C+U] Casual vs team tagging
- **Expect:** Casual mode hides the team line in game intros and keeps `teamId === null` on scores; `eventId` is tagged **only** when team mode AND an active event exist (`getScoreEventId()`).
- **Observe [C]:** play a casual run, then `listRecentScores` → that row has `teamId:null, eventId:null`.

### 4.3 [C] Profanity filter
- **Steps (console):**
  ```js
  const { isClean } = await import('/src/utils/profanity.js')
  console.log(isClean('Pierre HS'), isClean('<a known-bad word>'))
  ```
- **Expect:** clean names `true`, blocked names `false`. **[U]:** confirm the roster UI actually refuses a blocked name inline before creating the team.

### 4.4 [U] Free-typed new team is immediately playable
- **Steps:** In a game intro (team mode), type a brand-new school name not yet approved.
- **Expect:** It's added as `pending` and usable in this run immediately; its score just won't appear publicly until approved. (Dropdown sources from the event roster regardless of approval.)

---

## Section 5 — Scoring / leaderboard math  *(mostly [C], pure functions)*

### 5.1 [C] Par-normalization formula
- **Spec:** `displayed = max(0, raw) ÷ par × 100`. A par run ≈ 100; negative runs floor at 0.
- **Steps (console):** record three runs for one game (raw = par, raw = 2×par, raw = −500) and read the board:
  ```js
  const api = await import('/src/utils/leaderboard-api.js')
  const { getGamePar } = await import('/src/data/advanced-game-registry.js')
  getGamePar('adv-jeopardy')   // confirm par used in the math below
  console.log(await api.getLeaderboard({ scope:'all-time' }))
  ```
- **Expect:** normalized ≈ 100 / 200 / 0 respectively; **Raw** column shows actual points; sorted by normalized.

### 5.2 [C] Re-par recomputes history at read time
- **Steps:** Note a game's leaderboard totals. Temporarily change its `par` in [src/data/advanced-game-registry.js](src/data/advanced-game-registry.js) (dev only), reload, re-read board.
- **Expect:** Entire history re-normalizes instantly (computed in `getLeaderboard`, not on write). **Revert the par change after.**

### 5.3 [C] Cascade deletes
- **Steps (console):** create a throwaway team + score, then `deleteTeam(id)`; create a throwaway event + tagged score, then `deleteEvent(id)`.
- **Expect:** team delete removes its scores + all roster entries; event delete removes its tagged scores + clears active-event if it was active on this kiosk.

---

## Section 6 — Regression: don't-break-what-worked

### 6.1 [U] All 11 kid games
For each (`soil-cake, dot-to-dot, dont-belong, coloring, planting-sim, spin-wheel, odd-one-out, drag-drop, farm-manager, trivia-blitz, food-web`): load → play one round/level → use home/back → confirm you land on the right tier's game-select with **no leftover/stacked DOM** from the previous screen.
- **Observe [C] for orphan-DOM:** after navigating, `document.querySelectorAll('.screen').length` should be 1 (the sweep in `switchScreen` removes orphans).

### 6.2 [U] All 6 advanced games
For each (`adv-spin-wheel, adv-trivia-blitz, adv-jeopardy, adv-word-game, adv-field-guide, adv-connections`): load → complete a run with ≥1 player → results overlay shows → exit cleanly. Confirm theme toggle (dark/light) and help overlay work on at least two of them.

### 6.3 [C] Router / hash routes
- **Steps (console):** walk every documented route and confirm it resolves to the right screen with no console error:
  ```
  #intro  #kid/splash  #kid/grade-select  #kid/game-select/sprouts
  #kid/game/soil-cake/1  #advanced/game-select  #advanced/game/adv-jeopardy/1
  #advanced/play-mode  #advanced/roster  #advanced/admin
  ```
  Also a legacy unprefixed hash (e.g. `#grade-select`) → should be treated as kid mode.

### 6.4 [C] Idle reset preserves leaderboard keys
- **Spec:** idle timeout clears `sdshc-progress` but keeps all `sdshc-lb-*` keys.
- **Steps (console):** set a dummy `localStorage['sdshc-progress']`, trigger/await an idle reset (kid 120s / advanced 600s, or call the reset path), then:
  ```js
  Object.keys(localStorage).filter(k => k.startsWith('sdshc-'))
  ```
- **Expect:** `sdshc-progress` gone; `sdshc-lb-kiosk-id` and any other `sdshc-lb-*` survive.

### 6.5 [U] Fully-offline kid-mode play
- **Steps:** Go offline, hard-reload, play several kid games.
- **Expect:** Everything works (kid games need no network). Only GA4 + Firebase calls fail, silently.

### 6.6 [U] PWA / stale-build check
- **Pre:** recent commit reworked the service worker to shell-only precache + runtime media cache to fix stale mobile builds.
- **Steps:** Build + deploy (or preview), load on a phone, then push a trivial change and reload.
- **Expect:** New build picked up (no stale shell); media still served from runtime cache offline.

---

## Section 7 — Cross-cutting

### 7.1 [C+U] No unexpected external calls
- **Steps:** DevTools Network, block all, reload, play games.
- **Expect:** Only GA4 (`googletagmanager`) and Firebase endpoints attempt network; everything else is local. Games remain fully playable with network blocked. **[C]:** `list_network_requests` / Network panel review.

### 7.2 [C] Fonts load from bundle (no CDN)
- **Steps:** Network panel → filter fonts.
- **Expect:** Silkscreen, 04b03, JetBrains Mono, Noto Sans Symbols 2 all served from `/assets/fonts/...`; zero requests to `fonts.googleapis.com` / `fonts.gstatic.com`.

### 7.3 [C] Analytics fails silently when blocked
- **Steps:** Block GA, play a game.
- **Expect:** No uncaught errors; gameplay unaffected (`trackEvent` is fire-and-forget).

---

## Quick-reference console snippet (paste once per session)

```js
// Load the live data layer the app actually uses
window.api = await import('/src/utils/leaderboard-api.js')
window.reg = await import('/src/data/advanced-game-registry.js')
// Common reads
console.log('kiosk', api.getKioskId(), 'activeEvent', api.getActiveEventId())
console.table(await api.listAllTeams())
console.table(await api.listRecentScores(15))
console.log(await api.getLeaderboard({ scope:'all-time' }))
```

---

## What Claude can realistically do for you in a follow-up "test run" session

- Drive Section 1.3, Section 2.5, Section 4.1–4.3, Section 5.1–5.3, Section 6.3–6.4, Section 7.* from the browser console against `npm run dev`, and report pass/fail with the actual values.
- Read [firestore.rules](firestore.rules) and the two `leaderboard-api.*` impls to confirm the offline/idempotency claims match code.

## What only you can do

- Anything in Section 2 real-offline and Section 2.4 two-kiosk (physical devices + real network toggling).
- Section 3.1 Firebase Console admin-user + `/admins/{uid}` setup, and all Section 3 visual confirmation.
- All touch-interaction and visual-formatting confirmation (see the "please eyeball" checklist in [AUDIT-2026-06.md](AUDIT-2026-06.md) Section D).
- Section 6.6 deploy + real-phone PWA refresh.
