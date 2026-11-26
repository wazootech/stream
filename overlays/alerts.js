// @ts-check
// Plays YouTube alerts (subscribers, members, Super Chats) one at a time. New
// alerts arrive through the same state.js the other overlays poll. Everything is set
// with textContent, because names come from chat and must never be HTML.
;(() => {
  const { $, watchState } = window.Session
  const SHOW_MS = 6000
  const GAP_MS = 600

  /** @type {Record<import("../src/state.ts").AlertKind, string>} */
  const LABELS = {
    sub: "New subscriber",
    member: "New member",
    milestone: "Member milestone",
    gift: "Gifted memberships",
    superchat: "Super Chat",
    sticker: "Super Sticker",
    redirect: "Live Redirect",
  }

  /** @type {Set<number>} */
  const seen = new Set()
  /** @type {import("../src/state.ts").Alert[]} */
  const queue = []
  let firstLoad = true
  let playing = false

  function play() {
    if (playing) return
    const next = queue.shift()
    if (!next) return
    playing = true
    $("kind").textContent = LABELS[next.kind]
    $("name").textContent = next.name
    $("detail").textContent = next.detail
    $("alert").classList.add("show")
    setTimeout(() => {
      $("alert").classList.remove("show")
      setTimeout(() => {
        playing = false
        play()
      }, GAP_MS)
    }, SHOW_MS)
  }

  // Open alerts.html?demo=superchat (or any other kind) in a browser to preview
  // the design without touching state.
  const demo = new URLSearchParams(location.search).get("demo")
  if (demo !== null) {
    const kind = /** @type {import("../src/state.ts").AlertKind} */ (
      Object.hasOwn(LABELS, demo) ? demo : "sub"
    )
    /** @type {typeof LABELS} */
    const details = {
      sub: "",
      member: "Crew",
      milestone: "6 months, Crew: still here",
      gift: "5 memberships, Crew",
      superchat: "$5.00: great stream",
      sticker: "$2.00: a waving cat",
      redirect: "42 viewers",
    }
    const detail = details[kind]
    queue.push({ id: 0, kind, name: "ExampleViewer", detail, at: 0 })
    play()
    return
  }

  watchState((state) => {
    for (const alert of state?.alerts ?? []) {
      if (seen.has(alert.id)) continue
      seen.add(alert.id)
      // Alerts already in state when the page loads were played earlier, so a
      // reloaded source doesn't replay them.
      if (!firstLoad) queue.push(alert)
    }
    firstLoad = false
    play()
  })
})()
