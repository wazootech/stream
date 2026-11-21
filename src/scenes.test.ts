import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSceneCollection } from "./scenes.ts";

const collection = buildSceneCollection({ overlaysDir: "/work/stream/overlays" });
const byName = new Map(collection.sources.map((s) => [s.name as string, s]));

test("the collection survives a JSON round trip", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(collection)), collection);
});

test("every scene in scene_order exists and is a scene", () => {
  assert.deepEqual(collection.scene_order.map((s) => s.name), [
    "Starting Soon",
    "Lab",
    "Focus",
    "Lab Break",
    "Ending",
  ]);
  for (const { name } of collection.scene_order) {
    assert.equal(byName.get(name)?.id, "scene", name);
  }
  assert.equal(collection.current_scene, "Starting Soon");
});

test("every scene item points at a real source, with unique ids per scene", () => {
  const uuids = new Set(collection.sources.map((s) => s.uuid));
  assert.equal(uuids.size, collection.sources.length, "source uuids are unique");

  for (const { name } of collection.scene_order) {
    const { items, id_counter } = byName.get(name)!.settings as {
      items: { source_uuid: string; name: string; id: number }[];
      id_counter: number;
    };
    assert.ok(items.length > 0, `${name} has items`);
    assert.equal(id_counter, items.length);
    assert.equal(new Set(items.map((i) => i.id)).size, items.length);
    for (const item of items) {
      assert.ok(uuids.has(item.source_uuid), `${name} -> ${item.name}`);
      assert.equal(byName.get(item.name)?.uuid, item.source_uuid);
    }
  }
});

test("browser sources are file:// pages under the overlays directory", () => {
  const browsers = collection.sources.filter((s) => s.id === "browser_source");
  assert.equal(browsers.length, 5);
  for (const b of browsers) {
    const { url } = b.settings as { url: string };
    // Windows resolves "/work" to "C:/work", so don't pin the drive prefix.
    assert.match(url, /^file:\/\/\/(?:[A-Za-z]:\/)?work\/stream\/overlays\/(hud|screen)\.html\?/);
  }
});

test("the mic is live and filtered, desktop audio sits under it", () => {
  const mic = collection.AuxAudioDevice1 as {
    muted: boolean;
    volume: number;
    filters: { id: string }[];
  };
  const desktop = collection.DesktopAudioDevice1 as { volume: number };
  assert.equal(mic.muted, false);
  assert.deepEqual(mic.filters.map((f) => f.id), [
    "noise_suppress_filter_v2",
    "compressor_filter",
    "limiter_filter",
  ]);
  assert.ok(desktop.volume < mic.volume);
});
