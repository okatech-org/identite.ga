export const LEVEL3_TIME_ZONE = "Africa/Libreville";
export const LEVEL3_MIN_BOOKING_NOTICE_MS = 30 * 60 * 1000;
export const LEVEL3_MAX_BOOKING_HORIZON_MS = 90 * 24 * 60 * 60 * 1000;
export const LEVEL3_JOIN_EARLY_MS = 15 * 60 * 1000;
export const LEVEL3_JOIN_LATE_MS = 30 * 60 * 1000;
export const LEVEL3_REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

export const LEVEL3_SLOT_DURATIONS = [30, 45, 60] as const;

export function canJoinScheduledInterview(
  scheduledAt: number | undefined,
  scheduledEndAt: number | undefined,
  now: number,
): boolean {
  // Les entretiens créés avant l'arrivée de la planification restent
  // accessibles : ils n'ont pas encore de date associée.
  if (scheduledAt === undefined || scheduledEndAt === undefined) return true;
  return (
    now >= scheduledAt - LEVEL3_JOIN_EARLY_MS &&
    now <= scheduledEndAt + LEVEL3_JOIN_LATE_MS
  );
}

export function joinOpensAt(
  scheduledAt: number | undefined,
): number | undefined {
  return scheduledAt === undefined
    ? undefined
    : scheduledAt - LEVEL3_JOIN_EARLY_MS;
}

export function buildSlots(
  startsAt: number,
  endsAt: number,
  durationMinutes: number,
): Array<{ startsAt: number; endsAt: number }> {
  const durationMs = durationMinutes * 60 * 1000;
  const slots: Array<{ startsAt: number; endsAt: number }> = [];
  for (
    let cursor = startsAt;
    cursor + durationMs <= endsAt;
    cursor += durationMs
  ) {
    slots.push({ startsAt: cursor, endsAt: cursor + durationMs });
  }
  return slots;
}

export function formatLibrevilleAppointment(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: LEVEL3_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
