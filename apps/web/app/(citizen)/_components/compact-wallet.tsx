"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { ChevronRight, Wallet } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { cn } from "@repo/ui/lib/utils"

import { CardArtIcon } from "../icarte/_components/card-art-icon"

/**
 * Preview compacte des cartes du profil pour le dashboard (cf spec §1.10
 * « Stack Apple Wallet »). Affiche les cartes featured en stack légèrement
 * décalées, jusqu'à 6 cartes (= limite featured). Clic global → /icarte.
 *
 * Si l'utilisateur n'a aucune carte featured, on n'affiche rien (le module
 * iCarte de la grille reste le CTA d'entrée).
 */
export function CompactWallet({ className }: { className?: string }) {
  const wallet = useQuery(api.wallet.listMine, {})

  if (wallet === undefined) {
    return (
      <div
        className={cn(
          "h-[260px] animate-pulse rounded-2xl bg-secondary",
          className,
        )}
      />
    )
  }

  const featured = wallet.cards.filter((c) => c.featured)
  if (featured.length === 0) return null

  // Hauteur visuelle : 1ère carte ~140px + 14px × (N-1) cartes décalées
  const stackHeight = 140 + Math.max(0, featured.length - 1) * 14

  return (
    <Link
      href="/icarte"
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">Mes cartes</span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {featured.length}/{wallet.featuredLimit}
        </span>
      </div>

      <div
        className="relative mx-auto w-full max-w-[280px]"
        style={{ height: stackHeight }}
      >
        {featured.map((card, i) => {
          const z = featured.length - i
          const top = i * 14
          return (
            <div
              key={card._id}
              className={cn(
                "absolute inset-x-0 aspect-[85/55] overflow-hidden rounded-xl p-3 shadow-md transition-transform group-hover:-translate-y-0.5",
                card.isOfficialStyle
                  ? "border border-border bg-white"
                  : `bg-gradient-to-br ${card.gradient}`,
              )}
              style={{ top, zIndex: z }}
            >
              <div
                className={cn(
                  "flex items-center justify-between",
                  card.isOfficialStyle ? "text-idn-green" : "text-white",
                )}
              >
                <CardArtIcon iconKey={card.iconKey} size={16} />
                <span
                  className={cn(
                    "truncate text-[10px] font-semibold tracking-wide",
                    card.isOfficialStyle
                      ? "text-idn-green"
                      : "text-white/85",
                  )}
                >
                  {card.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-idn-green dark:text-idn-green-on-dark">
        Voir toutes mes cartes
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
