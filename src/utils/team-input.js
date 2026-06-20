/**
 * Shared player + team input rows for advanced game intros.
 *
 * Behavior depends on the current Play Mode (sessionStorage):
 *   - "team":  each player gets a Team/School dropdown sourced from the
 *              active event's roster. Free-typing a new name adds it to the
 *              roster as pending (and creates the team if needed).
 *   - "casual" or unset: NO team line is rendered — just the player-name
 *              input. Scores still record (with teamId=null) but won't roll
 *              up to any team's leaderboard row.
 *
 * Player objects keep their existing shape (`name`, `color`, etc.) plus two
 * extra fields populated when in team mode: `teamId` (string|null) and
 * `teamName` (string).
 *
 * Rendering is incremental. On the +/- player picker, existing rows stay put
 * and only the single added/removed row animates in or out — no full wipe and
 * rebuild (which made every player blink out and back in). The first render in
 * a given mode builds all rows; subsequent calls reconcile against the DOM.
 */

import {
  getActiveEventId,
  getEventRoster,
  getOrCreateTeam,
  addTeamToEventRoster,
} from './leaderboard-api.js'
import { isClean } from './profanity.js'
import { getPlayMode } from '../screens/advanced-play-mode.js'

const DATALIST_ID = 'adv-team-datalist'

// Last-fetched roster per container, so reconcile (sync) can build appended
// team rows without re-fetching and wiping the whole list.
const rosterByContainer = new WeakMap()

// Player object → its row's resolveTeam fn, so commitTeams(players) can force a
// typed-but-uncommitted team name to resolve before a game snapshots players.
const resolverByPlayer = new WeakMap()

/**
 * Refresh the shared <datalist> with this event's APPROVED roster names only.
 * Pending teams are intentionally excluded — players shouldn't see unmoderated
 * names autocomplete-suggested. They can still type their team manually if
 * theirs is still awaiting approval.
 * Mounts the datalist on document.body the first time.
 */
async function ensureRosterDatalist(rosterTeams) {
  let dl = document.getElementById(DATALIST_ID)
  if (!dl) {
    dl = document.createElement('datalist')
    dl.id = DATALIST_ID
    document.body.appendChild(dl)
  }
  const approved = rosterTeams.filter(t => t.rosterStatus === 'approved')
  dl.innerHTML = approved.map(t => `<option value="${escapeAttr(t.teamName)}">`).join('')
}

/**
 * Render player rows into the given container. Behaviour is mode-aware and
 * incremental (see file header).
 *
 * Players array is mutated directly via input handlers. Caller can read
 * back `player.name`, `player.teamId`, `player.teamName` after start.
 */
export function renderTeamPlayerRows(container, players, options = {}) {
  const opts = { maxNameLen: 16, namePlaceholderPrefix: 'Player', ...options }
  const mode = getPlayMode()
  const eventId = getActiveEventId()
  const wantMode = (mode === 'team' && eventId) ? 'team' : 'casual'

  // Already built in this same mode? Reconcile in place. Otherwise (first
  // render, mode switch, or still showing the loading placeholder) full build.
  const alreadyBuilt =
    container.dataset.rowMode === wantMode &&
    container.children.length > 0 &&
    !container.querySelector('.adv-team-loading')

  if (!alreadyBuilt) {
    if (wantMode === 'team') buildTeamModeRows(container, players, eventId, opts)
    else buildCasualRows(container, players, opts)
    return
  }

  if (wantMode === 'team') reconcileTeamRows(container, players, eventId, opts)
  else reconcileCasualRows(container, players, opts)
}

/**
 * Force any typed-but-uncommitted team names to resolve to teamIds before a
 * game snapshots its players. Each advanced game's Start handler awaits this.
 *
 * Why it's needed: tapping Start blurs the team field, which fires resolveTeam
 * asynchronously — but the game copies `players` synchronously right after,
 * freezing teamId=null, so the run records teamless. Awaiting here guarantees
 * teamId has landed before the snapshot.
 *
 * Works offline too: getOrCreateTeam + addTeamToEventRoster use settleWrite, so
 * their Firestore writes don't block while offline (they cache immediately and
 * replay on reconnect). That keeps this awaitable in both states, so teamId
 * lands before the snapshot even for a team created offline in the PWA. Capped
 * at 4s so a genuinely stuck resolution can't trap the player at the intro.
 */
export function commitTeams(players) {
  if (!Array.isArray(players)) return Promise.resolve()
  const resolvers = players.map(p => resolverByPlayer.get(p)).filter(Boolean)
  if (resolvers.length === 0) return Promise.resolve()
  return Promise.race([
    Promise.all(resolvers.map(r => r())),
    new Promise(res => setTimeout(res, 4000)),
  ])
}

/* ─── Row enter / exit animation helpers ─── */

// Rows already on their way out (mid collapse animation) shouldn't count
// toward the live row total, so a quick −then−+ doesn't double-build.
function liveRows(container) {
  return [...container.children].filter(
    r => !r.classList.contains('adv-row-removing') && !r.classList.contains('adv-team-loading')
  )
}

function animateRowIn(row) {
  row.classList.add('adv-row-entering')
  const done = () => {
    row.classList.remove('adv-row-entering')
    row.removeEventListener('animationend', done)
  }
  row.addEventListener('animationend', done)
}

function animateRowOut(row) {
  row.classList.add('adv-row-removing')
  const remove = () => { if (row.isConnected) row.remove() }
  row.addEventListener('animationend', remove)
  // Safety net in case animationend never fires (reduced-motion, etc.).
  setTimeout(remove, 320)
}

/* ─── Casual mode ─── */

function buildCasualRow(player, i, players, { maxNameLen, namePlaceholderPrefix }) {
  const row = document.createElement('div')
  row.className = 'adv-sw-name-row'
  row.dataset.idx = i
  row.innerHTML = `
    <span class="adv-sw-name-dot" style="background: ${player.color}"></span>
    <input
      class="adv-sw-name-input adv-team-name-input"
      data-idx="${i}"
      value="${escapeAttr(player.name)}"
      maxlength="${maxNameLen}"
      spellcheck="false"
      placeholder="${namePlaceholderPrefix} ${i + 1}"
    />
  `
  const input = row.querySelector('.adv-team-name-input')
  input.addEventListener('input', () => {
    players[i].name = input.value || `${namePlaceholderPrefix} ${i + 1}`
  })
  return row
}

function buildCasualRows(container, players, opts) {
  // Ensure no team data is associated with players in casual mode.
  players.forEach(p => { p.teamId = null; p.teamName = '' })
  container.dataset.rowMode = 'casual'
  container.innerHTML = ''
  players.forEach((p, i) => container.appendChild(buildCasualRow(p, i, players, opts)))
}

function reconcileCasualRows(container, players, opts) {
  players.forEach(p => { p.teamId = null; p.teamName = '' })
  const rows = liveRows(container)
  // Remove trailing rows beyond the new count (animated collapse).
  for (let i = rows.length - 1; i >= players.length; i--) animateRowOut(rows[i])
  // Append rows for newly-added players (animated grow-in).
  for (let i = rows.length; i < players.length; i++) {
    const row = buildCasualRow(players[i], i, players, opts)
    container.appendChild(row)
    animateRowIn(row)
  }
}

/* ─── Team mode ─── */

function buildTeamRow(player, i, players, eventId, roster, opts) {
  const { maxNameLen, namePlaceholderPrefix } = opts
  const row = document.createElement('div')
  row.className = 'adv-team-row'
  row.dataset.idx = i
  row.innerHTML = `
    <div class="adv-team-line-name">
      <span class="adv-sw-name-dot" style="background: ${player.color}"></span>
      <input
        class="adv-sw-name-input adv-team-name-input"
        data-idx="${i}"
        value="${escapeAttr(player.name)}"
        maxlength="${maxNameLen}"
        spellcheck="false"
        autocomplete="off"
        placeholder="${namePlaceholderPrefix} ${i + 1}"
      />
    </div>
    <div class="adv-team-line-team">
      <span class="adv-team-label">Team</span>
      <input
        class="adv-team-input"
        data-idx="${i}"
        list="${DATALIST_ID}"
        value="${escapeAttr(player.teamName || '')}"
        maxlength="40"
        spellcheck="false"
        autocomplete="off"
        placeholder="Select or type your school"
      />
    </div>
    <span class="adv-team-feedback" data-idx="${i}"></span>
  `
  attachTeamRowHandlers(row, player, i, players, eventId, roster, opts)
  return row
}

function attachTeamRowHandlers(row, player, i, players, eventId, roster, { namePlaceholderPrefix }) {
  // Name input handler
  const nameInput = row.querySelector('.adv-team-name-input')
  nameInput.addEventListener('input', () => {
    player.name = nameInput.value || `${namePlaceholderPrefix} ${i + 1}`
  })

  // Team input handler — debounced resolve on input + immediate on blur/Enter
  const input = row.querySelector('.adv-team-input')
  const fb = row.querySelector('.adv-team-feedback')

  // Serialize this row's resolutions through one chain so two commits never run
  // getOrCreateTeam concurrently. Concurrent "does this name exist?" queries are
  // exactly what create duplicate team docs: both see "no" and both create. With
  // a chain, the first create completes (and becomes queryable) before the next
  // queued resolution runs, so it finds the existing team instead of duplicating
  // — for ANY interleaving (change+blur, or edit-then-recommit-back).
  let chain = Promise.resolve()
  let resolvedVal = null   // value last resolved onto player.teamId

  const resolveTeam = () => {
    const val = input.value.trim()
    if (!val) {
      player.teamId = null
      player.teamName = ''
      resolvedVal = null
      fb.className = 'adv-team-feedback'
      fb.textContent = ''
      return Promise.resolve()
    }
    if (!isClean(val)) {
      player.teamId = null
      player.teamName = ''
      resolvedVal = null
      fb.className = 'adv-team-feedback adv-team-feedback-error'
      fb.textContent = 'Pick a different name'
      return Promise.resolve()
    }
    // Already committed this exact name — no new work, but return the chain so a
    // caller (commitTeams) still awaits any resolution still in flight.
    if (val === resolvedVal && player.teamId) return chain

    chain = chain.then(async () => {
      // A prior queued resolution may have already handled this exact value.
      if (val === resolvedVal && player.teamId) return
      try {
        const result = await getOrCreateTeam(val)
        // Tag the player as early as possible — before the (idempotent) roster
        // writes — so teamId is set the moment the team doc exists. A game's
        // Start handler awaits commitTeams() before snapshotting players, so
        // this is what keeps scores carrying the team instead of recording
        // teamless.
        player.teamId = result.teamId
        player.teamName = result.name
        resolvedVal = val
        // Whether pre-existing or just created, add it to the event roster
        // (idempotent) so future player setups can pick it.
        await addTeamToEventRoster(eventId, result.teamId)
        const updatedRoster = await getEventRoster(eventId)
        ensureRosterDatalist(updatedRoster)
        // Keep the per-container roster cache fresh so rows added afterward see
        // the team that was just registered.
        const owner = row.parentElement
        if (owner) rosterByContainer.set(owner, updatedRoster)
        const rEntry = updatedRoster.find(r => r.teamId === result.teamId)
        if (rEntry && rEntry.rosterStatus === 'approved') {
          fb.className = 'adv-team-feedback adv-team-feedback-approved'
          fb.textContent = '✓ on roster'
        } else {
          fb.className = 'adv-team-feedback adv-team-feedback-pending'
          fb.textContent = '↻ awaiting approval'
        }
      } catch (err) {
        console.error('team lookup failed', err)
      }
    })
    return chain
  }

  // Let commitTeams(players) force this row to resolve before a game starts.
  resolverByPlayer.set(player, resolveTeam)

  // Resolve/create only on commit — tapping out (blur), Enter, or picking a
  // datalist option (change). Resolving on every keystroke would spawn a
  // pending team for each partial name ("P", "Pi", "Pie", …), flooding the
  // admin queue. While typing we just clear stale feedback; the team isn't
  // registered (and "awaiting approval" doesn't show) until the field commits.
  input.addEventListener('input', () => {
    // Persist the raw text immediately so a re-render keeps what was typed.
    // The team itself isn't created until the field commits (blur/Enter/
    // datalist pick), so partial names typed letter-by-letter don't each spawn
    // a pending team in the admin queue.
    player.teamName = input.value.trim()
    fb.className = 'adv-team-feedback'
    fb.textContent = ''
  })
  input.addEventListener('change', resolveTeam)
  input.addEventListener('blur', resolveTeam)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      input.blur()
    }
  })

  // Pre-fill feedback if the player already had a team selected.
  if (player.teamId) {
    resolvedVal = player.teamName
    const rEntry = roster.find(r => r.teamId === player.teamId)
    if (rEntry && rEntry.rosterStatus === 'approved') {
      fb.className = 'adv-team-feedback adv-team-feedback-approved'
      fb.textContent = '✓ on roster'
    } else if (rEntry) {
      fb.className = 'adv-team-feedback adv-team-feedback-pending'
      fb.textContent = '↻ awaiting approval'
    }
  } else if (player.teamName) {
    // Row was rebuilt with typed text that hadn't committed yet (e.g. the
    // field was focused when another player was added). Commit it now so the
    // team is saved instead of silently dropped.
    resolveTeam()
  }
}

async function buildTeamModeRows(container, players, eventId, opts) {
  container.dataset.rowMode = 'team'
  // Show a loading placeholder while we fetch the roster.
  container.innerHTML = `<div class="adv-team-loading">Loading roster…</div>`
  const roster = await getEventRoster(eventId)
  ensureRosterDatalist(roster)
  rosterByContainer.set(container, roster)
  container.innerHTML = ''
  players.forEach((p, i) =>
    container.appendChild(buildTeamRow(p, i, players, eventId, roster, opts))
  )
}

function reconcileTeamRows(container, players, eventId, opts) {
  const roster = rosterByContainer.get(container) || []
  const rows = liveRows(container)
  for (let i = rows.length - 1; i >= players.length; i--) animateRowOut(rows[i])
  for (let i = rows.length; i < players.length; i++) {
    const row = buildTeamRow(players[i], i, players, eventId, roster, opts)
    container.appendChild(row)
    animateRowIn(row)
  }
}

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
