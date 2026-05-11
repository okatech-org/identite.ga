"use client"

import * as React from "react"
import { UserIcon } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

type AvatarProps = {
  firstName?: string | null
  lastName?: string | null
  size?: 32 | 36 | 44 | 52 | 60 | 64 | 72
  src?: string | null
  alt?: string
  className?: string
}

const SIZE_TO_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  32: "size-8 rounded-md text-[12px]",
  36: "size-9 rounded-[10px] text-[13px]",
  44: "size-11 rounded-[11px] text-base",
  52: "size-13 rounded-[14px] text-[18px]",
  60: "size-15 rounded-2xl text-[22px]",
  64: "size-16 rounded-2xl text-[22px]",
  72: "size-[72px] rounded-[18px] text-[26px]",
}

const ICON_SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  32: "size-4",
  36: "size-4",
  44: "size-5",
  52: "size-6",
  60: "size-7",
  64: "size-7",
  72: "size-8",
}

function initials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim()?.charAt(0)?.toUpperCase() ?? ""
  const l = lastName?.trim()?.charAt(0)?.toUpperCase() ?? ""
  return f + l
}

export function Avatar({
  firstName,
  lastName,
  size = 36,
  src,
  alt,
  className,
}: AvatarProps) {
  const [imgFailed, setImgFailed] = React.useState(false)
  const initialsText = initials(firstName, lastName)
  const sizeClasses = SIZE_TO_CLASSES[size]
  const iconSize = ICON_SIZE[size]
  const showImage = Boolean(src) && !imgFailed

  React.useEffect(() => {
    setImgFailed(false)
  }, [src])

  return (
    <div
      data-slot="avatar"
      aria-hidden={alt ? undefined : "true"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-idn-green to-idn-green-dark font-semibold text-white",
        sizeClasses,
        className,
      )}
    >
      {showImage && src ? (
        <img
          src={src}
          alt={alt ?? ""}
          className="size-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : initialsText ? (
        <span className="leading-none">{initialsText}</span>
      ) : (
        <UserIcon className={iconSize} aria-hidden="true" />
      )}
    </div>
  )
}
