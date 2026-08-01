"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { PinPad } from "@repo/ui/components/pin-pad"

import { authClient } from "@/lib/auth-client"
import { syncCrossDomainCookiesForProxy } from "@/lib/auth-cookie"
import {
  buildPortalSsoUrl,
  buildPostLoginRedirect,
  hasCheckedPortalSession,
  isFederatedSignIn,
  resolveIdnWebUrl,
} from "@/lib/sso"

import { IdnIcons } from "../_components/icons"
import { fr } from "../_content/fr"

const HANDLE_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/
const IDN_DOMAIN = "@idn.ga"
const CONFIGURED_IDN_WEB_URL = process.env.NEXT_PUBLIC_IDN_WEB_URL

/**
 * Accepte `handle` ou `handle@idn.ga` indifféremment.
 * Renvoie l'email Better Auth normalisé.
 */
function normalizeIdnIdentifier(
  input: string,
): { handle: string; email: string } | null {
  const raw = input.trim().toLowerCase()
  if (!raw) return null
  const handle = raw.endsWith(IDN_DOMAIN) ? raw.slice(0, -IDN_DOMAIN.length) : raw
  if (handle.length < 3 || handle.length > 32) return null
  if (!HANDLE_REGEX.test(handle)) return null
  return { handle, email: `${handle}${IDN_DOMAIN}` }
}

const handleSchema = z.object({
  identifier: z
    .string()
    .trim()
    .refine(
      (v) => normalizeIdnIdentifier(v) !== null,
      "Identifiant IDN invalide.",
    ),
})

type HandleValues = z.infer<typeof handleSchema>

type Phase = "handle" | "pin"

export default function ConnectSignInPage() {
  return (
    <Suspense fallback={null}>
      <ConnectSignInPageInner />
    </Suspense>
  )
}

function ConnectSignInPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const postLoginUrl = buildPostLoginRedirect(params)
  const isOAuthFlow = isFederatedSignIn(params)
  const shouldCheckPortal = isOAuthFlow && !hasCheckedPortalSession(params)

  const [phase, setPhase] = useState<Phase>("handle")
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkingPortal, setCheckingPortal] = useState(shouldCheckPortal)

  useEffect(() => {
    if (!shouldCheckPortal) return

    try {
      window.location.replace(
        buildPortalSsoUrl({
          idnWebUrl: resolveIdnWebUrl(
            CONFIGURED_IDN_WEB_URL,
            window.location.origin,
          ),
          connectOrigin: window.location.origin,
          postLoginPath: postLoginUrl,
          signInParams: new URLSearchParams(params.toString()),
        }),
      )
    } catch {
      setCheckingPortal(false)
    }
  }, [params, postLoginUrl, shouldCheckPortal])

  const handleForm = useForm<HandleValues>({
    resolver: zodResolver(handleSchema),
    defaultValues: { identifier: "" },
    mode: "onTouched",
  })

  const goToPin = handleForm.handleSubmit((values) => {
    const norm = normalizeIdnIdentifier(values.identifier)
    if (!norm) return
    setEmail(norm.email)
    setPin("")
    setPinError(null)
    setPhase("pin")
  })

  /**
   * Une fois la session Better Auth posée, on relaie soit vers l'endpoint
   * OAuth2 (le plugin oidcProvider reprend le flow consent), soit vers le
   * `redirect_to` interne. La logique cookie/fetch est nécessaire parce
   * que le plugin crossDomainClient stocke la session en localStorage
   * (cross-domain), pas en cookie HTTP — on doit donc la copier sur
   * `document.cookie` pour que le proxy /api/auth/* la transmette à
   * Convex.
   */
  const finishSignIn = async () => {
    if (!isOAuthFlow) {
      router.push(postLoginUrl)
      return
    }
    try {
      syncCrossDomainCookiesForProxy(authClient)
    } catch (err) {
      console.error("[idn:sign-in] failed to write document.cookie", err)
    }

    let nextUrl: string | null = null
    try {
      const r = await fetch(postLoginUrl, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      if (r.redirected) {
        nextUrl = r.url
      } else {
        const body = (await r.json().catch(() => null)) as
          | { redirect?: boolean; url?: string }
          | null
        if (body?.url) nextUrl = body.url
      }
    } catch (err) {
      console.error("[idn:sign-in] authorize fetch threw", err)
    }
    if (nextUrl) {
      window.location.assign(nextUrl)
      return
    }
    window.location.assign(postLoginUrl)
  }

  const submitPin = async (entered: string) => {
    if (submitting) return
    setSubmitting(true)
    setPinError(null)
    try {
      const res = await authClient.$fetch("/sign-in/pin", {
        method: "POST",
        body: { email, pin: entered },
      })
      const errorBody = (res?.error ?? null) as
        | { code?: string; status?: number; message?: string }
        | null
      if (errorBody) {
        const code = errorBody.code
        if (code === "EMAIL_NOT_VERIFIED") {
          toast.error(fr.signIn.errorEmailNotVerified)
        } else if (errorBody.status === 429) {
          setPinError(fr.signIn.pinErrorTooMany)
        } else {
          setPinError(fr.signIn.pinErrorInvalid)
        }
        setPin("")
        setSubmitting(false)
        return
      }
      await finishSignIn()
    } catch {
      setPinError(fr.signIn.pinErrorInvalid)
      setPin("")
      setSubmitting(false)
    }
  }

  if (checkingPortal) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-idn-bg p-6">
        <p className="text-sm text-idn-muted">
          Vérification de votre session Identité Numérique…
        </p>
      </main>
    )
  }

  if (phase === "pin") {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[460px] flex-col px-6 py-12">
        <div className="flex flex-col items-center text-center">
          <IdnMark size={42} />
          <IdnFlagBars className="mt-4" width={120} height={3} />
          <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.012em] text-idn-ink">
            {fr.signIn.pinTitle}
          </h1>
          <p className="mt-1.5 text-sm text-idn-muted">{fr.signIn.pinSub}</p>
          <p className="mt-1 text-xs text-idn-muted">{email}</p>
        </div>

        <div className="mt-8 flex flex-1 flex-col">
          <PinPad
            length={6}
            value={pin}
            onChange={(v) => {
              setPin(v)
              if (pinError) setPinError(null)
            }}
            onComplete={submitPin}
            hasError={Boolean(pinError)}
            ariaLabel={fr.signIn.pinTitle}
            numpadAriaLabel={fr.signIn.pinNumpadAria}
            backspaceAriaLabel={fr.signIn.pinBackspaceAria}
            digitAriaLabel={fr.signIn.pinDigitAria}
            dotsAriaLabel={fr.signIn.pinDotsAria}
            autoFocus
            disabled={submitting}
            resetKey={email}
          />

          <div
            id="pin-signin-error"
            aria-live="polite"
            className="mt-3 min-h-[1rem]"
          >
            {pinError ? (
              <p role="alert" className="text-center text-xs text-destructive">
                {pinError}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            size="lg"
            disabled={submitting || pin.length !== 6}
            onClick={() => void submitPin(pin)}
            className="mt-6 h-12 w-full text-base"
          >
            {submitting ? fr.signIn.submitting : fr.signIn.pinPrimary}
          </Button>

          <button
            type="button"
            onClick={() => {
              setPin("")
              setPinError(null)
              setPhase("handle")
            }}
            className="mt-4 text-center text-[13px] text-idn-muted hover:underline"
          >
            ← {fr.signIn.pinBack}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[460px] flex-col justify-center px-6 py-16">
      <div className="flex flex-col items-center text-center">
        <IdnMark size={42} />
        <IdnFlagBars className="mt-4" width={120} height={3} />
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.012em] text-idn-ink">
          {fr.signIn.title}
        </h1>
        <p className="mt-2 text-sm text-idn-muted">{fr.signIn.subtitle}</p>
      </div>

      <form onSubmit={goToPin} noValidate className="mt-7 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="conn-identifier">{fr.signIn.handleLabel}</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-idn-muted"
              aria-hidden
            >
              {IdnIcons.user}
            </span>
            <Input
              id="conn-identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={fr.signIn.handlePlaceholder}
              required
              aria-required="true"
              aria-invalid={Boolean(handleForm.formState.errors.identifier)}
              aria-describedby={
                handleForm.formState.errors.identifier
                  ? "conn-identifier-error"
                  : "conn-identifier-hint"
              }
              className="h-11 pl-11"
              {...handleForm.register("identifier")}
            />
          </div>
          {handleForm.formState.errors.identifier ? (
            <p
              id="conn-identifier-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {handleForm.formState.errors.identifier.message}
            </p>
          ) : (
            <p id="conn-identifier-hint" className="text-xs text-idn-muted">
              {fr.signIn.handleHint}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base"
        >
          {fr.signIn.continue}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-idn-muted">
        {fr.signIn.noAccount}{" "}
        <a
          href="https://identite.ga/sign-up"
          className="font-medium text-idn-green underline-offset-2 hover:underline"
        >
          {fr.signIn.createAccount}
        </a>
      </p>
    </main>
  )
}
