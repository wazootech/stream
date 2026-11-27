import type { State, Task } from "./state.ts"

/** The task being timed: the first one not done, or -1. */
export function currentIndex(tasks: Task[]): number {
  return tasks.findIndex((task) => !task.done)
}

/** Time spent on a task, including the running split if it is the current one. */
export function taskMs(state: State, index: number, now = Date.now()): number {
  const running = state.splitFrom !== null && index === currentIndex(state.tasks)
  const extra = running ? Math.max(0, now - (state.splitFrom as number)) : 0
  return (state.tasks[index]?.ms ?? 0) + extra
}

/** Adds the running time to one task and leaves the others alone. */
export function credit(state: State, index: number, now: number): Task[] {
  if (state.splitFrom === null || index < 0) return state.tasks
  const spent = Math.max(0, now - state.splitFrom)
  return state.tasks.map((t, i) => (i === index ? { ...t, ms: t.ms + spent } : t))
}

/** `m:ss`, or `h:mm:ss` from an hour up. */
export function formatSplit(ms: number): string {
  const total = Math.floor(ms / 1000)
  const two = (n: number) => String(n).padStart(2, "0")
  const h = Math.floor(total / 3600)
  const m = Math.floor(total / 60) % 60
  const s = two(total % 60)
  return h > 0 ? `${h}:${two(m)}:${s}` : `${m}:${s}`
}
