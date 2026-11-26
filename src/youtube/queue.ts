import { applyCommand } from "../commands.ts"
import { MAX_ALERTS } from "../commands/alerts.ts"
import { loadState, saveState } from "../state.ts"
import type { Card } from "./events.ts"

/**
 * Queues cards through the same `alert` command the CLI uses. State only holds
 * the newest `MAX_ALERTS`, so the rest are returned for the next write.
 */
export function queueCards(
  cards: Card[],
  dir?: string,
  log: (line: string) => void = console.log,
): Card[] {
  if (cards.length === 0) return cards
  let state = loadState(dir)
  const messages = cards.slice(0, MAX_ALERTS).map(({ kind, name, detail }) => {
    const result = applyCommand(state, ["alert", kind, name, detail])
    state = result.state
    return result.message
  })
  saveState(state, dir)
  for (const message of messages) log(message)
  return cards.slice(MAX_ALERTS)
}
