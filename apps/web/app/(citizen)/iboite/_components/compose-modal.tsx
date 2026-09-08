"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import {
  BoldIcon,
  FileTextIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PaperclipIcon,
  SendIcon,
  UnderlineIcon,
  XIcon,
} from "lucide-react"
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
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { iboite } from "../_content/fr"

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function ComposeModal({
  accountId,
  fromEmail,
  onClose,
  replyToId,
  mode,
}: {
  accountId: Id<"iboiteAccount">
  fromEmail: string
  onClose: () => void
  /**
   * Si fourni, le modal s'ouvre en mode réponse : on charge le message
   * original via Convex et on pré-remplit destinataire + sujet (« Re: … »).
   * L'`inReplyTo` est passé au backend pour hériter du `threadId`.
   */
  replyToId?: Id<"iboiteMessage">
  mode: "new" | "reply" | "replyAll" | "forward"
}) {
  const send = useMutation(api.iboite.messages.send)
  const generateUploadUrl = useMutation(api.iboite.messages.generateUploadUrl)

  // Charge le message d'origine quand on est en mode réponse. `"skip"` évite
  // un fetch inutile en mode nouveau message.
  const original = useQuery(
    api.iboite.messages.get,
    replyToId ? { messageId: replyToId } : "skip",
  )

  const [to, setTo] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [bodyHtml, setBodyHtml] = React.useState("")
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const editorRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function pickAttachments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const accepted = files.filter((file) => {
      if (file.size <= MAX_ATTACHMENT_BYTES) return true
      toast.error(`${file.name} dépasse la limite de 10 Mo.`)
      return false
    })
    if (accepted.length > 0) {
      setAttachments((current) => [...current, ...accepted].slice(0, 10))
    }
    event.target.value = ""
  }

  // Pré-remplit destinataire + sujet une seule fois quand le message
  // original arrive. On utilise un ref pour ne pas écraser ce que
  // l'utilisateur aurait commencé à éditer.
  const didPrefillRef = React.useRef(false)
  React.useEffect(() => {
    if (didPrefillRef.current) return
    if (!replyToId) return
    if (original === undefined) return // en cours de chargement
    if (original === null) {
      // Message introuvable (probablement supprimé) — on bascule en
      // mode nouveau message vide plutôt que de bloquer l'utilisateur.
      didPrefillRef.current = true
      return
    }
    if (mode !== "forward") setTo(original.senderEmail)
    const base = original.subject
    const subjectPrefix = mode === "forward" ? "Tr:" : "Re:"
    const subjectWithoutPrefix = base.replace(/^(Re|Tr|Fwd):\s*/i, "")
    setSubject(`${subjectPrefix} ${subjectWithoutPrefix}`)
    const date = new Date(original.createdAt).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const quote = `\n\n--- Message d'origine ---\nDe : ${original.senderName} <${original.senderEmail}>\nDate : ${date}\nObjet : ${original.subject}\n\n${original.body}`
    const escapedQuote = quote
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")
      .replaceAll("\n", "<br>")
    const quoteHtml = `<p><br></p><blockquote style="margin:0;border-left:2px solid #9a9c8e;padding-left:12px">${escapedQuote}</blockquote>`
    setBody(quote)
    setBodyHtml(quoteHtml)
    if (editorRef.current) editorRef.current.innerHTML = quoteHtml
    didPrefillRef.current = true
  }, [replyToId, original, mode])

  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor || !bodyHtml || editor.innerHTML === bodyHtml) return
    editor.innerHTML = bodyHtml
  }, [bodyHtml])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (submitting) return
    const trimmedTo = to.trim().toLowerCase()
    if (!trimmedTo) {
      toast.error(iboite.compose.errors.invalidRecipient)
      return
    }
    // Mode tolérant : un identifiant seul cible iBoîte ; une adresse email
    // complète peut désormais viser un domaine externe.
    const normalizedTo = trimmedTo.includes("@")
      ? trimmedTo
      : `${trimmedTo}@idn.ga`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTo)) {
      toast.error(iboite.compose.errors.invalidEmail)
      return
    }
    if (!subject.trim()) {
      toast.error(iboite.compose.errors.subjectRequired)
      return
    }
    if (!body.trim()) {
      toast.error(iboite.compose.errors.bodyRequired)
      return
    }
    setSubmitting(true)
    try {
      const uploaded = await Promise.all(
        attachments.map(async (file) => {
          const uploadUrl = await generateUploadUrl()
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          })
          if (!response.ok) throw new Error(iboite.toasts.downloadFailed)
          const { storageId } = (await response.json()) as {
            storageId: Id<"_storage">
          }
          return {
            name: file.name,
            size: file.size,
            storageRef: storageId,
            mimeType: file.type || "application/octet-stream",
          }
        }),
      )
      await send({
        accountId,
        recipientEmail: normalizedTo,
        recipientName: normalizedTo.split("@")[0] ?? normalizedTo,
        subject: subject.trim(),
        body: body.trim(),
        bodyHtml: bodyHtml.trim() || undefined,
        attachments: uploaded.length > 0 ? uploaded : undefined,
        // En mode réponse, on transmet l'id du message d'origine — le
        // backend en déduit le `threadId` et rattache la nouvelle entrée
        // à la conversation existante.
        inReplyTo: mode === "forward" ? undefined : replyToId,
      })
      toast.success(iboite.toasts.sent)
      onClose()
    } catch (err) {
      // Erreur métier ConvexError → on lit `.data.code` pour afficher le
      // message i18n correspondant (RECIPIENT_UNKNOWN, INVALID_EMAIL…).
      // Sinon fallback générique : surtout pas de crash de l'UI.
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; message?: string } | string
        const code = typeof data === "object" ? data.code : undefined
        const message = typeof data === "object" ? data.message : undefined
        if (code === "RECIPIENT_UNKNOWN") {
          toast.error(iboite.compose.errors.recipientUnknown)
        } else if (code === "INVALID_EMAIL") {
          toast.error(iboite.compose.errors.invalidEmail)
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

  const title =
    mode === "forward"
      ? iboite.compose.forwardTitle
      : mode === "replyAll"
        ? iboite.compose.replyAllTitle
        : replyToId
          ? iboite.compose.replyTitle
          : iboite.compose.title

  function format(
    command:
      | "bold"
      | "italic"
      | "underline"
      | "insertUnorderedList"
      | "insertOrderedList",
  ) {
    editorRef.current?.focus()
    document.execCommand(command)
    const editor = editorRef.current
    if (editor) {
      setBody(editor.innerText)
      setBodyHtml(editor.innerHTML)
    }
  }

  function addLink() {
    const url = window.prompt("Adresse du lien (https://…)")
    if (!url || !/^https?:\/\//i.test(url)) return
    editorRef.current?.focus()
    document.execCommand("createLink", false, url)
    const editor = editorRef.current
    if (editor) {
      setBody(editor.innerText)
      setBodyHtml(editor.innerHTML)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 shadow-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="bg-secondary/70 px-5 py-3 text-sm">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
            <Label className="w-10 shrink-0 text-muted-foreground">
              {iboite.compose.from}
            </Label>
            <p className="min-w-0 flex-1 truncate text-sm">{fromEmail}</p>
          </div>
          <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
            <Label
              htmlFor="compose-to"
              className="w-10 shrink-0 text-muted-foreground"
            >
              {iboite.compose.to}
            </Label>
            <Input
              id="compose-to"
              // `type="text"` (pas "email") : on accepte une saisie sans `@`
              // que l'on suffixe ensuite avec `@idn.ga` côté submit.
              type="text"
              inputMode="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={iboite.compose.toPlaceholder}
              autoComplete="off"
              required
              className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="border-b border-border px-5 py-2.5">
            <Label htmlFor="compose-subject" className="sr-only">
              {iboite.compose.subject}
            </Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={iboite.compose.subjectPlaceholder}
              required
              className="h-auto border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
            />
          </div>

          <div
            ref={editorRef}
            id="compose-body"
            role="textbox"
            aria-label={iboite.compose.body}
            aria-multiline="true"
            contentEditable
            suppressContentEditableWarning
            data-placeholder={iboite.compose.body}
            onInput={(event) => {
              setBody(event.currentTarget.innerText)
              setBodyHtml(event.currentTarget.innerHTML)
            }}
            className="min-h-64 flex-1 overflow-y-auto px-5 py-4 text-sm leading-6 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
          />

          <div className="flex items-center gap-1 border-t border-border px-4 py-2">
            {(
              [
                ["bold", BoldIcon, "Gras"],
                ["italic", ItalicIcon, "Italique"],
                ["underline", UnderlineIcon, "Souligné"],
                ["insertUnorderedList", ListIcon, "Liste à puces"],
                ["insertOrderedList", ListOrderedIcon, "Liste numérotée"],
              ] as const
            ).map(([command, Icon, label]) => (
              <button
                key={command}
                type="button"
                onClick={() => format(command)}
                aria-label={label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={addLink}
              aria-label="Ajouter un lien"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {attachments.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1"
                >
                  <FileTextIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="max-w-40 truncate text-xs">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Retirer ${file.name}`}
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    disabled={submitting}
                    className="rounded p-0.5 text-muted-foreground hover:bg-background"
                  >
                    <XIcon className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t border-border px-4 py-3 sm:justify-between">
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
              onChange={pickAttachments}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                {iboite.compose.cancel}
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                <SendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {submitting ? iboite.compose.sending : iboite.compose.send}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
