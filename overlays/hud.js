// @ts-check
// Goal, task splits (time spent per task, LiveSplit style), and a small timer.
;(() => {
  const { $, watchState, remainingMs, formatClock } = window.Session
  const layout = new URLSearchParams(location.search).get("layout")
  document.body.dataset.layout = layout === "compact" ? "compact" : "strip"
  /** Rows that fit in the strip. */
  const ROWS = 4

  /** @type {import("../src/state.ts").State | null} */
  let state = null

  const current = () => state?.tasks.findIndex((task) => !task.done) ?? -1

  /** @param {number} index */
  function spent(index) {
    const from = state?.splitFrom
    const running = typeof from === "number" && index === current()
    return (
      (state?.tasks[index]?.ms ?? 0) + (running ? Math.max(0, Date.now() - from) : 0)
    )
  }

  /** @param {number} ms */
  function format(ms) {
    const total = Math.floor(ms / 1000)
    const two = (/** @type {number} */ n) => String(n).padStart(2, "0")
    const h = Math.floor(total / 3600)
    const m = Math.floor(total / 60) % 60
    return h > 0 ? `${h}:${two(m)}:${two(total % 60)}` : `${m}:${two(total % 60)}`
  }

  /** @param {string} tag @param {string} className @param {string} [text] */
  function el(tag, className, text = "") {
    const node = document.createElement(tag)
    node.className = className
    node.textContent = text
    return node
  }

  /** Redraws the rows around the current task. */
  function renderStatic() {
    $("goal").textContent = state?.goal || "Getting set up"
    const tasks = state?.tasks ?? []
    const now = current()
    const middle = now < 0 ? tasks.length : now
    const first = Math.max(0, Math.min(middle - 2, tasks.length - ROWS))
    const rows = tasks.slice(first, first + ROWS).map((task, i) => {
      const index = first + i
      const kind = task.done ? "done" : index === now ? "current" : "next"
      const li = el("li", kind)
      const time = el("span", "time")
      time.dataset.index = String(index)
      li.append(el("span", "name", task.text), time)
      return li
    })
    if (rows.length === 0) rows.push(el("li", "empty", "No tasks yet."))
    $("splits").replaceChildren(...rows)
    $("total-row").hidden = tasks.length === 0
  }

  function renderClocks() {
    for (const node of document.querySelectorAll("#splits .time")) {
      const ms = spent(Number(node.getAttribute("data-index")))
      node.textContent = ms > 0 ? format(ms) : "-"
    }
    const total = (state?.tasks ?? []).reduce((sum, _, i) => sum + spent(i), 0)
    $("total").textContent = format(total)
    const timer = state?.timer ?? null
    const left = remainingMs(timer)
    $("timer").classList.toggle("done", !!timer && left === 0)
    $("timer").hidden = !timer
    $("timer-label").textContent = timer
      ? left === 0
        ? `${timer.label}: time!`
        : timer.label
      : ""
    $("clock").textContent = timer ? formatClock(left) : ""
    $("bar").style.width = timer ? `${(1 - left / timer.durationMs) * 100}%` : "0%"
  }

  watchState((next) => {
    state = next
    renderStatic()
    renderClocks()
  })
  setInterval(renderClocks, 250)
  renderStatic()
  renderClocks()
})()
