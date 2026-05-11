/**
 * Page de callback OAuth.
 *
 * Better Auth fait le boulot d'échange du code via son endpoint POST
 * `/api/auth/oauth2/callback/idn` (le `providerId` est dans l'URL). Le
 * serveur génère ensuite la session et redirige le user vers `callbackURL`
 * (cf. SignInButton).
 *
 * Cette page n'est pas vraiment atteinte en pratique (Better Auth nous
 * redirige avant), mais elle existe au cas où.
 */
import Link from "next/link"

export default function CallbackPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[480px] flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-idn-border bg-idn-surface p-7 text-center">
        <h1 className="text-[20px] font-semibold text-idn-ink">
          Traitement de la connexion…
        </h1>
        <p className="mt-3 text-sm text-idn-muted">
          Si cette page reste affichée, le flow OAuth a probablement échoué.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block text-sm font-medium text-idn-green underline-offset-2 hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
