import { UsageError } from "../state.ts"
import type { ChatLine, CommandResult, State } from "../state.ts"

/** How many chat lines are kept. The overlay only has room for the newest. */
export const MAX_CHAT = 30

const SAMPLES: [name: string, text: string][] = [
  ["ExampleViewer", "hey! what are we working on today?"],
  ["ExampleRegular", "that PR review was useful, thanks"],
  ["ExampleNewcomer", "first time here, where is the repo?"],
  [
    "ExampleBuilder",
    "a much longer message to check that wrapping looks fine in the column",
  ],
]

/** `chat test` fills the on-screen chat with samples; `chat clear` empties it. */
export function chatCommand(state: State, args: string[], now: number): CommandResult {
  const [action, ...extra] = args
  if (extra.length === 0 && action === "clear") {
    return { state: { ...state, chat: [] }, message: "Cleared chat." }
  }
  if (extra.length === 0 && action === "test") {
    const chat: ChatLine[] = SAMPLES.map(([name, text], i) => ({
      id: `sample-${i}`,
      by: `sample-${i}`,
      name,
      text,
      at: now,
    }))
    return {
      state: { ...state, chat },
      message: `Showing ${chat.length} sample chat messages.`,
    }
  }
  throw new UsageError("Use `chat test` or `chat clear`.")
}
