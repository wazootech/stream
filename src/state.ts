import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { BRAND } from "./brand.ts"

export interface Task {
  text: string
  done: boolean
}

export interface Timer {
  label: string
  /** Epoch milliseconds when the countdown reaches zero. */
  endsAt: number
  durationMs: number
}

export interface Predictions {
  /** The prediction currently on the air, if any. */
  current: string | null
  hits: number
  total: number
}

export type AlertKind =
  "sub" | "member" | "milestone" | "gift" | "superchat" | "sticker" | "redirect"

export interface Alert {
  /** Strictly increasing, so the overlay can tell new alerts from old ones. */
  id: number
  kind: AlertKind
  name: string
  /** Free text such as "$5.00: great stream" or "5 memberships". May be empty. */
  detail: string
  at: number
}

export interface State {
  title: string
  goal: string
  tasks: Task[]
  timer: Timer | null
  predictions: Predictions
  /** The most recent alerts, oldest first. The overlay plays new ones. */
  alerts: Alert[]
  /** What's playing ("Artist - Title"), shown on the waiting and break screens. */
  music: string | null
  updatedAt: number
}

export interface CommandResult {
  state: State
  message: string
}

export class UsageError extends Error {}

export const overlaysDir: string = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "overlays",
)

export function statePaths(dir: string = overlaysDir): {
  json: string
  js: string
} {
  return { json: join(dir, "state.json"), js: join(dir, "state.js") }
}

export function defaultState(): State {
  return {
    title: BRAND.defaultTitle,
    goal: "",
    tasks: [],
    timer: null,
    predictions: { current: null, hits: 0, total: 0 },
    alerts: [],
    music: BRAND.musicLabel,
    updatedAt: Date.now(),
  }
}

export function loadState(dir: string = overlaysDir): State {
  const { json } = statePaths(dir)
  if (!existsSync(json)) return defaultState()
  const saved = JSON.parse(readFileSync(json, "utf8")) as Partial<State>
  const base = defaultState()
  return {
    ...base,
    ...saved,
    predictions: { ...base.predictions, ...saved.predictions },
  }
}

/**
 * Persists state as JSON (for the CLI) and as a classic script (for the
 * overlays). Browser sources load `file://` pages, where `fetch` and module
 * scripts are blocked, so a plain `<script>` that sets a global is the one
 * channel that works everywhere.
 */
export function saveState(state: State, dir: string = overlaysDir): State {
  const next = { ...state, updatedAt: Date.now() }
  const { json, js } = statePaths(dir)
  writeFileSync(json, JSON.stringify(next, null, 2) + "\n")
  writeFileSync(js, `window.STREAM_STATE = ${JSON.stringify(next)};\n`)
  return next
}

export function remainingMs(timer: Timer | null, now = Date.now()): number {
  return timer ? Math.max(0, timer.endsAt - now) : 0
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
