"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"

import { IdnIcons } from "./icons"

type Role = "admin" | "identity_controller" | "developer"

/**
 * Actions par ligne dans la liste des opérateurs (page /roles).
 *
 * - Tous rôles : bouton Révoquer (mutation `admin.roles.revoke`).
 * - Rôle `developer` : bouton Valider/Suspendre la production
 *   (mutation `admin.roles.setDeveloperVerified`).
 *
 * Le self-revoke admin est bloqué côté backend (FORBIDDEN_SELF_REVOKE).
 */
export function OperatorRowActions({
  userId,
  role,
  verified,
}: {
  userId: string
  role: Role
  verified: boolean
}) {
  const revoke = useMutation(api.admin.roles.revoke)
  const setVerified = useMutation(api.admin.roles.setDeveloperVerified)
  const [busy, setBusy] = useState<"revoke" | "verify" | null>(null)

  const onRevoke = async () => {
    if (!confirm("Révoquer ce rôle ? L'opérateur perdra l'accès.")) return
    setBusy("revoke")
    try {
      await revoke({ userId, role })
      toast.success("Rôle révoqué.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Révocation impossible.")
    } finally {
      setBusy(null)
    }
  }

  const onToggleVerified = async () => {
    setBusy("verify")
    try {
      await setVerified({ userId, verified: !verified })
      toast.success(
        verified
          ? "Validation production retirée."
          : "Développeur validé pour la production.",
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {role === "developer" ? (
        <button
          type="button"
          onClick={onToggleVerified}
          disabled={busy !== null}
          className={
            "inline-flex h-7 items-center whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-50 " +
            (verified
              ? "border-idn-border bg-transparent text-idn-ink hover:bg-idn-surface-2"
              : "border-idn-green bg-idn-green text-white hover:bg-idn-green-dark")
          }
        >
          {busy === "verify"
            ? "…"
            : verified
              ? "Retirer prod."
              : "Valider prod."}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onRevoke}
        disabled={busy !== null}
        aria-label="Révoquer"
        title="Révoquer le rôle"
        className="inline-flex h-7 items-center whitespace-nowrap rounded-lg border border-idn-border bg-transparent px-2 text-[11px] font-medium text-idn-muted outline-none hover:bg-idn-surface-2 hover:text-[#B83A3A] focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-50"
      >
        {busy === "revoke" ? "…" : "Révoquer"}
      </button>
      <button
        type="button"
        className="text-idn-muted outline-none hover:text-idn-ink focus-visible:ring-2 focus-visible:ring-idn-green"
        aria-hidden
        tabIndex={-1}
      >
        {IdnIcons.more}
      </button>
    </div>
  )
}
