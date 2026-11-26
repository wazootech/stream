// @ts-check
// The checklist. Task text goes in through textContent only.

/** @typedef {import("../src/state.ts").Task} Task */
/** @typedef {(argv: string[], expect?: string) => void} Run */

/**
 * @param {string} text
 * @param {string} className
 * @param {() => void} onClick
 */
function button(text, className, onClick) {
  const node = document.createElement("button")
  node.type = "button"
  node.className = className
  node.textContent = text
  node.addEventListener("click", onClick)
  return node
}

/**
 * @param {Task} task
 * @param {number} n The task number the CLI uses, starting at 1.
 * @param {Run} run
 */
function row(task, n, run) {
  const li = document.createElement("li")
  li.className = task.done ? "done" : ""
  const verb = task.done ? "undo" : "done"
  const toggle = button(task.text, "toggle", () =>
    run(["task", verb, String(n)], task.text),
  )
  toggle.title = task.done ? "Reopen" : "Mark done"
  const remove = button("x", "remove", () => run(["task", "rm", String(n)], task.text))
  remove.setAttribute("aria-label", `Remove task ${n}`)
  li.append(toggle, remove)
  return li
}

/**
 * @param {HTMLElement} list
 * @param {Task[]} tasks
 * @param {Run} run
 */
export function renderTasks(list, tasks, run) {
  if (tasks.length === 0) {
    const li = document.createElement("li")
    li.className = "empty"
    li.textContent = "No tasks yet."
    list.replaceChildren(li)
    return
  }
  list.replaceChildren(...tasks.map((task, i) => row(task, i + 1, run)))
}
