"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { FileTextIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"

import { formatLongDate, settings } from "../../_content/fr"
import { SettingsSection } from "../settings-section"

export function DocumentsTab() {
  const data = useQuery(api.documents.listMine)
  const isLoading = data === undefined
  const list = data ?? []

  return (
    <SettingsSection title={settings.documents.title} sub={settings.documents.sub}>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded bg-secondary" />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{settings.documents.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((doc) => (
            <li
              key={doc._id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <FileTextIcon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {settings.documents.types[doc.type] ?? doc.type}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ajouté le {formatLongDate(doc.createdAt)}
                  {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  )
}
