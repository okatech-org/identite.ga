"use client"

import type { ReactNode } from "react"

import { useIDN, useLoA } from "./hooks.js"

export interface ConditionalProps {
  children: ReactNode
  fallback?: ReactNode
}

export const SignedIn = ({ children, fallback = null }: ConditionalProps) => {
  const { isAuthenticated, isLoading } = useIDN()
  if (isLoading) return null
  return <>{isAuthenticated ? children : fallback}</>
}

export const SignedOut = ({ children, fallback = null }: ConditionalProps) => {
  const { isAuthenticated, isLoading } = useIDN()
  if (isLoading) return null
  return <>{!isAuthenticated ? children : fallback}</>
}

export interface RequireLoAProps extends ConditionalProps {
  level: 1 | 2 | 3
}

export const RequireLoA = ({ level, children, fallback = null }: RequireLoAProps) => {
  const { hasMinimum } = useLoA()
  return <>{hasMinimum(level) ? children : fallback}</>
}

/**
 * Bouton « Se connecter avec IDN » — headless, accepte `className`/style.
 * Le rendu reste minimal : pas d'ombre, pas de dépendance UI tierce.
 */
export interface IDNSignInButtonProps {
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
  /** Surcharge des scopes pour ce sign-in */
  scopes?: string[]
  /** Surcharge des acr_values pour ce sign-in */
  acrValues?: string[]
}

export const IDNSignInButton = ({
  children,
  className,
  style,
  scopes,
  acrValues,
}: IDNSignInButtonProps) => {
  const { signIn, isLoading } = useIDN()
  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={isLoading}
      onClick={() => void signIn({ scopes, acrValues })}
    >
      {children ?? "Se connecter avec IDN"}
    </button>
  )
}
