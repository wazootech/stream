import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyCommand,
  defaultState,
  formatClock,
  loadState,
  remainingMs,
  saveState,
  statePaths,
  UsageError,
} from "./state.ts";

const NOW = 1_700_000_000_000;
const run = (argv: string[], state = defaultState()) =>
  applyCommand(state, argv, NOW);

test("tasks: add, complete, reopen, remove, clear", () => {
  let { state } = run(["task", "add", "ship", "the", "HUD"]);
  ({ state } = run(["task", "add", "write docs"], state));
  assert.deepEqual(state.tasks.map((t) => t.text), ["ship the HUD", "write docs"]);

  ({ state } = run(["task", "done", "1"], state));
  assert.equal(state.tasks[0].done, true);

  ({ state } = run(["task", "undo", "1"], state));
  assert.equal(state.tasks[0].done, false);

  ({ state } = run(["task", "rm", "1"], state));
  assert.deepEqual(state.tasks.map((t) => t.text), ["write docs"]);

  ({ state } = run(["task", "clear"], state));
  assert.deepEqual(state.tasks, []);
});

test("tasks: bad indexes are usage errors, not crashes", () => {
  assert.throws(() => run(["task", "done", "1"]), UsageError);
  const { state } = run(["task", "add", "x"]);
  assert.throws(() => run(["task", "done", "2"], state), UsageError);
  assert.throws(() => run(["task", "done", "abc"], state), UsageError);
});

test("timer: counts down from now and stops", () => {
  const { state } = run(["timer", "45", "Block", "1"]);
  assert.equal(state.timer?.label, "Block 1");
  assert.equal(state.timer?.durationMs, 45 * 60_000);
  assert.equal(remainingMs(state.timer, NOW), 45 * 60_000);
  assert.equal(remainingMs(state.timer, NOW + 46 * 60_000), 0);
  assert.equal(run(["timer", "stop"], state).state.timer, null);
});

test("timer: rejects non-positive and non-numeric minutes", () => {
  for (const bad of ["0", "-5", "soon"]) {
    assert.throws(() => run(["timer", bad]), UsageError);
  }
});

test("break defaults to five minutes", () => {
  const { state } = run(["break"]);
  assert.equal(state.timer?.label, "Break");
  assert.equal(state.timer?.durationMs, 5 * 60_000);
});

test("predictions: settle updates the score, needs one on the air", () => {
  assert.throws(() => run(["predict", "hit"]), UsageError);

  let { state } = run(["predict", "the", "test", "fails"]);
  assert.equal(state.predictions.current, "the test fails");
  ({ state } = run(["predict", "hit"], state));
  assert.deepEqual(state.predictions, { current: null, hits: 1, total: 1 });

  ({ state } = run(["predict", "it builds"], state));
  ({ state } = run(["predict", "miss"], state));
  assert.deepEqual(state.predictions, { current: null, hits: 1, total: 2 });
});

test("reset clears the session but keeps the title", () => {
  let { state } = run(["title", "Late Night"]);
  ({ state } = run(["goal", "ship it"], state));
  ({ state } = run(["reset"], state));
  assert.equal(state.title, "Late Night");
  assert.equal(state.goal, "");
});

test("unknown commands and missing text are usage errors", () => {
  assert.throws(() => run(["frobnicate"]), UsageError);
  assert.throws(() => run(["goal"]), UsageError);
});

test("formatClock rounds partial seconds up", () => {
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(1), "00:01");
  assert.equal(formatClock(90_000), "01:30");
});

test("saveState writes JSON for the CLI and a script for the overlays", () => {
  const dir = mkdtempSync(join(tmpdir(), "stream-state-"));
  try {
    const saved = saveState({ ...defaultState(), goal: "round trip" }, dir);
    assert.equal(loadState(dir).goal, "round trip");

    const js = readFileSync(statePaths(dir).js, "utf8");
    assert.match(js, /^window\.STREAM_STATE = /);
    const payload = JSON.parse(js.replace(/^window\.STREAM_STATE = /, "").replace(/;\s*$/, ""));
    assert.equal(payload.goal, "round trip");
    assert.equal(payload.updatedAt, saved.updatedAt);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
