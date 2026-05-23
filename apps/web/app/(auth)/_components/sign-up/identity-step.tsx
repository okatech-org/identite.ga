"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

import { identity, onboardingHeader, STEP_TOTAL } from "../../_content/fr"
import { WizardShell } from "../wizard-shell"
import {
  getOnboardingPivot,
  getOnboardingProfile,
  setOnboardingPivot,
} from "../../_hooks/use-onboarding-state"

const TODAY_ISO = new Date().toISOString().slice(0, 10)

const schema = z.object({
  firstName: z.string().trim().min(1, identity.validation.required),
  lastName: z.string().trim().min(1, identity.validation.required),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, identity.validation.dateInvalid)
    .refine((d) => d < TODAY_ISO, identity.validation.dateFuture),
  gender: z.enum(["F", "M"]),
  birthPlace: z.string().trim().min(1, identity.validation.required),
  nationality: z.string().trim().min(2, identity.validation.required),
  phone: z.string().trim().optional(),
  nip: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^\d{14}$/.test(v),
      identity.validation.nipInvalid,
    ),
})

type FormValues = z.infer<typeof schema>

export function IdentityStep() {
  const router = useRouter()
  const profile = React.useMemo(() => getOnboardingProfile(), [])

  React.useEffect(() => {
    if (!profile) {
      router.replace("/sign-up?step=profile")
    }
  }, [profile, router])

  const saved = React.useMemo(() => getOnboardingPivot(), [])
  // Pré-remplit la nationalité gabonaise pour les citoyens — modifiable.
  const defaultNationality =
    saved?.nationality ?? (profile === "citizen" ? "GA" : "")
  const savedGender = saved?.gender === "F" || saved?.gender === "M" ? saved.gender : undefined

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: saved?.firstName ?? "",
      lastName: saved?.lastName ?? "",
      dateOfBirth: saved?.dateOfBirth ?? "",
      gender: savedGender,
      birthPlace: saved?.birthPlace ?? "",
      nationality: defaultNationality,
      phone: saved?.phone ?? "",
      nip: saved?.nip ?? "",
    },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit((values) => {
    try {
      setOnboardingPivot({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        birthPlace: values.birthPlace.trim(),
        nationality: values.nationality.trim(),
        phone: values.phone?.trim() || undefined,
        nip: values.nip?.trim() || undefined,
      })
      router.push("/sign-up?step=idn")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
  })

  return (
    <WizardShell
      step={identity.step}
      total={STEP_TOTAL}
      title={identity.title}
      sub={identity.sub}
      backHref="/sign-up?step=profile"
      backLabel={onboardingHeader.backToProfile}
      footer={
        <Button
          type="submit"
          form="identity-form"
          size="lg"
          disabled={isSubmitting}
          className="h-14 w-full text-base"
        >
          {isSubmitting ? "…" : identity.primary}
        </Button>
      }
    >
      <form id="identity-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="id-firstName">{identity.fields.firstName.label}</Label>
            <Input
              id="id-firstName"
              autoComplete="given-name"
              placeholder={identity.fields.firstName.placeholder}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName ? "id-firstName-error" : undefined
              }
              className="h-12 text-base"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p
                id="id-firstName-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="id-lastName">{identity.fields.lastName.label}</Label>
            <Input
              id="id-lastName"
              autoComplete="family-name"
              placeholder={identity.fields.lastName.placeholder}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={
                errors.lastName ? "id-lastName-error" : undefined
              }
              className="h-12 text-base"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p
                id="id-lastName-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="id-dob">{identity.fields.dateOfBirth.label}</Label>
          <Input
            id="id-dob"
            type="date"
            autoComplete="bday"
            max={TODAY_ISO}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.dateOfBirth)}
            aria-describedby={errors.dateOfBirth ? "id-dob-error" : undefined}
            className="h-12 text-base"
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p
              id="id-dob-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="id-gender">{identity.fields.gender.label}</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="id-gender" className="!h-12 w-full !text-base">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {identity.fields.gender.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p
                id="id-gender-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.gender.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="id-nationality">
              {identity.fields.nationality.label}
            </Label>
            <Controller
              control={control}
              name="nationality"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="id-nationality" className="!h-12 w-full !text-base">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {identity.fields.nationality.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.nationality && (
              <p
                id="id-nationality-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.nationality.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="id-birthPlace">{identity.fields.birthPlace.label}</Label>
          <Input
            id="id-birthPlace"
            autoComplete="address-level2"
            placeholder={identity.fields.birthPlace.placeholder}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.birthPlace)}
            aria-describedby={
              errors.birthPlace ? "id-birthPlace-error" : undefined
            }
            className="h-12 text-base"
            {...register("birthPlace")}
          />
          {errors.birthPlace && (
            <p
              id="id-birthPlace-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.birthPlace.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="id-phone">{identity.fields.phone.label}</Label>
          <Input
            id="id-phone"
            type="tel"
            autoComplete="tel"
            placeholder={identity.fields.phone.placeholder}
            className="h-12 text-base"
            {...register("phone")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="id-nip">{identity.fields.nip.label}</Label>
          <Input
            id="id-nip"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder={identity.fields.nip.placeholder}
            aria-invalid={Boolean(errors.nip)}
            aria-describedby={errors.nip ? "id-nip-error" : "id-nip-help"}
            className="h-12 text-base"
            {...register("nip")}
          />
          {errors.nip ? (
            <p
              id="id-nip-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.nip.message}
            </p>
          ) : (
            <p id="id-nip-help" className="text-xs text-muted-foreground">
              {identity.fields.nip.help}
            </p>
          )}
        </div>
      </form>
    </WizardShell>
  )
}
