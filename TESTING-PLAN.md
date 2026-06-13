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

## ✅ Claude [C] test run — 2026-06-10

All **pure-[C]** tests that needed no prior setup from you have been run (code-verified, with pure functions executed in Node where possible). Each test below carries an inline "**✅ Result**" line with file:line evidence. Summary:

| Test | What | Verdict |
|---|---|---|
| 1.3 | Score idempotency (deterministic doc ids + guard read) | ✅ PASS |
| 3.3 | Idle timer disabled on `#advanced/admin` | ✅ PASS |
| 3.7 | Firestore security rules vs. threat model | ✅ PASS (3 soft-spots by design) |
| 4.1 | play-mode session lifecycle (set/clear/re-prompt) | ✅ PASS |
| 4.3 | Profanity filter (executed in Node) | ✅ PASS — see substring note |
| 5.1 | Par-normalization formula (executed: par→100, 2×par→200, neg→0) | ✅ PASS |
| 5.2 | Re-par recomputes history at read time (no stored norm) | ✅ PASS |
| 5.3 | Cascade deletes (team/event) + merge re-tag | ✅ PASS |
| 6.3 | All 10 routes + legacy unprefixed hash | ✅ PASS — see blank-route note |
| 6.4 | Idle reset clears `sdshc-progress`, keeps `sdshc-lb-*` | ✅ PASS |
| 7.2 | Fonts from bundle, no CDN | ✅ PASS — see ref-doc note |
| 7.3 | Analytics fails silently when blocked | ✅ PASS |

**No failures.** Three **optional, defer-able** suggestions surfaced (none block the event):
1. **Profanity substring false-positives** (4.3) — names like `Scunthorpe`/`Cocker`/`Dickinson` get blocked by substring match; admin can override. Consider word-boundary matching for short ambiguous tokens.
2. **Blank screen on malformed advanced hash** (6.3) — `#advanced/<typo>` renders nothing (no in-app link reaches it). A `default: navigate('game-select')` in the advanced switch would self-heal.
3. **Google-Fonts in `other/` reference HTML** (7.2) — outside the app bundle; harmless, left as-is.

**Not run here** (need your hands — live Firestore round-trips, real offline toggling, two devices, Firebase Console, touch/visual): all `[U]` and `[C+U]` tests — Sections 1.1/1.2/1.4, 2.*, 3.1/3.2/3.4/3.5/3.6, 4.2/4.4, 6.1/6.2/6.5/6.6, 7.1. The `[C]` logic underneath several of those (idempotency, tagging, cascade, rules) is already confirmed above, so your live runs are confirming the *wiring*, not the *logic*.

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
- **✅ Result (2026-06-10, [C] code-verified):** PASS. [leaderboard-api.firestore.js:405-433](src/utils/leaderboard-api.firestore.js#L405-L433) — `recordScores` does a guard read of `${runId}__0` (line 411) and returns early if it exists; otherwise it writes deterministic doc ids `${runId}__${i}` via `setDoc` in a single `writeBatch`. Re-call paths: (a) guard short-circuits, or (b) `setDoc` overwrites the same ids → no duplication either way. The guard reading only entry 0 is sound because `batch.commit()` is atomic — entry 0 exists **iff** the whole run committed, so there's no partial-write window where 0 exists but 1..n don't. *Live round-trip against Firestore is the [C+U] half (1.1/1.2) — the idempotency logic itself is fully determined by code.*

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
- **✅ Result (2026-06-10, [C] code-verified):** PASS. [main.js:75-76](src/main.js#L75-L76) — `if (route.mode === 'advanced' && route.screen === 'admin') disableIdleTimer()`. [idle-timer.js:99-104](src/idle-timer.js#L99-L104) `disableIdleTimer()` sets `enabled=false`, clears both timers, hides the overlay; and both [`onActivity`](src/idle-timer.js#L78) and [`resetTimer`](src/idle-timer.js#L64) early-return when `!enabled`, so even pointer/key activity can't re-arm it. Navigating away to any other advanced screen calls `enableIdleTimer()` + `setIdleTimeout(600_000)` ([main.js:80-81](src/main.js#L80-L81)) so the 10-min timer resumes off-admin. *(The `[U]` half is just eyeballing that no overlay appears after 30s.)*

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
- **✅ Result (2026-06-10, [C] code-verified):** PASS — rules match the documented threat model.
  - **Teams** ([firestore.rules:26-38](firestore.rules#L26-L38)): public read; `create` only when `status=='pending'` + `name` is a 1–40-char string + `normalized` is a string; `update`/`delete` admin-only. Matches `getOrCreateTeam` which always writes `status:'pending'` and a `normalized` field.
  - **Events** ([firestore.rules:45-50](firestore.rules#L45-L50)): public read; `create`/`delete` admin-only; `update` admin-only **or** a diff touching *only* the `roster` key — exactly the unauthenticated "player adds a pending team mid-game" path (`addTeamToEventRoster` writes only `roster`).
  - **Scores** ([firestore.rules:56-64](firestore.rules#L56-L64)): public read; `create` requires `gameId`/`runId` strings + `points` is an **int** in ±100000; `update`/`delete` admin-only. `recordScores` writes `points: Math.round(...)` (always int) — consistent. ✅
  - **Accepted soft-spots (by design, low-stakes kiosk threat model):** (1) pending team names are world-readable (profanity filter guards entry, only *approved* teams ever render); (2) an unauthenticated client can rewrite an event's `roster` array (can't start/end/rename events; organizer cleans up in admin); (3) anyone can create a score within the point clamp (kiosk play is unauthenticated by necessity). All three are already noted inline in the rules and in AUDIT-2026-06.md — **no action needed.**

---

## Section 4 — Team-play flow / play-mode / roster

### 4.1 [C] play-mode session lifecycle
- **Steps (console):**
  ```js
  sessionStorage.getItem('sdshc-lb-play-mode')   // "team" | "casual" | null
  ```
  Choose Team on `#advanced/play-mode` → expect `"team"`. Navigate to `#intro` → expect it cleared. Re-enter advanced with an active event → expect re-prompt.
- **Also:** Changing the active event in admin clears it (forces re-prompt).
- **✅ Result (2026-06-10, [C] code-verified):** PASS. Session key `sdshc-lb-play-mode` is owned by [advanced-play-mode.js:24-38](src/screens/advanced-play-mode.js#L24-L38) (`get/set/clearPlayMode`, sessionStorage). Lifecycle traced:
  - **Set:** Team/Casual buttons call `setPlayMode('team'|'casual')` ([play-mode.js:95-103](src/screens/advanced-play-mode.js#L95-L103)).
  - **Cleared on intro:** [main.js:89-92](src/main.js#L89-L92) — the `intro` route calls `clearPlayMode()` every time, so returning to `#intro` always re-prompts on next Advanced entry. ✅
  - **Re-prompt gate:** [main.js:119-123](src/main.js#L119-L123) — `#advanced/game-select` redirects to `#advanced/play-mode` when `getActiveEventId() && !getPlayMode()`. ✅
  - **Cleared on active-event change in admin:** [advanced-admin.js:145-146](src/screens/advanced-admin.js#L145-L146) and [171-172](src/screens/advanced-admin.js#L171-L172) — both `setActiveEventId(...)` paths immediately call `clearPlayMode()`. ✅
  - **`getScoreEventId()` tagging** ([play-mode.js:45-49](src/screens/advanced-play-mode.js#L45-L49)): returns the event id **only** when an event is active *and* mode is `team`; casual → `null`. Confirms the 4.2 tagging contract at the source.

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
- **✅ Result (2026-06-10, [C] executed in Node against [profanity.js](src/utils/profanity.js)):** PASS (13/14 expectations; the one miss was a wrong *test* expectation, not a code bug). Confirmed: empty/whitespace → `false`; clean school names → `true`; profanity/slurs/`69`/`420` substrings → `false`. `isClean` lowercases, rejects blank, and does a substring match over the `BLOCKED` list.
  - ⚠️ **Suggested fix (Minor — substring false positives):** because matching is pure substring with no word boundaries, innocuous names get blocked: **`Scunthorpe`** (contains `cunt`), **`Cocker` / `Babcock`** (contains `cock`), **`Dickinson`** (a real SD-region surname/town; contains `dick`), **`Essex`/`Sussex`** (contains `sex`). Conversely `Assassins` is correctly allowed (blocklist uses `asshole`, not `ass`). For an event with SD school names this is low-risk, and admin can approve a blocked name manually — but if you want to reduce surprise rejections, consider word-boundary matching for the short/ambiguous tokens (`cock`, `dick`, `tit`, `sex`, `69`, `420`) while keeping substring matching for unambiguous slurs. **Optional, defer-able.**

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
- **✅ Result (2026-06-10, [C] executed in Node against the real registry + code-traced):** PASS. Ran `Math.round(Math.max(0, raw) / getGamePar(id) * 100)` — the exact expression from [leaderboard-api.firestore.js:493](src/utils/leaderboard-api.firestore.js#L493) + the `Math.round` at [line 504](src/utils/leaderboard-api.firestore.js#L504) — against `getGamePar('adv-jeopardy')` (= **3000**):

  | raw | normalized |
  |---|---|
  | 3000 (= par) | **100** |
  | 6000 (2×par) | **200** |
  | −500 | **0** (floored by `Math.max(0, …)`) |
  | 0 | 0 |
  | 1500 (½ par) | 50 |

  Registry pars: spin-wheel 1500 · trivia-blitz 1300 · jeopardy 3000 · word-game 1200 · field-guide 3000 · connections 1500. Unknown gameId → `DEFAULT_PAR = 1500` ([advanced-game-registry.js:81-91](src/data/advanced-game-registry.js#L81-L91)), so a stray score can't divide-by-zero or vanish. Sort is `b.normPoints - a.normPoints || b.points - a.points` ([line 511](src/utils/leaderboard-api.firestore.js#L511)) — normalized first, raw as tiebreak. Both columns are surfaced (`normPoints` + `points`).

### 5.2 [C] Re-par recomputes history at read time
- **Steps:** Note a game's leaderboard totals. Temporarily change its `par` in [src/data/advanced-game-registry.js](src/data/advanced-game-registry.js) (dev only), reload, re-read board.
- **Expect:** Entire history re-normalizes instantly (computed in `getLeaderboard`, not on write). **Revert the par change after.**
- **✅ Result (2026-06-10, [C] code-verified):** PASS. `recordScores` persists **only** raw `points` + `gameId` per score doc ([leaderboard-api.firestore.js:420-429](src/utils/leaderboard-api.firestore.js#L420-L429)) — no normalized value is ever stored. Normalization happens entirely at read time inside `getLeaderboard` via `getGamePar(s.gameId)` ([line 493](src/utils/leaderboard-api.firestore.js#L493)), which reads the live registry. So editing a `par` in [advanced-game-registry.js](src/data/advanced-game-registry.js) re-normalizes the whole history on the next board read, with zero migration. ✅

### 5.3 [C] Cascade deletes
- **Steps (console):** create a throwaway team + score, then `deleteTeam(id)`; create a throwaway event + tagged score, then `deleteEvent(id)`.
- **Expect:** team delete removes its scores + all roster entries; event delete removes its tagged scores + clears active-event if it was active on this kiosk.
- **✅ Result (2026-06-10, [C] code-verified):** PASS.
  - **`deleteTeam(id)`** ([leaderboard-api.firestore.js:211-227](src/utils/leaderboard-api.firestore.js#L211-L227)): deletes the team doc, then queries `/scores where teamId == id` and batch-deletes them, then walks every event and strips the team from its `roster`. No orphan scores or zombie roster refs. ✅
  - **`deleteEvent(id)`** ([leaderboard-api.firestore.js:303-312](src/utils/leaderboard-api.firestore.js#L303-L312)): deletes the event doc, batch-deletes `/scores where eventId == id`, and calls `setActiveEventId(null)` if it was the active event on this kiosk. ✅
  - **`mergeTeams(fromId, toId)`** ([leaderboard-api.firestore.js:232-249](src/utils/leaderboard-api.firestore.js#L232-L249)) re-tags all of `from`'s scores onto `to` then deletes `from` — the 2.4 collision-cleanup path is sound at the code level (its real-device half stays [U]).
  - *Note:* `deleteTeam` intentionally does **not** touch `eventId` on any surviving casual/other scores, and leaves scores with `teamId:null` (casual) untouched — correct, those aren't the team's.

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
- **✅ Result (2026-06-10, [C] code-verified against [router.js](src/router.js) + [main.js](src/main.js)):** PASS for all 10 documented routes + the legacy case:

  | Hash | → `parseHash` | Renders |
  |---|---|---|
  | `#intro` / `` (empty) | `{screen:'intro', mode:null}` | intro ✅ |
  | `#kid/splash` | `{screen:'splash', mode:'kid'}` | splash ✅ |
  | `#kid/grade-select` | `grade-select` | grade-select ✅ |
  | `#kid/game-select/sprouts` | `{game-select, tier:'sprouts'}` | tier grid ✅ |
  | `#kid/game/soil-cake/1` | `{game, gameId:'soil-cake', level:1}` | kid game ✅ |
  | `#advanced/game-select` | `{game-select, mode:'advanced'}` | adv grid ✅ |
  | `#advanced/game/adv-jeopardy/1` | `{game, gameId:'adv-jeopardy', level:1}` | adv game ✅ |
  | `#advanced/play-mode` | `play-mode` | play-mode ✅ |
  | `#advanced/roster` | `roster` | roster (guards to game-select if not team+event) ✅ |
  | `#advanced/admin` | `admin` | admin ✅ |
  | `#grade-select` (legacy, no prefix) | `{grade-select, mode:'kid'}` | kid grade-select ✅ |

  - ⚠️ **Suggested fix (Minor — silent blank on malformed advanced route):** `parseRoute` falls back to `{screen:'splash'}` for anything unrecognized ([router.js:96](src/router.js#L96)). In **kid** mode that's harmless (splash exists). In **advanced** mode the `switch` in [main.js:115-144](src/main.js#L115-L144) has **no `splash` case**, so a typo'd hash like `#advanced/foo` (or a bare `#advanced/`) sweeps the current screen and renders **nothing** (blank). Not reachable from any in-app link, so event-day risk is ~zero — but a one-line `default: navigate('game-select')` in the advanced switch (mirroring the kid-game unknown-id fallback) would make it self-heal. **Optional.**

### 6.4 [C] Idle reset preserves leaderboard keys
- **Spec:** idle timeout clears `sdshc-progress` but keeps all `sdshc-lb-*` keys.
- **Steps (console):** set a dummy `localStorage['sdshc-progress']`, trigger/await an idle reset (kid 120s / advanced 600s, or call the reset path), then:
  ```js
  Object.keys(localStorage).filter(k => k.startsWith('sdshc-'))
  ```
- **Expect:** `sdshc-progress` gone; `sdshc-lb-kiosk-id` and any other `sdshc-lb-*` survive.
- **✅ Result (2026-06-10, [C] code-verified):** PASS. The idle-reset callback ([main.js:206-210](src/main.js#L206-L210)) calls `clearProgress()` then `navigateRaw('intro')`. `clearProgress()` removes **only** `sdshc-progress` ([idle-timer.js:126-128](src/idle-timer.js#L126-L128)) — it never touches any `sdshc-lb-*` key. So `sdshc-lb-active-event` and `sdshc-lb-kiosk-id` (both localStorage) survive an idle reset. ✅
  - **Nuance worth knowing (not a bug):** the reset routes to `#intro`, whose handler calls `clearPlayMode()` — which removes `sdshc-lb-play-mode`. That key is **sessionStorage** and is *meant* to clear so each fresh kiosk user re-picks team/casual; the "all `sdshc-lb-*` survive" guarantee in CLAUDE.md is about the **localStorage** leaderboard keys (active-event, kiosk-id), which it does. Don't flag the play-mode reset as a regression.

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
- **✅ Result (2026-06-10, [C] grep-verified):** PASS for the app bundle. All four `@font-face` rules in [base.css:2-28](src/styles/base.css#L2-L28) load from `/assets/fonts/` (Silkscreen `.ttf`, 04b03 `.ttf`, JetBrains Mono `.woff2`, Noto Sans Symbols 2 `.ttf`). A repo-wide grep for `fonts.googleapis|fonts.gstatic|@import url|cdn.|unpkg|jsdelivr` (excluding `node_modules`) found **zero** hits in `src/`, `public/`, or `index.html`.
  - ℹ️ **Note (not in the app bundle):** [other/SDSHC_Games_Hub_GA4_Reference_Guide.html](other/SDSHC_Games_Hub_GA4_Reference_Guide.html) pulls the `Kalnia Glaze` font from Google Fonts. It's a **standalone internal reference doc**, not imported, built, or shipped by Vite — so it doesn't affect the offline kiosk. Harmless; left as-is. (If you ever open it offline it just falls back to a system font.)

### 7.3 [C] Analytics fails silently when blocked
- **Steps:** Block GA, play a game.
- **Expect:** No uncaught errors; gameplay unaffected (`trackEvent` is fire-and-forget).
- **✅ Result (2026-06-10, [C] code-verified):** PASS. [analytics.js:13-21](src/utils/analytics.js#L13-L21) — `trackEvent` guards on `typeof window.gtag === 'function'` (so a blocked/missing gtag is a no-op, not a throw) **and** wraps the call in `try { … } catch {}`. Every named helper (`trackGameStart`, `trackThemeToggle`, etc.) routes through `trackEvent`, so none can throw. When GA is blocked the calls silently do nothing and gameplay is unaffected. ✅

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
