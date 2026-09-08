import { DocBody } from "../_components/doc-body"
import {
  Code,
  CodeBlock,
  DocTable,
  FeatureCard,
  H1,
  H2,
  Lede,
  P,
  Pill,
} from "../_components/prose"

const TOC = [
  { label: "À propos de @idn-ga/core" },
  { label: "Architecture du flow OIDC" },
  { label: "Création du client" },
  { label: "Cycle de vie de la session" },
  { label: "Adaptateurs de stockage" },
]

export default function CoreOverview() {
  return (
    <DocBody breadcrumbs={["@idn-ga/core", "Présentation"]} toc={TOC}>
      <H1>@idn-ga/core</H1>
      <Lede>
        Client OpenID Connect vanilla, framework-agnostic. C&apos;est la
        fondation sur laquelle reposent <Code>@idn-ga/react</Code> et{" "}
        <Code>@idn-ga/better-auth</Code>.
      </Lede>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>12 KB gzip cible</Pill>
        <Pill>0 dépendance</Pill>
        <Pill>PKCE S256</Pill>
        <Pill>TypeScript strict</Pill>
        <Pill>ESM + CJS</Pill>
        <Pill>Browser + Node + Bun</Pill>
      </div>

      <H2 id="architecture-du-flow-oidc">Architecture du flow OIDC</H2>
      <P>
        Authorization Code Flow + PKCE. Aucune option pour désactiver PKCE — il
        est forcé à <Code>S256</Code> côté SDK et obligatoire côté serveur.
      </P>
      <div className="mt-4 rounded-xl border border-idn-border bg-idn-surface p-5">
        <ol className="space-y-3 text-[13px] text-idn-ink-2">
          <li>
            <span className="font-mono font-semibold text-idn-green">1.</span>{" "}
            <strong>Votre app</strong> appelle <Code>signIn()</Code> — le SDK
            génère un code verifier PKCE et redirige vers IDN.
          </li>
          <li>
            <span className="font-mono font-semibold text-idn-green">2.</span>{" "}
            <strong>IDN</strong> authentifie l&apos;utilisateur (mot de passe,
            2FA, KYC si LoA exigé) et demande le consentement sur{" "}
            <Code>identite.ga</Code>.
          </li>
          <li>
            <span className="font-mono font-semibold text-idn-green">3.</span>{" "}
            <strong>IDN</strong> redirige vers votre <Code>redirectUri</Code>{" "}
            avec un <Code>code</Code> et le <Code>state</Code> vérifié.
          </li>
          <li>
            <span className="font-mono font-semibold text-idn-green">4.</span>{" "}
            <strong>Votre app</strong> appelle{" "}
            <Code>handleCallback()</Code> — le SDK échange le code contre des
            tokens, vérifie l&apos;ID token via JWKS, et persiste la session.
          </li>
          <li className="border-t border-dashed border-idn-border-soft pt-3 text-[12px] text-idn-green">
            <strong>5. Session établie</strong> — ID token vérifié via JWKS,
            access + refresh tokens stockés.
          </li>
        </ol>
      </div>

      <H2 id="creation-du-client">Création du client</H2>
      <CodeBlock lang="ts" title="src/idn.ts">
{`import { createIDNClient } from "@idn-ga/core";

export const idn = createIDNClient({
  // Obligatoires
  clientId: "votre-client-id",
  redirectUri: "https://votre-app.ga/auth/callback",

  // Optionnels — valeurs par défaut affichées
  issuer: "https://site.identite.ga",
  scopes: ["openid", "profile", "email"],
  acrValues: ["eidas2"],
  storage: "localStorage",      // ou "sessionStorage" | "memory" | custom
  pkce: true,                    // ne pas désactiver
  refreshThreshold: 60,          // refresh si exp < N secondes
});`}
      </CodeBlock>

      <H2 id="cycle-de-vie-de-la-session">Cycle de vie de la session</H2>
      <P>
        Le client gère 5 événements que vous pouvez écouter via{" "}
        <Code>idn.on(event, cb)</Code> :
      </P>
      <DocTable
        headers={["Événement", "Émis lors de"]}
        rows={[
          ["signIn", "Authentification réussie (post-callback)"],
          ["signOut", "Déconnexion locale + back-channel"],
          ["session:expired", "Session expirée et refresh impossible"],
          ["token:refreshed", "Access token rafraîchi avec succès"],
          ["error", "Erreur OIDC (state, nonce, signature…)"],
        ]}
      />

      <H2 id="adaptateurs-de-stockage">Adaptateurs de stockage</H2>
      <P>
        4 adaptateurs livrés. Pour les apps sensibles, préférez{" "}
        <Code>sessionStorage</Code> ou un adapter custom (cookie httpOnly).
      </P>
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <FeatureCard title="localStorage">
          Défaut. Survit aux rafraîchissements, mais vulnérable au XSS.
        </FeatureCard>
        <FeatureCard title="sessionStorage">
          Cleared à la fermeture de l&apos;onglet. Plus sûr pour les apps
          sensibles.
        </FeatureCard>
        <FeatureCard title="memory">
          Aucune persistance. Utile pour les iframes ou tests.
        </FeatureCard>
        <FeatureCard title="Custom adapter">
          Implémentez l&apos;interface <Code>StorageAdapter</Code> pour utiliser
          un cookie httpOnly côté serveur.
        </FeatureCard>
      </div>
    </DocBody>
  )
}
