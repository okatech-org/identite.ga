import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

import { OnboardingHeader } from "./onboarding-header"

type WizardShellProps = {
  step: number
  total: number
  title: string
  sub?: string
  children: React.ReactNode
  footer?: React.ReactNode
  backLabel: string
  backHref?: string
  onBack?: () => void
  className?: string
}

/**
 * Coquille plein écran des écrans du tunnel d'inscription.
 * Header sticky avec ← + progress bar, contenu mobile-first centré
 * (max-w 480px), CTA primaire sticky en bas.
 */
export function WizardShell({
  step,
  total,
  title,
  sub,
  children,
  footer,
  backLabel,
  backHref,
  onBack,
  className,
}: WizardShellProps) {
  return (
    <div className={cn("flex min-h-svh flex-col bg-background", className)}>
      <OnboardingHeader
        step={step}
        total={total}
        backLabel={backLabel}
        backHref={backHref}
        onBack={onBack}
      />
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 py-6 sm:px-6 sm:py-8">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        {sub && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {sub}
          </p>
        )}

        <div className="mt-7 flex-1">{children}</div>
      </main>

      {footer && (
        <footer
          className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto w-full max-w-[480px] px-5 py-4 sm:px-6">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}
