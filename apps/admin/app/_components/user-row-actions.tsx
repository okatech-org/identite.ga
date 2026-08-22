"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
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

import { fr } from "../_content/fr"
import { IdnIcons } from "./icons"

type Mode = "anonymize" | "delete"

const t = fr.users.actions

/**
 * Actions destructrices sur un compte IDN.
 *
 * Deux niveaux, jamais confondus : anonymiser laisse vivre le compte Better
 * Auth (le handle @idn.ga reste réservé), supprimer le détruit et libère le
 * handle. Comme aucune des deux n'est réversible, la modale exige la recopie
 * de l'identifiant du compte — le serveur revérifie cette saisie, la modale
 * n'est qu'un premier filet.
 */
export function UserRowActions({
  userId,
  idnId,
  email,
  deletedAt,
}: {
  userId: string
  idnId?: string
  email: string
  deletedAt?: number
}) {
  const anonymize = useMutation(api.admin.accounts.anonymizeUser)
  const hardDelete = useMutation(api.admin.accounts.deleteUserPermanently)

  const [mode, setMode] = useState<Mode | null>(null)
  const [confirm, setConfirm] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  // Même règle que le serveur : l'IDN fait foi, l'email prend le relais
  // quand le profil n'a jamais été complété.
  const expected = idnId ?? email

  const close = () => {
    setMode(null)
    setConfirm("")
    setReason("")
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mode) return
    setBusy(true)
    try {
      const args = {
        userId,
        confirmIdnId: confirm,
        reason: reason.trim() || undefined,
      }
      if (mode === "anonymize") {
        await anonymize(args)
        toast.success(t.anonymized)
      } else {
        await hardDelete(args)
        toast.success(t.deleted)
      }
      close()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setMode("anonymize")}
          disabled={deletedAt !== undefined}
          title={
            deletedAt !== undefined ? "Compte déjà anonymisé" : t.anonymizeTitle
          }
          className="inline-flex h-7 items-center whitespace-nowrap rounded-lg border border-idn-border bg-transparent px-2.5 text-[11px] font-medium text-idn-muted outline-none hover:bg-idn-surface-2 hover:text-idn-ink focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-40"
        >
          {t.anonymize}
        </button>
        <button
          type="button"
          onClick={() => setMode("delete")}
          title={t.deleteTitle}
          className="inline-flex h-7 items-center whitespace-nowrap rounded-lg border border-idn-border bg-transparent px-2.5 text-[11px] font-medium text-idn-muted outline-none hover:border-[#B83A3A] hover:bg-idn-surface-2 hover:text-[#B83A3A] focus-visible:ring-2 focus-visible:ring-idn-green"
        >
          {t.delete}
        </button>
      </div>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {mode === "delete" ? t.deleteTitle : t.anonymizeTitle}
            </DialogTitle>
            <DialogDescription>
              {mode === "delete" ? t.deleteBody : t.anonymizeBody}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-[12px] text-idn-muted">{t.auditNote}</p>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-account">{t.confirmLabel}</Label>
              <div className="flex items-center gap-2 rounded-lg border border-idn-border bg-idn-surface-2 px-2.5 py-1.5">
                <code className="flex-1 select-all break-all font-mono text-[13px] text-idn-ink">
                  {expected}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(expected)
                    toast.success(t.confirmCopied)
                  }}
                  aria-label={t.confirmCopy}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-idn-muted outline-none hover:text-idn-ink focus-visible:ring-2 focus-visible:ring-idn-green"
                >
                  {IdnIcons.copy} Copier
                </button>
              </div>
              <Input
                id="confirm-account"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                required
                placeholder={expected}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delete-reason">{t.reasonLabel}</Label>
              <Input
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Doublon de GA-XXXX-XXXX"
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={busy || confirm.trim() === ""}
                className={
                  "inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2 disabled:opacity-50 " +
                  (mode === "delete"
                    ? "bg-[#B83A3A] hover:bg-[#9C2F2F]"
                    : "bg-idn-green hover:bg-idn-green-dark")
                }
              >
                {busy ? "…" : mode === "delete" ? t.delete : t.anonymize}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Les garde-fous serveur renvoient un `ConvexError` porteur d'un code —
 * on le traduit ici plutôt que d'exposer le message brut.
 */
function errorMessage(err: unknown): string {
  if (err instanceof ConvexError) {
    const data = err.data as { code?: string; message?: string }
    switch (data?.code) {
      case "FORBIDDEN_SELF_DELETE":
        return "Vous ne pouvez pas supprimer votre propre compte."
      case "FORBIDDEN_ADMIN_TARGET":
        return "Ce compte est administrateur. Retirez-lui d'abord ce rôle depuis Rôles & habilitations."
      case "CONFIRMATION_MISMATCH":
        return "L'identifiant saisi ne correspond pas à ce compte."
      case "ALREADY_ANONYMIZED":
        return "Ce compte est déjà anonymisé."
      case "NOT_FOUND":
        return "Compte introuvable."
      default:
        return data?.message ?? "Action impossible."
    }
  }
  return err instanceof Error ? err.message : "Action impossible."
}
