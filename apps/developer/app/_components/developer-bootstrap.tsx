"use client"

import { useEffect, useRef } from "react"
import { useConvex, useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

/**
 * Garantit (au premier accès au portail) que l'utilisateur courant a le
 * rôle "developer". Idempotent côté backend — re-call no-op.
 *
 * Sécurité : la mutation `ensureRole` est ouverte à tout user authentifié.
 * C'est intentionnel — le portail développeur n'est pas un privilège
 * d'opérateur (admin / controller), juste une activation libre-service.
 *
 * Note technique : on gate la mutation derrière `api.developer.apps.me`
 * (une query). Convex ne sert les queries qu'une fois le JWT propagé
 * au client — ça nous donne un signal "auth ready" fiable, sans race
 * condition entre `ConvexBetterAuthProvider` qui pose le token et la
 * mutation qui part trop tôt.
 */
export function DeveloperBootstrap() {
  const convex = useConvex()
  const me = useQuery(api.developer.apps.me, {})
  const triggered = useRef(false)

  useEffect(() => {
    if (!me?.authenticated) return
    if (me.hasDeveloperRole) return
    if (triggered.current) return
    triggered.current = true
    void convex.mutation(api.developer.apps.ensureRole, {}).catch(() => {
      // Permettre une nouvelle tentative au prochain render si ça a échoué.
      triggered.current = false
    })
  }, [convex, me])

  return null
}
