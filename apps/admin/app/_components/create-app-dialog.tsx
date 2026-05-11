"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
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

/**
 * Dialog "Nouvelle app" — bouton primaire en en-tête de la page Applications.
 * Crée une OAuth app en statut `pending` (à approuver ensuite pour la
 * production).
 */
export function CreateAppDialog() {
  const router = useRouter()
  const createApp = useMutation(api.admin.oauthApps.createApp)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("")
  const [redirect, setRedirect] = useState("")
  const [scopes, setScopes] = useState("profile, email")
  const [loa, setLoa] = useState<1 | 2 | 3>(2)

  const reset = () => {
    setName("")
    setRedirect("")
    setScopes("profile, email")
    setLoa(2)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { clientId } = await createApp({
        name,
        redirectUrls: redirect,
        scopes,
        loa,
      })
      toast.success(`Application créée (client_id : ${clientId}).`)
      setOpen(false)
      reset()
      router.refresh()
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
          Nouvelle app
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nouvelle application OAuth</DialogTitle>
          <DialogDescription>
            Crée une application en mode <em>pending</em>. Elle devra être
            approuvée pour passer en production.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-app-name">Nom</Label>
            <Input
              id="new-app-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Bourses Étudiantes"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-app-redirect">Redirect URI</Label>
            <Input
              id="new-app-redirect"
              value={redirect}
              onChange={(e) => setRedirect(e.target.value)}
              required
              placeholder="https://exemple.ga/auth/callback"
              type="url"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-app-scopes">Scopes</Label>
            <Input
              id="new-app-scopes"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              placeholder="profile, email, birth_cert"
            />
            <p className="text-[11px] text-idn-muted">
              Séparés par des virgules.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Niveau min. requis</Label>
            <div className="flex gap-2">
              {[1, 2, 3].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLoa(l as 1 | 2 | 3)}
                  className={
                    "h-9 flex-1 rounded-lg border text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green " +
                    (loa === l
                      ? "border-idn-green bg-idn-green-soft text-idn-green"
                      : "border-idn-border bg-transparent text-idn-ink hover:bg-idn-surface-2")
                  }
                >
                  Niveau {l}
                </button>
              ))}
            </div>
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
              {busy ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
