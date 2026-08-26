"use client"

import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { iboite } from "../_content/fr"

export function useEmailActions({
  messageId,
  onAfterMove,
}: {
  messageId: Id<"iboiteMessage">
  onAfterMove: () => void
}) {
  const move = useMutation(api.iboite.messages.move)

  async function onDelete() {
    try {
      await move({ messageId, target: "trash" })
      toast.success(iboite.toasts.emailDeleted)
      onAfterMove()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : iboite.toasts.moveFailed)
    }
  }

  async function onArchive() {
    try {
      await move({ messageId, target: "archive" })
      toast.success(iboite.toasts.emailArchived)
      onAfterMove()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : iboite.toasts.moveFailed)
    }
  }

  return { onDelete, onArchive }
}
