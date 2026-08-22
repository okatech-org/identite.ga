export const WEBHOOK_MAX_ATTEMPTS = 8
export const WEBHOOK_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
export const WEBHOOK_SECRET_OVERLAP_MS = 24 * 60 * 60 * 1000
export const WEBHOOK_LEASE_MS = 15 * 60 * 1000

const RETRY_DELAYS_MS = [
  0,
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  6 * 60 * 60_000,
  12 * 60 * 60_000,
  24 * 60 * 60_000,
] as const

export function webhookRetryDelayMs(
  nextAttemptNumber: number,
  retryAfterMs?: number,
  elapsedSinceCreationMs = 0,
): number {
  const index = Math.min(
    Math.max(0, nextAttemptNumber - 1),
    RETRY_DELAYS_MS.length - 1,
  )
  const scheduled = Math.max(
    0,
    RETRY_DELAYS_MS[index]! - elapsedSinceCreationMs,
  )
  if (retryAfterMs === undefined) return scheduled
  const boundedRetryAfter = Math.min(
    Math.max(0, retryAfterMs),
    24 * 60 * 60_000,
  )
  return Math.max(scheduled, boundedRetryAfter)
}

export function parseRetryAfterMs(
  value: string | undefined,
  now: number,
): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const date = Date.parse(value)
  if (!Number.isFinite(date)) return undefined
  return Math.max(0, date - now)
}
