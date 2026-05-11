import { DocBody } from "../_components/doc-body"
import {
  Callout,
  Code,
  CodeBlock,
  H1,
  H2,
  Lede,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Installation" },
  { label: "Création du client" },
  { label: "Bouton de connexion" },
  { label: "Traiter le callback" },
]

export default function QuickstartVanilla() {
  return (
    <DocBody
      breadcrumbs={["Premiers pas", "Quick start · vanilla JS"]}
      toc={TOC}
    >
      <H1>Quick start · vanilla JavaScript</H1>
      <Lede>
        Pour Vue, Svelte, vanilla, ou tout framework non-React.{" "}
        <Code>@idn-ga/core</Code> est zéro dépendance et fonctionne dans le
        navigateur sans bundler.
      </Lede>

      <H2 id="installation">Installation</H2>
      <CodeBlock lang="bash" title="terminal">
{`bun add @idn-ga/core`}
      </CodeBlock>
      <P>Ou par CDN, sans bundler :</P>
      <CodeBlock lang="html">
{`<script type="module">
  import { createIDNClient } from "https://esm.sh/@idn-ga/core@1";
</script>`}
      </CodeBlock>

      <H2 id="creation-du-client">Création du client</H2>
      <CodeBlock lang="js" title="auth.js">
{`import { createIDNClient } from "@idn-ga/core";

export const idn = createIDNClient({
  clientId: "votre-client-id",
  redirectUri: "https://votre-app.ga/auth/callback",
  scopes: ["openid", "profile", "email"],
  acrValues: ["eidas2"],
});`}
      </CodeBlock>

      <H2 id="bouton-de-connexion">Bouton de connexion</H2>
      <CodeBlock lang="html">
{`<button id="login">Se connecter avec IDN</button>

<script type="module">
  import { idn } from "./auth.js";
  document.getElementById("login").onclick = () => idn.signIn();
</script>`}
      </CodeBlock>

      <H2 id="traiter-le-callback">Traiter le callback</H2>
      <CodeBlock lang="js" title="callback.js">
{`import { idn } from "./auth.js";

await idn.handleCallback();
const user = await idn.getUser();
console.log("Bonjour", user.name);

// Rediriger vers l'app
window.location.href = "/dashboard";`}
      </CodeBlock>

      <Callout kind="info" title="Et la déconnexion ?">
        Appelez <Code>idn.signOut()</Code>. Cela vide le stockage local et
        redirige vers l&apos;endpoint <Code>/oauth2/sessions/logout</Code> d&apos;IDN
        pour déconnecter aussi la session côté plateforme.
      </Callout>
    </DocBody>
  )
}
