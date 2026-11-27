import type { ChatUpdate } from "./chat-lines.ts"
import type { Card } from "./events.ts"

export interface PollResult {
  cards: Card[]
  /** On-screen chat changes, when the owner asked for them. */
  chat?: ChatUpdate
  /** How long to wait before polling this source again. */
  waitMs: number
}

/** Something the bridge polls on its own schedule. */
export interface Source {
  name: string
  /** Normal interval, which error back-off starts from. */
  baseMs: number
  poll(): Promise<PollResult>
}

const SEEN_LIMIT = 5000

/** Returns true the first time it is given an id. Remembers the newest few. */
export function dedupe(): (id: string) => boolean {
  const ids = new Set<string>()
  return (id) => {
    if (ids.has(id)) return false
    ids.add(id)
    if (ids.size > SEEN_LIMIT) ids.delete(ids.values().next().value as string)
    return true
  }
}
