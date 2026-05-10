import Link from "next/link"
import { redirect } from "next/navigation"
import { BellIcon } from "lucide-react"

import { IdnMark } from "@repo/ui/components/idn-mark"
import { ThemeToggle } from "@repo/ui/components/theme-toggle"

import { isAuthenticated } from "@/lib/auth-server"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authed = await isAuthenticated()
  if (!authed) {
    redirect("/sign-in?redirect_to=/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-15 min-h-[60px] max-w-[1180px] items-center gap-4 px-4 md:gap-7 md:px-7">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            aria-label="Identité Numérique — Tableau de bord"
          >
            <IdnMark size={26} />
            <span className="hidden whitespace-nowrap text-sm font-semibold text-foreground sm:inline">
              Identité Numérique
            </span>
            <span className="hidden whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-muted-foreground md:inline">
              RÉPUBLIQUE GABONAISE
            </span>
          </Link>

          <nav
            className="ml-2 hidden items-center gap-1 lg:flex"
            aria-label="Navigation principale"
          >
            <Link
              href="/dashboard"
              aria-current="page"
              className="rounded-md bg-idn-green-soft px-3.5 py-2 text-[13px] font-semibold text-idn-green dark:bg-[#0F2A18]"
            >
              Accueil
            </Link>
            <span
              aria-disabled="true"
              title="Bientôt disponible"
              className="cursor-not-allowed rounded-md px-3.5 py-2 text-[13px] font-medium text-muted-foreground/60"
            >
              Mon profil
            </span>
            <span
              aria-disabled="true"
              title="Bientôt disponible"
              className="cursor-not-allowed rounded-md px-3.5 py-2 text-[13px] font-medium text-muted-foreground/60"
            >
              Consentements
            </span>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-3">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <BellIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
