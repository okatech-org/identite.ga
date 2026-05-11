import { notFound } from "next/navigation"

import { ARTICLES_BY_SLUG } from "../_articles/registry"
import { DocsSidebar } from "../_components/sidebar"
import { ARTICLE_GROUPS } from "../_articles/registry"
import DocsHome from "../_articles/home"

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

/**
 * Catch-all route pour la doc :
 *   /docs                            → DocsHome (pas de sidebar)
 *   /docs/<slug>                     → article correspondant + sidebar
 *
 * On regroupe ici pour éviter de dupliquer le layout (sidebar conditionnelle).
 */
export default async function DocsCatchAll({ params }: PageProps) {
  const { slug } = await params
  const slugStr = slug?.[0]

  // Home
  if (!slugStr) {
    return <DocsHome />
  }

  const article = ARTICLES_BY_SLUG[slugStr]
  if (!article) {
    notFound()
  }

  const ArticleComponent = article.component
  return (
    <>
      <DocsSidebar />
      <article className="min-w-0 flex-1 overflow-y-auto">
        <ArticleComponent />
      </article>
    </>
  )
}

// Désactive le pré-rendu statique : la topbar lit `usePathname` pour calculer
// son état actif et son `href`, et on a vu Next servir du HTML mis en cache
// avec le markup figé sur "/docs". On revisitera (PPR / SSG + RSC dédiés)
// une fois le routing stabilisé.
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  return ARTICLE_GROUPS.flatMap((g) => g.items).map((a) => ({
    slug: [a.slug],
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const slugStr = slug?.[0]
  if (!slugStr) return { title: "Documentation" }
  const article = ARTICLES_BY_SLUG[slugStr]
  if (!article) return { title: "Article introuvable" }
  return {
    title: article.title,
    description: article.description,
  }
}
