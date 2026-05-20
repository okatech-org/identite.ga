"use client"

import * as React from "react"
import { Reorder } from "framer-motion"
import { Wallet } from "lucide-react"

import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { icarte } from "../_content/fr"
import { MiniCard, type MiniCardData } from "./mini-card"

export type FeaturedCard = MiniCardData & { _id: Id<"walletCard"> }

/**
 * Grille réordonnable des cartes featured. Utilise `framer-motion` Reorder
 * (cf spec §1.4). Le drop déclenche `onReorderCommit(orderedIds)` qui
 * appelle `api.wallet.reorderFeatured`. Les modifications d'ordre
 * intermédiaires (avant drop) sont locales.
 */
export function FeaturedReorderGrid({
  cards,
  onReorderCommit,
  onRemoveFromProfile,
  onOpen,
}: {
  cards: FeaturedCard[]
  onReorderCommit: (orderedIds: Id<"walletCard">[]) => void
  onRemoveFromProfile: (cardId: Id<"walletCard">) => void
  onOpen: (cardId: Id<"walletCard">) => void
}) {
  const [local, setLocal] = React.useState(cards)
  const initialOrderRef = React.useRef<string>(cards.map((c) => c._id).join(","))

  // Resync avec les props quand le serveur renvoie une nouvelle liste —
  // mais uniquement si on n'est pas en train de drag (sinon UI fight).
  React.useEffect(() => {
    const incoming = cards.map((c) => c._id).join(",")
    if (incoming !== initialOrderRef.current) {
      setLocal(cards)
      initialOrderRef.current = incoming
    }
  }, [cards])

  function handleReorder(next: FeaturedCard[]) {
    setLocal(next)
  }

  function handleDragEnd() {
    const nextIds = local.map((c) => c._id)
    const prevIds = cards.map((c) => c._id)
    if (nextIds.join(",") === prevIds.join(",")) return
    initialOrderRef.current = nextIds.join(",")
    onReorderCommit(nextIds)
  }

  if (local.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
        <Wallet className="h-9 w-9 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">
          {icarte.emptyFeatured.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {icarte.emptyFeatured.sub}
        </p>
      </div>
    )
  }

  return (
    <Reorder.Group
      axis="y"
      values={local}
      onReorder={handleReorder}
      className="grid grid-cols-2 gap-2.5 list-none p-0 m-0"
    >
      {local.map((card) => (
        <Reorder.Item
          key={card._id}
          value={card}
          onDragEnd={handleDragEnd}
          onTap={() => onOpen(card._id)}
          whileDrag={{
            scale: 1.04,
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            zIndex: 10,
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <MiniCard
            card={card}
            onRemoveFromProfile={() => onRemoveFromProfile(card._id)}
          />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}
