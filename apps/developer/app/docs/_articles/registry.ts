/**
 * Registre des articles de documentation.
 *
 * Source de vérité pour :
 *   - la sidebar (groupes + ordre)
 *   - le routing (slug → composant)
 *   - le command palette ⌘K (titre + groupe)
 *
 * Articles "Bientôt" = features pas encore implémentées dans le SDK
 * (cf. cahier des charges §2 et roadmap interne). Ils apparaissent en
 * grisé dans la sidebar et leur page affiche un stub "En cours de
 * développement".
 */

import type { ComponentType } from "react"

import CoreApi from "./core-api"
import CoreOverview from "./core-overview"
import LoA from "./loa"
import MigrationClerk from "./migration-clerk"
import Playground from "./playground"
import QuickstartBetterAuth from "./quickstart-better-auth"
import QuickstartNextAuth from "./quickstart-nextauth"
import QuickstartReact from "./quickstart-react"
import QuickstartVanilla from "./quickstart-vanilla"
import ReactComponents from "./react-components"
import ReactHooks from "./react-hooks"
import RegisterApp from "./register-app"
import Security from "./security"

export interface ArticleMeta {
  slug: string
  label: string
  /** Titre H1 utilisé en absence de meta dans le composant */
  title: string
  /** Description courte (utilisée par le ⌘K + meta tags) */
  description?: string
  /** Article documente une feature pas encore livrée */
  comingSoon?: boolean
  /** Composant React qui rend l'article */
  component: ComponentType
}

export interface ArticleGroup {
  title: string
  items: ArticleMeta[]
}

export const ARTICLE_GROUPS: ArticleGroup[] = [
  {
    title: "PREMIERS PAS",
    items: [
      {
        slug: "register-app",
        label: "Enregistrer une application",
        title: "Enregistrer une application",
        description:
          "Créer un compte développeur, déclarer une application OAuth, récupérer client_id et client_secret.",
        component: RegisterApp,
      },
      {
        slug: "quickstart-better-auth",
        label: "Quick start · Better Auth",
        title: "Quick start · Better Auth",
        description:
          "Intégration en 5 minutes avec Better Auth + helper @idn-ga/better-auth.",
        component: QuickstartBetterAuth,
      },
      {
        slug: "quickstart-nextauth",
        label: "Quick start · NextAuth",
        title: "Quick start · NextAuth.js v5",
        description: "Provider IDN pour Auth.js v5+.",
        comingSoon: true,
        component: QuickstartNextAuth,
      },
      {
        slug: "quickstart-react",
        label: "Quick start · React",
        title: "Quick start · React + Vite",
        description: "SPA React avec <IDNProvider> + hooks headless.",
        component: QuickstartReact,
      },
      {
        slug: "quickstart-vanilla",
        label: "Quick start · vanilla JS",
        title: "Quick start · vanilla JavaScript",
        description: "Pour Vue, Svelte, vanilla, ou tout framework non-React.",
        component: QuickstartVanilla,
      },
    ],
  },
  {
    title: "@IDN/CORE",
    items: [
      {
        slug: "core-overview",
        label: "Présentation",
        title: "@idn-ga/core",
        description: "Client OIDC vanilla, zéro dépendance.",
        component: CoreOverview,
      },
      {
        slug: "core-api",
        label: "Référence API",
        title: "Référence API · @idn-ga/core",
        description: "API complète du client OIDC.",
        component: CoreApi,
      },
    ],
  },
  {
    title: "@IDN/REACT",
    items: [
      {
        slug: "react-hooks",
        label: "Hooks",
        title: "Hooks · @idn-ga/react",
        description: "5 hooks headless pour construire votre UI.",
        component: ReactHooks,
      },
      {
        slug: "react-components",
        label: "Composants",
        title: "Composants · @idn-ga/react",
        description: "Composants pré-stylés et utilitaires de rendu conditionnel.",
        component: ReactComponents,
      },
    ],
  },
  {
    title: "GUIDES",
    items: [
      {
        slug: "loa",
        label: "Niveaux de garantie (LoA)",
        title: "Niveaux de garantie (LoA)",
        description:
          "3 niveaux d'assurance d'identité alignés eIDAS. Exiger un niveau minimum.",
        component: LoA,
      },
      {
        slug: "security",
        label: "Sécurité OIDC",
        title: "Sécurité OIDC",
        description:
          "Garanties du SDK, stockage des tokens, refresh, logout, bug bounty.",
        component: Security,
      },
      {
        slug: "migration-clerk",
        label: "Migration depuis Clerk",
        title: "Migration depuis Clerk",
        description: "Procédure pas à pas pour basculer d'une app Clerk vers IDN.",
        component: MigrationClerk,
      },
    ],
  },
  {
    title: "OUTILS",
    items: [
      {
        slug: "playground",
        label: "Playground OIDC",
        title: "Playground OIDC",
        description: "Testez un flow OIDC complet sans coder.",
        comingSoon: true,
        component: Playground,
      },
    ],
  },
]

/** Lookup par slug */
export const ARTICLES_BY_SLUG: Record<string, ArticleMeta> = Object.fromEntries(
  ARTICLE_GROUPS.flatMap((g) => g.items).map((a) => [a.slug, a]),
)

/** Liste à plat pour le ⌘K + sitemap */
export const ARTICLES_FLAT: Array<ArticleMeta & { groupTitle: string }> =
  ARTICLE_GROUPS.flatMap((g) =>
    g.items.map((a) => ({ ...a, groupTitle: g.title })),
  )
