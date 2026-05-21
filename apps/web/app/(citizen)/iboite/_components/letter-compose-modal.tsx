"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { FileTextIcon, PaperclipIcon, SendIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { iboite } from "../_content/fr"
import { LetterEditor, type LetterEditorHandle } from "./letter-editor"

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_ATTACHMENT_LABEL = "10 Mo"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function LetterComposeModal({
  accountId,
  onClose,
}: {
  accountId: Id<"iboiteAccount">
  onClose: () => void
}) {
  const send = useMutation(api.iboite.letters.send)
  const generateUploadUrl = useMutation(api.iboite.letters.generateUploadUrl)
  // Cache de résolution storageId → URL pour les images uploadées via
  // l'éditeur. La query côté Convex est `getStorageUrl`.
  const [pendingStorageRef, setPendingStorageRef] =
    React.useState<Id<"_storage"> | null>(null)
  const resolvedUrl = useQuery(
    api.iboite.letters.getStorageUrl,
    pendingStorageRef ? { storageRef: pendingStorageRef } : "skip",
  )

  const [to, setTo] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const editorRef = React.useRef<LetterEditorHandle>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length === 0) return
    const accepted: File[] = []
    for (const f of picked) {
      if (f.size > MAX_ATTACHMENT_BYTES) {
        toast.error(iboite.letterCompose.errors.attachmentTooLarge(MAX_ATTACHMENT_LABEL))
        continue
      }
      accepted.push(f)
    }
    if (accepted.length > 0) setAttachments((prev) => [...prev, ...accepted])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  /**
   * Upload d'une image inline depuis l'éditeur : envoie le blob vers Convex
   * storage puis résout l'URL durable. Lance une exception si l'upload
   * échoue ou si la résolution d'URL ne renvoie rien.
   */
  async function uploadInlineImage(file: File): Promise<string> {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        iboite.letterCompose.errors.attachmentTooLarge(MAX_ATTACHMENT_LABEL),
      )
    }
    const uploadUrl = await generateUploadUrl()
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    })
    if (!res.ok) throw new Error(iboite.letterCompose.errors.imageUploadFailed)
    const { storageId } = (await res.json()) as { storageId: string }
    // Déclenche la query Convex pour obtenir l'URL durable. On attend que
    // `resolvedUrl` soit défini avant de continuer — Convex repassera par
    // re-render, on poll donc localement.
    const ref = storageId as Id<"_storage">
    setPendingStorageRef(ref)
    const url = await waitForResolution(() => {
      // On lit la query courante via une ref pour ne pas dépendre d'un
      // closure stale.
      return latestResolvedRef.current[ref] ?? null
    })
    return url
  }

  // Ref live sur la dernière URL résolue pour le pollage du `waitForResolution`.
  const latestResolvedRef = React.useRef<Record<string, string>>({})
  React.useEffect(() => {
    if (pendingStorageRef && typeof resolvedUrl === "string") {
      latestResolvedRef.current[pendingStorageRef] = resolvedUrl
    }
  }, [pendingStorageRef, resolvedUrl])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (submitting) return

    const trimmedTo = to.trim().toLowerCase()
    if (!trimmedTo) {
      toast.error(iboite.compose.errors.invalidRecipient)
      return
    }
    const normalizedTo = trimmedTo.includes("@") ? trimmedTo : `${trimmedTo}@idn.ga`
    if (!normalizedTo.endsWith("@idn.ga")) {
      toast.error(iboite.compose.errors.invalidDomain)
      return
    }
    if (!subject.trim()) {
      toast.error(iboite.compose.errors.subjectRequired)
      return
    }
    if (editorRef.current?.isEmpty() ?? true) {
      toast.error(iboite.compose.errors.bodyRequired)
      return
    }
    const html = editorRef.current?.getHtml() ?? ""

    setSubmitting(true)
    try {
      const uploaded = await Promise.all(
        attachments.map(async (file) => {
          const uploadUrl = await generateUploadUrl()
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          })
          if (!res.ok) throw new Error("upload failed")
          const { storageId } = (await res.json()) as { storageId: string }
          return {
            name: file.name,
            size: file.size,
            storageRef: storageId as Id<"_storage">,
            mimeType: file.type || "application/octet-stream",
          }
        }),
      )

      await send({
        accountId,
        recipientEmail: normalizedTo,
        subject: subject.trim(),
        body: html,
        attachments: uploaded.length > 0 ? uploaded : undefined,
      })
      toast.success(iboite.toasts.letterSent)
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; message?: string } | string
        const code = typeof data === "object" ? data.code : undefined
        const message = typeof data === "object" ? data.message : undefined
        if (code === "RECIPIENT_UNKNOWN") {
          toast.error(iboite.compose.errors.recipientUnknown)
        } else if (code === "INVALID_DOMAIN") {
          toast.error(iboite.compose.errors.invalidDomain)
        } else {
          toast.error(message ?? iboite.compose.errors.sendFailed)
        }
      } else {
        toast.error(
          err instanceof Error ? err.message : iboite.compose.errors.sendFailed,
        )
      }
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-6xl flex-col gap-0 p-0 sm:max-w-6xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex-1">
            <DialogTitle className="text-sm font-semibold">
              {iboite.letterCompose.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {iboite.letterCompose.title}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            {iboite.compose.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => submit()}
            disabled={submitting}
          >
            <SendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {submitting ? iboite.compose.sending : iboite.compose.send}
          </Button>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="grid flex-1 min-h-0 grid-rows-[auto_1fr] overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-3 border-b border-border bg-card px-4 py-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="letter-to" className="text-xs">
                {iboite.compose.to}
              </Label>
              <Input
                id="letter-to"
                type="text"
                inputMode="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={iboite.compose.toPlaceholder}
                autoComplete="off"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="letter-subject" className="text-xs">
                {iboite.compose.subject}
              </Label>
              <Input
                id="letter-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={iboite.compose.subjectPlaceholder}
                required
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden">
            <LetterEditor
              ref={editorRef}
              onUploadImage={uploadInlineImage}
              onUploadError={(err) =>
                toast.error(
                  err instanceof Error
                    ? err.message
                    : iboite.letterCompose.errors.imageUploadFailed,
                )
              }
              className="flex-1 min-h-0 rounded-none border-0 border-t-0"
            />

            {attachments.length > 0 ? (
              <div className="border-t border-border bg-card px-4 py-2">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {iboite.courriers.attachments}
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {attachments.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-2 py-1"
                    >
                      <FileTextIcon
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="max-w-[14ch] truncate text-xs">
                        {f.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatBytes(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        aria-label={iboite.letterCompose.errors.removeAttachment(
                          f.name,
                        )}
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                        disabled={submitting}
                      >
                        <XIcon className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <PaperclipIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {iboite.compose.attach}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={handlePickFiles}
              />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Petit utilitaire de polling pour récupérer une valeur résolue de façon
 * asynchrone par un effet React. Réessaye toutes les 50ms pendant `timeoutMs`.
 */
async function waitForResolution(
  read: () => string | null,
  timeoutMs = 5000,
): Promise<string> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const v = read()
      if (v) return resolve(v)
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("resolution timeout"))
      }
      setTimeout(tick, 50)
    }
    tick()
  })
}
