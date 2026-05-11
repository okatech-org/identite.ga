import { DocBody } from "../_components/doc-body"
import {
  Callout,
  Code,
  CodeBlock,
  H1,
  H2,
  Lede,
  Ol,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Liste" },
  { label: "Render conditionnel" },
  { label: "Personnalisation" },
  { label: "Composants à venir" },
]

const SHIPPED: Array<{ name: string; desc: string }> = [
  {
    name: "<IDNProvider>",
    desc: "Provider racine. À monter une seule fois autour de l'app.",
  },
  {
    name: "<IDNSignInButton>",
    desc: "Bouton « Se connecter avec IDN » headless (overridable className/style).",
  },
  {
    name: "<IDNCallback>",
    desc: "À monter sur la route callback. Gère le retour OIDC (onSuccess / onError).",
  },
  {
    name: "<SignedIn>",
    desc: "Render conditionnel — enfants visibles si authentifié.",
  },
  {
    name: "<SignedOut>",
    desc: "Render conditionnel — enfants visibles si non authentifié.",
  },
  {
    name: "<RequireLoA level={n}>",
    desc: "Render conditionnel — exige un niveau LoA minimum.",
  },
]

const COMING: Array<{ name: string; desc: string }> = [
  {
    name: "<IDNUserButton>",
    desc: "Avatar + dropdown (profil, lien identite.ga, déconnexion).",
  },
  {
    name: "<IDNUserProfile>",
    desc: "Affichage profil — nom, badge LoA, email vérifié.",
  },
  {
    name: "<IDNLoading>",
    desc: "Skeleton pré-stylé pendant le chargement initial.",
  },
]

export default function ReactComponents() {
  return (
    <DocBody breadcrumbs={["@idn/react", "Composants"]} toc={TOC}>
      <H1>Composants · @idn/react</H1>
      <Lede>
        Composants <strong>100% optionnels</strong> — vous pouvez tout
        construire avec les hooks. Overridables via <Code>className</Code>,{" "}
        <Code>style</Code>, et slots dédiés.
      </Lede>

      <H2 id="liste">Liste</H2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SHIPPED.map((c) => (
          <div
            key={c.name}
            className="rounded-lg border border-idn-border bg-idn-surface p-3.5"
          >
            <div className="font-mono text-[12.5px] font-semibold text-idn-green">
              {c.name}
            </div>
            <div className="mt-1.5 text-[13px] leading-[1.5] text-idn-ink-2">
              {c.desc}
            </div>
          </div>
        ))}
      </div>

      <H2 id="render-conditionnel">Render conditionnel</H2>
      <P>
        Inspiré de l&apos;API Clerk. Pas de booléen à propager, pas de spinner
        manuel.
      </P>
      <CodeBlock lang="tsx">
{`<SignedOut>
  <IDNSignInButton />
</SignedOut>

<SignedIn>
  <RequireLoA level={2} fallback={<UpgradePrompt />}>
    <SignContractButton />
  </RequireLoA>
</SignedIn>`}
      </CodeBlock>

      <H2 id="personnalisation">Personnalisation</H2>
      <P>
        3 niveaux de personnalisation, du plus simple au plus profond :
      </P>
      <Ol>
        <li>
          <Code>className</Code> ou <Code>style</Code> sur les composants
          pré-stylés.
        </li>
        <li>
          Slots de rendu (à venir : <Code>renderTrigger</Code>,{" "}
          <Code>renderContent</Code>) sur les composants composés.
        </li>
        <li>
          Hooks headless seuls — ignorer les composants pré-stylés, tout
          réécrire avec votre design system.
        </li>
      </Ol>

      <H2 id="composants-a-venir">Composants à venir</H2>
      <Callout kind="info" title="Roadmap composants">
        Trois composants pré-stylés sont en cours de développement. En attendant,
        construisez-les à partir des hooks <Code>useUser()</Code>,{" "}
        <Code>useLoA()</Code> et <Code>useIDN()</Code>.
      </Callout>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {COMING.map((c) => (
          <div
            key={c.name}
            className="rounded-lg border border-dashed border-idn-border bg-idn-surface/40 p-3.5"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 font-mono text-[12.5px] font-semibold text-idn-muted">
                {c.name}
              </div>
              <span className="rounded-full bg-idn-surface-2 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-idn-muted">
                Bientôt
              </span>
            </div>
            <div className="mt-1.5 text-[13px] leading-[1.5] text-idn-muted">
              {c.desc}
            </div>
          </div>
        ))}
      </div>
    </DocBody>
  )
}
