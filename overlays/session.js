// @ts-check
// Shared helpers for the overlay pages. This is a classic script on purpose:
// OBS browser sources load file:// pages, where ES modules and fetch() are
// blocked but plain <script> tags work.
;(() => {
  const POLL_MS = 2000

  /** @type {Window["Session"]["watchState"]} */
  function watchState(onState) {
    const load = () => {
      const script = document.createElement("script")
      script.src = `state.js?t=${Date.now()}`
      script.onload = () => {
        script.remove()
        onState(window.STREAM_STATE ?? null)
      }
      script.onerror = () => {
        script.remove()
        onState(null)
      }
      document.head.append(script)
    }
    load()
    setInterval(load, POLL_MS)
  }

  /** @type {Window["Session"]["remainingMs"]} */
  function remainingMs(timer, now = Date.now()) {
    return timer ? Math.max(0, timer.endsAt - now) : 0
  }

  /** @type {Window["Session"]["formatClock"]} */
  function formatClock(ms) {
    const total = Math.ceil(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  /** @type {Window["Session"]["$"]} */
  function $(id) {
    const node = document.getElementById(id)
    if (!node) throw new Error(`Missing #${id}`)
    return node
  }

  window.Session = { watchState, remainingMs, formatClock, $ }
})()
