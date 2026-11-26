import { createHash, randomBytes } from "node:crypto"
import { AUTH_URL, SCOPE, TOKEN_URL } from "./config.ts"
import type { Fetch } from "./config.ts"
import type { Client, Token } from "./files.ts"

/** Carries Google's error code, such as `invalid_grant`. Never a response body. */
export class OAuthError extends Error {
  code: string
  constructor(code: string, message = `Google sign-in failed: ${code}`) {
    super(message)
    this.code = code
  }
}

/** A one-time PKCE verifier and its S256 challenge. */
export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url")
  const challenge = createHash("sha256").update(verifier).digest("base64url")
  return { verifier, challenge }
}

export function authUrl(request: {
  clientId: string
  redirectUri: string
  challenge: string
  state: string
}): string {
  const query = new URLSearchParams({
    client_id: request.clientId,
    redirect_uri: request.redirectUri,
    response_type: "code",
    // Always offer the account and channel chooser: a second sign-in is usually
    // someone fixing a wrong pick, and Google would otherwise reuse the old one.
    prompt: "select_account consent",
    scope: SCOPE,
    code_challenge: request.challenge,
    code_challenge_method: "S256",
    state: request.state,
  })
  return `${AUTH_URL}?${query}`
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
}

async function tokenRequest(
  fetch: Fetch,
  client: Client,
  grant: Record<string, string>,
): Promise<TokenResponse & { access_token: string }> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: client.id,
      client_secret: client.secret,
      ...grant,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  const body = (await response.json().catch(() => ({}))) as TokenResponse
  if (!response.ok || !body.access_token) {
    throw new OAuthError(body.error ?? `http_${response.status}`)
  }
  return { ...body, access_token: body.access_token }
}

const expiry = (body: TokenResponse, now: number) => now + (body.expires_in ?? 0) * 1000

export async function exchangeCode(
  fetch: Fetch,
  client: Client,
  grant: { code: string; verifier: string; redirectUri: string },
  now = Date.now(),
): Promise<Token> {
  const body = await tokenRequest(fetch, client, {
    grant_type: "authorization_code",
    code: grant.code,
    code_verifier: grant.verifier,
    redirect_uri: grant.redirectUri,
  })
  if (!body.scope?.split(" ").includes(SCOPE)) {
    throw new OAuthError("scope_denied", "Sign-in didn't grant read-only access.")
  }
  if (!body.refresh_token) throw new OAuthError("no_refresh_token")
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: expiry(body, now),
  }
}

export async function refresh(
  fetch: Fetch,
  client: Client,
  token: Token,
  now = Date.now(),
): Promise<Token> {
  const body = await tokenRequest(fetch, client, {
    grant_type: "refresh_token",
    refresh_token: token.refreshToken,
  })
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? token.refreshToken,
    expiresAt: expiry(body, now),
  }
}
