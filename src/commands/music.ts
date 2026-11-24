import { requireText } from "../args.ts"
import type { CommandResult, State } from "../state.ts"

const MAX_LENGTH = 120

/** `music <artist - title>` shows what's playing; `music off` clears it. */
export function musicCommand(state: State, args: string[]): CommandResult {
  if (args.length === 1 && args[0] === "off") {
    return { state: { ...state, music: null }, message: "Music line cleared." }
  }
  const music = requireText(args, "track").slice(0, MAX_LENGTH)
  return { state: { ...state, music }, message: `Now playing: ${music}` }
}
