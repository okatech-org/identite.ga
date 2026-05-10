"use client"

import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { cn } from "@repo/ui/lib/utils"

import { dashboard } from "../_content/fr"

export function SessionsCard({ className }: { className?: string }) {
  const sessions = useQuery(api.sessions.listMine)

  const isLoading = sessions === undefined
  const count = sessions?.length ?? 0
  const countLabel =
    count === 0
      ? dashboard.sessions.countEmpty
      : count === 1
        ? dashboard.sessions.countSingle
        : dashboard.sessions.countMany(count)
  const devices = (sessions ?? []).slice(0, 3).map((s) => s.device).join(" · ")

  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-card p-[18px]",
        className,
      )}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {dashboard.sessions.eyebrow}
      </p>
      {isLoading ? (
        <>
          <div className="mt-2 h-7 w-24 animate-pulse rounded bg-secondary" />
          <div className="mt-1.5 h-3 w-40 animate-pulse rounded bg-secondary/60" />
        </>
      ) : (
        <>
          <p className="mt-2 text-[26px] font-semibold leading-tight text-foreground">
            {countLabel}
          </p>
          {devices && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {devices}
            </p>
          )}
        </>
      )}
    </div>
  )
}
