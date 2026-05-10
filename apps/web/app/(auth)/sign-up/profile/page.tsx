"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { UserIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { LoABadge } from "@repo/ui/components/loa-badge"
import { cn } from "@repo/ui/lib/utils"

import { onboardingHeader, profile, STEP_TOTAL } from "../../_content/fr"
import {
  getOnboardingProfile,
  setOnboardingProfile,
  type OnboardingProfile,
} from "../../_hooks/use-onboarding-state"
import { WizardShell } from "../../_components/wizard-shell"

export default function ProfileSelectionPage() {
  const router = useRouter()
  const [selected, setSelected] = React.useState<OnboardingProfile | null>(null)

  React.useEffect(() => {
    setSelected(getOnboardingProfile())
  }, [])

  const onSubmit = () => {
    if (!selected) return
    setOnboardingProfile(selected)
    router.push("/sign-up")
  }

  return (
    <WizardShell
      step={profile.step}
      total={STEP_TOTAL}
      title={profile.title}
      sub={profile.sub}
      backHref="/"
      backLabel={onboardingHeader.backToHome}
      footer={
        <Button
          type="button"
          size="lg"
          disabled={!selected}
          onClick={onSubmit}
          className="w-full"
        >
          {profile.primary}
        </Button>
      }
    >
      <ul className="flex flex-col gap-2.5" role="radiogroup" aria-label={profile.title}>
        {profile.options.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <li key={opt.value}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-idn-green bg-idn-green-soft dark:bg-[#0F2A18]"
                    : "border-border bg-card hover:border-idn-green/40",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                    isSelected
                      ? "bg-idn-green text-white"
                      : "bg-secondary text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  <UserIcon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {opt.sub}
                  </p>
                </div>
                {opt.loa !== null && <LoABadge level={opt.loa} compact />}
              </button>
            </li>
          )
        })}
      </ul>
    </WizardShell>
  )
}
