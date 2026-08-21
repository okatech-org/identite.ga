"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { cn } from "@repo/ui/lib/utils"

import { PriorityBadge } from "../../../_components/priority-badge"
import { queue as content } from "../../../_content/fr"
import { StatusBadge, type KycStatus } from "./status-badge"

const PAGE_SIZE = 20

const STATUSES = [
  "under_review",
  "complement_required",
  "submitted",
  "pending",
  "approved",
  "rejected",
  "expired",
] as const satisfies readonly KycStatus[]

function isKycStatus(value: string): value is KycStatus {
  return (STATUSES as readonly string[]).includes(value)
}

function formatAge(submittedAt: number | undefined): string {
  if (!submittedAt) return "—"
  const ms = Date.now() - submittedAt
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (remM === 0) return `${h}h`
  return `${h}h ${String(remM).padStart(2, "0")}min`
}

/**
 * Colonne gauche — file paginée, filtrable et cherchable.
 *
 * Sélectionner une demande ne fait que l'ouvrir à droite : la prise en
 * charge (`claim`) est devenue une action explicite du panneau de détail.
 * Cliquer sur une demande déjà tranchée déclenchait sinon un
 * `INVALID_STATE` et un toast d'erreur à chaque clic.
 */
export function RequestList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedId = searchParams.get("id")
  const statusParam = searchParams.get("status") ?? "under_review"
  const status = isKycStatus(statusParam) ? statusParam : undefined
  const search = searchParams.get("q") ?? ""
  const pageParam = Number.parseInt(searchParams.get("page") ?? "0", 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 0

  const setParams = React.useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === "") params.delete(key)
        else params.set(key, value)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // La frappe reste locale ; l'URL n'est mise à jour qu'après une pause,
  // pour ne pas relancer une requête serveur à chaque caractère.
  const [draft, setDraft] = React.useState(search)
  React.useEffect(() => {
    if (draft === search) return
    const timer = window.setTimeout(
      () => setParams({ q: draft, page: null }),
      300,
    )
    return () => window.clearTimeout(timer)
  }, [draft, search, setParams])

  const result = useQuery(api.controller.queue.listForReview, {
    status,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1

  return (
    <div className="flex min-h-0 flex-col border-r border-idn-border bg-idn-surface">
      <div className="space-y-2.5 border-b border-idn-border-soft p-3.5">
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={content.list.searchLabel}
          placeholder={content.list.searchPlaceholder}
        />
        <Select
          value={status ?? "all"}
          onValueChange={(value) =>
            setParams({
              status: value === "under_review" ? null : value,
              page: null,
            })
          }
        >
          <SelectTrigger
            className="w-full"
            aria-label={content.list.statusLabel}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{content.list.statusAll}</SelectItem>
            {STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {content.status[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {result?.capped && (
          <p role="status" className="text-[11px] leading-snug text-[#9A6700] dark:text-[#F2C94C]">
            {content.list.capped(result.scanCap)}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {result === undefined ? (
          <ul aria-busy="true" aria-label={content.list.loading}>
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="space-y-1.5 border-b border-idn-border-soft px-4 py-3"
              >
                <div className="h-3.5 w-36 animate-pulse rounded bg-idn-surface-2" />
                <div className="h-3 w-24 animate-pulse rounded bg-idn-surface-2" />
              </li>
            ))}
          </ul>
        ) : result.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-idn-muted">
            {search ? content.list.empty : content.list.emptyStatus}
          </p>
        ) : (
          <ul>
            {result.items.map((item) => {
              const selected = item._id === selectedId
              return (
                <li key={item._id}>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => setParams({ id: item._id })}
                    className={cn(
                      "w-full border-b border-idn-border-soft px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-idn-green",
                      selected
                        ? "bg-idn-green-soft dark:bg-[#0F2A18]"
                        : "hover:bg-idn-surface-2",
                    )}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-idn-ink">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-idn-muted">
                        {formatAge(item.submittedAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-idn-muted">
                      {item.ref} · {item.documentType}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={item.status} />
                      {item.status === "under_review" &&
                        item.priority === "haute" && <PriorityBadge />}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-idn-border-soft px-3.5 py-3">
        <p className="min-w-0 flex-1 text-[11px] text-idn-muted">
          {result === undefined
            ? "…"
            : content.list.counter(page + 1, pages, result.total)}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setParams({ page: page > 1 ? String(page - 1) : null })}
        >
          {content.list.prev}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={result === undefined || page + 1 >= pages}
          onClick={() => setParams({ page: String(page + 1) })}
        >
          {content.list.next}
        </Button>
      </div>
    </div>
  )
}
