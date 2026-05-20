"use client"

import * as React from "react"
import { useMutation } from "convex/react"
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
}: {
  accountId: Id<"iboiteAccount">
  onClose: () => void
}) {
  const send = useMutation(api.iboite.messages.send)
  const [to, setTo] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (submitting) return
    const trimmedTo = to.trim().toLowerCase()
    if (!trimmedTo || !trimmedTo.includes("@")) {
      toast.error(iboite.compose.errors.invalidRecipient)
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
        recipientEmail: trimmedTo,
        recipientName: trimmedTo.split("@")[0] ?? trimmedTo,
        subject: subject.trim(),
        body: body.trim(),
      })
      toast.success(iboite.toasts.sent)
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : iboite.compose.errors.sendFailed,
      )
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{iboite.compose.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {iboite.compose.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compose-to">{iboite.compose.to}</Label>
            <Input
              id="compose-to"
              type="email"
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
