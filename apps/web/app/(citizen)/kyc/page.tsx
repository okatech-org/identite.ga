"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  FileTextIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShieldIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { cn } from "@repo/ui/lib/utils"

import { kyc } from "../_content/fr"

type DocType = "cni_gabon" | "passport" | "residence_card" | "birth_certificate"
type LocalStep = "intro" | "document" | "selfie" | "review" | "status"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 8 * 1024 * 1024 // 8 Mo

// Origines autorisées pour `return_to` (anti open-redirect) : sous-domaines
// identite.ga (ex. connect.identite.ga d'où vient le step-up OAuth) + localhost.
function isAllowedReturnTo(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:" && u.protocol !== "http:") return false
    const host = u.hostname
    return (
      host === "identite.ga" ||
      host.endsWith(".identite.ga") ||
      host === "localhost" ||
      host === "127.0.0.1"
    )
  } catch {
    return false
  }
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

export default function KycPage() {
  const router = useRouter()
  const me = useQuery(api.profile.getCurrentUser)
  const latest = useQuery(api.kyc.getMyLatest)
  const initialize = useMutation(api.kyc.initialize)
  const generateUploadUrl = useMutation(api.kyc.generateUploadUrl)
  const setDocumentImage = useMutation(api.kyc.setDocumentImage)
  const setSelfie = useMutation(api.kyc.setSelfie)
  const submit = useMutation(api.kyc.submit)

  const [docType, setDocType] = React.useState<DocType>("cni_gabon")
  const [step, setStep] = React.useState<LocalStep>("intro")
  const [kycRequestId, setKycRequestId] = React.useState<string | null>(null)
  const [frontUrl, setFrontUrl] = React.useState<string | null>(null)
  const [backUrl, setBackUrl] = React.useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const frontInput = React.useRef<HTMLInputElement>(null)
  const backInput = React.useRef<HTMLInputElement>(null)
  const selfieInput = React.useRef<HTMLInputElement>(null)

  // Si une demande active existe (en cours d'examen, complément demandé,
  // refusée), on redirige vers la page de détail dédiée pour éviter de
  // proposer le démarrage d'une nouvelle demande.
  React.useEffect(() => {
    if (
      latest &&
      ["submitted", "under_review", "complement_required", "rejected"].includes(
        latest.status,
      )
    ) {
      router.replace("/kyc/request")
    }
  }, [latest, router])

  // Approuvée / expirée : on garde l'écran "status" en lecture seule.
  React.useEffect(() => {
    if (
      latest &&
      step === "intro" &&
      ["approved", "expired"].includes(latest.status)
    ) {
      setStep("status")
    }
  }, [latest, step])

  // Step-up délégué : si on arrive avec un `return_to` valide (depuis le flux
  // de consentement OAuth d'une app tierce), on renvoie l'utilisateur dès que
  // son identité est vérifiée (loa ≥ 2) pour qu'il poursuive sa connexion.
  const returnTo = React.useMemo(() => {
    if (typeof window === "undefined") return null
    const value = new URLSearchParams(window.location.search).get("return_to")
    return value && isAllowedReturnTo(value) ? value : null
  }, [])

  React.useEffect(() => {
    if (returnTo && me && (me.profile?.loa ?? 1) >= 2) {
      window.location.assign(returnTo)
    }
  }, [returnTo, me])

  if (me === undefined || latest === undefined) {
    return (
      <section className="mx-auto w-full max-w-[640px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }
  if (me === null) return null
  const currentLoa = me.profile?.loa ?? 1
  if (currentLoa >= 2) {
    // Already L2/L3 — show status
    if (step !== "status") setStep("status")
  }

  // ─────────────────────────────────────────────────────────────
  // Handlers

  const handleStart = async () => {
    setSubmitting(true)
    try {
      const { kycRequestId: id } = await initialize({ documentType: docType })
      setKycRequestId(id)
      setStep("document")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFile = async (file: File, side: "front" | "back" | "selfie") => {
    if (!kycRequestId) {
      toast.error("Erreur : pas de demande active.")
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (JPEG, PNG, WebP).")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop volumineuse (max 8 Mo).")
      return
    }
    try {
      const uploadUrl = await generateUploadUrl()
      const storageId = await uploadImage(uploadUrl, file)
      if (side === "selfie") {
        await setSelfie({ kycRequestId: kycRequestId as never, storageRef: storageId as never })
        setSelfieUrl(URL.createObjectURL(file))
      } else {
        await setDocumentImage({
          kycRequestId: kycRequestId as never,
          side,
          storageRef: storageId as never,
        })
        if (side === "front") setFrontUrl(URL.createObjectURL(file))
        else setBackUrl(URL.createObjectURL(file))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : kyc.document.uploadError)
    }
  }

  const handleSubmit = async () => {
    if (!kycRequestId) return
    if (!frontUrl) {
      toast.error(kyc.document.requiredFront)
      return
    }
    if (!selfieUrl) {
      toast.error("Selfie requis.")
      return
    }
    setSubmitting(true)
    try {
      await submit({ kycRequestId: kycRequestId as never })
      toast.success("Demande envoyée.")
      setStep("status")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : kyc.selfie.submitError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestart = () => {
    setStep("intro")
    setKycRequestId(null)
    setFrontUrl(null)
    setBackUrl(null)
    setSelfieUrl(null)
  }

  // ─────────────────────────────────────────────────────────────
  // Renderers

  const renderIntro = () => {
    const stepIcons = {
      doc: FileTextIcon,
      camera: CameraIcon,
      check: CheckIcon,
    }
    return (
      <>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {kyc.intro.eyebrow}
        </p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
          {kyc.intro.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {kyc.intro.sub}
        </p>

        <div className="mt-7 grid grid-cols-1 gap-[18px] sm:grid-cols-3">
          {kyc.intro.steps.map((s) => {
            const Icon = stepIcons[s.icon]
            return (
              <div
                key={s.number}
                className="flex flex-col rounded-2xl border border-border bg-card p-7"
              >
                <p className="font-mono text-[13px] font-semibold tracking-[0.05em] text-muted-foreground">
                  {s.number}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-4 flex size-12 items-center justify-center rounded-xl bg-secondary text-idn-green dark:text-idn-green-on-dark"
                >
                  <Icon className="size-6" />
                </div>
                <p className="mt-5 text-lg font-semibold text-foreground">
                  {s.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                <p className="mt-6 font-mono text-[11px] font-semibold tracking-[0.05em] text-muted-foreground">
                  {kyc.intro.statusTodo.toLowerCase()}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-7 flex flex-col items-start gap-4 rounded-2xl border border-idn-blue/30 bg-idn-blue-soft p-5 dark:border-[#1F3454] dark:bg-[#10243A] sm:flex-row sm:items-center sm:gap-5 sm:p-[22px]">
          <ShieldIcon
            className="size-5 shrink-0 text-idn-blue dark:text-idn-blue-on-dark"
            aria-hidden="true"
          />
          <p className="flex-1 text-sm leading-relaxed text-foreground/80">
            {kyc.intro.mobilePromo.body}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Bientôt disponible"
            className="h-11 shrink-0"
          >
            <QrCodeIcon aria-hidden="true" />
            {kyc.intro.mobilePromo.cta}
          </Button>
        </div>

        <div className="mt-5 hidden">
          {/* Sélecteur de doc déplacé à l'étape suivante (cf. maquette) */}
          <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
            <SelectTrigger className="!h-12 w-full !text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kyc.intro.docOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-7 h-12 self-start px-7"
          disabled={submitting}
          onClick={handleStart}
        >
          <CameraIcon aria-hidden="true" />
          {submitting ? "…" : kyc.intro.cta}
        </Button>
      </>
    )
  }

  const renderDocument = () => (
    <>
      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
        {kyc.document.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{kyc.document.sub}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DocSlot
          label={kyc.document.front}
          url={frontUrl}
          inputRef={frontInput}
          onPick={() => frontInput.current?.click()}
          onChange={(file) => void handleFile(file, "front")}
          required
        />
        <DocSlot
          label={kyc.document.back}
          url={backUrl}
          inputRef={backInput}
          onPick={() => backInput.current?.click()}
          onChange={(file) => void handleFile(file, "back")}
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-12" onClick={handleRestart}>
          Recommencer
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12"
          disabled={!frontUrl}
          onClick={() => setStep("selfie")}
        >
          {kyc.document.next}
        </Button>
      </div>
    </>
  )

  const renderSelfie = () => (
    <>
      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
        {kyc.selfie.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{kyc.selfie.sub}</p>

      <div className="mt-6">
        {selfieUrl ? (
          <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfieUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => selfieInput.current?.click()}
            className="flex aspect-square w-full max-w-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-idn-green/40 hover:text-foreground"
          >
            <CameraIcon className="size-10" aria-hidden="true" />
            <span className="text-sm font-medium">{kyc.selfie.capture}</span>
          </button>
        )}
        <input
          ref={selfieInput}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          capture="user"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f, "selfie")
            e.target.value = ""
          }}
          className="sr-only"
        />
        {selfieUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => selfieInput.current?.click()}
          >
            {kyc.selfie.retake}
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-12" onClick={() => setStep("document")}>
          <ChevronLeftIcon aria-hidden="true" />
          Retour
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12"
          disabled={submitting || !selfieUrl}
          onClick={handleSubmit}
        >
          {submitting ? "…" : kyc.selfie.submit}
        </Button>
      </div>
    </>
  )

  const renderStatus = () => {
    const statusKey = (latest?.status ?? "pending") as keyof typeof kyc.status
    const statusCopy = kyc.status[statusKey] as { title: string; sub: string } | undefined
    const isApproved = latest?.status === "approved"
    const isRejected = latest?.status === "rejected"
    const Icon = isApproved ? CheckIcon : isRejected ? XCircleIcon : ShieldCheckIcon
    const colorClass = isApproved
      ? "bg-idn-green text-white"
      : isRejected
        ? "bg-destructive text-white"
        : "bg-idn-yellow text-[#5a4a0a]"

    return (
      <div className="text-center">
        <div className={cn("mx-auto flex size-20 items-center justify-center rounded-full", colorClass)}>
          <Icon className="size-10" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
          {statusCopy?.title ?? "En attente"}
        </h1>
        <p className="mx-auto mt-2 max-w-[420px] text-sm text-muted-foreground">
          {statusCopy?.sub ?? ""}
        </p>
        {isRejected && latest?.rejectionReason && (
          <p className="mx-auto mt-3 max-w-[420px] rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            Motif : {latest.rejectionReason}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link href="/profile">{kyc.status.backToProfile}</Link>
          </Button>
          {(isRejected || latest?.status === "expired") && (
            <Button type="button" size="lg" className="h-12" onClick={handleRestart}>
              {kyc.status.restart}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-5 py-6 md:px-7 md:py-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 self-start text-muted-foreground"
      >
        <Link href="/profile">
          <ChevronLeftIcon aria-hidden="true" />
          Retour au profil
        </Link>
      </Button>

      {step === "intro" && renderIntro()}
      {step === "document" && renderDocument()}
      {step === "selfie" && renderSelfie()}
      {step === "status" && renderStatus()}
    </section>
  )
}

type DocSlotProps = {
  label: string
  url: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: () => void
  onChange: (file: File) => void
  required?: boolean
}

function DocSlot({ label, url, inputRef, onPick, onChange, required }: DocSlotProps) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {url ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
          <div className="border-t border-border bg-card p-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onPick}>
              Remplacer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className="mt-2 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-idn-green/40 hover:text-foreground"
        >
          <FileTextIcon className="size-8" aria-hidden="true" />
          <span className="text-xs font-medium">Ajouter une photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange(f)
          e.target.value = ""
        }}
        className="sr-only"
      />
    </div>
  )
}
