/**
 * CredRow — port de idn-desktop.jsx:2649-2718.
 * Label fixe + valeur monospace dans une "boîte" surface-2 + bouton Copier.
 */
"use client"

import { useEffect, useState } from "react"

import { IdnIcons } from "./icons"

export function CredRow({
  label,
  value,
  secret = false,
}: {
  label: string
  value: string
  secret?: boolean
}) {
  const [shown, setShown] = useState(!secret)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(value)
      setCopied(true)
    } catch {
      /* clipboard refusée — pas de feedback */
    }
  }

  return (
    <div className="flex items-center gap-2.5 border-b border-idn-border-soft py-3 last:border-b-0">
      <div className="w-[140px] text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
        {label}
      </div>
      <div className="flex-1 rounded-md border border-idn-border bg-idn-surface-2 px-3 py-2 font-mono text-xs text-idn-ink">
        {shown ? value : "•".repeat(28)}
      </div>
      {secret ? (
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="cursor-pointer p-2 text-idn-muted outline-none transition-colors hover:text-idn-ink focus-visible:ring-2 focus-visible:ring-idn-green"
          aria-label={shown ? "Masquer" : "Afficher"}
        >
          {IdnIcons.eye}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        className={`flex w-[88px] cursor-pointer items-center justify-center gap-1 p-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-idn-green ${
          copied
            ? "text-idn-green"
            : "text-idn-muted hover:text-idn-ink"
        }`}
      >
        {copied ? (
          <>
            {IdnIcons.check} Copié
          </>
        ) : (
          <>
            {IdnIcons.copy} Copier
          </>
        )}
      </button>
    </div>
  )
}
