import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import type { Fetch } from "./config.ts"
import type { Client, Token } from "./files.ts"
import { startLoopback } from "./loopback.ts"
import { authUrl, createPkce, exchangeCode } from "./oauth.ts"

/** Opens the system browser without a shell, so the URL needs no escaping. */
export function openBrowser(url: string): void {
  const opener = process.platform === "darwin" ? "open" : "xdg-open"
  const [command, args] =
    process.platform === "win32"
      ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
      : [opener, [url]]
  spawn(command, args, { stdio: "ignore", detached: true })
    .on("error", () => {}) // The URL is also printed, so this isn't fatal.
    .unref()
}

/** The installed-app flow: browser consent, loopback redirect, PKCE exchange. */
export async function signIn(options: {
  fetch: Fetch
  client: Client
  open?: (url: string) => void
  log?: (line: string) => void
}): Promise<Token> {
  const { fetch, client, open = openBrowser, log = console.log } = options
  const { verifier, challenge } = createPkce()
  const state = randomBytes(16).toString("base64url")
  const { redirectUri, code } = await startLoopback(state)
  const url = authUrl({ clientId: client.id, redirectUri, challenge, state })
  log(`Sign in and pick your channel. If no browser opens, visit:\n${url}\n`)
  open(url)
  return exchangeCode(fetch, client, { code: await code, verifier, redirectUri })
}
