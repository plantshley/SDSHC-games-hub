/**
 * Styled combobox for Advanced Mode text fields (team and school pickers).
 *
 * Replaces the browser's native <datalist>, which gave no visual hint that a
 * field had suggestions and couldn't be themed. Wraps an existing <input> in
 * place (the input keeps its own classes and sizing) and adds:
 *   - a chevron button inside the field's right edge, so it reads as a dropdown
 *   - a themed list of 44px rows that filters as you type
 *   - an optional pinned first row (e.g. "None") and an optional action row at
 *     the bottom (e.g. "Add “…” as a new school")
 *
 * The list mounts on document.body with the app's mode/theme attributes copied
 * over (same approach as the leaderboard and roster modals), so it layers above
 * those modals and can't be clipped by a scrolling parent. It tracks the input
 * with a rAF loop while open, which also closes it if the input leaves the DOM
 * (screen transitions, row removal).
 *
 * Free text stays allowed: picking an option is a shortcut, never required.
 */

let comboSeq = 0

/**
 * @param {HTMLInputElement} input
 * @param {Object} opts
 * @param {() => Array<{ value: any, label: string, sublabel?: string }>} opts.getOptions
 * @param {(option: object) => void} opts.onSelect
 * @param {{ value: any, label: string, sublabel?: string }} [opts.pinned] - always first, never filtered
 * @param {(query: string, options: object[]) => ({ label: string }|null)} [opts.getAction] - bottom row
 * @param {(query: string) => void} [opts.onAction]
 * @param {string} [opts.emptyText] - shown when there is nothing to list
 * @param {(options: object[], query: string) => object[]} [opts.order] - reorder after filtering
 * @returns {{ open: () => void, close: () => void, isOpen: () => boolean, refresh: () => void }}
 */
export function attachCombobox(input, opts) {
  const id = `adv-combo-${++comboSeq}`
  const wrap = document.createElement('span')
  wrap.className = 'adv-combo'
  input.parentNode.insertBefore(wrap, input)
  wrap.appendChild(input)
  input.classList.add('adv-combo-input')
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-expanded', 'false')
  input.setAttribute('aria-controls', id)
  input.removeAttribute('list')

  const chevron = document.createElement('button')
  chevron.type = 'button'
  chevron.className = 'adv-combo-chevron'
  chevron.tabIndex = -1
  chevron.setAttribute('aria-label', 'Show options')
  chevron.textContent = '▾'
  wrap.appendChild(chevron)

  const list = document.createElement('div')
  list.className = 'adv-combo-list'
  list.id = id
  list.setAttribute('role', 'listbox')

  let open = false
  let rows = []         // [{ kind: 'pinned'|'option'|'action'|'empty', option? }]
  let active = -1
  let filterText = ''   // '' shows everything (chevron open), else filters
  let raf = 0

  function currentRows() {
    const q = filterText.trim().toLowerCase()
    let options = opts.getOptions() || []
    if (q) {
      options = options.filter(o =>
        o.label.toLowerCase().includes(q) || (o.sublabel || '').toLowerCase().includes(q)
      )
    }
    if (opts.order) options = opts.order(options, filterText.trim())
    const out = []
    if (opts.pinned) out.push({ kind: 'pinned', option: opts.pinned })
    for (const o of options) out.push({ kind: 'option', option: o })
    const action = opts.getAction ? opts.getAction(filterText.trim(), options) : null
    if (action) out.push({ kind: 'action', option: action })
    if (out.length === 0 && opts.emptyText) out.push({ kind: 'empty', option: { label: opts.emptyText } })
    return out
  }

  function render() {
    rows = currentRows()
    if (active >= rows.length) active = rows.length - 1
    list.innerHTML = rows.map((r, i) => {
      const o = r.option
      const cls = [
        'adv-combo-row',
        `adv-combo-row-${r.kind}`,
        i === active ? 'adv-combo-row-active' : '',
      ].filter(Boolean).join(' ')
      const selectable = r.kind !== 'empty'
      return `
        <div class="${cls}" id="${id}-r${i}" data-i="${i}" ${selectable ? 'role="option"' : 'aria-disabled="true"'}>
          ${r.kind === 'action' ? '<span class="adv-combo-plus">+</span>' : ''}
          <span class="adv-combo-label">${escapeHtml(o.label)}</span>
          ${o.sublabel ? `<span class="adv-combo-sub">${escapeHtml(o.sublabel)}</span>` : ''}
        </div>
      `
    }).join('')
    if (active >= 0) input.setAttribute('aria-activedescendant', `${id}-r${active}`)
    else input.removeAttribute('aria-activedescendant')
    if (rows.length === 0) hideList()
    else if (open && !list.isConnected) showList()
  }

  function showList() {
    const app = document.getElementById('app')
    if (app) {
      list.dataset.mode = app.dataset.mode || 'advanced'
      if (app.dataset.theme) list.dataset.theme = app.dataset.theme
      else delete list.dataset.theme
    }
    document.body.appendChild(list)
    position()
  }

  function hideList() {
    if (list.isConnected) list.remove()
  }

  function position() {
    const r = wrap.getBoundingClientRect()
    const vh = window.innerHeight
    const gap = 4
    const below = vh - r.bottom - gap - 8
    const above = r.top - gap - 8
    const natural = Math.min(list.scrollHeight || 280, 280)
    const flipUp = below < Math.min(natural, 160) && above > below
    const maxH = Math.max(88, Math.min(280, flipUp ? above : below))
    list.style.left = `${Math.round(r.left)}px`
    list.style.width = `${Math.round(r.width)}px`
    list.style.maxHeight = `${Math.round(maxH)}px`
    if (flipUp) {
      list.style.top = ''
      list.style.bottom = `${Math.round(vh - r.top + gap)}px`
    } else {
      list.style.bottom = ''
      list.style.top = `${Math.round(r.bottom + gap)}px`
    }
  }

  function track() {
    if (!open) return
    if (!input.isConnected) {
      close()
      return
    }
    position()
    raf = requestAnimationFrame(track)
  }

  function openList(showAll) {
    filterText = showAll ? '' : input.value
    active = -1
    if (!open) {
      open = true
      wrap.classList.add('adv-combo-open')
      input.setAttribute('aria-expanded', 'true')
      document.addEventListener('pointerdown', onOutside, true)
      raf = requestAnimationFrame(track)
    }
    render()
  }

  function close() {
    if (!open) return
    open = false
    cancelAnimationFrame(raf)
    wrap.classList.remove('adv-combo-open')
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    document.removeEventListener('pointerdown', onOutside, true)
    hideList()
  }

  function onOutside(e) {
    if (wrap.contains(e.target) || list.contains(e.target)) return
    close()
  }

  function choose(i) {
    const r = rows[i]
    if (!r || r.kind === 'empty') return
    close()
    if (r.kind === 'action') opts.onAction && opts.onAction(filterText.trim())
    else opts.onSelect(r.option)
  }

  // Keep focus in the input while interacting with the list, so picking a row
  // doesn't blur the field (which would commit the half-typed text first).
  // Both events: Chrome moves focus on the (compat) mousedown, which a
  // pointerdown preventDefault alone doesn't always suppress.
  list.addEventListener('pointerdown', (e) => e.preventDefault())
  list.addEventListener('mousedown', (e) => e.preventDefault())
  list.addEventListener('click', (e) => {
    const rowEl = e.target.closest('.adv-combo-row')
    if (rowEl) choose(Number(rowEl.dataset.i))
  })

  chevron.addEventListener('pointerdown', (e) => e.preventDefault())
  chevron.addEventListener('mousedown', (e) => e.preventDefault())
  chevron.addEventListener('click', (e) => {
    e.preventDefault()
    if (open) close()
    else openList(true)
  })

  input.addEventListener('focus', () => openList(true))
  input.addEventListener('input', () => openList(false))
  input.addEventListener('blur', () => close())
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) openList(true)
      if (rows.length === 0) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      let next = active
      for (let n = 0; n < rows.length; n++) {
        next = (next + step + rows.length) % rows.length
        if (rows[next].kind !== 'empty') break
      }
      active = next
      render()
      list.querySelector('.adv-combo-row-active')?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' && open && active >= 0) {
      // Picking a row replaces the field's own Enter behavior.
      e.preventDefault()
      e.stopImmediatePropagation()
      choose(active)
    } else if (e.key === 'Escape' && open) {
      // Close just the list, not an enclosing modal.
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  })

  return {
    open: () => openList(true),
    close,
    isOpen: () => open,
    refresh: () => { if (open) render() },
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
