import { parseIndex, requireText } from "../args.ts"
import { UsageError } from "../state.ts"
import type { CommandResult, State } from "../state.ts"

/** `task add|done|undo|rm|clear`. */
export function taskCommand(state: State, [sub, ...args]: string[]): CommandResult {
  switch (sub) {
    case "add": {
      const text = requireText(args, "task text")
      return {
        state: { ...state, tasks: [...state.tasks, { text, done: false }] },
        message: `Added task ${state.tasks.length + 1}: ${text}`,
      }
    }
    case "done":
    case "undo": {
      const i = parseIndex(args[0], state.tasks.length)
      const done = sub === "done"
      const tasks = state.tasks.map((t, j) => (j === i ? { ...t, done } : t))
      return {
        state: { ...state, tasks },
        message: `${done ? "Done" : "Reopened"}: ${state.tasks[i].text}`,
      }
    }
    case "rm": {
      const i = parseIndex(args[0], state.tasks.length)
      return {
        state: { ...state, tasks: state.tasks.filter((_, j) => j !== i) },
        message: `Removed: ${state.tasks[i].text}`,
      }
    }
    case "clear":
      return { state: { ...state, tasks: [] }, message: "Cleared tasks." }
    default:
      throw new UsageError(
        "Usage: task add <text> | done <n> | undo <n> | rm <n> | clear",
      )
  }
}
