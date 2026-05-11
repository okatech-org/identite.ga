import Link from "next/link"
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  ShieldCheckIcon,
  ShieldQuestionIcon,
} from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { kycActiveCard } from "../_content/fr"

type KycStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "complement_required"
  | "rejected"

type KycActiveCardProps = {
  status: KycStatus | string
  variant?: "desktop" | "mobile"
  href?: string
  className?: string
}

const STATUS_STYLES: Record<
  KycStatus,
  {
    bg: string
    border: string
    iconBg: string
    iconColor: string
    Icon: typeof ShieldCheckIcon
  }
> = {
  pending: {
    bg: "bg-idn-surface-2",
    border: "border-idn-border",
    iconBg: "bg-idn-surface-2",
    iconColor: "text-idn-muted",
    Icon: FileTextIcon,
  },
  submitted: {
    bg: "bg-idn-blue-soft dark:bg-[#10243A]",
    border: "border-idn-blue/30",
    iconBg: "bg-idn-blue",
    iconColor: "text-white",
    Icon: ShieldCheckIcon,
  },
  under_review: {
    bg: "bg-idn-blue-soft dark:bg-[#10243A]",
    border: "border-idn-blue/30",
    iconBg: "bg-idn-blue",
    iconColor: "text-white",
    Icon: ClockIcon,
  },
  complement_required: {
    bg: "bg-idn-yellow-soft dark:bg-[#1F2316]",
    border: "border-idn-yellow/50",
    iconBg: "bg-idn-yellow",
    iconColor: "text-[#5a4a0a]",
    Icon: ShieldQuestionIcon,
  },
  rejected: {
    bg: "bg-[#FBE5E5] dark:bg-[#3A1E1E]",
    border: "border-[#B83A3A]/30",
    iconBg: "bg-[#B83A3A]",
    iconColor: "text-white",
    Icon: AlertTriangleIcon,
  },
}

/**
 * Carte dashboard citoyen — affichée quand une demande KYC est en cours
 * (status ∈ {pending, submitted, under_review, complement_required, rejected}).
 * Remplace `KycPromoCard` ("passer au niveau N+1") pour éviter d'inviter
 * à démarrer une nouvelle demande quand une est déjà ouverte.
 */
export function KycActiveCard({
  status,
  variant = "desktop",
  href = "/kyc/request",
  className,
}: KycActiveCardProps) {
  const fallback = STATUS_STYLES.under_review
  const fallbackCopy = kycActiveCard.status.under_review!
  const meta = STATUS_STYLES[status as KycStatus] ?? fallback
  const copy = kycActiveCard.status[status] ?? fallbackCopy
  const Icon = meta.Icon

  const inner = (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
          meta.iconBg,
          meta.iconColor,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {kycActiveCard.eyebrow}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {copy.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {copy.sub}
        </p>
        {variant === "desktop" && (
          <Button asChild size="sm" className="mt-3">
            <Link href={href}>{kycActiveCard.cta}</Link>
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
    "flex items-center gap-3 rounded-[14px] border p-4",
    meta.bg,
    meta.border,
    variant === "desktop" && "items-start gap-3 p-[18px]",
    className,
  )

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          "w-full text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {inner}
      </Link>
    )
  }

  return <div className={classes}>{inner}</div>
}
