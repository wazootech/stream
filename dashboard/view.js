// @ts-check
// Draws the latest snapshot. Inputs are never touched, so a refresh can't
// overwrite what is being typed.
import { renderTasks } from "./tasks.js"

/** @typedef {import("../src/state.ts").State} State */
/** @typedef {import("../src/dashboard/api.ts").Snapshot} Snapshot */
/** @typedef {import("./tasks.js").Run} Run */

/** @type {State | null} */
let state = null
let drawnTasks = ""

/** @param {string} id @param {string} text */
function set(id, text) {
  window.Session.$(id).textContent = text
}

/** @param {string} selector @param {boolean} disabled */
function disable(selector, disabled) {
  for (const node of document.querySelectorAll(selector)) {
    if (node instanceof HTMLButtonElement) node.disabled = disabled
  }
}

function renderClock() {
  const { $, remainingMs, formatClock } = window.Session
  const timer = state?.timer ?? null
  const left = remainingMs(timer)
  $("timer").classList.toggle("done", !!timer && left === 0)
  set("now-timer", timer ? timer.label : "No timer running")
  set("clock", timer ? formatClock(left) : "--:--")
  $("bar").style.width = timer ? `${(1 - left / timer.durationMs) * 100}%` : "0%"
}

/**
 * @param {Snapshot} snapshot
 * @param {Run} run
 */
export function show(snapshot, run) {
  state = snapshot.state
  const { title, goal, tasks, predictions: p, music, alerts } = state
  set("now-title", title)
  set("now-goal", goal || "(no goal yet)")
  set("now-prediction", p.current || "Nothing on the air.")
  set("score", `Called it ${p.hits} of ${p.total}`)
  set("now-music", music || "(hidden)")
  set("alert-count", `${alerts.length} recent alerts in the session.`)
  set("status", snapshot.status)
  disable(".settle", !p.current)
  disable("#timer-stop", !state.timer)

  // Redraw only on change, so a refresh doesn't steal focus from a task button.
  const key = JSON.stringify(tasks)
  if (key !== drawnTasks) {
    drawnTasks = key
    renderTasks(window.Session.$("tasks"), tasks, run)
  }
  renderClock()
}

setInterval(renderClock, 250)
