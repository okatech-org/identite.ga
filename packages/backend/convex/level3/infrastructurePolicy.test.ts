import { describe, expect, test } from "vitest"

import {
  LIVEKIT_IDLE_GRACE_MS,
  remainingIdleGraceMs,
  vmLifecycleAction,
} from "./infrastructurePolicy"

describe("politique d'extinction LiveKit", () => {
  test("démarre uniquement une VM arrêtée ou suspendue", () => {
    expect(vmLifecycleAction("TERMINATED")).toBe("start")
    expect(vmLifecycleAction("SUSPENDED")).toBe("start")
    expect(vmLifecycleAction("RUNNING")).toBe("wait-for-ready")
    expect(vmLifecycleAction("STOPPING")).toBe("wait-for-stop")
    expect(vmLifecycleAction("REPAIRING")).toBe("reject")
  })

  test("conserve une grâce complète de quinze minutes après l'activité", () => {
    const now = 2_000_000
    expect(remainingIdleGraceMs(now, now)).toBe(LIVEKIT_IDLE_GRACE_MS)
    expect(remainingIdleGraceMs(now - 60_000, now)).toBe(LIVEKIT_IDLE_GRACE_MS - 60_000)
    expect(remainingIdleGraceMs(now - LIVEKIT_IDLE_GRACE_MS, now)).toBeNull()
    expect(remainingIdleGraceMs(0, now)).toBeNull()
  })
})
