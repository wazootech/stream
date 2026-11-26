import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import type { TestContext } from "node:test"
import { tokenProvider } from "./auth.ts"
import { SCOPE } from "./config.ts"
import { fakeFetch } from "./fake.ts"
import { readClient, readToken, SetupError, writeToken } from "./files.ts"
import { startLoopback } from "./loopback.ts"
import { signIn } from "./login.ts"
import { createPkce, OAuthError } from "./oauth.ts"

const client = { id: "client-id", secret: "client-secret" }
const granted = {
  access_token: "access",
  refresh_token: "refresh",
  expires_in: 3600,
  scope: SCOPE,
}

/** Plays the browser: follows the redirect back to the loopback listener. */
async function signInWith(reply: object, redirect = "code=the-code") {
  const { fetch, calls } = fakeFetch([reply])
  let consent = new URL("http://unset")
  const token = signIn({
    fetch,
    client,
    log: () => {},
    open: (url) => {
      consent = new URL(url)
      const back = consent.searchParams.get("redirect_uri")
      const state = consent.searchParams.get("state")
      void globalThis.fetch(`${back}/?${redirect}&state=${state}`)
    },
  })
  return { token: await token, calls, consent }
}

test("oauth: the PKCE challenge is the S256 hash of the verifier", () => {
  const { verifier, challenge } = createPkce()
  assert.match(verifier, /^[\w-]{43,128}$/)
  assert.equal(challenge, createHash("sha256").update(verifier).digest("base64url"))
})

test("oauth: signs in over loopback with PKCE and read-only scope", async () => {
  const { token, calls, consent } = await signInWith(granted)
  assert.equal(token.refreshToken, "refresh")
  const query = consent.searchParams
  assert.equal(query.get("scope"), SCOPE)
  assert.equal(query.get("code_challenge_method"), "S256")
  assert.equal(query.get("prompt"), "select_account consent")
  assert.match(query.get("redirect_uri") ?? "", /^http:\/\/127\.0\.0\.1:\d+$/)
  assert.equal(consent.href.includes(client.secret), false)

  const form = calls[0].init?.body as URLSearchParams
  assert.equal(form.get("code"), "the-code")
  assert.equal(form.get("redirect_uri"), query.get("redirect_uri"))
  const hash = createHash("sha256").update(form.get("code_verifier") ?? "")
  assert.equal(hash.digest("base64url"), query.get("code_challenge"))
})

test("oauth: a denied consent or a missing scope fails", async () => {
  await assert.rejects(signInWith(granted, "error=access_denied"), /access_denied/)
  await assert.rejects(signInWith({ ...granted, scope: "email" }), /read-only/)
})

test("loopback: requests without the right state are ignored", async () => {
  const { redirectUri, code } = await startLoopback("expected")
  const forged = await fetch(`${redirectUri}/?code=evil&state=wrong`)
  assert.equal(forged.status, 404)
  assert.equal((await fetch(`${redirectUri}/favicon.ico`)).status, 404)
  const real = await fetch(`${redirectUri}/?code=good&state=expected`)
  assert.equal(real.status, 200)
  assert.equal(await code, "good")
})

test("loopback: gives up after the timeout", async () => {
  const { code } = await startLoopback("state", 20)
  await assert.rejects(code, /timed out/)
})

function tempFile(t: TestContext, name: string, text?: string): string {
  const dir = mkdtempSync(join(tmpdir(), "stream-youtube-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, name)
  if (text !== undefined) writeFileSync(path, text)
  return path
}

test("files: reads a Desktop client and rejects other shapes", (t) => {
  const installed = { client_id: "i", client_secret: "s" }
  const good = tempFile(t, "good.json", JSON.stringify({ installed }))
  assert.deepEqual(readClient(good), { id: "i", secret: "s" })
  const web = tempFile(t, "web.json", JSON.stringify({ web: installed }))
  assert.throws(() => readClient(web), /Desktop app/)
  assert.throws(() => readClient(tempFile(t, "missing.json")), SetupError)
})

test("files: a broken file's contents never reach the error", (t) => {
  const path = tempFile(t, "bad.json", "hunter2-secret {")
  assert.throws(
    () => readClient(path),
    (error: Error) => !error.message.includes("hunter2"),
  )
  assert.equal(readToken(path), null)
})

test("auth: reuses a fresh token and refreshes an old one", async (t) => {
  const tokenPath = tempFile(t, "token.json")
  writeToken(tokenPath, { accessToken: "a1", refreshToken: "r", expiresAt: 100_000 })
  const { fetch, calls } = fakeFetch([{ access_token: "a2", expires_in: 3600 }])
  let now = 0
  const accessToken = tokenProvider({ fetch, client, tokenPath, now: () => now })
  assert.equal(await accessToken(), "a1")
  now = 90_000
  assert.equal(await accessToken(), "a2")
  assert.equal(await accessToken(), "a2")
  assert.equal(calls.length, 1)
  assert.deepEqual(readToken(tokenPath), {
    accessToken: "a2",
    refreshToken: "r",
    expiresAt: 3_690_000,
  })
})

test("auth: a revoked sign-in reports invalid_grant only", async (t) => {
  const tokenPath = tempFile(t, "token.json")
  writeToken(tokenPath, { accessToken: "a", refreshToken: "r", expiresAt: 0 })
  const { fetch } = fakeFetch([[400, { error: "invalid_grant" }]])
  const accessToken = tokenProvider({ fetch, client, tokenPath })
  await assert.rejects(
    accessToken(),
    (error: OAuthError) => error.code === "invalid_grant",
  )
  const missing = tokenProvider({ fetch, client, tokenPath: tempFile(t, "none") })
  await assert.rejects(missing(), SetupError)
})
