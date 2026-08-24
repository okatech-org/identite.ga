import { describe, expect, it } from "vitest"
import {
  canJoinLevel3,
  groupLevel3Slots,
  LEVEL3_JOIN_EARLY_MS,
  LEVEL3_JOIN_LATE_MS,
} from "./level3"

describe("entretien mobile Niveau 3", () => {
  it("ouvre quinze minutes avant et ferme trente minutes après", () => {
    const start = Date.UTC(2026, 7, 22, 10)
    const end = start + 30 * 60 * 1000
    expect(canJoinLevel3(start, end, start - LEVEL3_JOIN_EARLY_MS - 1)).toBe(
      false,
    )
    expect(canJoinLevel3(start, end, start - LEVEL3_JOIN_EARLY_MS)).toBe(true)
    expect(canJoinLevel3(start, end, end + LEVEL3_JOIN_LATE_MS)).toBe(true)
    expect(canJoinLevel3(start, end, end + LEVEL3_JOIN_LATE_MS + 1)).toBe(false)
  })

  it("regroupe les créneaux par date de Libreville", () => {
    const slots = [
      { startsAt: Date.UTC(2026, 7, 22, 8), id: 1 },
      { startsAt: Date.UTC(2026, 7, 22, 9), id: 2 },
      { startsAt: Date.UTC(2026, 7, 23, 8), id: 3 },
    ]
    expect(
      groupLevel3Slots(slots).map(([, rows]) => rows.map((row) => row.id)),
    ).toEqual([[1, 2], [3]])
  })
})
