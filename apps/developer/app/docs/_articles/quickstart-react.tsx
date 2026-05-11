import { DocBody } from "../_components/doc-body"
import {
  Code,
  CodeBlock,
  H1,
  H2,
  Lede,
  P,
} from "../_components/prose"

const TOC = [
  { label: "1. Installer" },
  { label: "2. Provider" },
  { label: "3. Hooks" },
  { label: "4. Page de callback" },
]

export default function QuickstartReact() {
  return (
    <DocBody
      breadcrumbs={["Premiers pas", "Quick start · React"]}
      toc={TOC}
    >
      <H1>Quick start · React + Vite</H1>
      <Lede>
        Pour une SPA React qui n&apos;utilise ni Better Auth ni NextAuth.{" "}
        <Code>@idn/react</Code> fournit un <Code>&lt;IDNProvider&gt;</Code> et
        des hooks headless.
      </Lede>

      <H2 id="1-installer">1. Installer</H2>
      <CodeBlock lang="bash" title="terminal">
{`bun add @idn/react @idn/core`}
      </CodeBlock>

      <H2 id="2-provider">2. Provider</H2>
      <P>
        Montez <Code>&lt;IDNProvider&gt;</Code> à la racine de votre app, une
        seule fois :
      </P>
      <CodeBlock lang="tsx" title="src/main.tsx">
{`import { createRoot } from "react-dom/client";
import { IDNProvider } from "@idn/react";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <IDNProvider
    clientId={import.meta.env.VITE_IDN_CLIENT_ID}
    redirectUri="http://localhost:5173/callback"
    scopes={["openid", "profile", "email"]}
  >
    <App />
  </IDNProvider>
);`}
      </CodeBlock>

      <H2 id="3-hooks">3. Hooks</H2>
      <P>
        Utilisez <Code>useIDN</Code>, <Code>useUser</Code>, et les composants
        conditionnels <Code>&lt;SignedIn&gt;</Code> /{" "}
        <Code>&lt;SignedOut&gt;</Code> :
      </P>
      <CodeBlock lang="tsx" title="src/Profile.tsx">
{`import { useIDN, useUser, SignedIn, SignedOut } from "@idn/react";

export function Profile() {
  const { signIn, signOut } = useIDN();
  const { user } = useUser();

  return (
    <>
      <SignedOut>
        <button onClick={() => signIn()}>Se connecter</button>
      </SignedOut>
      <SignedIn>
        <p>Bonjour {user?.name}</p>
        <button onClick={() => signOut()}>Déconnexion</button>
      </SignedIn>
    </>
  );
}`}
      </CodeBlock>

      <H2 id="4-page-de-callback">4. Page de callback</H2>
      <P>
        Montez le composant <Code>&lt;IDNCallback&gt;</Code> sur la route
        déclarée comme <Code>redirectUri</Code> :
      </P>
      <CodeBlock lang="tsx" title="src/routes/callback.tsx">
{`import { useNavigate } from "react-router-dom";
import { IDNCallback } from "@idn/react";

export default function Callback() {
  const navigate = useNavigate();
  return (
    <IDNCallback
      onSuccess={() => navigate("/dashboard")}
      onError={(err) => alert(err.message)}
    />
  );
}`}
      </CodeBlock>
    </DocBody>
  )
}
