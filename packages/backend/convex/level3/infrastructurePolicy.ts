export const LIVEKIT_IDLE_GRACE_MS = 15 * 60 * 1000
export const LIVEKIT_ACTIVE_ROOM_RECHECK_MS = 5 * 60 * 1000

export type VmLifecycleAction = "wait-for-stop" | "start" | "wait-for-ready" | "reject"

/** Décide comment traiter l'état Compute Engine courant avant un entretien. */
export function vmLifecycleAction(status: string): VmLifecycleAction {
  if (status === "STOPPING" || status === "SUSPENDING") return "wait-for-stop"
  if (status === "TERMINATED" || status === "SUSPENDED") return "start"
  if (status === "RUNNING" || status === "PROVISIONING" || status === "STAGING") {
    return "wait-for-ready"
  }
  return "reject"
}

/** Délai restant avant qu'une extinction pour inactivité soit autorisée. */
export function remainingIdleGraceMs(lastActivityAt: number, now: number): number | null {
  if (lastActivityAt <= 0) return null
  const remaining = LIVEKIT_IDLE_GRACE_MS - (now - lastActivityAt)
  return remaining > 0 ? remaining : null
}
