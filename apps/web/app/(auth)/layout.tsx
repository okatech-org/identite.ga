import { PublicFooter } from "../(public)/_components/public-footer"
import { PublicNav } from "../(public)/_components/public-nav"
import { footer } from "../(public)/_content/fr"

/**
 * Layout des pages d'auth (sign-up tunnel, sign-in, forgot/reset password).
 *
 * Réutilise le PublicNav + PublicFooter des pages publiques pour cohérence
 * visuelle : ce sont toutes des pages non-connectées, le citoyen retrouve
 * la même chrome (logo, navigation, theme toggle, liens institutionnels).
 *
 * Quand on créera apps/auth sur connexion.idn.ga (cf. cahier §1.3), on
 * pourra durcir la CSP et restreindre la chrome — pour l'instant on garde
 * cohérent avec idn.ga.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        {footer.skipToMain}
      </a>
      <PublicNav />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
