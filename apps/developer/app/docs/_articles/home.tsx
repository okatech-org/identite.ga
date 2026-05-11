/**
 * DocsHome — landing /docs.
 * Port idn-docs.jsx:227-330. Pas de sidebar, single-column.
 */
import Link from "next/link";

import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars";

import { Code } from "../_components/prose";

const PACKAGES = [
  {
    id: "@idn-ga/core",
    desc: "Client OIDC vanilla, zéro dépendance",
    size: "12 KB gzip",
    deps: "aucune",
  },
  {
    id: "@idn-ga/react",
    desc: "Hooks headless + composants pré-stylés",
    size: "25 KB gzip",
    deps: "react ≥ 18",
  },
  {
    id: "@idn-ga/better-auth",
    desc: "Helper genericOAuth pour Better Auth",
    size: "5 KB gzip",
    deps: "better-auth",
  },
  {
    id: "@idn-ga/next-auth",
    desc: "Provider OIDC pour NextAuth v5",
    size: "5 KB gzip",
    deps: "next-auth",
  },
];

const QUICKSTARTS: Array<{
  slug: string;
  title: string;
  desc: string;
  tag?: string;
}> = [
  {
    slug: "quickstart-better-auth",
    title: "Better Auth + Next.js",
    desc: "L'intégration la plus rapide. Helper officiel.",
    tag: "RECOMMANDÉ",
  },
  {
    slug: "quickstart-nextauth",
    title: "NextAuth.js v5",
    desc: "Provider IDN prêt à l'emploi pour Auth.js.",
  },
  {
    slug: "quickstart-react",
    title: "React + Vite",
    desc: "<IDNProvider> + hooks headless.",
  },
  {
    slug: "quickstart-vanilla",
    title: "Vanilla JavaScript",
    desc: "Pour toute app non-React (Vue, Svelte, vanilla).",
  },
];

const FOOTER_COLS: Array<{ h: string; l: { label: string; href?: string }[] }> =
  [
    {
      h: "Ressources",
      l: [
        { label: "Référence API complète", href: "/docs/core-api" },
        { label: "Migration depuis Clerk", href: "/docs/migration-clerk" },
        { label: "Sécurité OIDC", href: "/docs/security" },
        { label: "Playground OIDC", href: "/docs/playground" },
      ],
    },
    {
      h: "Spécifications",
      l: [
        { label: "OpenID Connect 1.0" },
        { label: "OAuth 2.1 (draft)" },
        { label: "Niveaux de garantie eIDAS", href: "/docs/loa" },
        { label: "Conformance Suite" },
      ],
    },
    {
      h: "Communauté",
      l: [
        { label: "GitHub @idn-ga" },
        { label: "Discussions" },
        { label: "Bug bounty" },
        { label: "Roadmap publique" },
      ],
    },
    {
      h: "Plateforme",
      l: [
        { label: "identite.ga" },
        { label: "Console développeur", href: "/applications" },
        { label: "Status identite.ga" },
        { label: "Contact équipe" },
      ],
    },
  ];

export default function DocsHome() {
  return (
    <article className="min-w-0 flex-1 overflow-y-auto">
      {/* Hero */}
      <section className="mx-auto max-w-[1080px] px-11 pb-14 pt-16">
        <div className="mb-4 flex items-center gap-2.5">
          <IdnFlagBars width={32} height={3} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
            Documentation développeur · v1.0.0
          </span>
        </div>
        <h1 className="max-w-[760px] text-[48px] font-semibold leading-[1.1] tracking-[-0.02em] text-idn-ink">
          Intégrez{" "}
          <span className="text-idn-green">
            « Se connecter avec Identité Numérique »
          </span>{" "}
          en moins de 10 lignes.
        </h1>
        <p className="mt-4 max-w-[640px] text-[17px] leading-[1.6] text-idn-muted">
          Le SDK <Code>@idn-ga/*</Code> permet à toute application —
          gouvernementale, privée, partenaire — d&apos;authentifier ses
          utilisateurs via Identité Numérique du Gabon. OpenID Connect standard,
          PKCE obligatoire, zéro vendor lock-in.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link
            href="/docs/quickstart-better-auth"
            className="rounded-lg bg-idn-green px-5 py-3 text-[15px] font-semibold text-white outline-none transition-colors hover:bg-idn-green/90 focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2"
          >
            Démarrer en 5 min
          </Link>
          <a
            href="https://github.com/okatech-org/identite.ga.git"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-idn-border px-5 py-3 text-[15px] font-medium text-idn-ink-2 outline-none transition-colors hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
          >
            Voir sur GitHub
          </a>
        </div>
      </section>

      {/* Packages grid */}
      <section className="border-y border-idn-border bg-idn-surface px-11 py-12">
        <div className="mx-auto max-w-[1080px]">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-idn-muted">
            Les 4 packages
          </div>
          <div className="mt-1 text-[24px] font-semibold tracking-[-0.013em] text-idn-ink">
            Choisissez votre stack
          </div>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {PACKAGES.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-idn-border bg-idn-bg p-[18px]"
              >
                <div className="font-mono text-[12px] font-semibold text-idn-green">
                  {p.id}
                </div>
                <p className="mt-2 text-[13px] leading-[1.5] text-idn-ink-2">
                  {p.desc}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.04em] text-idn-muted">
                    {p.size}
                  </span>
                  <span className="rounded-full bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.04em] text-idn-muted">
                    {p.deps}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start tiles */}
      <section className="mx-auto max-w-[1080px] px-11 py-12">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-idn-muted">
          Quick start
        </div>
        <div className="mt-1 text-[24px] font-semibold tracking-[-0.013em] text-idn-ink">
          5 minutes pour intégrer IDN
        </div>
        <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
          {QUICKSTARTS.map((q) => (
            <Link
              key={q.slug}
              href={`/docs/${q.slug}`}
              className="flex flex-col rounded-xl border border-idn-border bg-idn-surface p-[22px] outline-none transition-colors hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
            >
              <div className="flex items-center gap-2.5">
                <div className="text-[15px] font-semibold text-idn-ink">
                  {q.title}
                </div>
                {q.tag ?
                  <span className="rounded-full bg-idn-green-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-idn-green dark:bg-[#0F2A18]">
                    {q.tag}
                  </span>
                : null}
              </div>
              <p className="mt-2 text-[13px] leading-[1.5] text-idn-muted">
                {q.desc}
              </p>
              <div className="mt-3.5 flex items-center gap-1 text-[12px] font-medium text-idn-green">
                Commencer →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer link rail */}
      <footer className="border-t border-idn-border bg-idn-surface px-11 py-8">
        <div className="mx-auto grid max-w-[1080px] gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLS.map((col) => (
            <div key={col.h}>
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-idn-muted">
                {col.h}
              </div>
              <ul className="space-y-1.5">
                {col.l.map((it) => (
                  <li key={it.label}>
                    {it.href ?
                      <Link
                        href={it.href}
                        className="text-[13px] text-idn-ink-2 outline-none hover:text-idn-green focus-visible:text-idn-green"
                      >
                        {it.label}
                      </Link>
                    : <span className="text-[13px] text-idn-muted">
                        {it.label}
                      </span>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </article>
  );
}
