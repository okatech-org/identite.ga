"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { authClient } from "@/lib/auth-client"

import { fr } from "../../_content/fr"
import { IdnIcons } from "../../_components/icons"

const PENDING_EMAIL_KEY = "idn-dev:pending-verification-email"

const schema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(120),
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(10, "10 caractères minimum.").max(128),
})

type FormValues = z.infer<typeof schema>

export default function DeveloperSignUpPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      if (result?.error) {
        const code = result.error.code as string | undefined
        toast.error(
          code === "USER_ALREADY_EXISTS" || code === "EMAIL_ALREADY_EXISTS"
            ? fr.signUp.errorEmailTaken
            : (result.error.message ?? fr.signUp.errorGeneric),
        )
        setSubmitting(false)
        return
      }
      // Persiste l'email pour la page de vérification (un OTP a été envoyé
      // automatiquement par Better Auth via sendVerificationOnSignUp).
      try {
        window.sessionStorage.setItem(PENDING_EMAIL_KEY, values.email)
      } catch {
        /* storage indisponible — la page verify gérera le fallback */
      }
      router.push("/sign-up/verify")
    } catch {
      toast.error(fr.signUp.errorGeneric)
      setSubmitting(false)
    }
  })

  return (
    <main className="mx-auto flex min-h-[calc(100svh-64px)] w-full max-w-[460px] flex-col justify-center px-6 py-16">
      <div className="text-center">
        <h1 className="text-[26px] font-semibold tracking-[-0.012em] text-idn-ink">
          {fr.signUp.title}
        </h1>
        <p className="mt-2 text-sm text-idn-muted">{fr.signUp.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dev-name">{fr.signUp.nameLabel}</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
              aria-hidden
            >
              {IdnIcons.user}
            </span>
            <Input
              id="dev-name"
              type="text"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "dev-name-error" : undefined}
              className="h-11 pl-11"
              {...register("name")}
            />
          </div>
          {errors.name ? (
            <p id="dev-name-error" role="alert" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dev-email-up">{fr.signUp.emailLabel}</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
              aria-hidden
            >
              {IdnIcons.mail}
            </span>
            <Input
              id="dev-email-up"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "dev-email-up-error" : undefined}
              className="h-11 pl-11"
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p
              id="dev-email-up-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dev-password-up">{fr.signUp.passwordLabel}</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
              aria-hidden
            >
              {IdnIcons.lock}
            </span>
            <Input
              id="dev-password-up"
              type="password"
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "dev-password-up-error" : undefined
              }
              className="h-11 pl-11"
              {...register("password")}
            />
          </div>
          {errors.password ? (
            <p
              id="dev-password-up-error"
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
          className="mt-2 h-12 w-full text-base"
        >
          {submitting ? fr.signUp.submitting : fr.signUp.submit}
        </Button>

        <p className="pt-2 text-center text-xs text-idn-muted">{fr.signUp.consent}</p>
      </form>

      <p className="mt-6 text-center text-sm text-idn-muted">
        {fr.signUp.haveAccount}{" "}
        <Link
          href="/sign-in"
          className="font-medium text-idn-green underline-offset-2 hover:underline focus-visible:underline"
        >
          {fr.signUp.signInLink}
        </Link>
      </p>
    </main>
  )
}
