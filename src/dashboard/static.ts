import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

const HTML = "text/html; charset=utf-8"
const CSS = "text/css; charset=utf-8"
const JS = "text/javascript; charset=utf-8"

/** Everything the server serves from disk. Request paths are never joined. */
export const ASSETS = new Map<string, [file: string, type: string]>([
  ["/", ["dashboard/index.html", HTML]],
  ["/dashboard.css", ["dashboard/dashboard.css", CSS]],
  ["/api.js", ["dashboard/api.js", JS]],
  ["/app.js", ["dashboard/app.js", JS]],
  ["/confirm.js", ["dashboard/confirm.js", JS]],
  ["/tasks.js", ["dashboard/tasks.js", JS]],
  ["/view.js", ["dashboard/view.js", JS]],
  // Shared with the overlays: the palette and the clock helpers.
  ["/session.css", ["overlays/session.css", CSS]],
  ["/session.js", ["overlays/session.js", JS]],
])

export function readAsset(path: string): { type: string; body: Buffer } | null {
  const asset = ASSETS.get(path)
  if (!asset) return null
  const [file, type] = asset
  return { type, body: readFileSync(join(root, file)) }
}
