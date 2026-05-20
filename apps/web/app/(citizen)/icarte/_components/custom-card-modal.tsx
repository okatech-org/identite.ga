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
  CUSTOM_COLORS,
  CUSTOM_ICONS,
  type CardIconKey,
  type GradKey,
} from "../_content/cards"
import { icarte } from "../_content/fr"
import { CardArtIcon } from "./card-art-icon"

/**
 * Dialog de création d'une carte personnalisée — nom + couleur + icône
 * (cf spec §1.8).
 */
export function CustomCardModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useMutation(api.wallet.create)
  const [name, setName] = React.useState<string>(
    icarte.customModal.nameDefault,
  )
  const [subtitle, setSubtitle] = React.useState("")
  const [color, setColor] = React.useState<GradKey>("green")
  const [iconKey, setIconKey] = React.useState<CardIconKey>("cc")
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(icarte.customModal.nameDefault)
      setSubtitle("")
      setColor("green")
      setIconKey("cc")
      setPending(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    const trimmed = name.trim()
    if (trimmed.length < 1) {
      toast.error("Donnez un nom à votre carte.")
      return
    }
    setPending(true)
    try {
      await create({
        type: "custom",
        name: trimmed,
        subtitle: subtitle.trim() || undefined,
        gradient: CARD_GRADIENTS[color],
        iconKey,
        isOfficialStyle: false,
        data: {},
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
          <DialogTitle>{icarte.customModal.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Créer une carte personnalisée
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Aperçu live */}
          <div
            className={cn(
              "mx-auto aspect-[85/55] w-[220px] overflow-hidden rounded-xl bg-gradient-to-br p-3 text-white shadow-md transition-colors",
              CARD_GRADIENTS[color],
            )}
          >
            <CardArtIcon iconKey={iconKey} size={18} />
            <div className="mt-5">
              <div className="text-[13px] font-bold leading-tight">
                {name || icarte.customModal.nameDefault}
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
              <Label htmlFor="custom-name">
                {icarte.customModal.nameLabel}
              </Label>
              <Input
                id="custom-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="custom-subtitle">
                {icarte.customModal.subtitleLabel}
              </Label>
              <Input
                id="custom-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                {icarte.customModal.colorLabel}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {CUSTOM_COLORS.map((c) => {
                  const selected = c.id === color
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      title={c.label}
                      aria-label={c.label}
                      aria-pressed={selected}
                      className={cn(
                        "aspect-square rounded-lg bg-gradient-to-br ring-2 transition-all",
                        CARD_GRADIENTS[c.id],
                        selected
                          ? "ring-idn-green ring-offset-2 ring-offset-background"
                          : "ring-transparent",
                      )}
                    />
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                {icarte.customModal.iconLabel}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {CUSTOM_ICONS.map((ic) => {
                  const selected = ic.id === iconKey
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIconKey(ic.id)}
                      title={ic.label}
                      aria-label={ic.label}
                      aria-pressed={selected}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-lg border-2 bg-card transition-colors",
                        selected
                          ? "border-idn-green text-idn-green"
                          : "border-border text-foreground/80 hover:border-foreground/40",
                      )}
                    >
                      <CardArtIcon iconKey={ic.id} size={18} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {icarte.customModal.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              <Plus className="h-3.5 w-3.5" />
              {pending ? icarte.customModal.creating : icarte.customModal.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
