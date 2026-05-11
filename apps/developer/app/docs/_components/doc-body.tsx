/**
 * DocBody — wrapper d'article avec breadcrumbs + colonne TOC à droite
 * (sticky). Port idn-docs.jsx:140-163.
 */
import type { ReactNode } from "react"

export interface TocItem {
  label: string
  /** Id de l'ancre, défaut = slug du label */
  href?: string
  /** 0 = top-level, 1 = sub-section */
  depth?: number
}

export function DocBody({
  breadcrumbs,
  toc,
  children,
}: {
  breadcrumbs?: string[]
  toc?: TocItem[]
  children: ReactNode
}) {
  return (
    <div
      className={`mx-auto grid max-w-[1080px] gap-7 px-11 py-9 ${
        toc && toc.length > 0
          ? "grid-cols-1 lg:grid-cols-[1fr_200px]"
          : "grid-cols-1"
      }`}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 ? <span className="mx-2 opacity-50">/</span> : null}
                {b}
              </span>
            ))}
          </div>
        ) : null}
        {children}
      </div>
      {toc && toc.length > 0 ? <TocColumn items={toc} /> : null}
    </div>
  )
}

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function TocColumn({ items }: { items: TocItem[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 self-start">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-idn-muted">
          Sur cette page
        </div>
        <ul className="border-l border-idn-border-soft">
          {items.map((t, i) => {
            const href = `#${t.href ?? slugifyLabel(t.label)}`
            const isFirst = i === 0
            return (
              <li key={i}>
                <a
                  href={href}
                  style={{ marginLeft: t.depth ? t.depth * 12 : 0 }}
                  className={`block border-l-2 py-1 pl-2.5 text-[12px] outline-none transition-colors ${
                    isFirst
                      ? "border-idn-green font-semibold text-idn-green"
                      : "border-transparent text-idn-ink-2 hover:text-idn-ink focus-visible:text-idn-ink"
                  }`}
                >
                  {t.label}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
