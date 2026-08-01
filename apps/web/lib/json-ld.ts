import { absoluteUrl, SITE_NAME, SITE_URL } from "./seo"

/**
 * Composant utilitaire pour injecter du JSON-LD dans une page.
 * Usage : <JsonLd data={...} /> dans un Server Component.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data)
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: SITE_NAME,
    alternateName: ["IDN", "Identité Numérique du Gabon"],
    url: SITE_URL,
    logo: absoluteUrl("/icon"),
    description:
      "Plateforme d'identité numérique souveraine de la République Gabonaise, opérée par Ntsagui digital.",
    parentOrganization: {
      "@type": "Organization",
      name: "Ntsagui digital",
    },
    areaServed: {
      "@type": "Country",
      name: "Gabon",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+241-1407",
        contactType: "customer support",
        areaServed: "GA",
        availableLanguage: ["French", "Fang", "Myènè", "Punu", "Nzébi"],
      },
      {
        "@type": "ContactPoint",
        telephone: "+241-11-40-70-00",
        contactType: "customer support",
        areaServed: "Worldwide",
        availableLanguage: ["French"],
      },
      {
        "@type": "ContactPoint",
        email: "support@identite.ga",
        contactType: "customer support",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "248 boulevard du Bord de Mer, BP 12 345",
      addressLocality: "Libreville",
      addressCountry: "GA",
    },
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-GA",
    publisher: {
      "@type": "Organization",
      name: "Ntsagui digital",
    },
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }
}
