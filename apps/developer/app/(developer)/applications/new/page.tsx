"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useConvex } from "convex/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"

import { fr } from "../../../_content/fr"
import { OpHeader } from "../../../_components/op-header"

const AVAILABLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "idn:civil_status",
  "idn:iboite.read",
  "idn:iboite.manage",
  "idn:iboite.send",
] as const
const LOA_OPTIONS = [1, 2, 3] as const

const schema = z.object({
  name: z.string().trim().min(2, "2 caractères minimum.").max(80),
  description: z.string().max(280).optional(),
  redirectUris: z
    .string()
    .trim()
    .min(1, "Au moins une URI requise.")
    .refine(
      (val) =>
        val
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .every((uri) => {
            try {
              new URL(uri)
              return true
            } catch {
              return false
            }
          }),
      "Une des URIs n'est pas valide.",
    ),
  loa: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  scopes: z.array(z.string()).min(1, "Au moins un scope requis."),
})

type FormValues = z.infer<typeof schema>

export default function NewApplicationPage() {
  const router = useRouter()
  const convex = useConvex()
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<null | {
    clientId: string
    clientSecret: string
  }>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      redirectUris: "",
      loa: 1,
      scopes: ["openid", "profile", "email"],
    },
    mode: "onTouched",
  })

  const selectedScopes = watch("scopes")
  const selectedLoa = watch("loa")

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const redirectUris = values.redirectUris
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean)
      const res = (await convex.mutation(api.developer.apps.create, {
        name: values.name,
        description: values.description ?? "",
        redirectUris,
        scopes: values.scopes,
        loa: values.loa,
      })) as { id: string; clientId: string; clientSecret: string }
      setCreated({ clientId: res.clientId, clientSecret: res.clientSecret })
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? ((err as { data?: { message?: string } }).data?.message ??
            fr.newApp.errorGeneric)
          : fr.newApp.errorGeneric
      toast.error(msg)
      setSubmitting(false)
    }
  })

  if (created) {
    return (
      <>
        <OpHeader sub={fr.appCreated.sub} title={fr.appCreated.title} />
        <div className="flex-1 overflow-auto px-7 py-6">
          <div className="mx-auto max-w-[720px] rounded-xl border border-idn-border bg-idn-surface p-6">
            <div className="rounded-md border border-idn-border bg-amber-50 p-3 text-sm text-idn-ink dark:bg-amber-950/30">
              {fr.appCreated.warning}
            </div>
            <dl className="mt-5 space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                  CLIENT_ID
                </dt>
                <dd className="mt-1 rounded-md border border-idn-border bg-idn-surface-2 px-3 py-2 font-mono text-xs text-idn-ink">
                  {created.clientId}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                  CLIENT_SECRET
                </dt>
                <dd className="mt-1 rounded-md border border-idn-border bg-idn-surface-2 px-3 py-2 font-mono text-xs text-idn-ink break-all">
                  {created.clientSecret}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() =>
                  router.push(`/applications/${created.clientId}/keys`)
                }
              >
                {fr.appCreated.continue}
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <OpHeader sub={fr.newApp.sub} title={fr.newApp.title} />
      <div className="flex-1 overflow-auto px-7 py-6">
        <form
          onSubmit={onSubmit}
          noValidate
          className="mx-auto max-w-[720px] space-y-5 rounded-xl border border-idn-border bg-idn-surface p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="app-name">{fr.newApp.nameLabel}</Label>
            <Input
              id="app-name"
              type="text"
              placeholder={fr.newApp.namePlaceholder}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "app-name-error" : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <p
                id="app-name-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-desc">{fr.newApp.descLabel}</Label>
            <Textarea
              id="app-desc"
              rows={2}
              placeholder={fr.newApp.descPlaceholder}
              {...register("description")}
            />
          </div>

          <div
            className="rounded-md border border-idn-border bg-idn-surface-2 px-3 py-2 text-xs text-idn-muted"
            role="note"
          >
            {fr.newApp.sandboxNote}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-redirect">{fr.newApp.redirectLabel}</Label>
            <Textarea
              id="app-redirect"
              rows={3}
              placeholder={fr.newApp.redirectPlaceholder}
              required
              aria-invalid={Boolean(errors.redirectUris)}
              aria-describedby={
                errors.redirectUris ? "app-redirect-error" : "app-redirect-hint"
              }
              className="font-mono text-xs"
              {...register("redirectUris")}
            />
            <p id="app-redirect-hint" className="text-xs text-idn-muted">
              {fr.newApp.redirectHint}
            </p>
            {errors.redirectUris ? (
              <p
                id="app-redirect-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.redirectUris.message}
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-idn-ink">
              {fr.newApp.scopesLabel}
            </legend>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SCOPES.map((scope) => {
                const checked = selectedScopes.includes(scope)
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() =>
                      setValue(
                        "scopes",
                        checked
                          ? selectedScopes.filter((s) => s !== scope)
                          : [...selectedScopes, scope],
                        { shouldValidate: true },
                      )
                    }
                    className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                      checked
                        ? "border-idn-green bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]"
                        : "border-idn-border bg-idn-surface text-idn-muted hover:bg-idn-surface-2"
                    }`}
                  >
                    {scope}
                  </button>
                )
              })}
            </div>
            {errors.scopes ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.scopes.message as string}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-idn-ink">
              {fr.newApp.loaLabel}
            </legend>
            <div className="flex gap-2">
              {LOA_OPTIONS.map((level) => {
                const checked = selectedLoa === level
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setValue("loa", level, { shouldValidate: true })
                    }
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      checked
                        ? "border-idn-green bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]"
                        : "border-idn-border bg-idn-surface text-idn-ink hover:bg-idn-surface-2"
                    }`}
                  >
                    Niveau {level}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/applications")}
              disabled={submitting}
            >
              {fr.newApp.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? fr.newApp.submitting : fr.newApp.submit}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
