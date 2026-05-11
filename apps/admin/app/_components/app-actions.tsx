"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"

/**
 * Boutons "Désactiver" / "Approuver pour production" du détail d'application.
 * Affichage conditionnel selon `disabled` et `status`.
 */
export function AppActions({
  clientId,
  status,
  disabled,
}: {
  clientId: string
  status: "production" | "pending" | "sandbox" | "disabled"
  disabled: boolean
}) {
  const router = useRouter()
  const approve = useMutation(api.admin.oauthApps.approveApp)
  const disableApp = useMutation(api.admin.oauthApps.disableApp)
  const [busy, setBusy] = useState<"approve" | "disable" | null>(null)

  const canApprove = status === "pending" || disabled
  const canDisable = !disabled

  const onApprove = async () => {
    setBusy("approve")
    try {
      await approve({ clientId })
      toast.success("Application approuvée pour la production.")
      router.refresh()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Approbation impossible.",
      )
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
      {canApprove ? (
        <button
          type="button"
          onClick={onApprove}
          disabled={busy !== null}
          className="inline-flex h-8 items-center rounded-lg border border-idn-green bg-idn-green px-3 text-[13px] font-medium text-white outline-none hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {busy === "approve" ? "…" : "Approuver pour production"}
        </button>
      ) : null}
    </>
  )
}
