"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Textarea } from "@repo/ui/components/textarea"

import { IdnCard } from "../../../_components/idn-card"
import { queue as content } from "../../../_content/fr"

const STRIPED_BG =
  "repeating-linear-gradient(45deg, var(--idn-surface-2), var(--idn-surface-2) 8px, #E8E5DC 8px, #E8E5DC 16px)"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function CaseDetail() {
  const current = useQuery(api.controller.queue.myCurrent, {})
  const approve = useMutation(api.controller.queue.approve)
  const reject = useMutation(api.controller.queue.reject)

  const [submitting, setSubmitting] = React.useState<
    "approve" | "reject" | null
  >(null)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")

  if (current === undefined) {
    return (
      <IdnCard className="mt-5">
        <div className="h-4 w-64 animate-pulse rounded bg-idn-surface-2" />
        <div className="mt-3.5 grid grid-cols-2 gap-3.5">
          <div className="aspect-[1.6/1] animate-pulse rounded-[10px] bg-idn-surface-2" />
          <div className="aspect-[1.6/1] animate-pulse rounded-[10px] bg-idn-surface-2" />
        </div>
      </IdnCard>
    )
  }

  if (current === null) {
    return null
  }

  const fullName = [current.citizen.firstName, current.citizen.lastName]
    .filter(Boolean)
    .join(" ")

  const onApprove = async () => {
    setSubmitting("approve")
    try {
      await approve({ kycRequestId: current._id })
      toast.success(
        fullName
          ? `KYC ${current.ref} approuvé pour ${fullName}.`
          : `KYC ${current.ref} approuvé.`,
      )
    } catch (err) {
      toast.error(describeError(err, "Impossible d'approuver la demande."))
    } finally {
      setSubmitting(null)
    }
  }

  const onConfirmReject = async () => {
    if (reason.trim().length < 5) {
      toast.error("Motif trop court — précisez la raison du rejet.")
      return
    }
    setSubmitting("reject")
    try {
      await reject({ kycRequestId: current._id, reason: reason.trim() })
      toast.success(`KYC ${current.ref} rejeté.`)
      setRejectOpen(false)
      setReason("")
    } catch (err) {
      toast.error(describeError(err, "Impossible de rejeter la demande."))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <>
      <IdnCard className="mt-5">
        <div className="text-[13px] font-semibold text-idn-ink">
          {content.caseTitlePrefix}
          {current.ref}
          {fullName && (
            <span className="ml-2 font-normal text-idn-muted">· {fullName}</span>
          )}
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-3.5">
          <PreviewSlot
            url={current.docFrontUrl}
            label={content.preview.recto}
          />
          <PreviewSlot url={current.selfieUrl} label={content.preview.selfie} />
        </div>
        <div className="mt-3.5 flex items-center gap-2.5">
          <Button onClick={onApprove} disabled={submitting !== null}>
            {submitting === "approve" ? "…" : content.approveCta}
          </Button>
          <Button variant="outline" disabled={submitting !== null}>
            {content.requestMoreCta}
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            disabled={submitting !== null}
            onClick={() => setRejectOpen(true)}
            className="text-[#B83A3A] hover:bg-[#FBE5E5] hover:text-[#B83A3A] dark:hover:bg-[#3A1E1E]"
          >
            {content.rejectCta}
          </Button>
        </div>
      </IdnCard>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande {current.ref}</DialogTitle>
            <DialogDescription>
              Le citoyen sera notifié. Indiquez un motif clair (min. 5 caractères).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={4}
            placeholder="Document illisible, photo non conforme, identité incohérente…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={submitting === "reject"}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              variant="ghost"
              onClick={onConfirmReject}
              disabled={submitting === "reject"}
              className="text-[#B83A3A] hover:bg-[#FBE5E5] hover:text-[#B83A3A] dark:hover:bg-[#3A1E1E]"
            >
              {submitting === "reject" ? "…" : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PreviewSlot({ url, label }: { url: string | null; label: string }) {
  if (url) {
    return (
      <div
        className="overflow-hidden rounded-[10px] bg-idn-surface-2"
        style={{ aspectRatio: "1.6 / 1" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-[10px] font-mono text-[11px] uppercase tracking-[0.1em] text-idn-muted"
      style={{ aspectRatio: "1.6 / 1", background: STRIPED_BG }}
    >
      {label}
    </div>
  )
}
