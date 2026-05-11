"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LockIcon, MailIcon, QrCodeIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { authClient } from "@/lib/auth-client"

import { signIn } from "../_content/fr"
import { OtpInput } from "../_components/otp-input"
import { safeRedirectTo } from "../_lib/redirect"

const schema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
})

type FormValues = z.infer<typeof schema>

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

  const [twoFactorRequired, setTwoFactorRequired] = React.useState(false)
  const [twoFactorCode, setTwoFactorCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const result = await authClient.signIn.email({
        email: values.email,
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

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-10 sm:py-16">
      {!twoFactorRequired ? (
        <>
          <div className="flex flex-col items-center text-center">
            <IdnMark size={56} />
            <h1 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[28px]">
              {signIn.title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{signIn.sub}</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">{signIn.emailLabel}</Label>
              <div className="relative">
                <MailIcon
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "signin-email-error" : undefined
                  }
                  className="h-12 pl-10 text-base"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p
                  id="signin-email-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

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
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "signin-password-error" : undefined
                  }
                  className="h-12 pl-10 text-base"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p
                  id="signin-password-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.password.message}
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
            disabled
            title={signIn.qrTooltip}
            className="mt-6 h-12 w-full text-base"
          >
            <QrCodeIcon aria-hidden="true" />
            {signIn.qrCta}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {signIn.signUpPrefix}
            <Link
              href="/sign-up/profile"
              className="font-semibold text-idn-green hover:underline dark:text-idn-green-on-dark"
            >
              {signIn.signUpLink}
            </Link>
          </p>
        </>
      ) : (
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
      )}
    </div>
  )
}
