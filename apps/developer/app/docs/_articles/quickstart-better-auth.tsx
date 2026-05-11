import Link from "next/link"

import { DocBody } from "../_components/doc-body"
import {
  Callout,
  Code,
  CodeBlock,
  H1,
  H2,
  Lede,
  P,
  Ul,
} from "../_components/prose"

const TOC = [
  { label: "Prérequis" },
  { label: "1. Installer le package" },
  { label: "2. Configurer Better Auth" },
  { label: "3. Bouton de connexion" },
  { label: "4. Protéger les routes" },
  { label: "Et maintenant ?" },
]

export default function QuickstartBetterAuth() {
  return (
    <DocBody
      breadcrumbs={["Premiers pas", "Quick start · Better Auth"]}
      toc={TOC}
    >
      <H1>Quick start · Better Auth</H1>
      <Lede>
        L&apos;intégration la plus rapide. En 5 minutes, votre app Better Auth
        supporte « Se connecter avec IDN » en plus (ou à la place) des providers
        existants.
      </Lede>

      <Callout kind="success" title="Estimation : 5 minutes">
        Suppose que vous avez déjà une app Next.js + Better Auth fonctionnelle.
        Sinon, suivez d&apos;abord le quick start Better Auth officiel.
      </Callout>

      <H2 id="prerequis">Prérequis</H2>
      <Ul>
        <li>
          Better Auth ≥ <Code>1.4.0</Code> installé
        </li>
        <li>
          Plugin <Code>genericOAuth</Code> activé
        </li>
        <li>
          Application IDN enregistrée (voir{" "}
          <Link
            href="/docs/register-app"
            className="text-idn-green underline-offset-2 hover:underline"
          >
            Enregistrer une application
          </Link>
          )
        </li>
        <li>
          <Code>CLIENT_ID</Code> + <Code>CLIENT_SECRET</Code> récupérés
        </li>
      </Ul>

      <H2 id="1-installer-le-package">1. Installer le package</H2>
      <CodeBlock lang="bash" title="terminal">
{`# bun
bun add @idn-ga/better-auth

# pnpm
pnpm add @idn-ga/better-auth

# npm
npm install @idn-ga/better-auth`}
      </CodeBlock>

      <H2 id="2-configurer-better-auth">2. Configurer Better Auth</H2>
      <P>
        Dans votre <Code>lib/auth.ts</Code>, ajoutez le helper <Code>idn()</Code>{" "}
        à la liste des providers <Code>genericOAuth</Code> :
      </P>
      <CodeBlock lang="ts" title="lib/auth.ts">
{`import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { idn } from "@idn-ga/better-auth";

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        idn({
          clientId: process.env.IDN_CLIENT_ID!,
          clientSecret: process.env.IDN_CLIENT_SECRET!,
          acrValues: ["eidas2"], // niveau LoA 2 minimum
        }),
      ],
    }),
  ],
});`}
      </CodeBlock>

      <H2 id="3-bouton-de-connexion">3. Bouton de connexion</H2>
      <P>
        Côté client, déclenchez le flow avec <Code>signIn.oauth2</Code> :
      </P>
      <CodeBlock lang="tsx" title="components/SignInButton.tsx">
{`"use client";
import { authClient } from "@/lib/auth-client";

export function SignInButton() {
  return (
    <button onClick={() => authClient.signIn.oauth2({ providerId: "idn" })}>
      Se connecter avec IDN
    </button>
  );
}`}
      </CodeBlock>

      <H2 id="4-proteger-les-routes">4. Protéger les routes</H2>
      <P>
        Better Auth fournit <Code>auth.api.getSession</Code> côté serveur et{" "}
        <Code>useSession</Code> côté client. Aucune particularité IDN — la
        session contient l&apos;utilisateur mappé via{" "}
        <Code>mapProfileToUser</Code>.
      </P>
      <CodeBlock lang="tsx" title="app/dashboard/page.tsx">
{`import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) redirect("/login");

  return <h1>Bonjour {session.user.name}</h1>;
}`}
      </CodeBlock>

      <H2 id="et-maintenant">Et maintenant ?</H2>
      <Ul>
        <li>
          Exiger un{" "}
          <Link
            href="/docs/loa"
            className="text-idn-green underline-offset-2 hover:underline"
          >
            niveau LoA spécifique
          </Link>
        </li>
        <li>
          Récupérer des claims étendus via les{" "}
          <Link
            href="/docs/core-api"
            className="text-idn-green underline-offset-2 hover:underline"
          >
            scopes IDN
          </Link>
        </li>
        <li>
          Mettre en place la{" "}
          <Link
            href="/docs/security"
            className="text-idn-green underline-offset-2 hover:underline"
          >
            déconnexion fédérée
          </Link>
        </li>
        <li>
          Migrer depuis{" "}
          <Link
            href="/docs/migration-clerk"
            className="text-idn-green underline-offset-2 hover:underline"
          >
            Clerk
          </Link>{" "}
          vers IDN
        </li>
      </Ul>
    </DocBody>
  )
}
