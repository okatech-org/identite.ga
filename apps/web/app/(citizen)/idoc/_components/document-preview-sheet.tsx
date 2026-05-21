"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { Download, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@repo/ui/components/sheet"

import {
  getFolder,
  NEVER_EXPIRES,
  type VaultFolderId,
} from "../_content/folders"
import { idoc } from "../_content/fr"

type DocumentPreviewSheetProps = {
  open: boolean
  itemId: Id<"documentItem"> | null
  onClose: () => void
}

/**
 * Bottom-sheet de prévisualisation d'un document.
 *
 * Le blob est stocké en clair dans Convex Storage, on utilise l'URL
 * signée pour l'aperçu inline (image/PDF) et le download. La suppression
 * passe par `idoc.remove` (soft delete).
 */
export function DocumentPreviewSheet({
  open,
  itemId,
  onClose,
}: DocumentPreviewSheetProps) {
  const item = useQuery(api.idoc.get, itemId ? { itemId } : "skip")
  const downloadUrl = useQuery(
    api.idoc.getDownloadUrl,
    itemId ? { itemId } : "skip",
  )
  const removeItem = useMutation(api.idoc.remove)

  const [confirming, setConfirming] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    setConfirming(false)
  }, [itemId])

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose()
  }

  const handleDownload = () => {
    if (!downloadUrl || !item) return
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = item.originalName || item.name || "document"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleConfirmDelete = async () => {
    if (!itemId || deleting) return
    setDeleting(true)
    try {
      await removeItem({ itemId })
      toast.success(idoc.toasts.documentDeleted)
      onClose()
    } catch (err) {
      console.warn("[idoc] delete failed:", err)
      toast.error(idoc.toasts.deleteFailed)
    } finally {
      setDeleting(false)
    }
  }

  const loading = item === undefined
  const notFound = item === null
  const ready = !!item
  const name = item?.name?.trim() ? item.name : "—"

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto sm:mx-auto sm:max-w-3xl"
      >
        {loading ? (
          <div className="px-6 py-12 text-center">
            <SheetTitle className="sr-only">{idoc.preview.loading}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {idoc.preview.loading}
            </p>
          </div>
        ) : null}

        {notFound ? (
          <div className="px-6 py-12 text-center">
            <SheetTitle className="text-base">
              {idoc.preview.notFound}
            </SheetTitle>
          </div>
        ) : null}

        {ready && item ? (
          confirming ? (
            <ConfirmDeleteView
              name={name}
              deleting={deleting}
              onCancel={() => setConfirming(false)}
              onConfirm={handleConfirmDelete}
            />
          ) : (
            <PreviewView
              item={item}
              downloadUrl={downloadUrl ?? null}
              name={name}
              onDownload={handleDownload}
              onDelete={() => setConfirming(true)}
            />
          )
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────

type DocItem = {
  _id: Id<"documentItem">
  folderId: VaultFolderId
  name: string
  originalName?: string
  mimeType: string
  fileType: "pdf" | "image" | "other"
  fileSize: number
  status: "pending" | "verified" | "rejected" | "expired"
  expirationDate?: string
  side?: "front" | "back"
  createdAt: number
}

function PreviewView({
  item,
  downloadUrl,
  name,
  onDownload,
  onDelete,
}: {
  item: DocItem
  downloadUrl: string | null
  name: string
  onDownload: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6">
      <SheetTitle className="pr-10 text-lg leading-tight">{name}</SheetTitle>

      <PreviewArea fileType={item.fileType} url={downloadUrl} name={name} />

      <DetailsSection item={item} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {idoc.preview.delete}
        </Button>
        <Button type="button" onClick={onDownload} disabled={!downloadUrl}>
          <Download className="h-4 w-4" />
          {idoc.preview.download}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function PreviewArea({
  fileType,
  url,
  name,
}: {
  fileType: DocItem["fileType"]
  url: string | null
  name: string
}) {
  if (!url) return null
  if (fileType === "image") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          className="mx-auto max-h-[55vh] w-auto"
        />
      </div>
    )
  }
  if (fileType === "pdf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        <embed src={url} type="application/pdf" className="h-[55vh] w-full" />
      </div>
    )
  }
  return (
    <div className="flex aspect-[5/3] items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
      <FileText className="h-10 w-10" strokeWidth={1.5} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function DetailsSection({ item }: { item: DocItem }) {
  const folder = getFolder(item.folderId)
  const neverExpires = NEVER_EXPIRES.has(item.folderId)

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {idoc.preview.sectionDetails}
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Row label={idoc.preview.fieldFolder} value={folder.label} />
        <Row label={idoc.preview.fieldType} value={humanizeFileType(item)} />
        <Row label={idoc.preview.fieldSize} value={formatBytes(item.fileSize)} />
        <Row
          label={idoc.preview.fieldCreatedAt}
          value={formatDateLong(item.createdAt)}
        />
        <Row label={idoc.preview.fieldStatus} value={STATUS_LABEL[item.status]} />
        <Row
          label={idoc.preview.fieldExpiration}
          value={
            neverExpires || !item.expirationDate
              ? idoc.folder.neverExpires
              : formatDateLong(Date.parse(item.expirationDate))
          }
        />
        {item.side ? (
          <Row
            label={idoc.preview.fieldSide}
            value={
              item.side === "front"
                ? idoc.preview.sideFront
                : idoc.preview.sideBack
            }
          />
        ) : null}
        <Row
          label={idoc.preview.fieldSource}
          value={idoc.preview.sourceUpload}
        />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 last:border-b-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-right text-foreground">{value}</dd>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function ConfirmDeleteView({
  name,
  deleting,
  onCancel,
  onConfirm,
}: {
  name: string
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-2">
      <div className="flex h-12 w-12 items-center justify-center self-center rounded-full bg-destructive/10 text-destructive">
        <Trash2 className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 text-center">
        <SheetTitle className="text-lg">
          {idoc.preview.confirmDeleteTitle}
        </SheetTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {idoc.preview.confirmDeleteBody(name)}
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={deleting}
        >
          {idoc.preview.confirmCancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={deleting}
        >
          {idoc.preview.confirmDelete}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DocItem["status"], string> = {
  verified: idoc.folder.status.verified,
  pending: idoc.folder.status.pending,
  rejected: idoc.folder.status.rejected,
  expired: idoc.folder.status.expired,
}

function humanizeFileType(item: DocItem): string {
  const mime = item.mimeType?.toLowerCase() ?? ""
  if (mime === "application/pdf" || item.fileType === "pdf") return "PDF"
  if (mime === "image/png") return "PNG"
  if (mime === "image/jpeg") return "JPEG"
  if (item.fileType === "image") return "Image"
  return "Fichier"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

function formatDateLong(timestamp: number): string {
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
