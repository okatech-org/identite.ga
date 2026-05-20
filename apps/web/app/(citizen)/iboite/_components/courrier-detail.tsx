"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { AlertCircleIcon, FileTextIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { iboite } from "../_content/fr"
import { formatLongDate } from "../_lib/format"

export function CourrierDetail({
  letterId,
}: {
  letterId: Id<"iboiteLetter">
}) {
  const letter = useQuery(api.iboite.letters.get, { letterId })
  const markRead = useMutation(api.iboite.letters.markRead)

  React.useEffect(() => {
    if (letter && !letter.isRead) {
      void markRead({ letterId }).catch(() => {})
    }
  }, [letter, letterId, markRead])

  if (letter === undefined) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">{iboite.loading}</p>
      </div>
    )
  }
  if (letter === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Courrier introuvable.</p>
      </div>
    )
  }

  const created = formatLongDate(letter.createdAt)
  const dueLabel = letter.dueAt ? formatLongDate(letter.dueAt) : null

  return (
    <div className="flex-1 overflow-auto p-5">
      {/* Papier A4 — proportions 595×842 px scalées à la largeur du conteneur */}
      <article
        className="mx-auto w-full max-w-[640px] rounded-md bg-[#fffdf7] px-8 py-10 text-[#1a1a1a] shadow-2xl dark:bg-[#1f1d18] dark:text-foreground"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        <header className="flex flex-wrap justify-between gap-4 text-[11px] text-[#3a3a3a] dark:text-muted-foreground">
          <div className="max-w-[48%]">
            <p className="font-bold text-[#1a1a1a] dark:text-foreground">
              {letter.senderName}
            </p>
            <p className="whitespace-pre-line">{letter.senderAddress}</p>
          </div>
          <div className="max-w-[48%] text-right">
            <p className="font-bold text-[#1a1a1a] dark:text-foreground">
              {letter.recipientName}
            </p>
            <p className="whitespace-pre-line">{letter.recipientAddress}</p>
          </div>
        </header>

        <p className="mt-6 text-right text-[11px] text-[#3a3a3a] dark:text-muted-foreground">
          {iboite.courriers.cityDate("Libreville", created)}
        </p>

        <h1 className="mt-6 border-b border-[#d6d2c4] pb-2 text-[14px] font-bold dark:border-border">
          {iboite.courriers.objet(letter.subject)}
        </h1>

        <div className="mt-5 whitespace-pre-wrap text-[13px] leading-7 text-justify text-[#2a2a2a] dark:text-foreground/90">
          {letter.body}
        </div>

        {letter.attachments.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {iboite.courriers.attachments}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {letter.attachments.map((a) => (
                <li
                  key={a._id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <FileTextIcon
                    className="h-4 w-4 text-blue-500"
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-xs">{a.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.max(1, Math.round(a.size / 1024))} KB
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      {/* Encart « Action requise » sous le papier — hors A4 */}
      {letter.type === "action_required" && letter.folder === "inbox" ? (
        <aside
          role="status"
          className="mx-auto mt-5 flex max-w-[640px] items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30"
        >
          <AlertCircleIcon
            className="mt-0.5 h-4 w-4 shrink-0 text-[#B83A3A]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-bold text-[#B83A3A]">
              {iboite.courriers.actionRequired}
            </p>
            <p className="mt-0.5 text-xs text-foreground/80">
              {dueLabel
                ? iboite.courriers.replyBy(dueLabel)
                : iboite.courriers.replyBySoon}
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  )
}
