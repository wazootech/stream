import { parseMinutes } from "../args.ts"
import type { CommandResult, State } from "../state.ts"

function startTimer(state: State, minutes: number, label: string, now: number): State {
  const durationMs = Math.round(minutes * 60_000)
  return { ...state, timer: { label, endsAt: now + durationMs, durationMs } }
}

/** `timer <minutes> [label]` or `timer stop`. */
export function timerCommand(state: State, args: string[], now: number): CommandResult {
  if (args[0] === "stop") {
    return { state: { ...state, timer: null }, message: "Timer stopped." }
  }
  const minutes = parseMinutes(args[0])
  const label = args.slice(1).join(" ").trim() || "Focus"
  return {
    state: startTimer(state, minutes, label, now),
    message: `${label}: ${minutes} min`,
  }
}

/** `break [minutes]`, five by default. */
export function breakCommand(state: State, args: string[], now: number): CommandResult {
  const minutes = parseMinutes(args[0], 5)
  return {
    state: startTimer(state, minutes, "Break", now),
    message: `Break: ${minutes} min. Go move.`,
  }
}
