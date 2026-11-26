import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

/** The OAuth client downloaded from Google Cloud. */
export interface Client {
  id: string
  secret: string
}

export interface Token {
  refreshToken: string
  accessToken: string
  /** Epoch milliseconds when the access token stops working. */
  expiresAt: number
}

/** Something the owner has to fix: a missing file, or a sign-in that's needed. */
export class SetupError extends Error {}

// Errors from here never echo file contents. JSON.parse quotes the text it
// chokes on, which for these files would print a secret.
function readJson(path: string, what: string): unknown {
  let text: string
  try {
    text = readFileSync(path, "utf8")
  } catch {
    throw new SetupError(`Cannot read the ${what} at ${path}. See docs/alerts.md.`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new SetupError(`The ${what} at ${path} is not valid JSON.`)
  }
}

export function readClient(path: string): Client {
  const file = readJson(path, "OAuth client file") as {
    installed?: { client_id?: unknown; client_secret?: unknown }
  } | null
  const { client_id: id, client_secret: secret } = file?.installed ?? {}
  if (typeof id !== "string" || typeof secret !== "string") {
    throw new SetupError(
      `${path} is not a "Desktop app" OAuth client file. See docs/alerts.md.`,
    )
  }
  return { id, secret }
}

/** The stored sign-in, or null when there isn't a usable one. */
export function readToken(path: string): Token | null {
  try {
    const token = readJson(path, "token file") as Partial<Token> | null
    return token?.refreshToken ? (token as Token) : null
  } catch (error) {
    if (error instanceof SetupError) return null
    throw error
  }
}

/** Writes through a temp file, readable by this user only where the OS allows. */
export function writeToken(path: string, token: Token): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temp = `${path}.tmp`
  writeFileSync(temp, JSON.stringify(token, null, 2) + "\n", { mode: 0o600 })
  renameSync(temp, path)
}
