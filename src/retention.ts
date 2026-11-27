import type { State } from "./state.ts"

/** How long viewer names and messages may stay on this computer. */
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Drops alerts and chat lines saved 30 days ago or longer, and any without a
 * timestamp. Returns the same object when there is nothing to drop.
 */
export function expire(state: State, now = Date.now()): State {
  const fresh = (item: { at?: number }) =>
    typeof item.at === "number" && now - item.at < RETENTION_MS
  const alerts = state.alerts.filter(fresh)
  const chat = state.chat.filter(fresh)
  const same =
    alerts.length === state.alerts.length && chat.length === state.chat.length
  return same ? state : { ...state, alerts, chat }
}
