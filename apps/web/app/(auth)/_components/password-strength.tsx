"use client"

import * as React from "react"
import { zxcvbnAsync, zxcvbnOptions } from "@zxcvbn-ts/core"
import * as zxcvbnCommon from "@zxcvbn-ts/language-common"
import * as zxcvbnEn from "@zxcvbn-ts/language-en"
import * as zxcvbnFr from "@zxcvbn-ts/language-fr"

import { cn } from "@repo/ui/lib/utils"

zxcvbnOptions.setOptions({
  translations: zxcvbnFr.translations,
  graphs: zxcvbnCommon.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommon.dictionary,
    ...zxcvbnEn.dictionary,
    ...zxcvbnFr.dictionary,
  },
})

const LABELS = [
  "Très faible",
  "Faible",
  "Acceptable",
  "Bon",
  "Excellent",
] as const

const COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-idn-yellow",
  "bg-idn-green",
  "bg-idn-green",
] as const

type Result = {
  score: 0 | 1 | 2 | 3 | 4
  warning?: string
  suggestions?: string[]
}

type PasswordStrengthProps = {
  password: string
  userInputs?: string[]
  className?: string
  /** Longueur minimale exigée (cf. cahier §6.2 = 12). */
  minLength?: number
}

/**
 * Indicateur de force du mot de passe en live (zxcvbn-ts côté client).
 * 4 segments colorés + label localisé + warning/suggestion zxcvbn.
 *
 * IDN exige score ≥ 3 + ≥ 12 chars + non-HIBP (validation finale par
 * Better Auth / haveIBeenPwned plugin côté serveur).
 */
export function PasswordStrength({
  password,
  userInputs = [],
  minLength = 12,
  className,
}: PasswordStrengthProps) {
  const [result, setResult] = React.useState<Result | null>(null)

  React.useEffect(() => {
    let cancelled = false
    if (!password) {
      setResult(null)
      return
    }
    void zxcvbnAsync(password, userInputs).then((r) => {
      if (cancelled) return
      setResult({
        score: r.score as Result["score"],
        warning: r.feedback.warning ?? undefined,
        suggestions: r.feedback.suggestions,
      })
    })
    return () => {
      cancelled = true
    }
  }, [password, userInputs])

  const tooShort = password.length > 0 && password.length < minLength
  // 4 segments, remplis à hauteur de score (0..4).
  const fill = result ? result.score : 0
  const label = tooShort
    ? `Trop court (minimum ${minLength} caractères)`
    : password.length === 0
      ? null
      : LABELS[fill]
  const color = COLORS[fill]

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        role="progressbar"
        aria-valuenow={fill}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Force du mot de passe"
        className="flex gap-1"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < fill && password ? color : "bg-border",
            )}
          />
        ))}
      </div>
      {label && (
        <p
          className={cn(
            "text-xs",
            tooShort || fill < 3
              ? "text-muted-foreground"
              : "text-idn-green font-medium",
          )}
        >
          {label}
          {result?.warning && !tooShort && fill < 3 && ` — ${result.warning}`}
        </p>
      )}
    </div>
  )
}
