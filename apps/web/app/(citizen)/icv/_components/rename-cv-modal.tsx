"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { icv } from "../_content/fr"

export function RenameCvModal({
  open,
  onOpenChange,
  cvId,
  currentName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cvId: Id<"citizenCv"> | null
  currentName: string
}) {
  const rename = useMutation(api.cv.cvs.rename)
  const [name, setName] = React.useState(currentName)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(currentName)
      setPending(false)
    }
  }, [open, currentName])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cvId || pending) return
    const trimmed = name.trim()
    if (trimmed.length < 1) {
      toast.error("Le nom ne peut pas être vide.")
      return
    }
    setPending(true)
    try {
      await rename({ cvId, name: trimmed })
      onOpenChange(false)
      toast.success("CV renommé.")
    } catch (e) {
      toast.error("Impossible de renommer.", {
        description: (e as Error).message,
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{icv.rename.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor="rename-cv">{icv.rename.nameLabel}</Label>
            <Input
              id="rename-cv"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={80}
              disabled={pending}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {icv.rename.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {icv.rename.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
