// Test harness: a dashboard on a free port with a throwaway state directory.
// Uses node:http because fetch won't let a test forge Host.
import { mkdtempSync, rmSync } from "node:fs"
import { request } from "node:http"
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { TestContext } from "node:test"
import { createDashboardServer, listenLocal } from "./server.ts"

export interface Reply {
  status: number
  headers: IncomingHttpHeaders
  text: string
}

export interface Send {
  method?: string
  path?: string
  headers?: OutgoingHttpHeaders
  body?: string
}

export async function startDashboard(t: TestContext) {
  const stateDir = mkdtempSync(join(tmpdir(), "stream-dashboard-"))
  const server = createDashboardServer({ stateDir })
  const address = await listenLocal(server, 0)
  t.after(() => {
    server.closeAllConnections()
    server.close()
    rmSync(stateDir, { recursive: true, force: true })
  })
  const host = `127.0.0.1:${address.port}`

  const send = ({ method = "GET", path = "/", headers, body }: Send = {}) =>
    new Promise<Reply>((resolve, reject) => {
      const options = { host: address.address, port: address.port, method, path }
      const req = request({ ...options, headers, agent: false }, (res) => {
        let text = ""
        res.setEncoding("utf8")
        res.on("data", (chunk: string) => (text += chunk))
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, headers: res.headers, text }),
        )
      })
      req.on("error", reject)
      req.end(body)
    })

  /** A well-formed same-origin command; `override` breaks one thing at a time. */
  const command = (payload: unknown, override: OutgoingHttpHeaders = {}) =>
    send({
      method: "POST",
      path: "/api/command",
      headers: {
        origin: `http://${host}`,
        "content-type": "application/json",
        ...override,
      },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    })

  return { stateDir, address, host, send, command }
}
