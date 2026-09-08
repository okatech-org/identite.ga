"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog"
import { Button } from "@repo/ui/components/button"

import { fr } from "../_content/fr"

type ConvexErrorLike = { data?: { message?: string } }

export function DeleteApplicationDialog({
  appName,
  clientId,
  hasBothEnvironments,
  onDeleted,
  compact = false,
}: {
  appName: string
  clientId: string
  hasBothEnvironments: boolean
  onDeleted?: () => void
  compact?: boolean
}) {
  const removeApplication = useMutation(api.developer.apps.remove)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const remove = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDeleting(true)
    try {
      await removeApplication({ clientId })
      setOpen(false)
      toast.success(fr.applications.delete.success)
      onDeleted?.()
    } catch (error) {
      const message =
        error && typeof error === "object" && "data" in error
          ? ((error as ConvexErrorLike).data?.message ??
            fr.applications.delete.error)
          : fr.applications.delete.error
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          className="text-idn-muted hover:bg-destructive/10 hover:text-destructive"
          aria-label={`${fr.applications.delete.button} ${appName}`}
        >
          <Trash2Icon aria-hidden />
          {compact ? null : fr.applications.delete.button}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fr.applications.delete.title.replace("{appName}", appName)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasBothEnvironments
              ? fr.applications.delete.descriptionBoth
              : fr.applications.delete.descriptionOne}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {fr.applications.delete.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={remove}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting
              ? fr.applications.delete.deleting
              : fr.applications.delete.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
