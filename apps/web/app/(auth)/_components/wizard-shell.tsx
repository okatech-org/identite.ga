import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

import { OnboardingHeader } from "./onboarding-header"
import { WizardStepper } from "./wizard-stepper"

type WizardShellProps = {
  title: string
  backLabel: string
  backHref?: string
  onBack?: () => void
  step?: number
  total?: number
  sub?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Sur desktop l'eyebrow "ÉTAPE n SUR N" est rendu séparément, donc on
 * strip ce préfixe du sub si présent pour éviter la redondance.
 * Sur mobile, le sub est rendu tel quel (la maquette inclut parfois
 * "Étape n sur N — " inline avec le descripteur).
 */
function stripStepPrefix(s: string): string {
  return s.replace(/^Étape\s+\d+\s+sur\s+\d+\s+—\s+/, "")
}

/**
 * Coquille du tunnel d'inscription.
 *
 * Mobile (< md) :
 *   - OnboardingHeader sticky (← + titre)
 *   - body : sub (avec préfixe "Étape n sur N — ") → progress bar → content
 *   - sticky bottom footer avec CTA full-width
 *
 * Desktop (≥ md) :
 *   - PublicNav (rendu par (auth)/layout.tsx)
 *   - body centré : progress bar → eyebrow "ÉTAPE n SUR N" → h1 → sub →
 *     content → CTA inline full-width
 *   - PublicFooter (rendu par (auth)/layout.tsx)
 */
export function WizardShell({
  title,
  backLabel,
  backHref,
  onBack,
  step,
  total,
  sub,
  children,
  footer,
  className,
}: WizardShellProps) {
  const showProgress = typeof step === "number" && typeof total === "number"
  const desktopSub = sub ? capitalizeFirst(stripStepPrefix(sub)) : null

  return (
    <div className={cn("flex flex-1 flex-col bg-background", className)}>
      <OnboardingHeader
        title={title}
        backLabel={backLabel}
        backHref={backHref}
        onBack={onBack}
      />
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 py-5 sm:px-6 sm:py-7 md:max-w-[600px] md:py-12">
        {/* MOBILE LAYOUT (< md) — sub tel quel (cf. maquette), puis progress */}
        <div className="md:hidden">
          {sub && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {sub}
            </p>
          )}
          {showProgress && (
            <WizardStepper current={step!} total={total!} className="mt-4" />
          )}
        </div>

        {/* DESKTOP LAYOUT (≥ md) */}
        <div className="hidden md:block">
          {showProgress && (
            <WizardStepper current={step!} total={total!} className="mb-6" />
          )}
          {showProgress && (
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Étape {step} sur {total}
            </p>
          )}
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            {title}
          </h1>
          {desktopSub && (
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {desktopSub}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-1 flex-col md:mt-7">{children}</div>

        {/* CTA inline sur desktop (≥ md) — full-width */}
        {footer && <div className="mt-6 hidden md:mt-7 md:block">{footer}</div>}
      </main>

      {/* CTA sticky bottom sur mobile (< md) — full-width */}
      {footer && (
        <footer
          className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
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
