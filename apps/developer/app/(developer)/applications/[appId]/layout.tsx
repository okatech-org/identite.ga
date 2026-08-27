"use client"

import { useParams, usePathname } from "next/navigation"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { ApplicationWorkspaceNav } from "../../../_components/application-workspace-nav"
import { OpHeader } from "../../../_components/op-header"

type WorkspaceSection = "keys" | "webhooks" | "services"

const getSection = (pathname: string): WorkspaceSection => {
  if (pathname.endsWith("/webhooks")) return "webhooks"
  if (pathname.endsWith("/services")) return "services"
  return "keys"
}

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams<{ appId: string }>()
  const pathname = usePathname()
  const clientId = String(params?.appId ?? "")
  const app = useQuery(api.developer.apps.get, { clientId })

  if (app === undefined) {
    return (
      <>
        <OpHeader sub="APPLICATION" title="Atelier développeur" />
        <div className="portal-canvas flex-1 overflow-auto">
          <div className="portal-panel portal-limit p-6 text-sm text-idn-muted">
            Chargement de l’application…
          </div>
        </div>
      </>
    )
  }

  if (app === null) {
    return (
      <>
        <OpHeader sub="APPLICATION" title="Atelier développeur" />
        <div className="portal-canvas flex-1 overflow-auto">
          <div className="portal-panel portal-limit p-6 text-sm text-idn-muted">
            Application introuvable.
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <OpHeader
        sub={`OAUTH · ${app.name.toUpperCase()}`}
        title="Atelier de l’application"
      />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit space-y-5">
          <ApplicationWorkspaceNav app={app} section={getSection(pathname)} />
          {children}
        </div>
      </div>
    </>
  )
}
