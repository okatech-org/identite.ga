"use client"

import { useState } from "react"
import { useAction } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { IdnIcons } from "./icons"

type Role = "identity_controller" | "developer"

const ROLE_LABEL: Record<Role, string> = {
  identity_controller: "Contrôleur d'identité",
  developer: "Développeur",
}

/**
 * Dialog "Nouvel opérateur" — crée le compte Better Auth + assigne
 * le rôle choisi. Pour les développeurs créés via cette UI, on pose
 * `verified=true` par défaut (le super-admin confirme déjà l'identité
 * en créant le compte manuellement).
 */
export function CreateOperatorDialog({
  defaultRole = "identity_controller",
  triggerLabel,
}: {
  defaultRole?: Role
  triggerLabel?: string
}) {
  const createOperator = useAction(api.admin.operators.createOperator)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>(defaultRole)

  const reset = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole(defaultRole)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await createOperator({
        email,
        password,
        name,
        role,
        // Un compte développeur créé directement par le super-admin
        // démarre validé (sinon il ne pourrait rien publier en production).
        verified: role === "developer" ? true : undefined,
      })
      toast.success(`Compte ${ROLE_LABEL[role]} créé.`)
      setOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Création impossible.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-idn-green bg-idn-green px-3 text-[13px] font-medium text-white outline-none transition-colors hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2"
        >
          <span aria-hidden>{IdnIcons.plus}</span>
          {triggerLabel ?? "Nouvel opérateur"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Nouvel opérateur</DialogTitle>
          <DialogDescription>
            Crée un compte Better Auth et assigne le rôle choisi. Le mot de
            passe sera communiqué hors-ligne à l&apos;intéressé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <div className="flex gap-2">
              {(Object.entries(ROLE_LABEL) as [Role, string][]).map(
                ([r, label]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={
                      "h-9 flex-1 rounded-lg border text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green " +
                      (role === r
                        ? "border-idn-green bg-idn-green-soft text-idn-green"
                        : "border-idn-border bg-transparent text-idn-ink hover:bg-idn-surface-2")
                    }
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="op-name">Nom complet</Label>
            <Input
              id="op-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Marie Ndong"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="op-email">Email professionnel</Label>
            <Input
              id="op-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="off"
              placeholder="m.ndong@identite.ga"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="op-password">Mot de passe provisoire</Label>
            <Input
              id="op-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="text"
              autoComplete="off"
              minLength={12}
              placeholder="Au moins 12 caractères"
            />
            <p className="text-[11px] text-idn-muted">
              L&apos;agent devra le changer à sa première connexion.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Création…" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
