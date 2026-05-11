"use client"

/**
 * Utilisateurs — port de idn-desktop.jsx:1095-1247 (AdminUsers).
 * Câblé sur `admin.users.listProfiles` (join email/nom Better Auth) + total
 * via `admin.users.totalAccounts`.
 */
import { useQuery } from "convex/react"

import { LoABadge } from "@repo/ui/components/loa-badge"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { EmptyState } from "../../_components/empty-state"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

type ProfileRow = {
  _id: string
  userId: string
  email: string
  name?: string
  profileType: string
  loa: number
  hasPivot: boolean
  createdAt: number
}

function initials(name: string | undefined, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

const PROFILE_LABEL: Record<string, string> = {
  citizen: "Citoyen",
  resident: "Résident",
  visitor: "Visiteur",
  developer: "Développeur",
}

function fmtJoined(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function UsersPage() {
  const profiles = useQuery(api.admin.users.listProfiles, { limit: 50 }) as
    | ProfileRow[]
    | undefined
  const total = useQuery(api.admin.users.totalAccounts, {}) as
    | number
    | undefined

  const rows = profiles ?? []
  const subValue = total
    ? `${total.toLocaleString("fr-FR")} ACTIFS`
    : "0 ACTIF"

  return (
    <>
      <OpHeader
        sub={`COMPTES · ${subValue}`}
        title={fr.users.title}
        right={
          <button
            type="button"
            className="inline-flex h-8 w-[220px] items-center justify-start gap-2 rounded-lg border border-idn-border bg-transparent px-3 text-[13px] text-idn-muted outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
          >
            <span aria-hidden>{IdnIcons.search}</span>
            {fr.users.search}
          </button>
        }
      />
      <div className="flex-1 overflow-auto p-7">
        {rows.length === 0 ? (
          <EmptyState
            title="Aucun compte IDN"
            description="Les comptes inscrits via apps/web apparaîtront ici dès leur première session."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-idn-border bg-idn-surface">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_60px] border-b border-idn-border bg-idn-surface-2 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
              <div>{fr.users.cols.name}</div>
              <div>{fr.users.cols.email}</div>
              <div>{fr.users.cols.loa}</div>
              <div>{fr.users.cols.profile}</div>
              <div>{fr.users.cols.joined}</div>
              <div></div>
            </div>
            {rows.map((u, i) => (
              <div
                key={u._id}
                className={
                  "grid grid-cols-[2fr_2fr_1fr_1fr_1fr_60px] items-center px-[18px] py-3.5 text-[13px] text-idn-ink " +
                  (i === rows.length - 1
                    ? ""
                    : "border-b border-idn-border-soft")
                }
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{
                      background: "linear-gradient(135deg,#0E7C3A,#0A5C2C)",
                    }}
                    aria-hidden
                  >
                    {initials(u.name, u.email)}
                  </div>
                  <span className="font-medium">
                    {u.name ?? u.email.split("@")[0]}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-idn-muted">
                  {u.email || "—"}
                </div>
                <div>
                  <LoABadge level={(u.loa as 1 | 2 | 3) ?? 1} compact />
                </div>
                <div className="text-idn-ink-2">
                  {PROFILE_LABEL[u.profileType] ?? u.profileType}
                </div>
                <div className="text-xs text-idn-muted">
                  {fmtJoined(u.createdAt)}
                </div>
                <button
                  type="button"
                  aria-label="Actions"
                  className="text-idn-muted outline-none hover:text-idn-ink focus-visible:ring-2 focus-visible:ring-idn-green"
                >
                  {IdnIcons.more}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
