import { setTimeout as delay } from "node:timers/promises"
import { ApiError } from "./api.ts"
import type { ChatUpdate } from "./chat-lines.ts"
import type { Card } from "./events.ts"
import { SetupError } from "./files.ts"
import { OAuthError } from "./oauth.ts"
import type { Source } from "./source.ts"

const MAX_BACKOFF_MS = 5 * 60_000
/** Longer than the overlay's poll, so it reads one batch before the next. */
const DRAIN_MS = 3000

const STOP = ["quotaExceeded", "dailyLimitExceeded", "accessNotConfigured"]
const DISABLE = [
  "insufficientPermissions",
  "insufficientLivePermissions",
  "liveStreamingNotEnabled",
  "subscriptionForbidden",
]

/** What to do about a failed poll. */
export function verdict(error: unknown): "stop" | "disable" | "retry" {
  if (error instanceof SetupError) return "stop"
  // A server hiccup at the token endpoint is not a revoked sign-in.
  if (error instanceof OAuthError) {
    return /^http_5|server_error|temporarily/.test(error.code) ? "retry" : "stop"
  }
  if (!(error instanceof ApiError)) return "retry"
  if (error.status === 401 || STOP.includes(error.reason)) return "stop"
  return DISABLE.includes(error.reason) ? "disable" : "retry"
}

/** Polls each source on its own schedule and queues what they find. */
export async function runBridge(options: {
  sources: Source[]
  /** Queues cards and returns the ones that have to wait. */
  emit: (cards: Card[]) => Card[]
  chat?: (update: ChatUpdate) => void
  log?: (line: string) => void
  now?: () => number
  sleep?: (ms: number) => Promise<unknown>
}): Promise<void> {
  const { sources, emit, log = console.log } = options
  const { now = Date.now, sleep = delay } = options
  let jobs = sources.map((source) => ({ source, nextAt: now(), failures: 0 }))
  let pending: Card[] = []

  async function run(job: (typeof jobs)[number]) {
    const { source } = job
    try {
      const result = await source.poll()
      const { cards, waitMs } = result
      pending.push(...cards)
      if (result.chat) options.chat?.(result.chat)
      job.failures = 0
      job.nextAt = now() + waitMs
    } catch (error) {
      const action = verdict(error)
      if (action === "stop") throw error
      const message = `${source.name}: ${(error as Error).message}.`
      if (action === "disable") {
        jobs = jobs.filter((other) => other !== job)
        log(`${message} Turned off for this run.`)
        return
      }
      // Failed calls cost quota too, so wait longer after each one.
      const wait = Math.min(source.baseMs * 2 ** ++job.failures, MAX_BACKOFF_MS)
      job.nextAt = now() + wait
      log(`${message} Retrying in ${wait / 1000}s.`)
    }
  }

  while (jobs.length > 0 || pending.length > 0) {
    try {
      for (const job of jobs.filter((j) => j.nextAt <= now())) await run(job)
    } finally {
      // Also on the way out, so cards already read aren't lost.
      try {
        pending = emit(pending)
      } catch (error) {
        log(`Couldn't write the overlay state: ${(error as Error).message}`)
      }
    }
    const waits = jobs.map((job) => job.nextAt - now())
    if (pending.length > 0) waits.push(DRAIN_MS)
    if (waits.length > 0) await sleep(Math.max(0, Math.min(...waits)))
  }
}
