import Link from "next/link"
import {
  FileSignatureIcon,
  FileTextIcon,
  FolderIcon,
  InboxIcon,
  type LucideIcon,
  WalletIcon,
} from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

const ICON_MAP: Record<string, LucideIcon> = {
  wallet: WalletIcon,
  inbox: InboxIcon,
  folder: FolderIcon,
  cv: FileSignatureIcon,
  doc: FileTextIcon,
}

type ModuleCardProps = {
  title: string
  sub: string
  icon: keyof typeof ICON_MAP
  /** Couleur d'accent du module (hex, ex. `#EC4899`). */
  color: string
  /** Couleur de fond de la pastille icône (light mode). */
  bgLight: string
  /** Couleur de fond de la pastille icône (dark mode). */
  bgDark: string
  variant?: "desktop" | "mobile"
  href?: string
  disabled?: boolean
  disabledTooltip?: string
  badge?: string
  className?: string
}

export function ModuleCard({
  title,
  sub,
  icon,
  color,
  bgLight,
  bgDark,
  variant = "desktop",
  href,
  disabled,
  disabledTooltip,
  badge,
  className,
}: ModuleCardProps) {
  const Icon = ICON_MAP[icon] ?? FileTextIcon

  const desktopContent = (
    <>
      <div
        aria-hidden="true"
        style={
          {
            "--module-bg-light": bgLight,
            "--module-bg-dark": bgDark,
            color,
          } as React.CSSProperties
        }
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--module-bg-light)] dark:bg-[var(--module-bg-dark)]"
      >
        <Icon className="size-5" />
      </div>
      <div className="mt-3.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
      {badge ? (
        <span
          style={{ background: color }}
          className="absolute right-3.5 top-3.5 rounded-full px-2 py-[2px] font-mono text-[10px] font-bold uppercase tracking-[0.04em] text-white"
        >
          {badge}
        </span>
      ) : null}
    </>
  )

  const mobileContent = (
    <>
      <div
        aria-hidden="true"
        style={
          {
            "--module-bg-light": bgLight,
            "--module-bg-dark": bgDark,
            color,
          } as React.CSSProperties
        }
        className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--module-bg-light)] dark:bg-[var(--module-bg-dark)]"
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      {badge ? (
        <span
          style={{ background: color }}
          className="rounded-full px-2 py-[2px] font-mono text-[10px] font-bold uppercase tracking-[0.04em] text-white"
        >
          {badge}
        </span>
      ) : null}
    </>
  )

  const desktopClass = cn(
    "relative flex flex-col rounded-xl border border-border bg-card p-4 transition-colors",
    !disabled &&
      "hover:border-idn-green/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    disabled && "cursor-not-allowed opacity-60",
    className,
  )

  const mobileClass = cn(
    "flex items-center gap-3 px-4 py-3.5 transition-colors",
    !disabled && href && "hover:bg-muted/40",
    disabled && "cursor-not-allowed opacity-60",
    className,
  )

  const classes = variant === "mobile" ? mobileClass : desktopClass
  const content = variant === "mobile" ? mobileContent : desktopContent

  if (disabled || !href) {
    return (
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledTooltip : undefined}
        className={classes}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  )
}
