import { UsageError } from "../state.ts"
import { ApiError, createApi } from "./api.ts"
import type { Api } from "./api.ts"
import { tokenProvider } from "./auth.ts"
import { runBridge } from "./bridge.ts"
import { chatSource } from "./chat.ts"
import { configPaths } from "./config.ts"
import { readClient, SetupError, writeToken } from "./files.ts"
import { signIn } from "./login.ts"
import { OAuthError } from "./oauth.ts"
import { parseOptions, USAGE } from "./options.ts"
import type { Options } from "./options.ts"
import { queueCards } from "./queue.ts"
import { subscriberSource } from "./subscribers.ts"

/** Signs in when asked to, or when there's no sign-in that still works. */
async function connect(forceLogin: boolean): Promise<Api> {
  const paths = configPaths()
  const client = readClient(paths.client)
  const accessToken = tokenProvider({ fetch, client, tokenPath: paths.token })
  const login = async () => {
    writeToken(paths.token, await signIn({ fetch, client }))
    console.log(`Signed in. The token is saved at ${paths.token}`)
  }
  if (forceLogin) await login()
  else {
    try {
      await accessToken()
    } catch (error) {
      const expired = error instanceof OAuthError && error.code === "invalid_grant"
      if (!expired && !(error instanceof SetupError)) throw error
      await login()
    }
  }
  return createApi(fetch, accessToken)
}

/** Names the signed-in channel, so picking the wrong one shows up right away. */
async function channelName(api: Api): Promise<string> {
  const { items } = await api.get<{ items?: { snippet?: { title?: string } }[] }>(
    "channels",
    { part: "snippet", mine: "true" },
  )
  const title = items?.[0]?.snippet?.title
  if (title) return title
  throw new SetupError("That sign-in has no channel. Run login and pick yours.")
}

async function watch(api: Api, { chatMs, subscriberMs }: Options): Promise<void> {
  const since = Date.now()
  const log = console.log
  const sources = [chatSource({ api, since, minMs: chatMs, log })]
  if (subscriberMs > 0) {
    sources.push(subscriberSource({ api, since, everyMs: subscriberMs }))
  }
  const report = () => log(`About ${api.unitsUsed()} quota units used.`)
  process.once("SIGINT", () => {
    report()
    process.exit(0)
  })
  log("Watching for new events. Ctrl+C to stop.")
  try {
    await runBridge({ sources, emit: (cards) => queueCards(cards) })
  } finally {
    report()
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  if (options.command === "help") return console.log(USAGE)
  const api = await connect(options.command === "login")
  console.log(`Channel: ${await channelName(api)}`)
  if (options.command === "watch") await watch(api, options)
}

main().catch((error: unknown) => {
  const expected = [SetupError, OAuthError, UsageError, ApiError]
  // Anything unexpected keeps its stack; known problems get one plain line.
  const known = expected.some((type) => error instanceof type)
  console.error(known ? (error as Error).message : error)
  if (error instanceof ApiError && error.reason === "quotaExceeded") {
    console.error("The daily quota is spent. It resets at midnight Pacific Time.")
  }
  process.exitCode = 1
})
