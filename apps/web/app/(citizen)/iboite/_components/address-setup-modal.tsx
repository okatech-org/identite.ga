"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import {
  Loader2Icon,
  MapPinIcon,
  PencilIcon,
  RefreshCwIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { iboite } from "../_content/fr"
import {
  getCurrentPosition,
  reverseGeocode,
  type GeolocationCoordinates,
} from "../_lib/geocoding"

type Step = "choose" | "locating" | "form"

type FormState = {
  latitude: number | null
  longitude: number | null
  district: string
  city: string
  postalCode: string
  country: string
  addressLine: string
}

const INITIAL_FORM: FormState = {
  latitude: null,
  longitude: null,
  district: "",
  city: "",
  postalCode: "",
  country: "Gabon",
  addressLine: "",
}

export function AddressSetupModal({
  accountId,
  onClose,
}: {
  accountId: Id<"iboiteAccount">
  onClose: () => void
}) {
  const setAddress = useMutation(api.iboite.accounts.setAddress)
  const [step, setStep] = React.useState<Step>("choose")
  const [form, setForm] = React.useState<FormState>(INITIAL_FORM)
  const [submitting, setSubmitting] = React.useState(false)

  async function startGps() {
    setStep("locating")
    try {
      const pos: GeolocationCoordinates = await getCurrentPosition()
      let resolved: Awaited<ReturnType<typeof reverseGeocode>> | null = null
      try {
        resolved = await reverseGeocode(pos.latitude, pos.longitude)
      } catch {
        toast.warning(iboite.address.error.geocoder)
      }
      setForm({
        latitude: pos.latitude,
        longitude: pos.longitude,
        district: resolved?.district ?? "",
        city: resolved?.city ?? "",
        postalCode: resolved?.postalCode ?? "",
        country: resolved?.country ?? "Gabon",
        addressLine: resolved?.addressLine ?? "",
      })
      setStep("form")
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as GeolocationPositionError).code
          : null
      let message: string = iboite.address.error.unavailable
      if (code === 1) message = iboite.address.error.denied
      else if (code === 3) message = iboite.address.error.timeout
      toast.error(message)
      setStep("choose")
    }
  }

  function startManual() {
    setForm(INITIAL_FORM)
    setStep("form")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!form.city.trim() && form.latitude === null) {
      toast.error(iboite.address.error.cityRequired)
      return
    }
    setSubmitting(true)
    try {
      await setAddress({
        accountId,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        district: form.district.trim() || undefined,
        addressLine: form.addressLine.trim() || undefined,
        city: form.city.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        country: form.country.trim() || "Gabon",
      })
      toast.success(iboite.address.saved)
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : iboite.address.error.saveFailed,
      )
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{iboite.address.title}</DialogTitle>
          <DialogDescription>{iboite.address.intro}</DialogDescription>
        </DialogHeader>

        {step === "choose" ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={startGps}
              className="flex items-start gap-3 rounded-xl border border-idn-green bg-idn-green-soft p-4 text-left transition-colors hover:bg-idn-green-soft/80 dark:bg-[#0F2A18] dark:hover:bg-[#0F2A18]/80"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-idn-green text-white">
                <MapPinIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-idn-green dark:text-idn-green-on-dark">
                  {iboite.address.methodGps}
                </span>
                <span className="text-xs text-foreground/70">
                  {iboite.address.methodGpsHint}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={startManual}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/80">
                <PencilIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">
                  {iboite.address.methodManual}
                </span>
              </span>
            </button>
          </div>
        ) : null}

        {step === "locating" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2Icon
              className="h-8 w-8 animate-spin text-idn-green"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold">{iboite.address.locating}</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {iboite.address.locatingHint}
            </p>
          </div>
        ) : null}

        {step === "form" ? (
          <form onSubmit={submit} className="flex flex-col gap-3">
            {form.latitude !== null && form.longitude !== null ? (
              <div className="flex items-start gap-2 rounded-lg border border-idn-green/30 bg-idn-green-soft/40 p-3 dark:bg-[#0F2A18]/40">
                <MapPinIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-idn-green"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-idn-green dark:text-idn-green-on-dark">
                    {iboite.address.resolved}
                  </p>
                  <p className="text-[11px] text-foreground/70">
                    {iboite.address.resolvedHint}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-district">{iboite.address.district}</Label>
                <Input
                  id="addr-district"
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                  placeholder={iboite.address.districtPlaceholder}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-city">{iboite.address.city}</Label>
                <Input
                  id="addr-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder={iboite.address.cityPlaceholder}
                  required={form.latitude === null}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-postal">{iboite.address.postalCode}</Label>
                <Input
                  id="addr-postal"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  placeholder={iboite.address.postalCodePlaceholder}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-country">{iboite.address.country}</Label>
                <Input
                  id="addr-country"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-line">{iboite.address.addressLine}</Label>
              <Input
                id="addr-line"
                value={form.addressLine}
                onChange={(e) =>
                  setForm({ ...form, addressLine: e.target.value })
                }
                placeholder={iboite.address.addressLinePlaceholder}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={startGps}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-idn-green hover:underline dark:text-idn-green-on-dark"
              >
                <RefreshCwIcon className="h-3 w-3" aria-hidden="true" />
                {iboite.address.useGps}
              </button>
              <p className="text-[10px] text-muted-foreground">
                {iboite.address.osmAttribution}{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {iboite.address.osmAttributionLink}
                </a>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                {iboite.address.cancel}
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting
                  ? iboite.address.submitting
                  : iboite.address.confirm}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
