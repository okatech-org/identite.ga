"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useConvex } from "convex/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckBigIcon,
  Code2Icon,
  DatabaseIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react"

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
  const applicationName = watch("name")
  const redirectUris = watch("redirectUris")

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
        <div className="portal-canvas flex-1 overflow-auto">
          <div className="portal-limit grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_360px]">
            <section className="portal-panel overflow-hidden">
              <div className="border-b border-idn-border-soft bg-idn-green-soft/65 p-7 dark:bg-idn-green/10">
                <div className="flex size-12 items-center justify-center rounded-full bg-idn-green text-white shadow-lg shadow-idn-green/20">
                  <CircleCheckBigIcon className="size-6" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-idn-ink">
                  Votre sandbox est prête.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-idn-muted">
                  Conservez ces identifiants maintenant, puis ouvrez l’atelier
                  pour brancher votre premier parcours OAuth.
                </p>
              </div>
              <div className="p-7">
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-idn-ink dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="flex gap-3">
                    <KeyRoundIcon className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
                    <span>{fr.appCreated.warning}</span>
                  </div>
                </div>
                <dl className="mt-6 space-y-4">
                  <div>
                    <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                      Client ID
                    </dt>
                    <dd className="mt-2 rounded-lg border border-idn-border bg-idn-surface-2 px-4 py-3 font-mono text-xs text-idn-ink">
                      {created.clientId}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                      Client secret · affiché une seule fois
                    </dt>
                    <dd className="mt-2 break-all rounded-lg border border-idn-green/25 bg-idn-green-soft px-4 py-3 font-mono text-xs text-idn-green dark:bg-idn-green/10 dark:text-idn-green-on-dark">
                      {created.clientSecret}
                    </dd>
                  </div>
                </dl>
                <div className="mt-7 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" type="button">
                    <Code2Icon className="size-4" /> Lire le guide OAuth
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(`/applications/${created.clientId}/keys`)
                    }
                  >
                    {fr.appCreated.continue}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </section>

            <aside className="portal-panel h-fit p-6">
              <div className="portal-section-kicker">Prochaines étapes</div>
              <h2 className="mt-2 text-lg font-semibold text-idn-ink">
                Votre première connexion
              </h2>
              <ol className="mt-6 space-y-5">
                {[
                  [
                    "1",
                    "Ajouter les testeurs",
                    "Autorisez les comptes de votre équipe.",
                  ],
                  [
                    "2",
                    "Brancher le callback",
                    "Utilisez le client ID et le secret.",
                  ],
                  [
                    "3",
                    "Vérifier le consentement",
                    "Contrôlez les scopes présentés.",
                  ],
                ].map(([number, title, detail], index) => (
                  <li key={number} className="flex gap-3">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? "bg-idn-green text-white" : "bg-idn-surface-2 text-idn-muted"}`}
                    >
                      {number}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-idn-ink">
                        {title}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-idn-muted">
                        {detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <OpHeader sub={fr.newApp.sub} title={fr.newApp.title} />
      <div className="portal-canvas flex-1 overflow-auto">
        <form onSubmit={onSubmit} noValidate className="portal-limit">
          <div className="mb-6 flex items-center gap-3 overflow-x-auto rounded-xl border border-idn-border bg-idn-surface px-5 py-3">
            {[
              ["1", "Identité", true],
              ["2", "Accès demandés", true],
              ["3", "Secret", false],
            ].map(([number, label, active], index) => (
              <div key={String(number)} className="contents">
                {index > 0 ? (
                  <span className="h-px min-w-8 flex-1 bg-idn-border" />
                ) : null}
                <div
                  className={`flex shrink-0 items-center gap-2 text-xs font-semibold ${active ? "text-idn-ink" : "text-idn-muted"}`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full ${active ? "bg-idn-green text-white" : "bg-idn-surface-2"}`}
                  >
                    {number}
                  </span>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-6">
              <section className="portal-form p-6 lg:p-7">
                <div className="flex items-start gap-4 border-b border-idn-border-soft pb-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-idn-green-soft text-sm font-semibold text-idn-green dark:bg-idn-green/10 dark:text-idn-green-on-dark">
                    1
                  </span>
                  <div>
                    <h2 className="font-semibold text-idn-ink">
                      Identité de l’application
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-idn-muted">
                      Ces informations seront visibles par les citoyens pendant
                      le consentement.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="app-name">{fr.newApp.nameLabel}</Label>
                    <Input
                      id="app-name"
                      type="text"
                      placeholder={fr.newApp.namePlaceholder}
                      required
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? "app-name-error" : undefined
                      }
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

                  <div className="space-y-1.5">
                    <Label htmlFor="app-redirect">
                      {fr.newApp.redirectLabel}
                    </Label>
                    <Textarea
                      id="app-redirect"
                      rows={3}
                      placeholder={fr.newApp.redirectPlaceholder}
                      required
                      aria-invalid={Boolean(errors.redirectUris)}
                      aria-describedby={
                        errors.redirectUris
                          ? "app-redirect-error"
                          : "app-redirect-hint"
                      }
                      className="font-mono text-xs"
                      {...register("redirectUris")}
                    />
                    <p
                      id="app-redirect-hint"
                      className="text-xs text-idn-muted"
                    >
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
                </div>
              </section>

              <section className="portal-form p-6 lg:p-7">
                <div className="flex items-start gap-4 border-b border-idn-border-soft pb-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-idn-blue-soft text-sm font-semibold text-idn-blue dark:bg-idn-blue/10 dark:text-idn-blue-on-dark">
                    2
                  </span>
                  <div>
                    <h2 className="font-semibold text-idn-ink">
                      Accès et niveau requis
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-idn-muted">
                      Demandez uniquement les données nécessaires au service
                      rendu.
                    </p>
                  </div>
                </div>

                <fieldset className="mt-6 space-y-2">
                  <legend className="text-sm font-medium text-idn-ink">
                    {fr.newApp.scopesLabel}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
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
                          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left font-mono text-xs transition-colors ${
                            checked
                              ? "border-idn-green bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]"
                              : "border-idn-border bg-idn-surface text-idn-muted hover:bg-idn-surface-2"
                          }`}
                        >
                          <span>{scope}</span>
                          {checked ? <CheckIcon className="size-3.5" /> : null}
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

                <fieldset className="mt-6 space-y-2 border-t border-idn-border-soft pt-5">
                  <legend className="text-sm font-medium text-idn-ink">
                    {fr.newApp.loaLabel}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {LOA_OPTIONS.map((level) => {
                      const checked = selectedLoa === level
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setValue("loa", level, { shouldValidate: true })
                          }
                          className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                            checked
                              ? "border-idn-green bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]"
                              : "border-idn-border bg-idn-surface text-idn-ink hover:bg-idn-surface-2"
                          }`}
                        >
                          <span className="block font-semibold">
                            Niveau {level}
                          </span>
                          <span className="mt-1 block text-[10px] opacity-70">
                            {level === 1
                              ? "Déclaré"
                              : level === 2
                                ? "Vérifié"
                                : "Présentiel"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </section>

              <div className="flex items-center justify-end gap-2 pt-1">
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
                  {!submitting ? <ArrowRightIcon className="size-4" /> : null}
                </Button>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <section className="portal-panel overflow-hidden">
                <div className="border-b border-idn-border-soft bg-idn-surface-2/70 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-idn-ink">
                    <DatabaseIcon className="size-4 text-idn-green" /> Créée en
                    sandbox
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs leading-5 text-idn-muted">
                    {fr.newApp.sandboxNote}
                  </p>
                  <ul className="mt-5 space-y-3 text-xs text-idn-ink">
                    {[
                      "Aucun citoyen réel exposé",
                      "Secret propre à cet environnement",
                      "Callbacks locaux autorisés",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckIcon className="size-3.5 text-idn-green" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="portal-panel p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-idn-ink">
                  <ShieldCheckIcon className="size-4 text-idn-blue" />{" "}
                  Récapitulatif
                </div>
                <dl className="mt-5 space-y-4">
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                      Application
                    </dt>
                    <dd className="mt-1 truncate text-sm font-medium text-idn-ink">
                      {applicationName.trim() || "Sans nom"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                        Scopes
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-idn-ink">
                        {selectedScopes.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                        Garantie
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-idn-ink">
                        LoA {selectedLoa}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.07em] text-idn-muted">
                      Callbacks
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-idn-ink">
                      {
                        redirectUris.split(/\n/).filter((value) => value.trim())
                          .length
                      }
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </>
  )
}
