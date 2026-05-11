"use client"

/**
 * Rôles & habilitations — port de idn-desktop.jsx:1372-1488 (AdminRoles).
 * Câblé sur `admin.roles.listRolesSummary` (compte par rôle) + listOperators.
 *
 * Les permissions affichées par carte sont une description en clair de ce
 * que chaque rôle peut faire dans l'IDN (verbatim des maquettes).
 */
import { useQuery } from "convex/react"

import { cn } from "@repo/ui/lib/utils"
import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { EmptyState } from "../../_components/empty-state"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

type RoleSummary = { role: string; count: number }
type Operator = {
  userId: string
  email: string
  name?: string
  role: string
  assignedAt: number
}

type RoleBadgeColor = "green" | "blue" | "muted" | "yellow"

const BADGE_BG: Record<RoleBadgeColor, string> = {
  green: "bg-idn-green",
  blue: "bg-idn-blue",
  muted: "bg-idn-muted",
  yellow: "bg-idn-yellow",
}

type RoleCard = {
  role: string
  name: string
  perms: string[]
  badge: RoleBadgeColor
}

// Référentiel verbatim depuis les maquettes (idn-desktop.jsx:1373-1408).
const ROLE_CATALOG: RoleCard[] = [
  {
    role: "admin",
    name: "Administrateur Système",
    perms: [
      "Tout accès",
      "Gestion comptes",
      "Gestion apps",
      "Logs",
      "Providers",
    ],
    badge: "green",
  },
  {
    role: "identity_controller",
    name: "Contrôleur d'Identité",
    perms: ["Scanner ID", "Valider KYC", "Historique", "MFA + PIN obligatoire"],
    badge: "blue",
  },
  {
    role: "developer",
    name: "Développeur",
    perms: ["Console développeur", "Apps OAuth", "Webhooks", "Sandbox"],
    badge: "muted",
  },
]

export default function RolesPage() {
  const summary = useQuery(api.admin.roles.listRolesSummary, {}) as
    | RoleSummary[]
    | undefined
  const operators = useQuery(api.admin.roles.listOperators, { limit: 200 }) as
    | Operator[]
    | undefined

  const counts: Record<string, number> = {}
  for (const r of summary ?? []) counts[r.role] = r.count
  const totalAgents = (summary ?? []).reduce((s, r) => s + r.count, 0)

  return (
    <>
      <OpHeader
        sub={`HABILITATIONS · ${totalAgents} AGENT${totalAgents > 1 ? "S" : ""}`}
        title={fr.roles.title}
        right={
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-idn-green bg-idn-green px-3 text-[13px] font-medium text-white outline-none hover:bg-idn-green-dark focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2"
          >
            <span aria-hidden>{IdnIcons.plus}</span>
            {fr.roles.newRole}
          </button>
        }
      />
      <div className="flex-1 overflow-auto p-7">
        <div className="grid grid-cols-2 gap-3.5">
          {ROLE_CATALOG.map((r) => {
            const count = counts[r.role] ?? 0
            return (
              <article
                key={r.role}
                className="rounded-xl border border-idn-border bg-idn-surface p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn("h-2 w-2 rounded-full", BADGE_BG[r.badge])}
                    aria-hidden
                  />
                  <h2 className="text-sm font-semibold text-idn-ink">
                    {r.name}
                  </h2>
                  <span className="ml-auto font-mono text-[11px] text-idn-muted">
                    {count} {fr.roles.agents}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.perms.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-idn-surface-2 px-2.5 py-[3px] text-[11px] text-idn-ink-2"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>

        <h2 className="mt-7 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
          Opérateurs habilités
        </h2>
        {(operators ?? []).length === 0 ? (
          <EmptyState
            title="Aucun opérateur"
            description="Utilisez le script de seed ou la mutation admin.roles.assign pour habiliter un compte."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-idn-border bg-idn-surface">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr] border-b border-idn-border bg-idn-surface-2 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
              <div>NOM</div>
              <div>EMAIL</div>
              <div>RÔLE</div>
              <div>ASSIGNÉ LE</div>
            </div>
            {(operators ?? []).map((o, i, arr) => (
              <div
                key={`${o.userId}-${o.role}`}
                className={
                  "grid grid-cols-[2fr_2fr_1fr_1fr] items-center px-[18px] py-3 text-[13px] text-idn-ink " +
                  (i === arr.length - 1
                    ? ""
                    : "border-b border-idn-border-soft")
                }
              >
                <div className="font-medium">{o.name ?? "—"}</div>
                <div className="font-mono text-[11px] text-idn-muted">
                  {o.email}
                </div>
                <div className="text-idn-ink-2">
                  {ROLE_CATALOG.find((r) => r.role === o.role)?.name ?? o.role}
                </div>
                <div className="text-xs text-idn-muted">
                  {new Date(o.assignedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
