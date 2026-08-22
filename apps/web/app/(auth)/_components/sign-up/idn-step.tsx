"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useConvex, useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import { ShieldIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Label } from "@repo/ui/components/label"
import { cn } from "@repo/ui/lib/utils"

import { authClient } from "@/lib/auth-client"

import { idnSignup, onboardingHeader, STEP_TOTAL } from "../../_content/fr"
import { WizardShell } from "../wizard-shell"
import {
  getOnboardingPivot,
  getOnboardingProfile,
  setOnboardingHandle,
  type OnboardingPivot,
  type OnboardingProfile,
} from "../../_hooks/use-onboarding-state"

const HANDLE_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/
const HANDLE_MIN = 3
const HANDLE_MAX = 32

function generateInternalPassword(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-="
  const buf = new Uint32Array(32)
  crypto.getRandomValues(buf)
  let s = ""
  for (let i = 0; i < buf.length; i++) {
    s += alphabet[buf[i]! % alphabet.length]
  }
  return s
}

function isHandleValid(handle: string): boolean {
  return (
    handle.length >= HANDLE_MIN &&
    handle.length <= HANDLE_MAX &&
    HANDLE_REGEX.test(handle)
  )
}

/**
 * Attend que le JWT Better Auth → Convex soit propagé après sign-up.
 *
 * `authClient.signUp.email()` pose le cookie immédiatement, mais
 * `ConvexBetterAuthProvider` doit ensuite récupérer le JWT et le
 * transmettre au client Convex avant que les mutations authentifiées
 * passent. Sans cette attente on récolte un `UNAUTHENTICATED` direct.
 */
async function waitForConvexAuth(
  fetchMe: () => Promise<unknown>,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const me = await fetchMe()
    if (me) return
    await new Promise((r) => setTimeout(r, 120))
  }
  throw new Error("Session non synchronisée. Réessayez.")
}

type Suggestion = { handle: string; format: string; available: boolean }

export function IdnStep() {
  const router = useRouter()
  const convex = useConvex()
  const completeSignup = useMutation(api.onboarding.completeSignup)

  const [profile, setProfile] = React.useState<OnboardingProfile | null>(null)
  const [pivot, setPivot] = React.useState<OnboardingPivot | null>(null)
  const [handle, setHandle] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [availability, setAvailability] = React.useState<
    { handle: string; available: boolean } | null
  >(null)
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Refus anti-doublon : l'erreur n'est pas corrigeable sur cet écran (elle
  // porte sur l'identité saisie à l'étape précédente), d'où un chemin de
  // retour explicite plutôt qu'un bouton « Réessayer » qui échouerait à
  // l'identique.
  const [blockedByDuplicate, setBlockedByDuplicate] = React.useState(false)

  React.useEffect(() => {
    const p = getOnboardingProfile()
    const pv = getOnboardingPivot()
    if (!p || !pv) {
      router.replace("/sign-up?step=profile")
      return
    }
    setProfile(p)
    setPivot(pv)
  }, [router])

  React.useEffect(() => {
    if (!pivot) return
    let cancelled = false
    void (async () => {
      try {
        const res = (await convex.query(api.onboarding.suggestIdnHandles, {
          firstName: pivot.firstName,
          lastName: pivot.lastName,
          dateOfBirth: pivot.dateOfBirth,
        })) as Suggestion[]
        if (cancelled) return
        setSuggestions(res)
        const first = res.find((s) => s.available) ?? res[0]
        if (first && !handle) setHandle(first.handle)
      } catch {
        /* silencieux */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pivot, convex])

  const handleNormalized = handle.trim().toLowerCase()
  const valid = isHandleValid(handleNormalized)

  React.useEffect(() => {
    if (!valid) {
      setAvailability(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = (await convex.query(
          api.onboarding.checkIdnHandleAvailability,
          { handle: handleNormalized },
        )) as { handle: string; available: boolean }
        if (!cancelled) setAvailability(res)
      } catch {
        if (!cancelled) setAvailability(null)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [handleNormalized, valid, convex])

  const isTaken = valid && availability && !availability.available
  const isAvailable = valid && availability && availability.available

  const status = !handle
    ? { tone: "neutral" as const, label: idnSignup.statusChecking }
    : !valid
      ? { tone: "error" as const, label: idnSignup.statusInvalid }
      : !availability
        ? { tone: "neutral" as const, label: idnSignup.statusChecking }
        : availability.available
          ? { tone: "ok" as const, label: idnSignup.statusAvailable }
          : { tone: "error" as const, label: idnSignup.statusTaken }

  const reserve = async () => {
    if (!profile || !pivot || !isAvailable || submitting) return
    if (!acceptTerms) {
      setError(idnSignup.validation.termsRequired)
      return
    }
    setSubmitting(true)
    setError(null)
    setBlockedByDuplicate(false)
    try {
      const result = await authClient.signUp.email({
        email: `${handleNormalized}@idn.ga`,
        password: generateInternalPassword(),
        name: handleNormalized,
      })
      if (result?.error) {
        const code = result.error.code as string | undefined
        setError(
          code === "USER_ALREADY_EXISTS"
            ? idnSignup.errorTaken
            : (result.error.message ?? idnSignup.errorGeneric),
        )
        setSubmitting(false)
        return
      }
      await waitForConvexAuth(() =>
        convex.query(api.profile.getCurrentUser, {}),
      )
      await completeSignup({ profileType: profile, pivot })
      setOnboardingHandle(handleNormalized)
      router.push("/sign-up?step=pin")
    } catch (err) {
      // Refus anti-doublon : le compte Better Auth vient d'être créé, mais le
      // profil, non. L'adresse @idn.ga réservée reste celle de l'utilisateur,
      // qui est authentifié — il peut donc corriger son identité et relancer
      // l'opération sans rien perdre. On le renvoie à l'étape identité plutôt
      // que de le laisser sur un écran où il n'a plus rien à corriger.
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; message?: string } | string
        const code = typeof data === "object" ? data.code : undefined
        if (
          code === "IDENTITY_ALREADY_VERIFIED" ||
          code === "NIP_ALREADY_VERIFIED"
        ) {
          setError(
            code === "NIP_ALREADY_VERIFIED"
              ? idnSignup.errorNipVerified
              : idnSignup.errorIdentityVerified,
          )
          setBlockedByDuplicate(true)
          setSubmitting(false)
          return
        }
        const message = typeof data === "object" ? data.message : undefined
        toast.error(message ?? idnSignup.errorGeneric)
        setSubmitting(false)
        return
      }
      toast.error(err instanceof Error ? err.message : idnSignup.errorGeneric)
      setSubmitting(false)
    }
  }

  const visibleSuggestions = suggestions.slice(0, 4)

  return (
    <WizardShell
      step={idnSignup.step}
      total={STEP_TOTAL}
      title={idnSignup.title}
      sub={idnSignup.sub}
      backHref="/sign-up?step=identity"
      backLabel={onboardingHeader.backToIdentity}
      footer={
        <Button
          type="button"
          size="lg"
          disabled={!isAvailable || !acceptTerms || submitting}
          onClick={() => void reserve()}
          className="h-14 w-full text-base"
        >
          {submitting ? idnSignup.primarySubmitting : idnSignup.primary}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="idn-handle">{idnSignup.inputLabel}</Label>
          <div
            className={cn(
              "flex h-14 items-center rounded-md border bg-card pl-4 pr-3 transition-colors",
              status.tone === "ok"
                ? "border-idn-green ring-2 ring-idn-green/20"
                : status.tone === "error"
                  ? "border-destructive ring-2 ring-destructive/15"
                  : "border-border",
            )}
          >
            <input
              id="idn-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder={idnSignup.inputPlaceholder}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="flex-1 bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <span className="font-mono text-base text-muted-foreground">
              @idn.ga
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 pt-1 text-xs font-medium",
              status.tone === "ok"
                ? "text-idn-green"
                : status.tone === "error"
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                status.tone === "ok"
                  ? "bg-idn-green"
                  : status.tone === "error"
                    ? "bg-destructive"
                    : "bg-muted-foreground",
              )}
              aria-hidden="true"
            />
            <span>{status.label}</span>
          </div>
        </div>

        {visibleSuggestions.length > 0 && (
          <div className="space-y-2.5">
            <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground">
              {isTaken
                ? idnSignup.suggestionsTakenLabel
                : idnSignup.suggestionsLabel}
            </p>
            <ul className="flex flex-col gap-2">
              {visibleSuggestions.map((s, i) => {
                const sel = s.handle === handleNormalized
                return (
                  <li key={s.handle}>
                    <button
                      type="button"
                      onClick={() => s.available && setHandle(s.handle)}
                      disabled={!s.available}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        sel
                          ? "border-idn-green bg-idn-green-soft dark:bg-[#0F2A18]"
                          : "border-border bg-card hover:border-idn-green/40",
                        !s.available && "cursor-not-allowed opacity-50",
                      )}
                      aria-pressed={sel}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          s.available ? "bg-idn-green" : "bg-destructive",
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate font-mono text-sm text-foreground">
                        {s.handle}
                        <span className="text-muted-foreground">@idn.ga</span>
                      </span>
                      {i === 0 && s.available && !isTaken && (
                        <span className="rounded-full bg-idn-green-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.02em] text-idn-green dark:bg-[#0F2A18]">
                          {idnSignup.badgeRecommended}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-md bg-idn-blue-soft px-3.5 py-3 text-xs leading-relaxed text-foreground/80 dark:bg-[#10243A]">
          <ShieldIcon
            className="mt-0.5 size-4 shrink-0 text-idn-blue"
            aria-hidden="true"
          />
          <p>{idnSignup.info}</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-foreground/80">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-idn-green"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            aria-required="true"
          />
          <span>
            {idnSignup.termsPrefix}
            <Link
              href="/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-idn-green underline-offset-2 hover:underline"
            >
              {idnSignup.termsLink}
            </Link>
            .
          </span>
        </label>

        {error && (
          <div role="alert" className="space-y-2">
            <p className="text-xs text-destructive">{error}</p>
            {blockedByDuplicate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/sign-up?step=identity")}
              >
                {idnSignup.backToIdentity}
              </Button>
            )}
          </div>
        )}
      </div>
    </WizardShell>
  )
}
