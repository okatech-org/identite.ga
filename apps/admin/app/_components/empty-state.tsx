import type { ReactNode } from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * État vide réutilisable pour les listes (apps, users, logs, etc.).
 * Sobre, aligné sur la charte IDN : bordure + fond surface, pas d'icône
 * décorative trop bruyante.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-idn-border bg-idn-surface px-6 py-14 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-idn-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-xs text-idn-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
