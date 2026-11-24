import { UsageError } from "./state.ts"

export function parseMinutes(raw: string | undefined, fallback?: number): number {
  if (raw === undefined && fallback !== undefined) return fallback
  const minutes = Number(raw)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new UsageError(`Expected a positive number of minutes, got "${raw}".`)
  }
  return minutes
}

export function parseIndex(raw: string | undefined, length: number): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > length) {
    throw new UsageError(
      length === 0
        ? "There are no tasks yet."
        : `Expected a task number between 1 and ${length}, got "${raw}".`,
    )
  }
  return n - 1
}

export function requireText(words: string[], what: string): string {
  const text = words.join(" ").trim()
  if (!text) throw new UsageError(`Missing ${what}.`)
  return text
}
