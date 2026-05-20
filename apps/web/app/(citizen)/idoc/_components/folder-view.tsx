"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { ArrowLeft, FileText, Plus } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/badge"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { idoc } from "../_content/fr"
import {
  getFolder,
  NEVER_EXPIRES,
  type VaultFolderId,
} from "../_content/folders"
import { useDecryptedItems } from "../_hooks/use-vault"

type FolderViewProps = {
  slug: VaultFolderId
  confidential: boolean
  onBack: () => void
  onOpenAdd: () => void
  onOpenDoc: (itemId: Id<"vaultItem">) => void
}

/**
 * Vue d'un dossier iDocument — rendue à la place de la grille d'accueil
 * quand `?folder=<slug>` est présent. La page parente reste montée :
 * le vault et l'état local sont préservés.
 *
 * MVP : lecture des items chiffrés + déchiffrement des métadonnées via
 * `useDecryptedItems`. Aperçu (`?doc=<id>`) et ajout (`?add=1`) sont
 * implémentés aux étapes 3/4.
 */
export function FolderView({
  slug,
  confidential,
  onBack,
  onOpenAdd,
  onOpenDoc,
}: FolderViewProps) {
  const folder = getFolder(slug)
  const Icon = folder.icon
  const items = useQuery(api.vault.items.listByFolder, { folderId: slug })
  const decoded = useDecryptedItems(items)

  const loading = items === undefined
  const count = items?.length ?? 0
  const empty = !loading && count === 0
  const neverExpires = NEVER_EXPIRES.has(slug)

  return (
    <>
      {/* Header dossier */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex w-full flex-wrap items-center gap-3 px-5 py-4 md:px-4 md:py-5 lg:px-20">
          <button
            type="button"
            onClick={onBack}
            aria-label={idoc.folder.backToHome}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
              folder.gradient,
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">
              {folder.label}
            </h1>
            <p className="text-xs text-muted-foreground">
              {idoc.folder.subtitle(count)}
            </p>
          </div>
          <Button type="button" size="sm" onClick={onOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            {idoc.home.add}
          </Button>
        </div>
      </section>

      {/* Contenu */}
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[68px] animate-pulse rounded-xl bg-secondary"
              />
            ))}
          </div>
        ) : empty ? (
          <EmptyState onOpenAdd={onOpenAdd} />
        ) : (
          <ul className="space-y-2">
            {decoded?.map((item) => (
              <DocumentRow
                key={item._id}
                item={item}
                confidential={confidential}
                neverExpires={neverExpires}
                onOpen={() => onOpenDoc(item._id)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ onOpenAdd }: { onOpenAdd: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {idoc.folder.emptyTitle}
      </p>
      <Button type="button" size="sm" onClick={onOpenAdd}>
        <Plus className="h-3.5 w-3.5" />
        {idoc.folder.emptyCta}
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

type DecodedItem = {
  _id: Id<"vaultItem">
  status: "pending" | "verified" | "rejected" | "expired"
  expirationDate?: string
  metadata: Record<string, unknown> | null
}

function DocumentRow({
  item,
  confidential,
  neverExpires,
  onOpen,
}: {
  item: DecodedItem
  confidential: boolean
  neverExpires: boolean
  onOpen: () => void
}) {
  const name =
    typeof item.metadata?.name === "string" && item.metadata.name.trim()
      ? (item.metadata.name as string)
      : "—"

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p
            className={cn(
              "truncate text-sm font-medium text-foreground",
              confidential && "blur-sm select-none",
            )}
          >
            {name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {expirationLabel(item.expirationDate, neverExpires)}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </button>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DecodedItem["status"] }) {
  const cfg = STATUS_STYLES[status]
  return (
    <Badge variant="outline" className={cn("shrink-0", cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

const STATUS_STYLES: Record<
  DecodedItem["status"],
  { label: string; className: string }
> = {
  verified: {
    label: idoc.folder.status.verified,
    className:
      "border-idn-green/40 bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark",
  },
  pending: {
    label: idoc.folder.status.pending,
    className: "border-border bg-secondary text-secondary-foreground",
  },
  rejected: {
    label: idoc.folder.status.rejected,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  expired: {
    label: idoc.folder.status.expired,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

// ─────────────────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000

function expirationLabel(
  expirationDate: string | undefined,
  neverExpires: boolean,
): string {
  if (neverExpires || !expirationDate) {
    return idoc.folder.neverExpires
  }
  const ts = Date.parse(expirationDate)
  if (Number.isNaN(ts)) return idoc.folder.neverExpires
  const diffDays = Math.floor((ts - Date.now()) / MS_PER_DAY)
  if (diffDays < 0) return idoc.folder.expiredLabel
  if (diffDays <= 30) return idoc.folder.expiresSoonLabel(diffDays)
  return idoc.folder.expiresLabel(formatDateFr(ts))
}

function formatDateFr(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(timestamp))
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10)
  }
}
