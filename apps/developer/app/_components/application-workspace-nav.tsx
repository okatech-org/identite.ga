"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

import { fr } from "../_content/fr"
import { DeleteApplicationDialog } from "./delete-application-dialog"

type Section = "keys" | "services" | "webhooks"

type WorkspaceApplication = {
  clientId: string
  name: string
  env: "production" | "sandbox"
  linkedClientId: string | null
  productionStatus: "none" | "pending" | "approved" | "rejected"
}

const sections: Section[] = ["keys", "webhooks", "services"]

export function ApplicationWorkspaceNav({
  app,
  section,
}: {
  app: WorkspaceApplication
  section: Section
}) {
  const router = useRouter()
  const productionAvailable =
    app.env === "production" || app.productionStatus === "approved"
  const sandboxClientId =
    app.env === "sandbox" ? app.clientId : app.linkedClientId
  const productionClientId =
    app.env === "production" ? app.clientId : app.linkedClientId

  const productionLabel =
    app.productionStatus === "pending"
      ? fr.appWorkspace.productionPending
      : app.productionStatus === "rejected"
        ? fr.appWorkspace.productionRejected
        : !productionAvailable
          ? fr.appWorkspace.productionUnavailable
          : fr.appWorkspace.production

  const switchEnvironment = (environment: string) => {
    const targetClientId =
      environment === "production" ? productionClientId : sandboxClientId
    if (!targetClientId || environment === app.env) return
    router.push(`/applications/${targetClientId}/${section}`)
  }

  return (
    <div className="rounded-xl border border-idn-border bg-idn-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-idn-border px-4 py-3">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-idn-muted hover:text-idn-ink"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          {fr.appWorkspace.back}
        </Link>
        <div className="hidden h-4 w-px bg-idn-border sm:block" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-idn-ink">
            {app.name}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <span className="hidden text-xs text-idn-muted sm:inline">
            {fr.appWorkspace.environment}
          </span>
          <Select value={app.env} onValueChange={switchEnvironment}>
            <SelectTrigger
              size="sm"
              className={
                app.env === "production"
                  ? "border-idn-green/40 bg-idn-green-soft text-idn-green"
                  : "bg-idn-surface-2"
              }
              aria-label={fr.appWorkspace.environment}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="sandbox" disabled={!sandboxClientId}>
                {fr.appWorkspace.sandbox}
              </SelectItem>
              <SelectItem
                value="production"
                disabled={!productionClientId || !productionAvailable}
              >
                {productionLabel}
              </SelectItem>
            </SelectContent>
          </Select>
        </label>
        <DeleteApplicationDialog
          appName={app.name}
          clientId={app.clientId}
          hasBothEnvironments={Boolean(app.linkedClientId)}
          onDeleted={() => router.replace("/applications")}
          compact
        />
      </div>
      <nav className="flex overflow-x-auto px-2" aria-label="Application">
        {sections.map((item) => (
          <Link
            key={item}
            href={`/applications/${app.clientId}/${item}`}
            aria-current={item === section ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              item === section
                ? "border-idn-green text-idn-green"
                : "border-transparent text-idn-muted hover:text-idn-ink"
            }`}
          >
            {fr.appWorkspace.tabs[item]}
          </Link>
        ))}
      </nav>
    </div>
  )
}
