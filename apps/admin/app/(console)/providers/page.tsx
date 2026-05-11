/**
 * Providers email & SMS — port de idn-desktop.jsx:1490-1631 (AdminProviders).
 *
 * V1 : page **lecture seule**. La configuration des providers est faite
 * manuellement via les variables d'environnement Convex (RESEND_API_KEY,
 * etc.). Aucun bouton d'activation : un badge "Phase 2" prévient le
 * super-admin qu'il ne peut pas encore basculer depuis l'UI.
 */
import { cn } from "@repo/ui/lib/utils"

import { fr } from "../../_content/fr"
import { OpHeader } from "../../_components/op-header"
import {
  EMAIL_PROVIDERS,
  SMS_PROVIDERS,
  type Provider,
} from "../../_mocks/providers"

const EMAIL_ACTIVE = "resend"

function ProviderRow({
  provider,
  active,
}: {
  provider: Provider
  active: boolean
}) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3",
        active
          ? "border-idn-green bg-idn-green-soft dark:bg-[#0F2A18]"
          : "border-idn-border-soft bg-transparent opacity-70",
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
        <span className="rounded-full bg-idn-surface-2 px-2.5 py-[3px] text-[11px] font-medium text-idn-muted">
          Inactif
        </span>
      )}
    </div>
  )
}

function Section({
  title,
  providers,
  activeId,
}: {
  title: string
  providers: Provider[]
  activeId: string | null
}) {
  return (
    <section className="mb-3.5 rounded-xl border border-idn-border bg-idn-surface p-5">
      <h2 className="mb-3.5 text-[13px] font-semibold text-idn-ink">{title}</h2>
      {providers.map((p) => (
        <ProviderRow
          key={p.id}
          provider={p}
          active={p.id === activeId}
        />
      ))}
    </section>
  )
}

export default function ProvidersPage() {
  return (
    <>
      <OpHeader
        sub={fr.providers.sub}
        title={fr.providers.title}
        right={
          <span className="inline-flex h-7 items-center rounded-full border border-idn-yellow bg-idn-yellow-soft px-3 text-[11px] font-semibold text-[#7a5a00]">
            Phase 2 · configuration manuelle
          </span>
        }
      />
      <div className="flex-1 overflow-auto p-7">
        <div className="max-w-[820px]">
          <p className="mb-4 rounded-lg border border-idn-border-soft bg-idn-surface-2 px-3.5 py-2.5 text-xs text-idn-ink-2">
            Le basculement des providers se fait actuellement via les
            variables d&apos;environnement Convex (<code className="font-mono text-[11px]">RESEND_API_KEY</code>,
            etc.). La gestion depuis cette page sera activée en Phase 2.
          </p>
          <Section
            title={fr.providers.emailSectionTitle}
            providers={EMAIL_PROVIDERS}
            activeId={EMAIL_ACTIVE}
          />
          <Section
            title={fr.providers.smsSectionTitle}
            providers={SMS_PROVIDERS}
            activeId={null}
          />
        </div>
      </div>
    </>
  )
}
