"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { authClient } from "@/lib/auth-client"

import { resetPassword } from "../_content/fr"
import { OtpInput } from "../_components/otp-input"
import { PasswordStrength } from "../_components/password-strength"
import { getOnboardingEmail } from "../_hooks/use-onboarding-state"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState<string | null>(null)
  const [otp, setOtp] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    const e = getOnboardingEmail()
    if (!e) {
      router.replace("/forgot-password")
      return
    }
    setEmail(e)
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email) return
    if (otp.length !== 6) {
      setError(resetPassword.errorInvalidCode)
      return
    }
    if (password.length < 12) {
      setError("Mot de passe trop court (≥ 12 caractères).")
      return
    }
    if (password !== confirm) {
      setError(resetPassword.errorMismatch)
      return
    }
    setSubmitting(true)
    try {
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      })
      if (result?.error) {
        setError(
          result.error.message?.includes("invalid") ||
            result.error.message?.includes("expired")
            ? resetPassword.errorInvalidCode
            : resetPassword.errorGeneric,
        )
        setSubmitting(false)
        return
      }
      toast.success(resetPassword.successToast)
      router.push("/sign-in")
    } catch {
      setError(resetPassword.errorGeneric)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-10">
      <Card className="p-7">
        <h1 className="text-xl font-semibold text-foreground">
          {resetPassword.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {resetPassword.sub}
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label>{resetPassword.otpLabel}</Label>
            <OtpInput
              value={otp}
              onChange={(v) => {
                setError(null)
                setOtp(v)
              }}
              autoFocus
              ariaLabel={resetPassword.otpLabel}
              ariaDescribedBy="rp-error"
              hasError={Boolean(error)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-password">{resetPassword.passwordLabel}</Label>
            <Input
              id="rp-password"
              type="password"
              autoComplete="new-password"
              required
              aria-required="true"
              aria-describedby="rp-password-strength"
              value={password}
              onChange={(e) => {
                setError(null)
                setPassword(e.target.value)
              }}
            />
            <PasswordStrength
              id="rp-password-strength"
              password={password}
              userInputs={email ? [email] : []}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm">{resetPassword.confirmLabel}</Label>
            <Input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              required
              aria-required="true"
              value={confirm}
              onChange={(e) => {
                setError(null)
                setConfirm(e.target.value)
              }}
            />
          </div>

          <div id="rp-error" aria-live="polite" className="min-h-[1rem]">
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting
              ? resetPassword.primarySubmitting
              : resetPassword.primary}
          </Button>
        </form>
      </Card>
    </div>
  )
}
