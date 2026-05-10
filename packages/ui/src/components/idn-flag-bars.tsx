import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

function IdnFlagBars({
  width = 36,
  height = 3,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  width?: number | string
  height?: number
}) {
  return (
    <div
      role="img"
      aria-label="Drapeau du Gabon"
      className={cn("flex gap-[3px]", className)}
      style={{ width, height, ...style }}
      {...props}
    >
      <span className="flex-1 rounded-[2px] bg-idn-green" />
      <span className="flex-1 rounded-[2px] bg-idn-yellow" />
      <span className="flex-1 rounded-[2px] bg-idn-blue" />
    </div>
  )
}

export { IdnFlagBars }
