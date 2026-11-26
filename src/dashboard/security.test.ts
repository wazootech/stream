import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { statePaths } from "../state.ts"
import { MAX_BODY_BYTES } from "./body.ts"
import { ASSETS, readAsset } from "./static.ts"
import { startDashboard } from "./testing.ts"

const GOAL = { argv: ["goal", "hijacked"] }

test("listens on loopback only", async (t) => {
  const { address } = await startDashboard(t)
  assert.equal(address.address, "127.0.0.1")
})

test("accepts 127.0.0.1 and localhost as Host", async (t) => {
  const { send, address } = await startDashboard(t)
  for (const host of [`127.0.0.1:${address.port}`, `localhost:${address.port}`]) {
    assert.equal((await send({ headers: { host } })).status, 200, host)
  }
})

test("rejects any other Host, on reads and writes (DNS rebinding)", async (t) => {
  const { send, command, address, stateDir } = await startDashboard(t)
  const port = address.port
  const hosts = [
    `evil.example:${port}`,
    `127.0.0.1.evil.example:${port}`,
    `localhost.:${port}`,
    `127.0.0.1:${port + 1}`,
    "127.0.0.1",
    `[::1]:${port}`,
  ]
  for (const host of hosts) {
    for (const path of ["/", "/api/state"]) {
      assert.equal((await send({ path, headers: { host } })).status, 403, host)
    }
    const reply = await command(GOAL, { host, origin: `http://${host}` })
    assert.equal(reply.status, 403, host)
  }
  assert.equal(existsSync(statePaths(stateDir).json), false)
})

test("rejects writes without a matching Origin", async (t) => {
  const { command, send, address, stateDir } = await startDashboard(t)
  const origins = [
    "http://evil.example",
    "null",
    `https://127.0.0.1:${address.port}`,
    `http://127.0.0.1:${address.port + 1}`,
    `http://localhost:${address.port}`, // does not match the 127.0.0.1 Host
  ]
  for (const origin of origins) {
    assert.equal((await command(GOAL, { origin })).status, 403, origin)
  }
  const missing = await send({
    method: "POST",
    path: "/api/command",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(GOAL),
  })
  assert.equal(missing.status, 403)
  assert.equal(existsSync(statePaths(stateDir).json), false)
})

test("rejects writes that are not JSON requests", async (t) => {
  const { command, stateDir } = await startDashboard(t)
  const types = [
    "text/plain",
    "application/x-www-form-urlencoded",
    "multipart/form-data; boundary=x",
    "application/jsonp",
    "",
  ]
  for (const type of types) {
    const reply = await command(GOAL, { "content-type": type })
    assert.equal(reply.status, 415, type)
  }
  assert.equal(existsSync(statePaths(stateDir).json), false)

  const charset = { "content-type": "Application/JSON; charset=utf-8" }
  assert.equal((await command(GOAL, charset)).status, 200)
})

test("caps the body, declared or streamed", async (t) => {
  const { command, stateDir } = await startDashboard(t)
  const huge = JSON.stringify({ argv: ["goal", "x".repeat(MAX_BODY_BYTES)] })
  assert.equal((await command(huge)).status, 413)
  const chunked = await command(huge, { "transfer-encoding": "chunked" })
  assert.equal(chunked.status, 413)
  assert.equal(existsSync(statePaths(stateDir).json), false)
})

test("only GET reads and only POST writes; preflights get no CORS", async (t) => {
  const { send, stateDir } = await startDashboard(t)
  const preflight = await send({
    method: "OPTIONS",
    path: "/api/command",
    headers: { origin: "http://evil.example" },
  })
  assert.equal(preflight.status, 405)
  assert.equal(preflight.headers["access-control-allow-origin"], undefined)
  assert.equal((await send({ path: "/api/command" })).status, 405)
  assert.equal((await send({ method: "POST", path: "/api/state" })).status, 405)
  assert.equal(existsSync(statePaths(stateDir).json), false)
})

test("serves only listed files, with headers that block framing", async (t) => {
  const { send } = await startDashboard(t)
  for (const path of ASSETS.keys()) {
    const reply = await send({ path })
    assert.equal(reply.status, 200, path)
    assert.match(String(reply.headers["content-security-policy"]), /frame-ancestors/)
    assert.equal(reply.headers["x-content-type-options"], "nosniff")
  }
  for (const path of ["/../package.json", "/%2e%2e/package.json", "/state.json"]) {
    assert.equal((await send({ path })).status, 404, path)
  }
})

test("the page never builds HTML from text and has no dialogs", () => {
  for (const path of ASSETS.keys()) {
    const body = readAsset(path)?.body.toString("utf8") ?? ""
    assert.doesNotMatch(body, /innerHTML|outerHTML|insertAdjacentHTML/, path)
    assert.doesNotMatch(body, /\b(alert|confirm|prompt)\(/, path)
  }
  const server = readFileSync(new URL("./server.ts", import.meta.url), "utf8")
  assert.doesNotMatch(server, /child_process/)
})
