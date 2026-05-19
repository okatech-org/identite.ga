"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { LinkIcon, QrCodeIcon } from "lucide-react";

import { api } from "@repo/backend/convex/_generated/api";
import { type LoALevel } from "@repo/ui/components/loa-badge";

import { dashboard, quickActions, services } from "../_content/fr";
import { KycActiveCard } from "../_components/kyc-active-card";
import { KycPromoCard } from "../_components/kyc-promo-card";
import { ProfileCard } from "../_components/profile-card";
import { QuickAction } from "../_components/quick-action";
import { RecentActivity } from "../_components/recent-activity";
import { ServiceCard } from "../_components/service-card";
import { SessionsCard } from "../_components/sessions-card";

const ACTIVE_STATUSES = new Set([
  "pending",
  "submitted",
  "under_review",
  "complement_required",
  "rejected",
]);

export default function DashboardPage() {
  const me = useQuery(api.profile.getCurrentUser);
  const activeKyc = useQuery(api.kyc.getActiveRequest, {});

  if (me === undefined) {
    return (
      <section className="mx-auto w-full max-w-[1080px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    );
  }

  if (me === null) {
    return null;
  }

  const profile = me.profile;
  const loa = (profile?.loa ?? 1) as LoALevel;
  const firstName = profile?.pivot?.firstName;
  const lastName = profile?.pivot?.lastName;
  const profileType = profile?.profileType ?? "citizen";
  const idnId = profile?.idnId ?? null;
  const photoUrl = profile?.photoUrl ?? null;

  // Une demande KYC est "active" tant qu'elle n'est ni approuvée ni
  // expirée. Tant qu'elle l'est, on remplace `KycPromoCard` par
  // `KycActiveCard` pour ne pas inviter à démarrer une seconde demande.
  const hasActiveKyc = Boolean(
    activeKyc && ACTIVE_STATUSES.has(activeKyc.status),
  );

  return (
    <>
      {/* DESKTOP (≥ md) — match CWHome */}
      <section className="mx-auto hidden w-full md:px-6 lg:px-20 py-8 md:block">
        <div className="grid grid-cols-[1.4fr_1fr] gap-[18px]">
          <ProfileCard
            firstName={firstName}
            lastName={lastName}
            profileType={profileType}
            loa={loa}
            idnId={idnId}
            photoUrl={photoUrl}
            variant="desktop"
          />
          {hasActiveKyc && activeKyc ? (
            <KycActiveCard status={activeKyc.status} variant="desktop" />
          ) : loa < 3 ? (
            <KycPromoCard currentLoa={loa as 1 | 2} variant="desktop" />
          ) : (
            <SessionsCard />
          )}
        </div>

        <section className="mt-8" aria-labelledby="services">
          <p
            id="services"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {dashboard.servicesEyebrow}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {services.map((s) => (
              <ServiceCard
                key={s.key}
                title={s.title}
                sub={s.sub}
                loa={s.loa}
                icon={s.icon}
                variant="desktop"
                href={"href" in s ? s.href : undefined}
              />
            ))}
          </div>
        </section>

        <RecentActivity className="mt-8" />
      </section>

      {/* MOBILE (< md) — match MHome */}
      <section className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5 px-5 py-4 md:hidden">
        <ProfileCard
          firstName={firstName}
          lastName={lastName}
          profileType={profileType}
          loa={loa}
          idnId={idnId}
          photoUrl={photoUrl}
          variant="mobile"
          href="/profile"
        />

        {hasActiveKyc && activeKyc ? (
          <KycActiveCard status={activeKyc.status} variant="mobile" />
        ) : loa < 2 ? (
          <KycPromoCard currentLoa={loa as 1} variant="mobile" />
        ) : null}

        <section aria-labelledby="services-mobile">
          <p
            id="services-mobile"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {dashboard.servicesEyebrow}
          </p>
          <div className="mt-2.5 overflow-hidden rounded-2xl border border-border bg-card">
            {services.slice(0, 4).map((s, i, arr) => (
              <div
                key={s.key}
                className={
                  i < arr.length - 1 ?
                    "border-b border-idn-border-soft"
                  : undefined
                }
              >
                <ServiceCard
                  title={s.title}
                  sub={s.sub}
                  loa={s.loa}
                  icon={s.icon}
                  variant="mobile"
                  href={"href" in s ? s.href : undefined}
                />
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="shortcuts-mobile">
          <p
            id="shortcuts-mobile"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {dashboard.shortcutsEyebrow}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <QuickAction
              href="/consents"
              label={quickActions.consents.label}
              sub={quickActions.consents.sub}
              icon={LinkIcon}
            />
            <QuickAction
              label={quickActions.presentId.label}
              sub={quickActions.presentId.sub}
              icon={QrCodeIcon}
              disabled
              disabledTitle={quickActions.presentId.disabledTooltip}
            />
          </div>
        </section>
      </section>
    </>
  );
}
