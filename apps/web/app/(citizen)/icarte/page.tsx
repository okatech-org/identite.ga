"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { ChevronRight, CreditCard, Eye, EyeOff, Palette, Wallet } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"

import {
  CARD_GRADIENTS,
  CARD_TEMPLATES,
  type CardTemplate,
} from "./_content/cards"
import { icarte } from "./_content/fr"
import { AddCardModal } from "./_components/add-card-modal"
import { CardArtIcon } from "./_components/card-art-icon"
import { CardDetailSheet } from "./_components/card-detail-sheet"
import { CardRow } from "./_components/card-row"
import {
  CustomCardModal,
} from "./_components/custom-card-modal"
import {
  EditCardModal,
  type EditCardInput,
} from "./_components/edit-card-modal"
import {
  FeaturedReorderGrid,
  type FeaturedCard,
} from "./_components/featured-reorder-grid"

type WalletCard = {
  _id: Id<"walletCard">
  name: string
  subtitle?: string
  gradient: string
  iconKey: string
  isOfficialStyle: boolean
  data: Record<string, string>
  backData?: Record<string, string>
  featured: boolean
  position: number
}

export default function IcartePage() {
  const wallet = useQuery(api.wallet.listMine, {})
  const setFeatured = useMutation(api.wallet.setFeatured)
  const removeCard = useMutation(api.wallet.remove)
  const reorderFeatured = useMutation(api.wallet.reorderFeatured)

  // Modals state
  const [addTemplate, setAddTemplate] = React.useState<CardTemplate | null>(
    null,
  )
  const [customOpen, setCustomOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<EditCardInput | null>(null)
  const [detailId, setDetailId] = React.useState<Id<"walletCard"> | null>(null)

  if (wallet === undefined) {
    return (
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }

  const cards = (wallet.cards as WalletCard[]) ?? []
  const featured = cards.filter((c) => c.featured)
  const others = cards.filter((c) => !c.featured)
  const limit = wallet.featuredLimit
  const featuredCount = wallet.featuredCount
  const atMax = featuredCount >= limit

  const detailCard = detailId
    ? cards.find((c) => c._id === detailId) ?? null
    : null

  async function handleToggleFeatured(
    cardId: Id<"walletCard">,
    nextFeatured: boolean,
  ) {
    try {
      await setFeatured({ cardId, featured: nextFeatured })
      toast.success(
        nextFeatured
          ? icarte.toast.featuredAdded
          : icarte.toast.featuredRemoved,
      )
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : icarte.toast.featuredError
      toast.error(msg)
    }
  }

  async function handleRemove(cardId: Id<"walletCard">, name: string) {
    if (!window.confirm(icarte.confirmRemove(name))) return
    try {
      await removeCard({ cardId })
      toast.success(icarte.toast.cardRemoved)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : icarte.toast.removeError
      toast.error(msg)
    }
  }

  async function handleReorderCommit(orderedIds: Id<"walletCard">[]) {
    try {
      await reorderFeatured({ orderedIds })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : icarte.toast.reorderError
      toast.error(msg)
    }
  }

  function handleOpenDetail(cardId: Id<"walletCard">) {
    const c = cards.find((card) => card._id === cardId)
    if (!c) return
    if (c.isOfficialStyle) {
      // Spec §1.4 : carte officielle (CNAMGS) → navigation vers la page
      // dédiée. Cette route n'existe pas encore.
      toast.info(icarte.toast.cnamgsComingSoon)
      return
    }
    setDetailId(cardId)
  }

  function handleEditFromRow(card: WalletCard) {
    setEditing({
      _id: card._id,
      name: card.name,
      subtitle: card.subtitle,
      gradient: card.gradient,
      iconKey: card.iconKey,
      data: card.data,
      backData: card.backData,
    })
  }

  function handleEditFromDetail() {
    if (!detailCard) return
    setEditing({
      _id: detailCard._id,
      name: detailCard.name,
      subtitle: detailCard.subtitle,
      gradient: detailCard.gradient,
      iconKey: detailCard.iconKey,
      data: detailCard.data,
      backData: detailCard.backData,
    })
    setDetailId(null)
  }

  const featuredForGrid: FeaturedCard[] = featured.map((c) => ({
    _id: c._id,
    name: c.name,
    subtitle: c.subtitle,
    gradient: c.gradient,
    iconKey: c.iconKey,
    isOfficialStyle: c.isOfficialStyle,
  }))

  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex w-full flex-wrap items-center gap-3 px-5 py-4 md:px-4 md:py-5 lg:px-20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight md:text-xl">
                {icarte.title}
              </h1>
              <span className="inline-flex items-center rounded-full bg-idn-green-soft px-2.5 py-0.5 text-[11px] font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
                {icarte.featuredPill(featuredCount, limit)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {icarte.subtitle}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">
              <Wallet className="h-3.5 w-3.5" />
              {icarte.viewProfile}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Contenu — grid 2 colonnes (desktop) / empilé (mobile) */}
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Colonne gauche — featured */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                <Eye className="h-3.5 w-3.5 text-idn-green" />
                {icarte.sections.featured}
              </h2>
              {featured.length > 1 ? (
                <span className="text-[10px] text-muted-foreground">
                  {icarte.sections.featuredHint}
                </span>
              ) : null}
            </div>
            <FeaturedReorderGrid
              cards={featuredForGrid}
              onReorderCommit={handleReorderCommit}
              onRemoveFromProfile={(id) => handleToggleFeatured(id, false)}
              onOpen={handleOpenDetail}
            />
          </div>

          {/* Colonne droite — autres + ajouter */}
          <div className="flex flex-col gap-5">
            {/* Liste autres */}
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                  <EyeOff className="h-3.5 w-3.5" />
                  {icarte.sections.others}
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {icarte.sections.othersCount(others.length)}
                </span>
              </div>

              {others.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-8 text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">
                    {icarte.emptyOthers.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {icarte.emptyOthers.sub}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card px-2.5">
                  {others.map((c, i) => (
                    <div
                      key={c._id}
                      className={
                        i === others.length - 1
                          ? ""
                          : "border-b border-border/50"
                      }
                    >
                      <CardRow
                        card={{
                          name: c.name,
                          subtitle: c.subtitle,
                          gradient: c.gradient,
                          iconKey: c.iconKey,
                          isOfficialStyle: c.isOfficialStyle,
                          featured: c.featured,
                        }}
                        atMax={atMax}
                        onOpen={() => handleOpenDetail(c._id)}
                        onEdit={() => handleEditFromRow(c)}
                        onToggleFeatured={() =>
                          handleToggleFeatured(c._id, true)
                        }
                        onRemove={() => handleRemove(c._id, c.name)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bloc Ajouter */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                {icarte.sections.add}
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {CARD_TEMPLATES.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setAddTemplate(tp)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={`flex h-7 w-10 items-center justify-center rounded-md bg-gradient-to-br text-white ${CARD_GRADIENTS[tp.grad]}`}
                    >
                      <CardArtIcon iconKey={tp.iconKey} size={13} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {tp.label}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-[#C5E0CC] bg-idn-green-soft px-3 py-2.5 text-idn-green transition-colors hover:bg-idn-green-soft/80 dark:border-[#1B3F2A] dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                >
                  <Palette className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    {icarte.actions.customLabel}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals & Sheet */}
      <AddCardModal
        open={addTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setAddTemplate(null)
        }}
        template={addTemplate}
      />
      <CustomCardModal open={customOpen} onOpenChange={setCustomOpen} />
      <EditCardModal
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        card={editing}
      />
      <CardDetailSheet
        open={detailCard !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        card={detailCard}
        onEdit={handleEditFromDetail}
        onDelete={() => {
          if (!detailCard) return
          void (async () => {
            await handleRemove(detailCard._id, detailCard.name)
            setDetailId(null)
          })()
        }}
      />
    </>
  )
}
