"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
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
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { fr } from "../../../_content/fr"
import {
  SettingsRow,
  SettingsSection,
} from "../../../_components/settings-section"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function AccountTab() {
  const me = useQuery(api.profile.getCurrentUser)

  if (me === undefined) {
    return <div className="h-40 animate-pulse rounded-xl bg-idn-surface-2" />
  }
  if (me === null) {
    return (
      <div className="rounded-xl border border-idn-border bg-idn-surface p-6 text-sm text-idn-muted">
        Session introuvable. Reconnectez-vous.
      </div>
    )
  }

  const firstName = me.profile?.pivot?.firstName ?? ""
  const lastName = me.profile?.pivot?.lastName ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const displayName = fullName || me.email.split("@")[0]

  return (
    <div className="space-y-5">
      <SettingsSection
        title={fr.settings.account.title}
        sub={fr.settings.account.sub}
      >
        <SettingsRow
          label={fr.settings.account.nameLabel}
          trailing={<span className="text-sm text-idn-ink">{displayName}</span>}
        />
        <SettingsRow
          label={fr.settings.account.emailLabel}
          description={fr.settings.account.emailHelper}
          trailing={
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-idn-ink">{me.email}</span>
              <span
                className={
                  me.emailVerified
                    ? "rounded-full bg-idn-green-soft px-2 py-0.5 text-[10px] font-semibold text-idn-green dark:bg-[#0F2A18]"
                    : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }
              >
                {me.emailVerified
                  ? fr.settings.account.verifiedYes
                  : fr.settings.account.verifiedNo}
              </span>
            </div>
          }
        />
        <SettingsRow
          label={fr.settings.account.roleLabel}
          trailing={
            <span className="rounded-full bg-idn-green-soft px-2 py-0.5 text-xs font-semibold text-idn-green dark:bg-[#0F2A18]">
              {fr.settings.account.roleValue}
            </span>
          }
        />
      </SettingsSection>

      <SettingsSection
        title={fr.settings.password.title}
        sub={fr.settings.password.sub}
      >
        <PasswordChangeRow />
      </SettingsSection>
    </div>
  )
}

function PasswordChangeRow() {
  const [open, setOpen] = React.useState(false)
  const [currentPassword, setCurrent] = React.useState("")
  const [newPassword, setNew] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const changePassword = useMutation(api.account.changePassword)

  const reset = () => {
    setCurrent("")
    setNew("")
    setError(null)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword.length < 12) {
      setError(fr.settings.password.errorTooShort)
      return
    }
    if (currentPassword === newPassword) {
      setError(fr.settings.password.errorSame)
      return
    }
    setSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword })
      toast.success(fr.settings.password.successToast)
      setOpen(false)
      reset()
    } catch (err) {
      setError(describeError(err, fr.signUp.errorGeneric))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsRow
      label={fr.settings.password.title}
      description={fr.settings.password.newHint}
      trailing={
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) reset()
          }}
        >
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {fr.settings.password.cta}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{fr.settings.password.modalTitle}</DialogTitle>
              <DialogDescription>
                {fr.settings.password.newHint}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dev-pwd-current">
                  {fr.settings.password.currentLabel}
                </Label>
                <Input
                  id="dev-pwd-current"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11"
                  value={currentPassword}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dev-pwd-new">
                  {fr.settings.password.newLabel}
                </Label>
                <Input
                  id="dev-pwd-new"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="h-11"
                  value={newPassword}
                  onChange={(e) => setNew(e.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setOpen(false)}
                >
                  {fr.settings.password.cancel}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "…" : fr.settings.password.submit}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  )
}
