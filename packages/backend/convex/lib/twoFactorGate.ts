/**
 * Décision + constantes partagées pour gater le second facteur TOTP sur les
 * flux de sign-in "maison" que le plugin `twoFactor` de better-auth ne
 * couvre pas nativement.
 *
 * Le plugin `twoFactor` (better-auth/dist/plugins/two-factor/index.mjs) pose
 * un hook `after` dont le `matcher` n'intercepte QUE les endpoints natifs
 * `/sign-in/email`, `/sign-in/username` et `/sign-in/phone-number` — câblés
 * en dur dans la lib, pas configurables. Nos propres endpoints de sign-in
 * (`/sign-in/pin` — lib/pinSignInPlugin.ts) et certains endpoints natifs non
 * couverts par ce matcher (`/sign-in/email-otp` — gated depuis auth.ts via
 * un hook `hooks.after` top-level) doivent donc reproduire eux-mêmes cette
 * logique pour qu'un compte `twoFactorEnabled` ne puisse JAMAIS obtenir de
 * session sans passer par `authClient.twoFactor.verifyTotp` /
 * `verifyBackupCode`.
 *
 * Modèle de sécurité — passkey exempté : `/sign-in/passkey` N'EST PAS gated
 * (ni ici, ni ailleurs). Un passkey est déjà un facteur fort résistant au
 * phishing (clé privée liée au device + biométrie/PIN local) ; l'assujettir
 * à un second facteur TOTP n'ajoute pas de garantie réelle et dégraderait
 * l'UX sans bénéfice de sécurité (cf. apps/mobile/.../(auth)/login.tsx).
 */

/**
 * Nom du cookie posé/lu par le plugin `twoFactor` pour la vérification 2FA
 * en attente. Valeur interne, non exportée publiquement par better-auth
 * (`better-auth/dist/plugins/two-factor/constant.mjs`), figée depuis
 * better-auth@1.6.x. Si elle change un jour, `verifyTotp` / `verifyBackupCode`
 * ne retrouveront plus l'état posé ici côté PIN/email-OTP.
 */
export const TWO_FACTOR_COOKIE_NAME = "two_factor"

/**
 * Durée de vie (secondes) de la vérification 2FA en attente. Même défaut
 * que le plugin `twoFactor` (`options.twoFactorCookieMaxAge`, non surchargé
 * dans auth.ts → 600s des deux côtés).
 */
export const TWO_FACTOR_VERIFICATION_MAX_AGE_SECONDS = 600

/**
 * Décision pure : un compte `twoFactorEnabled` doit passer par le challenge
 * TOTP/backup-code avant qu'une session ne soit émise — quel que soit le
 * facteur "faible" utilisé pour l'authentifier initialement (PIN, OTP
 * email...). Extrait en fonction pure pour rester testable sans monter tout
 * le contexte Better Auth (cf. twoFactorGate.test.ts).
 */
export function requiresTwoFactorChallenge(user: {
  twoFactorEnabled?: boolean | null
}): boolean {
  return user.twoFactorEnabled === true
}

/**
 * Ctx minimal requis par `handleSignInTwoFactorGate` — sous-ensemble duck-typé
 * du `HookEndpointContext` de better-auth (cf. auth.ts, `hooks.after`).
 * `session`/`attributes` restent typés en `any` à dessein : ce sont des
 * champs/valeurs internes à better-auth qu'on ne fait que faire transiter
 * (assigner `null`, repasser à `createAuthCookie`/`setSignedCookie`) sans les
 * inspecter — les typer plus strictement forcerait une dépendance directe
 * aux types internes de better-auth pour aucun bénéfice de sécurité réel.
 */
export interface SignInTwoFactorGateCtx {
  path?: string
  context: {
    newSession: {
      session: { token: string }
      user: { id: string; twoFactorEnabled?: boolean | null }
    } | null
    session: unknown
    setNewSession: (session: null) => void
    internalAdapter: {
      deleteSession: (token: string) => Promise<unknown>
      createVerificationValue: (data: {
        value: string
        identifier: string
        expiresAt: Date
      }) => Promise<unknown>
    }
    createAuthCookie: (
      name: string,
      overrides?: { maxAge?: number },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => { name: string; attributes: any }
    secret: string
  }
  setSignedCookie: (
    name: string,
    value: string,
    secret: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attributes: any,
  ) => Promise<unknown>
  json: (body: Record<string, unknown>) => unknown
}

/**
 * Gate 2FA générique pour tout endpoint `/sign-in/*` qui a déjà laissé
 * better-auth créer une session (`ctx.context.newSession` non nul) pour un
 * compte `twoFactorEnabled`. Extrait de `auth.ts` pour être testable sans
 * monter tout le contexte Better Auth (cf. twoFactorGate.test.ts).
 *
 * BLOQUANT authz corrigé ici : supprimer la session DB ne suffit PAS — le
 * hook `after` du plugin `convex` de @convex-dev/better-auth (exécuté après
 * celui-ci dans la même chaîne, cf. commentaire détaillé dans auth.ts) lit
 * `ctx.context.session ?? ctx.context.newSession` pour émettre un cookie
 * `convex_jwt` signé à partir des objets `session`/`user` EN MÉMOIRE, sans
 * re-vérifier que la session existe encore en base. Tant que `newSession`
 * n'est pas explicitement remis à `null` ici, un `convex_jwt` valide était
 * donc émis MÊME APRÈS suppression de la session — 2FA totalement
 * contournée sur le plan de données Convex. D'où l'invariant vérifié par le
 * test : après un appel gaté, `ctx.context.newSession` ET `ctx.context.session`
 * doivent être `null`, pour que TOUT hook `after` suivant (natif `twoFactor`
 * ou `convex`) les trouve vides et n'émette rien.
 *
 * Retourne le résultat de `ctx.json({ twoFactorRedirect: true })` si gaté,
 * sinon `undefined` (no-op — pas de 2FA requise, ou pas de session à gater).
 */
export async function handleSignInTwoFactorGate(
  ctx: SignInTwoFactorGateCtx,
): Promise<unknown> {
  if (!ctx.path?.startsWith("/sign-in")) return undefined

  const data = ctx.context.newSession
  if (!data || !requiresTwoFactorChallenge(data.user)) return undefined

  // Une session a déjà été créée par l'endpoint de sign-in — on la révoque
  // en base...
  await ctx.context.internalAdapter.deleteSession(data.session.token)

  // ...ET on neutralise l'état en mémoire AVANT de rendre la main aux hooks
  // `after` suivants (natif `twoFactor`, puis `convex`) : c'est ce qui
  // empêche l'émission du `convex_jwt` décrite ci-dessus.
  ctx.context.setNewSession(null)
  ctx.context.session = null

  const identifier = `2fa-${crypto.randomUUID()}`
  await ctx.context.internalAdapter.createVerificationValue({
    value: data.user.id,
    identifier,
    expiresAt: new Date(Date.now() + TWO_FACTOR_VERIFICATION_MAX_AGE_SECONDS * 1000),
  })
  const twoFactorCookie = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE_NAME, {
    maxAge: TWO_FACTOR_VERIFICATION_MAX_AGE_SECONDS,
  })
  await ctx.setSignedCookie(
    twoFactorCookie.name,
    identifier,
    ctx.context.secret,
    twoFactorCookie.attributes,
  )

  return ctx.json({ twoFactorRedirect: true })
}
