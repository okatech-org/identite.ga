"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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

import { settings } from "../../_content/fr"
import { OtpInput } from "@/app/(auth)/_components/otp-input"

import { SettingsRow, SettingsSection } from "../settings-section"

// ─────────────────────────────────────────────────────────────
// Password change

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z
      .string()
      .min(12, "Le nouveau mot de passe doit contenir au moins 12 caractères."),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'ancien.",
    path: ["newPassword"],
  })

type PasswordValues = z.infer<typeof passwordSchema>

function PasswordChangeDialog() {
  const [open, setOpen] = React.useState(false)
  const changePassword = useMutation(api.account.changePassword)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(values)
      toast.success(settings.security.password.successToast)
      setOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {settings.security.password.cta}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settings.security.password.modalTitle}</DialogTitle>
          <DialogDescription>{settings.security.password.newHint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pwd-current">{settings.security.password.currentLabel}</Label>
            <Input
              id="pwd-current"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(errors.currentPassword)}
              className="h-11"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p role="alert" className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd-new">{settings.security.password.newLabel}</Label>
            <Input
              id="pwd-new"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(errors.newPassword)}
              className="h-11"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p role="alert" className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              {settings.security.password.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "…" : settings.security.password.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// PIN change

function PinChangeDialog({ configured }: { configured: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const createPin = useMutation(api.onboarding.createPin)

  const submit = async () => {
    if (value.length !== 6) return
    setSubmitting(true)
    try {
      await createPin({ pin: value })
      toast.success(settings.security.pin.successToast)
      setOpen(false)
      setValue("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setValue("")
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {configured ? settings.security.pin.cta : settings.security.pin.ctaDefine}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settings.security.pin.modalTitle}</DialogTitle>
          <DialogDescription>{settings.security.pin.newHint}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label>{settings.security.pin.newLabel}</Label>
          <OtpInput
            value={value}
            onChange={setValue}
            length={6}
            variant="pin"
            autoFocus
            ariaLabel={settings.security.pin.newLabel}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {settings.security.pin.cancel}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || value.length !== 6}
          >
            {submitting ? "…" : settings.security.pin.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// NIP change

const NIP_REGEX = /^[A-Za-z0-9]{14}$/

function NipChangeDialog({ currentNip }: { currentNip: string | undefined }) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(currentNip ?? "")
  const [error, setError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const updateNip = useMutation(api.profile.updateNip)

  const submit = async () => {
    const trimmed = value.trim()
    if (!NIP_REGEX.test(trimmed)) {
      setError(settings.security.nip.validationError)
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await updateNip({ nip: trimmed })
      toast.success(settings.security.nip.successToast)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setValue(currentNip ?? "")
          setError("")
        }
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {currentNip ? settings.security.nip.cta : settings.security.nip.ctaDefine}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settings.security.nip.modalTitle}</DialogTitle>
          <DialogDescription>{settings.security.nip.hint}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="nip-input">{settings.security.nip.label}</Label>
          <Input
            id="nip-input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase())
              setError("")
            }}
            maxLength={14}
            autoFocus
            className="h-11 font-mono tracking-widest"
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {settings.security.nip.cancel}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || value.trim().length !== 14}
          >
            {submitting ? "…" : settings.security.nip.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────

export function SecurityTab() {
  const me = useQuery(api.profile.getCurrentUser)
  const pinConfigured = me?.profile?.pinConfigured ?? false
  const currentNip = me?.profile?.pivot?.nip

  return (
    <div className="space-y-4">
      <SettingsSection
        title={settings.security.password.title}
        sub={settings.security.password.sub}
      >
        <SettingsRow
          label={settings.security.password.title}
          description="Mot de passe d'accès web"
          trailing={<PasswordChangeDialog />}
        />
      </SettingsSection>

      <SettingsSection
        title={settings.security.pin.title}
        sub={
          pinConfigured
            ? settings.security.pin.subConfigured
            : settings.security.pin.subNotConfigured
        }
      >
        <SettingsRow
          label="PIN à 6 chiffres"
          description={pinConfigured ? "•• •• •• (configuré)" : "Non configuré"}
          trailing={<PinChangeDialog configured={pinConfigured} />}
        />
      </SettingsSection>

      <SettingsSection
        title={settings.security.nip.title}
        sub={
          currentNip
            ? settings.security.nip.subConfigured
            : settings.security.nip.subNotConfigured
        }
      >
        <SettingsRow
          label="NIP (RBPP)"
          description={currentNip ?? "Non renseigné"}
          trailing={<NipChangeDialog currentNip={currentNip} />}
        />
      </SettingsSection>

      <SettingsSection
        title={settings.security.twoFactor.title}
        sub={settings.security.twoFactor.sub}
      >
        <SettingsRow
          label="TOTP (Google Authenticator, Authy)"
          description="Non configurée"
          trailing={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title={settings.security.twoFactor.tooltip}
            >
              {settings.security.twoFactor.ctaDisabled}
            </Button>
          }
        />
      </SettingsSection>
    </div>
  )
}
