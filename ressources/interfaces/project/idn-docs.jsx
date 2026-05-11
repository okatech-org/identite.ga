// IDN Developer Docs — public-facing documentation site (docs.identite.ga)
// Accessible logged-in or not. Three-pane layout: sidebar nav · content · TOC.

function DocsSite({ t, screen = 'home' }) {
  const url = screen === 'home' ? 'https://docs.identite.ga' : `https://docs.identite.ga/${screen}`;
  return (
    <BrowserChrome t={t} url={url} w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden' }}>
        <DocsTopBar t={t} screen={screen}/>
        {screen === 'home' ? (
          <div style={{ flex: 1, overflow: 'auto' }}><DocsHome t={t}/></div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <DocsSidebar t={t} active={screen}/>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderDocsContent(screen, t)}
            </div>
          </div>
        )}
      </div>
    </BrowserChrome>
  );
}

function renderDocsContent(screen, t) {
  switch (screen) {
    case 'quickstart-better-auth': return <DocsQSBetterAuth t={t}/>;
    case 'quickstart-nextauth':    return <DocsQSNextAuth t={t}/>;
    case 'quickstart-react':       return <DocsQSReact t={t}/>;
    case 'quickstart-vanilla':     return <DocsQSVanilla t={t}/>;
    case 'register-app':           return <DocsRegisterApp t={t}/>;
    case 'core-overview':          return <DocsCoreOverview t={t}/>;
    case 'core-api':               return <DocsCoreApi t={t}/>;
    case 'react-hooks':            return <DocsReactHooks t={t}/>;
    case 'react-components':      return <DocsReactComponents t={t}/>;
    case 'loa':                    return <DocsLoA t={t}/>;
    case 'security':               return <DocsSecurity t={t}/>;
    case 'migration-clerk':        return <DocsMigration t={t}/>;
    case 'playground':             return <DocsPlayground t={t}/>;
    default: return <DocsCoreOverview t={t}/>;
  }
}

// ─────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────
function DocsTopBar({ t, screen }) {
  const tabs = [
    { id: 'docs', label: 'Documentation', on: screen !== 'home' },
    { id: 'guides', label: 'Guides' },
    { id: 'reference', label: 'Référence API' },
    { id: 'playground', label: 'Playground' },
  ];
  return (
    <div style={{ height: 56, padding: '0 28px', borderBottom: `1px solid ${t.border}`, background: t.surface, display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IdnMark size={24} t={t}/>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>IDN<span style={{ color: t.muted, fontWeight: 400 }}> / Docs</span></div>
        <span style={{ fontSize: 10, fontFamily: idnTokens.mono, color: t.muted, padding: '2px 7px', borderRadius: 9999, background: t.surface2, letterSpacing: 0.5 }}>v1.0.0</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 18 }}>
        {tabs.map(tb => (
          <div key={tb.id} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13,
            fontWeight: tb.on ? 600 : 500,
            color: tb.on ? idnTokens.green : t.ink2,
            background: tb.on ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent',
            cursor: 'pointer',
          }}>{tb.label}</div>
        ))}
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface2, width: 280 }}>
        <span style={{ color: t.muted }}>{IdnIcons.search}</span>
        <span style={{ fontSize: 12, color: t.muted, flex: 1 }}>Rechercher dans la doc…</span>
        <span style={{ fontSize: 10, fontFamily: idnTokens.mono, color: t.muted, padding: '2px 6px', borderRadius: 4, background: t.surface, border: `1px solid ${t.border}` }}>⌘K</span>
      </div>
      <IdnButton t={t} variant="ghost" size="sm" leadIcon={IdnIcons.code}>GitHub</IdnButton>
      <IdnButton t={t} variant="primary" size="sm">Console développeur</IdnButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar nav
// ─────────────────────────────────────────────────────────────
function DocsSidebar({ t, active }) {
  const groups = [
    { title: 'PREMIERS PAS', items: [
      { id: 'register-app', label: 'Enregistrer une application' },
      { id: 'quickstart-better-auth', label: 'Quick start · Better Auth' },
      { id: 'quickstart-nextauth',    label: 'Quick start · NextAuth' },
      { id: 'quickstart-react',       label: 'Quick start · React' },
      { id: 'quickstart-vanilla',     label: 'Quick start · vanilla JS' },
    ]},
    { title: '@IDN/CORE', items: [
      { id: 'core-overview', label: 'Présentation' },
      { id: 'core-api',      label: 'Référence API' },
    ]},
    { title: '@IDN/REACT', items: [
      { id: 'react-hooks',     label: 'Hooks' },
      { id: 'react-components', label: 'Composants' },
    ]},
    { title: 'GUIDES', items: [
      { id: 'loa',             label: 'Niveaux de garantie (LoA)' },
      { id: 'security',        label: 'Sécurité OIDC' },
      { id: 'migration-clerk', label: 'Migration depuis Clerk' },
    ]},
    { title: 'OUTILS', items: [
      { id: 'playground',      label: 'Playground OIDC' },
    ]},
  ];
  return (
    <div style={{ width: 260, borderRight: `1px solid ${t.border}`, padding: '24px 18px', overflow: 'auto', background: t.surface, flexShrink: 0 }}>
      {groups.map(g => (
        <div key={g.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 8, paddingLeft: 10 }}>{g.title}</div>
          {g.items.map(it => {
            const sel = it.id === active;
            return (
              <div key={it.id} style={{
                padding: '7px 10px', borderRadius: 6, fontSize: 13,
                color: sel ? idnTokens.green : t.ink2,
                fontWeight: sel ? 600 : 400,
                background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent',
                borderLeft: sel ? `2px solid ${idnTokens.green}` : '2px solid transparent',
                cursor: 'pointer', marginBottom: 1,
              }}>{it.label}</div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Doc content primitives
// ─────────────────────────────────────────────────────────────
function DocBody({ children, t, breadcrumbs, toc }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: toc ? '1fr 200px' : '1fr', gap: 28, padding: '36px 44px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ minWidth: 0 }}>
        {breadcrumbs && (
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 14 }}>
            {breadcrumbs.map((b, i) => (
              <span key={i}>{i > 0 && <span style={{ margin: '0 8px', color: t.mutedSoft }}>/</span>}{b}</span>
            ))}
          </div>
        )}
        {children}
      </div>
      {toc && (
        <div style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>SUR CETTE PAGE</div>
          {toc.map((tt, i) => (
            <div key={i} style={{ fontSize: 12, padding: '4px 0', color: i === 0 ? idnTokens.green : t.ink2, fontWeight: i === 0 ? 600 : 400, borderLeft: i === 0 ? `2px solid ${idnTokens.green}` : `2px solid ${t.borderSoft}`, paddingLeft: 10, marginLeft: tt.depth ? tt.depth * 12 : 0, cursor: 'pointer' }}>{tt.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function H1({ children, t }) {
  return <div style={{ fontSize: 36, fontWeight: 600, color: t.ink, letterSpacing: -0.6, lineHeight: 1.15 }}>{children}</div>;
}
function H2({ children, t }) {
  return <div style={{ fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: -0.3, marginTop: 36, paddingTop: 8 }}>{children}</div>;
}
function Lede({ children, t }) {
  return <div style={{ fontSize: 16, color: t.muted, lineHeight: 1.65, marginTop: 12, maxWidth: 720 }}>{children}</div>;
}
function P({ children, t }) {
  return <div style={{ fontSize: 14, color: t.ink2, lineHeight: 1.7, marginTop: 14, maxWidth: 720 }}>{children}</div>;
}
function Code({ children }) {
  return <span style={{ fontFamily: idnTokens.mono, fontSize: 12, padding: '1px 5px', borderRadius: 4, background: 'rgba(120,130,110,0.12)' }}>{children}</span>;
}

function CodeBlock({ t, lang = 'ts', title, children }) {
  return (
    <div style={{ marginTop: 18, borderRadius: 10, border: `1px solid ${t.border}`, overflow: 'hidden', background: t.dark ? '#0F1310' : '#1A1F1B' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: `1px solid ${t.dark ? '#1F2520' : '#2A302C'}`, background: t.dark ? '#10150F' : '#151A16' }}>
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#FF5F57' }}/>
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#FEBC2E' }}/>
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#28C840' }}/>
        <span style={{ fontFamily: idnTokens.mono, fontSize: 11, color: '#A8B4A2', marginLeft: 8 }}>{title || lang}</span>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 10, color: '#6B7565', fontFamily: idnTokens.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang}</span>
        <span style={{ fontSize: 11, color: '#6B7565', cursor: 'pointer' }}>copier</span>
      </div>
      <pre style={{ margin: 0, padding: '16px 18px', fontFamily: idnTokens.mono, fontSize: 12.5, color: '#E8EAE2', lineHeight: 1.65, overflow: 'auto' }}>
        {children}
      </pre>
    </div>
  );
}

// Inline-colored code (very lightweight syntax highlight)
const cKey = '#E89E5C'; const cStr = '#A3CC8B'; const cCom = '#6B7565'; const cFn = '#8FB4D8'; const cType = '#C68EE0'; const cPunct = '#A8B4A2';
const k = (s) => <span style={{ color: cKey }}>{s}</span>;
const s = (str) => <span style={{ color: cStr }}>{str}</span>;
const cm = (s) => <span style={{ color: cCom, fontStyle: 'italic' }}>{s}</span>;
const fn = (s) => <span style={{ color: cFn }}>{s}</span>;
const ty = (s) => <span style={{ color: cType }}>{s}</span>;
const pn = (s) => <span style={{ color: cPunct }}>{s}</span>;

function Callout({ t, kind = 'info', title, children }) {
  const tone = kind === 'warn' ? { bg: t.dark ? '#1F2316' : idnTokens.yellowSoft, b: t.dark ? '#3A3F1F' : '#E8D67E', ic: '#A7841C' }
    : kind === 'success' ? { bg: t.dark ? '#0F2A18' : idnTokens.greenSoft, b: idnTokens.green, ic: idnTokens.green }
    : { bg: t.dark ? '#10243A' : idnTokens.blueSoft, b: idnTokens.blue, ic: idnTokens.blue };
  return (
    <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 10, background: tone.bg, borderLeft: `3px solid ${tone.b}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ color: tone.ic, marginTop: 2 }}>{kind === 'warn' ? IdnIcons.bell : kind === 'success' ? IdnIcons.check : IdnIcons.shield}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{title}</div>}
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.65, marginTop: title ? 4 : 0 }}>{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home / landing
// ─────────────────────────────────────────────────────────────
function DocsHome({ t }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ padding: '64px 44px 56px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <IdnFlagBars width={32} height={3}/>
          <span style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>DOCUMENTATION DÉVELOPPEUR · v1.0.0</span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 600, color: t.ink, letterSpacing: -1, lineHeight: 1.1, maxWidth: 740 }}>
          Intégrez <span style={{ color: idnTokens.green }}>« Se connecter avec IDN »</span> en moins de 10 lignes.
        </div>
        <div style={{ fontSize: 17, color: t.muted, marginTop: 18, lineHeight: 1.6, maxWidth: 640 }}>
          Le SDK <Code>@idn/*</Code> permet à toute application — gouvernementale, privée, partenaire — d'authentifier ses utilisateurs via Identité Numérique du Gabon. OpenID Connect standard, PKCE obligatoire, zéro vendor lock-in.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <IdnButton t={t} variant="primary" size="lg">Démarrer en 5 min</IdnButton>
          <IdnButton t={t} variant="ghost" size="lg" leadIcon={IdnIcons.code}>Voir sur GitHub</IdnButton>
        </div>
      </div>

      {/* Packages grid */}
      <div style={{ background: t.surface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: '48px 44px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>LES 4 PACKAGES</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>Choisissez votre stack</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 22 }}>
            {[
              { id: '@idn/core',         d: 'Client OIDC vanilla, zéro dépendance', sz: '12 KB', deps: 'aucune' },
              { id: '@idn/react',        d: 'Hooks headless + composants pré-stylés', sz: '25 KB', deps: 'react ≥ 18' },
              { id: '@idn/better-auth',  d: 'Helper genericOAuth pour Better Auth', sz: '5 KB',  deps: 'better-auth' },
              { id: '@idn/next-auth',    d: 'Provider OIDC pour NextAuth v5', sz: '5 KB',  deps: 'next-auth' },
            ].map((p, i) => (
              <div key={i} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontFamily: idnTokens.mono, fontSize: 12, color: idnTokens.green, fontWeight: 600 }}>{p.id}</div>
                <div style={{ fontSize: 13, color: t.ink2, marginTop: 8, lineHeight: 1.5 }}>{p.d}</div>
                <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontFamily: idnTokens.mono, padding: '2px 7px', borderRadius: 9999, background: t.surface2, color: t.muted, letterSpacing: 0.5 }}>{p.sz} gzip</span>
                  <span style={{ fontSize: 10, fontFamily: idnTokens.mono, padding: '2px 7px', borderRadius: 9999, background: t.surface2, color: t.muted, letterSpacing: 0.5 }}>{p.deps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick start tiles */}
      <div style={{ padding: '48px 44px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>QUICK START</div>
        <div style={{ fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>5 minutes pour intégrer IDN</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 22 }}>
          {[
            { title: 'Better Auth + Next.js', desc: 'L\'intégration la plus rapide. Helper officiel.', tag: 'RECOMMANDÉ' },
            { title: 'NextAuth.js v5',        desc: 'Provider IDN prêt à l\'emploi pour Auth.js.', tag: null },
            { title: 'React + Vite',          desc: '<IDNProvider> + hooks headless.', tag: null },
            { title: 'Vanilla JavaScript',    desc: 'Pour toute app non-React (Vue, Svelte, vanilla).', tag: null },
          ].map((q, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.ink }}>{q.title}</div>
                {q.tag && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, letterSpacing: 0.5 }}>{q.tag}</span>}
              </div>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 8, lineHeight: 1.5 }}>{q.desc}</div>
              <div style={{ marginTop: 14, fontSize: 12, color: idnTokens.green, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>Commencer →</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link rail */}
      <div style={{ borderTop: `1px solid ${t.border}`, padding: '32px 44px', background: t.surface }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }}>
          {[
            { h: 'Ressources', l: ['Référence API complète', 'Migration depuis Clerk', 'Migration depuis Auth0', 'Playground OIDC'] },
            { h: 'Spécifications', l: ['OpenID Connect 1.0', 'OAuth 2.1 (draft)', 'Niveaux de garantie eIDAS', 'Conformance Suite'] },
            { h: 'Communauté', l: ['GitHub @idn-ga', 'Discussions', 'Bug bounty', 'Roadmap publique'] },
            { h: 'Plateforme', l: ['identite.ga', 'Console développeur', 'Status idn.ga', 'Contact équipe'] },
          ].map((c, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>{c.h.toUpperCase()}</div>
              {c.l.map(x => <div key={x} style={{ fontSize: 13, color: t.ink2, padding: '5px 0', cursor: 'pointer' }}>{x}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Register an application (the "before you start" doc)
// ─────────────────────────────────────────────────────────────
function DocsRegisterApp({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Premiers pas', 'Enregistrer une application']} toc={[
      { label: 'Avant de commencer' },
      { label: 'Créer l\'application' },
      { label: 'Récupérer les credentials' },
      { label: 'Configurer les redirect URIs' },
      { label: 'Demander la production' },
    ]}>
      <H1 t={t}>Enregistrer une application</H1>
      <Lede t={t}>
        Avant d'écrire la moindre ligne de code, vous devez créer une application OAuth sur la <b style={{ color: t.ink }}>console développeur</b>. Vous y obtiendrez un <Code>client_id</Code> et un <Code>client_secret</Code>.
      </Lede>

      <H2 t={t}>Avant de commencer</H2>
      <P t={t}>Il vous faut un compte IDN de Niveau ≥ 2 (substantiel) avec le profil <b>Développeur</b>. La création du profil dév est gratuite, immédiate, et ne nécessite pas d'agrément officiel pour démarrer en environnement sandbox.</P>

      <H2 t={t}>Créer l'application</H2>
      <P t={t}>Rendez-vous sur <Code>https://developers.idn.ga/apps</Code> → <b>Nouvelle app</b>. Renseignez :</P>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          ['Nom commercial', 'Affiché à l\'utilisateur sur l\'écran de consentement'],
          ['Domaine racine', 'https://votre-app.ga'],
          ['Niveau LoA minimum', '1 / 2 / 3 selon vos besoins'],
          ['Scopes demandés', 'profile, email, ou claims étendus'],
          ['Type d\'application', 'Web public, Web confidential, Native, SPA'],
          ['Environnement initial', 'sandbox uniquement, par défaut'],
        ].map(([l, v], i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, letterSpacing: 0.5 }}>{l.toUpperCase()}</div>
            <div style={{ fontSize: 13, color: t.ink2, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      <H2 t={t}>Récupérer les credentials</H2>
      <P t={t}>Une fois l'app créée, allez dans <b>Clés & secrets</b>. Le <Code>client_secret</Code> ne s'affiche qu'une seule fois — copiez-le dans votre gestionnaire de secrets.</P>

      <CodeBlock t={t} lang="bash" title=".env.local">
{k('IDN_CLIENT_ID')}{pn('=')}consulat-ga{`
`}{k('IDN_CLIENT_SECRET')}{pn('=')}idn_sk_8H42x9Lp3Mq7WnRfGv2sZmTcUe1AhJ...{`
`}{k('IDN_ISSUER')}{pn('=')}{s('https://identite.ga')}
      </CodeBlock>

      <Callout t={t} kind="warn" title="Ne committez jamais le secret">
        Le <Code>client_secret</Code> est l'équivalent d'un mot de passe pour votre application. Stockez-le dans Vercel/AWS Secrets Manager, jamais dans Git. Voir le guide <Code>Sécurité OIDC</Code>.
      </Callout>

      <H2 t={t}>Configurer les redirect URIs</H2>
      <P t={t}>Le serveur IDN refusera toute redirection qui ne matche pas exactement une URI enregistrée. Ajoutez vos URIs dans <b>Configuration → Redirect URIs</b> :</P>
      <CodeBlock t={t} lang="text">
{cm('# Production')}{`
`}{s('https://consulat.ga/auth/callback')}{`
`}{cm('# Staging')}{`
`}{s('https://staging.consulat.ga/auth/callback')}{`
`}{cm('# Développement local')}{`
`}{s('http://localhost:3000/auth/callback')}
      </CodeBlock>

      <H2 t={t}>Demander la production</H2>
      <P t={t}>En sandbox, vous pouvez tester sans limite mais seuls les comptes de test peuvent se connecter. Pour ouvrir à de vrais utilisateurs, soumettez votre app à la revue : <b>App → Production → Demander l'approbation</b>. Délai indicatif : 48-72h ouvrées.</P>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Quick start — Better Auth
// ─────────────────────────────────────────────────────────────
function DocsQSBetterAuth({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Premiers pas', 'Quick start · Better Auth']} toc={[
      { label: 'Prérequis' },
      { label: '1. Installer le package' },
      { label: '2. Configurer Better Auth' },
      { label: '3. Bouton de connexion' },
      { label: '4. Protéger les routes' },
      { label: 'Et maintenant ?' },
    ]}>
      <H1 t={t}>Quick start · Better Auth</H1>
      <Lede t={t}>
        L'intégration la plus rapide. En 5 minutes, votre app Better Auth supporte « Se connecter avec IDN » en plus (ou à la place) des providers existants.
      </Lede>

      <Callout t={t} kind="success" title="Estimation : 5 minutes">
        Suppose que vous avez déjà une app Next.js + Better Auth fonctionnelle. Sinon, suivez d'abord le quick start Better Auth officiel.
      </Callout>

      <H2 t={t}>Prérequis</H2>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {['Better Auth ≥ 1.4.0 installé', 'Plugin genericOAuth activé', 'Application IDN enregistrée (voir page précédente)', 'CLIENT_ID + CLIENT_SECRET récupérés'].map((x, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: t.ink2 }}>
            <span style={{ color: idnTokens.green, display: 'flex' }}>{IdnIcons.check}</span>{x}
          </div>
        ))}
      </div>

      <H2 t={t}>1. Installer le package</H2>
      <CodeBlock t={t} lang="bash" title="terminal">
{cm('# bun')}{`
`}bun add {s('@idn/better-auth')}{`

`}{cm('# pnpm')}{`
`}pnpm add {s('@idn/better-auth')}{`

`}{cm('# npm')}{`
`}npm install {s('@idn/better-auth')}
      </CodeBlock>

      <H2 t={t}>2. Configurer Better Auth</H2>
      <P t={t}>Dans votre <Code>lib/auth.ts</Code>, ajoutez le helper <Code>idn()</Code> à la liste des providers <Code>genericOAuth</Code>.</P>
      <CodeBlock t={t} lang="ts" title="lib/auth.ts">
{k('import')} {pn('{')} betterAuth {pn('}')} {k('from')} {s('"better-auth"')};{`
`}{k('import')} {pn('{')} genericOAuth {pn('}')} {k('from')} {s('"better-auth/plugins"')};{`
`}{k('import')} {pn('{')} idn {pn('}')} {k('from')} {s('"@idn/better-auth"')};{`

`}{k('export const')} auth {pn('=')} {fn('betterAuth')}({pn('{')}{`
  `}plugins: {pn('[')}{`
    `}{fn('genericOAuth')}({pn('{')}{`
      `}config: {pn('[')}{`
        `}{fn('idn')}({pn('{')}{`
          `}clientId: {fn('process')}.env.{ty('IDN_CLIENT_ID')}!,{`
          `}clientSecret: {fn('process')}.env.{ty('IDN_CLIENT_SECRET')}!,{`
          `}acrValues: {pn('[')}{s('"eidas2"')}{pn(']')}, {cm('// niveau LoA 2 minimum')}{`
        `}{pn('}')}),{`
      `}{pn(']')},{`
    `}{pn('}')}),{`
  `}{pn(']')},{`
`}{pn('}')});
      </CodeBlock>

      <H2 t={t}>3. Bouton de connexion</H2>
      <P t={t}>Côté client, déclenchez le flow avec <Code>signIn.oauth2</Code> :</P>
      <CodeBlock t={t} lang="tsx" title="components/SignInButton.tsx">
{k('"use client"')};{`
`}{k('import')} {pn('{')} authClient {pn('}')} {k('from')} {s('"@/lib/auth-client"')};{`

`}{k('export function')} {fn('SignInButton')}() {pn('{')}{`
  `}{k('return')} ({`
    `}{pn('<')}{ty('button')} onClick={pn('{')}() {pn('=>')}{`
      `}authClient.signIn.{fn('oauth2')}({pn('{')} providerId: {s('"idn"')} {pn('}')}){`
    `}{pn('}>')}{`
      `}Se connecter avec IDN{`
    `}{pn('</')}{ty('button')}{pn('>')}{`
  `});{`
`}{pn('}')}
      </CodeBlock>

      <H2 t={t}>4. Protéger les routes</H2>
      <P t={t}>Better Auth fournit <Code>auth.api.getSession</Code> côté serveur, et <Code>useSession</Code> côté client. Aucune particularité IDN — la session contient l'utilisateur mappé.</P>
      <CodeBlock t={t} lang="tsx" title="app/dashboard/page.tsx">
{k('import')} {pn('{')} auth {pn('}')} {k('from')} {s('"@/lib/auth"')};{`
`}{k('import')} {pn('{')} redirect {pn('}')} {k('from')} {s('"next/navigation"')};{`
`}{k('import')} {pn('{')} headers {pn('}')} {k('from')} {s('"next/headers"')};{`

`}{k('export default async function')} {fn('Dashboard')}() {pn('{')}{`
  `}{k('const')} session {pn('=')} {k('await')} auth.api.{fn('getSession')}({pn('{')} headers: {fn('headers')}() {pn('}')});{`
  `}{k('if')} ({pn('!')}session) {fn('redirect')}({s('"/login"')});{`

  `}{k('return')} {pn('<')}{ty('h1')}{pn('>')}Bonjour {pn('{')}session.user.name{pn('}')}{pn('</')}{ty('h1')}{pn('>')};{`
`}{pn('}')}
      </CodeBlock>

      <H2 t={t}>Et maintenant ?</H2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
        {[
          ['Demander un niveau LoA spécifique', '→ Guide LoA'],
          ['Récupérer des claims étendus (état civil)', '→ Scopes IDN'],
          ['Gérer la déconnexion fédérée', '→ Logout back-channel'],
          ['Migrer depuis Clerk vers IDN', '→ Migration guide'],
        ].map(([h, d], i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>{h}</div>
            <div style={{ fontSize: 12, color: idnTokens.green, marginTop: 4 }}>{d}</div>
          </div>
        ))}
      </div>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Quick start — NextAuth
// ─────────────────────────────────────────────────────────────
function DocsQSNextAuth({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Premiers pas', 'Quick start · NextAuth']} toc={[
      { label: '1. Installer' },
      { label: '2. Provider IDN' },
      { label: '3. Bouton et session' },
      { label: 'Claims IDN dans la session' },
    ]}>
      <H1 t={t}>Quick start · NextAuth.js v5</H1>
      <Lede t={t}>Provider IDN officiel pour Auth.js v5+. Discovery URL pré-configurée, claims mappés sur la session NextAuth.</Lede>

      <H2 t={t}>1. Installer</H2>
      <CodeBlock t={t} lang="bash" title="terminal">
bun add {s('@idn/next-auth next-auth')}
      </CodeBlock>

      <H2 t={t}>2. Provider IDN</H2>
      <CodeBlock t={t} lang="ts" title="auth.ts">
{k('import')} {ty('NextAuth')} {k('from')} {s('"next-auth"')};{`
`}{k('import')} {pn('{')} {ty('IDN')} {pn('}')} {k('from')} {s('"@idn/next-auth"')};{`

`}{k('export const')} {pn('{')} handlers, signIn, signOut, auth {pn('}')} {pn('=')} {fn('NextAuth')}({pn('{')}{`
  `}providers: {pn('[')}{`
    `}{fn('IDN')}({pn('{')}{`
      `}clientId: {fn('process')}.env.{ty('IDN_CLIENT_ID')}!,{`
      `}clientSecret: {fn('process')}.env.{ty('IDN_CLIENT_SECRET')}!,{`
      `}acrValues: {pn('[')}{s('"eidas2"')}{pn(']')},{`
    `}{pn('}')}),{`
  `}{pn(']')},{`
`}{pn('}')});
      </CodeBlock>

      <H2 t={t}>3. Bouton et session</H2>
      <CodeBlock t={t} lang="tsx" title="app/page.tsx">
{k('import')} {pn('{')} auth, signIn {pn('}')} {k('from')} {s('"@/auth"')};{`

`}{k('export default async function')} {fn('Page')}() {pn('{')}{`
  `}{k('const')} session {pn('=')} {k('await')} {fn('auth')}();{`
  `}{k('if')} ({pn('!')}session) {pn('{')}{`
    `}{k('return')} ({`
      `}{pn('<')}{ty('form')} action={pn('{')}{k('async')} () {pn('=>')} {pn('{')} {s('"use server"')}; {k('await')} {fn('signIn')}({s('"idn"')}); {pn('}}>')}{`
        `}{pn('<')}{ty('button')}{pn('>')}Se connecter avec IDN{pn('</')}{ty('button')}{pn('>')}{`
      `}{pn('</')}{ty('form')}{pn('>')}{`
    `});{`
  `}{pn('}')}{`
  `}{k('return')} {pn('<')}{ty('p')}{pn('>')}{pn('{')}{ty('JSON')}.{fn('stringify')}(session.user){pn('}')}{pn('</')}{ty('p')}{pn('>')};{`
`}{pn('}')}
      </CodeBlock>

      <H2 t={t}>Claims IDN dans la session</H2>
      <P t={t}>Les claims spécifiques IDN — <Code>loa</Code>, <Code>profile_type</Code>, <Code>nationality</Code> — sont accessibles via <Code>session.user.idn</Code>. Voir la <Code>Référence des claims</Code>.</P>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Quick start — React
// ─────────────────────────────────────────────────────────────
function DocsQSReact({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Premiers pas', 'Quick start · React']} toc={[
      { label: '1. Installer' },
      { label: '2. Provider' },
      { label: '3. Hooks' },
      { label: '4. Page de callback' },
    ]}>
      <H1 t={t}>Quick start · React + Vite</H1>
      <Lede t={t}>Pour une SPA React qui n'utilise ni Better Auth ni NextAuth. <Code>@idn/react</Code> fournit un <Code>{'<IDNProvider>'}</Code> et des hooks headless.</Lede>

      <H2 t={t}>1. Installer</H2>
      <CodeBlock t={t} lang="bash">bun add {s('@idn/react @idn/core')}</CodeBlock>

      <H2 t={t}>2. Provider</H2>
      <CodeBlock t={t} lang="tsx" title="src/main.tsx">
{k('import')} {pn('{')} {ty('IDNProvider')} {pn('}')} {k('from')} {s('"@idn/react"')};{`

`}{fn('createRoot')}({fn('document')}.{fn('getElementById')}({s('"root"')})!).{fn('render')}({`
  `}{pn('<')}{ty('IDNProvider')}{`
    `}clientId={pn('{')}{fn('import')}.meta.env.{ty('VITE_IDN_CLIENT_ID')}{pn('}')}{`
    `}redirectUri={s('"http://localhost:5173/callback"')}{`
    `}scopes={pn('{[')}{s('"openid"')}, {s('"profile"')}, {s('"email"')}{pn(']}')}{`
  `}{pn('>')}{`
    `}{pn('<')}{ty('App')} {pn('/>')}{`
  `}{pn('</')}{ty('IDNProvider')}{pn('>')}{`
`});
      </CodeBlock>

      <H2 t={t}>3. Hooks</H2>
      <CodeBlock t={t} lang="tsx" title="src/Profile.tsx">
{k('import')} {pn('{')} useIDN, useUser, {ty('SignedIn')}, {ty('SignedOut')} {pn('}')} {k('from')} {s('"@idn/react"')};{`

`}{k('export function')} {fn('Profile')}() {pn('{')}{`
  `}{k('const')} {pn('{')} signIn, signOut {pn('}')} {pn('=')} {fn('useIDN')}();{`
  `}{k('const')} {pn('{')} user, isLoading {pn('}')} {pn('=')} {fn('useUser')}();{`

  `}{k('return')} ({`
    `}{pn('<>')}{`
      `}{pn('<')}{ty('SignedOut')}{pn('>')}{`
        `}{pn('<')}{ty('button')} onClick={pn('{')}signIn{pn('}>')}Se connecter{pn('</')}{ty('button')}{pn('>')}{`
      `}{pn('</')}{ty('SignedOut')}{pn('>')}{`
      `}{pn('<')}{ty('SignedIn')}{pn('>')}{`
        `}{pn('<')}{ty('p')}{pn('>')}Bonjour {pn('{')}user{pn('?.')}name{pn('}</')}{ty('p')}{pn('>')}{`
        `}{pn('<')}{ty('button')} onClick={pn('{')}signOut{pn('}>')}Déconnexion{pn('</')}{ty('button')}{pn('>')}{`
      `}{pn('</')}{ty('SignedIn')}{pn('>')}{`
    `}{pn('</>')}{`
  `});{`
`}{pn('}')}
      </CodeBlock>

      <H2 t={t}>4. Page de callback</H2>
      <P t={t}>Montez le composant <Code>{'<IDNCallback>'}</Code> sur la route déclarée comme <Code>redirectUri</Code> :</P>
      <CodeBlock t={t} lang="tsx" title="src/routes/callback.tsx">
{k('import')} {pn('{')} {ty('IDNCallback')} {pn('}')} {k('from')} {s('"@idn/react"')};{`

`}{k('export default function')} {fn('Callback')}() {pn('{')}{`
  `}{k('return')} {pn('<')}{ty('IDNCallback')} fallbackTo={s('"/dashboard"')} {pn('/>')};{`
`}{pn('}')}
      </CodeBlock>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Quick start — Vanilla JS
// ─────────────────────────────────────────────────────────────
function DocsQSVanilla({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Premiers pas', 'Quick start · vanilla JS']} toc={[
      { label: 'Installation' },
      { label: 'Création du client' },
      { label: 'Bouton de connexion' },
      { label: 'Traiter le callback' },
    ]}>
      <H1 t={t}>Quick start · vanilla JavaScript</H1>
      <Lede t={t}>Pour Vue, Svelte, vanilla, ou tout framework non-React. <Code>@idn/core</Code> est 12 KB gzip, zéro dépendance.</Lede>

      <H2 t={t}>Installation</H2>
      <CodeBlock t={t} lang="bash">bun add {s('@idn/core')}</CodeBlock>
      <P t={t}>Ou par CDN, sans bundler :</P>
      <CodeBlock t={t} lang="html">
{pn('<')}{ty('script')} type={s('"module"')}{pn('>')}{`
  `}{k('import')} {pn('{')} createIDNClient {pn('}')} {k('from')} {s('"https://esm.sh/@idn/core@1"')};{`
`}{pn('</')}{ty('script')}{pn('>')}
      </CodeBlock>

      <H2 t={t}>Création du client</H2>
      <CodeBlock t={t} lang="js" title="auth.js">
{k('import')} {pn('{')} createIDNClient {pn('}')} {k('from')} {s('"@idn/core"')};{`

`}{k('export const')} idn {pn('=')} {fn('createIDNClient')}({pn('{')}{`
  `}clientId: {s('"consulat-ga"')},{`
  `}redirectUri: {s('"https://consulat.ga/auth/callback"')},{`
  `}scopes: {pn('[')}{s('"openid"')}, {s('"profile"')}, {s('"email"')}{pn(']')},{`
  `}acrValues: {pn('[')}{s('"eidas2"')}{pn(']')},{`
`}{pn('}')});
      </CodeBlock>

      <H2 t={t}>Bouton de connexion</H2>
      <CodeBlock t={t} lang="html">
{pn('<')}{ty('button')} id={s('"login"')}{pn('>')}Se connecter avec IDN{pn('</')}{ty('button')}{`

`}{pn('<')}{ty('script')} type={s('"module"')}{pn('>')}{`
  `}{k('import')} {pn('{')} idn {pn('}')} {k('from')} {s('"./auth.js"')};{`
  `}{fn('document')}.{fn('getElementById')}({s('"login"')}).onclick {pn('=')} () {pn('=>')} idn.{fn('signIn')}();{`
`}{pn('</')}{ty('script')}{pn('>')}
      </CodeBlock>

      <H2 t={t}>Traiter le callback</H2>
      <CodeBlock t={t} lang="js" title="callback.js">
{k('import')} {pn('{')} idn {pn('}')} {k('from')} {s('"./auth.js"')};{`

`}{k('await')} idn.{fn('handleCallback')}();{`
`}{k('const')} user {pn('=')} {k('await')} idn.{fn('getUser')}();{`
`}{fn('console')}.{fn('log')}({s('"Bonjour"')}, user.name);{`

`}{cm('// Rediriger vers l\'app')}{`
`}{fn('window')}.location.href {pn('=')} {s('"/dashboard"')};
      </CodeBlock>

      <Callout t={t} title="Et la déconnexion ?">
        Appelez <Code>idn.signOut()</Code>. Cela vide le stockage local et redirige vers l'endpoint <Code>/oauth2/sessions/logout</Code> d'IDN pour déconnecter aussi la session côté plateforme.
      </Callout>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. Core overview (architecture)
// ─────────────────────────────────────────────────────────────
function DocsCoreOverview({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['@idn/core', 'Présentation']} toc={[
      { label: 'À propos de @idn/core' },
      { label: 'Architecture du flow OIDC' },
      { label: 'Création du client' },
      { label: 'Cycle de vie de la session' },
      { label: 'Adaptateurs de stockage' },
    ]}>
      <H1 t={t}>@idn/core</H1>
      <Lede t={t}>Client OpenID Connect vanilla, framework-agnostic. C'est la fondation sur laquelle reposent <Code>@idn/react</Code>, <Code>@idn/better-auth</Code> et <Code>@idn/next-auth</Code>.</Lede>

      <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
        {['12 KB gzip', '0 dépendance', 'PKCE S256', 'TypeScript strict', 'ESM + CJS', 'Browser + Node + Bun'].map(b => (
          <span key={b} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, fontFamily: idnTokens.mono, fontWeight: 600 }}>{b}</span>
        ))}
      </div>

      <H2 t={t}>Architecture du flow OIDC</H2>
      <P t={t}>Authorization Code Flow + PKCE. Aucune option pour désactiver PKCE — c'est obligatoire.</P>
      <FlowDiagram t={t}/>

      <H2 t={t}>Création du client</H2>
      <CodeBlock t={t} lang="ts" title="src/idn.ts">
{k('import')} {pn('{')} createIDNClient {pn('}')} {k('from')} {s('"@idn/core"')};{`

`}{k('export const')} idn {pn('=')} {fn('createIDNClient')}({pn('{')}{`
  `}{cm('// Obligatoires')}{`
  `}clientId: {s('"your-client-id"')},{`
  `}redirectUri: {s('"https://yourapp.com/auth/callback"')},{`

  `}{cm('// Optionnels — valeurs par défaut affichées')}{`
  `}issuer: {s('"https://identite.ga"')},{`
  `}scopes: {pn('[')}{s('"openid"')}, {s('"profile"')}, {s('"email"')}{pn(']')},{`
  `}acrValues: {pn('[')}{s('"eidas2"')}{pn(']')},{`
  `}storage: {s('"localStorage"')},      {cm('// ou "sessionStorage" | "memory" | custom')}{`
  `}pkce: {k('true')},                {cm('// ne pas désactiver')}{`
  `}refreshThreshold: {ty('60')},      {cm('// refresh si exp < N secondes')}{`
`}{pn('}')});
      </CodeBlock>

      <H2 t={t}>Cycle de vie de la session</H2>
      <P t={t}>Le client gère 5 événements que vous pouvez écouter :</P>
      <table style={{ width: '100%', marginTop: 14, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}` }}>
            <th style={{ textAlign: 'left', padding: '10px 0', fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 0.5 }}>EVENT</th>
            <th style={{ textAlign: 'left', padding: '10px 0', fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 0.5 }}>ÉMIS LORS DE</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['signIn', 'Authentification réussie (post-callback)'],
            ['signOut', 'Déconnexion locale + back-channel'],
            ['session:expired', 'Session expirée et refresh impossible'],
            ['token:refreshed', 'Access token rafraîchi avec succès'],
            ['error', 'Erreur OIDC (state, nonce, signature…)'],
          ].map(([e, d], i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
              <td style={{ padding: '10px 0', fontFamily: idnTokens.mono, color: idnTokens.green, fontSize: 12 }}>{e}</td>
              <td style={{ padding: '10px 0', color: t.ink2 }}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H2 t={t}>Adaptateurs de stockage</H2>
      <P t={t}>4 adaptateurs livrés. Pour les apps sensibles, préférez <Code>sessionStorage</Code> ou un adapter custom cookie httpOnly.</P>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
        {[
          ['localStorage', 'Défaut. Survit aux refresh, vulnérable au XSS.'],
          ['sessionStorage', 'Cleared à la fermeture de l\'onglet. Plus sûr.'],
          ['memory', 'Aucune persistance. Utile pour les iframes.'],
          ['custom adapter', 'Implémentez l\'interface Storage pour cookie httpOnly.'],
        ].map(([n, d], i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 12, color: idnTokens.green, fontWeight: 600 }}>{n}</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </DocBody>
  );
}

function FlowDiagram({ t }) {
  return (
    <div style={{ marginTop: 18, padding: 22, borderRadius: 12, background: t.surface, border: `1px solid ${t.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, alignItems: 'center' }}>
        <Node t={t} label="VOTRE APP" sub="Browser"/>
        <Arrow t={t} dir="→" label="1. signIn() + PKCE"/>
        <Node t={t} label="IDN" sub="identite.ga" hi/>
        <div></div>
        <Arrow t={t} dir="↓" label="2. login + consent"/>
        <div></div>
        <Node t={t} label="VOTRE APP" sub="/callback"/>
        <Arrow t={t} dir="←" label="3. code + state"/>
        <Node t={t} label="IDN" sub="identite.ga" hi/>
        <div></div>
        <Arrow t={t} dir="↓" label="4. exchange + verify"/>
        <div></div>
        <div style={{ gridColumn: '1 / span 3', textAlign: 'center', fontSize: 12, color: idnTokens.green, padding: '12px 0', borderTop: `1px dashed ${t.border}`, marginTop: 12, fontWeight: 600 }}>
          5. session établie · ID token vérifié via JWKS · access + refresh tokens stockés
        </div>
      </div>
    </div>
  );
}
function Node({ t, label, sub, hi }) {
  return (
    <div style={{ background: hi ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface2, border: `1.5px solid ${hi ? idnTokens.green : t.border}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: hi ? idnTokens.green : t.ink, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
function Arrow({ t, dir, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <div style={{ fontSize: 11, color: t.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, color: idnTokens.green, fontFamily: idnTokens.mono }}>{dir}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Core API reference
// ─────────────────────────────────────────────────────────────
function DocsCoreApi({ t }) {
  const methods = [
    { sig: 'signIn(opts?)', ret: 'Promise<void>', d: 'Démarre le flow OIDC, redirige vers IDN.' },
    { sig: 'handleCallback()', ret: 'Promise<IDNSession>', d: 'Traite le retour, échange le code contre les tokens.' },
    { sig: 'signOut(opts?)', ret: 'Promise<void>', d: 'Clear local + back-channel logout.' },
    { sig: 'getSession()', ret: 'IDNSession | null', d: 'Session courante (user + tokens) ou null.' },
    { sig: 'getUser()', ret: 'Promise<IDNUser>', d: 'Profil utilisateur depuis /userinfo.' },
    { sig: 'getAccessToken()', ret: 'Promise<string>', d: 'Access token, refresh auto si expirant.' },
    { sig: 'refreshToken()', ret: 'Promise<void>', d: 'Force un refresh du token.' },
    { sig: 'isAuthenticated()', ret: 'boolean', d: 'Test synchrone basé sur le stockage local.' },
    { sig: 'on(event, cb)', ret: 'void', d: 'Écoute d\'événements.' },
    { sig: 'off(event, cb)', ret: 'void', d: 'Désinscription du listener.' },
  ];
  return (
    <DocBody t={t} breadcrumbs={['@idn/core', 'Référence API']} toc={[
      { label: 'createIDNClient' },
      { label: 'Méthodes' },
      { label: 'IDNUser (claims)' },
    ]}>
      <H1 t={t}>Référence API · @idn/core</H1>
      <Lede t={t}>API complète du client OIDC vanilla. Toutes les méthodes sont disponibles sur l'instance retournée par <Code>createIDNClient</Code>.</Lede>

      <H2 t={t}>Méthodes</H2>
      <div style={{ marginTop: 14, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', background: t.surface }}>
        {methods.map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 2fr', padding: '14px 18px', borderBottom: i === methods.length - 1 ? 'none' : `1px solid ${t.borderSoft}`, gap: 14, alignItems: 'baseline' }}>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 12.5, color: idnTokens.green, fontWeight: 600 }}>{m.sig}</div>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 11.5, color: t.muted }}>{m.ret}</div>
            <div style={{ fontSize: 12.5, color: t.ink2, lineHeight: 1.5 }}>{m.d}</div>
          </div>
        ))}
      </div>

      <H2 t={t}>IDNUser (claims)</H2>
      <P t={t}>Type retourné par <Code>getUser()</Code>. Les claims marqués optionnels dépendent du niveau LoA et des scopes consentis.</P>
      <CodeBlock t={t} lang="ts">
{k('interface')} {ty('IDNUser')} {pn('{')}{`
  `}sub: {ty('string')};                                      {cm('// identifiant IDN stable')}{`
  `}email: {ty('string')};                                    {cm('// email vérifié')}{`
  `}email_verified: {ty('boolean')};{`
  `}name?: {ty('string')};{`
  `}given_name?: {ty('string')};{`
  `}family_name?: {ty('string')};{`
  `}birthdate?: {ty('string')};                              {cm('// ISO 8601')}{`
  `}gender?: {s('"male"')} {pn('|')} {s('"female"')} {pn('|')} {s('"other"')};{`
  `}nationality?: {ty('string')};{`
  `}profile_type?: {s('"citizen"')} {pn('|')} {s('"resident"')} {pn('|')} {s('"visitor"')} {pn('|')} {s('"developer"')};{`
  `}acr?: {s('"eidas1"')} {pn('|')} {s('"eidas2"')} {pn('|')} {s('"eidas3"')};{`
  `}loa?: {ty('1')} {pn('|')} {ty('2')} {pn('|')} {ty('3')};{`
  `}picture?: {ty('string')};{`
  `}updated_at?: {ty('number')};{`
`}{pn('}')}
      </CodeBlock>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. React hooks
// ─────────────────────────────────────────────────────────────
function DocsReactHooks({ t }) {
  const hooks = [
    { name: 'useIDN()', ret: '{ isAuthenticated, isLoading, signIn, signOut, error }', d: 'Hook principal — état global et méthodes.' },
    { name: 'useUser()', ret: '{ user, isLoading, error }', d: 'Claims du profil utilisateur.' },
    { name: 'useSession()', ret: '{ session, accessToken, isLoading }', d: 'Session complète (user + tokens).' },
    { name: 'useAccessToken()', ret: 'string | null', d: 'Access token actuel, auto-refresh.' },
    { name: 'useLoA()', ret: '{ loa, hasMinimum(level) }', d: 'Utilitaire de niveau de garantie.' },
  ];
  return (
    <DocBody t={t} breadcrumbs={['@idn/react', 'Hooks']} toc={[
      { label: 'Liste des hooks' },
      { label: 'useIDN()' },
      { label: 'useUser()' },
      { label: 'useLoA()' },
    ]}>
      <H1 t={t}>Hooks · @idn/react</H1>
      <Lede t={t}>5 hooks headless pour construire votre propre UI. Tous side-effect-safe, compatibles SSR.</Lede>

      <H2 t={t}>Liste des hooks</H2>
      <div style={{ marginTop: 14, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', background: t.surface }}>
        {hooks.map((h, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.4fr', padding: '14px 18px', borderBottom: i === hooks.length - 1 ? 'none' : `1px solid ${t.borderSoft}`, gap: 14, alignItems: 'baseline' }}>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 12.5, color: idnTokens.green, fontWeight: 600 }}>{h.name}</div>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, lineHeight: 1.5 }}>{h.ret}</div>
            <div style={{ fontSize: 12.5, color: t.ink2, lineHeight: 1.5 }}>{h.d}</div>
          </div>
        ))}
      </div>

      <H2 t={t}>useIDN()</H2>
      <CodeBlock t={t} lang="tsx">
{k('const')} {pn('{')} isAuthenticated, isLoading, signIn, signOut, error {pn('}')} {pn('=')} {fn('useIDN')}();
      </CodeBlock>

      <H2 t={t}>useUser()</H2>
      <P t={t}>Lit les claims via <Code>/userinfo</Code>, cachés en mémoire 5 min.</P>
      <CodeBlock t={t} lang="tsx">
{k('const')} {pn('{')} user, isLoading {pn('}')} {pn('=')} {fn('useUser')}();{`
`}{cm('// user.email, user.name, user.loa, ...')}
      </CodeBlock>

      <H2 t={t}>useLoA()</H2>
      <P t={t}>Pour gating fin sur le niveau de garantie sans devoir parser le claim manuellement.</P>
      <CodeBlock t={t} lang="tsx">
{k('const')} {pn('{')} loa, hasMinimum {pn('}')} {pn('=')} {fn('useLoA')}();{`

`}{k('if')} ({pn('!')}{fn('hasMinimum')}({ty('2')})) {pn('{')}{`
  `}{k('return')} {pn('<')}{ty('UpgradePrompt')} target={pn('{')}{ty('2')}{pn('}')} {pn('/>')};{`
`}{pn('}')}
      </CodeBlock>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. React components
// ─────────────────────────────────────────────────────────────
function DocsReactComponents({ t }) {
  const comps = [
    { name: '<IDNProvider>', d: 'Provider racine. À monter une seule fois autour de l\'app.' },
    { name: '<IDNSignInButton>', d: 'Bouton « Se connecter avec IDN » pré-stylé.' },
    { name: '<IDNUserButton>', d: 'Avatar + dropdown (profil, lien identite.ga, déconnexion).' },
    { name: '<IDNUserProfile>', d: 'Affichage profil — nom, badge LoA, email.' },
    { name: '<IDNCallback>', d: 'À monter sur la route callback. Gère le retour OIDC.' },
    { name: '<SignedIn>', d: 'Render conditionnel — enfants visibles si authentifié.' },
    { name: '<SignedOut>', d: 'Render conditionnel — enfants visibles si non authentifié.' },
    { name: '<RequireLoA level={2}>', d: 'Render conditionnel — exige un niveau LoA minimum.' },
    { name: '<IDNLoading>', d: 'Skeleton pendant le chargement initial.' },
  ];
  return (
    <DocBody t={t} breadcrumbs={['@idn/react', 'Composants']} toc={[
      { label: 'Liste' },
      { label: 'Render conditionnel' },
      { label: 'Personnalisation' },
    ]}>
      <H1 t={t}>Composants · @idn/react</H1>
      <Lede t={t}>Composants pré-stylés aux couleurs IDN. <b style={{ color: t.ink }}>100% optionnels</b> — vous pouvez tout construire avec les hooks. Overridables via <Code>className</Code>, <Code>style</Code>, et slots <Code>render*</Code>.</Lede>

      <H2 t={t}>Liste</H2>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {comps.map((c, i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 12.5, color: idnTokens.green, fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>{c.d}</div>
          </div>
        ))}
      </div>

      <H2 t={t}>Render conditionnel</H2>
      <P t={t}>Inspiré de l'API Clerk. Pas de booléen à propager, pas de spinner manuel.</P>
      <CodeBlock t={t} lang="tsx">
{pn('<')}{ty('SignedOut')}{pn('>')}{`
  `}{pn('<')}{ty('IDNSignInButton')} {pn('/>')}{`
`}{pn('</')}{ty('SignedOut')}{pn('>')}{`

`}{pn('<')}{ty('SignedIn')}{pn('>')}{`
  `}{pn('<')}{ty('IDNUserButton')} {pn('/>')}{`
  `}{pn('<')}{ty('RequireLoA')} level={pn('{')}{ty('2')}{pn('}')} fallback={pn('{')}{pn('<')}{ty('UpgradePrompt')} {pn('/>')}{pn('}>')}{`
    `}{pn('<')}{ty('SignContractButton')} {pn('/>')}{`
  `}{pn('</')}{ty('RequireLoA')}{pn('>')}{`
`}{pn('</')}{ty('SignedIn')}{pn('>')}
      </CodeBlock>

      <H2 t={t}>Personnalisation</H2>
      <P t={t}>3 niveaux de personnalisation, du plus simple au plus profond :</P>
      <ol style={{ paddingLeft: 22, fontSize: 14, color: t.ink2, lineHeight: 1.8, marginTop: 10 }}>
        <li><Code>className</Code> ou <Code>style</Code> sur les composants</li>
        <li>Slots <Code>renderTrigger</Code>, <Code>renderContent</Code> sur les composants composés</li>
        <li>Hooks headless seuls — ignorer les composants pré-stylés, tout réécrire</li>
      </ol>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. LoA guide
// ─────────────────────────────────────────────────────────────
function DocsLoA({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Guides', 'Niveaux de garantie (LoA)']} toc={[
      { label: 'Les 3 niveaux' },
      { label: 'Exiger un niveau' },
      { label: 'Gating dans l\'app' },
      { label: 'Step-up authentication' },
    ]}>
      <H1 t={t}>Niveaux de garantie (LoA)</H1>
      <Lede t={t}>IDN propose 3 niveaux d'assurance d'identité, alignés avec le règlement <b style={{ color: t.ink }}>eIDAS</b>. Votre app peut exiger un niveau minimum lors de l'authentification.</Lede>

      <H2 t={t}>Les 3 niveaux</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        {[
          { l: 1, n: 'Faible', acr: 'eidas1', d: 'Email vérifié. Services informatifs, e-Visa.', col: t.muted, ex: 'Newsletter, portails informatifs' },
          { l: 2, n: 'Substantiel', acr: 'eidas2', d: 'Document + selfie liveness. Résidents.', col: idnTokens.blue, ex: 'Démarches consulaires, e-commerce sensible' },
          { l: 3, n: 'Élevé', acr: 'eidas3', d: 'KYC vidéo + état civil. Services régaliens.', col: idnTokens.green, ex: 'Impôts, santé, signature électronique qualifiée' },
        ].map((r) => (
          <div key={r.l} style={{ background: t.surface, border: `1.5px solid ${r.col}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, color: r.col, fontWeight: 700, letterSpacing: 0.8 }}>NIVEAU {r.l} — {r.n.toUpperCase()}</div>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, marginTop: 6 }}>acr_values = "{r.acr}"</div>
            <div style={{ fontSize: 13, color: t.ink2, marginTop: 10, lineHeight: 1.5 }}>{r.d}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 10, fontStyle: 'italic' }}>{r.ex}</div>
          </div>
        ))}
      </div>

      <H2 t={t}>Exiger un niveau</H2>
      <P t={t}>Passez <Code>acrValues</Code> à la configuration. Si l'utilisateur ne l'a pas atteint, IDN le guidera dans le parcours d'upgrade KYC avant de revenir à votre app.</P>
      <CodeBlock t={t} lang="ts">
{fn('createIDNClient')}({pn('{')}{`
  `}clientId: {s('"impots-ga"')},{`
  `}redirectUri: {s('"https://impots.ga/callback"')},{`
  `}acrValues: {pn('[')}{s('"eidas3"')}{pn(']')}, {cm('// niveau 3 obligatoire')}{`
`}{pn('}')});
      </CodeBlock>

      <H2 t={t}>Gating dans l'app</H2>
      <P t={t}>Pour des sections internes qui exigent un niveau plus élevé, utilisez <Code>{'<RequireLoA>'}</Code> ou le hook <Code>useLoA()</Code>.</P>
      <CodeBlock t={t} lang="tsx">
{pn('<')}{ty('RequireLoA')} level={pn('{')}{ty('3')}{pn('}')} fallback={pn('{')}{pn('<')}{ty('UpgradePrompt')} target={pn('{')}{ty('3')}{pn('}')} {pn('/>')}{pn('}>')}{`
  `}{pn('<')}{ty('SignTaxReturnButton')} {pn('/>')}{`
`}{pn('</')}{ty('RequireLoA')}{pn('>')}
      </CodeBlock>

      <H2 t={t}>Step-up authentication</H2>
      <Callout t={t} kind="info" title="L'utilisateur reste connecté pendant l'upgrade">
        Si une action requiert un niveau supérieur en cours de session, appelez <Code>idn.signIn({'{ acrValues: ["eidas3"], prompt: "none" }'})</Code>. IDN propose le KYC vidéo puis renvoie à votre app — la session est conservée.
      </Callout>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. Security guide
// ─────────────────────────────────────────────────────────────
function DocsSecurity({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Guides', 'Sécurité OIDC']} toc={[
      { label: 'Garanties du SDK' },
      { label: 'Stockage des tokens' },
      { label: 'Refresh & rotation' },
      { label: 'Logout fédéré' },
      { label: 'Programme bug bounty' },
    ]}>
      <H1 t={t}>Sécurité OIDC</H1>
      <Lede t={t}>Le SDK IDN implémente l'état de l'art de la sécurité OAuth 2.1 / OIDC. Voici ce qui est garanti et ce que vous devez configurer.</Lede>

      <H2 t={t}>Garanties du SDK</H2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        {[
          ['PKCE S256 obligatoire', 'Pas d\'option pour désactiver, même en dev.'],
          ['State vérifié', '32 bytes aléatoires URL-safe, rejet strict au callback.'],
          ['Nonce dans l\'ID token', 'Vérification cryptographique.'],
          ['Redirect URI strict matching', 'Tout mismatch rejette le callback.'],
          ['Signature ID token', 'Vérifiée via JWKS (RS256 / ES256 uniquement).'],
          ['Refus de HS256', 'IDN n\'en émet pas — toute tentative rejetée.'],
        ].map(([h, d], i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, display: 'flex', gap: 10 }}>
            <span style={{ color: idnTokens.green, marginTop: 2, flexShrink: 0 }}>{IdnIcons.check}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{h}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 3, lineHeight: 1.5 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      <H2 t={t}>Stockage des tokens</H2>
      <Callout t={t} kind="warn" title="Le localStorage est vulnérable au XSS">
        Pour les apps qui manipulent des données régaliennes (impôts, santé, état civil), préférez <Code>sessionStorage</Code> ou un adapter cookie httpOnly. Voir le guide <Code>Storage adapter cookie</Code>.
      </Callout>

      <H2 t={t}>Refresh & rotation</H2>
      <P t={t}>Le serveur IDN active la rotation des refresh tokens. Si un ancien refresh token est réutilisé après rotation, le SDK déclenche <Code>session:expired</Code>, vide le storage, et redirige vers la page de login. Toute tentative d'attaque par vol de token déclenche une révocation immédiate côté serveur.</P>

      <H2 t={t}>Logout fédéré</H2>
      <P t={t}>Deux mécanismes complémentaires :</P>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Front-channel</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>Redirection vers <Code>/oauth2/sessions/logout</Code>. Déconnecte la session IDN.</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Back-channel</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>Webhook reçu sur votre serveur quand l'utilisateur se déconnecte ailleurs. Invalidez la session.</div>
        </div>
      </div>

      <H2 t={t}>Programme bug bounty</H2>
      <Callout t={t} kind="success" title="security@identite.ga">
        Une faille découverte ? Disclosure responsable récompensée. Voir <Code>https://identite.ga/security</Code>. Médailles 250 € → 25 000 €.
      </Callout>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. Migration from Clerk
// ─────────────────────────────────────────────────────────────
function DocsMigration({ t }) {
  return (
    <DocBody t={t} breadcrumbs={['Guides', 'Migration depuis Clerk']} toc={[
      { label: 'Pourquoi migrer ?' },
      { label: 'Mapping des concepts' },
      { label: 'Migration étape par étape' },
      { label: 'Composants équivalents' },
      { label: 'Plan de bascule production' },
    ]}>
      <H1 t={t}>Migration depuis Clerk</H1>
      <Lede t={t}>Cas concret : <b style={{ color: t.ink }}>consulat.ga</b> a basculé de Clerk vers IDN en 4 jours-homme. Ce guide décrit pas à pas la procédure pour une app Next.js équivalente.</Lede>

      <H2 t={t}>Pourquoi migrer ?</H2>
      <P t={t}>Réutilisation de l'identité gabonaise officielle, conformité eIDAS, suppression du vendor lock-in, économie sur les MAU Clerk, audit de sécurité national.</P>

      <H2 t={t}>Mapping des concepts</H2>
      <div style={{ marginTop: 14, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', background: t.surface }}>
        {[
          ['<ClerkProvider>', '<IDNProvider>', 'Wrapper racine — props équivalents'],
          ['<SignIn>', '<IDNSignInButton>', 'Bouton CTA, redirige vers IDN'],
          ['<UserButton>', '<IDNUserButton>', 'Avatar + dropdown profil'],
          ['<SignedIn> / <SignedOut>', 'idem', 'API identique, drop-in'],
          ['useUser()', 'useUser()', 'Claims similaires, ajout de loa / profile_type'],
          ['useAuth()', 'useIDN()', 'État global + méthodes signIn/signOut'],
          ['Organizations', 'profile_type', 'Pas d\'orgs natives — utiliser un claim custom'],
        ].map(([from, to, d], i, arr) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', padding: '12px 18px', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}`, gap: 14, alignItems: 'baseline' }}>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 12, color: t.muted }}>{from}</div>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 12, color: idnTokens.green, fontWeight: 600 }}>→ {to}</div>
            <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>

      <H2 t={t}>Migration étape par étape</H2>
      <div style={{ marginTop: 14 }}>
        {[
          { n: 1, t: 'Enregistrer l\'app IDN', d: 'Sur la console développeur, mêmes redirect URIs que sur Clerk.' },
          { n: 2, t: 'Installer @idn/react', d: 'Désinstaller @clerk/nextjs en gardant la branche stable.' },
          { n: 3, t: 'Remplacer le provider', d: '<ClerkProvider> → <IDNProvider>. Mêmes props clientId / redirectUri.' },
          { n: 4, t: 'Trouver-remplacer les composants', d: 'IDE find&replace : ClerkProvider, SignIn, UserButton, etc.' },
          { n: 5, t: 'Mapper les claims persistés', d: 'Migration script SQL : clerk_user_id → idn_sub.' },
          { n: 6, t: 'Tester en sandbox', d: '24-48h en parallèle des deux providers.' },
          { n: 7, t: 'Bascule production', d: 'Feature flag, rollback prévu.' },
        ].map((s, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: idnTokens.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{s.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{s.t}</div>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 3, lineHeight: 1.5 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    </DocBody>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. Playground OIDC
// ─────────────────────────────────────────────────────────────
function DocsPlayground({ t }) {
  return (
    <div style={{ padding: '32px 44px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 700 }}>OUTILS / PLAYGROUND OIDC</div>
      <H1 t={t}>Playground OIDC</H1>
      <Lede t={t}>Testez un flow OIDC complet sans coder. Pratique pour debug, démos, ou comprendre les claims renvoyés par IDN.</Lede>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18, marginTop: 24 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 14 }}>Configuration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <IdnInput t={t} label="Client ID" value="sandbox-playground" onChange={()=>{}}/>
            <IdnInput t={t} label="Redirect URI" value="https://docs.identite.ga/playground/cb" onChange={()=>{}}/>
            <div>
              <div style={{ fontSize: 11, color: t.muted, letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>SCOPES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['openid', 'profile', 'email', 'birth_cert', 'address'].map((s, i) => (
                  <span key={s} style={{ fontSize: 11, fontFamily: idnTokens.mono, padding: '4px 10px', borderRadius: 9999, background: i < 3 ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface2, color: i < 3 ? idnTokens.green : t.muted, fontWeight: 500, cursor: 'pointer', border: `1px solid ${i < 3 ? idnTokens.green : t.border}` }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: t.muted, letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>NIVEAU LOA (acr_values)</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3].map(l => (
                  <span key={l} style={{ flex: 1, fontSize: 12, padding: '8px 10px', borderRadius: 8, background: l === 2 ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface2, color: l === 2 ? idnTokens.green : t.muted, fontWeight: 500, cursor: 'pointer', border: `1px solid ${l === 2 ? idnTokens.green : t.border}`, textAlign: 'center', fontFamily: idnTokens.mono }}>eidas{l}</span>
                ))}
              </div>
            </div>
          </div>
          <IdnButton t={t} variant="primary" size="lg" full style={{ marginTop: 22 }}>Lancer le flow OIDC</IdnButton>
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, flex: 1 }}>Résultat — ID token décodé</div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, letterSpacing: 0.5 }}>SIGNATURE VALIDE</span>
          </div>
          <pre style={{ margin: 0, padding: 18, fontFamily: idnTokens.mono, fontSize: 11.5, lineHeight: 1.6, color: t.ink2, background: t.dark ? '#0F1310' : '#FAF9F5', overflow: 'auto', maxHeight: 480 }}>
{`{
  "iss": "https://identite.ga",
  "sub": "ga-7k3j-9q2l",
  "aud": "sandbox-playground",
  "exp": 1746893820,
  "iat": 1746890220,
  "nonce": "n_8H42x9Lp3Mq7WnRf",
  "acr": "eidas2",
  "loa": 2,
  "email": "aissatou.mboumba@example.ga",
  "email_verified": true,
  "name": "Aïssatou Mboumba",
  "given_name": "Aïssatou",
  "family_name": "Mboumba",
  "birthdate": "1992-03-14",
  "gender": "female",
  "nationality": "GA",
  "profile_type": "citizen",
  "updated_at": 1746890218
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DocsSite });
