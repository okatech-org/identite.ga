"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { ChevronUpIcon, LogOutIcon, SettingsIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"

import { authClient } from "@/lib/auth-client"

import { fr } from "../_content/fr"

const initialsFor = (
  email: string,
  firstName?: string,
  lastName?: string,
): string => {
  if (firstName || lastName) {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "D"
  }
  return (email.split("@")[0] ?? "").slice(0, 1).toUpperCase() || "D"
}

export function UserMenu() {
  const me = useQuery(api.profile.getCurrentUser)
  const firstName = me?.profile?.pivot?.firstName ?? ""
  const lastName = me?.profile?.pivot?.lastName ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const email = me?.email ?? ""
  const displayName = fullName || email || "Compte développeur"
  const badge = me ? initialsFor(email, firstName, lastName) : "·"

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
    } finally {
      window.location.href = "/sign-in"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Ouvrir le menu du compte ${displayName}`}
          className="flex w-full items-center gap-2.5 border-t border-idn-border-soft p-3 text-left outline-none transition-colors hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-inset"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-idn-surface-2 text-xs font-semibold text-idn-ink">
            {badge}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-idn-ink">
              {displayName}
            </span>
            <span className="block text-[10px] text-idn-muted">
              {fr.brand.connecte}
            </span>
          </span>
          <ChevronUpIcon className="size-4 shrink-0 text-idn-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          {email ? (
            <span className="truncate text-xs font-normal text-idn-muted">
              {email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon aria-hidden /> Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOutIcon aria-hidden /> {fr.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
