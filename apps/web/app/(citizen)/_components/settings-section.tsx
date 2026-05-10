import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

type SettingsSectionProps = {
  title: string
  sub?: string
  children: React.ReactNode
  className?: string
}

export function SettingsSection({
  title,
  sub,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {sub && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}

type SettingsRowProps = {
  label: string
  description?: string
  trailing?: React.ReactNode
  className?: string
}

export function SettingsRow({
  label,
  description,
  trailing,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-idn-border-soft py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
