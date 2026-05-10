"use client"

import * as React from "react"
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

import { onboardingHeader, signUp, STEP_TOTAL } from "../_content/fr"
import {
  getOnboardingProfile,
  setOnboardingEmail,
} from "../_hooks/use-onboarding-state"
import { PasswordStrength } from "../_components/password-strength"
import { WizardShell } from "../_components/wizard-shell"

const schema = z.object({
  email: z.string().trim().email(signUp.validation.emailInvalid),
  password: z.string().min(12, signUp.validation.passwordTooShort),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, signUp.validation.termsRequired),
})

type FormValues = z.infer<typeof schema>

export default function SignUpPage() {
  const router = useRouter()

  // Si profil non choisi, retour à l'étape 1.
  React.useEffect(() => {
    if (!getOnboardingProfile()) {
      router.replace("/sign-up/profile")
    }
  }, [router])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", acceptTerms: false },
    mode: "onTouched",
  })

  const email = watch("email")
  const password = watch("password")

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.email,
      })

      // Better Auth retourne `{ data, error }` côté React
      if (result?.error) {
        const code = result.error.code as string | undefined
        const message =
          code === "USER_ALREADY_EXISTS"
            ? signUp.errorEmailTaken
            : code === "PASSWORD_COMPROMISED"
              ? signUp.errorPasswordCompromised
              : code === "PASSWORD_TOO_SHORT"
                ? signUp.errorPasswordWeak
                : (result.error.message ?? signUp.errorGeneric)
        toast.error(message)
        return
      }

      setOnboardingEmail(values.email)
      router.push("/sign-up/verify")
    } catch {
      toast.error(signUp.errorGeneric)
    }
  })

  return (
    <WizardShell
      step={signUp.step}
      total={STEP_TOTAL}
      title={signUp.title}
      sub={signUp.sub}
      backHref="/sign-up/profile"
      backLabel={onboardingHeader.backToProfile}
      footer={
        <Button
          type="submit"
          form="signup-form"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "…" : signUp.primary}
        </Button>
      }
    >
      <p className="mb-5 rounded-md bg-idn-blue-soft p-3.5 text-[12px] leading-relaxed text-foreground/80 dark:bg-[#10243A]">
        {signUp.intro}
      </p>

      <form id="signup-form" onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">{signUp.emailLabel}</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder={signUp.emailPlaceholder}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="signup-email-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">{signUp.passwordLabel}</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password
                ? "signup-password-error signup-password-strength"
                : "signup-password-hint signup-password-strength"
            }
            {...register("password")}
          />
          {!errors.password && (
            <p
              id="signup-password-hint"
              className="text-xs text-muted-foreground"
            >
              {signUp.passwordHint}
            </p>
          )}
          <PasswordStrength
            id="signup-password-strength"
            password={password ?? ""}
            userInputs={email ? [email] : []}
            className="pt-1"
          />
          {errors.password && (
            <p
              id="signup-password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-foreground/80">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-idn-green"
              aria-required="true"
              aria-invalid={Boolean(errors.acceptTerms)}
              aria-describedby={
                errors.acceptTerms ? "signup-terms-error" : undefined
              }
              {...register("acceptTerms")}
            />
            <span>
              {signUp.termsPrefix}
              <Link
                href="/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-idn-green underline-offset-2 hover:underline"
                aria-label={`${signUp.termsLink} (s'ouvre dans un nouvel onglet)`}
              >
                {signUp.termsLink}
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p
              id="signup-terms-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {signUp.signInPrefix}
          <Link href="/sign-in" className="font-semibold text-idn-green hover:underline">
            {signUp.signInLink}
          </Link>
        </p>
      </form>
    </WizardShell>
  )
}
