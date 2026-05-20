"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { Check } from "lucide-react"
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
import { cn } from "@repo/ui/lib/utils"

import { formatDataLabel } from "../_content/cards"
import { icarte } from "../_content/fr"
import { CardArtIcon } from "./card-art-icon"

export type EditCardInput = {
  _id: Id<"walletCard">
  name: string
  subtitle?: string
  gradient: string
  iconKey: string
  data: Record<string, string>
  backData?: Record<string, string>
}

/**
 * Dialog d'édition rapide d'une carte. Couvre nom + sous-titre comme la
 * spec §1.7 (modale d'édition), mais on expose aussi les data/backData
 * pour parité avec la version mobile (édition complète des champs).
 */
export function EditCardModal({
  open,
  onOpenChange,
  card,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: EditCardInput | null
}) {
  const update = useMutation(api.wallet.update)
  const [name, setName] = React.useState("")
  const [subtitle, setSubtitle] = React.useState("")
  const [data, setData] = React.useState<Record<string, string>>({})
  const [backData, setBackData] = React.useState<Record<string, string>>({})
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open && card) {
      setName(card.name)
      setSubtitle(card.subtitle ?? "")
      setData(card.data ?? {})
      setBackData(card.backData ?? {})
      setPending(false)
    }
  }, [open, card])

  if (!card) return null

  const dataKeys = Object.keys(data)
  const backDataKeys = Object.keys(backData)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !card) return
    const trimmed = name.trim()
    if (trimmed.length < 1) {
      toast.error("Le nom est obligatoire.")
      return
    }
    setPending(true)
    try {
      await update({
        cardId: card._id,
        name: trimmed,
        subtitle: subtitle.trim() || undefined,
        data,
        backData: backDataKeys.length > 0 ? backData : undefined,
      })
      toast.success(icarte.editModal.saveSuccess)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : icarte.editModal.saveError
      toast.error(msg)
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{icarte.editModal.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Modifier la carte {card.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Aperçu */}
          <div
            className={cn(
              "mx-auto aspect-[85/55] w-[220px] overflow-hidden rounded-xl bg-gradient-to-br p-3 text-white shadow-md",
              card.gradient,
            )}
          >
            <CardArtIcon iconKey={card.iconKey} size={18} />
            <div className="mt-5">
              <div className="text-[13px] font-bold leading-tight">
                {name || card.name}
              </div>
              {subtitle ? (
                <div className="mt-0.5 text-[11px] text-white/80">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">{icarte.editModal.name}</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-subtitle">{icarte.editModal.subtitle}</Label>
              <Input
                id="edit-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            {dataKeys.length > 0 ? (
              <>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                  {icarte.editModal.frontLabel}
                </p>
                {dataKeys.map((k) => (
                  <div key={`f-${k}`} className="grid gap-1.5">
                    <Label htmlFor={`edit-f-${k}`}>{formatDataLabel(k)}</Label>
                    <Input
                      id={`edit-f-${k}`}
                      value={data[k] ?? ""}
                      onChange={(e) =>
                        setData((d) => ({ ...d, [k]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </>
            ) : null}

            {backDataKeys.length > 0 ? (
              <>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                  {icarte.editModal.backLabel}
                </p>
                {backDataKeys.map((k) => (
                  <div key={`b-${k}`} className="grid gap-1.5">
                    <Label htmlFor={`edit-b-${k}`}>{formatDataLabel(k)}</Label>
                    <Input
                      id={`edit-b-${k}`}
                      value={backData[k] ?? ""}
                      onChange={(e) =>
                        setBackData((d) => ({ ...d, [k]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {icarte.editModal.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              <Check className="h-3.5 w-3.5" />
              {pending ? icarte.editModal.saving : icarte.editModal.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
