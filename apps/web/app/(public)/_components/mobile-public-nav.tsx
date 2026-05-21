"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import {
  HomeIcon,
  KeyRoundIcon,
  LogOutIcon,
  MenuIcon,
  ShieldCheckIcon,
  UserIcon,
  XIcon,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { Avatar } from "@repo/ui/components/avatar"
import { Button } from "@repo/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { ThemeToggle } from "@repo/ui/components/theme-toggle"
import { cn } from "@repo/ui/lib/utils"

import { authClient } from "@/lib/auth-client"

import { mobileNav, navActions, navTabs } from "../_content/fr"

const SIGN_IN_URL = "/sign-in"
const SIGN_UP_URL = "/sign-up"

const CONNECTED_LINKS = [
  { href: "/dashboard", label: "Tableau de bord", icon: HomeIcon },
  { href: "/profile", label: "Mon profil", icon: UserIcon },
  { href: "/consents", label: "Mes consentements", icon: ShieldCheckIcon },
  { href: "/settings", label: "Paramètres", icon: KeyRoundIcon },
] as const

export function MobilePublicNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const me = useQuery(api.profile.getCurrentUser)
  const [open, setOpen] = React.useState(false)

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/"
  }

  const firstName = me?.profile?.pivot?.firstName
  const lastName = me?.profile?.pivot?.lastName
  const photoUrl = me?.profile?.photoUrl ?? null
  const fullName =
    firstName && lastName ? `${firstName} ${lastName}` : me?.email

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className,
      )}
    >
      <div className="flex h-13 items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          aria-label={`${navActions.brand} — Accueil`}
        >
          <IdnMark size={22} />
          <span className="text-[14px] font-semibold text-foreground">
            {navActions.brand}
          </span>
        </Link>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={mobileNav.menuLabel}
            >
              <MenuIcon aria-hidden="true" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="flex flex-row items-center justify-between border-b border-border">
              <div>
                <DrawerTitle>{mobileNav.menuTitle}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {mobileNav.menuDescription}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={mobileNav.closeLabel}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </DrawerClose>
            </DrawerHeader>

            {me && (
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <Avatar
                  firstName={firstName}
                  lastName={lastName}
                  src={photoUrl}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {me.email}
                  </p>
                </div>
              </div>
            )}

            <nav
              className="flex flex-col gap-1 p-3"
              aria-label="Navigation principale (mobile)"
            >
              {navTabs.map((tab) => {
                const active = isActive(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center rounded-md px-4 py-3 text-[15px] font-medium transition-colors",
                      active
                        ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                        : "text-foreground/90 hover:bg-secondary",
                    )}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>

            {me && (
              <nav
                className="flex flex-col gap-1 border-t border-border p-3"
                aria-label="Mon compte"
              >
                {CONNECTED_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-4 py-3 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                          : "text-foreground/90 hover:bg-secondary",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </Link>
                  )
                })}
              </nav>
            )}

            <DrawerFooter>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {mobileNav.themeLabel}
                </span>
                <ThemeToggle />
              </div>
              {me ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOutIcon aria-hidden="true" />
                  Se déconnecter
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Link href={SIGN_IN_URL}>{navActions.signIn}</Link>
                  </Button>
                  <Button asChild size="lg" className="w-full">
                    <Link href={SIGN_UP_URL}>{navActions.signUp}</Link>
                  </Button>
                </>
              )}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  )
}
