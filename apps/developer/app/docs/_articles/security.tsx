import Link from "next/link"

import { DocBody } from "../_components/doc-body"
import {
  Callout,
  Code,
  H1,
  H2,
  Lede,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Garanties du SDK" },
  { label: "Stockage des tokens" },
  { label: "Refresh & rotation" },
  { label: "Logout fédéré" },
  { label: "Programme bug bounty" },
]

const GUARANTEES: Array<{ title: string; desc: string }> = [
  {
    title: "PKCE S256 obligatoire",
    desc: "Pas d'option pour désactiver, même en développement local.",
  },
  {
    title: "State vérifié",
    desc: "32 bytes aléatoires URL-safe, rejet strict au callback.",
  },
  {
    title: "Nonce dans l'ID token",
    desc: "Vérification cryptographique pour prévenir le replay.",
  },
  {
    title: "Redirect URI strict matching",
    desc: "Tout mismatch côté serveur rejette le callback.",
  },
  {
    title: "Signature ID token",
    desc: "Vérifiée via JWKS (RS256 ou ES256 uniquement).",
  },
  {
    title: "Refus de HS256",
    desc: "IDN n'en émet pas — toute tentative est rejetée par le SDK.",
  },
]

export default function Security() {
  return (
    <DocBody breadcrumbs={["Guides", "Sécurité OIDC"]} toc={TOC}>
      <H1>Sécurité OIDC</H1>
      <Lede>
        Le SDK IDN implémente l&apos;état de l&apos;art de la sécurité OAuth
        2.1 / OIDC. Voici ce qui est garanti d&apos;office et ce que vous devez
        configurer.
      </Lede>

      <H2 id="garanties-du-sdk">Garanties du SDK</H2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {GUARANTEES.map((g) => (
          <div
            key={g.title}
            className="flex items-start gap-2.5 rounded-lg border border-idn-border bg-idn-surface p-3.5"
          >
            <span className="mt-0.5 text-idn-green">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12l5 5 9-11" />
              </svg>
            </span>
            <div>
              <div className="text-[13px] font-semibold text-idn-ink">
                {g.title}
              </div>
              <div className="mt-1 text-[12.5px] leading-[1.5] text-idn-ink-2">
                {g.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <H2 id="stockage-des-tokens">Stockage des tokens</H2>
      <Callout kind="warn" title="Le localStorage est vulnérable au XSS">
        Pour les apps qui manipulent des données régaliennes (impôts, santé,
        état civil), préférez <Code>sessionStorage</Code> ou un adapter cookie
        httpOnly côté serveur. Voir{" "}
        <Link
          href="/docs/core-overview"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          adaptateurs de stockage
        </Link>
        .
      </Callout>

      <H2 id="refresh-rotation">Refresh &amp; rotation</H2>
      <P>
        Le serveur IDN active la <strong>rotation</strong> des refresh tokens. Si
        un ancien refresh token est réutilisé après rotation, le SDK déclenche
        l&apos;événement <Code>session:expired</Code>, vide le storage, et vous
        pouvez rediriger vers la page de login. Toute tentative d&apos;attaque
        par vol de token déclenche une révocation immédiate côté serveur.
      </P>

      <H2 id="logout-federe">Logout fédéré</H2>
      <P>Deux mécanismes complémentaires :</P>
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <div className="rounded-lg border border-idn-border bg-idn-surface p-4">
          <div className="text-[13px] font-semibold text-idn-ink">
            Front-channel
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-idn-ink-2">
            Redirection vers <Code>/oauth2/sessions/logout</Code> côté IDN.
            Déconnecte la session IDN et toutes les apps tierces.
          </p>
        </div>
        <div className="rounded-lg border border-idn-border bg-idn-surface p-4">
          <div className="text-[13px] font-semibold text-idn-ink">
            Back-channel
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-idn-ink-2">
            Webhook reçu sur votre serveur quand l&apos;utilisateur se déconnecte
            ailleurs. Invalidez la session côté votre app.
          </p>
        </div>
      </div>

      <H2 id="programme-bug-bounty">Programme bug bounty</H2>
      <Callout kind="success" title="security@identite.ga">
        Une faille découverte ? Disclosure responsable récompensée. Voir{" "}
        <a
          href="https://identite.ga/security"
          target="_blank"
          rel="noreferrer noopener"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          identite.ga/security
        </a>
        . Récompenses graduées de 250 € à 25 000 € selon la sévérité.
      </Callout>
    </DocBody>
  )
}
