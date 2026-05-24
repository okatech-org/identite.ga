"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LockIcon, QrCodeIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { PinPad } from "@repo/ui/components/pin-pad"

import { authClient } from "@/lib/auth-client"

import { signIn } from "../_content/fr"
import { CrossDeviceQr } from "../_components/cross-device-qr"
import { OtpInput } from "../_components/otp-input"
import { safeRedirectTo } from "../_lib/redirect"

const HANDLE_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/
const IDN_DOMAIN = "@idn.ga"

/**
 * Accepte `handle` ou `handle@idn.ga` indifféremment.
 * Renvoie l'email Better Auth normalisé.
 */
function normalizeIdnIdentifier(input: string): { handle: string; email: string } | null {
  const raw = input.trim().toLowerCase()
  if (!raw) return null
  const handle = raw.endsWith(IDN_DOMAIN) ? raw.slice(0, -IDN_DOMAIN.length) : raw
  if (handle.length < 3 || handle.length > 32) return null
  if (!HANDLE_REGEX.test(handle)) return null
  return { handle, email: `${handle}${IDN_DOMAIN}` }
}

const handleSchema = z.object({
  identifier: z
    .string()
    .trim()
    .refine((v) => normalizeIdnIdentifier(v) !== null, "Identifiant IDN invalide."),
})
const passwordSchema = z.object({
  password: z.string().min(1, "Mot de passe requis."),
})

type HandleValues = z.infer<typeof handleSchema>
type PasswordValues = z.infer<typeof passwordSchema>

type Phase = "email" | "pin" | "password"

export default function SignInPage() {
  return (
    <React.Suspense fallback={null}>
      <SignInPageInner />
    </React.Suspense>
  )
}

function SignInPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = safeRedirectTo(params.get("redirect_to"), "/dashboard")

  const [phase, setPhase] = React.useState<Phase>("email")
  const [email, setEmail] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [pinError, setPinError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)

  const [twoFactorRequired, setTwoFactorRequired] = React.useState(false)
  const [twoFactorCode, setTwoFactorCode] = React.useState("")

  const emailForm = useForm<HandleValues>({
    resolver: zodResolver(handleSchema),
    defaultValues: { identifier: "" },
    mode: "onTouched",
  })
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
    mode: "onTouched",
  })

  const goToPin = emailForm.handleSubmit((values) => {
    const norm = normalizeIdnIdentifier(values.identifier)
    if (!norm) return
    setEmail(norm.email)
    setPin("")
    setPinError(null)
    setPhase("pin")
  })

  const submitPin = async (entered: string) => {
    if (submitting) return
    setSubmitting(true)
    setPinError(null)
    try {
      const res = await authClient.$fetch("/sign-in/pin", {
        method: "POST",
        body: { email, pin: entered },
      })
      const errorBody = (res?.error ?? null) as
        | { code?: string; status?: number; message?: string }
        | null
      if (errorBody) {
        const code = errorBody.code
        if (code === "EMAIL_NOT_VERIFIED") {
          toast.error(signIn.errorEmailNotVerified)
        } else if (errorBody.status === 429) {
          setPinError(signIn.pinErrorTooMany)
        } else {
          setPinError(signIn.pinErrorInvalid)
        }
        setPin("")
        setSubmitting(false)
        return
      }
      // Force le client à recharger sa session via le cookie cross-domain
      // qu'on vient de stocker (le set-better-auth-cookie a déjà été pris
      // par le fetch plugin). Le router push déclenchera un fetch JWT.
      router.push(redirectTo)
      router.refresh()
    } catch {
      setPinError(signIn.pinErrorInvalid)
      setPin("")
      setSubmitting(false)
    }
  }

  const submitPassword = passwordForm.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const result = await authClient.signIn.email({
        email,
        password: values.password,
      })
      if (result?.error) {
        const code = result.error.code as string | undefined
        toast.error(
          code === "INVALID_EMAIL_OR_PASSWORD"
            ? signIn.errorInvalid
            : code === "EMAIL_NOT_VERIFIED"
              ? signIn.errorEmailNotVerified
              : (result.error.message ?? signIn.errorGeneric),
        )
        setSubmitting(false)
        return
      }
      const data = result?.data as
        | { twoFactorRedirect?: boolean }
        | null
        | undefined
      if (data?.twoFactorRedirect) {
        setTwoFactorRequired(true)
        setSubmitting(false)
        return
      }
      router.push(redirectTo)
    } catch {
      toast.error(signIn.errorGeneric)
      setSubmitting(false)
    }
  })

  const onSubmit2FA = async () => {
    if (twoFactorCode.length !== 6) return
    setSubmitting(true)
    try {
      const tf = (
        authClient as unknown as {
          twoFactor?: {
            verifyTotp: (a: { code: string }) => Promise<{ error?: unknown }>
          }
        }
      ).twoFactor
      const result = await tf?.verifyTotp({ code: twoFactorCode })
      if (result?.error) {
        toast.error(signIn.errorInvalid)
        setSubmitting(false)
        return
      }
      router.push(redirectTo)
    } catch {
      toast.error(signIn.errorGeneric)
      setSubmitting(false)
    }
  }

  // ─────── 2FA (rendu prioritaire après sign-in mot de passe) ───────
  if (twoFactorRequired) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-10 sm:py-16">
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <IdnMark size={48} />
            <h1 className="mt-4 text-[22px] font-semibold text-foreground">
              {signIn.twoFactorLabel}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {signIn.twoFactorHint}
            </p>
          </div>
          <OtpInput
            value={twoFactorCode}
            onChange={setTwoFactorCode}
            length={6}
            autoFocus
            ariaLabel={signIn.twoFactorLabel}
          />
          <Button
            type="button"
            size="lg"
            disabled={submitting || twoFactorCode.length !== 6}
            onClick={onSubmit2FA}
            className="h-12 w-full text-base"
          >
            {submitting ? "…" : signIn.twoFactorPrimary}
          </Button>
        </div>
      </div>
    )
  }

  // ─────── Étape PIN ───────
  if (phase === "pin") {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-6 py-8 sm:py-12">
        <div className="flex flex-col items-center text-center">
          <IdnMark size={48} />
          <h1 className="mt-4 text-[22px] font-semibold text-foreground">
            {signIn.pinTitle}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {signIn.pinSub}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{email}</p>
        </div>

        <div className="mt-8 flex flex-1 flex-col">
          <PinPad
            length={6}
            value={pin}
            onChange={(v) => {
              setPin(v)
              if (pinError) setPinError(null)
            }}
            onComplete={submitPin}
            hasError={Boolean(pinError)}
            ariaLabel={signIn.pinTitle}
            numpadAriaLabel={signIn.pinNumpadAria}
            backspaceAriaLabel={signIn.pinBackspaceAria}
            digitAriaLabel={signIn.pinDigitAria}
            dotsAriaLabel={signIn.pinDotsAria}
            autoFocus
            disabled={submitting}
            resetKey={email}
          />

          <div
            id="pin-signin-error"
            aria-live="polite"
            className="mt-3 min-h-[1rem]"
          >
            {pinError && (
              <p role="alert" className="text-center text-xs text-destructive">
                {pinError}
              </p>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            disabled={submitting || pin.length !== 6}
            onClick={() => void submitPin(pin)}
            className="mt-6 h-12 w-full text-base"
          >
            {submitting ? signIn.primarySubmitting : signIn.pinPrimary}
          </Button>

          <button
            type="button"
            onClick={() => {
              setPin("")
              setPinError(null)
              setPhase("email")
            }}
            className="mt-4 text-center text-[13px] text-muted-foreground hover:underline"
          >
            ← {signIn.pinBack}
          </button>
        </div>
      </div>
    )
  }

  // ─────── Étape mot de passe (fallback) ───────
  if (phase === "password") {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-10 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <IdnMark size={56} />
          <h1 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[28px]">
            {signIn.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{signIn.sub}</p>
          <p className="mt-1 text-xs text-muted-foreground">{email}</p>
        </div>

        <form onSubmit={submitPassword} noValidate className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="signin-password">{signIn.passwordLabel}</Label>
            <div className="relative">
              <LockIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={Boolean(passwordForm.formState.errors.password)}
                aria-describedby={
                  passwordForm.formState.errors.password
                    ? "signin-password-error"
                    : undefined
                }
                className="h-12 pl-10 text-base"
                autoFocus
                {...passwordForm.register("password")}
              />
            </div>
            {passwordForm.formState.errors.password && (
              <p
                id="signin-password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {passwordForm.formState.errors.password.message}
              </p>
            )}
            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-idn-green hover:underline dark:text-idn-green-on-dark"
              >
                {signIn.forgotLink}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="h-12 w-full text-base"
          >
            {submitting ? signIn.primarySubmitting : signIn.primary}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            passwordForm.reset({ password: "" })
            setPhase("pin")
          }}
          className="mt-4 text-center text-[13px] font-medium text-idn-green hover:underline dark:text-idn-green-on-dark"
        >
          ← {signIn.passwordBack}
        </button>
      </div>
    )
  }

  // ─────── Étape email (par défaut) ───────
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-10 sm:py-16">
      <div className="flex flex-col items-center text-center">
        <IdnMark size={56} />
        <h1 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[28px]">
          {signIn.emailStepTitle}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {signIn.emailStepSub}
        </p>
      </div>

      <form onSubmit={goToPin} noValidate className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="signin-identifier">{signIn.handleLabel}</Label>
          <div className="relative">
            <UserIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="signin-identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={signIn.handlePlaceholder}
              required
              aria-required="true"
              aria-invalid={Boolean(emailForm.formState.errors.identifier)}
              aria-describedby={
                emailForm.formState.errors.identifier
                  ? "signin-identifier-error"
                  : "signin-identifier-hint"
              }
              className="h-12 pl-10 text-base"
              {...emailForm.register("identifier")}
            />
          </div>
          {emailForm.formState.errors.identifier ? (
            <p
              id="signin-identifier-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {emailForm.formState.errors.identifier.message}
            </p>
          ) : (
            <p
              id="signin-identifier-hint"
              className="text-xs text-muted-foreground"
            >
              {signIn.handleHint}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="h-12 w-full text-base">
          {signIn.continue}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground">
          {signIn.qrLabel}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setQrOpen(true)}
        title={signIn.qrTooltip}
        className="mt-6 h-12 w-full text-base"
      >
        <QrCodeIcon aria-hidden="true" />
        {signIn.qrCta}
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {signIn.signUpPrefix}
        <Link
          href="/sign-up"
          className="font-semibold text-idn-green hover:underline dark:text-idn-green-on-dark"
        >
          {signIn.signUpLink}
        </Link>
      </p>

      {qrOpen ? (
        <CrossDeviceQr
          onClose={() => setQrOpen(false)}
          onApproved={(approvedEmail) => {
            setQrOpen(false)
            setEmail(approvedEmail)
            emailForm.setValue("identifier", approvedEmail)
            setPin("")
            setPinError(null)
            setPhase("pin")
          }}
        />
      ) : null}
    </div>
  )
}
