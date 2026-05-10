"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"

type OnboardingHeaderProps = {
  title: string
  backLabel: string
  backHref?: string
  onBack?: () => void
}

/**
 * Header sticky des écrans onboarding — mobile uniquement (md:hidden).
 * Sur desktop, c'est le PublicNav rendu par (auth)/layout.tsx qui prend
 * le relais.
 */
export function OnboardingHeader({
  title,
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
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-14 items-center gap-2 px-3">
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
        <h1 className="truncate text-base font-semibold text-foreground">
          {title}
        </h1>
      </div>
    </header>
  )
}
