"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { ChevronLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"

import { kycRequestPage as content } from "../../_content/fr"
import { DocumentSlot } from "./_components/document-slot"
import { StatusBadge } from "./_components/status-badge"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 8 * 1024 * 1024 // 8 Mo

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDate(ms: number): string {
  return DATE_FORMATTER.format(new Date(ms))
}

async function uploadImage(uploadUrl: string, file: File): Promise<string> {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!res.ok) throw new Error("Upload failed")
  const { storageId } = (await res.json()) as { storageId: string }
  return storageId
}

/**
 * Page de suivi d'une demande KYC en cours.
 *
 * Affiche le statut, les documents transmis (cliquables → lightbox),
 * l'historique d'événements (audit log) et — si le contrôleur a demandé
 * un complément — le message + un bouton pour ré-uploader les pièces et
 * renvoyer la demande pour examen.
 */
export default function KycRequestPage() {
  const active = useQuery(api.kyc.getActiveRequest, {})
  const generateUploadUrl = useMutation(api.kyc.generateUploadUrl)
  const setDocumentImage = useMutation(api.kyc.setDocumentImage)
  const setSelfie = useMutation(api.kyc.setSelfie)
  const respondComplement = useMutation(api.kyc.respondComplement)

  const [uploading, setUploading] = React.useState<
    "front" | "back" | "selfie" | null
  >(null)
  const [submitting, setSubmitting] = React.useState(false)

  const frontInput = React.useRef<HTMLInputElement>(null)
  const backInput = React.useRef<HTMLInputElement>(null)
  const selfieInput = React.useRef<HTMLInputElement>(null)

  if (active === undefined) {
    return (
      <section className="mx-auto w-full max-w-[820px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }
  if (active === null) {
    return (
      <section className="mx-auto w-full max-w-[820px] px-5 py-6 md:px-7 md:py-8">
        <p className="text-sm text-muted-foreground">
          Aucune demande KYC associée à votre compte.
        </p>
        <Link
          href="/kyc"
          className="mt-3 inline-block text-sm font-medium text-idn-green underline-offset-2 hover:underline dark:text-idn-green-on-dark"
        >
          Démarrer une demande
        </Link>
      </section>
    )
  }

  const canReupload = active.status === "complement_required"
  const docTypeLabel =
    content.documentTypeLabels[active.documentType] ?? active.documentType

  const handleFile = async (
    file: File,
    side: "front" | "back" | "selfie",
  ) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (JPEG, PNG, WebP).")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop volumineuse (max 8 Mo).")
      return
    }
    setUploading(side)
    try {
      const uploadUrl = await generateUploadUrl()
      const storageId = await uploadImage(uploadUrl, file)
      if (side === "selfie") {
        await setSelfie({
          kycRequestId: active._id as Id<"kycRequest">,
          storageRef: storageId as Id<"_storage">,
        })
      } else {
        await setDocumentImage({
          kycRequestId: active._id as Id<"kycRequest">,
          side,
          storageRef: storageId as Id<"_storage">,
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur upload.")
    } finally {
      setUploading(null)
    }
  }

  const onResubmit = async () => {
    setSubmitting(true)
    try {
      await respondComplement({
        kycRequestId: active._id as Id<"kycRequest">,
      })
      toast.success(content.complement.submitSuccessToast)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de renvoyer la demande.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-[820px] px-5 py-6 md:px-7 md:py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
        {content.backLink}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[26px]">
            {content.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {content.refLabel} · <span className="font-mono">{active._id}</span>{" "}
            · {docTypeLabel}
          </p>
        </div>
        <StatusBadge status={active.status} />
      </div>

      {active.status === "complement_required" && active.complementRequest && (
        <section className="mt-6 rounded-2xl border border-idn-yellow/40 bg-idn-yellow-soft p-5 dark:border-[#3A3F1F] dark:bg-[#1F2316]">
          <h2 className="text-sm font-semibold text-foreground">
            {content.complement.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reçu le {formatDate(active.complementRequest.requestedAt)}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {active.complementRequest.message}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {content.complement.helper}
          </p>
        </section>
      )}

      {active.status === "rejected" && active.rejectionReason && (
        <section className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-sm font-semibold text-foreground">
            {content.rejection.title}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {active.rejectionReason}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/kyc">{content.rejection.restart}</Link>
          </Button>
        </section>
      )}

      {active.status === "approved" && (
        <section className="mt-6 rounded-2xl border border-idn-green/30 bg-idn-green-soft p-5 dark:bg-[#0F2A18]">
          <p className="text-sm leading-relaxed text-idn-green dark:text-idn-green-on-dark">
            {content.approved.callout}
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-base font-semibold text-foreground">
          {content.documentsTitle}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DocumentSlot
            url={active.docFrontUrl}
            label={content.slots.front}
            onReplace={canReupload ? () => frontInput.current?.click() : undefined}
            replaceLabel={
              uploading === "front"
                ? "Téléversement…"
                : content.complement.replaceFront
            }
          />
          <DocumentSlot
            url={active.docBackUrl}
            label={content.slots.back}
            onReplace={canReupload ? () => backInput.current?.click() : undefined}
            replaceLabel={
              uploading === "back"
                ? "Téléversement…"
                : content.complement.replaceBack
            }
          />
          <DocumentSlot
            url={active.selfieUrl}
            label={content.slots.selfie}
            onReplace={canReupload ? () => selfieInput.current?.click() : undefined}
            replaceLabel={
              uploading === "selfie"
                ? "Téléversement…"
                : content.complement.replaceSelfie
            }
          />
        </div>

        <input
          ref={frontInput}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f, "front")
            e.target.value = ""
          }}
        />
        <input
          ref={backInput}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f, "back")
            e.target.value = ""
          }}
        />
        <input
          ref={selfieInput}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f, "selfie")
            e.target.value = ""
          }}
        />

        {canReupload && (
          <Button
            onClick={onResubmit}
            disabled={submitting || uploading !== null}
            className="mt-5"
          >
            {submitting ? "…" : content.complement.submitCta}
          </Button>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-foreground">
          {content.timeline.title}
        </h2>
        {active.timeline.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {content.timeline.empty}
          </p>
        ) : (
          <ol className="mt-4 space-y-3 border-l border-border pl-5">
            {active.timeline.map((event, i) => {
              const label =
                content.timeline.actions[event.action] ?? event.action
              const meta = (event.metadata ?? {}) as Record<string, unknown>
              const detail =
                typeof meta.message === "string"
                  ? (meta.message as string)
                  : typeof meta.reason === "string"
                    ? (meta.reason as string)
                    : null
              return (
                <li key={`${event.action}-${i}`} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-background bg-idn-green"
                  />
                  <div className="text-sm font-medium text-foreground">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(event.createdAt)}
                  </div>
                  {detail && (
                    <div className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                      {detail}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </section>
  )
}
