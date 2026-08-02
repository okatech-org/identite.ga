"use client"

import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

/**
 * Sous-titre dynamique de la file de demandes, format
 * "REVUE MANUELLE · {n} EN ATTENTE". Tombe sur `fallback` tant que
 * la query n'a pas encore résolu.
 */
export function PendingCountSubtitle({ fallback }: { fallback: string }) {
  const level2Count = useQuery(api.controller.queue.pendingCount, {})
  const level3Count = useQuery(api.level3.waitingCount, {})
  if (level2Count === undefined || level3Count === undefined) {
    return <>{fallback}</>
  }
  return <>{`REVUE MANUELLE · ${level2Count + level3Count} EN ATTENTE`}</>
}
