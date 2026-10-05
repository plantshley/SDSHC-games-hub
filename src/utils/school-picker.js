/**
 * School picker: the shared combobox plus school-specific behavior. Used on the
 * roster screen and in the admin Manage Teams modal.
 *
 *   - "None" is pinned first and selected initially.
 *   - Typing filters approved schools. Pending schools never appear here.
 *   - The last row offers "Add “…” as a new school" when nothing matches
 *     exactly; the new school is created pending.
 *   - suggestFrom(teamName) auto-selects the single best fuzzy match while the
 *     picker is in auto mode. Any manual pick (None included) ends auto mode
 *     until reset(), so later typing in the team name can't override it.
 *   - Whatever the picker shows is what gets saved. Callers await commit()
 *     before reading getValue(), so a half-finished pick can't be skipped.
 */

import { attachCombobox } from './combobox.js'
import { suggestSchool } from './school-match.js'
import { listApprovedSchools, getOrCreateSchool } from './leaderboard-api.js'
import { normalizeName } from './leaderboard-shared.js'
import { isClean } from './profanity.js'

const NONE = { value: null, label: 'None' }

// Stand-in label for a team's school that isn't approved yet. The real name
// stays off kiosk screens until an admin approves it.
const UNAPPROVED_LABEL = 'School awaiting approval'

/**
 * @param {Object} [opts]
 * @param {string} [opts.inputClass] - class for the text input (matches the host form)
 * @param {(value: { schoolId: string|null, schoolName: string }) => void} [opts.onChange]
 * @returns {{
 *   el: HTMLElement,
 *   getValue: () => { schoolId: string|null, schoolName: string },
 *   setValue: (school: { id: string, name?: string, pending?: boolean }|null, manual?: boolean) => void,
 *   suggestFrom: (teamName: string) => void,
 *   commit: () => Promise<void>,
 *   reset: () => void,
 *   refresh: () => Promise<void>,
 * }}
 */
export function createSchoolPicker({ inputClass = 'adv-roster-input', onChange } = {}) {
  const el = document.createElement('div')
  el.className = 'adv-school-picker'
  el.innerHTML = `
    <input class="${inputClass} adv-school-input" maxlength="40" spellcheck="false"
      autocomplete="off" placeholder="None" aria-label="School" />
    <p class="adv-school-note" aria-live="polite"></p>
  `
  const input = el.querySelector('input')
  const note = el.querySelector('.adv-school-note')

  let schools = []        // approved schools, sorted by name
  let candidates = []     // last fuzzy candidates, floated to the top of the list
  let selected = null     // { id, name, pending? } | null (None)
  let manual = false
  let lastTeamName = ''   // re-suggested once the school list first loads
  let inflight = null     // an "Add new school" still being saved

  const combo = attachCombobox(input, {
    pinned: NONE,
    getOptions: () => schools.map(s => ({ value: s.id, label: s.name, school: s })),
    order: (options, query) => {
      if (query || candidates.length === 0) return options
      const rank = new Map(candidates.map((c, i) => [c.id, i]))
      return [...options].sort((a, b) => (rank.get(a.value) ?? 1e9) - (rank.get(b.value) ?? 1e9))
    },
    getAction: (query) => {
      if (!query) return null
      const norm = normalizeName(query)
      if (schools.some(s => s.normalized === norm)) return null
      return { label: `Add “${query}” as a new school` }
    },
    onSelect: (option) => {
      manual = true
      setSelected(option.value ? { id: option.value, name: option.label } : null)
      input.blur()
    },
    onAction: (query) => {
      inflight = addSchool(query).finally(() => { inflight = null })
    },
  })

  async function addSchool(query) {
    if (!isClean(query)) {
      setNote("That name isn't allowed. Try another.", 'error')
      input.value = query
      return
    }
    try {
      const res = await getOrCreateSchool(query)
      if (res.status === 'hidden') {
        // Moderated away. Don't let a kiosk quietly reattach teams to it.
        setNote("That school isn't available. Pick another or choose None.", 'error')
        paint(false)
        return
      }
      manual = true
      const approved = res.status === 'approved'
      setSelected({ id: res.schoolId, name: res.name, pending: !approved })
      if (approved) await refresh()
    } catch (err) {
      console.error('add school failed', err)
      setNote('Could not add that school. Try again.', 'error')
    }
    input.blur()
  }

  input.addEventListener('focus', () => input.select())
  // Search text isn't a selection. On leaving the field, an exact name match
  // counts as picking that school; anything else snaps back to the selection.
  input.addEventListener('blur', syncTyped)

  function syncTyped() {
    if (inflight) return
    const typed = input.value.trim()
    if (selected && typed === selected.name) return
    if (!selected && typed === '') return
    const exact = typed && schools.find(s => s.normalized === normalizeName(typed))
    if (exact) {
      manual = true
      setSelected({ id: exact.id, name: exact.name })
    } else {
      paint()
    }
  }

  function setNote(text, kind) {
    note.textContent = text || ''
    note.className = `adv-school-note${kind ? ` adv-school-note-${kind}` : ''}`
  }

  function paint(clearNote = true) {
    input.value = selected ? selected.name : ''
    if (selected && selected.pending) setNote('Awaiting approval before it shows on leaderboards.', 'pending')
    else if (clearNote) setNote('')
  }

  function setSelected(next) {
    const changed = (next?.id || null) !== (selected?.id || null)
    selected = next
    paint()
    if (changed && onChange) onChange(getValue())
  }

  function getValue() {
    return { schoolId: selected ? selected.id : null, schoolName: selected ? selected.name : '' }
  }

  function suggestFrom(teamName) {
    lastTeamName = teamName
    const res = suggestSchool(teamName, schools)
    candidates = res.candidates
    if (manual) return
    setSelected(res.match ? { id: res.match.id, name: res.match.name } : null)
  }

  let loaded = false
  async function refresh() {
    try {
      schools = (await listApprovedSchools()).sort((a, b) => a.name.localeCompare(b.name))
    } catch (err) {
      console.error('school list failed', err)
    }
    // A team name typed before the first load got suggestions against an
    // empty list; run it again now that there's something to match.
    if (!loaded) {
      loaded = true
      if (lastTeamName) suggestFrom(lastTeamName)
    }
    combo.refresh()
  }

  refresh()

  return {
    el,
    getValue,
    setValue(school, isManual = true) {
      manual = isManual
      setSelected(school
        ? { id: school.id, name: school.pending ? UNAPPROVED_LABEL : school.name, pending: !!school.pending }
        : null)
    },
    suggestFrom,
    async commit() {
      if (inflight) await inflight
      syncTyped()
    },
    reset() {
      manual = false
      candidates = []
      lastTeamName = ''
      setSelected(null)
    },
    refresh,
  }
}
