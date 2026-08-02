import { describe, expect, test } from "vitest";

import {
  buildSlots,
  canJoinScheduledInterview,
  LEVEL3_JOIN_EARLY_MS,
  LEVEL3_JOIN_LATE_MS,
} from "./schedulingPolicy";

describe("planification des entretiens Niveau 3", () => {
  test("découpe une plage en créneaux complets", () => {
    const start = Date.UTC(2026, 7, 3, 8, 0);
    expect(buildSlots(start, start + 2 * 60 * 60 * 1000, 45)).toEqual([
      { startsAt: start, endsAt: start + 45 * 60 * 1000 },
      { startsAt: start + 45 * 60 * 1000, endsAt: start + 90 * 60 * 1000 },
    ]);
  });

  test("ouvre la salle quinze minutes avant et la ferme après la tolérance", () => {
    const start = Date.UTC(2026, 7, 3, 10, 0);
    const end = start + 30 * 60 * 1000;
    expect(
      canJoinScheduledInterview(start, end, start - LEVEL3_JOIN_EARLY_MS - 1),
    ).toBe(false);
    expect(
      canJoinScheduledInterview(start, end, start - LEVEL3_JOIN_EARLY_MS),
    ).toBe(true);
    expect(
      canJoinScheduledInterview(start, end, end + LEVEL3_JOIN_LATE_MS),
    ).toBe(true);
    expect(
      canJoinScheduledInterview(start, end, end + LEVEL3_JOIN_LATE_MS + 1),
    ).toBe(false);
  });

  test("préserve les entretiens historiques sans date", () => {
    expect(canJoinScheduledInterview(undefined, undefined, Date.now())).toBe(
      true,
    );
  });
});
