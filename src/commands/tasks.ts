import { parseIndex, requireText } from "../args.ts"
import { credit, currentIndex, formatSplit } from "../splits.ts"
import { UsageError } from "../state.ts"
import type { CommandResult, State, Task } from "../state.ts"

/** Keeps the clock running only while there is a task left to time. */
function withTasks(state: State, tasks: Task[], splitFrom: number | null): State {
  return { ...state, tasks, splitFrom: currentIndex(tasks) < 0 ? null : splitFrom }
}

function start(state: State, now: number): CommandResult {
  const current = state.tasks[currentIndex(state.tasks)]
  if (!current) return { state, message: "Nothing left to time." }
  if (state.splitFrom !== null) return { state, message: "Already timing." }
  return { state: { ...state, splitFrom: now }, message: `Timing: ${current.text}` }
}

function pause(state: State, now: number): CommandResult {
  if (state.splitFrom === null) return { state, message: "Not timing." }
  const tasks = credit(state, currentIndex(state.tasks), now)
  return { state: { ...state, tasks, splitFrom: null }, message: "Splits paused." }
}

/** `task done <n>` splits: the time since the last split goes to that task. */
function done(state: State, i: number, now: number): CommandResult {
  const { text } = state.tasks[i]
  if (state.tasks[i].done) return { state, message: `Already done: ${text}` }
  const tasks = credit(state, i, now).map((t, j) =>
    j === i ? { ...t, done: true } : t,
  )
  const next = state.splitFrom === null ? null : now
  const took = tasks[i].ms > 0 ? ` (${formatSplit(tasks[i].ms)})` : ""
  return { state: withTasks(state, tasks, next), message: `Done: ${text}${took}` }
}

/** Reopens or removes a task, after crediting the running time where it was spent. */
function reorder(state: State, sub: "undo" | "rm", i: number, now: number) {
  const banked = credit(state, currentIndex(state.tasks), now)
  const tasks =
    sub === "rm"
      ? banked.filter((_, j) => j !== i)
      : banked.map((t, j) => (j === i ? { ...t, done: false } : t))
  const splitFrom = state.splitFrom === null ? null : now
  const verb = sub === "rm" ? "Removed" : "Reopened"
  return {
    state: withTasks(state, tasks, splitFrom),
    message: `${verb}: ${state.tasks[i].text}`,
  }
}

/** `task add|start|pause|done|undo|rm|clear`. */
export function taskCommand(
  state: State,
  [sub, ...args]: string[],
  now: number,
): CommandResult {
  switch (sub) {
    case "add": {
      const text = requireText(args, "task text")
      const tasks = [...state.tasks, { text, done: false, ms: 0 }]
      return {
        state: { ...state, tasks },
        message: `Added task ${tasks.length}: ${text}`,
      }
    }
    case "start":
      return start(state, now)
    case "pause":
      return pause(state, now)
    case "done":
      return done(state, parseIndex(args[0], state.tasks.length), now)
    case "undo":
    case "rm":
      return reorder(state, sub, parseIndex(args[0], state.tasks.length), now)
    case "clear":
      return { state: withTasks(state, [], null), message: "Cleared tasks." }
    default:
      throw new UsageError(
        "Usage: task add <text> | start | pause | done <n> | undo <n> | rm <n> | clear",
      )
  }
}
