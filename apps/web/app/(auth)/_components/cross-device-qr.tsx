"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { QRCodeSVG } from "qrcode.react"
import { CheckCircle2Icon, Loader2Icon, RefreshCwIcon, XIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { api } from "@repo/backend/convex/_generated/api"

import { signIn } from "../_content/fr"

type Props = {
  onApproved: (email: string) => void
  onClose: () => void
}

/**
 * Modal de connexion cross-device.
 *
 * Crée une session via `crossDevice.createSession`, affiche le QR
 * `idn:cross-device:<sessionCode>`, et poll `crossDevice.getStatus`
 * toutes les 2.5s. Lorsque le téléphone a approuvé, on remonte l'email
 * du compte au parent pour pré-remplir l'étape PIN du sign-in.
 */
export function CrossDeviceQr({ onApproved, onClose }: Props) {
  const createSession = useMutation(api.crossDevice.createSession)
  const cancelSession = useMutation(api.crossDevice.cancelSession)
  const [sessionCode, setSessionCode] = React.useState<string | null>(null)
  const [expiresAt, setExpiresAt] = React.useState<number | null>(null)
  const [bootError, setBootError] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)

  // Le hook useQuery skip tant qu'on n'a pas de sessionCode.
  const status = useQuery(
    api.crossDevice.getStatus,
    sessionCode ? { sessionCode } : "skip",
  )

  const create = React.useCallback(async () => {
    if (creating) return
    setCreating(true)
    setBootError(null)
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : undefined
      const res = await createSession({ userAgent: ua })
      setSessionCode(res.sessionCode)
      setExpiresAt(res.expiresAt)
    } catch {
      setBootError(signIn.qrError)
    } finally {
      setCreating(false)
    }
  }, [createSession, creating])

  // Crée la session au montage.
  React.useEffect(() => {
    void create()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Remonte l'approbation au parent.
  React.useEffect(() => {
    if (status && status.status === "approved") {
      onApproved(status.approvedEmail)
    }
  }, [status, onApproved])

  // Annule côté serveur à la fermeture.
  const handleClose = React.useCallback(async () => {
    if (sessionCode) {
      try {
        await cancelSession({ sessionCode })
      } catch {
        // ignore
      }
    }
    onClose()
  }, [cancelSession, onClose, sessionCode])

  const handleRefresh = React.useCallback(async () => {
    if (sessionCode) {
      try {
        await cancelSession({ sessionCode })
      } catch {
        // ignore
      }
    }
    setSessionCode(null)
    setExpiresAt(null)
    await create()
  }, [cancelSession, create, sessionCode])

  const qrPayload = sessionCode ? `idn:cross-device:${sessionCode}` : null
  const isExpired = status?.status === "expired" || status?.status === "cancelled"
  const isApproved = status?.status === "approved"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cross-device-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-2xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label={signIn.qrCancel}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <XIcon className="size-4" aria-hidden />
        </button>

        <h2
          id="cross-device-title"
          className="pr-8 text-lg font-semibold tracking-[-0.01em] text-foreground"
        >
          {signIn.qrModalTitle}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {signIn.qrModalSub}
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="relative grid size-[240px] place-items-center overflow-hidden rounded-xl border bg-white p-4">
            {isApproved ? (
              <div className="flex flex-col items-center gap-2 text-idn-green">
                <CheckCircle2Icon className="size-16" aria-hidden />
                <span className="text-sm font-semibold">{signIn.qrApproved}</span>
              </div>
            ) : isExpired ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <XIcon className="size-10" aria-hidden />
                <span className="text-xs font-medium">{signIn.qrExpired}</span>
              </div>
            ) : qrPayload ? (
              <QRCodeSVG
                value={qrPayload}
                size={208}
                level="M"
                bgColor="#ffffff"
                fgColor="#0a0a0a"
              />
            ) : bootError ? (
              <div className="flex flex-col items-center gap-2 text-destructive">
                <span className="text-xs">{bootError}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2Icon className="size-6 animate-spin" aria-hidden />
                <span className="text-xs">{signIn.qrLoading}</span>
              </div>
            )}
          </div>

          {isApproved ? (
            <p className="text-center text-xs text-muted-foreground">
              {signIn.qrApprovedSub}
            </p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={creating || status === undefined}
              className="text-xs"
            >
              <RefreshCwIcon className="size-3" aria-hidden />
              {signIn.qrRefresh}
            </Button>
          )}

          {expiresAt && status?.status === "pending" ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {Math.max(0, Math.ceil((expiresAt - Date.now()) / 60_000))} min restantes
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
