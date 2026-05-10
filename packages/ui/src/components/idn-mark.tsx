import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

function IdnMark({
  size = 28,
  className,
  ...props
}: React.ComponentProps<"svg"> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Identité Numérique du Gabon"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect x="2" y="2" width="28" height="28" rx="7" className="fill-idn-green" />
      <path
        d="M11 9v14M16 13v10M21 17v6"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { IdnMark }
