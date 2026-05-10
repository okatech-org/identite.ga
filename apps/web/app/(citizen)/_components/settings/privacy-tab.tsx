"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
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
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { settings } from "../../_content/fr"
import { SettingsRow, SettingsSection } from "../settings-section"

function ExportRow() {
  const [submitting, setSubmitting] = React.useState(false)
  const requestExport = useMutation(api.privacy.requestDataExport)

  const onClick = async () => {
    setSubmitting(true)
    try {
      await requestExport()
      toast.success(settings.privacy.export.successToast)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsRow
      label={settings.privacy.export.title}
      description={settings.privacy.export.sub}
      trailing={
        <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={onClick}>
          {submitting ? "…" : settings.privacy.export.cta}
        </Button>
      }
    />
  )
}

function DeletionRow() {
  const me = useQuery(api.profile.getCurrentUser)
  const [open, setOpen] = React.useState(false)
  const [confirmEmail, setConfirmEmail] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const requestDeletion = useMutation(api.privacy.requestAccountDeletion)
  const expectedEmail = me?.email ?? ""

  const onSubmit = async () => {
    if (!expectedEmail || confirmEmail.trim().toLowerCase() !== expectedEmail.toLowerCase()) {
      toast.error("Confirmation invalide.")
      return
    }
    setSubmitting(true)
    try {
      await requestDeletion({ confirmEmail: expectedEmail })
      toast.success(settings.privacy.deletion.successToast)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsRow
      label={settings.privacy.deletion.title}
      description={settings.privacy.deletion.sub}
      trailing={
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              {settings.privacy.deletion.cta}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{settings.privacy.deletion.modalTitle}</AlertDialogTitle>
              <AlertDialogDescription>{settings.privacy.deletion.modalBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="del-email">{settings.privacy.deletion.confirmLabel}</Label>
              <Input
                id="del-email"
                type="email"
                placeholder={expectedEmail}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>
                {settings.privacy.deletion.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  void onSubmit()
                }}
                disabled={submitting || confirmEmail.trim().toLowerCase() !== expectedEmail.toLowerCase()}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {submitting ? "…" : settings.privacy.deletion.submit}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    />
  )
}

export function PrivacyTab() {
  return (
    <SettingsSection title={settings.privacy.title} sub={settings.privacy.sub}>
      <ExportRow />
      <DeletionRow />
    </SettingsSection>
  )
}
