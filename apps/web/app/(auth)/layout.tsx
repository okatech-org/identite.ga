import { footer } from "../(public)/_content/fr"

/**
 * Layout des pages d'auth (sign-up tunnel, sign-in, forgot/reset password).
 *
 * Plein écran sans PublicNav/PublicFooter — chaque écran rend son propre
 * header (OnboardingHeader avec ← + progress) via WizardShell. Cohérent
 * avec les maquettes mobile (full-screen flow).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        {footer.skipToMain}
      </a>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}
