// @ts-check
// Buttons carry their session command in data-command; forms append their inputs.
import { getState, postCommand } from "./api.js"
import { wireConfirms } from "./confirm.js"
import { show } from "./view.js"

const POLL_MS = 2000
let commands = 0
/** Whether the message bar should announce the next successful refresh. */
let reconnecting = true

/**
 * @param {string} text
 * @param {boolean} [isError]
 */
function say(text, isError = false) {
  const node = window.Session.$("message")
  node.textContent = text
  node.classList.toggle("error", isError)
}

/** @param {unknown} error */
function complain(error) {
  say(error instanceof Error ? error.message : String(error), true)
}

/**
 * @param {string[]} argv
 * @param {string} [expect]
 */
async function run(argv, expect) {
  try {
    const result = await postCommand(argv, expect)
    commands++
    show(result, run)
    say(result.message)
    return true
  } catch (error) {
    complain(error)
    return false
  }
}

async function poll() {
  const seen = commands
  try {
    const snapshot = await getState()
    if (reconnecting) say("Connected.")
    reconnecting = false
    // A command that finished meanwhile already showed newer state.
    if (seen === commands) show(snapshot, run)
  } catch (error) {
    reconnecting = true
    complain(error)
  }
  setTimeout(poll, POLL_MS)
}

/** @param {HTMLFormElement} form */
async function submit(form) {
  const sent = [...form.querySelectorAll("input")].map((input) => ({
    input,
    value: input.value,
  }))
  const words = sent.map(({ value }) => value.trim()).filter(Boolean)
  if (words.length === 0) return say("Type something first.", true)
  const typed = words.join(" ")
  if (form.dataset.reserved?.split(" ").includes(typed)) {
    return say(`"${typed}" is a command word. Use its button instead.`, true)
  }
  const command = (form.dataset.command ?? "").split(" ")
  if (!(await run([...command, ...words]))) return
  // Clear only what was sent: anything typed while it was saving stays.
  for (const { input, value } of sent) {
    if (input.value === value) input.value = input.defaultValue
  }
}

for (const button of document.querySelectorAll("button[data-command]")) {
  const argv = (button.getAttribute("data-command") ?? "").split(" ")
  button.addEventListener("click", () => run(argv))
}

for (const form of document.querySelectorAll("form")) {
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    submit(form)
  })
}

wireConfirms()
poll()
