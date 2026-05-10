"use client"

import * as React from "react"

import { Card } from "@repo/ui/components/card"
import { LoABadge, type LoALevel } from "@repo/ui/components/loa-badge"
import { cn } from "@repo/ui/lib/utils"

import { services } from "../_content/fr"
import { SERVICE_CATEGORIES } from "./_data"

export function ServicesList() {
  const [filter, setFilter] = React.useState<string>("all")

  const filteredCategories = React.useMemo(() => {
    if (filter === "all") return SERVICE_CATEGORIES
    const level = Number(filter) as LoALevel
    return SERVICE_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.loa === level),
    })).filter((cat) => cat.items.length > 0)
  }, [filter])

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Filtrer par niveau de garantie"
        className="mb-6 flex flex-wrap gap-2"
      >
        {services.filters.map((opt) => {
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-idn-green bg-idn-green text-white"
                  : "border-border bg-card text-foreground/80 hover:border-idn-green/40 hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {filteredCategories.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aucun service ne correspond à ce filtre.
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCategories.map((cat) => (
            <li key={cat.category}>
              <Card className="h-full p-5">
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {cat.category}
                </p>
                <ul className="divide-y divide-idn-border-soft">
                  {cat.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span className="flex-1 text-[13px] font-medium text-foreground">
                        {item.name}
                      </span>
                      <LoABadge level={item.loa} compact />
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
