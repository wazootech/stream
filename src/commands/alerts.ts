import { requireText } from "../args.ts"
import { UsageError } from "../state.ts"
import type { Alert, AlertKind, CommandResult, State } from "../state.ts"

/** How many alerts are kept in state. The overlay only needs the newest few. */
export const MAX_ALERTS = 20
const MAX_NAME = 40
const MAX_DETAIL = 80

/** Kind names and aliases. The Twitch words map to their closest YouTube match. */
const KINDS: Record<string, AlertKind> = {
  sub: "sub",
  subscribe: "sub",
  subscriber: "sub",
  follow: "sub",
  follower: "sub",
  member: "member",
  join: "member",
  milestone: "milestone",
  resub: "milestone",
  gift: "gift",
  gifted: "gift",
  superchat: "superchat",
  super: "superchat",
  cheer: "superchat",
  bits: "superchat",
  sticker: "sticker",
  supersticker: "sticker",
  redirect: "redirect",
  raid: "redirect",
}

/** One of each, for rehearsing the overlay before going live. */
const SAMPLES: [AlertKind, string, string][] = [
  ["sub", "ExampleSubscriber", ""],
  ["member", "ExampleMember", "Crew"],
  ["milestone", "ExampleRegular", "6 months, Crew: still here"],
  ["gift", "ExampleGifter", "5 memberships, Crew"],
  ["superchat", "ExampleSupporter", "$5.00: great stream"],
  ["sticker", "ExampleStickerFan", "$2.00: a waving cat"],
  ["redirect", "ExampleCreator", "42 viewers"],
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
  const word = first?.toLowerCase() ?? ""
  const kind = Object.hasOwn(KINDS, word) ? KINDS[word] : undefined
  if (!kind) {
    throw new UsageError(
      "Usage: alert sub|member|milestone|gift|superchat|sticker|redirect" +
        " <name> [detail] | test | clear",
    )
  }
  const [name, ...detail] = rest
  requireText(name ? [name] : [], "name")
  return {
    state: push(state, kind, name, detail.join(" ").trim(), now),
    message: `Alert queued: ${kind} from ${name}`,
  }
}
