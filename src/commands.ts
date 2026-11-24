import { requireText } from "./args.ts"
import { alertCommand } from "./commands/alerts.ts"
import { musicCommand } from "./commands/music.ts"
import { predictCommand } from "./commands/predict.ts"
import { taskCommand } from "./commands/tasks.ts"
import { breakCommand, timerCommand } from "./commands/timer.ts"
import { defaultState, formatClock, remainingMs, UsageError } from "./state.ts"
import type { CommandResult, State } from "./state.ts"

/** Pure reducer: applies one CLI command and returns the next state. */
export function applyCommand(
  state: State,
  argv: string[],
  now = Date.now(),
): CommandResult {
  const [command, ...rest] = argv
  switch (command) {
    case "title": {
      const title = requireText(rest, "title")
      return { state: { ...state, title }, message: `Title: ${title}` }
    }
    case "goal": {
      const goal = requireText(rest, "goal")
      return { state: { ...state, goal }, message: `Goal: ${goal}` }
    }
    case "task":
      return taskCommand(state, rest)
    case "timer":
      return timerCommand(state, rest, now)
    case "break":
      return breakCommand(state, rest, now)
    case "predict":
      return predictCommand(state, rest)
    case "alert":
      return alertCommand(state, rest, now)
    case "music":
      return musicCommand(state, rest)
    case "reset":
      return {
        state: { ...defaultState(), title: state.title, updatedAt: now },
        message: "Session reset. Title kept.",
      }
    case "status":
    case undefined:
      return { state, message: describe(state, now) }
    default:
      throw new UsageError(`Unknown command "${command}".\n\n${USAGE}`)
  }
}

export function describe(state: State, now = Date.now()): string {
  const lines = [`Title: ${state.title}`, `Goal: ${state.goal || "(none)"}`]
  if (state.tasks.length === 0) lines.push("Tasks: (none)")
  else {
    lines.push("Tasks:")
    state.tasks.forEach((t, i) =>
      lines.push(`  ${i + 1}. [${t.done ? "x" : " "}] ${t.text}`),
    )
  }
  lines.push(
    state.timer
      ? `Timer: ${state.timer.label} ${formatClock(remainingMs(state.timer, now))}`
      : "Timer: (off)",
  )
  const p = state.predictions
  lines.push(
    `Predictions: ${p.hits}/${p.total}${p.current ? ` (on air: ${p.current})` : ""}`,
  )
  return lines.join("\n")
}

export const USAGE = `npm run session -- <command>

  goal <text>             What's on the bench right now
  task add <text>         Add a task to the checklist
  task done <n>           Check one off (also: undo <n>, rm <n>, clear)
  timer <minutes> [label] Start a countdown (timer stop to cancel)
  break [minutes]         Start a break countdown (default 5)
  predict <text>          Put a prediction on the air
  predict hit | miss      Settle it and update the score
  alert <kind> <name> [detail]
                          Show a follow, sub, gift, raid, or cheer alert
  alert test | clear      Queue one of each to rehearse, or clear the list
  music <artist - title>  Show what's playing on the waiting and break screens
  music off               Hide the music line
  title <text>           Rename the stream title shown on the overlays
  reset                   Clear the session (keeps the title)
  status                  Print the current state`
