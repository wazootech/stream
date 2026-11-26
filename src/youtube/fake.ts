import type { Fetch } from "./config.ts"

export interface Call {
  url: URL
  init?: RequestInit
}

/** A reply is a body to send with status 200, or a status and body. */
export type Reply = object | [status: number, body: object]

/** Test double for `fetch`: answers from a list, in order, and records calls. */
export function fakeFetch(replies: Reply[]): { fetch: Fetch; calls: Call[] } {
  const calls: Call[] = []
  const queue = [...replies]
  const fetch: Fetch = async (url, init) => {
    calls.push({ url: new URL(url), init })
    const reply = queue.shift()
    if (!reply) throw new Error(`Unexpected request: ${new URL(url).pathname}`)
    const [status, body] = Array.isArray(reply) ? reply : [200, reply]
    return Response.json(body, { status })
  }
  return { fetch, calls }
}

/** The error body shape the YouTube Data API uses. */
export const apiError = (status: number, reason: string): Reply => [
  status,
  { error: { code: status, errors: [{ reason }] } },
]
