import { applyCommand, describe } from "../commands.ts"
import { loadState, saveState } from "../state.ts"
import type { State } from "../state.ts"
import { HttpError } from "./guard.ts"

const MAX_ARGS = 8

export interface Snapshot {
  state: State
  /** The same text `session status` prints. */
  status: string
}

export interface CommandRequest {
  /** The words that would follow `npm run session --`. */
  argv: string[]
  /** For `task done|undo|rm <n>`: the text the page shows at that number. */
  expect?: string
}

export type CommandResponse = Snapshot & { message: string }

export function snapshot(stateDir: string): Snapshot {
  const state = loadState(stateDir)
  return { state, status: describe(state) }
}

export function parseRequest(raw: string): CommandRequest {
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    throw new HttpError(400, "Body is not valid JSON.")
  }
  const { argv, expect } = (body ?? {}) as Record<string, unknown>
  if (
    !Array.isArray(argv) ||
    argv.length === 0 ||
    argv.length > MAX_ARGS ||
    !argv.every((word) => typeof word === "string")
  ) {
    throw new HttpError(400, `Expected "argv" with 1 to ${MAX_ARGS} strings.`)
  }
  if (expect !== undefined && typeof expect !== "string") {
    throw new HttpError(400, `Expected "expect" to be a string.`)
  }
  return { argv, expect }
}

/** Runs one session command through the CLI's reducer and saves the result. */
export function runCommand(
  { argv, expect }: CommandRequest,
  stateDir: string,
): CommandResponse {
  const current = loadState(stateDir)
  // The terminal can renumber tasks between two refreshes of the page.
  if (expect !== undefined && current.tasks[Number(argv[2]) - 1]?.text !== expect) {
    throw new HttpError(409, "The task list changed. Check it and try again.")
  }
  const { state, message } = applyCommand(current, argv)
  const next = argv[0] === "status" ? state : saveState(state, stateDir)
  return { state: next, status: describe(next), message }
}
