import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * Carte fidèle au mockup `IdnCard` (idn-tokens.jsx:153-165) :
 * surface bg + 1px border + 12px radius + padding 20px par défaut
 * (peut être surchargé via className pour les pages denses).
 */
export function IdnCard({
  className,
  padded = true,
  ...props
}: React.ComponentProps<"div"> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-idn-border bg-idn-surface",
        padded && "p-5",
        className,
      )}
      {...props}
    />
  )
}
