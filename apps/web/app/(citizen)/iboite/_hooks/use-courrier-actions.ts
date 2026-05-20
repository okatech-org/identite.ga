"use client"

import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { iboite } from "../_content/fr"

export function useCourrierActions({
  letterId,
  onAfterMove,
}: {
  letterId: Id<"iboiteLetter">
  onAfterMove: () => void
}) {
  const move = useMutation(api.iboite.letters.move)

  async function moveTo(target: "pending" | "trash") {
    try {
      await move({ letterId, target })
      toast.success(
        target === "trash"
          ? iboite.toasts.movedToTrash
          : iboite.toasts.movedToPending,
      )
      onAfterMove()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : iboite.toasts.moveFailed)
    }
  }

  function onPrint() {
    if (typeof window !== "undefined") window.print()
  }

  function onDownload() {
    toast.info(iboite.toasts.soonAvailable)
  }

  function onReply() {
    toast.info(iboite.toasts.soonAvailable)
  }

  async function onShare({
    title,
    text,
  }: {
    title: string
    text: string
  }) {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ title, text })
      } catch {
        /* user cancelled */
      }
    } else {
      toast.info(iboite.toasts.soonAvailable)
    }
  }

  return { moveTo, onPrint, onDownload, onReply, onShare }
}
