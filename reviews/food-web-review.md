## Summary
Solid implementation with one correctness bug that could cause the quiz to be skippable or double-triggered, plus a few touch interaction gaps worth addressing on a kiosk.

## Issues

- **[severity: high]** Correctness — **Quiz can trigger multiple times or be skipped on rapid placement.** `startQuizPhase()` is called inside a `setTimeout(() => startQuizPhase(), 2000)`. If the user somehow places the last organism twice before that timer fires (not possible via normal UI since the item gets `fw-item-done`, but see below) the quiz starts cleanly. The real risk is subtler: `placedSet.size === ORGANISMS.length` only guards on the correct-drop path, but nothing prevents a second `pointerup` from firing on the same `item` element if the pointer is lifted very quickly and the browser emits a synthetic second event. The safer fix is to set a flag (`let phaseTransitioning = false`) and gate the `setTimeout` call behind it:
  ```js
  if (placedSet.size === ORGANISMS.length && !phaseTransitioning) {
    phaseTransitioning = true
    clearTimeout(factTimer)
    factToast.classList.remove('fw-toast-visible')
    setTimeout(() => startQuizPhase(), 2000)
  }
  ```

- **[severity: high]** Correctness — **`typeQuiz()` advances to `loadQuestion(0)` even if the element has been removed from the DOM mid-animation.** The `typeInstr` loop already guards with `el.parentNode`, but `typeQuiz()` inside `startQuizPhase()` does not. If the user taps Home during the quiz intro typing animation, `loadQuestion(0)` still fires 800 ms later and calls `el.querySelector(...)` on a detached element, returning `null` and throwing. Fix: add the same guard:
  ```js
  function typeQuiz() {
    if (idx < quizIntro.length && el.parentNode) {
      instrEl.textContent += quizIntro[idx++]
      setTimeout(typeQuiz, 35)
    } else if (el.parentNode) {          // <-- add this guard
      setTimeout(() => loadQuestion(0), 800)
    }
  }
  ```

- **[severity: high]** Correctness — **`handleAnswer` auto-advance timer is not cancelled if the user navigates away.** The `setTimeout(..., 4000)` inside `handleAnswer` holds a reference that fires even after the user taps Home. When it does, `el.querySelector('#fw-quiz-heading')` and `el.querySelector('#fw-quiz-panel')` return `null` inside `loadQuestion`, and `null.textContent = ...` throws. Store the timer ID and cancel it in the Home button handler:
  ```js
  let answerTimer = null
  // inside handleAnswer:
  answerTimer = setTimeout(() => { ... }, 4000)
  // inside Home button pointerdown:
  clearTimeout(factTimer)
  clearTimeout(answerTimer)
  navigate('game-select/guardians')
  ```

- **[severity: medium]** Touch interaction — **Clone is appended to `document.body` and positioned with raw `clientX/clientY`, but `setPointerCapture` is called on `item`, not `clone`.** On a touchscreen this is correct — captured events still fire on `item` via `pointermove`. However, if the user starts a drag, a second finger touches a different organism, and releases the first pointer, the first clone is never removed (the `dragging` flag per-item is reset but `clone` from the closure still exists). Each `fw-organism-item` has its own independent `dragging`/`clone` closure, so two simultaneous drags will leave the first clone orphaned in `document.body`. Fix: clear any existing clone in the `pointerdown` handler before creating a new one, or prevent multi-touch by checking `if (dragging) return` at the top of `pointerdown`.

- **[severity: medium]** Correctness — **Wrong-zone drop on an already-filled zone is allowed and will shake it.** If a user drops an organism on a zone that is already correctly filled (`fw-zone-filled`), the `orgId !== acceptsId` branch fires (because `acceptsId` matches the zone's organism, not the dragged one), causing the filled zone to shake and showing a misleading hint. Add a guard:
  ```js
  if (targetZone.classList.contains('fw-zone-filled')) return
  ```

- **[severity: medium]** Touch interaction — **`pointercancel` is not handled.** On kiosk/touchscreen environments, `pointercancel` fires when the OS takes over the pointer (e.g., palm rejection, system gesture). When it fires, `dragging` stays `true` and `clone` stays in `document.body` permanently. Add a `pointercancel` listener that mirrors `pointerup` cleanup:
  ```js
  item.addEventListener('pointercancel', () => {
    dragging = false
    if (clone) { clone.remove(); clone = null }
  })
  ```

- **[severity: low]** State management — **`currentQuestionIdx` is set both as a closure variable and as the parameter `qIdx` passed to `loadQuestion`/`handleAnswer`.** They are kept in sync only by convention, which is fine now, but `handleAnswer(btn, qIdx)` uses the passed `qIdx` (correct) while `currentQuestionIdx` is updated redundantly inside `loadQuestion`. The variable `currentQuestionIdx` is never read outside these two functions, making it dead state. Either use it as the single source of truth or remove it to reduce confusion.

- **[severity: low]** Readability — **`quizActive` flag is set to `true` in `startQuizPhase()` but never read anywhere in the file.** It appears to have been intended as a guard (e.g., to prevent dropping organisms during the quiz phase) but is unused. Either wire it up as a drag guard or remove it.

## Verdict
NEEDS CHANGES — three high-severity issues (quiz double-trigger guard, detached-DOM null throws on navigation, and uncleared auto-advance timer) should be fixed before ship.
