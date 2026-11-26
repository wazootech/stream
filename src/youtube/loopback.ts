import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { OAuthError } from "./oauth.ts"

export interface Loopback {
  redirectUri: string
  /** The authorization code from Google's redirect. */
  code: Promise<string>
}

const DONE = "You can close this tab and go back to the terminal."

/**
 * Listens on a random 127.0.0.1 port for a single sign-in redirect. Requests
 * without the matching `state` are ignored, so a stray or forged request can't
 * finish or cancel the sign-in.
 */
export async function startLoopback(
  state: string,
  timeoutMs = 5 * 60_000,
): Promise<Loopback> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const redirectUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  const code = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      server.close()
      server.closeAllConnections()
      reject(new OAuthError("timeout", "Sign-in timed out. Run it again."))
    }, timeoutMs)
    server.on("request", (request, response) => {
      const query = new URL(request.url ?? "/", redirectUri).searchParams
      const value = query.get("code")
      const error = query.get("error")
      const headers = { "content-type": "text/plain", connection: "close" }
      if (query.get("state") !== state || (!value && !error)) {
        response.writeHead(404, headers).end("Not found")
        return
      }
      // Also drop idle browser connections, so `login` exits right away.
      response.writeHead(200, headers).end(DONE, () => server.closeAllConnections())
      clearTimeout(timer)
      server.close()
      if (value) resolve(value)
      else reject(new OAuthError(error as string))
    })
  })
  return { redirectUri, code }
}
