"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import {
  claim,
  CLAIM_STEP_TOTAL,
  onboardingHeader,
} from "../_content/fr"
import { WizardShell } from "../_components/wizard-shell"

const CONVEX_SITE =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? ""

type ClaimResult = {
  found: boolean
  delegatedIdentityId?: string
  idnId?: string
  firstName?: string
  lastName?: string
  loa?: number
  /**
   * Code saisi par le citoyen, conservé en mémoire pour l'étape finale —
   * `/api/claim/complete` le revérifie. Il n'est PAS renvoyé par le serveur :
   * le `delegatedIdentityId` seul n'autorise rien.
   */
  claimCode?: string
}

const STEPS = ["search", "confirm", "setup"] as const
type Step = (typeof STEPS)[number]

function isStep(v: string | null): v is Step {
  return v !== null && (STEPS as readonly string[]).includes(v)
}

export default function ClaimPage() {
  return (
    <React.Suspense fallback={null}>
      <ClaimDispatcher />
    </React.Suspense>
  )
}

function ClaimDispatcher() {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get("step")

  const [result, setResult] = React.useState<ClaimResult | null>(null)

  React.useEffect(() => {
    if (!isStep(raw)) {
      router.replace("/claim?step=search")
    }
  }, [raw, router])

  if (!isStep(raw)) return null

  switch (raw) {
    case "search":
      return (
        <SearchStep
          onFound={(r) => {
            setResult(r)
            router.push("/claim?step=confirm")
          }}
        />
      )
    case "confirm":
      return result ? (
        <ConfirmStep
          result={result}
          onConfirm={() => router.push("/claim?step=setup")}
        />
      ) : (
        <SearchStep
          onFound={(r) => {
            setResult(r)
            router.push("/claim?step=confirm")
          }}
        />
      )
    case "setup":
      return result ? (
        <SetupStep result={result} />
      ) : (
        <SearchStep
          onFound={(r) => {
            setResult(r)
            router.push("/claim?step=confirm")
          }}
        />
      )
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Recherche
// ---------------------------------------------------------------------------

function SearchStep({
  onFound,
}: {
  onFound: (r: ClaimResult) => void
}) {
  const t = claim.search
  const [mode, setMode] = React.useState<"nip" | "name">("nip")
  const [claimCode, setClaimCode] = React.useState("")
  const [nip, setNip] = React.useState("")
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [dob, setDob] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  // Le code de réclamation est exigé dans tous les cas : c'est la preuve de
  // possession, sans elle un NIP (imprimé sur la carte) suffirait à revendiquer
  // l'identité de quelqu'un d'autre.
  const codeFilled = claimCode.replace(/[^0-9A-Za-z]/g, "").length === 12
  const canSubmit =
    codeFilled &&
    (mode === "nip"
      ? nip.trim().length === 14
      : Boolean(firstName.trim() && lastName.trim() && dob))

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      const identity =
        mode === "nip"
          ? { nip: nip.trim() }
          : {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              dateOfBirth: dob,
            }

      const res = await fetch(`${CONVEX_SITE}/api/claim/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identity, claimCode: claimCode.trim() }),
      })

      const data = (await res.json()) as ClaimResult
      if (!data.found) {
        setError(t.notFound)
        return
      }
      onFound({ ...data, claimCode: claimCode.trim() })
    } catch {
      setError(t.notFound)
    } finally {
      setBusy(false)
    }
  }

  return (
    <WizardShell
      step={t.step}
      total={CLAIM_STEP_TOTAL}
      title={t.title}
      sub={t.sub}
      backHref="/sign-in"
      backLabel={t.backLabel}
      footer={
        <Button
          type="button"
          size="lg"
          disabled={!canSubmit || busy}
          onClick={submit}
          className="h-14 w-full text-base"
        >
          {busy ? t.primarySearching : t.primary}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <Label htmlFor="claimCode">{t.claimCodeLabel}</Label>
          <Input
            id="claimCode"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder={t.claimCodePlaceholder}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="claimCode-hint"
            className="mt-2 font-mono tracking-widest uppercase"
          />
          <p
            id="claimCode-hint"
            className="text-muted-foreground mt-2 text-sm"
          >
            {t.claimCodeHint}
          </p>
        </div>

        {mode === "nip" ? (
          <div>
            <Label htmlFor="nip">{t.nipLabel}</Label>
            <Input
              id="nip"
              value={nip}
              onChange={(e) => setNip(e.target.value.toUpperCase())}
              placeholder={t.nipPlaceholder}
              maxLength={14}
              className="mt-1.5 font-mono"
              autoFocus
            />
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="firstName">{t.firstNameLabel}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t.lastNameLabel}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="dob">{t.dateOfBirthLabel}</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "nip" ? "name" : "nip")}
          className="text-left text-sm text-primary underline-offset-4 hover:underline"
        >
          {mode === "nip" ? t.orDivider : t.nipLabel}
        </button>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </WizardShell>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Confirmation
// ---------------------------------------------------------------------------

function ConfirmStep({
  result,
  onConfirm,
}: {
  result: ClaimResult
  onConfirm: () => void
}) {
  const t = claim.confirm

  const LOA_LABEL: Record<number, string> = {
    1: "1 — Faible",
    2: "2 — Substantiel",
    3: "3 — Élevé",
  }

  return (
    <WizardShell
      step={t.step}
      total={CLAIM_STEP_TOTAL}
      title={t.title}
      sub={t.sub}
      backHref="/claim?step=search"
      backLabel={t.backLabel}
      footer={
        <Button
          type="button"
          size="lg"
          onClick={onConfirm}
          className="h-14 w-full text-base"
        >
          {t.primary}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-5">
        <Row label={t.idnIdLabel} value={result.idnId ?? "—"} mono />
        <Row
          label={t.nameLabel}
          value={
            result.firstName && result.lastName
              ? `${result.firstName} ${result.lastName}`
              : "—"
          }
        />
        <Row
          label={t.loaLabel}
          value={LOA_LABEL[result.loa ?? 1] ?? "—"}
        />
      </div>
    </WizardShell>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          "text-sm font-medium text-foreground" + (mono ? " font-mono" : "")
        }
      >
        {value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Configuration (password + PIN)
// ---------------------------------------------------------------------------

const FORBIDDEN_PINS = new Set([
  "000000",
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "123456",
  "654321",
  "012345",
  "543210",
])

function SetupStep({ result }: { result: ClaimResult }) {
  const t = claim.setup
  const router = useRouter()

  const [password, setPassword] = React.useState("")
  const [confirmPw, setConfirmPw] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const canSubmit =
    password.length >= 12 &&
    confirmPw.length >= 12 &&
    /^\d{6}$/.test(pin)

  const submit = async () => {
    setError(null)
    if (password !== confirmPw) {
      setError(t.errorMismatch)
      return
    }
    if (FORBIDDEN_PINS.has(pin)) {
      setError(t.errorWeakPin)
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`${CONVEX_SITE}/api/claim/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegatedIdentityId: result.delegatedIdentityId,
          claimCode: result.claimCode,
          password,
          pin,
        }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!data.success) {
        setError(data.error ?? t.errorGeneric)
        return
      }

      toast.success(t.successToast)
      router.push("/sign-in")
    } catch {
      setError(t.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  return (
    <WizardShell
      step={claim.setup.step}
      total={CLAIM_STEP_TOTAL}
      title={t.title}
      sub={t.sub}
      backHref="/claim?step=confirm"
      backLabel={t.backLabel}
      footer={
        <Button
          type="button"
          size="lg"
          disabled={!canSubmit || busy}
          onClick={submit}
          className="h-14 w-full text-base"
        >
          {busy ? t.primarySubmitting : t.primary}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <Label htmlFor="password">{t.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            autoFocus
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t.passwordHint}
          </p>
        </div>
        <div>
          <Label htmlFor="confirmPw">{t.confirmPasswordLabel}</Label>
          <Input
            id="confirmPw"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pin">{t.pinLabel}</Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="mt-1.5 font-mono tracking-[0.3em]"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t.pinHint}</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </WizardShell>
  )
}
