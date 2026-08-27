"use client"

/**
 * File des signalements de doublon.
 *
 * Complète l'inventaire par identité (`DuplicatesView`) sans le remplacer :
 * l'inventaire recalcule un regroupement sur nom + prénom + date de naissance,
 * tandis que cette file restitue des rapprochements constatés au moment de
 * l'écriture — un même visage, un même NIP, une même pièce. Ces trois-là ne se
 * relisent pas dans la table des profils : ils n'existent que parce qu'ils ont
 * été détectés au passage.
 *
 * Comme l'inventaire, elle expose et n'exécute rien. Fermer un signalement
 * archive un dossier ; supprimer un compte reste une action distincte, avec sa
 * propre confirmation.
 */
import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { LoABadge } from "@repo/ui/components/loa-badge"

import { fr } from "../_content/fr"

const t = fr.duplicates.signals

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function AccountCell({
  account,
}: {
  account: {
    userId: string
    email: string
    idnId?: string
    loa?: number
    exists: boolean
  }
}) {
  if (!account.exists && !account.email) {
    return (
      <span className="text-[12px] text-idn-muted">{t.deletedAccount}</span>
    )
  }
  return (
    <div className="min-w-0">
      <div className="truncate font-mono text-[11px] text-idn-muted">
        {account.email || "—"}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="truncate font-mono text-[11px] text-idn-ink-2">
          {account.idnId ?? "—"}
        </span>
        {account.loa ? (
          <LoABadge level={account.loa as 1 | 2 | 3} compact />
        ) : null}
      </div>
    </div>
  )
}

export function DuplicateSignals() {
  const data = useQuery(api.duplicates.queries.listOpenFlags, {})
  const resolve = useMutation(api.duplicates.mutations.resolveFlag)
  const [pending, setPending] = React.useState<string | null>(null)

  const flags = data?.flags ?? []

  const onResolve = async (
    flagId: string,
    resolution: "confirmed" | "dismissed",
  ) => {
    setPending(flagId)
    try {
      await resolve({
        flagId: flagId as Parameters<typeof resolve>[0]["flagId"],
        resolution,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : fr.users.loading)
    } finally {
      setPending(null)
    }
  }

  if (data === undefined || flags.length === 0) return null

  return (
    <section className="portal-table">
      <header className="border-b border-idn-border bg-idn-surface-2 px-[18px] py-3">
        <h3 className="text-[13px] font-semibold text-idn-ink">{t.title}</h3>
        <p className="text-[12px] text-idn-muted">{t.sub}</p>
      </header>

      <ul className="divide-y divide-idn-border-soft">
        {flags.map((f) => (
          <li
            key={f._id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-[18px] py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-idn-ink">
                {t.source[f.signal]}
                {f.score !== undefined ? (
                  <span className="text-idn-muted">
                    {" "}
                    · {t.similarity(f.score)}
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-idn-muted">
                {t.detectedOn} {fmtDate(f.detectedAt)}
              </p>
            </div>

            <div className="grid min-w-0 flex-[2] grid-cols-2 gap-3">
              <AccountCell account={f.account} />
              <AccountCell account={f.matched} />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending === f._id}
                onClick={() => onResolve(f._id, "dismissed")}
              >
                {t.dismiss}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending === f._id}
                onClick={() => onResolve(f._id, "confirmed")}
              >
                {t.confirm}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p className="border-t border-idn-border-soft px-[18px] py-2 text-[11px] text-idn-muted">
        {t.resolveHint}
      </p>
    </section>
  )
}
