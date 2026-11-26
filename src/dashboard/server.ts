import { createServer } from "node:http"
import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { overlaysDir, UsageError } from "../state.ts"
import { parseRequest, runCommand, snapshot } from "./api.ts"
import { readBody } from "./body.ts"
import { checkHost, checkMethod, checkSameOrigin, HttpError } from "./guard.ts"
import { send, sendJson } from "./reply.ts"
import { readAsset } from "./static.ts"

/** The only address the dashboard listens on. It is deliberately not an option. */
export const LOOPBACK = "127.0.0.1"

async function handle(req: IncomingMessage, res: ServerResponse, stateDir: string) {
  checkHost(req)
  const path = (req.url ?? "").split("?")[0]
  if (path === "/api/command") {
    checkMethod(req, "POST")
    checkSameOrigin(req)
    const request = parseRequest(await readBody(req))
    return sendJson(res, 200, runCommand(request, stateDir))
  }
  checkMethod(req, "GET")
  if (path === "/api/state") return sendJson(res, 200, snapshot(stateDir))
  const asset = readAsset(path)
  if (!asset) throw new HttpError(404, "Not found.")
  send(res, 200, asset.type, asset.body)
}

function fail(res: ServerResponse, error: unknown) {
  if (error instanceof HttpError) {
    return sendJson(res, error.status, { error: error.message })
  }
  if (error instanceof UsageError) {
    return sendJson(res, 400, { error: error.message })
  }
  console.error(error)
  sendJson(res, 500, { error: "Something failed. Check the dashboard terminal." })
}

export function createDashboardServer({ stateDir = overlaysDir } = {}): Server {
  const server = createServer((req, res) => {
    handle(req, res, stateDir).catch((error: unknown) => fail(res, error))
  })
  server.requestTimeout = 10_000
  return server
}

/** Listens on loopback and resolves with the bound address. */
export function listenLocal(server: Server, port: number): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, LOOPBACK, () => {
      server.off("error", reject)
      resolve(server.address() as AddressInfo)
    })
  })
}
