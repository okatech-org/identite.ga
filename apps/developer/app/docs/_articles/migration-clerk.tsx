import { DocBody } from "../_components/doc-body"
import {
  Code,
  DocTable,
  H1,
  H2,
  Lede,
  Ol,
  P,
} from "../_components/prose"

const TOC = [
  { label: "Pourquoi migrer ?" },
  { label: "Mapping des concepts" },
  { label: "Migration étape par étape" },
  { label: "Plan de bascule production" },
]

export default function MigrationClerk() {
  return (
    <DocBody breadcrumbs={["Guides", "Migration depuis Clerk"]} toc={TOC}>
      <H1>Migration depuis Clerk</H1>
      <Lede>
        Cas concret : <strong>consulat.ga</strong> a basculé de Clerk vers IDN
        en 4 jours-homme. Ce guide décrit pas à pas la procédure pour une app
        Next.js équivalente.
      </Lede>

      <H2 id="pourquoi-migrer">Pourquoi migrer ?</H2>
      <P>
        Réutilisation de l&apos;identité gabonaise officielle, conformité
        eIDAS, suppression du vendor lock-in, économie sur les MAU Clerk, audit
        de sécurité national.
      </P>

      <H2 id="mapping-des-concepts">Mapping des concepts</H2>
      <DocTable
        headers={["Clerk", "IDN", "Notes"]}
        rows={[
          [
            "<ClerkProvider>",
            "<IDNProvider>",
            "Wrapper racine — props équivalents (clientId, redirectUri)",
          ],
          [
            "<SignIn>",
            "<IDNSignInButton>",
            "Bouton CTA, redirige vers connect.identite.ga",
          ],
          ["<SignedIn> / <SignedOut>", "idem", "API identique, drop-in"],
          [
            "useUser()",
            "useUser()",
            "Claims similaires, ajout de loa / profile_type",
          ],
          [
            "useAuth()",
            "useIDN()",
            "État global + méthodes signIn/signOut",
          ],
          [
            "Organizations",
            "profile_type",
            "Pas d'orgs natives — utiliser un claim custom",
          ],
        ]}
      />

      <H2 id="migration-etape-par-etape">Migration étape par étape</H2>
      <Ol>
        <li>
          <strong>Enregistrer l&apos;app IDN.</strong> Sur la console
          développeur, déclarer les mêmes redirect URIs que sur Clerk pour
          permettre une bascule par feature-flag sans reconfigurer les apps.
        </li>
        <li>
          <strong>Installer <Code>@idn/react</Code>.</strong> Garder{" "}
          <Code>@clerk/nextjs</Code> en parallèle pendant la phase de transition.
        </li>
        <li>
          <strong>Remplacer le provider.</strong> <Code>&lt;ClerkProvider&gt;</Code> →{" "}
          <Code>&lt;IDNProvider&gt;</Code>. Mapper{" "}
          <Code>publishableKey</Code> → <Code>clientId</Code>.
        </li>
        <li>
          <strong>Trouver-remplacer les composants.</strong> Find&amp;replace IDE
          : <Code>ClerkProvider</Code>, <Code>SignIn</Code>,{" "}
          <Code>UserButton</Code>, etc.
        </li>
        <li>
          <strong>Mapper les claims persistés.</strong> Migration script SQL :{" "}
          <Code>clerk_user_id</Code> → <Code>idn_sub</Code>. Conservez les deux
          champs pendant la rétention pour pouvoir rollback.
        </li>
        <li>
          <strong>Tester en sandbox.</strong> 24-48h en parallèle des deux
          providers via feature flag, sur 10 % du trafic.
        </li>
        <li>
          <strong>Bascule production.</strong> Augmenter le feature flag par
          paliers (10 → 50 → 100 %). Rollback prévu si métriques d&apos;erreur
          remontent.
        </li>
      </Ol>

      <H2 id="plan-de-bascule-production">Plan de bascule production</H2>
      <P>
        Plan-type sur 4 jours-homme pour une app Next.js Server Components avec
        sessions Clerk, 50k MAU, deux environnements (staging + prod) :
      </P>
      <DocTable
        headers={["Jour", "Étapes", "Risque"]}
        rows={[
          ["J-3", "Enregistrement app IDN + bascule du provider en staging", "Faible"],
          ["J-2", "Migration SQL + tests des cas critiques (paiement, KYC)", "Moyen"],
          ["J-1", "Bascule production à 10% via feature flag", "Moyen"],
          ["J", "Suivi métriques 24h, ramp à 100% si OK, ou rollback", "Variable"],
        ]}
      />
    </DocBody>
  )
}
