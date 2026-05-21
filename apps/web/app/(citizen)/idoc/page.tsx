"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import {
  Eye,
  EyeOff,
  FileText,
  Plus,
  Search,
  Sparkles,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { cn } from "@repo/ui/lib/utils"

import { AddDocumentSheet } from "./_components/add-document-sheet"
import { DocumentPreviewSheet } from "./_components/document-preview-sheet"
import { FolderCard } from "./_components/folder-card"
import { FolderView } from "./_components/folder-view"
import { FOLDERS, type VaultFolderId } from "./_content/folders"
import { idoc } from "./_content/fr"
import { useConfidentialMode, useOpenedFolders } from "./_hooks/use-confidential"

const VALID_FOLDER_IDS = new Set<VaultFolderId>(FOLDERS.map((f) => f.id))

function isVaultFolderId(value: string | null): value is VaultFolderId {
  return value !== null && VALID_FOLDER_IDS.has(value as VaultFolderId)
}

export default function IdocHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const summary = useQuery(api.idoc.summary, {})
  const { enabled: confidential, toggle: toggleConfidential } =
    useConfidentialMode()
  const { isOpened, markOpened } = useOpenedFolders()
  const [query, setQuery] = React.useState("")

  // Lecture des paramètres URL (cf. plan — pas de segments).
  const folderParam = searchParams.get("folder")
  const activeFolder: VaultFolderId | null = isVaultFolderId(folderParam)
    ? folderParam
    : null
  const addOpen = searchParams.get("add") === "1"
  const docParam = searchParams.get("doc")
  const activeDocId: Id<"documentItem"> | null = docParam
    ? (docParam as Id<"documentItem">)
    : null

  // Navigation centralisée via search params (préserve les autres params).
  const setParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) params.delete(k)
        else params.set(k, v)
      }
      const qs = params.toString()
      router.replace(qs ? `/idoc?${qs}` : "/idoc", { scroll: false })
    },
    [router, searchParams],
  )

  const handleOpenFolder = React.useCallback(
    (id: VaultFolderId) => {
      markOpened(id)
      setParams({ folder: id })
    },
    [markOpened, setParams],
  )

  const handleBackToHome = React.useCallback(() => {
    setParams({ folder: null })
  }, [setParams])

  const handleOpenAdd = React.useCallback(() => {
    setParams({ add: "1" })
  }, [setParams])

  const handleCloseAdd = React.useCallback(() => {
    setParams({ add: null })
  }, [setParams])

  const handleOpenDoc = React.useCallback(
    (itemId: Id<"documentItem">) => {
      setParams({ doc: itemId })
    },
    [setParams],
  )

  const handleCloseDoc = React.useCallback(() => {
    setParams({ doc: null })
  }, [setParams])

  // Combine la config statique (label, icône, gradient) avec les compteurs
  // serveur (count + hasExpiring).
  const folders = React.useMemo(() => {
    const summaryById = new Map<
      VaultFolderId,
      { count: number; hasExpiring: boolean }
    >()
    for (const s of summary ?? []) {
      summaryById.set(s.folderId, {
        count: s.count,
        hasExpiring: s.hasExpiring,
      })
    }
    return FOLDERS.map((f) => ({
      ...f,
      count: summaryById.get(f.id)?.count ?? 0,
      hasExpiring: summaryById.get(f.id)?.hasExpiring ?? false,
    }))
  }, [summary])

  const totalDocs = folders.reduce((sum, f) => sum + f.count, 0)
  const filledFolders = folders.filter((f) => f.count > 0).length

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return folders
    return folders.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    )
  }, [folders, query])

  const loading = summary === undefined

  // Vue dossier — la grille reste démontée mais le layout + vault sont
  // préservés (la page elle-même reste montée). Le sheet d'ajout est rendu
  // dans les deux branches pour que ses animations open/close jouent
  // peu importe la vue active.
  if (activeFolder) {
    return (
      <>
        <FolderView
          slug={activeFolder}
          confidential={confidential}
          onBack={handleBackToHome}
          onOpenAdd={handleOpenAdd}
          onOpenDoc={handleOpenDoc}
        />
        <AddDocumentSheet
          open={addOpen}
          initialFolder={activeFolder}
          onClose={handleCloseAdd}
        />
        <DocumentPreviewSheet
          open={!!activeDocId}
          itemId={activeDocId}
          onClose={handleCloseDoc}
        />
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex w-full flex-wrap items-center gap-3 px-5 py-4 md:px-4 md:py-5 lg:px-20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#a855f7] dark:bg-[#2A1542]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="text-lg font-bold tracking-tight md:text-xl">
              {idoc.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {idoc.home.subtitle(totalDocs, filledFolders)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleConfidential}
              aria-pressed={confidential}
              title={
                confidential
                  ? idoc.home.confidentialOn
                  : idoc.home.confidentialOff
              }
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                confidential
                  ? "border-idn-green/40 bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {confidential ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <Button type="button" size="sm" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" />
              {idoc.home.add}
            </Button>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        {/* Bandeau IA */}
        <div className="flex items-center gap-2 rounded-full border border-[#e9d5ff] bg-gradient-to-r from-purple-50 to-violet-50 px-3.5 py-2 text-xs dark:border-[#3a1f5a] dark:from-purple-950/30 dark:to-violet-950/30">
          <Sparkles className="h-3.5 w-3.5 text-[#a855f7]" />
          <span className="font-semibold text-[#a855f7]">
            {idoc.home.iaActive}
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            · {idoc.home.iaHint}
          </span>
        </div>

        {/* Recherche */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={idoc.home.searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Grille dossiers */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[164px] animate-pulse rounded-2xl bg-secondary"
                />
              ))
            : filtered.map((f) => (
                <FolderCard
                  key={f.id}
                  folder={f}
                  count={f.count}
                  hasExpiring={f.hasExpiring}
                  opened={isOpened(f.id)}
                  onSelect={() => handleOpenFolder(f.id)}
                />
              ))}
        </div>

        {!loading && filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Aucun dossier ne correspond à « {query} ».
          </p>
        ) : null}
      </section>

      <AddDocumentSheet
        open={addOpen}
        initialFolder={null}
        onClose={handleCloseAdd}
      />
      <DocumentPreviewSheet
        open={!!activeDocId}
        itemId={activeDocId}
        onClose={handleCloseDoc}
      />
    </>
  )
}
