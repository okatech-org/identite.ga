"use client"

import * as React from "react"
import { usePaginatedQuery } from "convex/react"
import { MailIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { cn } from "@repo/ui/lib/utils"

import { iboite, type CourrierFolder } from "../_content/fr"
import { formatRelativeTime } from "../_lib/format"

const FOLDER_TITLE: Record<CourrierFolder, string> = {
  inbox: iboite.courriers.folders.inbox,
  sent: iboite.courriers.folders.sent,
  pending: iboite.courriers.folders.pending,
  trash: iboite.courriers.folders.trash,
}

export function CourrierList({
  accountId,
  folder,
  onOpen,
}: {
  accountId: Id<"iboiteAccount">
  folder: CourrierFolder
  onOpen: (id: Id<"iboiteLetter">) => void
}) {
  const result = usePaginatedQuery(
    api.iboite.letters.listByFolder,
    { accountId, folder },
    { initialNumItems: 30 },
  )
  const letters = result.results
  const loading = result.status === "LoadingFirstPage"

  return (
    <div
      id="iboite-panel-courriers"
      role="tabpanel"
      aria-labelledby="tab-courriers"
      className="flex flex-1 flex-col"
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="text-base font-semibold">{FOLDER_TITLE[folder]}</h2>
          <p className="text-xs text-muted-foreground">
            {iboite.courriers.countLabel(letters.length)}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-secondary"
              />
            ))}
          </div>
        ) : letters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <MailIcon
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {iboite.courriers.empty}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {letters.map((l) => (
              <li key={l._id}>
                <button
                  type="button"
                  onClick={() => onOpen(l._id as Id<"iboiteLetter">)}
                  className={cn(
                    "group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-[#fffdf7] p-4 text-left text-[#1a1a1a] shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-[#1f1d18] dark:text-foreground",
                    !l.isRead
                      ? "border-idn-green ring-2 ring-idn-green/30"
                      : "border-border",
                  )}
                >
                  {/* Coin papier ivoire en biseau */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 top-0 h-7 w-7 bg-[#f5f2eb] dark:bg-[#2a2820]"
                    style={{
                      clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                    }}
                  />

                  {l.type === "action_required" && !l.isRead ? (
                    <span className="absolute right-3 top-2.5 rounded bg-[#B83A3A] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      {iboite.courriers.urgent}
                    </span>
                  ) : null}

                  {folder === "pending" ? (
                    <span className="absolute right-3 top-2.5 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      {iboite.courriers.toProcess}
                    </span>
                  ) : null}

                  <p className="text-xs font-medium text-muted-foreground">
                    {folder === "sent" ? l.recipientName : l.senderName}
                  </p>
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-sm",
                      l.isRead ? "font-medium" : "font-bold",
                    )}
                  >
                    {l.subject}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3 text-[10px] text-muted-foreground">
                    <span>{formatRelativeTime(l.createdAt)}</span>
                    {!l.isRead ? (
                      <span
                        aria-label="Non lu"
                        className="h-2 w-2 rounded-full bg-idn-green"
                      />
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {result.status === "CanLoadMore" ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => result.loadMore(20)}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-secondary"
            >
              Charger plus
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
