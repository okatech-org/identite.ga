"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"

/**
 * Boutons "Désactiver" / "Approuver pour production" du détail d'application.
 * Affichage conditionnel selon `disabled` et `status`.
 *
 * Une demande Production peut maintenant être traitée depuis l'un ou l'autre
 * environnement. Les mutations prennent toujours le clientId de la Sandbox.
 * Pour les applications créées directement par l'admin, on conserve
 * l'ancien circuit `approveApp`.
 */
export function AppActions({
  clientId,
  status,
  disabled,
  sandboxClientId,
  productionStatus,
}: {
  clientId: string
  status: "production" | "pending" | "sandbox" | "disabled"
  disabled: boolean
  sandboxClientId: string | null
  productionStatus: "none" | "pending" | "approved" | "rejected"
}) {
  const router = useRouter()
  const approve = useMutation(api.admin.oauthApps.approveApp)
  const disableApp = useMutation(api.admin.oauthApps.disableApp)
  const approveProductionRequest = useMutation(
    api.admin.oauthApps.approveProductionRequest,
  )
  const rejectProductionRequest = useMutation(
    api.admin.oauthApps.rejectProductionRequest,
  )
  const [busy, setBusy] = useState<"approve" | "disable" | "reject" | null>(
    null,
  )

  const isProdRequest =
    productionStatus === "pending" && Boolean(sandboxClientId)
  const canApprove = isProdRequest || status === "pending" || disabled
  const canDisable = !disabled && !isProdRequest
  const canReject = isProdRequest

  const onApprove = async () => {
    setBusy("approve")
    try {
      if (isProdRequest && sandboxClientId) {
        await approveProductionRequest({ clientId: sandboxClientId })
      } else {
        await approve({ clientId })
      }
      toast.success("Application approuvée pour la production.")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approbation impossible.")
    } finally {
      setBusy(null)
    }
  }

  const onReject = async () => {
    if (!sandboxClientId) return
    const reason = window.prompt("Raison du refus (optionnel) :") ?? ""
    setBusy("reject")
    try {
      await rejectProductionRequest({
        clientId: sandboxClientId,
        reason,
      })
      toast.success("Demande de production refusée.")
      router.push(`/apps/${sandboxClientId}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refus impossible.")
    } finally {
      setBusy(null)
    }
  }

  const onDisable = async () => {
    setBusy("disable")
    try {
      await disableApp({ clientId })
      toast.success("Application désactivée.")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Désactivation impossible.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {canDisable ? (
        <button
          type="button"
          onClick={onDisable}
          disabled={busy !== null}
          className="inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-50"
        >
          {busy === "disable" ? "…" : "Désactiver"}
        </button>
      ) : null}
      {canReject ? (
        <button
          type="button"
          onClick={onReject}
          disabled={busy !== null}
          className="inline-flex h-8 items-center rounded-lg border border-destructive bg-transparent px-3 text-[13px] font-medium text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive disabled:opacity-50"
        >
          {busy === "reject" ? "…" : "Refuser la demande"}
        </button>
      ) : null}
      {canApprove ? (
        <button
          type="button"
          onClick={onApprove}
          disabled={busy !== null}
          className="inline-flex h-8 items-center rounded-lg border border-idn-green bg-idn-green px-3 text-[13px] font-medium text-white outline-none hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {busy === "approve"
            ? "…"
            : isProdRequest
              ? "Approuver la demande"
              : "Approuver pour production"}
        </button>
      ) : null}
    </>
  )
}
