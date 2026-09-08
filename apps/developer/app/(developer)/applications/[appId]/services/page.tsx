"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useConvex, useQuery } from "convex/react"
import {
  ExternalLinkIcon,
  LayoutTemplateIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"

import { fr } from "../../../../_content/fr"

type Category =
  | "administrative"
  | "civilStatus"
  | "fiscal"
  | "education"
  | "health"
  | "transport"
  | "social"
  | "other"

const CATEGORIES: Category[] = [
  "administrative",
  "civilStatus",
  "fiscal",
  "education",
  "health",
  "transport",
  "social",
  "other",
]

type Service = {
  id: string
  label: string
  description: string
  category: Category
  link: string
}

function emptyService(): Service {
  return {
    id: "",
    label: "",
    description: "",
    category: "administrative",
    link: "https://",
  }
}

export default function AppServicesPage() {
  const params = useParams<{ appId: string }>()
  const clientId = String(params?.appId ?? "")
  const convex = useConvex()
  const app = useQuery(api.developer.apps.get, { clientId })
  const [services, setServices] = useState<Service[] | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setServices(null)
  }, [clientId])

  useEffect(() => {
    if (app && services === null) {
      setServices(app.services.map((s) => ({ ...s })))
    }
  }, [app, services])

  const update = (idx: number, patch: Partial<Service>) => {
    setServices((prev) =>
      prev ? prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)) : prev,
    )
  }
  const remove = (idx: number) => {
    setServices((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev))
  }
  const add = () => {
    setServices((prev) => (prev ? [...prev, emptyService()] : [emptyService()]))
  }

  const save = async () => {
    if (!services) return
    setSaving(true)
    try {
      await convex.mutation(api.developer.apps.setServices, {
        clientId,
        services,
      })
      toast.success(fr.services.savedToast)
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? ((err as { data?: { message?: string } }).data?.message ??
            fr.services.errorGeneric)
          : fr.services.errorGeneric
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (app === undefined) {
    return (
      <div className="portal-panel p-6 text-sm text-idn-muted">
        Chargement des services…
      </div>
    )
  }
  if (app === null) {
    return (
      <div className="portal-panel p-6 text-sm text-idn-muted">
        Application introuvable.
      </div>
    )
  }

  const list = services ?? []

  return (
    <>
      <section className="portal-panel overflow-hidden">
        <div className="grid md:grid-cols-[1fr_auto]">
          <div className="p-6 lg:p-7">
            <div className="portal-section-kicker">Catalogue citoyen</div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-idn-ink">
              Rendez vos démarches faciles à trouver.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-idn-muted">
              {fr.services.description}
            </p>
          </div>
          <dl className="grid min-w-[300px] grid-cols-2 border-t border-idn-border-soft bg-idn-surface-2/60 md:border-l md:border-t-0">
            <div className="flex flex-col justify-center border-r border-idn-border-soft px-6 py-5">
              <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                Publiés
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-idn-ink">
                {list.length}
              </dd>
            </div>
            <div className="flex flex-col justify-center px-6 py-5">
              <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                Environnement
              </dt>
              <dd className="mt-1 text-sm font-semibold capitalize text-idn-ink">
                {app.env}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-4">
          {list.length === 0 ? (
            <div className="portal-panel border-dashed p-10 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-idn-green-soft text-idn-green dark:bg-idn-green/10 dark:text-idn-green-on-dark">
                <LayoutTemplateIcon className="size-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-idn-ink">
                {fr.services.emptyTitle}
              </p>
              <p className="mt-1.5 text-xs text-idn-muted">
                {fr.services.emptyDesc}
              </p>
              <Button onClick={add} className="mt-5">
                <PlusIcon className="size-4" /> {fr.services.addService}
              </Button>
            </div>
          ) : null}

          {list.map((service, idx) => (
            <section key={idx} className="portal-form overflow-hidden">
              <div className="flex items-center justify-between border-b border-idn-border-soft bg-idn-surface-2/55 px-6 py-4">
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-idn-green">
                    Service #{idx + 1}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold text-idn-ink">
                    {service.label || "Nouvelle démarche"}
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(idx)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <TrashIcon className="size-3" aria-hidden />
                  {fr.services.remove}
                </Button>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{fr.services.serviceId}</Label>
                    <Input
                      value={service.id}
                      onChange={(e) =>
                        update(idx, { id: e.target.value.toLowerCase() })
                      }
                      placeholder="decl-fiscale-2025"
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-idn-muted">
                      {fr.services.serviceIdHint}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{fr.services.category}</Label>
                    <select
                      value={service.category}
                      onChange={(e) =>
                        update(idx, {
                          category: e.target.value as Category,
                        })
                      }
                      className="h-10 w-full rounded-md border border-idn-border bg-idn-surface px-3 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {fr.services.categories[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{fr.services.label}</Label>
                  <Input
                    value={service.label}
                    onChange={(e) => update(idx, { label: e.target.value })}
                    placeholder={fr.services.labelPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{fr.services.descriptionLabel}</Label>
                  <Textarea
                    value={service.description}
                    onChange={(e) =>
                      update(idx, { description: e.target.value })
                    }
                    placeholder={fr.services.descriptionPlaceholder}
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{fr.services.link}</Label>
                  <Input
                    type="url"
                    value={service.link}
                    onChange={(e) => update(idx, { link: e.target.value })}
                    placeholder="https://impots.ga/decl"
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-idn-muted">
                    {fr.services.linkHint}
                  </p>
                </div>
              </div>
            </section>
          ))}

          {list.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={add}
              className="w-full"
            >
              <PlusIcon className="size-4" /> {fr.services.addService}
            </Button>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={save} disabled={saving || services === null}>
              <SaveIcon className="size-4" />
              {saving ? fr.services.saving : fr.services.save}
            </Button>
          </div>
        </div>

        <aside className="portal-panel overflow-hidden xl:sticky xl:top-6">
          <div className="flex items-center justify-between border-b border-idn-border-soft bg-idn-surface-2/60 px-5 py-4">
            <div>
              <div className="portal-section-kicker">Aperçu citoyen</div>
              <h2 className="mt-1 text-sm font-semibold text-idn-ink">
                Informations affichées
              </h2>
            </div>
            <LayoutTemplateIcon className="size-5 text-idn-blue" />
          </div>
          <div className="space-y-3 p-5">
            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed border-idn-border bg-idn-surface-2/40 p-6 text-center text-xs leading-5 text-idn-muted">
                Ajoutez une démarche pour voir son aperçu ici.
              </div>
            ) : (
              list.map((service, idx) => (
                <article
                  key={idx}
                  className="rounded-xl border border-idn-border bg-idn-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-idn-green-soft px-2 py-1 text-[10px] font-semibold text-idn-green dark:bg-idn-green/10 dark:text-idn-green-on-dark">
                      {fr.services.categories[service.category]}
                    </span>
                    <ExternalLinkIcon className="size-3.5 text-idn-muted" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-idn-ink">
                    {service.label || "Nom de la démarche"}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-idn-muted">
                    {service.description ||
                      "La description courte sera présentée au citoyen dans son catalogue de services."}
                  </p>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
