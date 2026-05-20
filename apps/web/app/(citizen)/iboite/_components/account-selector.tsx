"use client"

import * as React from "react"
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  HomeIcon,
  type LucideIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Id } from "@repo/backend/convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import { cn } from "@repo/ui/lib/utils"

import { iboite } from "../_content/fr"

type AccountType = "personal" | "professional" | "association"

type Account = {
  _id: Id<"iboiteAccount">
  type: AccountType
  label: string
  emailAlias: string
  street: string
  city: string
  postalCode: string
  country: string
  qrCode: string
  isAddressConfigured: boolean
  district: string | null
  addressLine: string | null
}

const ICON_BY_TYPE: Record<AccountType, LucideIcon> = {
  personal: HomeIcon,
  professional: BriefcaseIcon,
  association: UsersIcon,
}

/** Dégradés exacts de la spec §2.3 (couleurs CSS). */
const GRADIENT_BY_TYPE: Record<AccountType, string> = {
  personal: "from-blue-500 to-indigo-600",
  professional: "from-emerald-500 to-teal-600",
  association: "from-purple-500 to-pink-600",
}

export function AccountSelector({
  accounts,
  current,
  onSelect,
  onConfigureAddress,
}: {
  accounts: ReadonlyArray<Account>
  current: Account
  onSelect: (id: Id<"iboiteAccount">) => void
  onConfigureAddress: () => void
}) {
  const [copied, setCopied] = React.useState(false)
  const Icon = ICON_BY_TYPE[current.type]

  const addressLine1 =
    [current.district, current.city].filter(Boolean).join(", ") ||
    current.addressLine ||
    current.street ||
    null

  async function copyAddress() {
    const text = `${current.label}\n${iboite.account.pointRelais} ${current.qrCode}\n${[current.district, current.street].filter(Boolean).join("\n")}\n${current.postalCode} ${current.city}\n${current.country}`
    try {
      await navigator.clipboard.writeText(text.replace(/\n\n+/g, "\n"))
      setCopied(true)
      toast.success(iboite.toasts.addressCopied)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copie impossible.")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br px-3.5 py-3 text-left text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:scale-[0.98]",
              GRADIENT_BY_TYPE[current.type],
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-bold">{current.label}</span>
              <span className="truncate text-[11px] opacity-80">
                {current.emailAlias}
              </span>
            </div>
            <ChevronDownIcon
              className="h-4 w-4 shrink-0 transition-transform data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[--radix-dropdown-menu-trigger-width] min-w-72 p-2"
        >
          <DropdownMenuLabel className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {iboite.account.listLabel}
          </DropdownMenuLabel>
          {accounts.map((acc) => {
            const ItemIcon = ICON_BY_TYPE[acc.type]
            const selected = acc._id === current._id
            return (
              <DropdownMenuItem
                key={acc._id}
                onSelect={() => onSelect(acc._id)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                    GRADIENT_BY_TYPE[acc.type],
                  )}
                >
                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold">{acc.label}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {acc.emailAlias}
                  </span>
                </div>
                {selected ? (
                  <CheckIcon
                    className="h-4 w-4 text-idn-green"
                    aria-hidden="true"
                  />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bandeau adresse — état configuré vs non configuré */}
      {current.isAddressConfigured && addressLine1 ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <MapPinIcon
            className="h-3.5 w-3.5 shrink-0 text-idn-green"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-foreground">
              {addressLine1}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {current.qrCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onConfigureAddress}
            aria-label={iboite.account.configurePrompt}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={copyAddress}
            aria-label={iboite.account.copyAddress}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 text-idn-green" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onConfigureAddress}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-idn-green/60 bg-idn-green-soft/40 px-3 py-2 text-left transition-colors hover:bg-idn-green-soft dark:bg-[#0F2A18]/40 dark:hover:bg-[#0F2A18]/70"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-idn-green text-white">
            <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold text-idn-green dark:text-idn-green-on-dark">
              {iboite.account.configurePrompt}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {iboite.account.configureHint}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
