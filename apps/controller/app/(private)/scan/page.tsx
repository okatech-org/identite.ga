"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import { QrCodeIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { AvatarInitials } from "../../_components/avatar-initials"
import { CheckIcon } from "../../_components/icons"
import { IdnCard } from "../../_components/idn-card"
import { OpHeader } from "../../_components/op-header"
import { scan } from "../../_content/fr"

type Identity = {
  idnId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  profileType: "citizen" | "resident" | "visitor" | "developer"
  loa: 1 | 2 | 3
  issuedAt: number
  expiresAt: number
}

type ScannerCtor = new (opts: { formats: string[] }) => {
  detect: (
    source: HTMLVideoElement,
  ) => Promise<{ rawValue: string }[]>
}

function getBarcodeDetector(): ScannerCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { BarcodeDetector?: ScannerCtor }
  return typeof w.BarcodeDetector === "function" ? w.BarcodeDetector : null
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  if (err instanceof Error) return err.message
  return fallback
}

function initials(firstName: string, lastName: string): string {
  const fi = firstName.trim().charAt(0).toUpperCase()
  const li = lastName.trim().charAt(0).toUpperCase()
  return `${fi}${li}` || "—"
}

function formatBirth(dob: string): string {
  if (!dob) return ""
  const [y, m, d] = dob.split("-")
  if (!y || !m || !d) return dob
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ]
  return `${Number(d)} ${months[Number(m) - 1] ?? m} ${y}`
}

function formatHhMm(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`
}

export default function ScanPage() {
  const verifyToken = useMutation(api.presentation.verifyToken)

  const [location, setLocation] = React.useState("")
  const [scanning, setScanning] = React.useState(false)
  const [verifying, setVerifying] = React.useState(false)
  const [identity, setIdentity] = React.useState<Identity | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [manualToken, setManualToken] = React.useState("")

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const submittedRef = React.useRef<string | null>(null)

  const detector = React.useMemo(getBarcodeDetector, [])

  const handleSubmit = React.useCallback(
    async (token: string) => {
      const trimmed = token.trim()
      if (!trimmed) return
      if (submittedRef.current === trimmed) return
      submittedRef.current = trimmed
      setVerifying(true)
      setError(null)
      try {
        const result = await verifyToken({
          token: trimmed,
          ...(location.trim() ? { location: location.trim() } : {}),
        })
        setIdentity(result)
        setScanning(false)
      } catch (err) {
        setError(describeError(err, "Vérification impossible."))
        submittedRef.current = null
      } finally {
        setVerifying(false)
      }
    },
    [verifyToken, location],
  )

  // Camera + BarcodeDetector loop. Démarré quand `scanning` passe à true,
  // arrêté à l'inverse (et au démontage du composant).
  React.useEffect(() => {
    if (!scanning || !detector) return
    let stream: MediaStream | null = null
    let cancelled = false
    const det = new detector({ formats: ["qr_code"] })

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const tick = async () => {
          if (cancelled || submittedRef.current) return
          try {
            const codes = await det.detect(video)
            if (codes.length > 0) {
              await handleSubmit(codes[0]!.rawValue)
              return
            }
          } catch {
            /* frame indétectable — on retente */
          }
          if (!cancelled) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      } catch (err) {
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? scan.live.cameraDenied
            : scan.live.cameraUnavailable,
        )
        setScanning(false)
      }
    }
    start()

    return () => {
      cancelled = true
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [scanning, detector, handleSubmit])

  function reset() {
    setIdentity(null)
    setError(null)
    setManualToken("")
    submittedRef.current = null
  }

  return (
    <>
      <OpHeader sub={scan.sub} title={scan.title} />
      <div className="flex-1 overflow-auto p-7">
        <div className="mx-auto flex max-w-[760px] flex-col gap-5">
          {identity ? (
            <ResultCard
              identity={identity}
              onValidate={reset}
              onCancel={reset}
            />
          ) : (
            <ScannerCard
              hasDetector={detector !== null}
              scanning={scanning}
              verifying={verifying}
              videoRef={videoRef}
              location={location}
              onLocationChange={setLocation}
              onStart={() => {
                setError(null)
                submittedRef.current = null
                setScanning(true)
              }}
              onStop={() => setScanning(false)}
              manualToken={manualToken}
              onManualTokenChange={setManualToken}
              onManualSubmit={() => handleSubmit(manualToken)}
            />
          )}

          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[color:var(--idn-red-border,#FCA5A5)] bg-[color:var(--idn-red-soft,#FEE2E2)] p-3.5 text-sm text-[color:var(--idn-red-ink,#7F1D1D)] dark:border-[#7F1D1D] dark:bg-[#2A0F0F] dark:text-[#FCA5A5]"
            >
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

function ScannerCard({
  hasDetector,
  scanning,
  verifying,
  videoRef,
  location,
  onLocationChange,
  onStart,
  onStop,
  manualToken,
  onManualTokenChange,
  onManualSubmit,
}: {
  hasDetector: boolean
  scanning: boolean
  verifying: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  location: string
  onLocationChange: (v: string) => void
  onStart: () => void
  onStop: () => void
  manualToken: string
  onManualTokenChange: (v: string) => void
  onManualSubmit: () => void
}) {
  return (
    <IdnCard className="p-6">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-idn-surface-2 text-idn-muted"
        >
          <QrCodeIcon className="size-6" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
            {scan.sub}
          </div>
          <div className="mt-1 text-[18px] font-semibold text-idn-ink">
            {scan.reader.title}
          </div>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-idn-ink-2">
        {scan.reader.sub}
      </p>

      {hasDetector ? (
        <div className="mt-5 overflow-hidden rounded-[10px] border border-idn-border bg-black">
          <div className="relative aspect-square">
            <video
              ref={videoRef}
              className="absolute inset-0 size-full object-cover"
              playsInline
              muted
            />
            {!scanning ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.1em] text-white/60">
                {scan.live.startCta}
              </div>
            ) : null}
            {verifying ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
                {scan.live.verifying}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-[10px] border border-idn-border bg-idn-surface-2 p-3.5 text-xs text-idn-muted">
          {scan.live.scannerUnsupported}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {hasDetector ? (
          scanning ? (
            <Button variant="secondary" onClick={onStop} disabled={verifying}>
              {scan.live.stopCta}
            </Button>
          ) : (
            <Button onClick={onStart} disabled={verifying}>
              {scan.live.startCta}
            </Button>
          )
        ) : null}
      </div>

      <div className="mt-6 border-t border-idn-border pt-5">
        <label
          htmlFor="ctrl-location"
          className="text-[13px] font-semibold text-idn-ink"
        >
          {scan.live.locationLabel}
        </label>
        <input
          id="ctrl-location"
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder={scan.live.locationPlaceholder}
          className="mt-2 block w-full rounded-md border border-idn-border bg-idn-surface-2 p-2.5 text-sm text-idn-ink outline-none focus-visible:border-idn-green focus-visible:ring-2 focus-visible:ring-idn-green/30"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="ctrl-manual"
          className="text-[13px] font-semibold text-idn-ink"
        >
          {scan.live.manualLabel}
        </label>
        <textarea
          id="ctrl-manual"
          value={manualToken}
          onChange={(e) => onManualTokenChange(e.target.value)}
          placeholder={scan.live.manualPlaceholder}
          rows={3}
          className="mt-2 block w-full resize-none rounded-md border border-idn-border bg-idn-surface-2 p-3 font-mono text-[11px] text-idn-ink-2 outline-none focus-visible:border-idn-green focus-visible:ring-2 focus-visible:ring-idn-green/30"
        />
        <Button
          className="mt-3"
          onClick={onManualSubmit}
          disabled={verifying || !manualToken.trim()}
        >
          {scan.live.manualSubmit}
        </Button>
      </div>
    </IdnCard>
  )
}

function ResultCard({
  identity,
  onValidate,
  onCancel,
}: {
  identity: Identity
  onValidate: () => void
  onCancel: () => void
}) {
  const fullName = `${identity.firstName} ${identity.lastName}`.trim()
  return (
    <IdnCard className="p-6">
      <div className="flex items-center gap-4">
        <AvatarInitials
          initials={initials(identity.firstName, identity.lastName)}
          size={56}
          rounded="lg"
        />
        <div className="flex-1">
          <div className="text-[18px] font-semibold text-idn-ink">
            {fullName}
          </div>
          <div className="mt-1 text-sm text-idn-ink-2">
            {formatBirth(identity.dateOfBirth)}
          </div>
          <div className="mt-2 inline-block rounded-full bg-idn-surface-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.05em] text-idn-muted">
            {identity.idnId}
          </div>
        </div>
        <div className="inline-flex items-center rounded-full bg-idn-green-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
          {scan.result.levelLabel(identity.loa)}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-[10px] bg-idn-green-soft p-3.5 dark:bg-[#0F2A18]">
        <CheckIcon
          aria-hidden="true"
          className="mt-px size-4 shrink-0 text-idn-green dark:text-idn-green-on-dark"
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-idn-ink">
            {scan.result.signatureTitle}
          </div>
          <div className="mt-1 font-mono text-[11px] leading-[1.6] text-idn-muted">
            {scan.result.signatureMeta(formatHhMm(identity.expiresAt))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-idn-muted">{scan.result.notice}</p>

      <div className="mt-5 flex gap-2">
        <Button onClick={onValidate}>{scan.result.validateCta}</Button>
        <Button variant="secondary" onClick={onCancel}>
          {scan.result.cancelCta}
        </Button>
      </div>
    </IdnCard>
  )
}
