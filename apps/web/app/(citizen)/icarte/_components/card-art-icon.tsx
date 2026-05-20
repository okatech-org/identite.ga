"use client"

import * as React from "react"

import { CARD_LUCIDE_ICONS, type CardIconKey } from "../_content/cards"

/**
 * Icône d'une carte iCarte. Pour `seal` on rend un SVG inline (sceau du
 * Gabon stylisé — identique à la version mobile). Pour les autres,
 * on utilise les composants lucide-react.
 */
export function CardArtIcon({
  iconKey,
  size = 18,
  className,
}: {
  iconKey: string
  size?: number
  className?: string
}) {
  if (iconKey === "seal") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx={12} cy={12} r={9} />
        <path d="M9 13c0-3 1.5-5 3-5s3 2 3 5" />
        <path d="M12 8V6M9 16h6" />
      </svg>
    )
  }
  const Icon = CARD_LUCIDE_ICONS[iconKey as Exclude<CardIconKey, "seal">]
  if (!Icon) return null
  return (
    <Icon
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  )
}
