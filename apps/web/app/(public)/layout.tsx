import { MobilePublicFooter } from "./_components/mobile-public-footer"
import { MobilePublicNav } from "./_components/mobile-public-nav"
import { PublicFooter } from "./_components/public-footer"
import { PublicNav } from "./_components/public-nav"
import { footer } from "./_content/fr"

export default function PublicLayout({
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
      <MobilePublicNav className="md:hidden" />
      <PublicNav className="hidden md:block" />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <MobilePublicFooter className="md:hidden" />
      <PublicFooter className="hidden md:block" />
    </div>
  )
}
