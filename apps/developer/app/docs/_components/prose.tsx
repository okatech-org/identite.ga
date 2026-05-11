/**
 * Primitives prose pour les articles de doc — port idn-docs.jsx (DocBody,
 * H1, H2, Lede, P, Code, CodeBlock, Callout).
 *
 * Tous les composants utilisent les tokens Tailwind IDN (`text-idn-*`,
 * `bg-idn-*`, `border-idn-*`) pour cohérence cross-app. Le bloc de code
 * a un header type macOS (3 dots colorés) comme dans la maquette.
 */
import type { ReactNode } from "react"

import { CopyButton } from "./copy-button"

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[36px] font-semibold leading-[1.15] tracking-[-0.0167em] text-idn-ink">
      {children}
    </h1>
  )
}

export function H2({
  children,
  id,
}: {
  children: ReactNode
  id?: string
}) {
  return (
    <h2
      id={id}
      className="mt-9 pt-2 text-[22px] font-semibold tracking-[-0.0136em] text-idn-ink scroll-mt-20"
    >
      {children}
    </h2>
  )
}

export function H3({
  children,
  id,
}: {
  children: ReactNode
  id?: string
}) {
  return (
    <h3
      id={id}
      className="mt-6 text-[16px] font-semibold tracking-[-0.005em] text-idn-ink scroll-mt-20"
    >
      {children}
    </h3>
  )
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 max-w-[720px] text-[16px] leading-[1.65] text-idn-muted">
      {children}
    </p>
  )
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3.5 max-w-[720px] text-[14px] leading-[1.7] text-idn-ink-2">
      {children}
    </p>
  )
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-3.5 ml-4 max-w-[720px] list-disc space-y-1.5 text-[14px] leading-[1.7] text-idn-ink-2 marker:text-idn-muted">
      {children}
    </ul>
  )
}

export function Ol({ children }: { children: ReactNode }) {
  return (
    <ol className="mt-3.5 ml-5 max-w-[720px] list-decimal space-y-2 text-[14px] leading-[1.7] text-idn-ink-2 marker:text-idn-muted marker:font-mono marker:text-xs">
      {children}
    </ol>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-idn-ink">
      {children}
    </code>
  )
}

/**
 * Bloc de code avec header type macOS (3 dots colorés) + langage + titre
 * optionnel + bouton "copier". Sans coloration syntaxique pour rester
 * léger — un upgrade vers Shiki/Prism viendra si nécessaire.
 */
export function CodeBlock({
  children,
  lang = "ts",
  title,
}: {
  children: string
  lang?: string
  title?: string
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[10px] border border-idn-border bg-[#1A1F1B] dark:bg-[#0F1310]">
      <div className="flex items-center gap-2.5 border-b border-[#2A302C] bg-[#151A16] px-3.5 py-2 dark:border-[#1F2520] dark:bg-[#10150F]">
        <span className="block h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="block h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="block h-2 w-2 rounded-full bg-[#28C840]" />
        <span className="ml-2 font-mono text-[11px] text-[#A8B4A2]">
          {title ?? lang}
        </span>
        <div className="flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B7565]">
          {lang}
        </span>
        <CopyButton text={children} />
      </div>
      <pre className="m-0 overflow-auto p-4 font-mono text-[12.5px] leading-[1.65] text-[#E8EAE2]">
        {children}
      </pre>
    </div>
  )
}

type CalloutKind = "info" | "warn" | "success"

const calloutStyles: Record<
  CalloutKind,
  { bg: string; border: string; ic: string }
> = {
  info: {
    bg: "bg-[#E6EEF7] dark:bg-[#10243A]",
    border: "border-[#2563AC]",
    ic: "text-[#2563AC]",
  },
  warn: {
    bg: "bg-[#FBF3D8] dark:bg-[#1F2316]",
    border: "border-[#A7841C]",
    ic: "text-[#A7841C]",
  },
  success: {
    bg: "bg-idn-green-soft dark:bg-[#0F2A18]",
    border: "border-idn-green",
    ic: "text-idn-green",
  },
}

const calloutIcons: Record<CalloutKind, ReactNode> = {
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z" />
    </svg>
  ),
  warn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  ),
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5 9-11" />
    </svg>
  ),
}

export function Callout({
  kind = "info",
  title,
  children,
}: {
  kind?: CalloutKind
  title?: string
  children: ReactNode
}) {
  const t = calloutStyles[kind]
  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-[10px] border-l-[3px] p-3.5 ${t.bg} ${t.border}`}
    >
      <span className={`mt-0.5 ${t.ic}`}>{calloutIcons[kind]}</span>
      <div className="min-w-0 flex-1">
        {title ? (
          <div className="text-[13px] font-semibold text-idn-ink">{title}</div>
        ) : null}
        <div
          className={`text-[13px] leading-[1.65] text-idn-ink-2 ${title ? "mt-1" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/** Cellule de tableau légère — pour les tableaux à 2/3 colonnes des articles. */
export function DocTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-[10px] border border-idn-border">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-idn-surface">
            {headers.map((h) => (
              <th
                key={h}
                className="border-b border-idn-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="even:bg-idn-surface/40"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 align-top text-idn-ink-2 ${
                    i < rows.length - 1
                      ? "border-b border-idn-border-soft"
                      : ""
                  } ${j === 0 ? "font-mono text-[12px] text-idn-ink" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Carte de section (utilisé par grids 2 ou 3 colonnes dans les articles). */
export function FeatureCard({
  title,
  children,
  accent,
}: {
  title: string
  children: ReactNode
  accent?: "muted" | "blue" | "green"
}) {
  const accentClass =
    accent === "green"
      ? "border-idn-green"
      : accent === "blue"
        ? "border-[#2563AC]"
        : "border-idn-border"
  return (
    <div
      className={`rounded-xl border-2 ${accentClass} bg-idn-surface p-4`}
    >
      <div className="text-[13px] font-semibold text-idn-ink">{title}</div>
      <div className="mt-2 text-[13px] leading-[1.55] text-idn-ink-2">
        {children}
      </div>
    </div>
  )
}

/** Pill / badge (utilisé pour la liste de garanties du SDK core). */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-idn-green-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-idn-green dark:bg-[#0F2A18]">
      {children}
    </span>
  )
}
