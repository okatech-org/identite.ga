"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

import { icv } from "../_content/fr"

interface CvOption {
  _id: Id<"citizenCv">
  name: string
}

/**
 * Modale « Nouveau CV » — appelée depuis le sélecteur de CV et depuis la
 * page liste. Permet de partir d'un CV vierge ou de cloner un CV existant.
 */
export function CreateCvModal({
  open,
  onOpenChange,
  existingCvs,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCvs: CvOption[]
  onCreated?: (id: Id<"citizenCv">) => void
}) {
  const create = useMutation(api.cv.cvs.create)
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [copyFromCvId, setCopyFromCvId] = React.useState<string>("")
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName("")
      setCopyFromCvId("")
      setPending(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    const trimmed = name.trim()
    if (trimmed.length < 1) {
      toast.error("Donnez un nom à votre CV.")
      return
    }
    setPending(true)
    try {
      const id = await create({
        name: trimmed,
        copyFromCvId: copyFromCvId
          ? (copyFromCvId as Id<"citizenCv">)
          : undefined,
      })
      onOpenChange(false)
      if (onCreated) {
        onCreated(id)
      } else {
        router.push(`/icv`)
      }
      toast.success("CV créé.")
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("CV_LIMIT_REACHED")) {
        toast.error(icv.list.limitReached)
      } else {
        toast.error("Impossible de créer le CV.", { description: msg })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{icv.create.title}</DialogTitle>
            <DialogDescription>
              Vous pouvez partir d'un CV vierge ou dupliquer un CV existant.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-cv-name">{icv.create.nameLabel}</Label>
              <Input
                id="new-cv-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={icv.create.namePlaceholder}
                autoFocus
                maxLength={80}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copy-from">{icv.create.copyFromLabel}</Label>
              <Select
                value={copyFromCvId || "none"}
                onValueChange={(v) =>
                  setCopyFromCvId(v === "none" ? "" : v)
                }
                disabled={pending}
              >
                <SelectTrigger id="copy-from">
                  <SelectValue placeholder={icv.create.copyFromEmpty} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{icv.create.copyFromEmpty}</SelectItem>
                  {existingCvs.map((cv) => (
                    <SelectItem key={cv._id} value={cv._id as string}>
                      {cv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {icv.create.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              <Plus className="h-4 w-4" />
              {icv.create.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
