"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/components/button"

import { authClient } from "@/lib/auth-client"

import { fr } from "../../../_content/fr"
import { OtpInput } from "../../../_components/otp-input"

const RESEND_COOLDOWN = 60
const PENDING_EMAIL_KEY = "idn-dev:pending-verification-email"

function readPendingEmail(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage.getItem(PENDING_EMAIL_KEY)
  } catch {
    return null
  }
}

function clearPendingEmail() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(PENDING_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}

export default function DeveloperVerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)
  const lastAttempted = React.useRef<string | null>(null)

  React.useEffect(() => {
    const stored = readPendingEmail()
    if (!stored) {
      router.replace("/sign-up")
      return
    }
    setEmail(stored)
  }, [router])

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleVerify = React.useCallback(
    async (otp: string) => {
      if (!email || isVerifying) return
      if (lastAttempted.current === otp) return
      lastAttempted.current = otp
      setIsVerifying(true)
      setError(null)
      try {
        const result = await authClient.emailOtp.verifyEmail({ email, otp })
        if (result?.error) {
          setError(fr.verifyEmail.errorInvalid)
          setIsVerifying(false)
          return
        }
        toast.success(fr.verifyEmail.successToast)
        clearPendingEmail()
        router.push("/applications")
      } catch (err) {
        const msg = err instanceof Error ? err.message : ""
        setError(
          msg.toLowerCase().includes("rate")
            ? fr.verifyEmail.errorTooManyAttempts
            : fr.verifyEmail.errorInvalid,
        )
        setIsVerifying(false)
      }
    },
    [email, isVerifying, router],
  )

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
      toast.success(fr.verifyEmail.resentToast)
      setCooldown(RESEND_COOLDOWN)
      setCode("")
      setError(null)
      lastAttempted.current = null
    } catch {
      toast.error(fr.verifyEmail.errorTooManyAttempts)
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-64px)] w-full max-w-[460px] flex-col justify-center px-6 py-16">
      <div className="text-center">
        <h1 className="text-[26px] font-semibold tracking-[-0.012em] text-idn-ink">
          {fr.verifyEmail.title}
        </h1>
        <p className="mt-2 text-sm text-idn-muted">
          {email
            ? `${fr.verifyEmail.subPrefix}${email}.`
            : fr.verifyEmail.errorMissingEmail}
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <OtpInput
          value={code}
          onChange={(v) => {
            setError(null)
            setCode(v)
          }}
          length={6}
          autoFocus
          ariaLabel={fr.verifyEmail.title}
          ariaDescribedBy="dev-verify-status"
          hasError={Boolean(error)}
          disabled={isVerifying}
        />

        <div id="dev-verify-status" className="text-center text-xs">
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : (
            <p className="text-idn-muted">{fr.verifyEmail.expiresIn}</p>
          )}
        </div>

        <Button
          type="button"
          size="lg"
          disabled={code.length !== 6 || isVerifying || !email}
          onClick={() => void handleVerify(code)}
          className="h-12 w-full text-base"
        >
          {isVerifying ? "…" : fr.verifyEmail.primary}
        </Button>

        <div className="flex items-center justify-between text-[13px]">
          <Link
            href="/sign-up"
            className="font-medium text-idn-muted underline-offset-2 hover:text-idn-ink hover:underline"
          >
            {fr.verifyEmail.changeEmail}
          </Link>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isVerifying || !email}
            className="font-medium text-idn-green underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-idn-muted disabled:no-underline"
          >
            {cooldown > 0
              ? fr.verifyEmail.resendCooldown(cooldown)
              : fr.verifyEmail.resend}
          </button>
        </div>
      </div>
    </main>
  )
}
