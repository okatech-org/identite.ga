import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

type QuickActionProps = {
  href?: string
  label: string
  sub: string
  icon: LucideIcon
  disabled?: boolean
  disabledTitle?: string
  className?: string
}

export function QuickAction({
  href,
  label,
  sub,
  icon: Icon,
  disabled,
  disabledTitle,
  className,
}: QuickActionProps) {
  const inner = (
    <>
      <Icon
        className="size-5 text-idn-green dark:text-idn-green-on-dark"
        aria-hidden="true"
      />
      <p className="text-[13px] font-medium text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </>
  )

  const classes = cn(
    "flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3.5 text-left transition-colors",
    !disabled &&
      "hover:border-idn-green/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    disabled && "cursor-not-allowed opacity-60",
    className,
  )

  if (disabled || !href) {
    return (
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledTitle : undefined}
        className={classes}
      >
        {inner}
      </button>
    )
  }

  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  )
}
