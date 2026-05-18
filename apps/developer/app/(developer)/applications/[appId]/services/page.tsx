"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useConvex, useQuery } from "convex/react"
import { TrashIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"

import { fr } from "../../../../_content/fr"
import { OpHeader } from "../../../../_components/op-header"

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
      <>
        <OpHeader sub={fr.services.sub} title={fr.services.title} />
        <div className="flex-1 overflow-auto px-7 py-6 text-sm text-idn-muted">
          Chargement…
        </div>
      </>
    )
  }
  if (app === null) {
    return (
      <>
        <OpHeader sub={fr.services.sub} title={fr.services.title} />
        <div className="flex-1 overflow-auto px-7 py-6 text-sm text-idn-muted">
          Application introuvable.
        </div>
      </>
    )
  }

  const list = services ?? []

  return (
    <>
      <OpHeader sub={fr.services.sub} title={fr.services.title} />
      <div className="flex-1 overflow-auto px-7 py-6">
        <div className="mx-auto max-w-[800px] space-y-5">
          <p className="text-sm text-idn-muted">{fr.services.description}</p>

          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-idn-border bg-idn-surface p-10 text-center">
              <p className="text-sm font-semibold text-idn-ink">
                {fr.services.emptyTitle}
              </p>
              <p className="mt-1.5 text-xs text-idn-muted">
                {fr.services.emptyDesc}
              </p>
              <Button onClick={add} className="mt-5">
                {fr.services.addService}
              </Button>
            </div>
          ) : null}

          {list.map((service, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-xl border border-idn-border bg-idn-surface p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
                  Service #{idx + 1}
                </span>
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
                      update(idx, { category: e.target.value as Category })
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
          ))}

          {list.length > 0 ? (
            <Button type="button" variant="outline" onClick={add} className="w-full">
              {fr.services.addService}
            </Button>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button onClick={save} disabled={saving || services === null}>
              {saving ? fr.services.saving : fr.services.save}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
