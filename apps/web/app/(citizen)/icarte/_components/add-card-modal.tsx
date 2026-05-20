"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
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

import {
  CARD_GRADIENTS,
  CARD_TEMPLATES,
  type CardTemplate,
} from "../_content/cards"
import { icarte } from "../_content/fr"
import { CardArtIcon } from "./card-art-icon"

/**
 * Dialog d'ajout de carte. Reçoit un template (cni, driving, etc.) et
 * pré-remplit nom + sous-titre + champs recto/verso spec §1.7.
 */
export function AddCardModal({
  open,
  onOpenChange,
  template,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: CardTemplate | null
}) {
  const create = useMutation(api.wallet.create)
  const [name, setName] = React.useState("")
  const [subtitle, setSubtitle] = React.useState("")
  const [data, setData] = React.useState<Record<string, string>>({})
  const [backData, setBackData] = React.useState<Record<string, string>>({})
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open && template) {
      setName(template.defaultName)
      setSubtitle(template.defaultSubtitle)
      setData(Object.fromEntries(template.data.map((f) => [f.key, ""])))
      setBackData(
        Object.fromEntries(template.backData.map((f) => [f.key, ""])),
      )
      setPending(false)
    }
  }, [open, template])

  if (!template) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !template) return
    const trimmed = name.trim()
    if (trimmed.length < 1) {
      toast.error("Donnez un nom à votre carte.")
      return
    }
    setPending(true)
    try {
      await create({
        type: template.id,
        name: trimmed,
        subtitle: subtitle.trim() || undefined,
        gradient: CARD_GRADIENTS[template.grad],
        iconKey: template.iconKey,
        isOfficialStyle: template.isOfficialStyle,
        data,
        backData: template.backData.length > 0 ? backData : undefined,
      })
      toast.success(icarte.addModal.createSuccess)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : icarte.addModal.createError
      toast.error(msg)
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{icarte.addModal.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Ajouter une carte de type {template.label}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Vignette du template sélectionné */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div
              className={cn(
                "flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br text-white",
                CARD_GRADIENTS[template.grad],
              )}
            >
              <CardArtIcon iconKey={template.iconKey} size={18} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {template.defaultName}
              </div>
              <div className="text-xs text-muted-foreground">
                {icarte.addModal.typeSelected}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="card-name">{icarte.addModal.cardName}</Label>
              <Input
                id="card-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="card-subtitle">{icarte.addModal.subtitle}</Label>
              <Input
                id="card-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            {template.data.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={`card-${f.key}`}>{f.label}</Label>
                <Input
                  id={`card-${f.key}`}
                  placeholder={f.placeholder}
                  value={data[f.key] ?? ""}
                  onChange={(e) =>
                    setData((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
            {template.backData.length > 0 ? (
              <>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                  {icarte.addModal.backLabel}
                </p>
                {template.backData.map((f) => (
                  <div key={f.key} className="grid gap-1.5">
                    <Label htmlFor={`card-b-${f.key}`}>{f.label}</Label>
                    <Input
                      id={`card-b-${f.key}`}
                      placeholder={f.placeholder}
                      value={backData[f.key] ?? ""}
                      onChange={(e) =>
                        setBackData((d) => ({ ...d, [f.key]: e.target.value }))
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
              {icarte.addModal.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              <Plus className="h-3.5 w-3.5" />
              {pending ? icarte.addModal.creating : icarte.addModal.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CARD_TEMPLATES }
