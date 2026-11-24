import type { State, Timer } from "../src/state.ts"

interface SessionApi {
  /** Reloads state.js every couple of seconds and reports the latest. */
  watchState(onState: (state: State | null) => void): void
  remainingMs(timer: Timer | null, now?: number): number
  formatClock(ms: number): string
  /** Typed shorthand for `document.getElementById`. */
  $(id: string): HTMLElement
}

declare global {
  interface Window {
    STREAM_STATE?: State
    Session: SessionApi
  }
}
