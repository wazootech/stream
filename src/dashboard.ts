import { parseArgs } from "node:util"
import { createDashboardServer, listenLocal } from "./dashboard/server.ts"

const DEFAULT_PORT = "4747"

const { values } = parseArgs({
  options: { port: { type: "string", default: DEFAULT_PORT } },
})
const port = Number(values.port)

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error(`Expected a port from 1024 to 65535, got "${values.port}".`)
  process.exitCode = 1
} else {
  try {
    await listenLocal(createDashboardServer(), port)
    console.log(
      `Stream dashboard: http://127.0.0.1:${port}/\n` +
        `Add that URL in OBS under Docks > Custom Browser Docks. Ctrl+C stops it.`,
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error
    console.error(`Port ${port} is in use. Pick another with --port <n>.`)
    process.exitCode = 1
  }
}
