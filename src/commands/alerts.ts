import { requireText } from "../args.ts"
import { UsageError } from "../state.ts"
import type { Alert, AlertKind, CommandResult, State } from "../state.ts"

/** How many alerts are kept in state. The overlay only needs the newest few. */
export const MAX_ALERTS = 20
const MAX_NAME = 40
const MAX_DETAIL = 80

const KINDS: Record<string, AlertKind> = {
  follow: "follow",
  follower: "follow",
  sub: "sub",
  subscribe: "sub",
  subscriber: "sub",
  resub: "sub",
  gift: "gift",
  raid: "raid",
  cheer: "cheer",
  bits: "cheer",
}

/** One of each, for rehearsing the overlay before going live. */
const SAMPLES: [AlertKind, string, string][] = [
  ["follow", "ExampleFollower", ""],
  ["sub", "ExampleSubscriber", "Tier 1, 3 months"],
  ["gift", "ExampleGifter", "5 subs"],
  ["raid", "ExampleRaider", "42 viewers"],
  ["cheer", "ExampleCheerer", "100 bits"],
]

function push(
  state: State,
  kind: AlertKind,
  name: string,
  detail: string,
  now: number,
) {
  const last = state.alerts.at(-1)
  const alert: Alert = {
    id: Math.max(now, (last?.id ?? 0) + 1),
    kind,
    name: name.slice(0, MAX_NAME),
    detail: detail.slice(0, MAX_DETAIL),
    at: now,
  }
  return { ...state, alerts: [...state.alerts, alert].slice(-MAX_ALERTS) }
}

/** `alert <kind> <name> [detail]`, `alert test`, or `alert clear`. */
export function alertCommand(state: State, args: string[], now: number): CommandResult {
  const [first, ...rest] = args
  if (first === "clear") {
    return { state: { ...state, alerts: [] }, message: "Cleared alerts." }
  }
  if (first === "test") {
    const next = SAMPLES.reduce(
      (s, [kind, name, detail]) => push(s, kind, name, detail, now),
      state,
    )
    return { state: next, message: `Queued ${SAMPLES.length} sample alerts.` }
  }
  const kind = first ? KINDS[first.toLowerCase()] : undefined
  if (!kind) {
    throw new UsageError(
      "Usage: alert follow|sub|gift|raid|cheer <name> [detail] | test | clear",
    )
  }
  const [name, ...detail] = rest
  requireText(name ? [name] : [], "name")
  return {
    state: push(state, kind, name, detail.join(" ").trim(), now),
    message: `Alert queued: ${kind} from ${name}`,
  }
}
