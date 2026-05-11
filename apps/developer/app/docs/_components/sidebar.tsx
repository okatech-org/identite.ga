"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ARTICLE_GROUPS } from "../_articles/registry"

/**
 * Sidebar de la doc — port idn-docs.jsx:78-135.
 * 260px de large, 5 groupes (PREMIERS PAS, @IDN/CORE, @IDN/REACT, GUIDES, OUTILS).
 * Articles "Bientôt" affichés en gris avec badge.
 */
export function DocsSidebar() {
  const pathname = usePathname() ?? ""
  const activeSlug = pathname.replace(/^\/docs\/?/, "")

  return (
    <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-idn-border bg-idn-surface md:block">
      <nav className="px-[18px] py-6" aria-label="Documentation">
        {ARTICLE_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="mb-2 pl-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-idn-muted">
              {group.title}
            </div>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const sel = activeSlug === item.slug
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/docs/${item.slug}`}
                      aria-current={sel ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md border-l-2 px-2.5 py-[7px] text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-idn-green ${
                        sel
                          ? "border-idn-green bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18]"
                          : item.comingSoon
                            ? "border-transparent text-idn-muted"
                            : "border-transparent text-idn-ink-2 hover:bg-idn-surface-2"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.comingSoon ? (
                        <span className="ml-auto rounded-full bg-idn-surface-2 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-idn-muted">
                          Bientôt
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
