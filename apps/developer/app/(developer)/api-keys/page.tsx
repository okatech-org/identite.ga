"use client"

import { useState } from "react"
import { useConvex, useQuery } from "convex/react"
import { toast } from "sonner"
import {
  CheckIcon,
  Clock3Icon,
  KeyRoundIcon,
  ServerCogIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { fr } from "../../_content/fr"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

const SCOPES = [
  "citizens:resolve",
  "idn:delegate:lookup",
  "idn:delegate:create",
  "idn:delegate:status",
] as const

type ConvexErrorLike = { data?: { code?: string; message?: string } }
const extractError = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "data" in err)
    return (err as ConvexErrorLike).data?.message ?? fallback
  return fallback
}

export default function ApiKeysPage() {
  const convex = useConvex()
  const keys = useQuery(api.developer.apiKeys.listKeys, {}) ?? null
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([...SCOPES])
  const [expiresInDays, setExpiresInDays] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const toggleScope = (scope: string) =>
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const days = expiresInDays.trim()
        ? Number(expiresInDays.trim())
        : undefined
      const res = (await convex.mutation(api.developer.apiKeys.createKey, {
        name: trimmed,
        scopes: selectedScopes,
        expiresInDays: days,
      })) as { token: string; tokenPrefix: string; id: string }
      setCreatedToken(res.token)
      setName("")
      setExpiresInDays("")
      setShowForm(false)
    } catch (err) {
      toast.error(extractError(err, fr.apiKeys.errorGeneric))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!window.confirm(fr.apiKeys.revokeConfirm)) return
    try {
      await convex.mutation(api.developer.apiKeys.revokeKey, {
        keyId: keyId as never,
      })
      toast.success(fr.apiKeys.revokedToast)
    } catch (err) {
      toast.error(extractError(err, fr.apiKeys.errorGeneric))
    }
  }

  const activeCount = keys?.filter((key) => key.status === "active").length ?? 0
  const revokedCount =
    keys?.filter((key) => key.status === "revoked").length ?? 0
  const linkedCount =
    keys?.filter((key) => Boolean(key.appClientId)).length ?? 0

  return (
    <>
      <OpHeader
        sub={fr.apiKeys.sub}
        title={fr.apiKeys.title}
        right={
          !showForm ? (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setShowForm(true)}
            >
              {IdnIcons.plus} {fr.apiKeys.newKeyBtn}
            </Button>
          ) : undefined
        }
      />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit space-y-5">
          <section className="portal-panel overflow-hidden">
            <div className="grid lg:grid-cols-[1fr_auto]">
              <div className="p-6 lg:p-7">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-idn-green-soft text-idn-green dark:bg-idn-green/10 dark:text-idn-green-on-dark">
                    <ServerCogIcon className="size-5" />
                  </span>
                  <div>
                    <div className="portal-section-kicker">
                      Machine à machine
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-idn-ink">
                      Des accès serveurs explicites et révocables.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-idn-muted">
                      {fr.apiKeys.description}
                    </p>
                  </div>
                </div>
              </div>
              <dl className="grid min-w-[420px] grid-cols-3 border-t border-idn-border-soft bg-idn-surface-2/60 lg:border-l lg:border-t-0">
                {[
                  [String(activeCount), "Actives"],
                  [String(linkedCount), "Liées"],
                  [String(revokedCount), "Révoquées"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="flex flex-col justify-center border-r border-idn-border-soft px-5 py-5 last:border-r-0"
                  >
                    <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                      {label}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-idn-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {createdToken ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                {fr.apiKeys.created.title}
              </div>
              <p className="mt-1 text-xs text-idn-ink">
                {fr.apiKeys.created.warning}
              </p>
              <div className="mt-2 break-all rounded-md border border-idn-border bg-idn-surface-2 px-3 py-2 font-mono text-xs text-idn-ink select-all">
                {createdToken}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setCreatedToken(null)}
              >
                OK, j&apos;ai copié
              </Button>
            </div>
          ) : null}

          {showForm ? (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
              <form
                onSubmit={handleCreate}
                className="portal-form overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-idn-border-soft bg-idn-surface-2/55 px-6 py-4">
                  <div>
                    <div className="portal-section-kicker">
                      Nouvelle autorisation
                    </div>
                    <h2 className="mt-1 text-sm font-semibold text-idn-ink">
                      Créer une clé M2M
                    </h2>
                  </div>
                  <KeyRoundIcon className="size-5 text-idn-green" />
                </div>
                <div className="space-y-5 p-6">
                  <div>
                    <Label
                      htmlFor="key-name"
                      className="text-xs font-semibold text-idn-ink"
                    >
                      {fr.apiKeys.form.nameLabel}
                    </Label>
                    <Input
                      id="key-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={fr.apiKeys.form.namePlaceholder}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-idn-ink">
                      {fr.apiKeys.form.scopesLabel}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {SCOPES.map((scope) => (
                        <label
                          key={scope}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-3 transition-colors ${selectedScopes.includes(scope) ? "border-idn-green bg-idn-green-soft/60 dark:bg-idn-green/10" : "border-idn-border hover:bg-idn-surface-2"}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope)}
                            onChange={() => toggleScope(scope)}
                            className="accent-idn-green"
                          />
                          <span className="font-mono text-xs text-idn-ink">
                            {scope}
                          </span>
                          <span className="ml-auto max-w-36 text-right text-[10px] leading-4 text-idn-muted">
                            {
                              fr.apiKeys.scopeDescriptions[
                                scope as keyof typeof fr.apiKeys.scopeDescriptions
                              ]
                            }
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="key-expires"
                      className="text-xs font-semibold text-idn-ink"
                    >
                      {fr.apiKeys.form.expiresLabel}
                    </Label>
                    <Input
                      id="key-expires"
                      type="number"
                      min={1}
                      max={365}
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      placeholder={fr.apiKeys.form.expiresPlaceholder}
                      className="mt-1 max-w-[280px]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submitting || !name.trim()}>
                      {submitting
                        ? fr.apiKeys.form.submitting
                        : fr.apiKeys.form.submit}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      {fr.apiKeys.form.cancel}
                    </Button>
                  </div>
                </div>
              </form>
              <aside className="portal-panel h-fit overflow-hidden">
                <div className="flex items-center gap-2 border-b border-idn-border-soft bg-idn-surface-2/55 px-5 py-4 text-sm font-semibold text-idn-ink">
                  <ShieldCheckIcon className="size-4 text-idn-blue" /> Résumé de
                  sécurité
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-idn-surface-2 p-3">
                      <dt className="text-[10px] uppercase tracking-[0.06em] text-idn-muted">
                        Scopes
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-idn-ink">
                        {selectedScopes.length}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-idn-surface-2 p-3">
                      <dt className="text-[10px] uppercase tracking-[0.06em] text-idn-muted">
                        Expiration
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-idn-ink">
                        {expiresInDays ? `${expiresInDays} j` : "Aucune"}
                      </dd>
                    </div>
                  </dl>
                  <ul className="mt-5 space-y-3 text-xs text-idn-ink">
                    {[
                      "Jeton affiché une seule fois",
                      "Révocation immédiate",
                      "Journalisation des appels",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-idn-green-soft text-idn-green dark:bg-idn-green/10 dark:text-idn-green-on-dark">
                          <CheckIcon className="size-3" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex gap-2 rounded-lg border border-idn-border bg-idn-surface-2/50 p-3 text-xs leading-5 text-idn-muted">
                    <Clock3Icon className="mt-0.5 size-4 shrink-0" /> Une
                    expiration courte réduit l’exposition d’un secret compromis.
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          {keys === null ? (
            <div className="text-sm text-idn-muted">Chargement…</div>
          ) : keys.length === 0 && !showForm ? (
            <div className="portal-panel p-10 text-center">
              <h2 className="text-lg font-semibold text-idn-ink">
                {fr.apiKeys.empty.title}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-idn-muted">
                {fr.apiKeys.empty.body}
              </p>
              <Button
                size="sm"
                className="mt-5 gap-1"
                onClick={() => setShowForm(true)}
              >
                {IdnIcons.plus} {fr.apiKeys.newKeyBtn}
              </Button>
            </div>
          ) : keys.length > 0 ? (
            <section>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <div className="portal-section-kicker">Inventaire</div>
                  <h2 className="mt-1 text-sm font-semibold text-idn-ink">
                    Clés de l’organisation
                  </h2>
                </div>
                <span className="text-xs text-idn-muted">
                  {keys.length} clé{keys.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="portal-table overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-idn-border bg-idn-surface-2">
                      <th className="px-3 py-2.5 font-semibold text-idn-muted">
                        {fr.apiKeys.table.name}
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-idn-muted">
                        {fr.apiKeys.table.prefix}
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-idn-muted">
                        {fr.apiKeys.table.scopes}
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-idn-muted">
                        {fr.apiKeys.table.status}
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-idn-muted">
                        {fr.apiKeys.table.created}
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-idn-muted">
                        {fr.apiKeys.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-idn-border-soft">
                    {keys.map((k) => (
                      <tr key={k.id} className="bg-idn-surface">
                        <td className="px-3 py-2.5 font-medium text-idn-ink">
                          {k.name}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-idn-muted">
                          {k.tokenPrefix}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.map((s) => (
                              <span
                                key={s}
                                className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-idn-muted"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={k.status} />
                        </td>
                        <td className="px-3 py-2.5 text-idn-muted">
                          {formatDate(k.createdAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          {k.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => handleRevoke(k.id)}
                              className="rounded px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                            >
                              {fr.apiKeys.revokeBtn}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-idn-green-soft text-idn-green",
    expired:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    revoked: "bg-destructive/10 text-destructive",
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[status] ?? "bg-idn-surface-2 text-idn-muted"}`}
    >
      {fr.apiKeys.status[status as keyof typeof fr.apiKeys.status] ?? status}
    </span>
  )
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
