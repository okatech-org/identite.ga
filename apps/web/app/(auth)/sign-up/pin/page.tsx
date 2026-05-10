"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Label } from "@repo/ui/components/label"

import { pin, STEP_TOTAL } from "../../_content/fr"
import { OtpInput } from "../../_components/otp-input"
import { WizardShell } from "../../_components/wizard-shell"
import { clearOnboardingState } from "../../_hooks/use-onboarding-state"

const FORBIDDEN_PINS = new Set([
  "000000",
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "123456",
  "654321",
  "012345",
  "543210",
])

function isWeakPin(value: string): boolean {
  return FORBIDDEN_PINS.has(value)
}

function pinMatchesDob(pin: string, dob?: string): boolean {
  if (!dob || pin.length !== 6) return false
  // dob ISO YYYY-MM-DD → DDMMYY ou MMDDYY ou YYYYMM ou YYMMDD
  const [y, m, d] = dob.split("-")
  if (!y || !m || !d) return false
  const candidates = [
    `${d}${m}${y.slice(-2)}`,
    `${m}${d}${y.slice(-2)}`,
    `${y.slice(-2)}${m}${d}`,
    `${d}${m}${y.slice(-4)}`.slice(0, 6),
  ]
  return candidates.includes(pin)
}

export default function PinCreationPage() {
  const router = useRouter()
  const createPin = useMutation(api.onboarding.createPin)
  const me = useQuery(api.profile.getCurrentUser)

  const [first, setFirst] = React.useState("")
  const [second, setSecond] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const dob = me?.profile?.pivot?.dateOfBirth

  const onSubmit = async () => {
    setError(null)
    if (first.length !== 6 || second.length !== 6) {
      setError(pin.validation.sixDigits)
      return
    }
    if (first !== second) {
      setError(pin.validation.mismatch)
      return
    }
    if (isWeakPin(first)) {
      setError(pin.validation.weakSequence)
      return
    }
    if (pinMatchesDob(first, dob)) {
      setError(pin.validation.matchesDob)
      return
    }
    setSubmitting(true)
    try {
      await createPin({ pin: first })
      clearOnboardingState()
      toast.success(pin.successToast)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
      setSubmitting(false)
    }
  }

  return (
    <WizardShell
      step={pin.step}
      total={STEP_TOTAL}
      title={pin.title}
      sub={pin.sub}
    >
      <p className="mb-5 rounded-md bg-idn-blue-soft p-3.5 text-[12px] leading-relaxed text-foreground/80 dark:bg-[#10243A]">
        {pin.intro}
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {pin.pinLabel}
          </Label>
          <OtpInput
            value={first}
            onChange={(v) => {
              setError(null)
              setFirst(v)
            }}
            length={6}
            variant="pin"
            autoFocus
            ariaLabel={pin.pinLabel}
            ariaDescribedBy="pin-error"
            hasError={Boolean(error)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {pin.confirmLabel}
          </Label>
          <OtpInput
            value={second}
            onChange={(v) => {
              setError(null)
              setSecond(v)
            }}
            length={6}
            variant="pin"
            ariaLabel={pin.confirmLabel}
            ariaDescribedBy="pin-error"
            hasError={Boolean(error)}
          />
        </div>

        <div className="flex items-start gap-3 rounded-md bg-secondary p-3 text-[12px] leading-relaxed text-muted-foreground">
          <ShieldCheckIcon className="size-4 shrink-0 text-idn-blue" aria-hidden="true" />
          <span>{pin.hint}</span>
        </div>

        <div id="pin-error" aria-live="polite" className="min-h-[1rem]">
          {error && (
            <p role="alert" className="text-center text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
          <Button asChild variant="ghost" size="lg">
            <Link href="/sign-up/identity">{pin.back}</Link>
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={submitting || first.length !== 6 || second.length !== 6}
            onClick={onSubmit}
            className="flex-1"
          >
            {submitting ? "…" : pin.primary}
          </Button>
        </div>
      </div>
    </WizardShell>
  )
}
