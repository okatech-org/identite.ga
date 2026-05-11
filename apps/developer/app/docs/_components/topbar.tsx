"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { IdnMark } from "@repo/ui/components/idn-mark";

import { ARTICLE_GROUPS } from "../_articles/registry";
import { CommandPalette } from "./command-palette";

/**
 * Mapping tab → destination + groupes ARTICLE couverts (pour calculer
 * l'état actif sur n'importe quel article du groupe).
 *
 * "Documentation" est la tab fourre-tout : active sur la home `/docs`
 * et sur les articles qui n'appartiennent pas explicitement à un autre
 * groupe (typiquement les Quick starts du groupe PREMIERS PAS).
 */
type TabSpec = {
  id: string;
  label: string;
  href: string;
  /** Groupes ARTICLE_GROUPS qui activent la tab (null = fourre-tout) */
  groups: string[] | null;
};

const TABS: TabSpec[] = [
  { id: "docs", label: "Documentation", href: "/docs", groups: null },
  { id: "guides", label: "Guides", href: "/docs/loa", groups: ["GUIDES"] },
  {
    id: "reference",
    label: "Référence API",
    href: "/docs/core-api",
    groups: ["@IDN/CORE", "@IDN/REACT"],
  },
];

/**
 * Topbar du site docs — port idn-docs.jsx:54-77.
 *
 * Logo IDN/Docs + version, 4 tabs visuelles (filtrent le scope dans la sidebar
 * via ?), search ⌘K, GitHub link, bouton "Console développeur" vers /applications.
 *
 * Les tabs sont visuelles pour la v1 — l'active state se déduit du pathname
 * (toute route /docs/* est sous "Documentation").
 */
/** Map slug → groupTitle, dérivé une fois depuis ARTICLE_GROUPS. */
const SLUG_TO_GROUP: Record<string, string> = Object.fromEntries(
  ARTICLE_GROUPS.flatMap((g) => g.items.map((i) => [i.slug, g.title])),
);

export function DocsTopbar() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/docs" || pathname === "/docs/";
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  // Slug courant (segment après /docs/) — null sur la home.
  const currentSlug = useMemo(() => {
    const m = pathname.match(/^\/docs\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const currentGroup: string | null = currentSlug
    ? (SLUG_TO_GROUP[currentSlug] ?? null)
    : null;

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-7 border-b border-idn-border bg-idn-surface px-7">
        <Link
          href="/docs"
          className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-idn-green"
          aria-label="Identité Numérique — Documentation"
        >
          <IdnMark size={26} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-[-0.012em] text-idn-ink">
              Identité Numérique
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
              DOCUMENTATION · DÉVELOPPEUR
            </div>
          </div>
          <span className="hidden whitespace-nowrap rounded-full bg-idn-surface-2 px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-idn-muted lg:inline">
            RÉPUBLIQUE GABONAISE
          </span>
        </Link>

        <nav className="hidden gap-1 md:flex" aria-label="Sections de la doc">
          {TABS.map((tab) => {
            let active = false;
            if (tab.groups === null) {
              // "Documentation" : actif sur la home, ou quand l'article courant
              // n'appartient à aucun autre groupe revendiqué par une tab.
              const claimedByOthers = TABS.filter((t) => t.groups !== null)
                .flatMap((t) => t.groups ?? [])
              active =
                isHome ||
                (currentGroup !== null && !claimedByOthers.includes(currentGroup));
            } else {
              active = currentGroup !== null && tab.groups.includes(currentGroup);
            }
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`rounded-lg px-3.5 py-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-idn-green ${
                  active ?
                    "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18]"
                  : "font-medium text-idn-ink-2 hover:bg-idn-surface-2"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-lg border border-idn-border bg-idn-surface-2 px-3 py-1.5 text-[12px] text-idn-muted outline-none transition-colors hover:border-idn-green/40 focus-visible:ring-2 focus-visible:ring-idn-green md:flex md:w-[280px]"
          aria-label="Rechercher dans la documentation"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.5-4.5" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Rechercher dans la doc…</span>
          <kbd className="rounded border border-idn-border bg-idn-surface px-1.5 py-px font-mono text-[10px]">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>

        <a
          href="https://github.com/okatech-org/identite.ga.git"
          target="_blank"
          rel="noreferrer noopener"
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-idn-ink-2 outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green sm:flex"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.67 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.17a11 11 0 015.79 0c2.2-1.48 3.17-1.17 3.17-1.17.63 1.59.23 2.76.12 3.05.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.38-5.27 5.66.41.36.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
          </svg>
          GitHub
        </a>

        <Link
          href="/applications"
          className="rounded-lg bg-idn-green px-3.5 py-1.5 text-[13px] font-semibold text-white outline-none transition-colors hover:bg-idn-green/90 focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2"
        >
          Console développeur
        </Link>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
