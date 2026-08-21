"use client"

/**
 * Utilisateurs — port de idn-desktop.jsx:1095-1247 (AdminUsers).
 *
 * Deux modes qui ne coexistent jamais :
 *   • liste paginée (`admin.users.listProfiles`, curseur Convex) — le défaut ;
 *   • résultats de recherche (`admin.users.searchProfiles`) dès que la saisie
 *     dépasse deux caractères.
 *
 * La liste était auparavant tronquée à 50 comptes chargés d'un bloc : au-delà,
 * les comptes suivants étaient simplement invisibles depuis la console.
 */
import { useEffect, useState } from "react"
import { usePaginatedQuery, useQuery } from "convex/react"

import { LoABadge } from "@repo/ui/components/loa-badge"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { EmptyState } from "../../_components/empty-state"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"
import { UserRowActions } from "../../_components/user-row-actions"

type ProfileRow = {
  _id: string
  userId: string
  email: string
  name?: string
  idnId?: string
  dateOfBirth?: string
  profileType: string
  loa: number
  hasPivot: boolean
  deletedAt?: number
  createdAt: number
}

const PAGE_SIZE = 25

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

const GRID = "grid grid-cols-[2fr_2fr_1fr_1fr_1fr_180px]"

export default function UsersPage() {
  const [input, setInput] = useState("")
  const [term, setTerm] = useState("")

  // Debounce : la recherche par nom balaie la table, on ne la déclenche pas
  // à chaque frappe.
  useEffect(() => {
    const id = setTimeout(() => setTerm(input.trim()), 300)
    return () => clearTimeout(id)
  }, [input])

  const searching = term.length >= 2

  const paginated = usePaginatedQuery(
    api.admin.users.listProfiles,
    searching ? "skip" : {},
    { initialNumItems: PAGE_SIZE },
  )
  const search = useQuery(
    api.admin.users.searchProfiles,
    searching ? { q: term } : "skip",
  )
  const total = useQuery(api.admin.users.totalAccounts, {}) as
    | number
    | undefined

  const rows: ProfileRow[] = searching
    ? ((search?.results ?? []) as ProfileRow[])
    : (paginated.results as ProfileRow[])

  const loading = searching
    ? search === undefined
    : paginated.status === "LoadingFirstPage"

  const subValue = total
    ? `${total.toLocaleString("fr-FR")} COMPTES`
    : "0 COMPTE"

  return (
    <>
      <OpHeader
        sub={`COMPTES · ${subValue}`}
        title={fr.users.title}
        right={
          <div className="relative">
            <label htmlFor="user-search" className="sr-only">
              {fr.users.searchLabel}
            </label>
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
            >
              {IdnIcons.search}
            </span>
            <input
              id="user-search"
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={fr.users.search}
              className="h-8 w-[260px] rounded-lg border border-idn-border bg-transparent pl-9 pr-3 text-[13px] text-idn-ink outline-none placeholder:text-idn-muted focus-visible:ring-2 focus-visible:ring-idn-green"
            />
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-7">
        {searching ? (
          <p
            aria-live="polite"
            className="mb-3 text-[12px] text-idn-muted"
          >
            {loading
              ? fr.users.loading
              : fr.users.resultCount(rows.length)}
          </p>
        ) : null}

        {searching && search?.truncated ? (
          <p className="mb-3 rounded-lg border border-idn-border bg-idn-surface-2 px-3 py-2 text-[12px] text-idn-muted">
            {fr.users.searchTruncated}
          </p>
        ) : null}

        {loading ? (
          <p className="text-[13px] text-idn-muted">{fr.users.loading}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title={searching ? "Aucun résultat" : "Aucun compte IDN"}
            description={
              searching
                ? "Aucun compte ne correspond à cette recherche."
                : "Les comptes inscrits via apps/web apparaîtront ici dès leur première session."
            }
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-idn-border bg-idn-surface">
              <div
                className={`${GRID} border-b border-idn-border bg-idn-surface-2 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted`}
              >
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
                    `${GRID} items-center px-[18px] py-3.5 text-[13px] text-idn-ink ` +
                    (i === rows.length - 1
                      ? ""
                      : "border-b border-idn-border-soft")
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg,#0E7C3A,#0A5C2C)",
                      }}
                      aria-hidden
                    >
                      {initials(u.name, u.email)}
                    </div>
                    <span className="truncate font-medium">
                      {u.name ?? u.email.split("@")[0]}
                    </span>
                  </div>
                  <div className="truncate font-mono text-[11px] text-idn-muted">
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
                  <UserRowActions
                    userId={u.userId}
                    idnId={u.idnId}
                    email={u.email}
                    deletedAt={u.deletedAt}
                  />
                </div>
              ))}
            </div>

            {!searching && paginated.status === "CanLoadMore" ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => paginated.loadMore(PAGE_SIZE)}
                  className="inline-flex h-9 items-center rounded-lg border border-idn-border bg-transparent px-4 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
                >
                  {fr.users.loadMore}
                </button>
              </div>
            ) : null}
            {!searching && paginated.status === "LoadingMore" ? (
              <p className="mt-4 text-center text-[13px] text-idn-muted">
                {fr.users.loading}
              </p>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
