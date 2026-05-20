"use client"

import * as React from "react"
import { ShieldCheck } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Switch } from "@repo/ui/components/switch"

import { idoc } from "../_content/fr"
import { useVault } from "../_hooks/use-vault"

/**
 * VaultGate — wrap iDocument. Affiche un écran d'activation/déverrouillage
 * tant que la MVK n'est pas chargée en mémoire. Une fois déverrouillé,
 * rend les enfants.
 */
export function VaultGate({ children }: { children: React.ReactNode }) {
  const { status, activate, unlock } = useVault()
  const [password, setPassword] = React.useState("")
  const [hint, setHint] = React.useState("")
  const [remember, setRemember] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (status.phase === "unlocked") return <>{children}</>

  if (status.phase === "loading" || status.phase === "unauth") {
    return (
      <section className="mx-auto flex w-full flex-1 items-center justify-center px-5 py-12 md:px-4 lg:px-20">
        <p className="text-sm text-muted-foreground">{idoc.vault.loading}</p>
      </section>
    )
  }

  const activating = status.phase === "inactive"
  const passwordHint =
    status.phase === "locked" ? status.passwordHint : undefined

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (password.length < 8) {
      setError(idoc.vault.minLengthError)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (activating) {
        await activate(password, hint || undefined)
      } else {
        await unlock(password, remember)
      }
      setPassword("")
      setHint("")
    } catch (err) {
      setError(err instanceof Error ? err.message : idoc.vault.fallbackError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex w-full flex-1 items-center px-5 py-12 md:px-4 md:py-20 lg:px-20">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {activating ? idoc.vault.activateTitle : idoc.vault.unlockTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activating ? idoc.vault.activateDesc : idoc.vault.unlockDesc}
            </p>
            {passwordHint ? (
              <p className="pt-1 text-xs italic text-muted-foreground">
                {idoc.vault.hintRow(passwordHint)}
              </p>
            ) : null}
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vault-password">
              {activating
                ? idoc.vault.newPasswordLabel
                : idoc.vault.passwordLabel}
            </Label>
            <Input
              id="vault-password"
              type="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          {activating ? (
            <div className="space-y-1.5">
              <Label htmlFor="vault-hint">{idoc.vault.hintLabel}</Label>
              <Input
                id="vault-hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder={idoc.vault.hintPlaceholder}
                disabled={submitting}
                maxLength={200}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
              <div className="space-y-0.5">
                <Label
                  htmlFor="vault-remember"
                  className="text-sm font-medium"
                >
                  {idoc.vault.rememberLabel}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {idoc.vault.rememberDesc}
                </p>
              </div>
              <Switch
                id="vault-remember"
                checked={remember}
                onCheckedChange={setRemember}
                disabled={submitting}
              />
            </div>
          )}

          {error ? (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? idoc.vault.submitting
              : activating
                ? idoc.vault.activate
                : idoc.vault.unlock}
          </Button>

          {activating ? (
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {idoc.vault.irrecoverable}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
