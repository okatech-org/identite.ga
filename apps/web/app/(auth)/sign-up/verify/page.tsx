"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { authClient } from "@/lib/auth-client"

import { verify, STEP_TOTAL } from "../../_content/fr"
import { OtpInput } from "../../_components/otp-input"
import { WizardShell } from "../../_components/wizard-shell"
import {
  getOnboardingEmail,
  getOnboardingProfile,
} from "../../_hooks/use-onboarding-state"

const RESEND_COOLDOWN = 60

export default function VerifyOtpPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState<string | null>(null)
  const [profile, setProfile] = React.useState<
    "citizen" | "resident" | "visitor" | "developer" | null
  >(null)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)
  // Garde-fou anti boucle : on ne retente jamais avec un code déjà essayé.
  const lastAttempted = React.useRef<string | null>(null)
  const selectProfile = useMutation(api.onboarding.selectProfile)

  React.useEffect(() => {
    const e = getOnboardingEmail()
    const p = getOnboardingProfile()
    if (!e || !p) {
      router.replace("/sign-up/profile")
      return
    }
    setEmail(e)
    setProfile(p)
  }, [router])

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleVerify = React.useCallback(
    async (otp: string) => {
      if (!email || !profile || isVerifying) return
      if (lastAttempted.current === otp) return // déjà tenté → stop
      lastAttempted.current = otp
      setIsVerifying(true)
      setError(null)
      try {
        const result = await authClient.emailOtp.verifyEmail({ email, otp })
        if (result?.error) {
          setError(verify.errorInvalid)
          setIsVerifying(false)
          return
        }
        // Email vérifié → on peut maintenant créer le userProfile.
        await selectProfile({ profileType: profile })
        toast.success(verify.successToast)
        router.push("/sign-up/identity")
      } catch (err) {
        const msg = err instanceof Error ? err.message : ""
        setError(
          msg.includes("rate") ? verify.errorTooManyAttempts : verify.errorInvalid,
        )
        setIsVerifying(false)
      }
    },
    [email, profile, isVerifying, selectProfile, router],
  )

  // Auto-submit dès la 6ᵉ saisie
  React.useEffect(() => {
    if (code.length === 6 && !isVerifying) {
      void handleVerify(code)
    }
  }, [code, handleVerify, isVerifying])

  const handleResend = async () => {
    if (!email || cooldown > 0) return
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      })
      toast.success(verify.resentToast)
      setCooldown(RESEND_COOLDOWN)
      setCode("")
      setError(null)
      lastAttempted.current = null
    } catch {
      toast.error(verify.errorTooManyAttempts)
    }
  }

  return (
    <WizardShell
      step={verify.step}
      total={STEP_TOTAL}
      title={verify.title}
      sub={
        email ? `${verify.subPrefix}${email}.` : `${verify.subPrefix}votre adresse.`
      }
      footer={
        <Button asChild variant="ghost" size="lg" className="flex-1">
          <Link href="/sign-up">{verify.back}</Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <OtpInput
          value={code}
          onChange={(v) => {
            setError(null)
            setCode(v)
          }}
          length={6}
          autoFocus
          ariaLabel="Code de vérification"
          ariaDescribedBy="verify-status"
          hasError={Boolean(error)}
          disabled={isVerifying}
        />

        <div id="verify-status" className="text-center text-xs">
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : (
            <p className="text-muted-foreground">{verify.expiresIn}</p>
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isVerifying}
            className="text-[13px] font-medium text-idn-green underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? verify.resendCooldown(cooldown) : verify.resend}
          </button>
        </div>
      </div>
    </WizardShell>
  )
}
