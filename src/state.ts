import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Task {
  text: string;
  done: boolean;
}

export interface Timer {
  label: string;
  /** Epoch milliseconds when the countdown reaches zero. */
  endsAt: number;
  durationMs: number;
}

export interface Predictions {
  /** The prediction currently on the air, if any. */
  current: string | null;
  hits: number;
  total: number;
}

export interface State {
  title: string;
  goal: string;
  tasks: Task[];
  timer: Timer | null;
  predictions: Predictions;
  updatedAt: number;
}

export interface CommandResult {
  state: State;
  message: string;
}

export class UsageError extends Error {}

export const overlaysDir: string = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "overlays",
);

export function statePaths(dir: string = overlaysDir): {
  json: string;
  js: string;
} {
  return { json: join(dir, "state.json"), js: join(dir, "state.js") };
}

export function defaultState(): State {
  return {
    title: "FartLabs Lab",
    goal: "",
    tasks: [],
    timer: null,
    predictions: { current: null, hits: 0, total: 0 },
    updatedAt: Date.now(),
  };
}

export function loadState(dir: string = overlaysDir): State {
  const { json } = statePaths(dir);
  if (!existsSync(json)) return defaultState();
  const saved = JSON.parse(readFileSync(json, "utf8")) as Partial<State>;
  const base = defaultState();
  return {
    ...base,
    ...saved,
    predictions: { ...base.predictions, ...saved.predictions },
  };
}

/**
 * Persists state as JSON (for the CLI) and as a classic script (for the
 * overlays). Browser sources load `file://` pages, where `fetch` and module
 * scripts are blocked, so a plain `<script>` that sets a global is the one
 * channel that works everywhere.
 */
export function saveState(state: State, dir: string = overlaysDir): State {
  const next = { ...state, updatedAt: Date.now() };
  const { json, js } = statePaths(dir);
  writeFileSync(json, JSON.stringify(next, null, 2) + "\n");
  writeFileSync(js, `window.STREAM_STATE = ${JSON.stringify(next)};\n`);
  return next;
}

export function remainingMs(timer: Timer | null, now = Date.now()): number {
  return timer ? Math.max(0, timer.endsAt - now) : 0;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseMinutes(raw: string | undefined, fallback?: number): number {
  if (raw === undefined && fallback !== undefined) return fallback;
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new UsageError(`Expected a positive number of minutes, got "${raw}".`);
  }
  return minutes;
}

function parseIndex(raw: string | undefined, length: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > length) {
    throw new UsageError(
      length === 0
        ? "There are no tasks yet."
        : `Expected a task number between 1 and ${length}, got "${raw}".`,
    );
  }
  return n - 1;
}

function startTimer(state: State, minutes: number, label: string, now: number) {
  const durationMs = Math.round(minutes * 60_000);
  return { ...state, timer: { label, endsAt: now + durationMs, durationMs } };
}

function requireText(words: string[], what: string): string {
  const text = words.join(" ").trim();
  if (!text) throw new UsageError(`Missing ${what}.`);
  return text;
}

/** Pure reducer: applies one CLI command and returns the next state. */
export function applyCommand(
  state: State,
  argv: string[],
  now = Date.now(),
): CommandResult {
  const [command, ...rest] = argv;
  switch (command) {
    case "title": {
      const title = requireText(rest, "title");
      return { state: { ...state, title }, message: `Title: ${title}` };
    }
    case "goal": {
      const goal = requireText(rest, "goal");
      return { state: { ...state, goal }, message: `Goal: ${goal}` };
    }
    case "task": {
      const [sub, ...args] = rest;
      switch (sub) {
        case "add": {
          const text = requireText(args, "task text");
          return {
            state: { ...state, tasks: [...state.tasks, { text, done: false }] },
            message: `Added task ${state.tasks.length + 1}: ${text}`,
          };
        }
        case "done":
        case "undo": {
          const i = parseIndex(args[0], state.tasks.length);
          const done = sub === "done";
          const tasks = state.tasks.map((t, j) => (j === i ? { ...t, done } : t));
          return {
            state: { ...state, tasks },
            message: `${done ? "Done" : "Reopened"}: ${state.tasks[i].text}`,
          };
        }
        case "rm": {
          const i = parseIndex(args[0], state.tasks.length);
          return {
            state: { ...state, tasks: state.tasks.filter((_, j) => j !== i) },
            message: `Removed: ${state.tasks[i].text}`,
          };
        }
        case "clear":
          return { state: { ...state, tasks: [] }, message: "Cleared tasks." };
        default:
          throw new UsageError("Usage: task add <text> | done <n> | undo <n> | rm <n> | clear");
      }
    }
    case "timer": {
      if (rest[0] === "stop") {
        return { state: { ...state, timer: null }, message: "Timer stopped." };
      }
      const minutes = parseMinutes(rest[0]);
      const label = rest.slice(1).join(" ").trim() || "Focus";
      return {
        state: startTimer(state, minutes, label, now),
        message: `${label}: ${minutes} min`,
      };
    }
    case "break": {
      const minutes = parseMinutes(rest[0], 5);
      return {
        state: startTimer(state, minutes, "Lab break", now),
        message: `Lab break: ${minutes} min. Go move.`,
      };
    }
    case "predict": {
      const [sub] = rest;
      const p = state.predictions;
      if (sub === "hit" || sub === "miss") {
        if (!p.current) throw new UsageError("No prediction is on the air.");
        return {
          state: {
            ...state,
            predictions: {
              current: null,
              hits: p.hits + (sub === "hit" ? 1 : 0),
              total: p.total + 1,
            },
          },
          message: `Prediction ${sub === "hit" ? "landed" : "missed"}: ${p.hits + (sub === "hit" ? 1 : 0)}/${p.total + 1}`,
        };
      }
      if (sub === "reset") {
        return {
          state: { ...state, predictions: { current: null, hits: 0, total: 0 } },
          message: "Prediction score reset.",
        };
      }
      const text = requireText(rest, "prediction");
      return {
        state: { ...state, predictions: { ...p, current: text } },
        message: `Predicting: ${text}`,
      };
    }
    case "reset":
      return {
        state: { ...defaultState(), title: state.title, updatedAt: now },
        message: "Session reset. Title kept.",
      };
    case "status":
    case undefined:
      return { state, message: describe(state, now) };
    default:
      throw new UsageError(`Unknown command "${command}".\n\n${USAGE}`);
  }
}

export function describe(state: State, now = Date.now()): string {
  const lines = [`Title: ${state.title}`, `Goal: ${state.goal || "(none)"}`];
  if (state.tasks.length === 0) lines.push("Tasks: (none)");
  else {
    lines.push("Tasks:");
    state.tasks.forEach((t, i) => lines.push(`  ${i + 1}. [${t.done ? "x" : " "}] ${t.text}`));
  }
  lines.push(
    state.timer
      ? `Timer: ${state.timer.label} ${formatClock(remainingMs(state.timer, now))}`
      : "Timer: (off)",
  );
  const p = state.predictions;
  lines.push(`Predictions: ${p.hits}/${p.total}${p.current ? ` (on air: ${p.current})` : ""}`);
  return lines.join("\n");
}

export const USAGE = `npm run lab -- <command>

  goal <text>             What's on the bench right now
  task add <text>         Add an experiment to the checklist
  task done <n>           Check one off (also: undo <n>, rm <n>, clear)
  timer <minutes> [label] Start a countdown (timer stop to cancel)
  break [minutes]         Start a lab break countdown (default 5)
  predict <text>          Put a prediction on the air
  predict hit | miss      Settle it and update the score
  title <text>            Rename the lab shown on the overlays
  reset                   Clear the session (keeps the title)
  status                  Print the current state`;
