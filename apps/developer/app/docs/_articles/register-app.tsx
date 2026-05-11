import Link from "next/link"

import { DocBody } from "../_components/doc-body"
import {
  Callout,
  Code,
  CodeBlock,
  DocTable,
  H1,
  H2,
  Lede,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Avant de commencer" },
  { label: "Créer l'application" },
  { label: "Récupérer les credentials" },
  { label: "Configurer les redirect URIs" },
  { label: "Demander la production" },
]

export default function RegisterApp() {
  return (
    <DocBody
      breadcrumbs={["Premiers pas", "Enregistrer une application"]}
      toc={TOC}
    >
      <H1>Enregistrer une application</H1>
      <Lede>
        Avant d&apos;écrire la moindre ligne de code, créez une application
        OAuth sur la{" "}
        <a
          href="/applications"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          console développeur
        </a>
        . Vous y obtiendrez un <Code>client_id</Code> et un{" "}
        <Code>client_secret</Code>.
      </Lede>

      <H2 id="avant-de-commencer">Avant de commencer</H2>
      <P>
        Il vous faut un compte IDN avec le profil <strong>Développeur</strong>.
        La création du profil dév est gratuite, immédiate, et ne nécessite pas
        d&apos;agrément officiel pour démarrer en environnement{" "}
        <Code>sandbox</Code>.
      </P>

      <H2 id="creer-l-application">Créer l&apos;application</H2>
      <P>
        Rendez-vous sur{" "}
        <a
          href="/applications/new"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          /applications/new
        </a>{" "}
        et renseignez :
      </P>
      <DocTable
        headers={["Champ", "Détails"]}
        rows={[
          [
            "Nom de l'application",
            "Affiché à l'utilisateur sur l'écran de consentement",
          ],
          [
            "Environnement",
            <span key="env"><Code>sandbox</Code> par défaut, <Code>production</Code> sur approbation</span>,
          ],
          [
            "Redirect URIs",
            "Une ou plusieurs URIs de callback exactes (HTTPS en production)",
          ],
          [
            "Scopes demandés",
            <span key="sc"><Code>openid</Code>, <Code>profile</Code>, <Code>email</Code>, plus claims étendus</span>,
          ],
          [
            "Niveau LoA minimum",
            "1, 2 ou 3 selon le degré de garantie d'identité requis",
          ],
        ]}
      />

      <H2 id="recuperer-les-credentials">Récupérer les credentials</H2>
      <P>
        Une fois l&apos;app créée, vous êtes redirigé vers un écran qui affiche
        le <Code>client_id</Code> et le <Code>client_secret</Code> en clair{" "}
        <strong>une seule fois</strong>. Copiez-les immédiatement dans votre
        gestionnaire de secrets.
      </P>
      <CodeBlock lang="env" title=".env.local">
{`IDN_CLIENT_ID=bourses-etudiantes-4wuB4g
IDN_CLIENT_SECRET=idn_sk_8H42x9Lp3Mq7WnRfGv2sZmTcUe1AhJ...
IDN_ISSUER=https://identite.ga`}
      </CodeBlock>

      <Callout kind="warn" title="Ne committez jamais le secret">
        Le <Code>client_secret</Code> est l&apos;équivalent d&apos;un mot de
        passe pour votre application. Stockez-le dans Vercel/AWS Secrets Manager
        ou équivalent, jamais dans Git. Voir le guide{" "}
        <Link
          href="/docs/security"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          Sécurité OIDC
        </Link>
        .
      </Callout>

      <H2 id="configurer-les-redirect-uris">
        Configurer les redirect URIs
      </H2>
      <P>
        Le serveur IDN refuse toute redirection qui ne matche pas exactement une
        URI enregistrée. Ajoutez toutes les URIs que vous utilisez (dev,
        staging, production) :
      </P>
      <CodeBlock lang="text">
{`# Production
https://votre-app.ga/auth/callback

# Staging
https://staging.votre-app.ga/auth/callback

# Développement local
http://localhost:3000/auth/callback`}
      </CodeBlock>
      <P>
        Vous pouvez régénérer le <Code>client_secret</Code> à tout moment depuis
        l&apos;onglet <strong>Clés &amp; secrets</strong> — l&apos;ancien est
        immédiatement invalidé.
      </P>

      <H2 id="demander-la-production">Demander la production</H2>
      <P>
        En sandbox, vous pouvez tester sans limite, mais seuls les comptes IDN
        de test peuvent se connecter. Pour ouvrir à de vrais utilisateurs,
        soumettez votre app à la revue : depuis l&apos;onglet{" "}
        <strong>Mes applications</strong>, ouvrez la fiche de l&apos;app puis
        cliquez « Demander l&apos;approbation pour la production ».
      </P>
      <Callout kind="info" title="Délai indicatif">
        48 à 72h ouvrées. L&apos;équipe IDN vérifie la conformité (mentions
        légales, RGPD, scope demandés justifiés, redirect URIs valides).
      </Callout>
    </DocBody>
  )
}
