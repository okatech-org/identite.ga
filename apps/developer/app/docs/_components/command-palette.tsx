"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { ARTICLES_FLAT } from "../_articles/registry"

/**
 * Command palette ⌘K — recherche dans les articles de doc.
 *
 * Match simple sur titre + description + groupe. Pas de fuzzy search
 * pour la v1 (uniquement startsWith + includes). On peut basculer
 * vers fuzzysort plus tard si besoin.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ARTICLES_FLAT
    const tokens = q.split(/\s+/)
    return ARTICLES_FLAT.filter((a) => {
      const hay = `${a.label} ${a.title} ${a.description ?? ""} ${a.groupTitle}`.toLowerCase()
      return tokens.every((t) => hay.includes(t))
    })
  }, [query])

  // Reset à l'ouverture / quand la query change
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  // Esc pour fermer
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const go = useCallback(
    (slug: string) => {
      onOpenChange(false)
      router.push(`/docs/${slug}`)
    },
    [onOpenChange, router],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = results[selectedIdx]
      if (target) go(target.slug)
    }
  }

  // Scroll l'item sélectionné dans la viewport
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${selectedIdx}"]`,
    )
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIdx])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher dans la documentation"
    >
      <div className="w-full max-w-[600px] overflow-hidden rounded-xl border border-idn-border bg-idn-surface shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-idn-border px-4 py-3.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="text-idn-muted"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.5-4.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans la documentation…"
            className="flex-1 bg-transparent text-sm text-idn-ink outline-none placeholder:text-idn-muted"
          />
          <kbd className="rounded border border-idn-border bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-idn-muted">
            ESC
          </kbd>
        </div>
        <ul ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-idn-muted">
              Aucun résultat pour « {query} ».
            </li>
          ) : (
            results.map((a, idx) => {
              const sel = idx === selectedIdx
              return (
                <li key={a.slug} data-idx={idx}>
                  <button
                    type="button"
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onClick={() => go(a.slug)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left outline-none transition-colors ${
                      sel
                        ? "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]"
                        : "text-idn-ink-2"
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-[13px] font-medium">
                        {a.label}
                      </span>
                      {a.description ? (
                        <span
                          className={`mt-0.5 block truncate text-[12px] ${sel ? "text-idn-green/80" : "text-idn-muted"}`}
                        >
                          {a.description}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] ${sel ? "text-idn-green/70" : "text-idn-muted"}`}
                    >
                      {a.groupTitle}
                    </span>
                    {a.comingSoon ? (
                      <span className="shrink-0 rounded-full bg-idn-surface-2 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-idn-muted">
                        Bientôt
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
        <div className="flex items-center gap-3 border-t border-idn-border px-4 py-2 text-[11px] text-idn-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-idn-border bg-idn-surface-2 px-1.5 py-px font-mono">
              ↑↓
            </kbd>
            naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-idn-border bg-idn-surface-2 px-1.5 py-px font-mono">
              ↵
            </kbd>
            ouvrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-idn-border bg-idn-surface-2 px-1.5 py-px font-mono">
              esc
            </kbd>
            fermer
          </span>
          <span className="ml-auto">{results.length} résultat{results.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  )
}
