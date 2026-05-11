import { DocBody } from "../_components/doc-body"
import {
  Code,
  CodeBlock,
  DocTable,
  H1,
  H2,
  Lede,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Liste des hooks" },
  { label: "useIDN()" },
  { label: "useUser()" },
  { label: "useSession()" },
  { label: "useAccessToken()" },
  { label: "useLoA()" },
]

export default function ReactHooks() {
  return (
    <DocBody breadcrumbs={["@idn-ga/react", "Hooks"]} toc={TOC}>
      <H1>Hooks · @idn-ga/react</H1>
      <Lede>
        5 hooks headless pour construire votre propre UI. Tous side-effect-safe,
        compatibles SSR (pas d&apos;accès à <Code>window</Code> au render
        serveur).
      </Lede>

      <H2 id="liste-des-hooks">Liste des hooks</H2>
      <DocTable
        headers={["Hook", "Retour", "Description"]}
        rows={[
          [
            "useIDN()",
            "{ isAuthenticated, isLoading, signIn, signOut, error }",
            "Hook principal — état global et méthodes.",
          ],
          [
            "useUser()",
            "{ user, isLoading, error }",
            "Claims du profil utilisateur.",
          ],
          [
            "useSession()",
            "{ session, accessToken, isLoading }",
            "Session complète (user + tokens).",
          ],
          [
            "useAccessToken()",
            "string | null",
            "Access token actuel, auto-refresh.",
          ],
          [
            "useLoA()",
            "{ loa, acr, hasMinimum(level) }",
            "Utilitaire de niveau de garantie.",
          ],
        ]}
      />

      <H2 id="useidn">useIDN()</H2>
      <P>Hook principal — état global et actions de session.</P>
      <CodeBlock lang="tsx">
{`const { isAuthenticated, isLoading, signIn, signOut, error } = useIDN();`}
      </CodeBlock>

      <H2 id="useuser">useUser()</H2>
      <P>
        Lit les claims du profil depuis la session locale. Pour récupérer une
        version fraîche depuis <Code>/userinfo</Code>, appelez{" "}
        <Code>refresh()</Code> sur le provider context.
      </P>
      <CodeBlock lang="tsx">
{`const { user, isLoading } = useUser();
// user?.email, user?.name, user?.loa, user?.profile_type, ...`}
      </CodeBlock>

      <H2 id="usesession">useSession()</H2>
      <P>Session complète, incluant access token et expiration.</P>
      <CodeBlock lang="tsx">
{`const { session, accessToken, isLoading } = useSession();
// session?.tokens.expiresAt`}
      </CodeBlock>

      <H2 id="useaccesstoken">useAccessToken()</H2>
      <P>
        Renvoie directement l&apos;access token courant, en déclenchant un
        refresh si l&apos;expiration approche (<Code>refreshThreshold</Code>{" "}
        configurable sur le client).
      </P>
      <CodeBlock lang="tsx">
{`const token = useAccessToken();
if (token) {
  await fetch("/api/secure", { headers: { Authorization: \`Bearer \${token}\` } });
}`}
      </CodeBlock>

      <H2 id="useloa">useLoA()</H2>
      <P>
        Pour gating fin sur le niveau de garantie sans avoir à parser le claim
        manuellement.
      </P>
      <CodeBlock lang="tsx">
{`const { loa, hasMinimum } = useLoA();

if (!hasMinimum(2)) {
  return <UpgradePrompt target={2} />;
}`}
      </CodeBlock>
    </DocBody>
  )
}
