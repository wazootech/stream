// @ts-check
// Plays follow, sub, gift, raid, and cheer alerts one at a time. New alerts
// arrive through the same state.js the other overlays poll. Everything is set
// with textContent, because names come from chat and must never be HTML.
;(() => {
  const { $, watchState } = window.Session
  const SHOW_MS = 6000
  const GAP_MS = 600

  /** @type {Record<import("../src/state.ts").AlertKind, string>} */
  const LABELS = {
    follow: "New follower",
    sub: "New subscriber",
    gift: "Gifted subs",
    raid: "Incoming raid",
    cheer: "Bits",
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

  // Open alerts.html?demo=raid (or follow, sub, gift, cheer) in a browser to
  // preview the design without touching state.
  const demo = new URLSearchParams(location.search).get("demo")
  if (demo !== null) {
    const kind = demo in LABELS ? demo : "follow"
    const samples = {
      follow: ["ExampleFollower", ""],
      sub: ["ExampleSubscriber", "Tier 1, 3 months"],
      gift: ["ExampleGifter", "5 subs"],
      raid: ["ExampleRaider", "42 viewers"],
      cheer: ["ExampleCheerer", "100 bits"],
    }
    const [name, detail] = samples[/** @type {keyof typeof samples} */ (kind)]
    queue.push({
      id: 0,
      kind: /** @type {import("../src/state.ts").AlertKind} */ (kind),
      name,
      detail,
      at: 0,
    })
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
