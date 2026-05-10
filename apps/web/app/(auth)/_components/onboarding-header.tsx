"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"

import { WizardStepper } from "./wizard-stepper"

type OnboardingHeaderProps = {
  step: number
  total: number
  backLabel: string
  backHref?: string
  onBack?: () => void
}

export function OnboardingHeader({
  step,
  total,
  backLabel,
  backHref,
  onBack,
}: OnboardingHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) onBack()
    else if (backHref) router.push(backHref)
    else router.back()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-[480px] items-center gap-2 px-3">
        {onBack || !backHref ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label={backLabel}
          >
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon" aria-label={backLabel}>
            <Link href={backHref}>
              <ArrowLeftIcon aria-hidden="true" />
            </Link>
          </Button>
        )}
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Étape {step} <span aria-hidden="true">/</span>
          <span className="sr-only"> sur </span> {total}
        </p>
      </div>
      <WizardStepper current={step} total={total} className="px-3 pb-2" />
    </header>
  )
}
