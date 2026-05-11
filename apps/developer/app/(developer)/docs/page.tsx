/**
 * Documentation — port de idn-desktop.jsx:2820+.
 * Split layout : sidebar 240px + contenu. Page initiale = "Helper idn()".
 */
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"
import { fr } from "../../_content/fr"

type DocSection = {
  title: string
  items: { label: string; active?: boolean }[]
}

const SECTIONS: DocSection[] = [
  {
    title: fr.docs.sections.gettingStarted,
    items: [
      { label: fr.docs.items.quickStart },
      { label: fr.docs.items.integrationPath },
      { label: fr.docs.items.loa },
    ],
  },
  {
    title: fr.docs.sections.betterAuth,
    items: [
      { label: fr.docs.items.helperIdn, active: true },
      { label: fr.docs.items.profileMapping },
      { label: fr.docs.items.genericOAuth },
    ],
  },
  {
    title: fr.docs.sections.core,
    items: [
      { label: fr.docs.items.createClient },
      { label: fr.docs.items.signInOut },
      { label: fr.docs.items.handleCallback },
    ],
  },
  {
    title: fr.docs.sections.react,
    items: [
      { label: fr.docs.items.providerComponent },
      { label: fr.docs.items.useUser },
      { label: fr.docs.items.useSession },
    ],
  },
  {
    title: fr.docs.sections.oidc,
    items: [
      { label: fr.docs.items.discovery },
      { label: fr.docs.items.authzPkce },
      { label: fr.docs.items.jwks },
    ],
  },
]

export default function DocsPage() {
  return (
    <>
      <OpHeader sub={fr.docs.sub} title={fr.docs.title} />
      <div className="flex flex-1 min-h-0">
        <aside className="hidden w-[240px] shrink-0 overflow-auto border-r border-idn-border bg-idn-surface py-4 md:block">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-3 px-2.5">
              <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                {section.title}
              </div>
              <ul className="space-y-px">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <span
                      className={`block rounded-md px-2.5 py-1.5 text-[13px] ${
                        item.active
                          ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18]"
                          : "text-idn-ink-2"
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <article className="flex-1 overflow-auto px-7 py-6">
          <div className="mx-auto max-w-[760px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
              {fr.docs.helper.eyebrow}
            </p>
            <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.016em] text-idn-ink">
              {fr.docs.helper.title}
            </h2>
            <p className="mt-3 max-w-[620px] text-sm leading-[1.6] text-idn-ink-2">
              S&apos;utilise comme{" "}
              <code className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[13px]">
                auth0()
              </code>
              ,{" "}
              <code className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[13px]">
                keycloak()
              </code>
              ,{" "}
              <code className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[13px]">
                okta()
              </code>{" "}
              dans Better Auth. Auto-configure le discovery, les scopes par défaut, PKCE et le mapping du profil.
            </p>

            <pre className="mt-5 overflow-x-auto rounded-lg bg-[#0E110D] p-4 font-mono text-[12px] leading-[1.7] text-[#E6F2EA]">
{`import { genericOAuth } from "better-auth/plugins";
import { idn } from "@idn/better-auth";

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        idn({
          clientId: process.env.IDN_CLIENT_ID!,
          clientSecret: process.env.IDN_CLIENT_SECRET!,
          // optionnel — override de l'issuer par défaut
          issuer: "https://identite.ga",
        }),
      ],
    }),
  ],
});

// Côté client
await authClient.signIn.oauth2({ providerId: "idn" });`}
            </pre>

            <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#E6EEF7] p-3.5 text-[12px] text-idn-ink-2 dark:bg-[#10243A]">
              <span className="mt-0.5 text-[#2563AC]">{IdnIcons.shield}</span>
              <p className="flex flex-wrap items-center gap-1.5">
                {fr.docs.helper.infoLeading}{" "}
                <code className="rounded bg-idn-surface-2 px-1.5 py-0.5 font-mono text-[12px]">
                  scopes: [&quot;profile&quot;, &quot;email&quot;, &quot;loa:2&quot;]
                </code>
              </p>
            </div>
          </div>
        </article>
      </div>
    </>
  )
}
