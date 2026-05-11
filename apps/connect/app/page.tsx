import Link from "next/link"

import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

/**
 * Landing par défaut de connect.identite.ga.
 *
 * En pratique les utilisateurs n'atterrissent jamais ici : ils arrivent
 * toujours via `/oauth/authorize?client_id=...` depuis une app tierce.
 * On garde un écran informatif (et lien vers identite.ga) au cas où.
 */
export default function ConnectHome() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-idn-bg p-10">
      <div className="w-[480px] rounded-2xl border border-idn-border bg-idn-surface p-9 text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <IdnMark size={28} />
          <div className="text-[14px] font-semibold text-idn-ink">
            Identité Numérique
          </div>
        </div>
        <IdnFlagBars width={120} height={2} className="mx-auto mb-6" />
        <h1 className="text-[20px] font-semibold tracking-[-0.014em] text-idn-ink">
          Point de connexion fédéré
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-idn-muted">
          Ce sous-domaine est le point d&apos;authentification OIDC d&apos;Identité
          Numérique. Les écrans de connexion s&apos;ouvrent ici lorsqu&apos;une
          application tierce vous demande de vous identifier avec IDN.
        </p>
        <Link
          href="https://identite.ga"
          className="mt-6 inline-block text-sm font-medium text-idn-green underline-offset-2 hover:underline"
        >
          Retour à identite.ga
        </Link>
      </div>
    </main>
  )
}
