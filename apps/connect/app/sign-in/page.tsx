"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { authClient } from "@/lib/auth-client"

import { IdnIcons } from "../_components/icons"
import { fr } from "../_content/fr"

const schema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
})

type FormValues = z.infer<typeof schema>

const safeRedirectTo = (raw: string | null): string => {
  if (!raw) return "/"
  // N'autorise que des chemins internes, jamais une URL absolue externe.
  if (!raw.startsWith("/")) return "/"
  if (raw.startsWith("//")) return "/"
  return raw
}

export default function ConnectSignInPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = safeRedirectTo(params.get("redirect_to"))
  const [submitting, setSubmitting] = useState(false)

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
            ? fr.signIn.errorInvalid
            : (result.error.message ?? fr.signIn.errorGeneric),
        )
        setSubmitting(false)
        return
      }
      router.push(redirectTo)
    } catch {
      toast.error(fr.signIn.errorGeneric)
      setSubmitting(false)
    }
  })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[460px] flex-col justify-center px-6 py-16">
      <div className="flex flex-col items-center text-center">
        <IdnMark size={42} />
        <IdnFlagBars className="mt-4" width={120} height={3} />
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.012em] text-idn-ink">
          {fr.signIn.title}
        </h1>
        <p className="mt-2 text-sm text-idn-muted">{fr.signIn.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="conn-email">{fr.signIn.emailLabel}</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
              aria-hidden
            >
              {IdnIcons.mail}
            </span>
            <Input
              id="conn-email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "conn-email-error" : undefined}
              className="h-11 pl-11"
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p id="conn-email-error" role="alert" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="conn-password">{fr.signIn.passwordLabel}</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
              aria-hidden
            >
              {IdnIcons.lock}
            </span>
            <Input
              id="conn-password"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "conn-password-error" : undefined
              }
              className="h-11 pl-11"
              {...register("password")}
            />
          </div>
          {errors.password ? (
            <p
              id="conn-password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-12 w-full text-base"
        >
          {submitting ? fr.signIn.submitting : fr.signIn.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-idn-muted">
        {fr.signIn.noAccount}{" "}
        <a
          href="https://identite.ga/sign-up"
          className="font-medium text-idn-green underline-offset-2 hover:underline"
        >
          {fr.signIn.createAccount}
        </a>
      </p>
    </main>
  )
}
