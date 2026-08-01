import Link from "next/link"
import { ChevronRightIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { kycPromo } from "../_content/fr"

type KycPromoCardProps = {
  currentLoa: 1 | 2
  variant?: "desktop" | "mobile"
  href?: string
  className?: string
}

export function KycPromoCard({
  currentLoa,
  variant = "desktop",
  href,
  className,
}: KycPromoCardProps) {
  const nextLevel = currentLoa + 1
  const targetHref = href ?? `/kyc?target=${nextLevel}`

  const inner = (
    <>
      <div
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-idn-yellow text-[#5a4a0a]"
      >
        <ShieldCheckIcon className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{kycPromo.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {kycPromo.sub(nextLevel)}
        </p>
        {variant === "desktop" && (
          <Button asChild size="sm" className="mt-3">
            <Link href={targetHref}>{kycPromo.cta}</Link>
          </Button>
        )}
      </div>
      {variant === "mobile" && (
        <ChevronRightIcon
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </>
  )

  const classes = cn(
    "flex items-center gap-3 rounded-[14px] border border-idn-yellow/40 bg-idn-yellow-soft p-4 dark:border-[#3A3F1F] dark:bg-[#1F2316]",
    variant === "desktop" && "items-start gap-3 p-[18px]",
    className,
  )

  if (variant === "mobile") {
    return (
      <Link
        href={targetHref}
        className={cn(
          classes,
          "w-full text-left transition-colors hover:bg-idn-yellow-soft/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:bg-[#262C18]",
        )}
      >
        {inner}
      </Link>
    )
  }

  return <div className={classes}>{inner}</div>
}
