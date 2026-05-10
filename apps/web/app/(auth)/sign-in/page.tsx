"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"
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
      // Better Auth peut renvoyer `data.twoFactorRedirect` si 2FA actif
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
      // L'API exacte de Better Auth twoFactor pour TOTP côté client est
      // `authClient.twoFactor.verifyTotp({ code })`
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
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-10">
      <Card className="p-7">
        <div className="mb-5 flex items-center gap-3">
          <IdnMark size={32} />
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Identité Numérique
            </p>
            <h1 className="text-lg font-semibold text-foreground">
              {signIn.title}
            </h1>
          </div>
        </div>

        {!twoFactorRequired ? (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">{signIn.emailLabel}</Label>
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
                {...register("email")}
              />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">{signIn.passwordLabel}</Label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-idn-green hover:underline"
                >
                  {signIn.forgotLink}
                </Link>
              </div>
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
                {...register("password")}
              />
              {errors.password && (
                <p
                  id="signin-password-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? signIn.primarySubmitting : signIn.primary}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {signIn.signUpPrefix}
              <Link
                href="/sign-up/profile"
                className="font-semibold text-idn-green hover:underline"
              >
                {signIn.signUpLink}
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{signIn.twoFactorLabel}</Label>
              <OtpInput
                value={twoFactorCode}
                onChange={setTwoFactorCode}
                length={6}
                autoFocus
                ariaLabel={signIn.twoFactorLabel}
              />
              <p className="text-xs text-muted-foreground">
                {signIn.twoFactorHint}
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              disabled={submitting || twoFactorCode.length !== 6}
              onClick={onSubmit2FA}
              className="w-full"
            >
              {submitting ? "…" : signIn.twoFactorPrimary}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
