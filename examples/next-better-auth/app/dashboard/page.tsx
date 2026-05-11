import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)

  if (!session?.user) {
    redirect("/")
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-[720px] flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-idn-border bg-idn-surface p-9">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
          Bourses Étudiantes
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.014em] text-idn-ink">
          Bonjour {session.user.name ?? session.user.email} 👋
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-idn-muted">
          Vous êtes authentifié(e) via Identité Numérique. Cette page démontre
          qu&apos;une session valide a été établie après le flow OAuth Code +
          PKCE.
        </p>

        <h2 className="mt-7 text-[13px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
          Profil reçu
        </h2>
        <pre className="mt-2 overflow-auto rounded-md bg-idn-surface-2 p-4 font-mono text-[12px] text-idn-ink">
          {JSON.stringify(session.user, null, 2)}
        </pre>

        <h2 className="mt-7 text-[13px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
          Session
        </h2>
        <pre className="mt-2 overflow-auto rounded-md bg-idn-surface-2 p-4 font-mono text-[12px] text-idn-ink">
          {JSON.stringify(session.session, null, 2)}
        </pre>

        <form action="/api/auth/sign-out" method="POST" className="mt-7">
          <button
            type="submit"
            className="rounded-md border border-idn-border bg-idn-surface px-4 py-2 text-sm font-medium text-idn-ink-2 hover:bg-idn-surface-2"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  )
}
