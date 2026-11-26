import type { ServerResponse } from "node:http"

const HEADERS = {
  "Cache-Control": "no-store",
  // No inline code, no outside requests, and no framing (clickjacking).
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
}

export function send(
  res: ServerResponse,
  status: number,
  type: string,
  body: string | Buffer,
): void {
  // After a refusal, drop the connection so an unread body isn't left on it.
  const close: Record<string, string> = status >= 400 ? { Connection: "close" } : {}
  res.writeHead(status, { ...HEADERS, ...close, "Content-Type": type })
  res.end(body)
}

export function sendJson(res: ServerResponse, status: number, value: unknown): void {
  send(res, status, "application/json; charset=utf-8", JSON.stringify(value))
}
