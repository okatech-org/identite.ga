// IDN Desktop screens — operators (admin, controller, developer) + OIDC web

// ─────────────────────────────────────────────────────────────
// Browser chrome wrapper (compact, sober)
// ─────────────────────────────────────────────────────────────
function BrowserChrome({ url, t, children, w = 1080, h = 700 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 12, overflow: 'hidden',
      background: t.bg, border: `1px solid ${t.border}`,
      boxShadow: t.dark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(40,50,30,0.12)',
      display: 'flex', flexDirection: 'column', fontFamily: idnTokens.font,
      flexShrink: 0,
    }}>
      <div style={{
        height: 44, background: t.surface2, borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 14,
      }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <div style={{ width: 11, height: 11, borderRadius: 9999, background: '#FF6058' }}/>
          <div style={{ width: 11, height: 11, borderRadius: 9999, background: '#FFBE2F' }}/>
          <div style={{ width: 11, height: 11, borderRadius: 9999, background: '#28C940' }}/>
        </div>
        <div style={{
          flex: 1, maxWidth: 520, height: 28, borderRadius: 6,
          background: t.surface, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
          fontSize: 12, color: t.muted, fontFamily: idnTokens.mono,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={idnTokens.green} strokeWidth="2"><path d="M7 11V7a5 5 0 0 1 10 0v4"/><rect x="5" y="11" width="14" height="10" rx="2"/></svg>
          {url}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OIDC consent — desktop
// ─────────────────────────────────────────────────────────────
function OidcDesktop({ t }) {
  return (
    <BrowserChrome t={t} url="https://idn.ga/oauth/authorize?client_id=consulat-ga&...">
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: t.bg, padding: 40,
      }}>
        <div style={{
          width: 480, background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: 36,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <IdnMark size={26} t={t}/>
            <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>Identité Numérique</div>
            <div style={{ flex: 1 }}/>
            <IdnFlagBars width={24} height={2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>
              AM
            </div>
            <div style={{ display: 'flex', gap: 4, color: t.muted }}>
              <div style={{ width: 5, height: 5, borderRadius: 9999, background: t.muted }}/>
              <div style={{ width: 5, height: 5, borderRadius: 9999, background: t.muted }}/>
              <div style={{ width: 5, height: 5, borderRadius: 9999, background: t.muted }}/>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: t.surface2, color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, border: `1px solid ${t.border}` }}>C</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 600, color: t.ink, lineHeight: 1.35 }}>
            Connexion à <span style={{ color: idnTokens.green }}>Consulat.ga</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: t.muted, marginTop: 8 }}>
            connecté en tant qu'<b style={{ color: t.ink, fontWeight: 500 }}>Aïssatou Mboumba</b>
          </div>
          <div style={{ marginTop: 24, fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>VOUS PARTAGEREZ</div>
          <div style={{ marginTop: 8, border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {[
              { l: 'Identité pivot', s: 'nom, prénom, date de naissance, lieu de naissance' },
              { l: 'Email vérifié', s: 'aissatou.mboumba@example.ga' },
              { l: 'Niveau de garantie', s: 'Niveau 3 (l\'app exige ≥ 2)' },
            ].map((r, i, arr) => (
              <div key={i} style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
                background: t.surface,
              }}>
                <span style={{ color: idnTokens.green, display: 'flex' }}>{IdnIcons.check}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{r.l}</div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>{r.s}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <IdnButton t={t} variant="ghost" size="lg" style={{ flex: 1 }}>Refuser</IdnButton>
            <IdnButton t={t} variant="primary" size="lg" style={{ flex: 1 }}>Autoriser</IdnButton>
          </div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 14, textAlign: 'center' }}>
            Révocable à tout moment dans <u>Mes consentements</u>.
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// Operator shell — sidebar + main
// ─────────────────────────────────────────────────────────────
function OpShell({ t, title, role, nav, active, onNav, children, badge }) {
  return (
    <div style={{ display: 'flex', height: '100%', background: t.bg }}>
      <aside style={{
        width: 220, background: t.surface, borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IdnMark size={26} t={t}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, letterSpacing: -0.2 }}>IDN</div>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>{role}</div>
          </div>
        </div>
        <IdnFlagBars width={184} height={2} />
        <nav style={{ padding: '14px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map((n) => {
            const sel = active === n.id;
            return (
              <button key={n.id} onClick={() => onNav && onNav(n.id)} style={{
                background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent',
                color: sel ? idnTokens.green : t.ink2,
                border: 'none', cursor: 'pointer',
                padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: sel ? 600 : 500, fontFamily: idnTokens.font,
              }}>
                <span style={{ display: 'flex', opacity: sel ? 1 : 0.7 }}>{n.icon}</span>
                {n.label}
                {n.tag && <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: idnTokens.mono, padding: '1px 6px', borderRadius: 9999, background: t.surface2, color: t.muted }}>{n.tag}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 12, borderTop: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9999, background: t.surface2, color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>{badge}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            <div style={{ fontSize: 10, color: t.muted }}>connecté</div>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}

function OpHeader({ t, title, sub, right }) {
  return (
    <div style={{
      padding: '20px 28px 16px', borderBottom: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'flex-end', gap: 16, background: t.bg,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>{sub}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: -0.3, marginTop: 4 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Admin console
// ─────────────────────────────────────────────────────────────
function AdminConsole({ t, initialTab = 'dashboard' }) {
  const [tab, setTab] = React.useState(initialTab);
  const nav = [
    { id: 'dashboard', label: 'Tableau de bord', icon: dashIcon() },
    { id: 'apps',      label: 'Applications OAuth', icon: IdnIcons.link, tag: '23' },
    { id: 'users',     label: 'Comptes IDN', icon: IdnIcons.user, tag: '142k' },
    { id: 'logs',      label: 'Logs & audit', icon: IdnIcons.doc },
    { id: 'roles',     label: 'Rôles & habilitations', icon: IdnIcons.shield },
    { id: 'providers', label: 'Providers email/SMS', icon: IdnIcons.mail },
  ];
  return (
    <BrowserChrome t={t} url="https://admin.idn.ga/" w={1180} h={760}>
      <OpShell t={t} title="Admin · Système" role="ADMINISTRATEUR" badge="O" nav={nav} active={tab} onNav={setTab}>
        {tab === 'dashboard' && <AdminDashboard t={t} />}
        {tab === 'apps' && <AdminApps t={t} />}
        {tab === 'users' && <AdminUsers t={t} />}
        {tab === 'logs' && <AdminLogs t={t} />}
        {tab === 'roles' && <AdminRoles t={t} />}
        {tab === 'providers' && <AdminProviders t={t} />}
        {tab === 'app-detail' && <AdminAppDetail t={t} />}
      </OpShell>
    </BrowserChrome>
  );
}

const dashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>;

function Stat({ t, label, value, delta, hint }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 600, color: t.ink, marginTop: 8, letterSpacing: -0.5, fontFamily: idnTokens.font }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        {delta && <span style={{ fontSize: 12, color: idnTokens.green, fontWeight: 500 }}>{delta}</span>}
        <span style={{ fontSize: 12, color: t.muted }}>{hint}</span>
      </div>
    </div>
  );
}

function AdminDashboard({ t }) {
  // Sparkline-style bars for simple chart
  const bars = [38, 42, 50, 47, 58, 64, 60, 72, 68, 80, 76, 88, 92, 85, 96];
  const loa = [{ l: 'Niveau 1', v: 38, c: t.muted }, { l: 'Niveau 2', v: 28, c: idnTokens.blue }, { l: 'Niveau 3', v: 34, c: idnTokens.green }];
  return (
    <>
      <OpHeader t={t} sub="VUE D'ENSEMBLE · 7 derniers jours" title="Tableau de bord" right={
        <IdnButton t={t} variant="ghost" size="sm">Exporter CSV</IdnButton>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Stat t={t} label="COMPTES IDN" value="142 318" delta="+1.4%" hint="vs sem. dernière"/>
          <Stat t={t} label="CONNEXIONS / 24H" value="38 942" delta="+8.2%" hint="pic à 14h32"/>
          <Stat t={t} label="APPS ACTIVES" value="23" hint="2 en attente de revue"/>
          <Stat t={t} label="ÉCHECS OTP" value="2.3%" hint="seuil alerte : 5%"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Connexions par jour</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>15 jours glissants</div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: t.muted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: idnTokens.green }}/>Réussies</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, marginTop: 18 }}>
              {bars.map((v, i) => (
                <div key={i} style={{
                  flex: 1, height: `${v}%`,
                  background: i === bars.length - 1 ? idnTokens.green : t.dark ? '#1F4A2E' : '#B8DCC4',
                  borderRadius: '3px 3px 0 0',
                }}/>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: idnTokens.mono, color: t.muted }}>
              <span>26 AVR</span><span>03 MAI</span><span>10 MAI</span>
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Répartition par niveau</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Comptes actifs</div>
            <div style={{ marginTop: 18 }}>
              {loa.map((r, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.ink2, marginBottom: 4 }}>
                    <span>{r.l}</span>
                    <span style={{ fontFamily: idnTokens.mono, color: t.ink, fontWeight: 600 }}>{r.v}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: t.surface2, overflow: 'hidden' }}>
                    <div style={{ width: `${r.v}%`, height: '100%', background: r.c, borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 12 }}>Activité récente</div>
          {[
            { t: '14:32', e: 'Application enregistrée', d: 'Bourses Étudiantes — en attente de revue', tag: 'apps' },
            { t: '13:48', e: 'KYC approuvé', d: 'M. Lefèvre → Niveau 2', tag: 'kyc' },
            { t: '12:11', e: 'Échec OTP répété', d: '+241 6X XX XX 12 — 5 tentatives', tag: 'security' },
            { t: '10:22', e: 'Provider email switché', d: 'Resend → AWS SES (admin)', tag: 'config' },
          ].map((r, i, arr) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '10px 0',
              borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, width: 56 }}>{r.t}</span>
              <span style={{ fontSize: 13, color: t.ink, fontWeight: 500, width: 220 }}>{r.e}</span>
              <span style={{ fontSize: 12, color: t.muted, flex: 1 }}>{r.d}</span>
              <span style={{ fontSize: 10, fontFamily: idnTokens.mono, padding: '2px 8px', borderRadius: 9999, background: t.surface2, color: t.ink2 }}>{r.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminApps({ t }) {
  const apps = [
    { name: 'Consulat.ga', id: 'consulat-ga', loa: 2, scopes: 4, status: 'production' },
    { name: 'Bourses Étudiantes', id: 'bourses-min-edu', loa: 3, scopes: 5, status: 'pending' },
    { name: 'Santé.ga', id: 'sante-ga', loa: 3, scopes: 6, status: 'production' },
    { name: 'Impots.ga', id: 'dgi-impots', loa: 2, scopes: 3, status: 'production' },
    { name: 'e-Visa', id: 'evisa-ga', loa: 1, scopes: 2, status: 'production' },
    { name: 'CNAMGS', id: 'cnamgs-portal', loa: 2, scopes: 4, status: 'sandbox' },
  ];
  const statusColor = { production: idnTokens.green, pending: idnTokens.yellow, sandbox: t.muted };
  return (
    <>
      <OpHeader t={t} sub="OAUTH · 23 APPLICATIONS" title="Applications" right={
        <div style={{ display: 'flex', gap: 8 }}>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={IdnIcons.search} style={{ width: 200, justifyContent: 'flex-start', color: t.muted }}>Rechercher…</IdnButton>
          <IdnButton t={t} variant="primary" size="sm" leadIcon={IdnIcons.plus}>Nouvelle app</IdnButton>
        </div>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr 0.8fr 0.8fr 40px',
            padding: '12px 18px', background: t.surface2, fontSize: 11, color: t.muted, letterSpacing: 0.6, fontWeight: 600,
            borderBottom: `1px solid ${t.border}`,
          }}>
            <div>NOM</div><div>CLIENT_ID</div><div>NIVEAU MIN.</div><div>SCOPES</div><div>STATUT</div><div></div>
          </div>
          {apps.map((a, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr 0.8fr 0.8fr 40px',
              padding: '14px 18px', alignItems: 'center', fontSize: 13, color: t.ink,
              borderBottom: i === apps.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: t.surface2, color: t.ink, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.name[0]}</div>
                <span style={{ fontWeight: 500 }}>{a.name}</span>
              </div>
              <div style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted }}>{a.id}</div>
              <div><LoABadge level={a.loa} t={t} compact /></div>
              <div style={{ color: t.muted }}>{a.scopes}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 9999, background: statusColor[a.status] }}/>
                <span style={{ fontSize: 12, color: t.ink2 }}>{a.status}</span>
              </div>
              <div style={{ color: t.muted, cursor: 'pointer' }}>{IdnIcons.more}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminUsers({ t }) {
  const users = [
    { name: 'Aïssatou Mboumba', email: 'aissatou.m@example.ga', loa: 3, profil: 'Citoyen', joined: '14 jan 2026' },
    { name: 'Marc Lefèvre', email: 'marc.lefevre@example.fr', loa: 2, profil: 'Résident', joined: '02 fév 2026' },
    { name: 'Yuki Tanaka', email: 'y.tanaka@example.jp', loa: 1, profil: 'Visiteur', joined: '21 avr 2026' },
    { name: 'Jean-Baptiste Ondo', email: 'jb.ondo@example.ga', loa: 3, profil: 'Citoyen', joined: '08 mar 2026' },
    { name: 'Sarah Cohen', email: 'sarah.c@example.com', loa: 2, profil: 'Résident', joined: '15 mar 2026' },
    { name: 'Patrick Mengue', email: 'p.mengue@example.ga', loa: 3, profil: 'Citoyen', joined: '01 jan 2026' },
  ];
  return (
    <>
      <OpHeader t={t} sub="COMPTES · 142 318 ACTIFS" title="Utilisateurs" right={
        <IdnButton t={t} variant="ghost" size="sm" leadIcon={IdnIcons.search} style={{ width: 220, justifyContent: 'flex-start', color: t.muted }}>Email, ID IDN, nom…</IdnButton>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 60px', padding: '12px 18px', background: t.surface2, fontSize: 11, color: t.muted, letterSpacing: 0.6, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>
            <div>NOM</div><div>EMAIL</div><div>NIVEAU</div><div>PROFIL</div><div>INSCRIT</div><div></div>
          </div>
          {users.map((u, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 60px',
              padding: '14px 18px', alignItems: 'center', fontSize: 13, color: t.ink,
              borderBottom: i === users.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9999, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <span style={{ fontWeight: 500 }}>{u.name}</span>
              </div>
              <div style={{ color: t.muted, fontFamily: idnTokens.mono, fontSize: 11 }}>{u.email}</div>
              <div><LoABadge level={u.loa} t={t} compact /></div>
              <div style={{ color: t.ink2 }}>{u.profil}</div>
              <div style={{ color: t.muted, fontSize: 12 }}>{u.joined}</div>
              <div style={{ color: t.muted, cursor: 'pointer' }}>{IdnIcons.more}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminLogs({ t }) {
  const logs = [
    { ts: '14:32:08', level: 'info', evt: 'auth.success', user: 'aissatou.m@example.ga', meta: 'consulat-ga · ip 41.158.x.x' },
    { ts: '14:31:55', level: 'info', evt: 'token.issued', user: 'aissatou.m@example.ga', meta: 'access · refresh · jti=7K3..' },
    { ts: '14:30:12', level: 'warn', evt: 'otp.fail', user: '+241 6X XX XX 12', meta: 'attempt 3/5' },
    { ts: '14:29:44', level: 'info', evt: 'kyc.approved', user: 'marc.lefevre@example.fr', meta: 'L1 → L2 · controller@idn.ga' },
    { ts: '14:28:01', level: 'info', evt: 'consent.granted', user: 'jb.ondo@example.ga', meta: 'sante-ga · scopes: profile,loa:3' },
    { ts: '14:27:33', level: 'error', evt: 'auth.fail', user: '—', meta: 'invalid_client · cnamgs-portal' },
    { ts: '14:26:50', level: 'info', evt: 'session.revoked', user: 'sarah.c@example.com', meta: 'by user · 1 device' },
    { ts: '14:25:17', level: 'info', evt: 'app.created', user: 'admin@idn.ga', meta: 'bourses-min-edu · pending' },
  ];
  const lvlColor = { info: t.muted, warn: idnTokens.yellow, error: '#B83A3A' };
  return (
    <>
      <OpHeader t={t} sub="AUDIT · TEMPS RÉEL" title="Logs" right={
        <div style={{ display: 'flex', gap: 8 }}>
          <IdnButton t={t} variant="ghost" size="sm">Filtres</IdnButton>
          <IdnButton t={t} variant="ghost" size="sm">Exporter</IdnButton>
        </div>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', fontFamily: idnTokens.mono, fontSize: 12 }}>
          {logs.map((l, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '90px 60px 1.2fr 1.6fr 2fr',
              gap: 12, padding: '10px 18px', alignItems: 'center',
              borderBottom: i === logs.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
            }}>
              <span style={{ color: t.muted }}>{l.ts}</span>
              <span style={{ color: lvlColor[l.level], fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{l.level}</span>
              <span style={{ color: t.ink, fontWeight: 500 }}>{l.evt}</span>
              <span style={{ color: t.ink2 }}>{l.user}</span>
              <span style={{ color: t.muted }}>{l.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminRoles({ t }) {
  const roles = [
    { name: 'Administrateur Système', count: 4, perms: ['Tout accès', 'Gestion comptes', 'Gestion apps', 'Logs', 'Providers'], badge: idnTokens.green },
    { name: 'Contrôleur d\'Identité', count: 38, perms: ['Scanner ID', 'Valider KYC', 'Historique', 'MFA + PIN obligatoire'], badge: idnTokens.blue },
    { name: 'Support Niveau 1', count: 12, perms: ['Lecture comptes', 'Réinit. mot de passe', 'Support OTP'], badge: t.muted },
    { name: 'Auditeur', count: 2, perms: ['Lecture seule logs', 'Export audit'], badge: idnTokens.yellow },
  ];
  return (
    <>
      <OpHeader t={t} sub="HABILITATIONS · 56 AGENTS" title="Rôles & habilitations" right={<IdnButton t={t} variant="primary" size="sm" leadIcon={IdnIcons.plus}>Nouveau rôle</IdnButton>}/>
      <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {roles.map((r, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: r.badge }}/>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{r.name}</div>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: idnTokens.mono, color: t.muted }}>{r.count} agents</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {r.perms.map(p => <span key={p} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 9999, background: t.surface2, color: t.ink2 }}>{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminProviders({ t }) {
  const Section = ({ title, providers, active }) => (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 14 }}>{title}</div>
      {providers.map((p, i) => {
        const sel = p.id === active;
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: 10, border: `1.5px solid ${sel ? idnTokens.green : t.borderSoft}`,
            background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent', marginBottom: 8,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: t.surface2, color: t.ink, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{p.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{p.desc}</div>
            </div>
            {sel ? <span style={{ fontSize: 11, fontWeight: 600, color: idnTokens.green, padding: '3px 10px', borderRadius: 9999, background: t.dark ? '#0A1F11' : '#fff' }}>ACTIF</span> : <IdnButton t={t} variant="ghost" size="sm">Activer</IdnButton>}
          </div>
        );
      })}
    </div>
  );
  return (
    <>
      <OpHeader t={t} sub="COMMUNICATION · MULTI-PROVIDER" title="Providers email & SMS"/>
      <div style={{ flex: 1, padding: 28, overflow: 'auto', maxWidth: 820 }}>
        <Section title="Email — un provider actif" active="resend" providers={[
          { id: 'resend', name: 'Resend', desc: 'Provider par défaut MVP · 38.4k envois / mois' },
          { id: 'sendgrid', name: 'SendGrid', desc: 'Twilio · clé API configurée' },
          { id: 'aws-ses', name: 'AWS SES', desc: 'Région eu-west-3 · vérification DKIM ok' },
          { id: 'smtp', name: 'SMTP custom', desc: 'Pour relais on-premise gabonais' },
        ]}/>
        <Section title="SMS — Phase 2 (non actif)" providers={[
          { id: 'twilio', name: 'Twilio', desc: 'Couverture mondiale · sandbox configuré' },
          { id: 'vonage', name: 'Vonage', desc: 'Anciennement Nexmo' },
          { id: 'africastalking', name: 'Africa\'s Talking', desc: 'Recommandé pour le Gabon · prix local' },
        ]}/>
      </div>
    </>
  );
}

function AdminAppDetail({ t }) {
  return (
    <>
      <OpHeader t={t} sub="BOURSES ÉTUDIANTES · CLIENT_ID bourses-min-edu" title="Détail de l'application" right={<><IdnButton t={t} variant="ghost" size="sm">Désactiver</IdnButton><IdnButton t={t} variant="primary" size="sm" style={{ marginLeft: 8 }}>Approuver pour production</IdnButton></>}/>
      <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 14 }}>Configuration OAuth</div>
            <CredRow t={t} label="CLIENT_ID" value="bourses-min-edu"/>
            <CredRow t={t} label="REDIRECT URIS" value="https://bourses.education.ga/auth/callback"/>
            <CredRow t={t} label="SCOPES" value="profile, email, birth_cert, loa:3"/>
            <CredRow t={t} label="NIVEAU MIN." value="3 — Élevé"/>
            <CredRow t={t} label="CONSENT" value="non-trusted (écran de consentement requis)"/>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 12 }}>Connexions par jour</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {[40, 56, 48, 62, 70, 65, 78, 82, 75, 88, 92, 85, 96, 100].map((v, i) => <div key={i} style={{ flex: 1, height: `${v}%`, background: t.dark ? '#1F4A2E' : '#B8DCC4', borderRadius: '3px 3px 0 0' }}/>)}
            </div>
          </div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 14 }}>Historique d'événements</div>
          {[
            { ts: 'Aujourd\'hui 14:32', e: 'Demande de passage en production', a: 'dev@startup.ga' },
            { ts: '08 mai · 09:14', e: 'Secret régénéré', a: 'dev@startup.ga' },
            { ts: '02 mai · 16:00', e: 'Scope birth_cert ajouté', a: 'dev@startup.ga' },
            { ts: '14 avr · 11:20', e: 'App créée (sandbox)', a: 'dev@startup.ga' },
          ].map((x, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: idnTokens.green, marginTop: 6, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>{x.e}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2, fontFamily: idnTokens.mono }}>{x.ts} · {x.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Identity Controller
// ─────────────────────────────────────────────────────────────
function ControllerConsole({ t, initialTab = 'queue' }) {
  const [tab, setTab] = React.useState(initialTab);
  const nav = [
    { id: 'queue',  label: 'File de demandes', icon: IdnIcons.shield, tag: '12' },
    { id: 'scan',   label: 'Scanner identité', icon: IdnIcons.qr },
    { id: 'verify', label: 'Vérifier signature', icon: IdnIcons.check },
    { id: 'history', label: 'Historique contrôles', icon: IdnIcons.doc },
  ];
  return (
    <BrowserChrome t={t} url="https://controller.idn.ga/" w={1180} h={760}>
      <OpShell t={t} title="Agent K. Ovono" role="CONTRÔLEUR D'IDENTITÉ" badge="K" nav={nav} active={tab} onNav={setTab}>
        {tab === 'queue' && <CtrlQueue t={t} />}
        {tab === 'scan' && <CtrlScan t={t} />}
        {tab === 'verify' && <CtrlVerify t={t} />}
        {tab === 'history' && <CtrlHistory t={t} />}
      </OpShell>
    </BrowserChrome>
  );
}

function CtrlQueue({ t }) {
  const queue = [
    { ref: 'KYC-7K9-3F2', name: 'Aïssatou Mboumba', target: 2, doc: 'CNI gabonaise', age: '12 min', priority: 'haute' },
    { ref: 'KYC-7K9-3F1', name: 'Marc Lefèvre',     target: 2, doc: 'Carte de séjour', age: '34 min', priority: 'normale' },
    { ref: 'KYC-7K9-3E8', name: 'Yuki Tanaka',      target: 1, doc: 'Passeport JP', age: '1h 12min', priority: 'normale' },
    { ref: 'KYC-7K9-3E5', name: 'Patrick Mengue',   target: 3, doc: 'CNI + acte de naissance', age: '2h 04min', priority: 'haute' },
    { ref: 'KYC-7K9-3E2', name: 'Sarah Cohen',      target: 2, doc: 'Carte de séjour', age: '3h 18min', priority: 'normale' },
  ];
  return (
    <>
      <OpHeader t={t} sub="REVUE MANUELLE · 12 EN ATTENTE" title="File de demandes" right={
        <IdnButton t={t} variant="ghost" size="sm">Filtres</IdnButton>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {queue.map((q, i) => (
            <div key={i} style={{
              padding: '16px 20px',
              borderBottom: i === queue.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
              display: 'flex', alignItems: 'center', gap: 18,
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 9999, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{q.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{q.name}</div>
                <div style={{ fontSize: 11, fontFamily: idnTokens.mono, color: t.muted, marginTop: 2 }}>{q.ref} · {q.doc}</div>
              </div>
              <LoABadge level={q.target} t={t} compact />
              {q.priority === 'haute' && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: t.dark ? '#3A1E1E' : '#FBE5E5', color: '#B83A3A', letterSpacing: 0.5 }}>PRIORITÉ HAUTE</span>
              )}
              <span style={{ fontSize: 12, color: t.muted, width: 80, textAlign: 'right' }}>{q.age}</span>
              <IdnButton t={t} variant="primary" size="sm">Examiner</IdnButton>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 14 }}>Cas en cours d'examen — KYC-7K9-3F2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ aspectRatio: '1.6 / 1', borderRadius: 10, background: `repeating-linear-gradient(45deg, ${t.surface2}, ${t.surface2} 8px, ${t.dark ? '#2A2F26' : '#E8E5DC'} 8px, ${t.dark ? '#2A2F26' : '#E8E5DC'} 16px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, letterSpacing: 1 }}>CNI · RECTO</div>
            <div style={{ aspectRatio: '1.6 / 1', borderRadius: 10, background: `repeating-linear-gradient(45deg, ${t.surface2}, ${t.surface2} 8px, ${t.dark ? '#2A2F26' : '#E8E5DC'} 8px, ${t.dark ? '#2A2F26' : '#E8E5DC'} 16px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, letterSpacing: 1 }}>SELFIE LIVENESS</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <IdnButton t={t} variant="primary" size="md">Approuver</IdnButton>
            <IdnButton t={t} variant="ghost" size="md">Demander un complément</IdnButton>
            <div style={{ flex: 1 }}/>
            <IdnButton t={t} variant="danger" size="md">Rejeter</IdnButton>
          </div>
        </div>
      </div>
    </>
  );
}

function CtrlScan({ t }) {
  return (
    <>
      <OpHeader t={t} sub="CONTRÔLE TERRAIN" title="Scanner une identité"/>
      <div style={{ flex: 1, padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Lecteur QR / NFC</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Demandez au titulaire de présenter son code IDN.</div>
          <div style={{
            flex: 1, marginTop: 18, borderRadius: 10,
            background: t.dark ? '#0A0D0A' : '#1A1D17',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            minHeight: 280,
          }}>
            <div style={{
              width: 200, height: 200, border: `2px solid ${idnTokens.green}`, borderRadius: 12,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: idnTokens.green, opacity: 0.7, boxShadow: `0 0 10px ${idnTokens.green}` }}/>
            </div>
          </div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Identité vérifiée</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AM</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: t.ink }}>Aïssatou Mboumba</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>14 mars 1992 · Libreville</div>
              <div style={{ marginTop: 6 }}><LoABadge level={3} t={t} compact /></div>
            </div>
          </div>
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: idnTokens.green, marginTop: 1 }}>{IdnIcons.check}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Signature cryptographique valide</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2, fontFamily: idnTokens.mono }}>JWT signé · clé jwks-2026-04 · expire 14:42</div>
            </div>
          </div>
          <div style={{ marginTop: 18, fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>DOCUMENTS LIÉS</div>
          <div style={{ marginTop: 8, fontSize: 13, color: t.ink2, lineHeight: 1.7 }}>
            <div>· CNI n° 02-7K3-9Q2 (valide jusqu'en 2031)</div>
            <div>· Acte de naissance n° AN-1992-0314-LIB</div>
          </div>
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: t.dark ? '#1F2316' : idnTokens.yellowSoft, fontSize: 12, color: t.ink2, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: '#A7841C', marginTop: 1 }}>{IdnIcons.bell}</span>
            Le titulaire sera notifié de ce contrôle (transparence).
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <IdnButton t={t} variant="primary" size="md" full>Valider le contrôle</IdnButton>
            <IdnButton t={t} variant="ghost" size="md">Annuler</IdnButton>
          </div>
        </div>
      </div>
    </>
  );
}

function CtrlVerify({ t }) {
  return (
    <>
      <OpHeader t={t} sub="OUTIL CRYPTO" title="Vérifier une signature"/>
      <div style={{ flex: 1, padding: 28 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, maxWidth: 760 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>JWT à vérifier</div>
          <textarea readOnly defaultValue="eyJhbGciOiJSUzI1NiIsImtpZCI6Imp3a3MtMjAyNi0wNCJ9.eyJzdWIiOiJHQS03SzNKLTlRMkwiLCJpc3MiOiJodHRwczovL2lkbi5nYSIsIm5hbWUiOiJBw69zc2F0b3UgTWJvdW1iYSIsImxvYSI6MywiaWF0IjoxNzQ2OTAyNTAwLCJleHAiOjE3NDY5MDYxMDB9.MEUCIQDh..." style={{
            width: '100%', height: 100, marginTop: 10, padding: 12, fontFamily: idnTokens.mono, fontSize: 11,
            background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, color: t.ink2, resize: 'none', outline: 'none',
          }}/>
          <IdnButton t={t} variant="primary" size="md" style={{ marginTop: 12 }}>Vérifier la signature</IdnButton>
          <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: idnTokens.green, marginTop: 1 }}>{IdnIcons.check}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Signature valide</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 4, fontFamily: idnTokens.mono, lineHeight: 1.6 }}>
                iss: https://idn.ga<br/>
                kid: jwks-2026-04 (RSA 2048)<br/>
                sub: GA-7K3J-9Q2L · loa: 3<br/>
                exp: 2026-05-10 14:42:00 (dans 38 min)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CtrlHistory({ t }) {
  const hist = [
    { ts: '10 mai · 14:32', name: 'Aïssatou Mboumba', loc: 'Aéroport L.B.M.', result: 'valide' },
    { ts: '10 mai · 12:18', name: 'Marc Lefèvre', loc: 'Préfecture Libreville', result: 'valide' },
    { ts: '10 mai · 10:04', name: 'Yuki Tanaka', loc: 'Aéroport L.B.M.', result: 'valide' },
    { ts: '09 mai · 16:42', name: 'Patrick Mengue', loc: 'Poste frontière Bitam', result: 'expiré' },
    { ts: '09 mai · 14:11', name: 'Sarah Cohen', loc: 'Préfecture Libreville', result: 'valide' },
  ];
  return (
    <>
      <OpHeader t={t} sub="TRAÇABILITÉ · 30 DERNIERS JOURS" title="Historique de contrôles"/>
      <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {hist.map((h, i) => (
            <div key={i} style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
              borderBottom: i === hist.length - 1 ? 'none' : `1px solid ${t.borderSoft}`,
            }}>
              <span style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, width: 130 }}>{h.ts}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.ink, flex: 1 }}>{h.name}</span>
              <span style={{ fontSize: 12, color: t.muted, flex: 1 }}>{h.loc}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
                background: h.result === 'valide' ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : (t.dark ? '#3A1E1E' : '#FBE5E5'),
                color: h.result === 'valide' ? idnTokens.green : '#B83A3A',
              }}>{h.result.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Developer portal
// ─────────────────────────────────────────────────────────────
function DevPortal({ t, initialTab = 'apps' }) {
  const [tab, setTab] = React.useState(initialTab);
  const nav = [
    { id: 'apps',    label: 'Mes applications', icon: IdnIcons.link, tag: '3' },
    { id: 'keys',    label: 'Clés & secrets', icon: IdnIcons.lock },
    { id: 'docs',    label: 'Documentation', icon: IdnIcons.doc },
    { id: 'usage',   label: 'Quotas & usage', icon: dashIcon() },
  ];
  return (
    <BrowserChrome t={t} url="https://developers.idn.ga/" w={1180} h={760}>
      <OpShell t={t} title="dev@startup.ga" role="DÉVELOPPEUR" badge="D" nav={nav} active={tab} onNav={setTab}>
        {tab === 'apps' && <DevApps t={t} />}
        {tab === 'keys' && <DevKeys t={t} />}
        {tab === 'docs' && <DevDocs t={t} />}
        {tab === 'usage' && <DevUsage t={t} />}
      </OpShell>
    </BrowserChrome>
  );
}

function DevApps({ t }) {
  const apps = [
    { name: 'Bourses Étudiantes', env: 'production', loa: 3, scopes: ['profile', 'email', 'birth_cert', 'loa:3'], reqs: '38.4k / mois' },
    { name: 'Bourses Étudiantes — Sandbox', env: 'sandbox', loa: 3, scopes: ['profile', 'email', 'birth_cert', 'loa:3'], reqs: '142 / mois' },
    { name: 'Mobile App Bourses', env: 'sandbox', loa: 1, scopes: ['profile', 'email'], reqs: '0' },
  ];
  return (
    <>
      <OpHeader t={t} sub="VOS APPS · 3 ENREGISTRÉES" title="Applications" right={
        <IdnButton t={t} variant="primary" size="sm" leadIcon={IdnIcons.plus}>Nouvelle app</IdnButton>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apps.map((a, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: t.surface2, color: t.ink, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: t.ink }}>{a.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, letterSpacing: 0.5,
                      background: a.env === 'production' ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface2,
                      color: a.env === 'production' ? idnTokens.green : t.muted,
                    }}>{a.env.toUpperCase()}</span>
                    <LoABadge level={a.loa} t={t} compact />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                    {a.scopes.map((s) => (
                      <span key={s} style={{ fontSize: 11, fontFamily: idnTokens.mono, padding: '2px 8px', borderRadius: 9999, background: t.surface2, color: t.ink2 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>USAGE</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: t.ink, fontFamily: idnTokens.mono, marginTop: 2 }}>{a.reqs}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CredRow({ t, label, value, secret }) {
  const [shown, setShown] = React.useState(!secret);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${t.borderSoft}` }}>
      <div style={{ width: 140, fontSize: 11, color: t.muted, letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, fontFamily: idnTokens.mono, fontSize: 12, color: t.ink, background: t.surface2, padding: '8px 12px', borderRadius: 6, border: `1px solid ${t.border}` }}>
        {shown ? value : '•'.repeat(28)}
      </div>
      {secret && (
        <button onClick={() => setShown(s => !s)} style={{ border: 'none', background: 'none', color: t.muted, cursor: 'pointer', padding: 8 }}>{IdnIcons.eye}</button>
      )}
      <button style={{ border: 'none', background: 'none', color: t.muted, cursor: 'pointer', padding: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontFamily: idnTokens.font }}>{IdnIcons.copy} Copier</button>
    </div>
  );
}

function DevKeys({ t }) {
  return (
    <>
      <OpHeader t={t} sub="OAUTH · BOURSES ÉTUDIANTES" title="Clés & secrets" right={
        <IdnButton t={t} variant="ghost" size="sm">Régénérer le secret</IdnButton>
      }/>
      <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, maxWidth: 800 }}>
          <CredRow t={t} label="ISSUER" value="https://idn.ga"/>
          <CredRow t={t} label="DISCOVERY" value="https://idn.ga/.well-known/openid-configuration"/>
          <CredRow t={t} label="CLIENT_ID" value="bourses-min-edu"/>
          <CredRow t={t} label="CLIENT_SECRET" value="idn_sk_3F92x7Kp9Lq2WnRfGv8sZmTcUe1AhJ..." secret/>
          <CredRow t={t} label="REDIRECT URIS" value="https://bourses.education.ga/auth/callback"/>
          <CredRow t={t} label="JWKS" value="https://idn.ga/.well-known/jwks.json"/>
        </div>

        <div style={{ marginTop: 22, fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 10 }}>Intégration en 3 lignes (Better Auth)</div>
        <pre style={{
          background: t.dark ? '#0E110D' : '#16170F', color: '#E6F2EA',
          padding: 20, borderRadius: 12, fontFamily: idnTokens.mono, fontSize: 12,
          lineHeight: 1.7, margin: 0, overflow: 'auto',
        }}>{`import { genericOAuth } from "better-auth/plugins";
import { idn } from "@idn/better-auth";

export const auth = betterAuth({
  plugins: [
    genericOAuth({ config: [idn({
      clientId: process.env.IDN_CLIENT_ID!,
      clientSecret: process.env.IDN_CLIENT_SECRET!,
    })]}),
  ],
});`}</pre>
      </div>
    </>
  );
}

function DevDocs({ t }) {
  const sections = [
    { t: 'Démarrage', items: ['Quick start', 'Choisir un chemin d\'intégration', 'Niveaux de garantie (LoA)'] },
    { t: '@idn/better-auth', items: ['Helper idn()', 'Mapping de profil', 'genericOAuth config'] },
    { t: '@idn/core', items: ['createIDNClient()', 'signIn / signOut', 'handleCallback'] },
    { t: '@idn/react', items: ['<IDNProvider>', 'useUser()', 'useSession()'] },
    { t: 'OIDC standard', items: ['Discovery', 'Authorization Code + PKCE', 'JWKS & rotation'] },
  ];
  return (
    <>
      <OpHeader t={t} sub="RÉFÉRENCE · v1.2" title="Documentation"/>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 240, borderRight: `1px solid ${t.border}`, padding: '20px 14px', overflow: 'auto' }}>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, padding: '0 10px' }}>{s.t.toUpperCase()}</div>
              <div style={{ marginTop: 6 }}>
                {s.items.map((it, j) => (
                  <div key={j} style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: 12,
                    color: i === 1 && j === 0 ? idnTokens.green : t.ink2,
                    background: i === 1 && j === 0 ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent',
                    fontWeight: i === 1 && j === 0 ? 600 : 500,
                    cursor: 'pointer',
                  }}>{it}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>@IDN/BETTER-AUTH</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: t.ink, marginTop: 6, letterSpacing: -0.4 }}>Helper idn()</div>
          <div style={{ fontSize: 14, color: t.ink2, marginTop: 12, lineHeight: 1.6, maxWidth: 620 }}>
            S'utilise comme <code style={{ fontFamily: idnTokens.mono, fontSize: 13, padding: '1px 6px', background: t.surface2, borderRadius: 4 }}>auth0()</code>, <code style={{ fontFamily: idnTokens.mono, fontSize: 13, padding: '1px 6px', background: t.surface2, borderRadius: 4 }}>keycloak()</code>, <code style={{ fontFamily: idnTokens.mono, fontSize: 13, padding: '1px 6px', background: t.surface2, borderRadius: 4 }}>okta()</code> dans Better Auth.
            Auto-configure le discovery, les scopes par défaut, PKCE et le mapping du profil.
          </div>
          <pre style={{
            background: t.dark ? '#0E110D' : '#16170F', color: '#E6F2EA',
            padding: 20, borderRadius: 12, fontFamily: idnTokens.mono, fontSize: 12,
            lineHeight: 1.7, marginTop: 18, overflow: 'auto', maxWidth: 720,
          }}>{`import { genericOAuth } from "better-auth/plugins";
import { idn } from "@idn/better-auth";

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        idn({
          clientId: process.env.IDN_CLIENT_ID!,
          clientSecret: process.env.IDN_CLIENT_SECRET!,
          // optionnel — override de l'issuer par défaut
          issuer: "https://idn.ga",
        }),
      ],
    }),
  ],
});

// Côté client
await authClient.signIn.oauth2({ providerId: "idn" });`}</pre>
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: t.dark ? '#10243A' : idnTokens.blueSoft, fontSize: 12, color: t.ink2, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: idnTokens.blue, marginTop: 1 }}>{IdnIcons.shield}</span>
            <span>Pour exiger un niveau de garantie minimum, ajouter <code style={{ fontFamily: idnTokens.mono, fontSize: 11 }}>scopes: ["profile", "email", "loa:2"]</code>.</span>
          </div>
        </div>
      </div>
    </>
  );
}

function DevUsage({ t }) {
  const bars = [42, 38, 50, 48, 62, 70, 65, 78, 82, 88, 75, 92, 98, 90, 100, 95, 88];
  return (
    <>
      <OpHeader t={t} sub="QUOTAS · MOIS EN COURS" title="Usage"/>
      <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <Stat t={t} label="REQUÊTES / MOIS" value="38 542 / 100k" delta="38.5%" hint="quota standard"/>
          <Stat t={t} label="LATENCE P95" value="142ms" hint="seuil SLA : 300ms"/>
          <Stat t={t} label="ERREURS 4XX" value="0.42%" hint="invalid_grant principalement"/>
        </div>
        <div style={{ marginTop: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Requêtes — derniers 17 jours</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, marginTop: 18 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v}%`, background: i === bars.length - 1 ? idnTokens.green : t.dark ? '#1F4A2E' : '#B8DCC4', borderRadius: '3px 3px 0 0' }}/>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  BrowserChrome, OidcDesktop, AdminConsole, ControllerConsole, DevPortal,
});
