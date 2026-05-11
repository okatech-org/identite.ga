"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { ExpandIcon } from "lucide-react"
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
  const requestComplement = useMutation(
    api.controller.queue.requestComplement,
  )

  const [submitting, setSubmitting] = React.useState<
    "approve" | "reject" | "complement" | null
  >(null)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [complementOpen, setComplementOpen] = React.useState(false)
  const [complementMessage, setComplementMessage] = React.useState("")

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

  const onConfirmComplement = async () => {
    if (complementMessage.trim().length < 5) {
      toast.error(
        "Précisez ce que doit fournir le citoyen (min. 5 caractères).",
      )
      return
    }
    setSubmitting("complement")
    try {
      await requestComplement({
        kycRequestId: current._id,
        message: complementMessage.trim(),
      })
      toast.success(`Complément demandé pour KYC ${current.ref}.`)
      setComplementOpen(false)
      setComplementMessage("")
    } catch (err) {
      toast.error(
        describeError(err, "Impossible de demander un complément."),
      )
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
          <Button
            variant="outline"
            disabled={submitting !== null}
            onClick={() => setComplementOpen(true)}
          >
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

      <Dialog
        open={complementOpen}
        onOpenChange={(o) => {
          setComplementOpen(o)
          if (!o) setComplementMessage("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Demander un complément — {current.ref}
            </DialogTitle>
            <DialogDescription>
              Précisez ce que le citoyen doit fournir. Il recevra une
              notification et pourra ré-uploader la pièce concernée.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={4}
            placeholder="Renvoyez le selfie en bonne lumière, ou un recto de CNI plus net…"
            value={complementMessage}
            onChange={(e) => setComplementMessage(e.target.value)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={submitting === "complement"}
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              onClick={onConfirmComplement}
              disabled={submitting === "complement"}
            >
              {submitting === "complement" ? "…" : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PreviewSlot({ url, label }: { url: string | null; label: string }) {
  const [open, setOpen] = React.useState(false)

  if (!url) {
    return (
      <div
        className="flex items-center justify-center rounded-[10px] font-mono text-[11px] uppercase tracking-[0.1em] text-idn-muted"
        style={{ aspectRatio: "1.6 / 1", background: STRIPED_BG }}
      >
        {label}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Agrandir : ${label}`}
        className="group relative flex items-center justify-center overflow-hidden rounded-[10px] bg-idn-surface-2 transition-colors hover:ring-2 hover:ring-idn-green/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green"
        style={{ aspectRatio: "1.6 / 1" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="size-full object-contain"
          loading="lazy"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
            {label}
          </span>
          <ExpandIcon
            aria-hidden="true"
            className="size-3.5 text-white"
          />
        </span>
      </button>
      <DialogContent
        className="max-w-[90vw] sm:max-w-[1100px] p-0 overflow-hidden bg-idn-bg"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-idn-border-soft px-5 py-3">
          <DialogTitle className="text-sm font-semibold text-idn-ink">
            {label}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              Fermer
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex max-h-[80vh] items-center justify-center bg-black/30 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className="max-h-[78vh] w-auto max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
