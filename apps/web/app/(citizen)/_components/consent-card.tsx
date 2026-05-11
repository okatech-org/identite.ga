"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { consents, formatLongDate } from "../_content/fr"

type ConsentCardProps = {
  /** Record id (oauthConsent._id) — gardé pour key React + audit éventuel. */
  id: string
  /** OAuth client_id — ce qu'on cible pour révoquer tous les consents user+app. */
  clientId: string
  name: string
  description?: string | null
  scopes: readonly string[]
  grantedAt: number
  className?: string
}

export function ConsentCard({
  id,
  clientId,
  name,
  description,
  scopes,
  grantedAt,
  className,
}: ConsentCardProps) {
  const [open, setOpen] = React.useState(false)
  const [revoking, setRevoking] = React.useState(false)
  // revokeForClient supprime TOUS les records oauthConsent pour ce couple
  // user+client — sémantique attendue par l'utilisateur ("je retire mon
  // accord à cette app", pas "je supprime un record technique"). C'est
  // aussi ce qui force oidcProvider à ré-afficher le consent screen au
  // prochain login depuis cette app.
  const revoke = useMutation(api.oauthConsents.revokeForClient)
  void id

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      await revoke({ clientId })
      toast.success(consents.revokeSuccessToast)
      setOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : consents.revokeErrorToast
      toast.error(message)
      setRevoking(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-5",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-secondary text-base font-semibold text-foreground"
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        {(description || grantedAt) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {description ? `${description} · ` : ""}
            {grantedAt ? consents.grantedOn(formatLongDate(grantedAt)) : ""}
          </p>
        )}
        {scopes.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {scopes.map((scope) => (
              <li
                key={scope}
                className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {scope}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={revoking}
            className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-auto"
          >
            {revoking ? "…" : consents.revoke}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {consents.confirmRevokeTitle(name)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {consents.confirmRevokeBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>
              {consents.confirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleRevoke()
              }}
              disabled={revoking}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {revoking ? "…" : consents.confirmRevokeAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
