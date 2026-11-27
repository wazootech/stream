import { parseArgs } from "node:util"
import { UsageError } from "../state.ts"

export const USAGE = `npm run youtube -- [command] [options]

  (no command)              Watch your channel and queue alert cards
  login                     Sign in again (for example, to switch channels)
  help                      Show this message

  --show-chat               Also show new chat messages on screen
  --chat-seconds <n>        Shortest gap between chat polls (default 10, min 5)
  --subscriber-seconds <n>  Gap between subscriber polls (default 60, min 30,
                            0 turns subscriber alerts off)`

export interface Options {
  command: "watch" | "login" | "help"
  chatMs: number
  subscriberMs: number
  showChat: boolean
}

function milliseconds(name: string, raw: string, min: number): number {
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds < min) {
    throw new UsageError(`--${name} must be at least ${min}, got "${raw}".`)
  }
  return seconds * 1000
}

function parse(argv: string[]) {
  try {
    return parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        "chat-seconds": { type: "string", default: "10" },
        "subscriber-seconds": { type: "string", default: "60" },
        help: { type: "boolean", short: "h" },
        "show-chat": { type: "boolean", default: false },
      },
    })
  } catch (error) {
    throw new UsageError(`${(error as Error).message}\n\n${USAGE}`)
  }
}

export function parseOptions(argv: string[]): Options {
  const { values, positionals } = parse(argv)
  const command = values.help ? "help" : (positionals[0] ?? "watch")
  const known = command === "watch" || command === "login" || command === "help"
  if (!known || positionals.length > 1) {
    throw new UsageError(`Unknown command.\n\n${USAGE}`)
  }
  const chat = values["chat-seconds"]
  const subscribers = values["subscriber-seconds"]
  return {
    command,
    showChat: values["show-chat"],
    chatMs: milliseconds("chat-seconds", chat, 5),
    subscriberMs:
      subscribers === "0" ? 0 : milliseconds("subscriber-seconds", subscribers, 30),
  }
}
