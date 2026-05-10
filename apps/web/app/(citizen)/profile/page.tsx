"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { ShieldCheckIcon } from "lucide-react"

import Link from "next/link"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { LoABadge, type LoALevel } from "@repo/ui/components/loa-badge"

import {
  dashboard,
  formatLongDate,
  formatVerifiedDocuments,
  profile,
  PROFILE_TYPE_LABELS,
} from "../_content/fr"
import { InfoRow } from "../_components/info-row"
import { PhotoUploader } from "../_components/photo-uploader"

export default function ProfilePage() {
  const me = useQuery(api.profile.getCurrentUser)
  const sessions = useQuery(api.sessions.listMine)

  if (me === undefined) {
    return (
      <section className="mx-auto w-full max-w-[1080px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }

  if (me === null) {
    return null
  }

  const userProfile = me.profile
  const pivot = userProfile?.pivot
  const loa = (userProfile?.loa ?? 1) as LoALevel
  const firstName = pivot?.firstName ?? ""
  const lastName = pivot?.lastName ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—"
  const profileLabel =
    PROFILE_TYPE_LABELS[
      (userProfile?.profileType ??
        "citizen") as keyof typeof PROFILE_TYPE_LABELS
    ] ?? userProfile?.profileType
  const idnId = userProfile?.idnId ?? dashboard.idnIdEmpty
  const photoUrl = userProfile?.photoUrl ?? null
  const pinConfigured = userProfile?.pinConfigured ?? false
  const verifiedAt = userProfile?.verifiedAt ?? null
  const verifiedDocs = userProfile?.verifiedDocumentTypes ?? []

  const sessionCount = sessions?.length
  const sessionsValue =
    sessionCount === undefined
      ? "…"
      : sessionCount === 0
        ? profile.security.rows.sessionsValueEmpty
        : sessionCount === 1
          ? profile.security.rows.sessionsValueSingle
          : profile.security.rows.sessionsValueMany(sessionCount)

  const showUpgrade = loa < 3

  return (
    <>
      {/* DESKTOP (≥ md) — match CWProfile */}
      <section className="mx-auto hidden w-full md:px-4 lg:px-20 py-8 md:block">
        <div className="flex items-center gap-5">
          <PhotoUploader
            firstName={firstName}
            lastName={lastName}
            currentPhotoUrl={photoUrl}
            size={72}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[26px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
              {fullName}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {profileLabel}
            </p>
            <div className="mt-2">
              <LoABadge level={loa} />
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile/edit">{profile.edit}</Link>
          </Button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {profile.pivot.eyebrow}
            </p>
            <div className="mt-3">
              <InfoRow
                label={profile.pivot.rows.firstName}
                value={firstName || "—"}
              />
              <InfoRow
                label={profile.pivot.rows.lastName}
                value={lastName || "—"}
              />
              <InfoRow
                label={profile.pivot.rows.dateOfBirth}
                value={pivot?.dateOfBirth ?? "—"}
              />
              <InfoRow
                label={profile.pivot.rows.birthPlace}
                value={pivot?.birthPlace ?? "—"}
              />
              <InfoRow
                label={profile.pivot.rows.nationality}
                value={pivot?.nationality ?? "—"}
              />
              <InfoRow
                label={profile.pivot.rows.idnId}
                value={idnId}
                mono
              />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {profile.security.eyebrow}
              </p>
              <div className="mt-3">
                <InfoRow
                  label={profile.security.rows.password}
                  value={profile.security.rows.passwordValue}
                />
                <InfoRow
                  label={profile.security.rows.pin}
                  value={
                    pinConfigured
                      ? profile.security.rows.pinConfiguredValue
                      : profile.security.rows.pinNotConfiguredValue
                  }
                />
                <InfoRow
                  label={profile.security.rows.twoFactor}
                  value={profile.security.rows.twoFactorValue}
                />
                <InfoRow
                  label={profile.security.rows.sessions}
                  value={sessionsValue}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {profile.verification.eyebrow}
              </p>
              <div className="mt-3">
                <InfoRow
                  label={profile.verification.rows.currentLevel}
                  value={profile.verification.rows.currentLevelValue(loa)}
                />
                <InfoRow
                  label={profile.verification.rows.verifiedOn}
                  value={
                    verifiedAt
                      ? formatLongDate(verifiedAt)
                      : profile.verification.rows.verifiedOnEmpty
                  }
                />
                <InfoRow
                  label={profile.verification.rows.documents}
                  value={formatVerifiedDocuments(verifiedDocs)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE (< md) — match MProfile */}
      <section className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5 px-5 py-4 md:hidden">
        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4">
          <PhotoUploader
            firstName={firstName}
            lastName={lastName}
            currentPhotoUrl={photoUrl}
            size={60}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold text-foreground">
              {fullName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {profileLabel}
            </p>
            <div className="mt-2">
              <LoABadge level={loa} compact />
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile/edit">{profile.edit}</Link>
          </Button>
        </div>

        <section aria-labelledby="pivot-mobile">
          <p
            id="pivot-mobile"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {profile.pivot.eyebrow}
          </p>
          <div className="mt-2 rounded-2xl border border-border bg-card px-4">
            <InfoRow
              label={profile.pivot.rows.firstName}
              value={firstName || "—"}
            />
            <InfoRow
              label={profile.pivot.rows.lastName}
              value={lastName || "—"}
            />
            <InfoRow
              label={profile.pivot.rows.dateOfBirth}
              value={pivot?.dateOfBirth ?? "—"}
            />
            <InfoRow
              label={profile.pivot.rows.birthPlace}
              value={pivot?.birthPlace ?? "—"}
            />
            <InfoRow
              label={profile.pivot.rows.nationality}
              value={pivot?.nationality ?? "—"}
            />
            <InfoRow
              label={profile.pivot.rows.idnId}
              value={idnId}
              mono
            />
          </div>
        </section>

        <section aria-labelledby="security-mobile">
          <p
            id="security-mobile"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {profile.security.eyebrow}
          </p>
          <div className="mt-2 rounded-2xl border border-border bg-card px-4">
            <InfoRow
              label={profile.security.rows.pin}
              value={
                pinConfigured
                  ? profile.security.rows.pinConfiguredValue
                  : profile.security.rows.pinNotConfiguredValue
              }
            />
            <InfoRow
              label={profile.security.rows.sessions}
              value={sessionsValue}
            />
          </div>
        </section>

        {showUpgrade && (
          <Button asChild variant="outline" size="lg" className="h-12 w-full">
            <Link href="/kyc">
              <ShieldCheckIcon
                className="text-idn-green dark:text-idn-green-on-dark"
                aria-hidden="true"
              />
              {profile.upgradeCta(loa + 1)}
            </Link>
          </Button>
        )}
      </section>
    </>
  )
}
