"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { ChevronLeftIcon } from "lucide-react"
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

import { profileEdit } from "../../_content/fr"

const TODAY_ISO = new Date().toISOString().slice(0, 10)

const schema = z.object({
  firstName: z.string().trim().min(1, profileEdit.validation.required),
  lastName: z.string().trim().min(1, profileEdit.validation.required),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, profileEdit.validation.dateInvalid)
    .refine((d) => d < TODAY_ISO, profileEdit.validation.dateFuture),
  gender: z.enum(["F", "M", "O", "N"]),
  birthPlace: z.string().trim().min(1, profileEdit.validation.required),
  nationality: z.string().trim().min(2, profileEdit.validation.required),
})

type FormValues = z.infer<typeof schema>

export default function ProfileEditPage() {
  const router = useRouter()
  const me = useQuery(api.profile.getCurrentUser)
  const updatePivot = useMutation(api.profile.updatePivot)

  const pivot = me?.profile?.pivot

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
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

  // Pré-remplit avec les data du pivot existant à la première arrivée
  React.useEffect(() => {
    if (pivot) {
      reset({
        firstName: pivot.firstName,
        lastName: pivot.lastName,
        dateOfBirth: pivot.dateOfBirth,
        gender: pivot.gender as FormValues["gender"],
        birthPlace: pivot.birthPlace,
        nationality: pivot.nationality,
      })
    }
  }, [pivot, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updatePivot(values)
      toast.success(profileEdit.successToast)
      router.push("/profile")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : profileEdit.errorToast)
    }
  })

  if (me === undefined) {
    return (
      <section className="mx-auto w-full max-w-[640px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }
  if (me === null) return null

  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-5 py-6 md:px-7 md:py-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 self-start text-muted-foreground"
      >
        <Link href="/profile">
          <ChevronLeftIcon aria-hidden="true" />
          {profileEdit.back}
        </Link>
      </Button>

      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[26px]">
        {profileEdit.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{profileEdit.sub}</p>

      <form id="profile-edit-form" onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pe-firstName">{profileEdit.fields.firstName.label}</Label>
            <Input
              id="pe-firstName"
              autoComplete="given-name"
              placeholder={profileEdit.fields.firstName.placeholder}
              required
              aria-invalid={Boolean(errors.firstName)}
              className="h-12 text-base"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p role="alert" className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-lastName">{profileEdit.fields.lastName.label}</Label>
            <Input
              id="pe-lastName"
              autoComplete="family-name"
              placeholder={profileEdit.fields.lastName.placeholder}
              required
              aria-invalid={Boolean(errors.lastName)}
              className="h-12 text-base"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p role="alert" className="text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pe-dob">{profileEdit.fields.dateOfBirth.label}</Label>
          <Input
            id="pe-dob"
            type="date"
            autoComplete="bday"
            max={TODAY_ISO}
            required
            aria-invalid={Boolean(errors.dateOfBirth)}
            className="h-12 text-base"
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p role="alert" className="text-xs text-destructive">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pe-gender">{profileEdit.fields.gender.label}</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="pe-gender" className="!h-12 w-full !text-base">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {profileEdit.fields.gender.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pe-nationality">{profileEdit.fields.nationality.label}</Label>
            <Controller
              control={control}
              name="nationality"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="pe-nationality" className="!h-12 w-full !text-base">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {profileEdit.fields.nationality.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pe-birthPlace">{profileEdit.fields.birthPlace.label}</Label>
          <Input
            id="pe-birthPlace"
            autoComplete="address-level2"
            placeholder={profileEdit.fields.birthPlace.placeholder}
            required
            aria-invalid={Boolean(errors.birthPlace)}
            className="h-12 text-base"
            {...register("birthPlace")}
          />
          {errors.birthPlace && (
            <p role="alert" className="text-xs text-destructive">
              {errors.birthPlace.message}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link href="/profile">{profileEdit.cancel}</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !isDirty}
            className="h-12"
          >
            {isSubmitting ? "…" : profileEdit.primary}
          </Button>
        </div>
      </form>
    </section>
  )
}
