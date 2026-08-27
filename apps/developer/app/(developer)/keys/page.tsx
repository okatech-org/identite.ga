"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { fr } from "../../_content/fr"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

export default function KeysIndexPage() {
  const router = useRouter()
  const apps = useQuery(api.developer.apps.listMine, {}) ?? null

  useEffect(() => {
    if (apps && apps.length > 0 && apps[0]) {
      router.replace(`/applications/${apps[0].clientId}/keys`)
    }
  }, [apps, router])

  return (
    <>
      <OpHeader
        sub={fr.keys.subTemplate.replace("{appName}", "—")}
        title={fr.keys.title}
      />
      <div className="portal-canvas flex-1 overflow-auto">
        {apps === null ? (
          <div className="text-sm text-idn-muted">Chargement…</div>
        ) : apps.length === 0 ? (
          <div className="portal-panel portal-limit-narrow p-10 text-center">
            <h2 className="text-lg font-semibold text-idn-ink">
              {fr.applications.empty.title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-idn-muted">
              {fr.applications.empty.body}
            </p>
            <Button asChild size="sm" className="mt-5 gap-1">
              <Link href="/applications/new">
                {IdnIcons.plus} {fr.applications.empty.cta}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-sm text-idn-muted">Redirection…</div>
        )}
      </div>
    </>
  )
}
