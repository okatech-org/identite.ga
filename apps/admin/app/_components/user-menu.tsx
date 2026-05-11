"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { LogOutIcon, SettingsIcon } from "lucide-react"

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

/**
 * Pied de sidebar : avatar/identité + menu Paramètres / Se déconnecter.
 * Pattern repris de apps/controller/_components/controller-sidebar.tsx.
 */
function initials(name: string, email: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (
      (parts[0]?.[0] ?? "") +
      (parts[parts.length - 1]?.[0] ?? "")
    ).toUpperCase()
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  const local = email.split("@")[0] ?? ""
  return (local[0]?.toUpperCase() ?? "?") + (local[1]?.toUpperCase() ?? "")
}

export function UserMenu() {
  const me = useQuery(api.profile.getCurrentUser) as
    | {
        email: string
        profile: { pivot?: { firstName: string; lastName: string } } | null
      }
    | null
    | undefined

  const pivot = me?.profile?.pivot
  const fullName = pivot
    ? [pivot.firstName, pivot.lastName].filter(Boolean).join(" ")
    : ""
  const email = me?.email ?? ""
  const displayName = fullName || email.split("@")[0] || fr.brand.operator
  const initialsLabel = me ? initials(fullName, email) : fr.brand.badge

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
    } catch {
      /* ignore */
    }
    window.location.href = "/sign-in"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Compte de ${displayName}`}
          className="flex items-center gap-2.5 border-t border-idn-border-soft p-3 text-left transition-colors hover:bg-idn-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green/40 focus-visible:ring-inset"
        >
          <div
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-idn-surface-2 text-xs font-semibold text-idn-ink"
          >
            {initialsLabel}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-idn-ink">
              {displayName}
            </div>
            <div className="text-[10px] text-idn-muted">
              {fr.brand.connecte}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {displayName}
          </span>
          {email ? (
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon aria-hidden />
            <span>{fr.settings.menu}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOutIcon aria-hidden />
          <span>{fr.settings.signOut}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
