"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { PaperclipIcon, SendIcon } from "lucide-react"
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
import { Textarea } from "@repo/ui/components/textarea"

import { iboite } from "../_content/fr"

export function ComposeModal({
  accountId,
  onClose,
  replyToId,
}: {
  accountId: Id<"iboiteAccount">
  onClose: () => void
  /**
   * Si fourni, le modal s'ouvre en mode réponse : on charge le message
   * original via Convex et on pré-remplit destinataire + sujet (« Re: … »).
   * L'`inReplyTo` est passé au backend pour hériter du `threadId`.
   */
  replyToId?: Id<"iboiteMessage">
}) {
  const send = useMutation(api.iboite.messages.send)

  // Charge le message d'origine quand on est en mode réponse. `"skip"` évite
  // un fetch inutile en mode nouveau message.
  const original = useQuery(
    api.iboite.messages.get,
    replyToId ? { messageId: replyToId } : "skip",
  )

  const [to, setTo] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

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
    setTo(original.senderEmail)
    const base = original.subject
    setSubject(/^re:\s*/i.test(base) ? base : `Re: ${base}`)
    didPrefillRef.current = true
  }, [replyToId, original])

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
      await send({
        accountId,
        recipientEmail: normalizedTo,
        recipientName: normalizedTo.split("@")[0] ?? normalizedTo,
        subject: subject.trim(),
        body: body.trim(),
        // En mode réponse, on transmet l'id du message d'origine — le
        // backend en déduit le `threadId` et rattache la nouvelle entrée
        // à la conversation existante.
        inReplyTo: replyToId,
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

  const title = replyToId ? iboite.compose.replyTitle : iboite.compose.title

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compose-to">{iboite.compose.to}</Label>
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
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compose-subject">{iboite.compose.subject}</Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={iboite.compose.subjectPlaceholder}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compose-body">{iboite.compose.body}</Label>
            <Textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder={iboite.compose.body}
              required
            />
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toast.info(iboite.toasts.soonAvailable)}
            >
              <PaperclipIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {iboite.compose.attach}
            </Button>
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
