"use client"

import * as React from "react"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { consents } from "../_content/fr"
import { ConsentCard } from "../_components/consent-card"

export default function ConsentsPage() {
  const data = useQuery(api.oauthConsents.listMine)
  const isLoading = data === undefined
  const list = data ?? []

  return (
    <section className="mx-auto w-full md:px-4 lg:px-20 py-6 md:py-8">
      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[26px]">
        {consents.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-[14px]">
        {isLoading ? "…" : list.length === 0 ? consents.subEmpty : consents.sub(list.length)}
      </p>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[92px] animate-pulse rounded-xl bg-secondary"
            />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            {consents.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {consents.emptySub}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {list.map((app) => (
            <li key={app.id}>
              <ConsentCard
                id={app.id}
                name={app.appName}
                scopes={app.scopes}
                grantedAt={app.grantedAt}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
