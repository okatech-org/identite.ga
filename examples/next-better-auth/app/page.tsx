import Link from "next/link"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

import { SignInButton } from "./_components/sign-in-button"

export default async function HomePage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)

  return (
    <main className="mx-auto flex min-h-svh max-w-[640px] flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-idn-border bg-idn-surface p-9">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
          Application exemple
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.014em] text-idn-ink">
          Bourses Étudiantes
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-idn-muted">
          Démonstration de l&apos;intégration « Se connecter avec Identité
          Numérique » via le helper{" "}
          <code className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[12px]">
            @idn-ga/better-auth
          </code>
          .
        </p>

        {session?.user ? (
          <div className="mt-7 space-y-4">
            <div className="rounded-md border border-idn-border bg-idn-surface-2 p-4 text-sm">
              <div className="text-idn-muted">Connecté en tant que</div>
              <div className="mt-1 font-medium text-idn-ink">
                {session.user.name ?? session.user.email}
              </div>
              {session.user.email ? (
                <div className="mt-0.5 font-mono text-xs text-idn-muted">
                  {session.user.email}
                </div>
              ) : null}
            </div>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-idn-green px-5 py-3 text-sm font-semibold text-white hover:bg-idn-green/90"
            >
              Aller au tableau de bord
            </Link>
          </div>
        ) : (
          <div className="mt-7">
            <SignInButton />
            <p className="mt-3 text-xs text-idn-muted">
              Le bouton lance le flow OAuth Code + PKCE et redirige vers{" "}
              <code className="rounded bg-idn-surface-2 px-1 py-0.5 font-mono text-[11px]">
                identite.ga
              </code>{" "}
              pour authentification + consentement.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
