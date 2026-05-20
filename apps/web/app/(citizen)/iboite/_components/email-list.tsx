"use client"

import * as React from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import {
  Building2Icon,
  MessageCircleIcon,
  PaperclipIcon,
  StarIcon,
  UserIcon,
} from "lucide-react"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { cn } from "@repo/ui/lib/utils"

import { iboite, type EmailFolder } from "../_content/fr"
import { formatRelativeTime } from "../_lib/format"

const FOLDER_TITLE: Record<EmailFolder, string> = {
  inbox: iboite.emails.folders.inbox,
  starred: iboite.emails.folders.starred,
  sent: iboite.emails.folders.sent,
  trash: iboite.emails.folders.trash,
}

export function EmailList({
  accountId,
  folder,
  onOpen,
}: {
  accountId: Id<"iboiteAccount">
  folder: EmailFolder
  onOpen: (id: Id<"iboiteMessage">) => void
}) {
  const result = usePaginatedQuery(
    api.iboite.messages.listByFolder,
    { accountId, folder },
    { initialNumItems: 30 },
  )
  const emails = result.results
  const loading = result.status === "LoadingFirstPage"
  const toggleStar = useMutation(api.iboite.messages.toggleStar)

  async function onToggleStar(id: Id<"iboiteMessage">) {
    try {
      await toggleStar({ messageId: id })
    } catch {
      // silencieux
    }
  }

  return (
    <div
      id="iboite-panel-emails"
      role="tabpanel"
      aria-labelledby="tab-emails"
      className="flex flex-1 flex-col"
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="text-base font-semibold">{FOLDER_TITLE[folder]}</h2>
          <p className="text-xs text-muted-foreground">
            {iboite.emails.countLabel(emails.length)}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <ul className="flex flex-col gap-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-16 animate-pulse rounded-lg bg-secondary"
              />
            ))}
          </ul>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <MessageCircleIcon
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {iboite.emails.empty}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {emails.map((e) => {
              const isAdmin = e.senderKind === "admin"
              return (
                <li key={e._id}>
                  <button
                    type="button"
                    onClick={() => onOpen(e._id as Id<"iboiteMessage">)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40",
                      !e.isRead && "bg-idn-green-soft/40 dark:bg-[#0F2A18]/40",
                    )}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={
                        e.isStarred
                          ? iboite.emails.removeStar
                          : iboite.emails.addStar
                      }
                      onClick={(ev) => {
                        ev.stopPropagation()
                        void onToggleStar(e._id as Id<"iboiteMessage">)
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault()
                          ev.stopPropagation()
                          void onToggleStar(e._id as Id<"iboiteMessage">)
                        }
                      }}
                      className="mt-1 inline-flex h-4 w-4 cursor-pointer"
                    >
                      <StarIcon
                        className={cn(
                          "h-4 w-4",
                          e.isStarred
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/60",
                        )}
                        aria-hidden="true"
                      />
                    </span>

                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white",
                        isAdmin
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                          : "bg-gradient-to-br from-emerald-500 to-teal-600",
                      )}
                    >
                      {isAdmin ? (
                        <Building2Icon className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <UserIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "flex-1 truncate text-sm",
                            e.isRead
                              ? "font-medium text-foreground/80"
                              : "font-bold text-foreground",
                          )}
                        >
                          {e.senderName}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelativeTime(e.createdAt)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          e.isRead
                            ? "font-medium text-muted-foreground"
                            : "font-semibold text-foreground",
                        )}
                      >
                        {e.subject}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="flex-1 truncate text-[11px] text-muted-foreground">
                          {e.preview}
                        </p>
                        {e.hasAttachment ? (
                          <PaperclipIcon
                            className="h-3 w-3 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {result.status === "CanLoadMore" ? (
          <div className="my-4 flex justify-center">
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
