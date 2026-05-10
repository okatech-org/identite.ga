"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { LogOutIcon } from "lucide-react"
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

import { sessions as sessionsCopy, settings } from "../../_content/fr"

type Session = {
  id: string
  device: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: number
  expiresAt: number
  isCurrent: boolean
}

function SessionRow({ session }: { session: Session }) {
  const [open, setOpen] = React.useState(false)
  const [revoking, setRevoking] = React.useState(false)
  const revoke = useMutation(api.sessions.revoke)

  const onRevoke = async () => {
    setRevoking(true)
    try {
      await revoke({ sessionId: session.id })
      toast.success(settings.sessions.revokeSuccessToast)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
      setRevoking(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-idn-border-soft py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-6",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {session.device || settings.sessions.deviceFallback}
          </p>
          {session.isCurrent && (
            <span className="rounded-full bg-idn-green-soft px-2 py-0.5 text-[11px] font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
              {settings.sessions.current}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {session.ipAddress ?? "IP inconnue"}
          {" · "}
          créée le {new Date(session.createdAt).toLocaleString("fr-FR")}
        </p>
      </div>
      {!session.isCurrent && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={revoking}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {revoking ? "…" : settings.sessions.revoke}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{sessionsCopy.confirmRevokeTitle(session.device)}</AlertDialogTitle>
              <AlertDialogDescription>
                {sessionsCopy.confirmRevokeBody}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={revoking}>
                {sessionsCopy.confirmCancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  void onRevoke()
                }}
                disabled={revoking}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {revoking ? "…" : sessionsCopy.confirmRevokeAction}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

export function SessionsTab() {
  const data = useQuery(api.sessions.listMine)
  const revokeAllOthers = useMutation(api.sessions.revokeAllOthers)
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const isLoading = data === undefined
  const list = (data ?? []) as Session[]
  const others = list.filter((s) => !s.isCurrent)

  const onRevokeAll = async () => {
    setSubmitting(true)
    try {
      await revokeAllOthers()
      toast.success(settings.sessions.revokeAllSuccess)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {settings.sessions.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{settings.sessions.sub}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {isLoading
              ? "…"
              : list.length === 0
                ? settings.sessions.countEmpty
                : list.length === 1
                  ? settings.sessions.countSingle
                  : settings.sessions.countMany(list.length)}
          </p>
        </div>
        {others.length > 0 && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOutIcon aria-hidden="true" />
                {settings.sessions.revokeAllOthers}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{settings.sessions.confirmAllOthersTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {settings.sessions.confirmAllOthersBody}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    void onRevokeAll()
                  }}
                  disabled={submitting}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {submitting ? "…" : "Tout déconnecter"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded bg-secondary" />
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{settings.sessions.countEmpty}</p>
        ) : (
          list.map((s) => <SessionRow key={s.id} session={s} />)
        )}
      </div>
    </section>
  )
}
