"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import {
  Building2Icon,
  PaperclipIcon,
  ReplyIcon,
  StarIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { cn } from "@repo/ui/lib/utils"

import { iboite } from "../_content/fr"
import { formatDateTime } from "../_lib/format"

export function EmailDetail({
  messageId,
  onReply,
}: {
  messageId: Id<"iboiteMessage">
  /** Déclenche l'ouverture du compose en mode réponse à ce message. */
  onReply: () => void
}) {
  const email = useQuery(api.iboite.messages.get, { messageId })
  const markRead = useMutation(api.iboite.messages.markRead)
  const toggleStar = useMutation(api.iboite.messages.toggleStar)

  React.useEffect(() => {
    if (email && !email.isRead) {
      void markRead({ messageId }).catch(() => {})
    }
  }, [email, messageId, markRead])

  if (email === undefined) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">{iboite.loading}</p>
      </div>
    )
  }
  if (email === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Message introuvable.</p>
      </div>
    )
  }

  const isAdmin = email.senderKind === "admin"
  const date = formatDateTime(email.createdAt)

  async function onToggleStar() {
    try {
      await toggleStar({ messageId })
      toast.success(
        email && !email.isStarred
          ? iboite.toasts.starred
          : iboite.toasts.unstarred,
      )
    } catch {
      // silencieux
    }
  }

  return (
    <article className="flex flex-1 flex-col overflow-auto">
      <header className="flex items-start gap-4 border-b border-border px-5 py-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
            isAdmin
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-emerald-500 to-teal-600",
          )}
        >
          {isAdmin ? (
            <Building2Icon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <UserIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{email.senderName}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {email.senderEmail}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {iboite.emails.toLine(email.recipientEmail, date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onReply}
            aria-label={iboite.emails.actions.reply}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary"
          >
            <ReplyIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {iboite.emails.actions.reply}
          </button>
          <button
            type="button"
            onClick={onToggleStar}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              email.isStarred
                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-border bg-card text-foreground/80 hover:bg-secondary",
            )}
          >
            <StarIcon
              className={cn(
                "h-3.5 w-3.5",
                email.isStarred ? "fill-amber-400 text-amber-400" : "",
              )}
              aria-hidden="true"
            />
            {email.isStarred ? iboite.emails.removeStar : iboite.emails.addStar}
          </button>
        </div>
      </header>

      <div className="px-5 pb-3 pt-5">
        <h1 className="text-lg font-semibold">{email.subject}</h1>
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-border bg-background p-5 shadow-sm">
        <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {email.body}
        </div>

        {email.hasAttachment ? (
          <section className="mt-6 border-t border-border pt-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {iboite.emails.attachments}
            </h2>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <PaperclipIcon
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex-1 text-xs">Document.pdf</span>
              <button
                type="button"
                onClick={() => toast.info(iboite.toasts.soonAvailable)}
                className="text-xs font-semibold text-idn-green hover:underline"
              >
                {iboite.emails.download}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
