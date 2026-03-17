/**
 * Typewriter effect — reveals text character by character with a blinking cursor.
 * @param {HTMLElement} el - The element containing the text to animate
 * @param {number} speed - Milliseconds per character (default 25)
 */
export function typewriter(el, speed = 40) {
  const fullText = el.textContent
  el.textContent = ''

  const textNode = document.createTextNode('')
  const cursor = document.createElement('span')
  cursor.className = 'typing-cursor'
  cursor.textContent = '|'
  el.appendChild(textNode)
  el.appendChild(cursor)

  let i = 0
  const interval = setInterval(() => {
    if (i < fullText.length) {
      textNode.textContent += fullText[i]
      i++
    } else {
      clearInterval(interval)
      // Remove cursor after a brief pause
      setTimeout(() => cursor.remove(), 0)
    }
  }, speed)
}
