import { requireText } from "../args.ts"
import { UsageError } from "../state.ts"
import type { CommandResult, State } from "../state.ts"

/** `predict <text>`, `predict hit|miss`, or `predict reset`. */
export function predictCommand(state: State, args: string[]): CommandResult {
  const [sub] = args
  const p = state.predictions
  if (sub === "hit" || sub === "miss") {
    if (!p.current) throw new UsageError("No prediction is on the air.")
    const hits = p.hits + (sub === "hit" ? 1 : 0)
    const total = p.total + 1
    return {
      state: { ...state, predictions: { current: null, hits, total } },
      message: `Prediction ${sub === "hit" ? "landed" : "missed"}: ${hits}/${total}`,
    }
  }
  if (sub === "reset") {
    return {
      state: { ...state, predictions: { current: null, hits: 0, total: 0 } },
      message: "Prediction score reset.",
    }
  }
  const text = requireText(args, "prediction")
  return {
    state: { ...state, predictions: { ...p, current: text } },
    message: `Predicting: ${text}`,
  }
}
