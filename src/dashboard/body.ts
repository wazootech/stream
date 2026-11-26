import type { IncomingMessage } from "node:http"
import { HttpError } from "./guard.ts"

/** Far more than any command needs. */
export const MAX_BODY_BYTES = 4096

/** Reads a request body, refusing it as soon as it passes the cap. */
export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const tooLarge = () => new HttpError(413, "Request body is too large.")
    if (Number(req.headers["content-length"] ?? 0) > MAX_BODY_BYTES) {
      reject(tooLarge())
      return
    }
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size <= MAX_BODY_BYTES) chunks.push(chunk)
      else reject(tooLarge())
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", () => reject(new HttpError(400, "Request was interrupted.")))
  })
}
