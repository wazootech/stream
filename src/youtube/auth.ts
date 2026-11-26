import type { Fetch } from "./config.ts"
import { readToken, SetupError, writeToken } from "./files.ts"
import type { Client } from "./files.ts"
import { refresh } from "./oauth.ts"

/** Returns a working access token; `force` refreshes even if it looks fresh. */
export type AccessToken = (force?: boolean) => Promise<string>

const MARGIN_MS = 60_000

export function tokenProvider(options: {
  fetch: Fetch
  client: Client
  tokenPath: string
  now?: () => number
}): AccessToken {
  const { fetch, client, tokenPath, now = Date.now } = options
  return async (force = false) => {
    const token = readToken(tokenPath)
    if (!token) {
      throw new SetupError("Not signed in. Run: npm run youtube -- login")
    }
    if (!force && token.expiresAt - now() > MARGIN_MS) return token.accessToken
    const next = await refresh(fetch, client, token, now())
    writeToken(tokenPath, next)
    return next.accessToken
  }
}
