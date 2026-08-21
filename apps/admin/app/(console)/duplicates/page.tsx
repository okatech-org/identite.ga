"use client"

/**
 * Comptes en double — même nom, même prénom, même date de naissance.
 *
 * La vue inventorie, elle ne décide pas : elle marque le compte le plus
 * ancien et le mieux vérifié à titre indicatif, et laisse l'admin trancher
 * lequel conserver. Un rapprochement automatique sur ce triplet suffirait à
 * faire supprimer le compte d'un homonyme.
 */
import { useQuery } from "convex/react"

import { LoABadge } from "@repo/ui/components/loa-badge"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { EmptyState } from "../../_components/empty-state"
import { OpHeader } from "../../_components/op-header"
import { UserRowActions } from "../../_components/user-row-actions"

type Account = {
  userId: string
  profileId: string
  idnId?: string
  email: string
  loa: number
  profileType: string
  hasPivot: boolean
  hasKyc: boolean
  createdAt: number
}

type Group = {
  key: string
  firstName: string
  lastName: string
  dateOfBirth: string
  accounts: Account[]
}

const t = fr.duplicates

function fmtDate(value: string | number) {
  const d = typeof value === "number" ? new Date(value) : new Date(`${value}T00:00:00`)
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-md border border-idn-border bg-idn-surface-2 px-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-idn-muted">
      {children}
    </span>
  )
}

export default function DuplicatesPage() {
  const data = useQuery(api.admin.duplicates.listDuplicateGroups, {})
  const groups = (data?.groups ?? []) as Group[]

  return (
    <>
      <OpHeader sub={t.sub} title={t.title} />
      <div className="flex-1 overflow-auto p-7">
        {data === undefined ? (
          <p className="text-[13px] text-idn-muted">{fr.users.loading}</p>
        ) : groups.length === 0 ? (
          <EmptyState title={t.emptyTitle} description={t.emptyBody} />
        ) : (
          <div className="space-y-5">
            {data.truncated ? (
              <p className="rounded-lg border border-idn-border bg-idn-surface-2 px-3 py-2 text-[12px] text-idn-muted">
                {t.truncated}
              </p>
            ) : null}

            {groups.map((g) => {
              const bestLoa = Math.max(...g.accounts.map((a) => a.loa))
              return (
                <section
                  key={g.key}
                  className="overflow-hidden rounded-xl border border-idn-border bg-idn-surface"
                >
                  <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-idn-border bg-idn-surface-2 px-[18px] py-3">
                    <h2 className="text-[13px] font-semibold text-idn-ink">
                      {g.lastName.toUpperCase()} {g.firstName}
                    </h2>
                    <span className="text-[12px] text-idn-muted">
                      · {t.bornOn} {fmtDate(g.dateOfBirth)} ·{" "}
                      {t.groupCount(g.accounts.length)}
                    </span>
                  </header>

                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_180px] border-b border-idn-border-soft px-[18px] py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                    <div>{t.cols.account}</div>
                    <div>{t.cols.loa}</div>
                    <div></div>
                    <div>{t.cols.created}</div>
                    <div></div>
                  </div>

                  {g.accounts.map((a, i) => (
                    <div
                      key={a.userId}
                      className={
                        "grid grid-cols-[2fr_1fr_1fr_1fr_180px] items-center px-[18px] py-3 text-[13px] text-idn-ink " +
                        (i === g.accounts.length - 1
                          ? ""
                          : "border-b border-idn-border-soft")
                      }
                    >
                      <div className="min-w-0">
                        <div className="truncate font-mono text-[11px] text-idn-muted">
                          {a.email || "—"}
                        </div>
                        <div className="truncate font-mono text-[11px] text-idn-ink-2">
                          {a.idnId ?? "—"}
                        </div>
                      </div>
                      <div>
                        <LoABadge level={(a.loa as 1 | 2 | 3) ?? 1} compact />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {i === 0 ? <Chip>{t.oldest}</Chip> : null}
                        {a.loa === bestLoa ? <Chip>{t.bestLoa}</Chip> : null}
                        {a.hasKyc ? <Chip>{t.kycYes}</Chip> : null}
                      </div>
                      <div className="text-xs text-idn-muted">
                        {fmtDate(a.createdAt)}
                      </div>
                      <UserRowActions
                        userId={a.userId}
                        idnId={a.idnId}
                        email={a.email}
                      />
                    </div>
                  ))}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
