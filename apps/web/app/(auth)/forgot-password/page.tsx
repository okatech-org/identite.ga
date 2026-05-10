"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { authClient } from "@/lib/auth-client"

import { forgotPassword } from "../_content/fr"
import { setOnboardingEmail } from "../_hooks/use-onboarding-state"

const schema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "forget-password",
      })
      if (result?.error) {
        toast.error(forgotPassword.errorGeneric)
        return
      }
      setOnboardingEmail(values.email)
      toast.success(forgotPassword.successToast)
      router.push("/reset-password")
    } catch {
      toast.error(forgotPassword.errorGeneric)
    }
  })

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-10">
      <Card className="p-7">
        <h1 className="text-xl font-semibold text-foreground">
          {forgotPassword.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {forgotPassword.sub}
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-email">{forgotPassword.emailLabel}</Label>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "fp-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p
                id="fp-email-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? forgotPassword.primarySubmitting : forgotPassword.primary}
          </Button>

          <Link
            href="/sign-in"
            className="block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {forgotPassword.back}
          </Link>
        </form>
      </Card>
    </div>
  )
}
