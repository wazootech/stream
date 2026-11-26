// @ts-check
// Two-step buttons. Cancel appears where the first button was, so a double click
// backs out instead of confirming.

const DISARM_MS = 6000

/** @param {Element} box */
function wire(box) {
  const arm = /** @type {HTMLButtonElement} */ (box.querySelector("[data-arm]"))
  const armed = /** @type {HTMLElement} */ (box.querySelector("[data-armed]"))
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout

  /** @param {boolean} on */
  const set = (on) => {
    clearTimeout(timeout)
    arm.hidden = on
    armed.hidden = !on
    if (on) timeout = setTimeout(() => set(false), DISARM_MS)
  }

  arm.addEventListener("click", () => {
    set(true)
    armed.querySelector("button")?.focus()
  })
  // Both Cancel and Confirm put the first button back.
  armed.addEventListener("click", () => set(false))
}

export function wireConfirms() {
  document.querySelectorAll(".confirm").forEach(wire)
}
