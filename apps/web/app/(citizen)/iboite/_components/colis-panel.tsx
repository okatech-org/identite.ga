"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { PackageIcon, QrCodeIcon, TruckIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { iboite } from "../_content/fr"
import { formatShortDate } from "../_lib/format"

export function ColisPanel({
  accountId,
  qrCode,
}: {
  accountId: Id<"iboiteAccount">
  qrCode: string
}) {
  const data = useQuery(api.iboite.packages.listMine, { accountId })
  const markPickedUp = useMutation(api.iboite.packages.markPickedUp)

  async function onPickUp(packageId: Id<"iboitePackage">) {
    try {
      await markPickedUp({ packageId })
      toast.success(iboite.toasts.packagePickedUp)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : iboite.toasts.moveFailed)
    }
  }

  if (data === undefined) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">{iboite.loading}</p>
      </div>
    )
  }

  return (
    <div
      id="iboite-panel-colis"
      role="tabpanel"
      aria-labelledby="tab-colis"
      className="flex flex-1 flex-col"
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="text-base font-semibold">{iboite.colis.title}</h2>
          <p className="text-xs text-muted-foreground">
            {iboite.colis.countLabel(data.items.length)}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {/* Compteurs amber / bleu */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <PackageIcon className="h-4 w-4" aria-hidden="true" />
              <span className="text-2xl font-bold">{data.available}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              {iboite.colis.toPickUp}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TruckIcon className="h-4 w-4" aria-hidden="true" />
              <span className="text-2xl font-bold">{data.transit}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              {iboite.colis.inTransit}
            </p>
          </div>
        </div>

        {/* Liste des colis */}
        {data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <PackageIcon
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {iboite.colis.empty}
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.items.map((p) => {
              const avail = p.status === "available"
              const isInteractive = avail
              const Wrapper = isInteractive ? "button" : "div"
              return (
                <li key={p._id}>
                  <Wrapper
                    {...(isInteractive
                      ? {
                          type: "button" as const,
                          onClick: () =>
                            onPickUp(p._id as Id<"iboitePackage">),
                        }
                      : {})}
                    className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/40"
                  >
                    <div
                      className={
                        avail
                          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      }
                    >
                      {avail ? (
                        <PackageIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <TruckIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {iboite.colis.from(p.senderName)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {p.trackingNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={
                          avail
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        }
                      >
                        {avail
                          ? iboite.colis.toPickUp
                          : p.status === "transit"
                            ? iboite.colis.inTransit
                            : p.status}
                      </span>
                      {p.estimatedDeliveryAt ? (
                        <span className="text-[10px] text-muted-foreground">
                          {iboite.colis.arrival(
                            formatShortDate(p.estimatedDeliveryAt),
                          )}
                        </span>
                      ) : null}
                    </div>
                  </Wrapper>
                </li>
              )
            })}
          </ul>
        )}

        {/* Carte QR point relais */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground/80">
            <QrCodeIcon className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {iboite.colis.qrLabel}
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold">{qrCode}</p>
            <p className="text-[11px] text-muted-foreground">
              {iboite.colis.qrHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
