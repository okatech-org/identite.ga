import { cn } from "@repo/ui/lib/utils"

type WizardStepperProps = {
  current: number // 1-indexed
  total: number
  className?: string
}

/**
 * Stepper horizontal — N barres, remplies en vert IDN jusqu'à `current`.
 * Reproduit le pattern CWWizard (idn-citizen-web.jsx lignes 73-78).
 */
export function WizardStepper({
  current,
  total,
  className,
}: WizardStepperProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Étape ${current} sur ${total}`}
      className={cn("flex gap-1", className)}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-[3px] flex-1 rounded-[2px]",
            i < current ? "bg-idn-green" : "bg-border",
          )}
        />
      ))}
    </div>
  )
}
