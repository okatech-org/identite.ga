"use client"

import * as React from "react"
import { DeleteIcon } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

type PinPadProps = {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  hasError?: boolean
  ariaLabel: string
  numpadAriaLabel: string
  backspaceAriaLabel: string
  digitAriaLabel: (n: number) => string
  dotsAriaLabel: (filled: number, total: number) => string
  autoFocus?: boolean
  disabled?: boolean
  resetKey?: string | number
}

function vibrate(ms = 12): void {
  if (typeof navigator === "undefined") return
  const nav = navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean
  }
  try {
    nav.vibrate?.(ms)
  } catch {
    /* noop */
  }
}

/**
 * Pavé numérique pour la saisie d'un PIN.
 *
 * Feedback à chaque tap (touche ou bouton) :
 *   - visuel : `data-pressed` + transform scale(0.95) court (CSS)
 *   - haptique : navigator.vibrate(12) (best-effort, Android/Chrome)
 *
 * Les feedbacks sont désactivés si `prefers-reduced-motion: reduce`
 * est actif.
 */
export function PinPad({
  length = 6,
  value,
  onChange,
  onComplete,
  hasError,
  ariaLabel,
  numpadAriaLabel,
  backspaceAriaLabel,
  digitAriaLabel,
  dotsAriaLabel,
  autoFocus,
  disabled,
  resetKey,
}: PinPadProps) {
  const hiddenInputRef = React.useRef<HTMLInputElement>(null)
  const completedRef = React.useRef(false)
  const [pressed, setPressed] = React.useState<string | null>(null)
  const pressTimeoutRef = React.useRef<number | null>(null)

  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  }, [])

  React.useEffect(() => {
    completedRef.current = false
  }, [resetKey])

  React.useEffect(() => {
    // Après un refus de connexion, le parent vide la valeur sans forcément
    // changer resetKey. Le prochain PIN complet doit pouvoir être soumis.
    if (value.length < length) completedRef.current = false
  }, [length, value])

  React.useEffect(() => {
    if (autoFocus) hiddenInputRef.current?.focus()
  }, [autoFocus])

  React.useEffect(() => {
    return () => {
      if (pressTimeoutRef.current !== null)
        window.clearTimeout(pressTimeoutRef.current)
    }
  }, [])

  const flashPressed = (key: string) => {
    if (prefersReducedMotion) return
    setPressed(key)
    if (pressTimeoutRef.current !== null)
      window.clearTimeout(pressTimeoutRef.current)
    pressTimeoutRef.current = window.setTimeout(() => setPressed(null), 130)
  }

  const triggerFeedback = (key: string) => {
    flashPressed(key)
    if (!prefersReducedMotion) {
      vibrate(12)
    }
  }

  const append = (digit: string) => {
    if (disabled) return
    triggerFeedback(digit)
    if (value.length >= length) return
    const next = (value + digit).slice(0, length)
    onChange(next)
    if (next.length === length && !completedRef.current) {
      completedRef.current = true
      onComplete?.(next)
    }
  }

  const remove = () => {
    if (disabled) return
    triggerFeedback("back")
    if (value.length === 0) return
    completedRef.current = false
    onChange(value.slice(0, -1))
  }

  const onHiddenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, length)
    onChange(digits)
    if (digits.length === length && !completedRef.current) {
      completedRef.current = true
      onComplete?.(digits)
    }
    if (digits.length < length) completedRef.current = false
  }

  const onHiddenKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      return
    }
    if (/^\d$/.test(e.key)) {
      triggerFeedback(e.key)
    } else if (e.key === "Backspace" && value.length > 0) {
      triggerFeedback("back")
    }
  }

  const focusInput = () => hiddenInputRef.current?.focus()

  const dotsLabel = dotsAriaLabel(value.length, length)

  const padBtnBase =
    "flex h-16 cursor-pointer select-none items-center justify-center rounded-xl border border-border bg-card text-2xl font-semibold text-foreground transition-all duration-150 ease-out hover:bg-secondary/50 active:scale-95 active:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"

  const pressedStyle = "!scale-95 !bg-idn-green/15 !border-idn-green"

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-1 flex-col gap-7",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <button
        type="button"
        onClick={focusInput}
        aria-label={dotsLabel}
        className="flex items-center justify-center gap-3 rounded-md py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "size-3 rounded-full transition-all duration-150",
                hasError
                  ? "bg-destructive"
                  : filled
                    ? "scale-110 bg-idn-green"
                    : "border border-border bg-transparent",
              )}
            />
          )
        })}
      </button>

      <input
        ref={hiddenInputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        onChange={onHiddenChange}
        onKeyDown={onHiddenKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        className="sr-only"
      />

      <div
        role="group"
        aria-label={numpadAriaLabel}
        className="mt-auto grid w-full grid-cols-3 gap-3"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => append(String(n))}
            disabled={disabled}
            data-pressed={pressed === String(n) ? "true" : undefined}
            aria-label={digitAriaLabel(n)}
            className={cn(padBtnBase, pressed === String(n) && pressedStyle)}
          >
            {n}
          </button>
        ))}
        <span aria-hidden="true" />
        <button
          type="button"
          onClick={() => append("0")}
          disabled={disabled}
          data-pressed={pressed === "0" ? "true" : undefined}
          aria-label={digitAriaLabel(0)}
          className={cn(padBtnBase, pressed === "0" && pressedStyle)}
        >
          0
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={disabled}
          data-pressed={pressed === "back" ? "true" : undefined}
          aria-label={backspaceAriaLabel}
          className={cn(padBtnBase, pressed === "back" && pressedStyle)}
        >
          <DeleteIcon
            className={cn(
              "size-7 transition-opacity",
              value.length === 0 && "opacity-40",
            )}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
