import assert from "node:assert/strict"
import { test } from "node:test"
import { buildSceneCollection } from "./scenes.ts"

const collection = buildSceneCollection({ overlaysDir: "/work/stream/overlays" })
const byName = new Map(collection.sources.map((s) => [s.name as string, s]))

test("the collection survives a JSON round trip", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(collection)), collection)
})

test("every scene in scene_order exists and is a scene", () => {
  assert.deepEqual(
    collection.scene_order.map((s) => s.name),
    [
      "Starting Soon",
      "Main",
      "Focus",
      "Focus + Cam",
      "Main + Game",
      "Game Focus",
      "Break",
    ],
  )
  for (const { name } of collection.scene_order) {
    assert.equal(byName.get(name)?.id, "scene", name)
  }
  assert.equal(collection.current_scene, "Starting Soon")
})

test("every scene item points at a real source, with unique ids per scene", () => {
  const uuids = new Set(collection.sources.map((s) => s.uuid))
  assert.equal(uuids.size, collection.sources.length, "source uuids are unique")

  for (const { name } of collection.scene_order) {
    const { items, id_counter } = byName.get(name)!.settings as {
      items: { source_uuid: string; name: string; id: number }[]
      id_counter: number
    }
    assert.ok(items.length > 0, `${name} has items`)
    assert.equal(id_counter, items.length)
    assert.equal(new Set(items.map((i) => i.id)).size, items.length)
    for (const item of items) {
      assert.ok(uuids.has(item.source_uuid), `${name} -> ${item.name}`)
      assert.equal(byName.get(item.name)?.uuid, item.source_uuid)
    }
  }
})

test("browser sources are file:// pages under the overlays directory", () => {
  const browsers = collection.sources.filter((s) => s.id === "browser_source")
  assert.equal(browsers.length, 7)
  for (const b of browsers) {
    const { url } = b.settings as { url: string }
    // Windows resolves "/work" to "C:/work", so don't pin the drive prefix.
    assert.match(
      url,
      /^file:\/\/\/(?:[A-Za-z]:\/)?work\/stream\/overlays\/(hud|screen|alerts|chat)\.html(?:\?|$)/,
    )
  }
})

test("the Alerts layer is on top of every scene", () => {
  for (const { name } of collection.scene_order) {
    const { items } = byName.get(name)!.settings as { items: { name: string }[] }
    assert.equal(items.at(-1)?.name, "Alerts", name)
  }
})

test("music plays only on Starting Soon and Break, on track 1 only", () => {
  const withMusic = collection.scene_order
    .map(({ name }) => name)
    .filter((name) => {
      const { items } = byName.get(name)!.settings as { items: { name: string }[] }
      return items.some((i) => i.name === "Music")
    })
  assert.deepEqual(withMusic, ["Starting Soon", "Break"])

  const music = byName.get("Music") as { mixers: number; volume: number }
  assert.equal(music.mixers, 1, "track 1 only keeps track 2 music-free")
  assert.ok(music.volume < 0.5)
})

test("the backdrop hides the Music source, so cover art never shows", () => {
  for (const name of ["Starting Soon", "Break"]) {
    const { items } = byName.get(name)!.settings as { items: { name: string }[] }
    const order = items.map((i) => i.name)
    assert.ok(order.indexOf("Music") < order.indexOf("Backdrop"), name)
  }
})

const itemNames = (scene: string) =>
  (byName.get(scene)!.settings as { items: { name: string }[] }).items.map(
    (item) => item.name,
  )

test("Focus + Cam is Focus with the camera on top", () => {
  assert.deepEqual(itemNames("Focus + Cam"), [
    ...itemNames("Focus").slice(0, -1),
    "Webcam",
    "Alerts",
  ])
})

test("Game Focus shows the second screen, not the main one", () => {
  const names = itemNames("Game Focus")
  assert.ok(names.includes("Game Screen"))
  assert.ok(!names.includes("Display"))
  assert.equal(byName.get("Game Screen")!.id, "monitor_capture")
})

test("Main + Game is Main plus the game, without covering the main screen", () => {
  const names = itemNames("Main + Game").map((n) => (n === "Chat Small" ? "Chat" : n))
  assert.deepEqual(
    names.filter((name) => name !== "Game Screen"),
    itemNames("Main"),
  )
  const { items } = byName.get("Main + Game")!.settings as {
    items: { name: string; pos: { x: number }; bounds: { x: number } }[]
  }
  const display = items.find((item) => item.name === "Display")!
  const game = items.find((item) => item.name === "Game Screen")!
  assert.ok(display.pos.x + display.bounds.x <= game.pos.x)
})

test("chat is on every scene except the focus ones", () => {
  for (const { name } of collection.scene_order) {
    const hasChat = itemNames(name).some((item) => item.startsWith("Chat"))
    assert.equal(hasChat, !name.includes("Focus"), name)
  }
})
