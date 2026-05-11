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

function metadataHref(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null
  if (typeof metadata.kycRequestId === "string") return "/kyc/request"
  return null
}

/**
 * Cloche de notifications partagée — affiche un badge sur le compteur
 * non lu, ouvre un dropdown avec les 10 dernières notifs et un bouton
 * "Tout marquer comme lu".
 *
 * Pas utilisée côté contrôleur (il a sa propre version avec un layout
 * différent), mais réutilisable ailleurs sur identite.ga.
 */
export function NotificationsBell({ className }: { className?: string }) {
  const list = useQuery(api.notifications.listMine, { limit: 10 })
  const unread = useQuery(api.notifications.unreadCount, {})
  const markAllRead = useMutation(api.notifications.markAllRead)
  const markRead = useMutation(api.notifications.markRead)

  const count = unread ?? 0

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        // Quand l'utilisateur ouvre le menu, on marque tout comme lu
        // (pattern classique inbox). Les notifs restent visibles.
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
            "relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
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
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            Chargement…
          </div>
        ) : list.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            Aucune notification pour l'instant.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {list.map((n) => {
              const href = metadataHref(n.metadata)
              const body = (
                <div className="flex flex-col items-start gap-0.5">
                  <span className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                    {n.title}
                  </span>
                  <span className="line-clamp-2 text-[12px] leading-snug text-muted-foreground">
                    {n.body}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
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
