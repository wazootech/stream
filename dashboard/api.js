// @ts-check
// Talks to the local dashboard server.

/** @typedef {import("../src/dashboard/api.ts").Snapshot} Snapshot */
/** @typedef {import("../src/dashboard/api.ts").CommandResponse} CommandResponse */

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function request(path, init) {
  let response
  try {
    response = await fetch(path, { ...init, signal: AbortSignal.timeout(5000) })
  } catch {
    throw new Error("The dashboard server is not responding. Is it still running?")
  }
  const body = await response.json()
  if (!response.ok) throw new Error(body.error)
  return body
}

/** @returns {Promise<Snapshot>} */
export function getState() {
  return request("/api/state")
}

/**
 * @param {string[]} argv
 * @param {string} [expect]
 * @returns {Promise<CommandResponse>}
 */
export function postCommand(argv, expect) {
  return request("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ argv, expect }),
  })
}
