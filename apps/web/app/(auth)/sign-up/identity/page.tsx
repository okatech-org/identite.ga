"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { api } from "@repo/backend/convex/_generated/api"
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

import { identity, STEP_TOTAL } from "../../_content/fr"
import { WizardShell } from "../../_components/wizard-shell"

const TODAY_ISO = new Date().toISOString().slice(0, 10)

const schema = z.object({
  firstName: z.string().trim().min(1, identity.validation.required),
  lastName: z.string().trim().min(1, identity.validation.required),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, identity.validation.dateInvalid)
    .refine((d) => d < TODAY_ISO, identity.validation.dateFuture),
  gender: z.enum(["F", "M", "O", "N"]),
  birthPlace: z.string().trim().min(1, identity.validation.required),
  nationality: z.string().trim().min(2, identity.validation.required),
})

type FormValues = z.infer<typeof schema>

export default function IdentityPage() {
  const router = useRouter()
  const setIdentityPivot = useMutation(api.onboarding.setIdentityPivot)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: undefined,
      birthPlace: "",
      nationality: "",
    },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await setIdentityPivot(values)
      router.push("/sign-up/pin")
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
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="id-gender">{identity.fields.gender.label}</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="id-gender" className="w-full">
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
                  <SelectTrigger id="id-nationality" className="w-full">
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

        <div className="flex flex-col gap-2.5 pt-3 sm:flex-row">
          <Button asChild variant="ghost" size="lg">
            <Link href="/sign-up/verify">{identity.back}</Link>
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "…" : identity.primary}
          </Button>
        </div>
      </form>
    </WizardShell>
  )
}
