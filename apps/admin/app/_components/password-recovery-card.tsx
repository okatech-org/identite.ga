"use client"

import { useState } from "react"
import { useAction } from "convex/react"
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

type IssuedCode = {
  code: string
  expiresAt: number
}

/**
 * Voie de secours opérateur quand le citoyen ne reçoit pas son code.
 *
 * Le secret n'est gardé que dans l'état de cette modale. Dès sa fermeture,
 * l'opérateur ne peut plus le relire et doit en générer un nouveau, ce qui
 * invalide automatiquement le précédent.
 */
export function PasswordRecoveryCard({
  userId,
  idnId,
  email,
  authExists,
  deletedAt,
  hasAdminRole,
}: {
  userId: string
  idnId?: string
  email: string
  authExists: boolean
  deletedAt?: number
  hasAdminRole: boolean
}) {
  const generate = useAction(api.admin.accounts.generatePasswordResetCode)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [issued, setIssued] = useState<IssuedCode | null>(null)
  const [busy, setBusy] = useState(false)

  const expected = idnId ?? email
  const disabledReason = !authExists
    ? "Compte d’authentification absent"
    : deletedAt !== undefined
      ? "Compte anonymisé"
      : hasAdminRole
        ? "Procédure renforcée requise pour un administrateur"
        : !expected
          ? "Identifiant du compte absent"
          : null

  const close = () => {
    setOpen(false)
    setConfirm("")
    setIssued(null)
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!expected) return
    setBusy(true)
    try {
      const result = await generate({
        userId,
        confirmIdentifier: confirm,
      })
      setIssued(result)
      setConfirm("")
    } catch (error) {
      toast.error(recoveryErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.code)
      toast.success("Code copié.")
    } catch {
      toast.error("Copie impossible. Recopiez le code affiché.")
    }
  }

  return (
    <>
      <section className="portal-panel p-5">
        <h2 className="text-[13px] font-semibold text-idn-ink">
          Récupération du mot de passe
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-idn-muted">
          Créez un code provisoire si l’utilisateur ne reçoit pas le code de
          récupération. Vérifiez son identité avant de lui remettre le code.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabledReason !== null}
          title={disabledReason ?? "Générer un code à usage unique"}
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-idn-green px-3 text-[13px] font-medium text-white outline-none hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Générer un code provisoire
        </button>
        {disabledReason ? (
          <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
            {disabledReason}
          </p>
        ) : null}
      </section>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          {issued ? (
            <>
              <DialogHeader>
                <DialogTitle>Code provisoire créé</DialogTitle>
                <DialogDescription>
                  Ce code ne sera affiché qu’une fois. Remettez-le au titulaire
                  après vérification de son identité.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-idn-border bg-idn-surface-2 px-5 py-5 text-center">
                <p
                  aria-label={`Code provisoire ${issued.code}`}
                  className="select-all font-mono text-3xl font-semibold tracking-[0.28em] text-idn-ink"
                >
                  {issued.code}
                </p>
                <p className="mt-3 text-xs text-idn-muted">
                  Valable jusqu’à{" "}
                  {new Date(issued.expiresAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  , pour trois tentatives maximum.
                </p>
              </div>

              <div className="rounded-lg border border-idn-border px-3 py-3 text-xs leading-relaxed text-idn-muted">
                L’utilisateur ouvre <strong>identite.ga/forgot-password</strong>
                , saisit <strong>{email}</strong>, puis choisit « J’ai déjà un
                code provisoire » avant de définir son nouveau mot de passe.
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex h-9 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="inline-flex h-9 items-center rounded-lg bg-idn-green px-3 text-[13px] font-medium text-white outline-none hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2"
                >
                  Copier le code
                </button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Générer un code provisoire</DialogTitle>
                <DialogDescription>
                  Cette action invalide tout code de réinitialisation précédent.
                  Le nouveau code sera valable 15 minutes et journalisé sans sa
                  valeur.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  Confirmez l’identité du titulaire par la procédure support
                  avant de communiquer ce code.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password-recovery">
                    Recopiez {expected} pour confirmer
                  </Label>
                  <Input
                    id="confirm-password-recovery"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="off"
                    required
                    placeholder={expected}
                  />
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-9 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={busy || confirm.trim() === ""}
                    className="inline-flex h-9 items-center rounded-lg bg-idn-green px-3 text-[13px] font-medium text-white outline-none hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    {busy ? "Génération…" : "Générer le code"}
                  </button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function recoveryErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string }
    switch (data.code) {
      case "CONFIRMATION_MISMATCH":
        return "L’identifiant saisi ne correspond pas à ce compte."
      case "FORBIDDEN_SELF_RECOVERY":
      case "FORBIDDEN_ADMIN_TARGET":
        return "La récupération d’un compte administrateur suit une procédure renforcée."
      case "ALREADY_ANONYMIZED":
        return "Un compte anonymisé ne peut pas être récupéré."
      case "AUTH_ACCOUNT_NOT_FOUND":
        return "Le compte d’authentification est absent."
      case "NOT_FOUND":
        return "Compte introuvable."
      default:
        return data.message ?? "Impossible de générer le code."
    }
  }
  return error instanceof Error
    ? error.message
    : "Impossible de générer le code."
}
