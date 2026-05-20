"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import {
  Download,
  FileText,
  Lock,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@repo/ui/components/sheet"

import { decryptFile, decryptMetadata } from "@/lib/vault-crypto"

import {
  getFolder,
  NEVER_EXPIRES,
  type VaultFolderId,
} from "../_content/folders"
import { idoc } from "../_content/fr"
import { useVault } from "../_hooks/use-vault"

type DocumentPreviewSheetProps = {
  open: boolean
  itemId: Id<"vaultItem"> | null
  onClose: () => void
}

/**
 * Bottom-sheet de prévisualisation d'un document du coffre.
 *
 * - Fetch le ciphertext via une URL signée Convex Storage.
 * - Déchiffre la DEK avec la MVK en mémoire, puis le payload + les
 *   métadonnées avec la DEK. Tout reste côté client.
 * - Affiche un aperçu inline (image / PDF) ou un placeholder selon le
 *   `fileType`. Le téléchargement réutilise l'object-URL généré pour
 *   l'aperçu.
 * - Suppression : confirmation in-sheet, puis mutation `vault.items.remove`
 *   (soft-delete serveur + suppression du blob Convex Storage).
 */
export function DocumentPreviewSheet({
  open,
  itemId,
  onClose,
}: DocumentPreviewSheetProps) {
  const { status } = useVault()
  const item = useQuery(
    api.vault.items.get,
    itemId ? { itemId } : "skip",
  )
  const contentUrl = useQuery(
    api.vault.items.contentUrl,
    itemId ? { itemId } : "skip",
  )
  const removeItem = useMutation(api.vault.items.remove)

  const [metadata, setMetadata] =
    React.useState<Record<string, unknown> | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [decryptError, setDecryptError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  // Reset du buffer déchiffré quand on change d'item ou qu'on ferme.
  React.useEffect(() => {
    setMetadata(null)
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setDecryptError(null)
    setConfirming(false)
  }, [itemId])

  // Déchiffrement : metadata + payload. S'exécute dès que l'item, l'URL
  // signée et la MVK sont disponibles.
  React.useEffect(() => {
    if (!open || !item || !contentUrl || status.phase !== "unlocked") return
    let cancelled = false
    void (async () => {
      try {
        const meta = await decryptMetadata(
          status.mvk,
          item.wrappedDek,
          item.metaIv,
          item.encryptedMetadata,
        )
        if (cancelled) return
        setMetadata(meta)

        const res = await fetch(contentUrl)
        if (!res.ok) throw new Error("fetch failed")
        const ciphertext = new Uint8Array(await res.arrayBuffer())
        const plaintext = await decryptFile(
          status.mvk,
          ciphertext,
          item.wrappedDek,
          item.iv,
        )
        if (cancelled) return

        const mime =
          typeof meta.mime === "string" && meta.mime
            ? (meta.mime as string)
            : guessMime(item.fileType)
        // Copie dans un ArrayBuffer dédié pour éviter les soucis de
        // SharedArrayBuffer sur les TypedArray retournés par WebCrypto.
        const buf = new ArrayBuffer(plaintext.byteLength)
        new Uint8Array(buf).set(plaintext)
        const blob = new Blob([buf], { type: mime })
        const url = URL.createObjectURL(blob)
        setObjectUrl(url)
      } catch (err) {
        if (!cancelled) {
          console.warn("[idoc] decrypt failed:", err)
          setDecryptError(idoc.preview.notFound)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, item, contentUrl, status])

  // Cleanup à l'unmount.
  React.useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose()
  }

  const handleDownload = () => {
    if (!objectUrl) return
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = pickDownloadName(metadata)
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

  // ───────────────────────────────────────────────────────────────────────
  // Rendu

  const loading = item === undefined
  const notFound = item === null
  const ready = !!item && !!objectUrl && !decryptError
  const name =
    typeof metadata?.name === "string" && metadata.name.trim()
      ? (metadata.name as string)
      : "—"

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto sm:mx-auto sm:max-w-3xl"
      >
        {loading || (!notFound && !ready && !decryptError) ? (
          <div className="px-6 py-12 text-center">
            <SheetTitle className="sr-only">{idoc.preview.loading}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {idoc.preview.loading}
            </p>
          </div>
        ) : null}

        {notFound || decryptError ? (
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
              metadata={metadata}
              objectUrl={objectUrl}
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

type VaultItem = {
  _id: Id<"vaultItem">
  folderId: VaultFolderId
  fileType: "pdf" | "image" | "other"
  fileSize: number
  status: "pending" | "verified" | "rejected" | "expired"
  expirationDate?: string
  side?: "front" | "back"
  createdAt: number
}

function PreviewView({
  item,
  metadata,
  objectUrl,
  name,
  onDownload,
  onDelete,
}: {
  item: VaultItem
  metadata: Record<string, unknown> | null
  objectUrl: string | null
  name: string
  onDownload: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6">
      <SheetTitle className="pr-10 text-lg leading-tight">{name}</SheetTitle>

      <PreviewArea fileType={item.fileType} objectUrl={objectUrl} name={name} />

      <div className="flex items-center gap-2 self-start rounded-full border border-idn-green/40 bg-idn-green-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
        <Lock className="h-3 w-3" />
        {idoc.preview.e2eBadge}
      </div>

      <DetailsSection item={item} metadata={metadata} />

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
        <Button type="button" onClick={onDownload}>
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
  objectUrl,
  name,
}: {
  fileType: VaultItem["fileType"]
  objectUrl: string | null
  name: string
}) {
  if (!objectUrl) return null
  if (fileType === "image") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={objectUrl}
          alt={name}
          className="mx-auto max-h-[55vh] w-auto"
        />
      </div>
    )
  }
  if (fileType === "pdf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        <embed
          src={objectUrl}
          type="application/pdf"
          className="h-[55vh] w-full"
        />
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

function DetailsSection({
  item,
  metadata,
}: {
  item: VaultItem
  metadata: Record<string, unknown> | null
}) {
  const folder = getFolder(item.folderId)
  const neverExpires = NEVER_EXPIRES.has(item.folderId)

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {idoc.preview.sectionDetails}
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Row label={idoc.preview.fieldFolder} value={folder.label} />
        <Row
          label={idoc.preview.fieldType}
          value={humanizeFileType(item.fileType, metadata)}
        />
        <Row
          label={idoc.preview.fieldSize}
          value={formatBytes(item.fileSize)}
        />
        <Row
          label={idoc.preview.fieldCreatedAt}
          value={formatDateLong(item.createdAt)}
        />
        <Row
          label={idoc.preview.fieldStatus}
          value={STATUS_LABEL[item.status]}
        />
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

const STATUS_LABEL: Record<VaultItem["status"], string> = {
  verified: idoc.folder.status.verified,
  pending: idoc.folder.status.pending,
  rejected: idoc.folder.status.rejected,
  expired: idoc.folder.status.expired,
}

function guessMime(fileType: VaultItem["fileType"]): string {
  if (fileType === "pdf") return "application/pdf"
  if (fileType === "image") return "image/png"
  return "application/octet-stream"
}

function humanizeFileType(
  fileType: VaultItem["fileType"],
  metadata: Record<string, unknown> | null,
): string {
  const mime =
    typeof metadata?.mime === "string"
      ? (metadata.mime as string).toLowerCase()
      : ""
  if (mime === "application/pdf" || fileType === "pdf") return "PDF"
  if (mime === "image/png") return "PNG"
  if (mime === "image/jpeg") return "JPEG"
  if (fileType === "image") return "Image"
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

function pickDownloadName(metadata: Record<string, unknown> | null): string {
  const original =
    typeof metadata?.originalName === "string"
      ? (metadata.originalName as string).trim()
      : ""
  if (original) return original
  const name =
    typeof metadata?.name === "string"
      ? (metadata.name as string).trim()
      : ""
  return name || "document"
}
