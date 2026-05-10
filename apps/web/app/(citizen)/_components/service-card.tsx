import {
  FileTextIcon,
  MailIcon,
  ShieldIcon,
  type LucideIcon,
  UserIcon,
} from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

const ICON_MAP: Record<string, LucideIcon> = {
  doc: FileTextIcon,
  shield: ShieldIcon,
  user: UserIcon,
  mail: MailIcon,
}

type ServiceCardProps = {
  title: string
  sub: string
  loa: 1 | 2 | 3
  icon: keyof typeof ICON_MAP
  variant?: "desktop" | "mobile"
  className?: string
}

export function ServiceCard({
  title,
  sub,
  loa,
  icon,
  variant = "desktop",
  className,
}: ServiceCardProps) {
  const Icon = ICON_MAP[icon] ?? FileTextIcon

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3.5",
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          Niv. {loa}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-idn-green/40 hover:bg-secondary/40",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-secondary text-muted-foreground"
        >
          <Icon className="size-4" />
        </div>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          Niv. {loa}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}
