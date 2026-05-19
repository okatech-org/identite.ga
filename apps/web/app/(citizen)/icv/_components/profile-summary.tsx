"use client"

import * as React from "react"

import { icv } from "../_content/fr"

/**
 * Petit bloc « Mon Profil » du panneau gauche `/icv` :
 * nom complet + email + 2 chips (nb expériences, nb compétences).
 */
export function ProfileSummary({
  firstName,
  lastName,
  email,
  experiencesCount,
  skillsCount,
}: {
  firstName: string
  lastName: string
  email: string
  experiencesCount: number
  skillsCount: number
}) {
  const fullName = `${firstName} ${lastName}`.trim() || "—"
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
        {icv.profile.eyebrow}
      </p>
      <div className="text-[13px] font-semibold text-foreground">
        {fullName}
      </div>
      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {email || "—"}
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Pill color="#EC4899" bg="#FCE7F3">
          {icv.profile.experiencesCount(experiencesCount)}
        </Pill>
        <Pill color="#3B82F6" bg="#DBEAFE">
          {icv.profile.skillsCount(skillsCount)}
        </Pill>
      </div>
    </div>
  )
}

function Pill({
  color,
  bg,
  children,
}: {
  color: string
  bg: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  )
}
