"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import { LoABadge } from "@repo/ui/components/loa-badge"

import { AvatarInitials } from "../../../_components/avatar-initials"
import { IdnCard } from "../../../_components/idn-card"
import { PriorityBadge } from "../../../_components/priority-badge"
import { queue as content } from "../../../_content/fr"
import { initials } from "../../../_lib/mocks"
import { CaseDetail } from "./case-detail"

function formatAge(submittedAt: number | undefined): string {
  if (!submittedAt) return "—"
  const ms = Date.now() - submittedAt
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (remM === 0) return `${h}h`
  return `${h}h ${String(remM).padStart(2, "0")}min`
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function QueueList() {
  const items = useQuery(api.controller.queue.listPendingEnriched, {})
  const claim = useMutation(api.controller.queue.claim)
  const [pendingId, setPendingId] = React.useState<Id<"kycRequest"> | null>(
    null,
  )

  const onExamine = async (id: Id<"kycRequest">) => {
    setPendingId(id)
    try {
      await claim({ kycRequestId: id })
    } catch (err) {
      toast.error(
        describeError(err, "Impossible de prendre en charge cette demande."),
      )
    } finally {
      setPendingId(null)
    }
  }

  if (items === undefined) {
    return (
      <IdnCard className="overflow-hidden p-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={
              i === 2
                ? "flex items-center gap-[18px] px-5 py-4"
                : "flex items-center gap-[18px] border-b border-idn-border-soft px-5 py-4"
            }
          >
            <div className="size-[38px] animate-pulse rounded-full bg-idn-surface-2" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-40 animate-pulse rounded bg-idn-surface-2" />
              <div className="h-3 w-28 animate-pulse rounded bg-idn-surface-2" />
            </div>
            <div className="h-7 w-20 animate-pulse rounded-full bg-idn-surface-2" />
            <div className="h-7 w-24 animate-pulse rounded-md bg-idn-surface-2" />
          </div>
        ))}
      </IdnCard>
    )
  }

  if (items.length === 0) {
    return (
      <IdnCard>
        <div className="text-sm text-idn-muted">
          Aucune demande en attente de revue pour le moment.
        </div>
      </IdnCard>
    )
  }

  return (
    <>
      <IdnCard className="overflow-hidden p-0">
        {items.map((q, i) => (
          <div
            key={q._id}
            className={
              i === items.length - 1
                ? "flex items-center gap-[18px] px-5 py-4"
                : "flex items-center gap-[18px] border-b border-idn-border-soft px-5 py-4"
            }
          >
            <AvatarInitials initials={initials(q.name)} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-idn-ink">{q.name}</div>
              <div className="mt-0.5 truncate font-mono text-[11px] text-idn-muted">
                {q.ref} · {q.documentType}
              </div>
            </div>
            <LoABadge level={q.targetLoa} compact />
            {q.priority === "haute" && <PriorityBadge />}
            <span className="w-20 text-right text-xs text-idn-muted">
              {formatAge(q.submittedAt)}
            </span>
            <Button
              size="sm"
              disabled={pendingId === q._id}
              onClick={() => onExamine(q._id)}
            >
              {pendingId === q._id ? "…" : content.examineCta}
            </Button>
          </div>
        ))}
      </IdnCard>

      <CaseDetail />
    </>
  )
}
