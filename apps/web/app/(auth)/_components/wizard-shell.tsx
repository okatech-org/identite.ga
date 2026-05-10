import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

import { WizardStepper } from "./wizard-stepper"

type WizardShellProps = {
  step: number
  total: number
  title: string
  sub?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

/**
 * Coquille des écrans du wizard d'inscription (CWWizard maquette,
 * idn-citizen-web.jsx lignes 71-89). Carte centrée 480 px, stepper en
 * haut, eyebrow "ÉTAPE n SUR N", titre, sub, contenu, footer (boutons).
 */
export function WizardShell({
  step,
  total,
  title,
  sub,
  children,
  footer,
  className,
}: WizardShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[480px] px-6 py-10 sm:py-15",
        className,
      )}
    >
      <WizardStepper current={step} total={total} className="mb-7" />
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Étape {step} sur {total}
      </p>
      <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
        {title}
      </h1>
      {sub && (
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}

      <div className="mt-7">{children}</div>

      {footer && <div className="mt-7 flex flex-wrap gap-2.5">{footer}</div>}
    </div>
  )
}
