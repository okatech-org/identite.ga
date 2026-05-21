"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { CheckCircle2, FileUp, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet"

import { FOLDERS, type VaultFolderId } from "../_content/folders"
import { idoc } from "../_content/fr"

type AddDocumentSheetProps = {
  open: boolean
  /** Dossier préselectionné si l'utilisateur ouvre depuis une vue dossier. */
  initialFolder: VaultFolderId | null
  onClose: () => void
}

type Step = "select" | "preview" | "success"

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED_MIME = "application/pdf,image/png,image/jpeg"
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Bottom-sheet d'ajout de document iDocument.
 *
 * Flux : `select` → `preview` → `success`.
 *   1. L'utilisateur choisit un fichier et un dossier de destination.
 *   2. Il confirme le nom et une éventuelle date d'expiration ; le fichier
 *      est chiffré côté client avec une DEK aléatoire, la DEK est wrappée
 *      par la MVK en mémoire, puis le ciphertext est uploadé sur Convex
 *      Storage. La métadata (nom, mime…) reste chiffrée — le serveur ne
 *      voit jamais le nom en clair.
 *   3. Écran de succès avec deux CTAs : ajouter un autre / fermer.
 */
export function AddDocumentSheet({
  open,
  initialFolder,
  onClose,
}: AddDocumentSheetProps) {
  const generateUploadUrl = useMutation(api.idoc.generateUploadUrl)
  const createItem = useMutation(api.idoc.create)

  const [step, setStep] = React.useState<Step>("select")
  const [file, setFile] = React.useState<File | null>(null)
  const [folderId, setFolderId] = React.useState<VaultFolderId>(
    initialFolder ?? "identity",
  )
  const [name, setName] = React.useState("")
  const [expiration, setExpiration] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Réinitialise l'état complet quand le sheet se ferme — évite que
  // le user retrouve un brouillon à la prochaine ouverture.
  const reset = React.useCallback(() => {
    setStep("select")
    setFile(null)
    setName("")
    setExpiration("")
    setError(null)
    setSubmitting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  // Resync le dossier par défaut quand le sheet (ré)ouvre depuis une
  // autre vue dossier — sans écraser un choix manuel pendant l'usage.
  React.useEffect(() => {
    if (open) setFolderId(initialFolder ?? "identity")
  }, [open, initialFolder])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose()
      reset()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    if (picked.size > MAX_BYTES) {
      setError(idoc.add.errors.tooLarge)
      e.target.value = ""
      return
    }
    setFile(picked)
    setName(stripExtension(picked.name))
    setError(null)
    setStep("preview")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!file) {
      setError(idoc.add.errors.pickRequired)
      return
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(idoc.add.errors.nameRequired)
      return
    }
    const trimmedExp = expiration.trim()
    if (trimmedExp && !DATE_REGEX.test(trimmedExp)) {
      setError(idoc.add.errors.invalidDate)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const uploadUrl = await generateUploadUrl()
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!uploadRes.ok) throw new Error("upload failed")
      const { storageId } = (await uploadRes.json()) as { storageId: string }

      await createItem({
        folderId,
        contentRef: storageId as never,
        name: trimmedName,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileType: detectFileType(file.type),
        fileSize: file.size,
        expirationDate: trimmedExp || undefined,
      })

      toast.success(idoc.toasts.documentAdded)
      setStep("success")
    } catch (err) {
      console.warn("[idoc] upload failed:", err)
      setError(idoc.add.errors.uploadFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddAnother = () => {
    setStep("select")
    setFile(null)
    setName("")
    setExpiration("")
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto sm:mx-auto sm:max-w-2xl"
      >
        {step === "select" ? (
          <>
            <SheetHeader>
              <SheetTitle>{idoc.add.select.title}</SheetTitle>
              <SheetDescription>{idoc.add.select.sub}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-6 pb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME}
                onChange={handleFileChange}
                className="sr-only"
                id="idoc-add-file"
              />
              <label
                htmlFor="idoc-add-file"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:bg-muted/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileUp className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {idoc.add.select.pickFile}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {idoc.add.select.pickFileSub}
                  </p>
                </div>
              </label>

              <p className="text-center text-xs italic text-muted-foreground">
                {idoc.add.select.cameraOnlyMobile}
              </p>

              <div className="space-y-1.5">
                <Label
                  htmlFor="idoc-add-folder"
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {idoc.add.select.destinationLabel}
                </Label>
                <Select
                  value={folderId}
                  onValueChange={(v) => setFolderId(v as VaultFolderId)}
                >
                  <SelectTrigger id="idoc-add-folder" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDERS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {idoc.add.select.destinationHint}
                </p>
              </div>

              {error ? (
                <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
                  {error}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {step === "preview" && file ? (
          <form onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>{idoc.add.preview.title}</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 px-6 pb-6">
              <div className="flex items-start gap-3 rounded-xl border border-[#e9d5ff] bg-gradient-to-r from-purple-50 to-violet-50 px-3.5 py-3 text-xs dark:border-[#3a1f5a] dark:from-purple-950/30 dark:to-violet-950/30">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a855f7]" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#a855f7]">
                    {idoc.add.preview.aiDetectionTitle}
                  </p>
                  <p className="text-muted-foreground">
                    {idoc.add.preview.aiDetectionBody(
                      humanizeFileType(file.type),
                      folderLabel(folderId),
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="idoc-add-name">
                  {idoc.add.preview.nameLabel}
                </Label>
                <Input
                  id="idoc-add-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="idoc-add-exp">
                  {idoc.add.preview.expirationLabel}
                </Label>
                <Input
                  id="idoc-add-exp"
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  placeholder={idoc.add.preview.expirationPlaceholder}
                  disabled={submitting}
                />
              </div>

              {error ? (
                <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("select")
                    setError(null)
                  }}
                  disabled={submitting}
                >
                  {idoc.add.preview.cancel}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? idoc.add.preview.encrypting
                    : idoc.add.preview.submit}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {step === "success" ? (
          <div className="px-6 pb-6">
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <SheetTitle className="text-xl">
                  {idoc.add.success.title}
                </SheetTitle>
                <SheetDescription>{idoc.add.success.sub}</SheetDescription>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAnother}
              >
                {idoc.add.success.addAnother}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onClose()
                  reset()
                }}
              >
                {idoc.add.success.backToList}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot > 0 ? filename.slice(0, dot) : filename
}

function detectFileType(mime: string): "pdf" | "image" | "other" {
  if (mime === "application/pdf") return "pdf"
  if (mime.startsWith("image/")) return "image"
  return "other"
}

function humanizeFileType(mime: string): string {
  if (mime === "application/pdf") return "PDF"
  if (mime === "image/png") return "PNG"
  if (mime === "image/jpeg") return "JPEG"
  if (mime.startsWith("image/")) return "Image"
  return "Fichier"
}

function folderLabel(id: VaultFolderId): string {
  return FOLDERS.find((f) => f.id === id)?.label ?? id
}
