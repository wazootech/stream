import { homedir } from "node:os"
import { join } from "node:path"

/** The only scope the bridge asks for: it never writes to the channel. */
export const SCOPE = "https://www.googleapis.com/auth/youtube.readonly"
export const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
export const TOKEN_URL = "https://oauth2.googleapis.com/token"
export const API_BASE = "https://www.googleapis.com/youtube/v3/"

/** Injected everywhere the bridge talks to Google, so tests never do. */
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>

/** Credentials live in the home directory, never in this public repo. */
export function configPaths(dir = join(homedir(), ".config", "wazoo-stream")): {
  client: string
  token: string
} {
  return {
    client: join(dir, "youtube-client.json"),
    token: join(dir, "youtube-token.json"),
  }
}
