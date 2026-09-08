"use client"

/**
 * Pagination numérotée.
 *
 * Des numéros cliquables, pas un « charger plus » : l'admin qui parcourt le
 * registre a besoin de savoir où il en est, de revenir en arrière et de
 * sauter directement à une page. Une liste qui ne fait que s'allonger perd
 * ces trois repères.
 *
 * Au-delà de 7 pages, la barre se replie autour de la page courante avec des
 * ellipses — les extrémités restent toujours accessibles.
 */
import { fr } from "../_content/fr"

const t = fr.pagination

/**
 * Numéros à afficher : toujours la première et la dernière, plus une fenêtre
 * autour de la page courante. `null` marque une ellipse.
 */
function pageItems(page: number, pageCount: number): Array<number | null> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i)
  }
  const items: Array<number | null> = [0]
  const from = Math.max(1, Math.min(page - 1, pageCount - 4))
  const to = Math.min(pageCount - 2, Math.max(page + 1, 3))

  if (from > 1) items.push(null)
  for (let i = from; i <= to; i++) items.push(i)
  if (to < pageCount - 2) items.push(null)
  items.push(pageCount - 1)
  return items
}

export function Pagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number
  pageCount: number
  total: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) {
    return (
      <p className="mt-4 text-[12px] text-idn-muted">{t.totalOnly(total)}</p>
    )
  }

  const arrow =
    "inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-2.5 text-[12px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-40 disabled:hover:bg-transparent"

  return (
    <nav
      aria-label={t.label}
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-[12px] text-idn-muted" aria-live="polite">
        {t.summary(page + 1, pageCount, total)}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          className={arrow}
        >
          {t.previous}
        </button>

        {pageItems(page, pageCount).map((n, i) =>
          n === null ? (
            <span
              key={`gap-${i}`}
              aria-hidden
              className="px-1 text-[12px] text-idn-muted"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={t.goToPage(n + 1)}
              className={
                "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green " +
                (n === page
                  ? "border-idn-green bg-idn-green-soft text-idn-green"
                  : "border-idn-border bg-transparent text-idn-ink hover:bg-idn-surface-2")
              }
            >
              {n + 1}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount - 1}
          className={arrow}
        >
          {t.next}
        </button>
      </div>
    </nav>
  )
}
