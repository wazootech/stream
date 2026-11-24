import {
  applyCommand,
  describe,
  loadState,
  saveState,
  UsageError,
  USAGE,
} from "./state.ts"

const argv = process.argv.slice(2)

if (argv[0] === "help" || argv[0] === "--help" || argv[0] === "-h") {
  console.log(USAGE)
} else {
  try {
    const { state, message } = applyCommand(loadState(), argv)
    const readOnly = argv[0] === "status" || argv.length === 0
    if (readOnly) {
      console.log(message)
    } else {
      const saved = saveState(state)
      console.log(`${message}\n\n${describe(saved)}`)
    }
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(error.message)
      process.exitCode = 1
    } else {
      throw error
    }
  }
}
