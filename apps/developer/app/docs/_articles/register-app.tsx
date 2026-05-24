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
  { label: "Comptes de test" },
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
            <span key="env">Toujours <Code>sandbox</Code> à la création. Le passage en <Code>production</Code> se demande depuis la fiche de l&apos;app et crée une <strong>jumelle</strong> avec des credentials distincts.</span>,
          ],
          [
            "Redirect URIs",
            "Une ou plusieurs URIs de callback exactes (HTTPS requis pour la demande de production)",
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
{`# Préfixes _sbx_ + idn_sk_test_ = environnement sandbox
IDN_CLIENT_ID=bourses-etudiantes_sbx_4wuB4g
IDN_CLIENT_SECRET=idn_sk_test_8H42x9Lp3Mq7WnRfGv2sZmTcUe1AhJ...
IDN_ISSUER=https://identite.ga`}
      </CodeBlock>
      <P>
        Les credentials suivent une convention type Stripe :{" "}
        <Code>_sbx_</Code> / <Code>_prd_</Code> dans le <Code>client_id</Code>,{" "}
        <Code>idn_sk_test_</Code> / <Code>idn_sk_live_</Code> dans le{" "}
        <Code>client_secret</Code>. Impossible de confondre les deux modes par
        construction. Les tokens émis portent en plus un claim{" "}
        <Code>env</Code> (<Code>sandbox</Code> ou <Code>production</Code>) que
        votre code peut vérifier après échange.
      </P>

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

      <H2 id="comptes-de-test">Comptes de test</H2>
      <P>
        En sandbox, seules les adresses IDN que <strong>vous déclarez
        explicitement</strong> peuvent se connecter à votre application — un
        utilisateur hors liste qui tente d&apos;y consentir voit l&apos;écran{" "}
        <em>« Accès sandbox refusé »</em>. C&apos;est volontaire : ça vous
        protège d&apos;un test accidentel par un vrai citoyen, et vous évite
        de polluer leurs traces de consentement.
      </P>
      <P>
        Depuis la fiche de votre app (<strong>Mes applications</strong> →{" "}
        ouvrir l&apos;app), la section <strong>Comptes de test</strong> permet
        d&apos;ajouter jusqu&apos;à 25 adresses. Le propriétaire de l&apos;app
        (vous) est toujours autorisé, même hors liste.
      </P>
      <Callout kind="info" title="Claim env dans vos tokens">
        Les ID tokens et la réponse <Code>/oauth2/userinfo</Code> retournés en
        sandbox portent <Code>env: &quot;sandbox&quot;</Code>. Vérifiez-le côté
        serveur pour interdire le déploiement d&apos;une clé sandbox en prod
        par erreur.
      </Callout>

      <H2 id="demander-la-production">Demander la production</H2>
      <P>
        Quand votre application est prête, ouvrez sa fiche dans{" "}
        <strong>Mes applications</strong> et cliquez{" "}
        <em>« Demander la production »</em>. Une <strong>application jumelle</strong>{" "}
        sera créée avec un nouveau <Code>client_id</Code> (<Code>_prd_</Code>)
        et un nouveau <Code>client_secret</Code> (<Code>idn_sk_live_</Code>).
        Votre sandbox reste vivante en parallèle pour les tests continus.
      </P>
      <P>
        Le compte développeur doit être <strong>validé par un super-administrateur</strong>{" "}
        avant qu&apos;une demande puisse être soumise — l&apos;équipe IDN
        vérifie d&apos;abord votre identité.
      </P>
      <Callout kind="info" title="Délai indicatif">
        48 à 72h ouvrées pour la revue de l&apos;app. L&apos;équipe IDN vérifie
        la conformité (mentions légales, RGPD, scopes justifiés, redirect URIs
        en HTTPS).
      </Callout>
    </DocBody>
  )
}
