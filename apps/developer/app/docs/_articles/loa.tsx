import { DocBody } from "../_components/doc-body"
import {
  Callout,
  Code,
  CodeBlock,
  FeatureCard,
  H1,
  H2,
  Lede,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Les 3 niveaux" },
  { label: "Exiger un niveau" },
  { label: "Gating dans l'app" },
  { label: "Step-up authentication" },
]

export default function LoA() {
  return (
    <DocBody breadcrumbs={["Guides", "Niveaux de garantie (LoA)"]} toc={TOC}>
      <H1>Niveaux de garantie (LoA)</H1>
      <Lede>
        IDN propose 3 niveaux d&apos;assurance d&apos;identité, alignés avec le
        règlement <strong>eIDAS</strong>. Votre app peut exiger un niveau
        minimum lors de l&apos;authentification.
      </Lede>

      <H2 id="les-3-niveaux">Les 3 niveaux</H2>
      <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
        <FeatureCard title="Niveau 1 — Faible" accent="muted">
          <div className="font-mono text-[12px] text-idn-muted">
            acr_values = &quot;eidas1&quot;
          </div>
          <div className="mt-2">
            Email vérifié. Services informatifs, e-Visa.
          </div>
          <div className="mt-1 text-[12px] text-idn-muted">
            Ex. : newsletter, portail informatif
          </div>
        </FeatureCard>
        <FeatureCard title="Niveau 2 — Substantiel" accent="blue">
          <div className="font-mono text-[12px] text-[#2563AC]">
            acr_values = &quot;eidas2&quot;
          </div>
          <div className="mt-2">
            Document d&apos;identité + selfie liveness. Résidents.
          </div>
          <div className="mt-1 text-[12px] text-idn-muted">
            Ex. : démarches consulaires, e-commerce sensible
          </div>
        </FeatureCard>
        <FeatureCard title="Niveau 3 — Élevé" accent="green">
          <div className="font-mono text-[12px] text-idn-green">
            acr_values = &quot;eidas3&quot;
          </div>
          <div className="mt-2">
            Entretien vidéo + validation manuelle par un contrôleur habilité.
          </div>
          <div className="mt-1 text-[12px] text-idn-muted">
            Ex. : impôts, santé, signature qualifiée
          </div>
        </FeatureCard>
      </div>

      <H2 id="exiger-un-niveau">Exiger un niveau</H2>
      <P>
        Passez <Code>acrValues</Code> à la configuration du client. Si
        l&apos;utilisateur n&apos;a pas atteint ce niveau, IDN le guidera dans
        le parcours d&apos;upgrade KYC avant de revenir à votre app.
      </P>
      <CodeBlock lang="ts">
{`createIDNClient({
  clientId: "impots-ga",
  redirectUri: "https://impots.ga/callback",
  acrValues: ["eidas3"], // niveau 3 obligatoire
});`}
      </CodeBlock>

      <H2 id="gating-dans-l-app">Gating dans l&apos;app</H2>
      <P>
        Pour des sections internes qui exigent un niveau plus élevé que la
        connexion initiale, utilisez <Code>&lt;RequireLoA&gt;</Code> ou le hook{" "}
        <Code>useLoA()</Code> :
      </P>
      <CodeBlock lang="tsx">
{`<RequireLoA level={3} fallback={<UpgradePrompt target={3} />}>
  <SignTaxReturnButton />
</RequireLoA>`}
      </CodeBlock>

      <H2 id="step-up-authentication">Step-up authentication</H2>
      <Callout
        kind="info"
        title="L'utilisateur reste connecté pendant l'upgrade"
      >
        Si une action requiert un niveau supérieur en cours de session, appelez{" "}
        <Code>idn.signIn(&#123; acrValues: [&quot;eidas3&quot;] &#125;)</Code>.
        IDN propose le KYC vidéo puis renvoie à votre app — la session est
        conservée et les claims du token sont mis à jour.
      </Callout>
    </DocBody>
  )
}
