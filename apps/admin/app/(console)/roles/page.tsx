"use client"

/**
 * Rôles & habilitations — port de idn-desktop.jsx:1372-1488 (AdminRoles).
 *
 * Câblé sur :
 *   - admin.roles.listRolesSummary (cartes par rôle)
 *   - admin.roles.listOperators (table opérateurs avec verified)
 *   - admin.operators.createOperator (action — nouveau contrôleur/dev)
 *   - admin.roles.setDeveloperVerified (validation production dev)
 *   - admin.roles.revoke (révocation par ligne)
 *
 * Pour les développeurs : un badge indique « Validé pour la production »
 * (vert) ou « Sandbox uniquement » (muted). Le super-admin peut basculer
 * via le bouton « Valider prod. » / « Retirer prod. ».
 */
import { useState } from "react"
import { useQuery } from "convex/react"

import { cn } from "@repo/ui/lib/utils"
import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { CreateOperatorDialog } from "../../_components/create-operator-dialog"
import { EmptyState } from "../../_components/empty-state"
import { OperatorRowActions } from "../../_components/operator-row-actions"
import { OpHeader } from "../../_components/op-header"

type RoleSummary = { role: string; count: number }
type Operator = {
  userId: string
  email: string
  name?: string
  role: string
  assignedAt: number
  verified: boolean
  verifiedAt?: number
}

type RoleBadgeColor = "green" | "blue" | "muted" | "yellow"
type RoleKey = "admin" | "identity_controller" | "developer" | "all"

const BADGE_BG: Record<RoleBadgeColor, string> = {
  green: "bg-idn-green",
  blue: "bg-idn-blue",
  muted: "bg-idn-muted",
  yellow: "bg-idn-yellow",
}

type RoleCard = {
  role: "admin" | "identity_controller" | "developer"
  name: string
  perms: string[]
  badge: RoleBadgeColor
}

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

const FILTER_LABEL: Record<RoleKey, string> = {
  all: "Tous",
  admin: "Administrateurs",
  identity_controller: "Contrôleurs",
  developer: "Développeurs",
}

export default function RolesPage() {
  const [filter, setFilter] = useState<RoleKey>("all")

  const summary = useQuery(api.admin.roles.listRolesSummary, {}) as
    | RoleSummary[]
    | undefined
  const operators = useQuery(api.admin.roles.listOperators, { limit: 200 }) as
    | Operator[]
    | undefined

  const counts: Record<string, number> = {}
  for (const r of summary ?? []) counts[r.role] = r.count
  const totalAgents = (summary ?? []).reduce((s, r) => s + r.count, 0)

  const filteredOperators = (operators ?? []).filter(
    (o) => filter === "all" || o.role === filter,
  )

  return (
    <>
      <OpHeader
        sub={`HABILITATIONS · ${totalAgents} AGENT${totalAgents > 1 ? "S" : ""}`}
        title={fr.roles.title}
        right={<CreateOperatorDialog triggerLabel="Nouvel opérateur" />}
      />
      <div className="flex-1 overflow-auto p-7">
        <div className="grid grid-cols-3 gap-3.5">
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

        <div className="mt-7 mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
            Opérateurs habilités
          </h2>
          <div className="flex gap-1">
            {(Object.keys(FILTER_LABEL) as RoleKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={cn(
                  "h-7 rounded-lg px-2.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green",
                  filter === k
                    ? "bg-idn-green-soft text-idn-green"
                    : "text-idn-muted hover:bg-idn-surface-2",
                )}
              >
                {FILTER_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        {filteredOperators.length === 0 ? (
          <EmptyState
            title="Aucun opérateur"
            description="Utilisez le bouton « Nouvel opérateur » pour créer un compte contrôleur ou développeur."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-idn-border bg-idn-surface">
            <div className="grid grid-cols-[2fr_2fr_1.2fr_1fr_180px] border-b border-idn-border bg-idn-surface-2 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
              <div>NOM</div>
              <div>EMAIL</div>
              <div>RÔLE</div>
              <div>STATUT</div>
              <div className="text-right">ACTIONS</div>
            </div>
            {filteredOperators.map((o, i, arr) => (
              <div
                key={`${o.userId}-${o.role}`}
                className={
                  "grid grid-cols-[2fr_2fr_1.2fr_1fr_180px] items-center px-[18px] py-3 text-[13px] text-idn-ink " +
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
                <div>
                  {o.role === "developer" ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-medium",
                        o.verified
                          ? "bg-idn-green-soft text-idn-green"
                          : "bg-idn-surface-2 text-idn-muted",
                      )}
                    >
                      {o.verified ? "Validé prod." : "Sandbox uniquement"}
                    </span>
                  ) : (
                    <span className="text-xs text-idn-muted">
                      {new Date(o.assignedAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <OperatorRowActions
                  userId={o.userId}
                  role={o.role as "admin" | "identity_controller" | "developer"}
                  verified={o.verified}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
