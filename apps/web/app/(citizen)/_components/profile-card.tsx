import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { Avatar } from "@repo/ui/components/avatar"
import { LoABadge, type LoALevel } from "@repo/ui/components/loa-badge"
import { cn } from "@repo/ui/lib/utils"

import { dashboard, PROFILE_TYPE_LABELS } from "../_content/fr"

type Pivot = {
  firstName: string
  lastName: string
}

type ProfileCardProps = {
  firstName?: string | null
  lastName?: string | null
  profileType: keyof typeof PROFILE_TYPE_LABELS | string
  loa: LoALevel
  idnId?: string | null
  photoUrl?: string | null
  variant?: "desktop" | "mobile"
  href?: string
  className?: string
}

export function ProfileCard({
  firstName,
  lastName,
  profileType,
  loa,
  idnId,
  photoUrl,
  variant = "desktop",
  href,
  className,
}: ProfileCardProps) {
  const isMobile = variant === "mobile"
  const profileLabel =
    PROFILE_TYPE_LABELS[profileType as keyof typeof PROFILE_TYPE_LABELS] ??
    profileType
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—"

  const inner = (
    <>
      <Avatar
        firstName={firstName}
        lastName={lastName}
        src={photoUrl}
        size={isMobile ? 52 : 64}
      />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {profileLabel}
        </p>
        {isMobile ? (
          <p className="mt-0.5 truncate text-base font-semibold text-foreground">
            {fullName}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-[22px] font-semibold leading-tight text-foreground">
            {firstName ? dashboard.greeting(firstName) : dashboard.welcome}
          </p>
        )}
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1",
            isMobile ? "mt-1.5" : "mt-2",
          )}
        >
          <LoABadge level={loa} compact={isMobile} />
          {!isMobile && (
            <span className="text-xs text-muted-foreground">
              · {dashboard.idnIdLabel}{" "}
              <span className="font-mono text-foreground/80">
                {idnId ?? dashboard.idnIdEmpty}
              </span>
            </span>
          )}
        </div>
      </div>
      {isMobile && href && (
        <ChevronRightIcon
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </>
  )

  const baseClasses = cn(
    "flex w-full items-center gap-[18px] rounded-[14px] border border-border bg-card text-left transition-colors",
    isMobile ? "gap-3.5 p-4" : "p-6",
    href && "hover:border-idn-green/40 hover:bg-secondary/40",
    className,
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {inner}
      </Link>
    )
  }

  return <div className={baseClasses}>{inner}</div>
}

export type { Pivot }
