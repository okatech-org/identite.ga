"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction, useMutation, useQuery } from "convex/react"
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
import { OtpInput } from "@/app/(auth)/_components/otp-input"

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
  const requestPhoneChange = useAction(api.phoneChange.requestChange)
  const verifyPhoneChange = useAction(api.phoneChange.verifyChange)

  const pivot = me?.profile?.pivot
  const [phone, setPhone] = React.useState("")
  const [phoneInitialized, setPhoneInitialized] = React.useState(false)
  const [phoneRequestId, setPhoneRequestId] = React.useState<string | null>(
    null,
  )
  const [maskedPhone, setMaskedPhone] = React.useState("")
  const [phoneCode, setPhoneCode] = React.useState("")
  const [phonePending, setPhonePending] = React.useState(false)
  const [phoneError, setPhoneError] = React.useState<string | null>(null)

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

  React.useEffect(() => {
    if (phoneInitialized || !me?.profile) return
    setPhone(pivot?.phone ?? "")
    setPhoneInitialized(true)
  }, [me?.profile, phoneInitialized, pivot?.phone])

  async function sendPhoneCode(event: React.FormEvent) {
    event.preventDefault()
    if (!phone.trim()) return
    setPhonePending(true)
    setPhoneError(null)
    try {
      const result = await requestPhoneChange({ phone })
      setPhoneRequestId(result.requestId)
      setMaskedPhone(result.maskedPhone)
      setPhoneCode("")
    } catch (err) {
      setPhoneError(
        err instanceof Error ? err.message : profileEdit.fields.phone.error,
      )
    } finally {
      setPhonePending(false)
    }
  }

  async function confirmPhoneCode() {
    if (!phoneRequestId || phoneCode.length !== 6) return
    setPhonePending(true)
    setPhoneError(null)
    try {
      const result = await verifyPhoneChange({
        requestId: phoneRequestId,
        code: phoneCode,
      })
      if (!result.verified || !result.phone) {
        setPhoneError(profileEdit.fields.phone.invalidCode)
        return
      }
      setPhone(result.phone)
      setPhoneRequestId(null)
      setPhoneCode("")
      toast.success(profileEdit.fields.phone.success)
    } catch (err) {
      setPhoneError(
        err instanceof Error ? err.message : profileEdit.fields.phone.error,
      )
    } finally {
      setPhonePending(false)
    }
  }

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

      <form
        id="profile-edit-form"
        onSubmit={onSubmit}
        noValidate
        className="mt-6 flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pe-firstName">
              {profileEdit.fields.firstName.label}
            </Label>
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
            <Label htmlFor="pe-lastName">
              {profileEdit.fields.lastName.label}
            </Label>
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
                  <SelectTrigger
                    id="pe-gender"
                    className="!h-12 w-full !text-base"
                  >
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
            <Label htmlFor="pe-nationality">
              {profileEdit.fields.nationality.label}
            </Label>
            <Controller
              control={control}
              name="nationality"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="pe-nationality"
                    className="!h-12 w-full !text-base"
                  >
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
          <Label htmlFor="pe-birthPlace">
            {profileEdit.fields.birthPlace.label}
          </Label>
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

      <div className="my-7 border-t border-border" />

      <section aria-labelledby="phone-change-title">
        <h2 id="phone-change-title" className="text-lg font-semibold">
          {profileEdit.fields.phone.label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {pivot?.phone
            ? me.profile?.phoneVerifiedAt
              ? profileEdit.fields.phone.verified
              : profileEdit.fields.phone.unverified
            : profileEdit.fields.phone.empty}
        </p>

        {!phoneRequestId ? (
          <form onSubmit={sendPhoneCode} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pe-phone">{profileEdit.fields.phone.label}</Label>
              <Input
                id="pe-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setPhoneError(null)
                }}
                placeholder="+241 06 12 34 56"
                disabled={phonePending}
                className="h-12 text-base"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {profileEdit.fields.phone.hint}
              </p>
            </div>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={phonePending || !phone.trim()}
              className="h-12 w-full sm:w-auto"
            >
              {phonePending
                ? profileEdit.fields.phone.sending
                : profileEdit.fields.phone.send}
            </Button>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {profileEdit.fields.phone.codeSub(maskedPhone)}
            </p>
            <OtpInput
              value={phoneCode}
              onChange={(value) => {
                setPhoneCode(value)
                setPhoneError(null)
              }}
              length={6}
              autoFocus
              disabled={phonePending}
              hasError={Boolean(phoneError)}
              ariaLabel={profileEdit.fields.phone.codeLabel}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="lg"
                disabled={phonePending || phoneCode.length !== 6}
                onClick={() => void confirmPhoneCode()}
                className="h-12"
              >
                {phonePending
                  ? profileEdit.fields.phone.verifying
                  : profileEdit.fields.phone.verify}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={phonePending}
                onClick={() => {
                  setPhoneRequestId(null)
                  setPhoneCode("")
                  setPhoneError(null)
                }}
                className="h-12"
              >
                {profileEdit.fields.phone.restart}
              </Button>
            </div>
          </div>
        )}

        {phoneError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {phoneError}
          </p>
        ) : null}
      </section>
    </section>
  )
}
