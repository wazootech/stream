// @ts-check
// Draws the recent chat lines. Viewer text only ever goes through textContent.
;(() => {
  const { $, watchState } = window.Session
  let drawn = ""

  /** @param {import("../src/state.ts").State | null} state */
  function render(state) {
    const lines = state?.chat ?? []
    const key = JSON.stringify(lines)
    if (key === drawn) return
    drawn = key
    const list = $("lines")
    list.replaceChildren()
    if (lines.length === 0) {
      const li = document.createElement("li")
      li.className = "empty"
      li.textContent = "Say hi in the YouTube chat."
      list.append(li)
    }
    for (const line of lines) {
      const li = document.createElement("li")
      const name = document.createElement("b")
      name.textContent = line.name
      li.append(name, document.createTextNode(line.text))
      list.append(li)
    }
  }

  watchState(render)
  render(null)
})()
