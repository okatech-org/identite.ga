import type { Metadata } from "next"
import type { ReactNode } from "react"
import {
  Activity,
  AppWindow,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Plus,
  RadioTower,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Trash2,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import styles from "./mockups.module.css"

export const metadata: Metadata = {
  title: "Maquettes des portails administrateur et développeur",
  description:
    "Proposition complète de refonte UI et UX des portails Identité Numérique.",
  robots: { index: false, follow: false },
}

type Portal = "developer" | "admin"
type Tone = "green" | "blue" | "yellow" | "red" | "neutral"

const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ")

const DEV_NAV: Array<[string, LucideIcon]> = [
  ["Applications", Boxes],
  ["Clés API", KeyRound],
  ["Documentation", BookOpen],
  ["Usage", BarChart3],
  ["Paramètres", Settings],
]

const ADMIN_NAV: Array<[string, LucideIcon]> = [
  ["Vue d’ensemble", LayoutDashboard],
  ["Applications OAuth", AppWindow],
  ["Comptes IDN", Users],
  ["Audit", FileText],
  ["Habilitations", ShieldCheck],
  ["Canaux", RadioTower],
]

const PROVIDER_MOCKS: Array<
  [string, string, string, string, string, LucideIcon]
> = [
  [
    "Email transactionnel",
    "Resend",
    "Opérationnel",
    "12 482 envois",
    "99,7 % livrés",
    Mail,
  ],
  [
    "SMS de sécurité",
    "Aucun provider",
    "Non configuré",
    "0 envoi",
    "Phase 2",
    RadioTower,
  ],
]

function FlagMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cx(styles.flagMark, compact && styles.flagMarkCompact)}>
      <i />
      <i />
      <i />
    </span>
  )
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <span className={cx(styles.pill, styles[`tone${tone}`])}>{children}</span>
  )
}

function MockButton({
  children,
  tone = "primary",
  icon: Icon,
}: {
  children: ReactNode
  tone?: "primary" | "secondary" | "danger" | "quiet"
  icon?: LucideIcon
}) {
  return (
    <span className={cx(styles.mockButton, styles[`button${tone}`])}>
      {Icon ? <Icon size={12} strokeWidth={1.9} /> : null}
      {children}
    </span>
  )
}

function Panel({
  title,
  meta,
  children,
  className,
}: {
  title?: ReactNode
  meta?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx(styles.panel, className)}>
      {title || meta ? (
        <header className={styles.panelHead}>
          <div>{title ? <h4>{title}</h4> : null}</div>
          {meta ? <div>{meta}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  hint,
  mono = false,
}: {
  label: string
  value: ReactNode
  hint?: string
  mono?: boolean
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <b className={mono ? styles.mono : undefined}>{value}</b>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function Metric({
  label,
  value,
  delta,
  tone = "green",
}: {
  label: string
  value: string
  delta: string
  tone?: Tone
}) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={styles[`text${tone}`]}>{delta}</small>
    </div>
  )
}

function Bars({
  values = [22, 30, 27, 46, 39, 57, 49, 67, 55, 74, 70, 84],
}: {
  values?: number[]
}) {
  return (
    <div className={styles.bars} aria-hidden>
      {values.map((value, index) => (
        <i key={`${value}-${index}`} style={{ height: `${value}%` }} />
      ))}
    </div>
  )
}

function MiniTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className={styles.tableWrap}>
      <div
        className={styles.tableRow}
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
        }}
      >
        {headers.map((header) => (
          <b key={header}>{header}</b>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          className={styles.tableRow}
          style={{
            gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
          }}
          key={rowIndex}
        >
          {row.map((cell, cellIndex) => (
            <span key={cellIndex}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className={styles.codeBlock}>
      <span className={styles.codeDots}>● ● ●</span>
      <code>{children}</code>
    </pre>
  )
}

function MockSidebar({ portal, active }: { portal: Portal; active: string }) {
  const items = portal === "developer" ? DEV_NAV : ADMIN_NAV
  return (
    <aside className={styles.mockSidebar}>
      <div className={styles.mockBrand}>
        <FlagMark compact />
        <div>
          <strong>IDN Gabon</strong>
          <span>
            {portal === "developer" ? "Développeurs" : "Administration"}
          </span>
        </div>
      </div>
      <div className={styles.environment}>
        <span className={styles.liveDot} />
        {portal === "developer" ? "Espace partenaire" : "Réseau souverain"}
        <ChevronDown size={11} />
      </div>
      <nav>
        {items.map(([label, Icon]) => (
          <div
            key={label}
            className={cx(
              styles.mockNavItem,
              label === active && styles.mockNavActive,
            )}
          >
            <Icon size={14} strokeWidth={1.8} />
            <span>{label}</span>
            {label === "Applications" || label === "Applications OAuth" ? (
              <em>{portal === "developer" ? "3" : "24"}</em>
            ) : null}
          </div>
        ))}
      </nav>
      <div className={styles.sideNote}>
        <ShieldCheck size={15} />
        <div>
          <b>Services opérationnels</b>
          <span>Dernier contrôle il y a 2 min</span>
        </div>
      </div>
      <div className={styles.mockUser}>
        <span>{portal === "developer" ? "AM" : "PN"}</span>
        <div>
          <b>{portal === "developer" ? "Ariane Mba" : "Patrick Nze"}</b>
          <small>
            {portal === "developer" ? "Développeuse" : "Administrateur"}
          </small>
        </div>
        <MoreHorizontal size={13} />
      </div>
    </aside>
  )
}

function MockFrame({
  number,
  route,
  portal,
  active,
  eyebrow,
  title,
  action,
  children,
  plain = false,
}: {
  number: string
  route: string
  portal: Portal
  active: string
  eyebrow: string
  title: string
  action?: ReactNode
  children: ReactNode
  plain?: boolean
}) {
  return (
    <figure className={styles.frame}>
      <figcaption>
        <span>{number}</span>
        <strong>{title}</strong>
        <code>{route}</code>
      </figcaption>
      <div
        className={cx(
          styles.browser,
          portal === "admin" && styles.browserAdmin,
        )}
      >
        <div className={styles.browserBar}>
          <span className={styles.windowDots}>● ● ●</span>
          <span className={styles.address}>{route}</span>
          <span className={styles.browserTools}>↻ ···</span>
        </div>
        {plain ? (
          <div className={styles.plainViewport}>{children}</div>
        ) : (
          <div className={styles.viewport}>
            <MockSidebar portal={portal} active={active} />
            <div className={styles.mockMain}>
              <header className={styles.mockTopbar}>
                <div>
                  <span>{eyebrow}</span>
                  <h3>{title}</h3>
                </div>
                <div className={styles.topActions}>
                  <span className={styles.iconButton}>
                    <Search size={14} />
                  </span>
                  <span className={styles.iconButton}>
                    <Bell size={14} />
                  </span>
                  {action}
                </div>
              </header>
              <div className={styles.mockCanvas}>{children}</div>
            </div>
          </div>
        )}
      </div>
    </figure>
  )
}

function Journey({
  id,
  index,
  portal,
  title,
  description,
  screens,
  children,
}: {
  id: string
  index: string
  portal: Portal
  title: string
  description: string
  screens: string
  children: ReactNode
}) {
  return (
    <section className={styles.journey} id={id}>
      <header className={styles.journeyHead}>
        <span
          className={cx(
            styles.journeyIndex,
            portal === "admin" && styles.journeyIndexAdmin,
          )}
        >
          {index}
        </span>
        <div>
          <div className={styles.journeyMeta}>
            {portal === "developer"
              ? "Parcours développeur"
              : "Parcours administrateur"}
            <i>·</i>
            {screens}
          </div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className={styles.screenRow}>{children}</div>
    </section>
  )
}

function AuthLayout({
  portal,
  step,
  title,
  subtitle,
  children,
  asideTitle,
  asideText,
}: {
  portal: Portal
  step: string
  title: string
  subtitle: string
  children: ReactNode
  asideTitle: string
  asideText: string
}) {
  return (
    <div
      className={cx(styles.authLayout, portal === "admin" && styles.authAdmin)}
    >
      <aside className={styles.authAside}>
        <div className={styles.authBrand}>
          <FlagMark />
          <span>
            Identité Numérique
            <br />
            <b>République Gabonaise</b>
          </span>
        </div>
        <div className={styles.authAsideCopy}>
          <span>
            {portal === "developer"
              ? "CONSTRUIRE AVEC IDN"
              : "ACCÈS SOUS CONTRÔLE"}
          </span>
          <h3>{asideTitle}</h3>
          <p>{asideText}</p>
        </div>
        <div className={styles.authTrust}>
          <ShieldCheck size={15} />
          <span>OIDC · PKCE · journalisation nationale</span>
        </div>
      </aside>
      <main className={styles.authMain}>
        <div className={styles.authStep}>{step}</div>
        <div className={styles.authCard}>
          <h3>{title}</h3>
          <p>{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  )
}

function ChoiceCard({
  icon: Icon,
  title,
  text,
  selected = false,
}: {
  icon: LucideIcon
  title: string
  text: string
  selected?: boolean
}) {
  return (
    <div className={cx(styles.choiceCard, selected && styles.choiceSelected)}>
      <span>
        <Icon size={15} />
      </span>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
      {selected ? <CheckCircle2 size={14} /> : null}
    </div>
  )
}

function Timeline({
  items,
}: {
  items: Array<{ title: string; detail: string; tone?: Tone }>
}) {
  return (
    <ol className={styles.timeline}>
      {items.map((item, index) => (
        <li key={item.title}>
          <i className={styles[`dot${item.tone ?? "green"}`]} />
          <div>
            <b>{item.title}</b>
            <span>{item.detail}</span>
          </div>
          <time>{index === 0 ? "à l’instant" : `${index * 9} min`}</time>
        </li>
      ))}
    </ol>
  )
}

function SectionIntro({
  id,
  portal,
  kicker,
  title,
  text,
}: {
  id: string
  portal: Portal
  kicker: string
  title: string
  text: string
}) {
  return (
    <section
      className={cx(
        styles.portalIntro,
        portal === "admin" && styles.portalIntroAdmin,
      )}
      id={id}
    >
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
      <p>{text}</p>
    </section>
  )
}

export default function InterfacesPortailsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroTopline}>
          <div className={styles.heroBrand}>
            <FlagMark />
            <span>IDENTITÉ NUMÉRIQUE DU GABON</span>
          </div>
          <span>Étude d’interface · août 2026</span>
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>PROPOSITION A · RECOMMANDÉE</span>
          <h1>Le poste de confiance</h1>
          <p>
            Une interface de travail reconnaissable, dense quand il le faut et
            calme quand une décision engage un compte, une application ou un
            accès à la production.
          </p>
          <div className={styles.heroActions}>
            <a href="#developer">
              Voir le portail développeur <ArrowRight size={14} />
            </a>
            <a href="#admin">Voir la console administrateur</a>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div>
            <strong>17</strong>
            <span>parcours couverts</span>
          </div>
          <div>
            <strong>42</strong>
            <span>écrans statiques</span>
          </div>
          <div>
            <strong>1</strong>
            <span>système commun</span>
          </div>
        </div>
      </section>

      <nav className={styles.boardNav} aria-label="Sommaire de la maquette">
        <span>Aller à</span>
        <a href="#principles">Principes</a>
        <a href="#developer">Développeur</a>
        <a href="#admin">Administration</a>
        <a href="#coverage">Couverture</a>
      </nav>

      <section className={styles.principles} id="principles">
        <div className={styles.sectionLabel}>DIRECTION RETENUE</div>
        <div className={styles.principleGrid}>
          <article>
            <span>01</span>
            <h2>Une identité publique, pas un thème SaaS</h2>
            <p>
              Le vert profond structure le poste de travail. Le jaune attire
              l’attention sur une décision. Le bleu porte les informations de
              vérification.
            </p>
          </article>
          <article>
            <span>02</span>
            <h2>Le contexte reste à l’écran</h2>
            <p>
              L’application, l’environnement, le niveau de garantie et le statut
              sont visibles avant toute action. Plus besoin de reconstruire
              mentalement la situation.
            </p>
          </article>
          <article>
            <span>03</span>
            <h2>Les actions risquées changent de rythme</h2>
            <p>
              Approbation, rotation et suppression passent par un récapitulatif.
              L’interface dit ce qui change, qui sera affecté et comment revenir
              en arrière.
            </p>
          </article>
          <article>
            <span>04</span>
            <h2>Les tables servent à décider</h2>
            <p>
              Recherche, filtres, signalements et détails secondaires vivent
              dans le même plan de travail. Les pages de détail ne deviennent
              pas des inventaires de cartes.
            </p>
          </article>
        </div>
        <div className={styles.referenceStrip}>
          <div>
            <b>Références Dribbble consultées</b>
            <span>
              API Developer Dashboard · User Management Dashboard · SaaS Table
              Redesign · API Management Dashboard
            </span>
          </div>
          <div className={styles.palette} aria-label="Palette proposée">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <SectionIntro
        id="developer"
        portal="developer"
        kicker="PORTAIL DÉVELOPPEUR"
        title="Construire, tester, publier"
        text="Le portail devient un atelier organisé autour de l’application. Les clés, les webhooks, les services et l’usage gardent le même contexte, du premier test à la production."
      />

      <Journey
        id="dev-access"
        index="D01"
        portal="developer"
        title="Accès au portail"
        description="De la découverte à la vérification de l’adresse professionnelle. La promesse produit, les prérequis et la progression sont visibles dès le départ."
        screens="4 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga"
          portal="developer"
          active="Applications"
          eyebrow="Portail partenaire"
          title="Accueil"
          plain
        >
          <AuthLayout
            portal="developer"
            step="01 / DÉCOUVRIR"
            title="Une seule identité. Des services mieux reliés."
            subtitle="Intégrez la connexion IDN, les niveaux de garantie et les services citoyens depuis un espace unique."
            asideTitle="Connecter les services du Gabon"
            asideText="OAuth 2.1, OpenID Connect et PKCE. Les standards sont visibles, le langage reste simple."
          >
            <div className={styles.authFeatureGrid}>
              <ChoiceCard
                icon={Fingerprint}
                title="Authentification IDN"
                text="OAuth 2.1 + OIDC"
                selected
              />
              <ChoiceCard
                icon={Gauge}
                title="Niveaux de garantie"
                text="LoA 1, 2 et 3"
              />
            </div>
            <div className={styles.authButtons}>
              <MockButton icon={ArrowRight}>Créer un compte</MockButton>
              <MockButton tone="secondary">Ouvrir la documentation</MockButton>
            </div>
          </AuthLayout>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/sign-in"
          portal="developer"
          active="Applications"
          eyebrow="Accès"
          title="Connexion"
          plain
        >
          <AuthLayout
            portal="developer"
            step="02 / SE CONNECTER"
            title="Bon retour parmi nous"
            subtitle="Utilisez votre adresse professionnelle pour retrouver vos applications."
            asideTitle="Votre atelier reste prêt"
            asideText="Applications, environnements et événements sont regroupés sans mélanger les secrets de test et de production."
          >
            <Field label="Email professionnel" value="ariane@okatech.ga" />
            <Field label="Mot de passe" value="••••••••••••" />
            <div className={styles.authButtons}>
              <MockButton icon={LockKeyhole}>Se connecter</MockButton>
              <span className={styles.textLink}>Mot de passe oublié</span>
            </div>
          </AuthLayout>
        </MockFrame>
        <MockFrame
          number="03"
          route="dev.identite.ga/sign-up"
          portal="developer"
          active="Applications"
          eyebrow="Création de compte"
          title="Profil développeur"
          plain
        >
          <AuthLayout
            portal="developer"
            step="03 / CRÉER LE COMPTE"
            title="Ouvrir votre espace partenaire"
            subtitle="Trois informations suffisent. Vous créerez ensuite votre première application en sandbox."
            asideTitle="Commencer sans attendre une validation"
            asideText="La sandbox est immédiate. La production intervient plus tard, avec une revue explicite."
          >
            <div className={styles.twoCols}>
              <Field label="Prénom et nom" value="Ariane Mba" />
              <Field label="Organisation" value="Okatech" />
            </div>
            <Field label="Email professionnel" value="ariane@okatech.ga" />
            <Field
              label="Mot de passe"
              value="12 caractères minimum"
              hint="Lettres, chiffres et symbole"
            />
            <div className={styles.authButtons}>
              <MockButton icon={ArrowRight}>Continuer</MockButton>
            </div>
          </AuthLayout>
        </MockFrame>
        <MockFrame
          number="04"
          route="dev.identite.ga/sign-up/verify"
          portal="developer"
          active="Applications"
          eyebrow="Création de compte"
          title="Vérification"
          plain
        >
          <AuthLayout
            portal="developer"
            step="04 / VÉRIFIER L’EMAIL"
            title="Regardez votre boîte de réception"
            subtitle="Nous avons envoyé un code à ariane@okatech.ga. Il reste valable 14:32."
            asideTitle="Une étape courte, un état clair"
            asideText="L’adresse, le délai et les options de correction restent visibles sans retourner au formulaire."
          >
            <div className={styles.otpRow}>
              {[4, 8, 1, "·", "·", "·"].map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
            <div className={styles.authButtons}>
              <MockButton icon={Check}>Vérifier le code</MockButton>
              <span className={styles.textLink}>Renvoyer dans 42 s</span>
            </div>
          </AuthLayout>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-apps"
        index="D02"
        portal="developer"
        title="Créer une application"
        description="Le portefeuille montre l’état réel des environnements. La création sépare l’identité de l’app, les accès demandés et la remise du secret."
        screens="4 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/applications"
          portal="developer"
          active="Applications"
          eyebrow="3 applications · 1 revue en cours"
          title="Vos applications"
          action={<MockButton icon={Plus}>Nouvelle application</MockButton>}
        >
          <div className={styles.summaryLine}>
            <div>
              <Pill tone="green">2 en production</Pill>
              <Pill tone="yellow">1 en revue</Pill>
            </div>
            <div className={styles.segmented}>
              <b>Cartes</b>
              <span>Liste</span>
            </div>
          </div>
          <div className={styles.appGrid}>
            {[
              ["Bourses Étudiantes", "Production", "12,8 k req.", "BE"],
              ["Gabon Connect", "Sandbox", "428 req.", "GC"],
              ["Portail Santé", "Revue en cours", "—", "PS"],
            ].map(([name, state, usage, initials], i) => (
              <Panel key={name} className={styles.appCard}>
                <div className={styles.appCardTop}>
                  <span
                    className={cx(
                      styles.appAvatar,
                      i === 2 && styles.appAvatarBlue,
                    )}
                  >
                    {initials}
                  </span>
                  <Pill
                    tone={i === 0 ? "green" : i === 2 ? "yellow" : "neutral"}
                  >
                    {state}
                  </Pill>
                </div>
                <h4>{name}</h4>
                <code>
                  idn_{i === 0 ? "live" : "test"}_••••{1420 + i}
                </code>
                <div className={styles.appStats}>
                  <span>LoA {i + 1 > 3 ? 3 : i + 1}</span>
                  <span>{usage}</span>
                </div>
                <div className={styles.cardLink}>
                  Ouvrir l’atelier <ArrowRight size={12} />
                </div>
              </Panel>
            ))}
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/applications/new"
          portal="developer"
          active="Applications"
          eyebrow="Nouvelle application · 1 sur 2"
          title="Décrire l’application"
          action={<Pill tone="neutral">Brouillon enregistré</Pill>}
        >
          <div className={styles.stepper}>
            <b>
              <i>1</i> Identité
            </b>
            <span />
            <em>
              <i>2</i> Accès demandés
            </em>
            <span />
            <em>
              <i>3</i> Secret
            </em>
          </div>
          <div className={styles.formWithAside}>
            <Panel title="Identité de l’application">
              <Field label="Nom public" value="Bourses Étudiantes" />
              <Field
                label="Description"
                value="Dépôt et suivi des demandes de bourse nationales."
              />
              <Field
                label="URL de retour"
                value="https://bourses.ga/auth/idn/callback"
                mono
              />
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Annuler</MockButton>
                <MockButton icon={ArrowRight}>Choisir les accès</MockButton>
              </div>
            </Panel>
            <Panel title="Créée en sandbox">
              <div className={styles.infoCallout}>
                <Database size={17} />
                <p>
                  <b>Aucun citoyen réel n’est exposé.</b>
                  <span>
                    Ajoutez ensuite vos comptes de test depuis l’atelier.
                  </span>
                </p>
              </div>
              <div className={styles.checkList}>
                <span>
                  <Check size={12} /> Secret distinct
                </span>
                <span>
                  <Check size={12} /> Redirect URI locale autorisée
                </span>
                <span>
                  <Check size={12} /> 25 testeurs maximum
                </span>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="dev.identite.ga/applications/new?step=access"
          portal="developer"
          active="Applications"
          eyebrow="Nouvelle application · 2 sur 2"
          title="Accès et niveau requis"
          action={<Pill tone="blue">Aide sur les scopes</Pill>}
        >
          <div className={styles.stepper}>
            <b>
              <i>
                <Check size={10} />
              </i>{" "}
              Identité
            </b>
            <span />
            <b>
              <i>2</i> Accès demandés
            </b>
            <span />
            <em>
              <i>3</i> Secret
            </em>
          </div>
          <div className={styles.formWithAside}>
            <Panel title="Scopes">
              <div className={styles.scopeList}>
                <ChoiceCard
                  icon={UserCheck}
                  title="Profil de base"
                  text="openid · profile · email"
                  selected
                />
                <ChoiceCard
                  icon={FileCheck2}
                  title="État civil"
                  text="idn:civil_status"
                  selected
                />
                <ChoiceCard
                  icon={Mail}
                  title="iBoîte"
                  text="Lecture et dépôt de courrier"
                />
              </div>
            </Panel>
            <Panel title="Niveau de garantie minimum">
              <div className={styles.loaStack}>
                {["1 · Déclaré", "2 · Vérifié", "3 · Présentiel"].map(
                  (label, i) => (
                    <div
                      key={label}
                      className={cx(
                        styles.loaChoice,
                        i === 1 && styles.loaSelected,
                      )}
                    >
                      <span>{i + 1}</span>
                      <div>
                        <b>{label}</b>
                        <small>
                          {i === 1
                            ? "Recommandé pour une demande de bourse"
                            : "Disponible selon le service"}
                        </small>
                      </div>
                      {i === 1 ? <CheckCircle2 size={14} /> : null}
                    </div>
                  ),
                )}
              </div>
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Retour</MockButton>
                <MockButton icon={Sparkles}>Créer en sandbox</MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="04"
          route="dev.identite.ga/applications/new/success"
          portal="developer"
          active="Applications"
          eyebrow="Application créée"
          title="Conservez votre secret"
          action={<Pill tone="green">Sandbox prête</Pill>}
        >
          <div className={styles.secretLayout}>
            <Panel>
              <div className={styles.successOrb}>
                <Check size={24} />
              </div>
              <h3>Bourses Étudiantes est prête</h3>
              <p>
                Ce secret ne sera plus affiché. Copiez-le dans votre
                gestionnaire de secrets avant de continuer.
              </p>
              <div className={styles.secretField}>
                <code>idn_sk_test_Q8t9••••••••••mZ2</code>
                <span>
                  <Copy size={13} /> Copier
                </span>
              </div>
              <div className={styles.buttonRow}>
                <MockButton icon={ArrowRight}>Ouvrir l’atelier</MockButton>
                <MockButton tone="secondary">Lire le guide Next.js</MockButton>
              </div>
            </Panel>
            <Panel title="Prochaines étapes">
              <Timeline
                items={[
                  {
                    title: "Ajouter les comptes de test",
                    detail: "Autorisez les citoyens de votre équipe",
                  },
                  {
                    title: "Configurer le callback",
                    detail: "Utilisez le client_id et le secret",
                  },
                  {
                    title: "Tester le consentement",
                    detail: "Vérifiez les scopes affichés",
                  },
                ]}
              />
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-oauth"
        index="D03"
        portal="developer"
        title="Configurer OAuth et passer en production"
        description="L’atelier conserve l’application et l’environnement dans un bandeau unique. Les changements, les testeurs et la revue de production forment une suite lisible."
        screens="3 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/applications/idn_test_8f21/keys"
          portal="developer"
          active="Applications"
          eyebrow="Bourses Étudiantes · Sandbox"
          title="Atelier de l’application"
          action={
            <>
              <MockButton tone="secondary" icon={RotateCcw}>
                Tourner le secret
              </MockButton>
              <MockButton>Demander la production</MockButton>
            </>
          }
        >
          <div className={styles.workspaceBar}>
            <div>
              <span className={styles.appAvatar}>BE</span>
              <div>
                <b>Bourses Étudiantes</b>
                <small>idn_test_8f21 · LoA 2</small>
              </div>
            </div>
            <div className={styles.workspaceTabs}>
              <b>OAuth</b>
              <span>Webhooks</span>
              <span>Services</span>
            </div>
            <Pill tone="neutral">
              SANDBOX <ChevronDown size={10} />
            </Pill>
          </div>
          <div className={styles.oauthGrid}>
            <Panel
              title="Identifiants OAuth"
              meta={<Pill tone="green">Configuration valide</Pill>}
            >
              <div className={styles.credentialList}>
                {[
                  ["ISSUER", "https://site.identite.ga"],
                  ["CLIENT_ID", "idn_test_8f21••••1420"],
                  ["CLIENT_SECRET", "••••••••••••••••"],
                  ["JWKS", "/api/auth/convex/jwks"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <code>{value}</code>
                    <Copy size={12} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel
              title="Intégration rapide"
              meta={<span className={styles.textLink}>Better Auth</span>}
            >
              <CodeBlock>{`idn({\n  clientId: env.IDN_CLIENT_ID,\n  clientSecret: env.IDN_CLIENT_SECRET\n})`}</CodeBlock>
              <div className={styles.cardLink}>
                Voir le guide complet <ExternalLink size={11} />
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/applications/idn_test_8f21/keys#sandbox"
          portal="developer"
          active="Applications"
          eyebrow="Bourses Étudiantes · Sandbox"
          title="Préparer les tests"
          action={
            <MockButton tone="secondary">
              Enregistrer les changements
            </MockButton>
          }
        >
          <div className={styles.workspaceBar}>
            <div>
              <span className={styles.appAvatar}>BE</span>
              <div>
                <b>Bourses Étudiantes</b>
                <small>Environnement de test</small>
              </div>
            </div>
            <div className={styles.workspaceTabs}>
              <b>OAuth</b>
              <span>Webhooks</span>
              <span>Services</span>
            </div>
            <Pill tone="neutral">
              SANDBOX <ChevronDown size={10} />
            </Pill>
          </div>
          <div className={styles.twoColsWide}>
            <Panel title="URL de retour">
              <div className={styles.uriRow}>
                <code>https://bourses.ga/auth/idn/callback</code>
                <Pill tone="green">Valide</Pill>
                <MoreHorizontal size={13} />
              </div>
              <div className={styles.uriRow}>
                <code>http://localhost:3000/api/auth/callback</code>
                <Pill tone="neutral">Local</Pill>
                <MoreHorizontal size={13} />
              </div>
              <MockButton tone="secondary" icon={Plus}>
                Ajouter une URL
              </MockButton>
            </Panel>
            <Panel title="Comptes de test" meta={<span>2 / 25</span>}>
              <div className={styles.peopleList}>
                {[
                  ["OM", "olivia@idn.ga"],
                  ["JN", "jules@idn.ga"],
                ].map(([avatar, email]) => (
                  <div key={email}>
                    <span>{avatar}</span>
                    <code>{email}</code>
                    <Trash2 size={12} />
                  </div>
                ))}
              </div>
              <div className={styles.inlineInput}>
                <span>testeur@idn.ga</span>
                <MockButton>Ajouter</MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="dev.identite.ga/applications/idn_test_8f21/production"
          portal="developer"
          active="Applications"
          eyebrow="Bourses Étudiantes · Publication"
          title="Revue de production"
          action={<Pill tone="yellow">Prête à soumettre</Pill>}
        >
          <div className={styles.reviewLayout}>
            <Panel title="Contrôles avant envoi">
              <div className={styles.checkCards}>
                {[
                  ["Redirect URIs", "2 URL HTTPS", true],
                  ["Scopes", "4 accès justifiés", true],
                  ["Mentions légales", "URL manquante", false],
                  ["Compte développeur", "Identité validée", true],
                ].map(([label, detail, ok]) => (
                  <div
                    key={String(label)}
                    className={ok ? styles.checkOk : styles.checkWarn}
                  >
                    {ok ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <ShieldAlert size={15} />
                    )}
                    <p>
                      <b>{label}</b>
                      <span>{detail}</span>
                    </p>
                    <ChevronRight size={13} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Ce qui va se passer">
              <ol className={styles.numberList}>
                <li>
                  <b>1</b>
                  <span>Un environnement Production distinct sera créé.</span>
                </li>
                <li>
                  <b>2</b>
                  <span>L’équipe IDN vérifiera les scopes et les URL.</span>
                </li>
                <li>
                  <b>3</b>
                  <span>Le nouveau secret apparaîtra une seule fois.</span>
                </li>
              </ol>
              <div className={styles.warningBox}>
                Délai indicatif : 48 à 72 h ouvrées.
              </div>
              <MockButton icon={Send}>Envoyer la demande</MockButton>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-webhooks"
        index="D04"
        portal="developer"
        title="Brancher et surveiller les webhooks"
        description="La création n’écrase plus la liste. Une fiche d’endpoint réunit l’état, les événements abonnés, la santé des livraisons et les actions de maintenance."
        screens="3 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/applications/idn_test_8f21/webhooks"
          portal="developer"
          active="Applications"
          eyebrow="Bourses Étudiantes · Sandbox"
          title="Webhooks"
          action={<MockButton icon={Plus}>Nouvel endpoint</MockButton>}
        >
          <div className={styles.workspaceBar}>
            <div>
              <span className={styles.appAvatar}>BE</span>
              <div>
                <b>Bourses Étudiantes</b>
                <small>3 endpoints · 99,2 % livrés</small>
              </div>
            </div>
            <div className={styles.workspaceTabs}>
              <span>OAuth</span>
              <b>Webhooks</b>
              <span>Services</span>
            </div>
            <Pill tone="neutral">SANDBOX</Pill>
          </div>
          <div className={styles.endpointGrid}>
            <Panel className={styles.endpointCard}>
              <div className={styles.endpointTitle}>
                <span className={styles.statusBeacon} />
                <div>
                  <h4>Événements d’identité</h4>
                  <code>https://bourses.ga/api/idn/events</code>
                </div>
                <Pill tone="green">ACTIF</Pill>
              </div>
              <div className={styles.endpointStats}>
                <span>
                  <b>1 284</b> livraisons
                </span>
                <span>
                  <b>99,8 %</b> réussies
                </span>
                <span>
                  <b>184 ms</b> médiane
                </span>
              </div>
              <div className={styles.scopeChips}>
                <Pill tone="blue">identity.verification.updated</Pill>
                <Pill>identity.verification.created</Pill>
              </div>
              <div className={styles.sparkLine}>
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </Panel>
            <Panel title="Livraisons récentes">
              <MiniTable
                headers={["ÉVÉNEMENT", "HTTP", "DURÉE"]}
                rows={[
                  [
                    <code key="a">evt_92f1</code>,
                    <Pill key="b" tone="green">
                      200
                    </Pill>,
                    "148 ms",
                  ],
                  [
                    <code key="a">evt_92e8</code>,
                    <Pill key="b" tone="red">
                      500
                    </Pill>,
                    "2,1 s",
                  ],
                  [
                    <code key="a">evt_92d2</code>,
                    <Pill key="b" tone="green">
                      204
                    </Pill>,
                    "96 ms",
                  ],
                ]}
              />
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/applications/idn_test_8f21/webhooks/new"
          portal="developer"
          active="Applications"
          eyebrow="Bourses Étudiantes · Webhooks"
          title="Nouvel endpoint"
          action={<MockButton tone="quiet">Fermer</MockButton>}
        >
          <div className={styles.drawerScene}>
            <div className={styles.drawerBackdrop}>
              <Panel title="Endpoints existants">
                <div className={styles.skeletonRows}>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </Panel>
            </div>
            <aside className={styles.drawer}>
              <div>
                <span>ÉTAPE 1 SUR 2</span>
                <h3>Configurer l’endpoint</h3>
                <p>
                  IDN vérifiera l’URL par challenge avant la première livraison.
                </p>
              </div>
              <Field label="Nom" value="Événements d’identité" />
              <Field
                label="URL HTTPS · port 443"
                value="https://bourses.ga/api/idn/events"
                mono
              />
              <div className={styles.eventChecks}>
                {[
                  "iboite.account.updated",
                  "identity.verification.created",
                  "identity.verification.updated",
                  "identity.verification.deleted",
                ].map((event, i) => (
                  <label
                    key={event}
                    className={i > 0 ? styles.checked : undefined}
                  >
                    <i>{i > 0 ? <Check size={10} /> : null}</i>
                    <span>
                      <b>{event}</b>
                      <small>
                        {i > 0 ? "Autorisation : owner" : "Scope iBoîte requis"}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <div className={styles.drawerFooter}>
                <MockButton tone="secondary">Annuler</MockButton>
                <MockButton icon={ArrowRight}>Créer et vérifier</MockButton>
              </div>
            </aside>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="dev.identite.ga/applications/idn_test_8f21/webhooks/evt_92e8"
          portal="developer"
          active="Applications"
          eyebrow="Livraison · evt_92e8"
          title="Échec de livraison"
          action={<MockButton icon={RefreshCw}>Rejouer</MockButton>}
        >
          <div className={styles.deliveryGrid}>
            <Panel title="Résumé" meta={<Pill tone="red">HTTP 500</Pill>}>
              <div className={styles.detailRows}>
                {[
                  ["Événement", "identity.verification.updated"],
                  ["Endpoint", "Événements d’identité"],
                  ["Tentatives", "3 sur 8"],
                  ["Prochaine tentative", "dans 7 min 14 s"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
              <div className={styles.errorCallout}>
                <ShieldAlert size={15} />
                <span>
                  Votre serveur a répondu après 2,1 s avec une erreur interne.
                </span>
              </div>
            </Panel>
            <Panel
              title="Corps envoyé"
              meta={
                <span className={styles.textLink}>
                  <Copy size={11} /> Copier
                </span>
              }
            >
              <CodeBlock>{`{\n  "id": "evt_92e8",\n  "type": "identity.verification.updated",\n  "data": { "status": "approved" }\n}`}</CodeBlock>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-services"
        index="D05"
        portal="developer"
        title="Publier des services citoyens"
        description="L’éditeur montre la liste, le formulaire et l’aperçu citoyen. Le développeur voit ce qui sera publié avant d’enregistrer."
        screens="2 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/applications/idn_test_8f21/services"
          portal="developer"
          active="Applications"
          eyebrow="Bourses Étudiantes · Catalogue"
          title="Services proposés"
          action={<MockButton icon={Plus}>Ajouter un service</MockButton>}
        >
          <div className={styles.serviceLayout}>
            <Panel title="2 services publiés">
              <div className={styles.serviceList}>
                {[
                  ["Dépôt de dossier", "Éducation", "Publié"],
                  ["Suivi de demande", "Administratif", "Publié"],
                ].map(([name, category, state], i) => (
                  <div
                    key={name}
                    className={i === 0 ? styles.serviceSelected : undefined}
                  >
                    <span className={styles.serviceIcon}>
                      {i === 0 ? (
                        <FileCheck2 size={16} />
                      ) : (
                        <Activity size={16} />
                      )}
                    </span>
                    <p>
                      <b>{name}</b>
                      <small>
                        {category} · /services/{i === 0 ? "depot" : "suivi"}
                      </small>
                    </p>
                    <Pill tone="green">{state}</Pill>
                    <MoreHorizontal size={13} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Modifier le service">
              <div className={styles.twoCols}>
                <Field label="Identifiant" value="depot-bourse" mono />
                <Field label="Catégorie" value="Éducation⌄" />
              </div>
              <Field label="Libellé" value="Déposer un dossier de bourse" />
              <Field
                label="Description"
                value="Préparez vos pièces et envoyez votre demande en ligne."
              />
              <Field
                label="Lien d’accès"
                value="https://bourses.ga/services/depot"
                mono
              />
              <div className={styles.buttonRow}>
                <MockButton tone="danger" icon={Trash2}>
                  Retirer
                </MockButton>
                <MockButton>Enregistrer</MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/applications/idn_test_8f21/services/preview"
          portal="developer"
          active="Applications"
          eyebrow="Aperçu · application citoyenne"
          title="Avant publication"
          action={<MockButton icon={Check}>Valider l’aperçu</MockButton>}
        >
          <div className={styles.previewLayout}>
            <div className={styles.phone}>
              <div className={styles.phoneTop}>
                IDN <span>09:41</span>
              </div>
              <div className={styles.phoneBody}>
                <span className={styles.phoneEyebrow}>SERVICE PARTENAIRE</span>
                <div className={styles.phoneLogo}>BE</div>
                <h3>Bourses Étudiantes</h3>
                <p>2 démarches accessibles avec votre identité numérique.</p>
                <div className={styles.mobileService}>
                  <FileCheck2 size={16} />
                  <div>
                    <b>Déposer un dossier</b>
                    <small>Préparez vos pièces et envoyez votre demande.</small>
                  </div>
                  <ChevronRight size={14} />
                </div>
                <div className={styles.mobileService}>
                  <Activity size={16} />
                  <div>
                    <b>Suivre ma demande</b>
                    <small>Consultez l’avancement de votre dossier.</small>
                  </div>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
            <Panel title="Informations affichées">
              <div className={styles.detailRows}>
                {[
                  ["Application", "Bourses Étudiantes"],
                  ["Environnement", "Sandbox"],
                  ["Services", "2"],
                  ["Consentement", "Profil + état civil"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
              <div className={styles.infoCallout}>
                <Eye size={16} />
                <p>
                  <b>Aperçu fidèle</b>
                  <span>
                    Les couleurs du partenaire restent secondaires à celles
                    d’IDN.
                  </span>
                </p>
              </div>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-m2m"
        index="D06"
        portal="developer"
        title="Gérer les clés serveur à serveur"
        description="Les clés M2M sont distinctes des identifiants OAuth. La création rend explicites l’application liée, les droits, l’expiration et la remise unique du token."
        screens="3 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/api-keys"
          portal="developer"
          active="Clés API"
          eyebrow="Machine à machine · 4 clés"
          title="Clés API"
          action={<MockButton icon={Plus}>Nouvelle clé</MockButton>}
        >
          <div className={styles.filterBar}>
            <div>
              <Search size={13} />
              <span>Rechercher une clé</span>
            </div>
            <Pill>État : toutes</Pill>
            <Pill>Application : toutes</Pill>
          </div>
          <Panel>
            <MiniTable
              headers={[
                "CLÉ",
                "APPLICATION",
                "DROITS",
                "DERNIER APPEL",
                "ÉTAT",
              ]}
              rows={[
                [
                  <span key="a">
                    <b>Production principale</b>
                    <code>idn_m2m_7K2••</code>
                  </span>,
                  "Bourses Étudiantes",
                  "2 scopes",
                  "il y a 4 min",
                  <Pill key="x" tone="green">
                    ACTIVE
                  </Pill>,
                ],
                [
                  <span key="a">
                    <b>Annuaire partenaire</b>
                    <code>idn_m2m_3D8••</code>
                  </span>,
                  "Gabon Connect",
                  "1 scope",
                  "hier, 16:42",
                  <Pill key="x" tone="green">
                    ACTIVE
                  </Pill>,
                ],
                [
                  <span key="a">
                    <b>Migration 2025</b>
                    <code>idn_m2m_1P4••</code>
                  </span>,
                  "—",
                  "4 scopes",
                  "12 juin",
                  <Pill key="x" tone="red">
                    RÉVOQUÉE
                  </Pill>,
                ],
              ]}
            />
          </Panel>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/api-keys/new"
          portal="developer"
          active="Clés API"
          eyebrow="Clés API"
          title="Créer une clé M2M"
          action={<Pill tone="blue">Droits sensibles</Pill>}
        >
          <div className={styles.formWithAside}>
            <Panel title="Détails">
              <Field
                label="Nom de la clé"
                value="Dépôt de courriers officiels"
              />
              <Field label="Application liée" value="Bourses Étudiantes⌄" />
              <Field label="Expiration" value="90 jours⌄" />
              <div className={styles.scopeList}>
                <ChoiceCard
                  icon={Search}
                  title="citizens:resolve"
                  text="Résoudre un identifiant citoyen"
                />
                <ChoiceCard
                  icon={Send}
                  title="idn:iboite:letters:create"
                  text="Déposer un courrier officiel"
                  selected
                />
                <ChoiceCard
                  icon={FileCheck2}
                  title="idn:verification:list"
                  text="Lire les vérifications"
                  selected
                />
              </div>
            </Panel>
            <Panel title="Résumé de sécurité">
              <div className={styles.riskScore}>
                <span>2</span>
                <div>
                  <b>droits accordés</b>
                  <small>à Bourses Étudiantes</small>
                </div>
              </div>
              <div className={styles.checkList}>
                <span>
                  <Check size={12} /> Expire le 25 nov. 2026
                </span>
                <span>
                  <Check size={12} /> Journalisée dans l’audit
                </span>
                <span>
                  <Check size={12} /> Révocable à tout moment
                </span>
              </div>
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Annuler</MockButton>
                <MockButton icon={KeyRound}>Créer la clé</MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="dev.identite.ga/api-keys/new/success"
          portal="developer"
          active="Clés API"
          eyebrow="Clé créée · une seule lecture"
          title="Copiez le token maintenant"
          action={<Pill tone="yellow">À conserver</Pill>}
        >
          <div className={styles.secretLayout}>
            <Panel>
              <div className={styles.secretBanner}>
                <KeyRound size={19} />
                <div>
                  <b>Dépôt de courriers officiels</b>
                  <span>Bourses Étudiantes · expiration dans 90 jours</span>
                </div>
              </div>
              <div className={styles.secretField}>
                <code>idn_m2m_live_K9b1••••••••••vQ8</code>
                <span>
                  <Copy size={13} /> Copier
                </span>
              </div>
              <div className={styles.warningBox}>
                Une fois cette page fermée, IDN n’affichera plus ce token.
              </div>
              <div className={styles.buttonRow}>
                <MockButton icon={Check}>J’ai copié le token</MockButton>
              </div>
            </Panel>
            <Panel title="Exemple d’appel">
              <CodeBlock>{`curl https://api.identite.ga/v1/letters \\\n  -H "Authorization: Bearer $IDN_TOKEN"`}</CodeBlock>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-usage"
        index="D07"
        portal="developer"
        title="Comprendre l’usage"
        description="La page ne se limite plus à trois compteurs. Elle relie quota, latence, erreurs et applications pour aider à diagnostiquer un problème."
        screens="1 écran"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/usage"
          portal="developer"
          active="Usage"
          eyebrow="Période · août 2026"
          title="Usage et qualité de service"
          action={
            <>
              <Pill>
                30 jours <ChevronDown size={10} />
              </Pill>
              <MockButton tone="secondary">Exporter</MockButton>
            </>
          }
        >
          <div className={styles.metricsGrid}>
            <Metric label="REQUÊTES" value="48 290" delta="48 % du quota" />
            <Metric
              label="LATENCE P95"
              value="214 ms"
              delta="sous le seuil de 300 ms"
              tone="blue"
            />
            <Metric label="ERREURS 4XX" value="1,8 %" delta="−0,6 pt ce mois" />
            <Metric
              label="DISPONIBILITÉ"
              value="99,98 %"
              delta="objectif tenu"
            />
          </div>
          <div className={styles.dashboardGrid}>
            <Panel
              title="Requêtes et erreurs"
              meta={
                <div className={styles.legend}>
                  <span>Requêtes</span>
                  <span>Erreurs</span>
                </div>
              }
            >
              <Bars />
              <div className={styles.axis}>
                <span>1 août</span>
                <span>15 août</span>
                <span>27 août</span>
              </div>
            </Panel>
            <Panel title="Par application">
              <div className={styles.rankList}>
                {[
                  ["Bourses Étudiantes", "31 802", "66 %"],
                  ["Gabon Connect", "12 110", "25 %"],
                  ["Portail Santé", "4 378", "9 %"],
                ].map(([name, value, share]) => (
                  <div key={name}>
                    <span>{name}</span>
                    <b>{value}</b>
                    <i style={{ width: share }} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-docs"
        index="D08"
        portal="developer"
        title="Trouver et appliquer la documentation"
        description="La documentation garde une navigation propre, mais remonte le chemin recommandé et relie chaque exemple à l’application en cours."
        screens="2 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/docs"
          portal="developer"
          active="Documentation"
          eyebrow="Documentation · v1.2"
          title="Intégrer IDN"
          action={
            <MockButton tone="secondary" icon={Search}>
              Rechercher ⌘ K
            </MockButton>
          }
        >
          <div className={styles.docsHero}>
            <div>
              <Pill tone="green">CHEMIN RECOMMANDÉ</Pill>
              <h3>Connectez votre application en moins de 10 lignes.</h3>
              <p>
                Choisissez votre stack. Les URL, scopes et niveaux de garantie
                viennent directement de la plateforme IDN.
              </p>
              <div className={styles.buttonRow}>
                <MockButton icon={ArrowRight}>Démarrer avec Next.js</MockButton>
                <MockButton tone="secondary">Voir l’API OIDC</MockButton>
              </div>
            </div>
            <CodeBlock>{`import { idn } from "@idn-ga/better-auth"\n\nplugins: [idn({\n  clientId: env.IDN_CLIENT_ID\n})]`}</CodeBlock>
          </div>
          <div className={styles.docsCards}>
            {[
              ["01", "Créer l’application", "Obtenir les identifiants sandbox"],
              ["02", "Brancher le callback", "Configurer Better Auth ou OIDC"],
              ["03", "Tester le consentement", "Vérifier scopes et LoA"],
            ].map(([n, title, text]) => (
              <Panel key={n}>
                <span>{n}</span>
                <h4>{title}</h4>
                <p>{text}</p>
                <div className={styles.cardLink}>
                  Lire le guide <ArrowRight size={11} />
                </div>
              </Panel>
            ))}
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/docs/quickstart-better-auth"
          portal="developer"
          active="Documentation"
          eyebrow="Guide · Better Auth + Next.js"
          title="Premier login en 5 minutes"
          action={<Pill tone="blue">7 min de lecture</Pill>}
        >
          <div className={styles.articleLayout}>
            <aside className={styles.articleToc}>
              <b>DANS CE GUIDE</b>
              <span className={styles.tocActive}>Installer le paquet</span>
              <span>Configurer IDN</span>
              <span>Ajouter le bouton</span>
              <span>Tester le callback</span>
              <span>Passer en production</span>
            </aside>
            <article className={styles.article}>
              <div className={styles.articleLead}>
                <Pill tone="green">ÉTAPE 1 SUR 5</Pill>
                <h3>Installer le paquet officiel</h3>
                <p>
                  Le helper configure le discovery OIDC, PKCE et le mapping du
                  profil.
                </p>
              </div>
              <CodeBlock>{`bun add @idn-ga/better-auth better-auth`}</CodeBlock>
              <div className={styles.articleNote}>
                <CircleDot size={14} />
                <p>
                  <b>Application détectée : Bourses Étudiantes</b>
                  <span>
                    Le client_id sandbox peut être copié depuis votre atelier.
                  </span>
                </p>
                <MockButton tone="secondary" icon={Copy}>
                  Copier
                </MockButton>
              </div>
            </article>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="dev-settings"
        index="D09"
        portal="developer"
        title="Gérer le compte et les préférences"
        description="Le compte, la sécurité et l’apparence sont regroupés sans cacher les conséquences d’un changement de mot de passe ou de langue."
        screens="2 écrans"
      >
        <MockFrame
          number="01"
          route="dev.identite.ga/settings"
          portal="developer"
          active="Paramètres"
          eyebrow="Compte partenaire"
          title="Paramètres"
          action={<MockButton>Enregistrer</MockButton>}
        >
          <div className={styles.settingsLayout}>
            <aside>
              <b>COMPTE</b>
              <span className={styles.settingsActive}>Profil et sécurité</span>
              <span>Préférences</span>
              <span>Notifications</span>
            </aside>
            <div>
              <Panel title="Profil">
                <div className={styles.profileHead}>
                  <span>AM</span>
                  <div>
                    <b>Ariane Mba</b>
                    <small>ariane@okatech.ga</small>
                  </div>
                  <Pill tone="green">EMAIL VÉRIFIÉ</Pill>
                </div>
                <div className={styles.twoCols}>
                  <Field label="Nom affiché" value="Ariane Mba" />
                  <Field label="Organisation" value="Okatech" />
                </div>
              </Panel>
              <Panel title="Sécurité">
                <div className={styles.securityRow}>
                  <LockKeyhole size={16} />
                  <div>
                    <b>Mot de passe</b>
                    <span>Modifié il y a 48 jours</span>
                  </div>
                  <MockButton tone="secondary">Modifier</MockButton>
                </div>
                <div className={styles.securityRow}>
                  <ShieldCheck size={16} />
                  <div>
                    <b>Sessions actives</b>
                    <span>2 appareils reconnus</span>
                  </div>
                  <MockButton tone="secondary">Examiner</MockButton>
                </div>
              </Panel>
            </div>
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="dev.identite.ga/settings?tab=preferences"
          portal="developer"
          active="Paramètres"
          eyebrow="Compte partenaire"
          title="Préférences"
          action={<MockButton>Enregistrer</MockButton>}
        >
          <div className={styles.settingsLayout}>
            <aside>
              <b>COMPTE</b>
              <span>Profil et sécurité</span>
              <span className={styles.settingsActive}>Préférences</span>
              <span>Notifications</span>
            </aside>
            <div>
              <Panel title="Langue et région">
                <div className={styles.optionRow}>
                  <div>
                    <b>Langue de l’interface</b>
                    <span>Utilisée aussi pour les emails de service</span>
                  </div>
                  <Pill>
                    Français <ChevronDown size={10} />
                  </Pill>
                </div>
                <div className={styles.optionRow}>
                  <div>
                    <b>Fuseau horaire</b>
                    <span>Dates des webhooks et de l’audit</span>
                  </div>
                  <Pill>
                    Libreville · UTC+1 <ChevronDown size={10} />
                  </Pill>
                </div>
              </Panel>
              <Panel title="Apparence">
                <div className={styles.themeChoices}>
                  <ChoiceCard
                    icon={Sparkles}
                    title="Clair"
                    text="Fond chaud"
                    selected
                  />
                  <ChoiceCard
                    icon={TerminalSquare}
                    title="Sombre"
                    text="Contraste renforcé"
                  />
                  <ChoiceCard
                    icon={Settings}
                    title="Système"
                    text="Suit l’appareil"
                  />
                </div>
              </Panel>
            </div>
          </div>
        </MockFrame>
      </Journey>

      <SectionIntro
        id="admin"
        portal="admin"
        kicker="CONSOLE ADMINISTRATEUR"
        title="Voir, arbitrer, tracer"
        text="La console met les décisions avant la décoration. Les files d’attente, les signaux faibles et les actions irréversibles sont distingués du simple suivi."
      />

      <Journey
        id="admin-access"
        index="A01"
        portal="admin"
        title="Accès administrateur"
        description="Une page volontairement sobre, qui rappelle le périmètre de l’accès et la journalisation avant la connexion."
        screens="1 écran"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/sign-in"
          portal="admin"
          active="Vue d’ensemble"
          eyebrow="Accès"
          title="Connexion administrateur"
          plain
        >
          <AuthLayout
            portal="admin"
            step="CONSOLE SOUVERAINE"
            title="Accéder au centre de contrôle"
            subtitle="Réservé aux agents habilités. Chaque connexion et chaque action sont journalisées."
            asideTitle="Un accès nominatif et audité"
            asideText="La console distingue l’observation, la validation d’identité et les droits d’administration système."
          >
            <Field
              label="Email professionnel"
              value="patrick.nze@identite.ga"
            />
            <Field label="Mot de passe" value="••••••••••••" />
            <div className={styles.authButtons}>
              <MockButton icon={ShieldCheck}>Se connecter</MockButton>
              <span className={styles.textLink}>Accès impossible ?</span>
            </div>
          </AuthLayout>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-dashboard"
        index="A02"
        portal="admin"
        title="Piloter la plateforme"
        description="Le tableau de bord montre l’activité, mais surtout ce qui demande une décision aujourd’hui : revues de production, signaux de doublon et alertes de sécurité."
        screens="1 écran"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/dashboard"
          portal="admin"
          active="Vue d’ensemble"
          eyebrow="Jeudi 27 août · données à 11:42"
          title="Centre de contrôle"
          action={<MockButton tone="secondary">Exporter le rapport</MockButton>}
        >
          <div className={styles.metricsGrid}>
            <Metric
              label="COMPTES ACTIFS"
              value="142 318"
              delta="+1,4 % sur 7 jours"
            />
            <Metric
              label="CONNEXIONS · 24 H"
              value="38 942"
              delta="pic à 09:18"
              tone="blue"
            />
            <Metric
              label="APPS EN REVUE"
              value="3"
              delta="dont 1 depuis plus de 48 h"
              tone="yellow"
            />
            <Metric
              label="ALERTES"
              value="2"
              delta="1 sécurité · 1 doublon"
              tone="red"
            />
          </div>
          <div className={styles.commandGrid}>
            <Panel
              title="À traiter aujourd’hui"
              meta={<span className={styles.textLink}>Voir la file</span>}
            >
              <div className={styles.taskList}>
                <div>
                  <span className={styles.taskIconYellow}>
                    <AppWindow size={14} />
                  </span>
                  <p>
                    <b>Portail Santé demande la production</b>
                    <small>LoA 3 · 6 scopes · reçue il y a 51 h</small>
                  </p>
                  <Pill tone="yellow">EN RETARD</Pill>
                  <ChevronRight size={13} />
                </div>
                <div>
                  <span className={styles.taskIconBlue}>
                    <Fingerprint size={14} />
                  </span>
                  <p>
                    <b>Rapprochement biométrique à arbitrer</b>
                    <small>Similarité visage 94 % · 2 comptes</small>
                  </p>
                  <Pill tone="blue">À VÉRIFIER</Pill>
                  <ChevronRight size={13} />
                </div>
                <div>
                  <span className={styles.taskIconRed}>
                    <ShieldAlert size={14} />
                  </span>
                  <p>
                    <b>Échecs de connexion inhabituels</b>
                    <small>18 tentatives · même adresse IP</small>
                  </p>
                  <Pill tone="red">ALERTE</Pill>
                  <ChevronRight size={13} />
                </div>
              </div>
            </Panel>
            <Panel title="Connexions · 15 jours">
              <Bars
                values={[
                  34, 42, 39, 61, 57, 65, 50, 72, 68, 79, 63, 88, 81, 91,
                ]}
              />
              <div className={styles.axis}>
                <span>13 août</span>
                <span>20 août</span>
                <span>Aujourd’hui</span>
              </div>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-apps"
        index="A03"
        portal="admin"
        title="Administrer les applications OAuth"
        description="La liste sert de file de travail. La création interne, la revue de production et la délégation d’identité ont chacune leur propre écran de décision."
        screens="4 écrans"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/apps"
          portal="admin"
          active="Applications OAuth"
          eyebrow="24 applications · 3 à traiter"
          title="Applications OAuth"
          action={<MockButton icon={Plus}>Nouvelle application</MockButton>}
        >
          <div className={styles.filterBar}>
            <div>
              <Search size={13} />
              <span>Nom, client_id ou organisation</span>
            </div>
            <Pill tone="yellow">Revue : 3</Pill>
            <Pill>Environnement : tous</Pill>
            <Pill>LoA : tous</Pill>
            <SlidersHorizontal size={14} />
          </div>
          <Panel>
            <MiniTable
              headers={[
                "APPLICATION",
                "ORGANISATION",
                "ENV.",
                "NIVEAU",
                "DERNIÈRE ACTIVITÉ",
                "ÉTAT",
              ]}
              rows={[
                [
                  <span key="a">
                    <b>Portail Santé</b>
                    <code>idn_live_9D2••</code>
                  </span>,
                  "CNAMGS",
                  "Production",
                  "LoA 3",
                  "il y a 2 min",
                  <Pill key="x" tone="yellow">
                    À REVOIR
                  </Pill>,
                ],
                [
                  <span key="a">
                    <b>Bourses Étudiantes</b>
                    <code>idn_test_8F2••</code>
                  </span>,
                  "Okatech",
                  "Sandbox",
                  "LoA 2",
                  "il y a 18 min",
                  <Pill key="x" tone="green">
                    ACTIVE
                  </Pill>,
                ],
                [
                  <span key="a">
                    <b>Gabon Connect</b>
                    <code>idn_live_4A1••</code>
                  </span>,
                  "DGSN",
                  "Production",
                  "LoA 2",
                  "hier, 21:06",
                  <Pill key="x" tone="green">
                    ACTIVE
                  </Pill>,
                ],
                [
                  <span key="a">
                    <b>Essai concours</b>
                    <code>idn_test_1B7••</code>
                  </span>,
                  "—",
                  "Sandbox",
                  "LoA 1",
                  "12 août",
                  <Pill key="x">INACTIVE</Pill>,
                ],
              ]}
            />
          </Panel>
        </MockFrame>
        <MockFrame
          number="02"
          route="admin.identite.ga/apps/new"
          portal="admin"
          active="Applications OAuth"
          eyebrow="Création interne"
          title="Nouvelle application OAuth"
          action={<Pill tone="blue">CRÉÉE EN ATTENTE</Pill>}
        >
          <div className={styles.formWithAside}>
            <Panel title="Configuration">
              <Field label="Nom" value="Portail des concours" />
              <Field
                label="Redirect URI"
                value="https://concours.gouv.ga/auth/callback"
                mono
              />
              <Field
                label="Scopes"
                value="openid, profile, email, idn:civil_status"
                mono
              />
              <div className={styles.loaStack}>
                {[
                  "LoA 1 · Déclaré",
                  "LoA 2 · Vérifié",
                  "LoA 3 · Présentiel",
                ].map((label, i) => (
                  <div
                    key={label}
                    className={cx(
                      styles.loaChoice,
                      i === 1 && styles.loaSelected,
                    )}
                  >
                    <span>{i + 1}</span>
                    <div>
                      <b>{label}</b>
                      <small>{i === 1 ? "Sélection actuelle" : ""}</small>
                    </div>
                    {i === 1 ? <CheckCircle2 size={14} /> : null}
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Après la création">
              <Timeline
                items={[
                  {
                    title: "Application en attente",
                    detail: "Aucun trafic de production",
                  },
                  {
                    title: "Revue de conformité",
                    detail: "Scopes, URL et responsable",
                  },
                  {
                    title: "Approbation manuelle",
                    detail: "Activation et journal d’audit",
                  },
                ]}
              />
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Annuler</MockButton>
                <MockButton icon={Plus}>Créer l’application</MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="admin.identite.ga/apps/idn_live_9D2"
          portal="admin"
          active="Applications OAuth"
          eyebrow="Portail Santé · demande reçue il y a 51 h"
          title="Revue de production"
          action={
            <>
              <MockButton tone="danger">Refuser</MockButton>
              <MockButton icon={Check}>Approuver</MockButton>
            </>
          }
        >
          <div className={styles.reviewLayout}>
            <div>
              <Panel
                title="Résumé de la demande"
                meta={<Pill tone="yellow">EN ATTENTE</Pill>}
              >
                <div className={styles.detailRows}>
                  {[
                    ["Organisation", "CNAMGS"],
                    ["Niveau minimum", "LoA 3 · Présentiel"],
                    ["Redirect URIs", "2 domaines HTTPS"],
                    ["Scopes", "6 demandés"],
                    ["Développeur", "Identité vérifiée"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Justification des accès">
                <div className={styles.scopeReview}>
                  <div>
                    <code>idn:civil_status</code>
                    <span>Préremplir l’identité du bénéficiaire</span>
                    <Pill tone="green">COHÉRENT</Pill>
                  </div>
                  <div>
                    <code>idn:iboite.send</code>
                    <span>Envoyer les notifications de prise en charge</span>
                    <Pill tone="yellow">À CONFIRMER</Pill>
                  </div>
                  <div>
                    <code>offline_access</code>
                    <span>Suivre le dossier sans nouvelle connexion</span>
                    <Pill tone="green">COHÉRENT</Pill>
                  </div>
                </div>
              </Panel>
            </div>
            <Panel title="Historique de la revue">
              <Timeline
                items={[
                  { title: "Demande déposée", detail: "Par claire@cnamgs.ga" },
                  {
                    title: "Contrôle automatique terminé",
                    detail: "URL et certificats valides",
                  },
                  {
                    title: "Scope sensible détecté",
                    detail: "idn:iboite.send",
                    tone: "yellow",
                  },
                ]}
              />
              <div className={styles.reviewerNote}>
                <b>Note de décision</b>
                <span>Ajouter une justification au journal d’audit…</span>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="04"
          route="admin.identite.ga/apps/idn_live_9D2/delegation"
          portal="admin"
          active="Applications OAuth"
          eyebrow="Portail Santé · autorisations avancées"
          title="Délégation d’identité"
          action={<MockButton tone="danger">Désactiver</MockButton>}
        >
          <div className={styles.delegationLayout}>
            <Panel
              title="Autorisation actuelle"
              meta={<Pill tone="green">ACTIVÉE</Pill>}
            >
              <div className={styles.delegationHero}>
                <Fingerprint size={25} />
                <div>
                  <h3>Création d’identités déléguées</h3>
                  <p>
                    Portail Santé peut créer une identité pour un citoyen,
                    jusqu’au niveau 2.
                  </p>
                </div>
              </div>
              <div className={styles.optionRow}>
                <div>
                  <b>Niveau maximum assignable</b>
                  <span>
                    Une vérification de pièce est obligatoire au niveau 2.
                  </span>
                </div>
                <Pill tone="blue">
                  NIVEAU 2 <ChevronDown size={10} />
                </Pill>
              </div>
              <div className={styles.warningBox}>
                Cette autorisation affecte les prochaines créations. Les
                identités déjà réclamées restent actives.
              </div>
            </Panel>
            <Panel title="Identités créées" meta={<span>128 au total</span>}>
              <MiniTable
                headers={["IDN ID", "NOM", "NIVEAU", "ÉTAT"]}
                rows={[
                  [
                    <code key="a">GA-24••-9182</code>,
                    "A. Obame",
                    "LoA 2",
                    <Pill key="x" tone="green">
                      RÉCLAMÉE
                    </Pill>,
                  ],
                  [
                    <code key="a">GA-24••-7721</code>,
                    "M. Ndong",
                    "LoA 1",
                    <Pill key="x" tone="yellow">
                      EN ATTENTE
                    </Pill>,
                  ],
                  [
                    <code key="a">GA-24••-4803</code>,
                    "B. Mba",
                    "LoA 2",
                    <Pill key="x" tone="green">
                      RÉCLAMÉE
                    </Pill>,
                  ],
                ]}
              />
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-users"
        index="A04"
        portal="admin"
        title="Examiner les comptes IDN"
        description="La recherche, le détail d’un compte, les parcours KYC, les doublons et les actions destructrices sont conçus comme un dossier d’instruction."
        screens="4 écrans"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/users"
          portal="admin"
          active="Comptes IDN"
          eyebrow="142 318 comptes · registre national"
          title="Comptes IDN"
          action={
            <MockButton tone="secondary">Exporter la sélection</MockButton>
          }
        >
          <div className={styles.filterBar}>
            <div>
              <Search size={13} />
              <span>Email, ID IDN, NIP, nom…</span>
            </div>
            <Pill>Profil : tous</Pill>
            <Pill>Niveau : tous</Pill>
            <Pill>État : actif</Pill>
            <SlidersHorizontal size={14} />
          </div>
          <div className={styles.tabLine}>
            <b>Tous les comptes</b>
            <span>
              Doublons <em>7</em>
            </span>
            <span>
              Suppression programmée <em>3</em>
            </span>
          </div>
          <Panel>
            <MiniTable
              headers={[
                "COMPTE",
                "IDENTIFIANT",
                "NIVEAU",
                "PROFIL",
                "INSCRIPTION",
                "ÉTAT",
              ]}
              rows={[
                [
                  <span key="a" className={styles.personCell}>
                    <i>OM</i>
                    <b>
                      Olivia Moussavou<small>olivia@idn.ga</small>
                    </b>
                  </span>,
                  <code key="b">GA-24-9182</code>,
                  "LoA 3",
                  "Citoyen",
                  "12 mai 2025",
                  <Pill key="x" tone="green">
                    ACTIF
                  </Pill>,
                ],
                [
                  <span key="a" className={styles.personCell}>
                    <i>JN</i>
                    <b>
                      Jules Ndong<small>jules@idn.ga</small>
                    </b>
                  </span>,
                  <code key="b">GA-24-7721</code>,
                  "LoA 2",
                  "Résident",
                  "4 juin 2025",
                  <Pill key="x" tone="green">
                    ACTIF
                  </Pill>,
                ],
                [
                  <span key="a" className={styles.personCell}>
                    <i>EB</i>
                    <b>
                      Emma Biyoghe<small>emma@idn.ga</small>
                    </b>
                  </span>,
                  <code key="b">GA-24-4803</code>,
                  "LoA 1",
                  "Citoyen",
                  "18 août 2026",
                  <Pill key="x" tone="yellow">
                    À VÉRIFIER
                  </Pill>,
                ],
              ]}
            />
          </Panel>
        </MockFrame>
        <MockFrame
          number="02"
          route="admin.identite.ga/users/usr_olivia"
          portal="admin"
          active="Comptes IDN"
          eyebrow="GA-24-9182 · compte actif"
          title="Olivia Moussavou"
          action={
            <>
              <MockButton tone="secondary">Anonymiser</MockButton>
              <MockButton tone="danger">Supprimer</MockButton>
            </>
          }
        >
          <div className={styles.profileBanner}>
            <span>OM</span>
            <div>
              <h3>Olivia Moussavou</h3>
              <p>olivia@idn.ga · Citoyenne · inscrite le 12 mai 2025</p>
            </div>
            <Pill tone="green">LoA 3</Pill>
            <Pill tone="blue">EMAIL VÉRIFIÉ</Pill>
          </div>
          <div className={styles.profileGrid}>
            <Panel title="Identité déclarée">
              <div className={styles.detailRows}>
                {[
                  ["Nom complet", "Olivia Moussavou"],
                  ["Date de naissance", "14 février 1994"],
                  ["Nationalité", "Gabonaise"],
                  ["Téléphone", "+241 06 •• •• 18"],
                  ["NIP", "••••••••4821"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Authentification">
              <div className={styles.detailRows}>
                {[
                  ["Compte", "Présent"],
                  ["Email", "Vérifié"],
                  ["PIN", "Configuré"],
                  ["Double authentification", "Activée"],
                  ["Sessions", "2 actives"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Récupération du PIN">
              <div className={styles.infoCallout}>
                <CheckCircle2 size={16} />
                <p>
                  <b>Envoi SMS autorisé</b>
                  <span>Aucun doublon de téléphone, NIP ou identité.</span>
                </p>
              </div>
              <div className={styles.cardLink}>
                Voir les contrôles <ChevronRight size={11} />
              </div>
            </Panel>
            <Panel title="Cycle de vie">
              <Timeline
                items={[
                  { title: "Compte créé", detail: "12 mai 2025" },
                  { title: "LoA 2 obtenu", detail: "14 mai 2025" },
                  { title: "LoA 3 obtenu", detail: "3 juillet 2025" },
                ]}
              />
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="admin.identite.ga/users?view=duplicates"
          portal="admin"
          active="Comptes IDN"
          eyebrow="7 dossiers · 2 signaux forts"
          title="Doublons à arbitrer"
          action={<Pill tone="blue">Aucune fusion automatique</Pill>}
        >
          <div className={styles.duplicateGrid}>
            <Panel
              title="Signal visage · 94 %"
              meta={<Pill tone="yellow">À ARBITRER</Pill>}
            >
              <div className={styles.compareAccounts}>
                <div>
                  <span>OM</span>
                  <b>Olivia Moussavou</b>
                  <code>GA-24-9182</code>
                  <Pill tone="green">LoA 3</Pill>
                </div>
                <i>↔</i>
                <div>
                  <span>OO</span>
                  <b>Olivia Obame</b>
                  <code>GA-26-1044</code>
                  <Pill tone="blue">LoA 2</Pill>
                </div>
              </div>
              <div className={styles.signalFacts}>
                <span>
                  <b>Même visage</b> similarité 94 %
                </span>
                <span>
                  <b>NIP différents</b> aucun conflit
                </span>
                <span>
                  <b>Téléphones différents</b> aucun conflit
                </span>
              </div>
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Écarter</MockButton>
                <MockButton tone="danger">Confirmer le doublon</MockButton>
              </div>
            </Panel>
            <Panel title="Pourquoi ce dossier ?">
              <p className={styles.bodyCopy}>
                Le rapprochement repose uniquement sur la biométrie. Confirmer
                le signalement ne supprime aucun compte.
              </p>
              <div className={styles.infoCallout}>
                <ShieldCheck size={16} />
                <p>
                  <b>Décision réversible</b>
                  <span>Le signal reste archivé avec l’agent et le motif.</span>
                </p>
              </div>
              <Field
                label="Note d’arbitrage"
                value="Visages proches, identité civile distincte…"
              />
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="04"
          route="admin.identite.ga/users/usr_olivia/delete"
          portal="admin"
          active="Comptes IDN"
          eyebrow="Action irréversible · double confirmation"
          title="Supprimer définitivement le compte"
          action={<Pill tone="red">DANGER</Pill>}
        >
          <div className={styles.dangerLayout}>
            <Panel>
              <div className={styles.dangerHead}>
                <Trash2 size={21} />
                <div>
                  <h3>Cette action libère l’adresse @idn.ga</h3>
                  <p>
                    Le compte d’authentification, l’identité pivot, les données
                    KYC, iBoîte, iDoc, iCV et iCarte seront supprimés.
                  </p>
                </div>
              </div>
              <div className={styles.impactList}>
                <div>
                  <span>Compte concerné</span>
                  <b>Olivia Moussavou · GA-24-9182</b>
                </div>
                <div>
                  <span>Sessions</span>
                  <b>2 sessions seront révoquées</b>
                </div>
                <div>
                  <span>Audit</span>
                  <b>Conservé 5 ans</b>
                </div>
                <div>
                  <span>Récupération</span>
                  <b className={styles.textred}>Impossible</b>
                </div>
              </div>
              <Field
                label="Motif journalisé"
                value="Compte créé en double après vérification du dossier…"
              />
              <Field
                label="Recopiez GA-24-9182 pour confirmer"
                value="GA-24-9182"
                mono
              />
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Annuler</MockButton>
                <MockButton tone="danger" icon={Trash2}>
                  Supprimer définitivement
                </MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-audit"
        index="A05"
        portal="admin"
        title="Lire et exploiter l’audit"
        description="Les filtres deviennent permanents et composables. Un événement s’ouvre dans un panneau latéral avec son acteur, sa cible, le contexte réseau et les métadonnées."
        screens="2 écrans"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/logs"
          portal="admin"
          active="Audit"
          eyebrow="Temps réel · 18 420 événements aujourd’hui"
          title="Journal d’audit"
          action={<MockButton tone="secondary">Exporter CSV</MockButton>}
        >
          <div className={styles.filterBar}>
            <Pill>
              24 heures <ChevronDown size={10} />
            </Pill>
            <Pill>Actions : toutes</Pill>
            <Pill>Acteurs : tous</Pill>
            <div>
              <Search size={13} />
              <span>Identifiant, IP, cible…</span>
            </div>
            <span className={styles.liveLabel}>
              <i /> EN DIRECT
            </span>
          </div>
          <Panel>
            <MiniTable
              headers={["HEURE", "NIVEAU", "ACTION", "ACTEUR", "CIBLE", "IP"]}
              rows={[
                [
                  "11:42:18",
                  <Pill key="x" tone="green">
                    INFO
                  </Pill>,
                  <code key="a">oauth.app.approved</code>,
                  "p.nze@idn.ga",
                  "idn_live_9D2",
                  "102.89.12.41",
                ],
                [
                  "11:41:02",
                  <Pill key="x" tone="red">
                    ERREUR
                  </Pill>,
                  <code key="a">login.failure</code>,
                  "—",
                  "olivia@idn.ga",
                  "197.149.2.18",
                ],
                [
                  "11:39:55",
                  <Pill key="x" tone="blue">
                    SÉCURITÉ
                  </Pill>,
                  <code key="a">role.assigned</code>,
                  "a.mba@idn.ga",
                  "usr_ctrl_82",
                  "102.89.12.16",
                ],
                [
                  "11:38:20",
                  <Pill key="x" tone="yellow">
                    ALERTE
                  </Pill>,
                  <code key="a">duplicate.detected</code>,
                  "system",
                  "flag_72b1",
                  "—",
                ],
              ]}
            />
          </Panel>
        </MockFrame>
        <MockFrame
          number="02"
          route="admin.identite.ga/logs/evt_a92f"
          portal="admin"
          active="Audit"
          eyebrow="Événement · 27 août 2026 à 11:42:18"
          title="Application approuvée"
          action={
            <MockButton tone="secondary" icon={Copy}>
              Copier le JSON
            </MockButton>
          }
        >
          <div className={styles.auditDetail}>
            <Panel title="Résumé" meta={<Pill tone="green">INFO</Pill>}>
              <div className={styles.auditHero}>
                <CheckCircle2 size={25} />
                <div>
                  <h3>oauth.app.approved</h3>
                  <p>
                    Patrick Nze a approuvé Portail Santé pour la production.
                  </p>
                </div>
              </div>
              <div className={styles.detailRows}>
                {[
                  ["Acteur", "patrick.nze@identite.ga"],
                  ["Rôle", "Administrateur système"],
                  ["Cible", "idn_live_9D2"],
                  ["Adresse IP", "102.89.12.41"],
                  ["Session", "sess_••••28f1"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Métadonnées">
              <CodeBlock>{`{\n  "previous_status": "pending",\n  "new_status": "production",\n  "review_note": "Conforme",\n  "scopes": 6\n}`}</CodeBlock>
              <div className={styles.cardLink}>
                Ouvrir Portail Santé <ExternalLink size={11} />
              </div>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-roles"
        index="A06"
        portal="admin"
        title="Gérer les habilitations"
        description="Les rôles sont expliqués par leurs permissions réelles. La création d’un opérateur et l’accès développeur à la production demandent une décision traçable."
        screens="3 écrans"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/roles"
          portal="admin"
          active="Habilitations"
          eyebrow="56 agents · 3 rôles"
          title="Rôles et habilitations"
          action={<MockButton icon={Plus}>Nouvel opérateur</MockButton>}
        >
          <div className={styles.roleCards}>
            {[
              ["Administrateur système", "8 agents", "Accès complet", "green"],
              [
                "Contrôleur d’identité",
                "31 agents",
                "KYC et vérifications",
                "blue",
              ],
              ["Développeur", "17 agents", "Apps, clés et webhooks", "neutral"],
            ].map(([name, count, perms, tone]) => (
              <Panel key={name}>
                <div className={styles.roleTitle}>
                  <i className={styles[`role${tone}`]} />
                  <h4>{name}</h4>
                  <span>{count}</span>
                </div>
                <p>{perms}</p>
                <div className={styles.scopeChips}>
                  <Pill>Journalisé</Pill>
                  <Pill>
                    {name === "Administrateur système"
                      ? "MFA requis"
                      : "Accès nominatif"}
                  </Pill>
                </div>
              </Panel>
            ))}
          </div>
          <Panel
            title="Opérateurs habilités"
            meta={
              <div className={styles.segmented}>
                <b>Tous</b>
                <span>Admins</span>
                <span>Contrôleurs</span>
                <span>Développeurs</span>
              </div>
            }
          >
            <MiniTable
              headers={[
                "OPÉRATEUR",
                "RÔLE",
                "DERNIÈRE ACTIVITÉ",
                "STATUT",
                "ACCÈS",
              ]}
              rows={[
                [
                  <span key="a" className={styles.personCell}>
                    <i>PN</i>
                    <b>
                      Patrick Nze<small>patrick.nze@identite.ga</small>
                    </b>
                  </span>,
                  "Administrateur",
                  "il y a 3 min",
                  <Pill key="x" tone="green">
                    ACTIF
                  </Pill>,
                  "Tout accès",
                ],
                [
                  <span key="a" className={styles.personCell}>
                    <i>CN</i>
                    <b>
                      Claire Ndong<small>claire.ndong@identite.ga</small>
                    </b>
                  </span>,
                  "Contrôle identité",
                  "il y a 28 min",
                  <Pill key="x" tone="green">
                    ACTIF
                  </Pill>,
                  "KYC",
                ],
                [
                  <span key="a" className={styles.personCell}>
                    <i>AM</i>
                    <b>
                      Ariane Mba<small>ariane@okatech.ga</small>
                    </b>
                  </span>,
                  "Développeur",
                  "hier, 18:02",
                  <Pill key="x" tone="yellow">
                    SANDBOX
                  </Pill>,
                  "Production à valider",
                ],
              ]}
            />
          </Panel>
        </MockFrame>
        <MockFrame
          number="02"
          route="admin.identite.ga/roles/new"
          portal="admin"
          active="Habilitations"
          eyebrow="Création d’un accès nominatif"
          title="Nouvel opérateur"
          action={<Pill tone="blue">MOT DE PASSE PROVISOIRE</Pill>}
        >
          <div className={styles.formWithAside}>
            <Panel title="Identité et rôle">
              <div className={styles.roleSelector}>
                <ChoiceCard
                  icon={Fingerprint}
                  title="Contrôleur d’identité"
                  text="Scanner et valider les KYC"
                  selected
                />
                <ChoiceCard
                  icon={Code2}
                  title="Développeur"
                  text="Gérer des applications OAuth"
                />
              </div>
              <div className={styles.twoCols}>
                <Field label="Nom complet" value="Mireille Essono" />
                <Field
                  label="Email professionnel"
                  value="m.essono@identite.ga"
                />
              </div>
              <Field
                label="Mot de passe provisoire"
                value="B9!n••••••••"
                hint="À transmettre hors ligne"
              />
            </Panel>
            <Panel title="Conditions d’accès">
              <div className={styles.checkList}>
                <span>
                  <Check size={12} /> Changement du mot de passe à la connexion
                </span>
                <span>
                  <Check size={12} /> MFA et PIN obligatoires
                </span>
                <span>
                  <Check size={12} /> Toutes les décisions seront auditées
                </span>
              </div>
              <div className={styles.warningBox}>
                L’opérateur recevra le rôle dès la création du compte.
              </div>
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Annuler</MockButton>
                <MockButton icon={UserCheck}>Créer le compte</MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
        <MockFrame
          number="03"
          route="admin.identite.ga/roles/developers/ariane"
          portal="admin"
          active="Habilitations"
          eyebrow="Développeur · Ariane Mba"
          title="Autoriser la production"
          action={<Pill tone="yellow">SANDBOX UNIQUEMENT</Pill>}
        >
          <div className={styles.permissionLayout}>
            <Panel>
              <div className={styles.profileHead}>
                <span>AM</span>
                <div>
                  <b>Ariane Mba</b>
                  <small>ariane@okatech.ga · compte créé le 18 août</small>
                </div>
                <Pill tone="blue">EMAIL VÉRIFIÉ</Pill>
              </div>
              <div className={styles.detailRows}>
                {[
                  ["Organisation", "Okatech"],
                  ["Applications", "3 en sandbox"],
                  ["Demandes en attente", "1"],
                  ["Dernière connexion", "hier à 18:02"],
                  ["Contrôle identité", "Terminé le 20 août"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Décision">
              <p className={styles.bodyCopy}>
                Autoriser ce compte permet de soumettre des applications à la
                revue de production. Chaque application restera approuvée
                séparément.
              </p>
              <Field
                label="Motif journalisé"
                value="Identité professionnelle vérifiée par l’équipe partenaires."
              />
              <div className={styles.checkList}>
                <span>
                  <Check size={12} /> N’active aucune application
                </span>
                <span>
                  <Check size={12} /> Peut être retiré à tout moment
                </span>
              </div>
              <div className={styles.buttonRow}>
                <MockButton tone="secondary">Conserver la sandbox</MockButton>
                <MockButton icon={ShieldCheck}>
                  Autoriser la production
                </MockButton>
              </div>
            </Panel>
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-providers"
        index="A07"
        portal="admin"
        title="Surveiller les canaux email et SMS"
        description="Même si la configuration reste manuelle, la page peut déjà montrer l’état réel, les volumes, les incidents et la prochaine action technique."
        screens="1 écran"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/providers"
          portal="admin"
          active="Canaux"
          eyebrow="Communication · santé des providers"
          title="Canaux email et SMS"
          action={<Pill tone="yellow">CONFIGURATION MANUELLE</Pill>}
        >
          <div className={styles.providerGrid}>
            {PROVIDER_MOCKS.map(
              ([title, provider, state, volume, quality, ProviderIcon], i) => (
                <Panel
                  key={String(title)}
                  title={title}
                  meta={
                    <Pill tone={i === 0 ? "green" : "yellow"}>{state}</Pill>
                  }
                >
                  <div className={styles.providerHero}>
                    <span>
                      <ProviderIcon size={20} />
                    </span>
                    <div>
                      <h3>{provider}</h3>
                      <p>
                        {i === 0
                          ? "OTP, vérification et notifications système"
                          : "Récupération de PIN et alertes de sécurité"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.providerStats}>
                    <span>
                      <b>{volume}</b> ce mois
                    </span>
                    <span>
                      <b>{quality}</b> sur 30 jours
                    </span>
                  </div>
                  <Bars
                    values={
                      i === 0
                        ? [32, 38, 42, 48, 44, 57, 62, 58, 70, 74, 69, 81]
                        : [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
                    }
                  />
                  <div className={styles.cardLink}>
                    {i === 0
                      ? "Voir les incidents"
                      : "Lire la procédure de configuration"}{" "}
                    <ArrowRight size={11} />
                  </div>
                </Panel>
              ),
            )}
          </div>
        </MockFrame>
      </Journey>

      <Journey
        id="admin-settings"
        index="A08"
        portal="admin"
        title="Paramètres administrateur"
        description="Le profil et les préférences reprennent le même système que le portail développeur, avec les contrôles de sécurité propres à un compte privilégié."
        screens="2 écrans"
      >
        <MockFrame
          number="01"
          route="admin.identite.ga/settings"
          portal="admin"
          active="Habilitations"
          eyebrow="Compte privilégié"
          title="Profil et sécurité"
          action={<MockButton>Enregistrer</MockButton>}
        >
          <div className={styles.settingsLayout}>
            <aside>
              <b>COMPTE</b>
              <span className={styles.settingsActive}>Profil et sécurité</span>
              <span>Préférences</span>
              <span>Sessions</span>
            </aside>
            <div>
              <Panel title="Identité administrative">
                <div className={styles.profileHead}>
                  <span>PN</span>
                  <div>
                    <b>Patrick Nze</b>
                    <small>patrick.nze@identite.ga</small>
                  </div>
                  <Pill tone="green">ADMIN SYSTÈME</Pill>
                </div>
                <div className={styles.twoCols}>
                  <Field label="Nom complet" value="Patrick Nze" />
                  <Field
                    label="Adresse email"
                    value="patrick.nze@identite.ga"
                  />
                </div>
              </Panel>
              <Panel title="Protection du compte">
                <div className={styles.securityRow}>
                  <ShieldCheck size={16} />
                  <div>
                    <b>Double authentification</b>
                    <span>Clé de sécurité + code de secours</span>
                  </div>
                  <Pill tone="green">ACTIVE</Pill>
                </div>
                <div className={styles.securityRow}>
                  <Clock3 size={16} />
                  <div>
                    <b>Rotation du mot de passe</b>
                    <span>Dernière modification il y a 32 jours</span>
                  </div>
                  <MockButton tone="secondary">Modifier</MockButton>
                </div>
              </Panel>
            </div>
          </div>
        </MockFrame>
        <MockFrame
          number="02"
          route="admin.identite.ga/settings?tab=preferences"
          portal="admin"
          active="Habilitations"
          eyebrow="Compte privilégié"
          title="Préférences"
          action={<MockButton>Enregistrer</MockButton>}
        >
          <div className={styles.settingsLayout}>
            <aside>
              <b>COMPTE</b>
              <span>Profil et sécurité</span>
              <span className={styles.settingsActive}>Préférences</span>
              <span>Sessions</span>
            </aside>
            <div>
              <Panel title="Console">
                <div className={styles.optionRow}>
                  <div>
                    <b>Langue</b>
                    <span>Interface et exports</span>
                  </div>
                  <Pill>
                    Français <ChevronDown size={10} />
                  </Pill>
                </div>
                <div className={styles.optionRow}>
                  <div>
                    <b>Fuseau horaire</b>
                    <span>Horodatage de l’audit</span>
                  </div>
                  <Pill>
                    Libreville · UTC+1 <ChevronDown size={10} />
                  </Pill>
                </div>
                <div className={styles.optionRow}>
                  <div>
                    <b>Densité des tables</b>
                    <span>Nombre de lignes visibles</span>
                  </div>
                  <Pill>
                    Confortable <ChevronDown size={10} />
                  </Pill>
                </div>
              </Panel>
              <Panel title="Alertes">
                <div className={styles.toggleRow}>
                  <div>
                    <b>Demande de production</b>
                    <span>Notification dès qu’une app entre en revue</span>
                  </div>
                  <i className={styles.toggleOn} />
                </div>
                <div className={styles.toggleRow}>
                  <div>
                    <b>Alerte de sécurité</b>
                    <span>Échecs de connexion et actions sensibles</span>
                  </div>
                  <i className={styles.toggleOn} />
                </div>
                <div className={styles.toggleRow}>
                  <div>
                    <b>Rapport hebdomadaire</b>
                    <span>Résumé envoyé le lundi matin</span>
                  </div>
                  <i />
                </div>
              </Panel>
            </div>
          </div>
        </MockFrame>
      </Journey>

      <section className={styles.coverage} id="coverage">
        <div className={styles.sectionLabel}>COUVERTURE DE LA PROPOSITION</div>
        <div className={styles.coverageGrid}>
          <article>
            <h2>Développeur</h2>
            <p>
              Accueil · Connexion · Inscription · Vérification email ·
              Applications · Création · Secret · OAuth · Redirect URIs ·
              Testeurs · Production · Webhooks · Livraisons · Services · Clés
              M2M · Usage · Documentation · Paramètres
            </p>
          </article>
          <article>
            <h2>Administration</h2>
            <p>
              Connexion · Centre de contrôle · Applications · Création interne ·
              Revue production · Délégation · Comptes · Détail · KYC · Doublons
              · Suppression · Audit · Rôles · Opérateurs · Validation
              développeur · Providers · Paramètres
            </p>
          </article>
        </div>
        <div className={styles.closingNote}>
          <FlagMark />
          <div>
            <b>Un seul système, deux métiers.</b>
            <span>
              Les composants, la palette et les règles de décision sont communs.
              La densité et les priorités changent selon le rôle.
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
