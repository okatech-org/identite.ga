"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"

export function ProviderActivateButton({
  channel,
  providerId,
}: {
  channel: "email" | "sms"
  providerId: string
}) {
  const router = useRouter()
  const setActive = useMutation(api.admin.providers.setActive)
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    setBusy(true)
    try {
      await setActive({ channel, providerId })
      toast.success("Provider activé.")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation impossible.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-50"
    >
      {busy ? "…" : "Activer"}
    </button>
  )
}
