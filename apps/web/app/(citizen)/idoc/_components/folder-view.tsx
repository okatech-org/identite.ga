"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Plus,
  ShieldCheck,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { idoc } from "../_content/fr"
import {
  getFolder,
  NEVER_EXPIRES,
  type VaultFolderId,
} from "../_content/folders"

type FolderViewProps = {
  slug: VaultFolderId
  confidential: boolean
  onBack: () => void
  onOpenAdd: () => void
  onOpenDoc: (itemId: Id<"documentItem">) => void
}

/**
 * Vue d'un dossier iDocument — rendue à la place de la grille d'accueil
 * quand `?folder=<slug>` est présent. La page parente reste montée :
 * le vault et l'état local sont préservés.
 *
 * Les documents sont affichés en grille de vignettes (cf. SPECS §3) :
 * preview gradient du dossier, badge RECTO/VERSO si applicable, badge
 * statut, footer avec nom + label d'expiration.
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
  const items = useQuery(api.idoc.listByFolder, { folderId: slug })

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[5/6] animate-pulse rounded-2xl bg-secondary"
              />
            ))}
          </div>
        ) : empty ? (
          <EmptyState onOpenAdd={onOpenAdd} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {items?.map((item) => (
              <DocumentCard
                key={item._id}
                item={item}
                folderGradient={folder.gradient}
                confidential={confidential}
                neverExpires={neverExpires}
                onOpen={() => onOpenDoc(item._id)}
              />
            ))}
          </div>
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

type DocItem = {
  _id: Id<"documentItem">
  name: string
  status: "pending" | "verified" | "rejected" | "expired"
  fileType: "pdf" | "image" | "other"
  expirationDate?: string
  side?: "front" | "back"
}

function DocumentCard({
  item,
  folderGradient,
  confidential,
  neverExpires,
  onOpen,
}: {
  item: DocItem
  folderGradient: string
  confidential: boolean
  neverExpires: boolean
  onOpen: () => void
}) {
  const name = item.name?.trim() ? item.name : "—"
  const statusInfo = STATUS_STYLES[item.status]

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Preview area */}
      <div
        className={cn(
          "relative flex aspect-[5/4] items-center justify-center bg-gradient-to-br",
          folderGradient,
        )}
        aria-hidden="true"
      >
        <DocPreview fileType={item.fileType} />

        {/* Badge RECTO/VERSO */}
        {item.side ? (
          <span className="absolute left-2 top-2 rounded-md bg-foreground/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
            {item.side === "front"
              ? idoc.folder.sideFront
              : idoc.folder.sideBack}
          </span>
        ) : null}

        {/* Badge shield statut */}
        {statusInfo.shieldClass ? (
          <span
            className={cn(
              "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background",
              statusInfo.shieldClass,
            )}
          >
            <ShieldCheck className="h-3 w-3" />
          </span>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <p
          className={cn(
            "truncate text-sm font-semibold text-foreground",
            confidential && "blur-sm select-none",
          )}
        >
          {name}
        </p>
        <div className="flex items-center gap-1.5 text-[11px]">
          {statusInfo.label ? (
            <span
              className={cn(
                "shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 font-bold uppercase tracking-wider",
                statusInfo.badgeClass,
              )}
            >
              {statusInfo.label}
            </span>
          ) : null}
          <span className="truncate text-muted-foreground">
            {expirationLabel(item.expirationDate, neverExpires)}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function DocPreview({ fileType }: { fileType: DocItem["fileType"] }) {
  if (fileType === "pdf") {
    return (
      <span className="flex h-14 w-12 items-center justify-center rounded-sm bg-white text-[10px] font-bold tracking-wider text-foreground shadow-sm">
        PDF
      </span>
    )
  }
  if (fileType === "image") {
    return <ImageIcon className="h-10 w-10 text-white/90" strokeWidth={1.5} />
  }
  return <FileText className="h-10 w-10 text-white/90" strokeWidth={1.5} />
}

// ─────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  DocItem["status"],
  {
    label: string | null
    badgeClass: string
    shieldClass: string | null
  }
> = {
  verified: {
    label: idoc.folder.status.verified,
    badgeClass:
      "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark",
    shieldClass: "bg-idn-green text-white",
  },
  pending: {
    label: idoc.folder.status.pending,
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    shieldClass: "bg-amber-500 text-white",
  },
  rejected: {
    label: idoc.folder.status.rejected,
    badgeClass: "bg-destructive/15 text-destructive",
    shieldClass: "bg-destructive text-white",
  },
  expired: {
    label: idoc.folder.status.expired,
    badgeClass: "bg-destructive/15 text-destructive",
    shieldClass: "bg-destructive text-white",
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
  return idoc.folder.expiresLabel(humanizeDuration(diffDays))
}

function humanizeDuration(days: number): string {
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30))
    return `${months} mois`
  }
  const years = Math.round(days / 365)
  return `${years} an${years > 1 ? "s" : ""}`
}
