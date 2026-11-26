import type { IncomingMessage } from "node:http"

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Blocks DNS rebinding: a hostile domain that resolves to 127.0.0.1 still sends
 * its own name in `Host`.
 */
export function checkHost(req: IncomingMessage): void {
  const port = req.socket.localPort
  const allowed = [`127.0.0.1:${port}`, `localhost:${port}`]
  if (!allowed.includes(req.headers.host ?? "")) {
    throw new HttpError(403, "Unexpected Host header.")
  }
}

export function checkMethod(req: IncomingMessage, method: "GET" | "POST"): void {
  if (req.method !== method) throw new HttpError(405, `Use ${method}.`)
}

/**
 * Stops other web pages from driving the dashboard. Browsers send `Origin` on
 * every POST, and a cross-origin page can't send JSON without a preflight, which
 * this server never approves. Call after `checkHost`.
 */
export function checkSameOrigin(req: IncomingMessage): void {
  if (req.headers.origin !== `http://${req.headers.host}`) {
    throw new HttpError(403, "Cross-origin request refused.")
  }
  const type = (req.headers["content-type"] ?? "").split(";")[0].trim()
  if (type.toLowerCase() !== "application/json") {
    throw new HttpError(415, "Send application/json.")
  }
}
