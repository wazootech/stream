// @ts-check
;(() => {
  const { $, watchState, remainingMs, formatClock } = window.Session
  const raw = new URLSearchParams(location.search).get("mode")
  const mode = raw === "break" || raw === "ending" ? raw : "starting"
  document.body.dataset.mode = mode

  // A rotating nudge for breaks, so moving is part of the show.
  const BREAK_NUDGES = [
    "Stand up. Stretch. The tasks will keep.",
    "Water. Actual water.",
    "Look at something far away for twenty seconds.",
    "Walk a lap around the room.",
    "Shoulders down. Unclench your jaw.",
  ]

  /** @type {import("../src/state.ts").State | null} */
  let state = null

  /** @param {import("../src/state.ts").Task[]} tasks */
  function renderTasks(tasks) {
    const ul = $("tasks")
    ul.replaceChildren()
    for (const task of tasks) {
      const li = document.createElement("li")
      li.className = task.done ? "done" : ""
      const text = document.createElement("span")
      text.textContent = task.text
      li.append(text)
      ul.append(li)
    }
  }

  function render() {
    $("title").textContent = state?.title || "Wazoo Live"
    const tasks = state?.tasks ?? []
    const hasTimer = !!state?.timer

    if (mode === "starting") {
      $("headline").textContent = "Starting soon"
      $("subline").textContent = state?.goal || ""
      $("list-title").textContent = "Today's tasks"
      renderTasks(tasks)
      $("list").hidden = tasks.length === 0
      $("clock").hidden = !hasTimer
    } else if (mode === "break") {
      $("headline").textContent = "Break"
      const nudge = Math.floor(Date.now() / 15000) % BREAK_NUDGES.length
      $("subline").textContent = BREAK_NUDGES[nudge]
      $("list").hidden = true
      $("clock").hidden = !hasTimer
    } else {
      const done = tasks.filter((t) => t.done)
      const p = state?.predictions
      $("headline").textContent = "Session recap"
      $("subline").textContent = [
        `${done.length} of ${tasks.length} tasks finished`,
        p && p.total > 0 ? `predictions called ${p.hits}/${p.total}` : "",
        "thanks for watching",
      ]
        .filter(Boolean)
        .join(" · ")
      $("list-title").textContent = "Completed"
      renderTasks(done)
      $("list").hidden = done.length === 0
      $("clock").hidden = true
    }
  }

  function renderClock() {
    if (state?.timer) {
      $("clock").textContent = formatClock(remainingMs(state.timer))
    }
  }

  watchState((next) => {
    state = next
    render()
    renderClock()
  })
  setInterval(renderClock, 250)
  setInterval(render, 5000) // keeps the break nudge rotating
  render()
})()
