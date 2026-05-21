"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { onboardingHeader, pin, STEP_TOTAL } from "../../_content/fr"
import { PinPad } from "../pin-pad"
import { WizardShell } from "../wizard-shell"
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

type Phase = "enter" | "confirm"

export function PinStep() {
  const router = useRouter()
  const createPin = useMutation(api.onboarding.createPin)
  const me = useQuery(api.profile.getCurrentUser)

  const [phase, setPhase] = React.useState<Phase>("enter")
  const [first, setFirst] = React.useState("")
  const [second, setSecond] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const dob = me?.profile?.pivot?.dateOfBirth

  const handleEnterComplete = (entered: string) => {
    setError(null)
    if (isWeakPin(entered)) {
      setError(pin.validation.weakSequence)
      return
    }
    if (pinMatchesDob(entered, dob)) {
      setError(pin.validation.matchesDob)
      return
    }
    setPhase("confirm")
  }

  const submit = async (confirmation: string) => {
    setError(null)
    if (first !== confirmation) {
      setError(pin.validation.mismatch)
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

  const isEnter = phase === "enter"
  const value = isEnter ? first : second
  const onChange = (v: string) => {
    setError(null)
    if (isEnter) setFirst(v)
    else setSecond(v)
  }
  const onComplete = isEnter ? handleEnterComplete : submit
  const onPrimary = () => {
    if (isEnter) handleEnterComplete(first)
    else void submit(second)
  }
  const backToEnter = () => {
    setPhase("enter")
    setSecond("")
    setError(null)
  }

  return (
    <WizardShell
      step={pin.step}
      total={STEP_TOTAL}
      title={isEnter ? pin.enterTitle : pin.confirmTitle}
      sub={isEnter ? pin.enterSub : pin.confirmSub}
      backHref={isEnter ? "/sign-up?step=idn" : undefined}
      onBack={isEnter ? undefined : backToEnter}
      backLabel={
        isEnter ? onboardingHeader.backToIdn : onboardingHeader.backToEnter
      }
      footer={
        <Button
          type="button"
          size="lg"
          disabled={submitting || value.length !== 6}
          onClick={onPrimary}
          className="h-14 w-full text-base"
        >
          {submitting ? "…" : isEnter ? pin.primary : pin.primaryConfirm}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col">
        <PinPad
          length={6}
          value={value}
          onChange={onChange}
          onComplete={onComplete}
          hasError={Boolean(error)}
          ariaLabel={isEnter ? pin.enterTitle : pin.confirmTitle}
          numpadAriaLabel={pin.numpadAria}
          backspaceAriaLabel={pin.backspaceAria}
          digitAriaLabel={pin.digitAria}
          dotsAriaLabel={pin.dotsAria}
          autoFocus
          disabled={submitting}
          resetKey={phase}
        />

        <div id="pin-error" aria-live="polite" className="mt-3 min-h-[1rem]">
          {error && (
            <p role="alert" className="text-center text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </WizardShell>
  )
}
