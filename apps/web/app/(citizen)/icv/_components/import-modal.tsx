"use client"

import * as React from "react"
import { useAction, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { FileUp, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Label } from "@repo/ui/components/label"
import { cn } from "@repo/ui/lib/utils"

import { ICV_ACCENT } from "../_content/themes"
import { icv } from "../_content/fr"

const ACCEPTED_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]
const ACCEPT_ATTR = ".pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

/**
 * Modale d'import — flux complet :
 *   1. Sélection du fichier (drop ou parcourir).
 *   2. Choix du mode (new / merge).
 *   3. Upload vers Convex Storage + appel `cv.import.parseAndApply`.
 *   4. Toast succès + navigation vers le CV créé / mis à jour.
 */
export function ImportModal({
  open,
  onOpenChange,
  activeCvId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** CV actif (cible du mode `merge`). Si null, le mode `merge` est désactivé. */
  activeCvId: Id<"citizenCv"> | null
}) {
  const generateUploadUrl = useMutation(api.cv.importInternal.generateUploadUrl)
  const parseAndApply = useAction(api.cv.import.parseAndApply)
  const router = useRouter()

  const [file, setFile] = React.useState<File | null>(null)
  const [mode, setMode] = React.useState<"new" | "merge">("new")
  const [pending, setPending] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setFile(null)
      setMode(activeCvId ? "new" : "new")
      setPending(false)
      setDragOver(false)
    }
  }, [open, activeCvId])

  function handleFile(f: File | null) {
    if (!f) return
    if (!ACCEPTED_MIMES.includes(f.type)) {
      toast.error("Format non supporté.", {
        description: "Utilisez un PDF ou une image (PNG, JPEG, WebP).",
      })
      return
    }
    if (f.size > MAX_SIZE) {
      toast.error("Le fichier dépasse 5 Mo.")
      return
    }
    setFile(f)
  }

  async function handleSubmit() {
    if (!file || pending) return
    if (mode === "merge" && !activeCvId) {
      toast.error("Sélectionnez un CV pour le mode « Fusionner ».")
      return
    }
    setPending(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const upload = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!upload.ok) throw new Error(`Upload échoué (${upload.status}).`)
      const { storageId } = (await upload.json()) as { storageId: string }

      const result = await parseAndApply({
        storageRef: storageId as Id<"_storage">,
        mode,
        targetCvId: mode === "merge" ? activeCvId! : undefined,
        newCvName: mode === "new" ? `CV importé — ${file.name.replace(/\.[^.]+$/, "")}` : undefined,
      })

      toast.success(icv.import.success, { description: icv.import.successDesc })
      onOpenChange(false)
      router.push(`/icv?cv=${result.cvId}`)
    } catch (e) {
      toast.error(icv.import.failed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{icv.import.title}</DialogTitle>
          <DialogDescription>{icv.import.desc}</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0] ?? null)
          }}
          className={cn(
            "mt-4 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-muted/40 p-8 text-center transition-colors",
            dragOver ? "border-pink-400 bg-pink-50/50 dark:bg-pink-950/20" : "border-border",
          )}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "#FCE7F3", color: ICV_ACCENT }}
          >
            <FileUp className="h-7 w-7" />
          </div>
          {file ? (
            <>
              <p className="text-sm font-bold text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </p>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setFile(null)}
                disabled={pending}
              >
                Changer de fichier
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-foreground">
                {icv.import.dropTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {icv.import.dropSpec}
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept={ACCEPT_ATTR}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  disabled={pending}
                />
                <span className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {icv.import.browse}
                </span>
              </label>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {icv.import.modeLabel}
          </Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <ModeChoice
              checked={mode === "new"}
              onCheck={() => setMode("new")}
              label={icv.import.modeNew}
              disabled={pending}
            />
            <ModeChoice
              checked={mode === "merge"}
              onCheck={() => setMode("merge")}
              label={icv.import.modeMerge}
              disabled={pending || !activeCvId}
              hint={!activeCvId ? "(aucun CV actif)" : undefined}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {icv.import.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!file || pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {icv.import.importing}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {icv.import.submit}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModeChoice({
  checked,
  onCheck,
  label,
  hint,
  disabled,
}: {
  checked: boolean
  onCheck: () => void
  label: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onCheck}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
        checked
          ? "border-pink-400 bg-pink-50/70 dark:bg-pink-950/30"
          : "border-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border",
          checked ? "border-pink-500" : "border-muted-foreground/30",
        )}
      >
        {checked ? (
          <span className="h-2 w-2 rounded-full bg-pink-500" />
        ) : null}
      </span>
      <div className="text-sm">
        <div className="font-medium text-foreground">{label}</div>
        {hint ? (
          <div className="text-[11px] text-muted-foreground">{hint}</div>
        ) : null}
      </div>
    </button>
  )
}
