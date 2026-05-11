"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { BellIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import { cn } from "@repo/ui/lib/utils"

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("fr-FR", {
  numeric: "auto",
})

function relativeFromNow(ts: number): string {
  const diff = ts - Date.now()
  const abs = Math.abs(diff)
  const min = Math.round(diff / 60_000)
  if (abs < 60_000) return "à l'instant"
  if (abs < 3_600_000) return RELATIVE_FORMATTER.format(min, "minute")
  const h = Math.round(diff / 3_600_000)
  if (abs < 86_400_000) return RELATIVE_FORMATTER.format(h, "hour")
  const d = Math.round(diff / 86_400_000)
  return RELATIVE_FORMATTER.format(d, "day")
}

/**
 * Cloche de notifications contrôleur — quasi identique à la version
 * citoyen mais avec un href spécifique (vers la file de demandes) quand
 * la notif est rattachée à une KYC.
 */
export function ControllerNotificationsBell({
  className,
}: {
  className?: string
}) {
  const list = useQuery(api.notifications.listMine, { limit: 10 })
  const unread = useQuery(api.notifications.unreadCount, {})
  const markAllRead = useMutation(api.notifications.markAllRead)
  const markRead = useMutation(api.notifications.markRead)

  const count = unread ?? 0

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && count > 0) void markAllRead()
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            count > 0 ? `${count} notifications non lues` : "Notifications"
          }
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full text-idn-muted transition-colors hover:bg-idn-surface-2 hover:text-idn-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green/40",
            className,
          )}
        >
          <BellIcon className="size-4" aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-idn-green text-[9px] font-bold text-white"
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <span className="rounded-full bg-idn-green-soft px-2 py-0.5 text-[10px] font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
              {count} non lue{count > 1 ? "s" : ""}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list === undefined ? (
          <div className="px-2 py-6 text-center text-xs text-idn-muted">
            Chargement…
          </div>
        ) : list.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-idn-muted">
            Aucune notification pour l&apos;instant.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {list.map((n) => {
              const meta = n.metadata as
                | Record<string, unknown>
                | undefined
              const href =
                meta && typeof meta.kycRequestId === "string" ? "/queue" : null
              const body = (
                <div className="flex flex-col items-start gap-0.5">
                  <span className="line-clamp-2 text-[13px] font-medium leading-snug text-idn-ink">
                    {n.title}
                  </span>
                  <span className="line-clamp-2 text-[12px] leading-snug text-idn-muted">
                    {n.body}
                  </span>
                  <span className="mt-0.5 text-[10px] text-idn-muted">
                    {relativeFromNow(n.createdAt)}
                  </span>
                </div>
              )
              return (
                <DropdownMenuItem
                  key={n._id}
                  asChild={Boolean(href)}
                  onSelect={() => {
                    if (!n.readAt) void markRead({ notificationId: n._id })
                  }}
                  className="cursor-pointer items-start gap-2 py-2"
                >
                  {href ? <Link href={href}>{body}</Link> : body}
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
