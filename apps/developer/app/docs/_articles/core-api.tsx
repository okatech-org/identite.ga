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
  { label: "createIDNClient" },
  { label: "Méthodes" },
  { label: "IDNUser (claims)" },
]

export default function CoreApi() {
  return (
    <DocBody
      breadcrumbs={["@idn/core", "Référence API"]}
      toc={TOC}
    >
      <H1>Référence API · @idn/core</H1>
      <Lede>
        API complète du client OIDC vanilla. Toutes les méthodes sont
        disponibles sur l&apos;instance retournée par{" "}
        <Code>createIDNClient(...)</Code>.
      </Lede>

      <H2 id="createidnclient">createIDNClient</H2>
      <P>
        Factory qui crée un client OIDC. Voir{" "}
        <a
          href="/docs/core-overview"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          Présentation
        </a>{" "}
        pour la signature complète des options.
      </P>
      <CodeBlock lang="ts">
{`function createIDNClient(config: IDNClientConfig): IDNClient`}
      </CodeBlock>

      <H2 id="methodes">Méthodes</H2>
      <DocTable
        headers={["Méthode", "Retour", "Description"]}
        rows={[
          [
            "signIn(opts?)",
            "Promise<void>",
            "Démarre le flow OIDC, redirige vers IDN.",
          ],
          [
            "handleCallback()",
            "Promise<IDNSession>",
            "Traite le retour, échange le code contre les tokens.",
          ],
          [
            "signOut(opts?)",
            "Promise<void>",
            "Clear local + back-channel logout.",
          ],
          [
            "getSession()",
            "Promise<IDNSession | null>",
            "Session courante (user + tokens) ou null.",
          ],
          [
            "getUser()",
            "Promise<IDNUser | null>",
            "Profil utilisateur courant, ou null si pas connecté.",
          ],
          [
            "getAccessToken()",
            "Promise<string | null>",
            "Access token, refresh auto si expirant.",
          ],
          [
            "refreshToken()",
            "Promise<IDNTokens | null>",
            "Force un refresh du token.",
          ],
          [
            "isAuthenticated()",
            "boolean",
            "Test synchrone basé sur le stockage local.",
          ],
          [
            "on(event, cb)",
            "() => void",
            "Écoute d'événements. Retourne un unsubscribe.",
          ],
          [
            "off(event, cb)",
            "void",
            "Désinscription manuelle du listener.",
          ],
          [
            "revoke()",
            "Promise<void>",
            "Révoque access + refresh tokens côté serveur.",
          ],
        ]}
      />

      <H2 id="idnuser-claims">IDNUser (claims)</H2>
      <P>
        Type retourné par <Code>getUser()</Code>. Les claims marqués optionnels
        dépendent du niveau LoA et des scopes consentis.
      </P>
      <CodeBlock lang="ts">
{`interface IDNUser {
  sub: string;                                       // identifiant IDN stable
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string;                                // ISO 8601
  gender?: "male" | "female" | "other";
  nationality?: string;
  profile_type?: "citizen" | "resident" | "visitor" | "developer";
  acr?: "eidas1" | "eidas2" | "eidas3";
  loa?: 1 | 2 | 3;
  picture?: string;
  updated_at?: number;
  [claim: string]: unknown;                          // claims custom
}`}
      </CodeBlock>
    </DocBody>
  )
}
