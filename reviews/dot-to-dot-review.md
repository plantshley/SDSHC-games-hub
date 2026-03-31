## Summary

Both files are generally well-structured and readable, but there are several real bugs: a `transitionTo` null-dereference crash when called from the intro screen before it is mounted, a double-fire risk for the auto-advance timer when the user manually switches puzzles, and a canvas sizing race that will produce a 0x0 canvas on first load.

---

## Issues

### dot-to-dot.js

- **[severity: high] Correctness — `transitionTo` null-dereference on first call**

  `transitionTo(oldEl, newEl)` immediately does `const parent = oldEl.parentNode` then calls `parent.appendChild(newEl)`. When a level button is pressed on the intro screen, `el` (the intro screen element) has already been returned by `createIntroScreen()` and appended to the DOM by the caller (the router), so `parentNode` will exist in normal flow. HOWEVER, if `transitionTo` is ever called before `el` is in the DOM — for example if a game screen calls `transitionTo(el, createIntroScreen())` and `el` was already removed during an overlapping transition — `parent` will be `null` and `parent.appendChild` will throw. The existing fallback guard `if (oldEl.parentNode) oldEl.remove()` on line 25 protects the cleanup path but not the `appendChild` call on line 26.

  Suggested fix: guard the appendChild — `if (parent) parent.appendChild(newEl)` — or bail out early if `parent` is null.

- **[severity: high] Correctness — auto-advance timer fires after manual puzzle switch**

  In `onPuzzleComplete`, a nested `setTimeout(..., 3000)` reads `currentPuzzleIdx` at the time it fires. But `loadPuzzle()` (called by the nav pill handler) also mutates `currentPuzzleIdx`. If the user manually taps a nav pill while the 3-second countdown is running, `currentPuzzleIdx` changes, and the timer will then auto-advance from the wrong puzzle index — potentially skipping a puzzle the user just selected or jumping out of bounds if they navigated to the last puzzle.

  Suggested fix: capture `const completedIdx = currentPuzzleIdx` at the start of `onPuzzleComplete` and compare against that captured value inside the timeout, bailing out if `currentPuzzleIdx !== completedIdx` by the time the timer fires.

- **[severity: high] Correctness — canvas width is 0 on first load due to rAF timing**

  `loadPuzzle` is triggered inside a `requestAnimationFrame` callback (line 352), which calls `sizeCanvas()` → `canvas.width = area.clientWidth`. For this to work the element must have been appended to the DOM and laid out before the rAF fires. The game screen element is returned and then added to the DOM by `transitionTo` — but `transitionTo` appends the element, reads `offsetHeight` (forces a reflow), then returns. The rAF is already queued before the element is in the DOM, so it fires in the next frame. In practice this is usually fine, but Vite's dev server on slower machines or inside a CSS `display:none` container can yield `clientWidth === 0` at rAF time. A safer pattern is to call `sizeCanvas` inside `loadPuzzle` only after confirming `area.clientWidth > 0`, with a re-queued rAF fallback if it's still zero.

- **[severity: medium] Correctness — `showLevelComplete` auto-advance timer not cancelled on home navigation**

  `showLevelComplete` fires a `setTimeout(..., 2500)` that calls `transitionTo(el, createIntroScreen())`. If the user taps the home button during those 2.5 seconds, the router navigates away, but the pending timer still fires and attempts to call `transitionTo` with the now-detached `el`. Because `el.parentNode` will be null at that point, this hits the same null-dereference described above. Suggested fix: store the timeout ID and clear it in the home button's event handler.

- **[severity: medium] Correctness — `onPuzzleComplete` timer not cancelled on manual nav switch**

  Related to the double-fire issue above: if the user taps a nav pill during the 300ms delay in `onPuzzleComplete`'s outer `setTimeout`, the inner 3000ms timeout is queued against the old puzzle. The `completed` flag is reset to `false` inside `loadPuzzle`, so the timer can call `onPuzzleComplete` a second time on the new puzzle if the user completes it quickly. Cancelling the outer timeout in `loadPuzzle` would prevent this.

- **[severity: low] Readability — dead ternary on line 231**

  ```js
  dotEl.style.color = color === 'hsl(0 100% 65%)' ? '#fff' : '#fff'
  ```
  Both branches are `'#fff'`. The conditional does nothing and will confuse future readers. Remove the ternary and just assign `'#fff'` directly.

- **[severity: low] Correctness — `dotColor` returns `hsl(360 ...)` for the last dot**

  When `idx === total - 1`, the formula `(idx / total) * 360` never reaches 360 (it reaches `(total-1)/total * 360`), so this is actually fine. But if the call site ever passes `idx === total` the last dot would be `hsl(360 ...)` which is valid (same as red). Not a bug in current usage, just worth noting.

---

### dot-to-dot.js — Items from the prompt that are NOT bugs

- **`transitionTo` called from `createIntroScreen` before DOM insertion** — as noted, the intro screen is already mounted by the router before any button can be pressed, so this path is safe in practice. The real hazard is in `showLevelComplete`, covered above.
- **`nearest` null check** — line 264 already guards `if (!nearest || nearestDist > 52) return` before `nearest.i` is accessed. This is correct.
- **Module-level state reset** — `createDotToDotGame()` resets both `currentLevelIdx` and `currentPuzzleIdx` before returning, which is sufficient for the single-instance kiosk use case.

---

### dot-to-dot.js (content data)

No structural issues. The JS is syntactically valid, all 4 levels are present, puzzle counts are 2 / 2 / 3 / 3 = 10 puzzles total as specified. All dot arrays contain `[xFrac, yFrac]` pairs with values in the 0–1 range. No malformed entries detected.

---

## Verdict

NEEDS CHANGES — three high-severity bugs (null-dereference crash on detached element, auto-advance firing on wrong puzzle after manual nav, and canvas 0x0 risk) should be fixed before shipping.
