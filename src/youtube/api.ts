import type { AccessToken } from "./auth.ts"
import { API_BASE } from "./config.ts"
import type { Fetch } from "./config.ts"

/** Quota units per call, from the YouTube Data API quota cost table. */
export const COSTS = {
  channels: 1,
  liveBroadcasts: 1,
  "liveChat/messages": 5,
  subscriptions: 1,
} as const

export class ApiError extends Error {
  status: number
  /** Google's machine-readable cause, such as `quotaExceeded`. */
  reason: string
  constructor(status: number, reason: string) {
    super(`YouTube API error ${status} (${reason})`)
    this.status = status
    this.reason = reason
  }
}

export interface Api {
  get<T>(path: keyof typeof COSTS, query: Record<string, string>): Promise<T>
  /** Estimated quota spent since this client was created. */
  unitsUsed(): number
}

async function toError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: { errors?: { reason?: string }[] }
  }
  return new ApiError(response.status, body.error?.errors?.[0]?.reason ?? "unknown")
}

/** A read-only client. It retries once with a fresh token after a 401. */
export function createApi(fetch: Fetch, accessToken: AccessToken): Api {
  let units = 0
  return {
    unitsUsed: () => units,
    async get<T>(path: keyof typeof COSTS, query: Record<string, string>) {
      const send = async (force: boolean) => {
        const authorization = `Bearer ${await accessToken(force)}`
        units += COSTS[path]
        return fetch(`${API_BASE}${path}?${new URLSearchParams(query)}`, {
          headers: { authorization },
          signal: AbortSignal.timeout(30_000),
        })
      }
      let response = await send(false)
      if (response.status === 401) response = await send(true)
      if (!response.ok) throw await toError(response)
      return (await response.json()) as T
    },
  }
}
