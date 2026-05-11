"use client"

/**
 * Providers email & SMS — port de idn-desktop.jsx:1490-1631 (AdminProviders).
 * Câblé sur `admin.providers.getActive` (lecture) + `setActive` (mutation
 * via le client island ProviderActivateButton).
 */
import { useQuery } from "convex/react"

import { cn } from "@repo/ui/lib/utils"
import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { OpHeader } from "../../_components/op-header"
import { ProviderActivateButton } from "../../_components/provider-activate-button"
import {
  EMAIL_PROVIDERS,
  SMS_PROVIDERS,
  type Provider,
} from "../../_mocks/providers"

type ActiveProviders = { email: string | null; sms: string | null }

function ProviderRow({
  provider,
  channel,
  active,
}: {
  provider: Provider
  channel: "email" | "sms"
  active: boolean
}) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3 transition-colors",
        active
          ? "border-idn-green bg-idn-green-soft dark:bg-[#0F2A18]"
          : "border-idn-border-soft bg-transparent",
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-idn-surface-2 text-xs font-semibold text-idn-ink">
        {provider.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-idn-ink">
          {provider.name}
        </div>
        <div className="mt-0.5 text-[11px] text-idn-muted">{provider.desc}</div>
      </div>
      {active ? (
        <span className="rounded-full bg-white px-2.5 py-[3px] text-[11px] font-semibold text-idn-green dark:bg-[#0A1F11]">
          {fr.providers.badgeActive}
        </span>
      ) : (
        <ProviderActivateButton channel={channel} providerId={provider.id} />
      )}
    </div>
  )
}

function Section({
  title,
  providers,
  channel,
  activeId,
}: {
  title: string
  providers: Provider[]
  channel: "email" | "sms"
  activeId: string | null
}) {
  return (
    <section className="mb-3.5 rounded-xl border border-idn-border bg-idn-surface p-5">
      <h2 className="mb-3.5 text-[13px] font-semibold text-idn-ink">{title}</h2>
      {providers.map((p) => (
        <ProviderRow
          key={p.id}
          provider={p}
          channel={channel}
          active={p.id === activeId}
        />
      ))}
    </section>
  )
}

export default function ProvidersPage() {
  const data = useQuery(api.admin.providers.getActive, {}) as
    | ActiveProviders
    | undefined
  const active = data ?? { email: "resend", sms: null }

  return (
    <>
      <OpHeader sub={fr.providers.sub} title={fr.providers.title} />
      <div className="flex-1 overflow-auto p-7">
        <div className="max-w-[820px]">
          <Section
            title={fr.providers.emailSectionTitle}
            providers={EMAIL_PROVIDERS}
            channel="email"
            activeId={active.email}
          />
          <Section
            title={fr.providers.smsSectionTitle}
            providers={SMS_PROVIDERS}
            channel="sms"
            activeId={active.sms}
          />
        </div>
      </div>
    </>
  )
}
