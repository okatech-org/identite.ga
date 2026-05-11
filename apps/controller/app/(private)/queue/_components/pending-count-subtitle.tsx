"use client"

import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

/**
 * Sous-titre dynamique de la file de demandes, format
 * "REVUE MANUELLE · {n} EN ATTENTE". Tombe sur `fallback` tant que
 * la query n'a pas encore résolu.
 */
export function PendingCountSubtitle({ fallback }: { fallback: string }) {
  const count = useQuery(api.controller.queue.pendingCount, {})
  if (count === undefined) return <>{fallback}</>
  return <>{`REVUE MANUELLE · ${count} EN ATTENTE`}</>
}
