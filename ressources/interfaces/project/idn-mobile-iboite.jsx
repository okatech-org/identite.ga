// IDN Mobile — iBoîte (Boîte aux lettres souveraine)
// 3 comptes (Personnel/Professionnel/Association), 3 sections (Courriers/Colis/eMails)

// ─────────────────────────────────────────────────────────────
// Icônes locales
// ─────────────────────────────────────────────────────────────
const MailIcons = {
  home:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>,
  brief:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  users:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2 21c1-3.5 3.5-5.5 7-5.5s6 2 7 5.5"/><circle cx="17" cy="7" r="2.5"/><path d="M16 13c2.5 0 5 1.6 6 4"/></svg>,
  mail:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  package: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v10"/></svg>,
  chat:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4a8 8 0 1 1 16-4z"/></svg>,
  pin:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
  chevDn:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  star:    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>,
  starO:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>,
  inbox:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l3-8h12l3 8v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 12h5l2 3h4l2-3h5"/></svg>,
  send:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  clock:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  trash:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>,
  reply:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10L4 15l5 5M4 15h11a5 5 0 0 1 5 5v0"/></svg>,
  forward: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l5 5-5 5M20 15H9a5 5 0 0 1-5-5v0"/></svg>,
  printer: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><rect x="6" y="13" width="12" height="8"/></svg>,
  archive: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></svg>,
  truck:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 17V6a1 1 0 0 1 1-1h13v12M15 8h4l3 5v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>,
  paper:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-2-2l8-8"/></svg>,
  building:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/></svg>,
  user:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>,
  alert:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg>,
  qr:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v7M14 21h3"/></svg>,
};

const ACCOUNTS = [
  { id: 'personal',     label: 'Personnel',     icon: 'home',  grad: 'linear-gradient(135deg,#3b82f6,#4338ca)', addr: { rue: 'Avenue du Colonel Parant', ville: 'Libreville', bp: 'BP 1000', qr: 'IDNGA-12345' }, email: 'jean.dupont@idn.ga' },
  { id: 'professional', label: 'Professionnel', icon: 'brief', grad: 'linear-gradient(135deg,#10b981,#0d9488)', addr: { rue: 'Boulevard Triomphal',     ville: 'Libreville', bp: 'BP 5000', qr: 'IDNGA-PRO-5000' }, email: 'contact@abc-sarl.ga' },
  { id: 'association',  label: 'Association',   icon: 'users', grad: 'linear-gradient(135deg,#a855f7,#ec4899)', addr: { rue: 'Rue de la Solidarité',     ville: 'Libreville', bp: 'BP 2500', qr: 'IDNGA-ASSO-2500' }, email: 'asso.jeunesse@idn.ga' },
];

const MOCK_LETTERS = [
  { id: 'L1', sender: 'Mairie de Libreville', subject: 'Complément de dossier requis', preview: 'Suite à l\'examen de votre dossier de demande d\'acte de naissance…', time: 'Il y a 2 h', type: 'action_required', read: false, due: '15 j' },
  { id: 'L2', sender: 'CNAMGS',               subject: 'Confirmation d\'adhésion à l\'assurance maladie', preview: 'Nous accusons réception de votre dossier d\'adhésion CNAMGS…', time: 'Hier', type: 'informational', read: true },
  { id: 'L3', sender: 'DGDI',                 subject: 'Convocation renouvellement CNI', preview: 'Veuillez vous présenter au centre d\'enregistrement DGDI…', time: 'Lun.', type: 'standard', read: false },
];

const MOCK_PACKAGES = [
  { id: 'P1', tracking: 'GA2024-78901', sender: 'Amazon.fr',  description: 'Commande électronique', status: 'available' },
  { id: 'P2', tracking: 'GA2024-78902', sender: 'La Poste',   description: 'Recommandé',           status: 'transit', eta: '17 mai' },
];

const MOCK_EMAILS = [
  { id: 'E1', sender: { name: 'Mairie de Libreville', email: 'etat-civil@libreville.ga', type: 'admin' },     subject: 'Confirmation de votre demande', preview: 'Votre demande a été enregistrée sous le numéro #2024-12345…', time: '09:32', read: false, starred: true, attach: false },
  { id: 'E2', sender: { name: 'CNAMGS', email: 'no-reply@cnamgs.ga', type: 'admin' },                          subject: 'Documents requis pour votre dossier', preview: 'Pour compléter votre dossier, merci de fournir…', time: '08:14', read: false, starred: false, attach: true },
  { id: 'E3', sender: { name: 'DGI', email: 'fiscal@dgi.ga', type: 'admin' },                                  subject: 'Rappel : Déclaration fiscale 2025', preview: 'Nous vous rappelons que la date limite de déclaration…', time: 'Hier', read: true, starred: false },
  { id: 'E4', sender: { name: 'Jean Dupont', email: 'jean.dupont@idn.ga', type: 'citizen' },                  subject: 'Re: Documents requis', preview: 'Veuillez trouver ci-joint les documents demandés…', time: '12 mai', read: true, starred: false, attach: true },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function AccountPill({ acc, t, expanded, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', background: acc.grad, border: 'none', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{MailIcons[acc.icon]}</div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{acc.label}</div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>{acc.email}</div>
      </div>
      <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>{MailIcons.chevDn}</div>
    </button>
  );
}

function IBoiteTabs({ t, active }) {
  const tabs = [
    { id: 'courriers', label: 'Courriers', icon: 'mail',    badge: 2, color: '#3b82f6' },
    { id: 'colis',     label: 'Colis',     icon: 'package', badge: 1, color: '#f59e0b' },
    { id: 'emails',    label: 'eMails',    icon: 'chat',    badge: 2, color: '#10b981' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, padding: '10px 22px 4px' }}>
      {tabs.map(tb => {
        const sel = tb.id === active;
        return (
          <button key={tb.id} style={{ flex: 1, padding: '10px 6px', background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent', border: `1px solid ${sel ? (t.dark ? '#1B3F2A' : '#C5E0CC') : t.border}`, borderRadius: 10, color: sel ? idnTokens.green : t.ink2, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative', color: sel ? idnTokens.green : tb.color }}>
              {MailIcons[tb.icon]}
              {tb.badge > 0 && <span style={{ position: 'absolute', top: -4, right: -8, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 9999, background: idnTokens.green, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tb.badge}</span>}
            </div>
            <span style={{ fontSize: 11, fontWeight: sel ? 600 : 500 }}>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AddressStrip({ acc, t }) {
  return (
    <div style={{ margin: '12px 22px 0', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10 }}>
      <span style={{ color: idnTokens.green }}>{MailIcons.pin}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: t.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.addr.rue}, {acc.addr.ville}</div>
        <div style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{acc.addr.qr}</div>
      </div>
      <button style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: `1px solid ${t.borderSoft}`, color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MailIcons.copy}</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. iBoîte — Home (compte personnel · Courriers)
// ─────────────────────────────────────────────────────────────
function ScrIBoiteCourriers({ t, accountId = 'personal' }) {
  const acc = ACCOUNTS.find(a => a.id === accountId);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="iBoîte" sub="Vos courriers, colis et emails"/>
      <div style={{ padding: '0 22px' }}><AccountPill acc={acc} t={t}/></div>
      <AddressStrip acc={acc} t={t}/>
      <IBoiteTabs t={t} active="courriers"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 22px 22px' }}>
        {/* Folder chips */}
        <div style={{ display: 'flex', gap: 6, padding: '6px 0 12px', overflowX: 'auto' }}>
          {[
            { l: 'Réception', n: 2, sel: true },
            { l: 'À traiter', n: 1 },
            { l: 'Expédiés' },
            { l: 'Poubelle' },
          ].map((f, i) => (
            <button key={i} style={{ flexShrink: 0, padding: '6px 12px', background: f.sel ? idnTokens.green : t.surface, border: `1px solid ${f.sel ? idnTokens.green : t.border}`, color: f.sel ? '#fff' : t.ink2, borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {f.l}{f.n ? <span style={{ marginLeft: 6, padding: '0 6px', borderRadius: 9999, background: f.sel ? 'rgba(255,255,255,0.22)' : t.surface2, fontSize: 10, fontWeight: 700 }}>{f.n}</span> : ''}
            </button>
          ))}
        </div>
        {/* List */}
        {MOCK_LETTERS.map(l => (
          <div key={l.id} style={{ position: 'relative', marginBottom: 10, padding: 14, background: t.surface, border: `${l.read ? 1 : 1.5}px solid ${l.read ? t.border : idnTokens.green}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Paper effect */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, background: t.surface2, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}/>
            {l.type === 'action_required' && !l.read && (
              <div style={{ position: 'absolute', top: 10, right: 12, padding: '2px 7px', borderRadius: 4, background: '#B83A3A', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>URGENT</div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.surface2, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{MailIcons.mail}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>{l.sender}</div>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: l.read ? 500 : 700, marginTop: 2 }}>{l.subject}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.preview}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: t.muted }}>{l.time}{l.due && ` · Réponse avant ${l.due}`}</span>
                  {!l.read && <div style={{ width: 8, height: 8, borderRadius: 9999, background: idnTokens.green }}/>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button style={{ position: 'absolute', right: 16, bottom: 86, width: 52, height: 52, borderRadius: 9999, background: idnTokens.green, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(14,124,58,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. iBoîte — Détail d'un courrier (preview A4)
// ─────────────────────────────────────────────────────────────
function ScrIBoiteCourrierDetail({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Courrier" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}>{IdnIcons.more}</button>}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', background: t.bg }}>
        {/* A4 paper */}
        <div style={{ background: '#fffdf7', borderRadius: 8, padding: '24px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a1a1a' }}>
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, lineHeight: 1.4, color: '#3a3a3a' }}>
            <div style={{ maxWidth: '50%' }}>
              <div style={{ fontWeight: 700 }}>Mairie de Libreville</div>
              <div>Service État Civil</div>
              <div>BP 123 Libreville</div>
            </div>
            <div style={{ maxWidth: '45%', textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>Jean Dupont</div>
              <div>BP 1000</div>
              <div>Libreville, GABON</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: '#3a3a3a', marginTop: 14 }}>Libreville, le 15 mai 2026</div>
          {/* Objet */}
          <div style={{ borderBottom: '1px solid #d6d2c4', paddingBottom: 6, marginTop: 16, fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>Objet : Complément de dossier requis</div>
          {/* Corps */}
          <div style={{ fontSize: 11, lineHeight: 1.7, color: '#2a2a2a', marginTop: 14, textAlign: 'justify' }}>
            <p style={{ margin: 0 }}>Monsieur,</p>
            <p style={{ marginTop: 8 }}>Suite à l'examen de votre dossier de demande d'acte de naissance, nous avons constaté qu'il manque une pièce justificative.</p>
            <p style={{ marginTop: 8, marginBottom: 0 }}>Nous vous prions de bien vouloir nous transmettre dans les meilleurs délais :</p>
            <ul style={{ margin: '4px 0 0 14px', padding: 0 }}>
              <li>Une copie de votre pièce d'identité</li>
              <li>Un justificatif de domicile récent</li>
            </ul>
            <p style={{ marginTop: 8 }}>Sans réponse de votre part sous 15 jours, votre dossier sera classé sans suite.</p>
            <p style={{ marginTop: 14, textAlign: 'right', fontStyle: 'italic', color: '#1d3a6a' }}>Le Service de l'État Civil</p>
          </div>
        </div>

        {/* Action requise */}
        <div style={{ background: t.dark ? '#1F1216' : '#FBE5E5', border: `1px solid ${t.dark ? '#3A1E1E' : '#F5C7C7'}`, borderRadius: 12, padding: 12, marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: '#B83A3A' }}>{MailIcons.alert}</span>
          <div>
            <div style={{ fontSize: 12, color: '#B83A3A', fontWeight: 700 }}>Action requise</div>
            <div style={{ fontSize: 11, color: t.ink2, marginTop: 2 }}>Réponse attendue avant le 30 mai 2026</div>
          </div>
        </div>
      </div>
      {/* Toolbar actions */}
      <div style={{ borderTop: `1px solid ${t.borderSoft}`, background: t.surface, padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 4 }}>
          {[
            { i: MailIcons.reply,    l: 'Répondre',     primary: true },
            { i: MailIcons.clock,    l: 'À traiter' },
            { i: MailIcons.printer,  l: 'Imprimer' },
            { i: <span style={{ color: '#B83A3A' }}>{MailIcons.trash}</span>, l: 'Suppr.' },
          ].map((a, i) => (
            <button key={i} style={{ flex: 1, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: a.primary ? idnTokens.green : t.ink2 }}>
              <div>{a.i}</div>
              <span style={{ fontSize: 10, fontWeight: 500 }}>{a.l}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. iBoîte — Compte switch (overlay)
// ─────────────────────────────────────────────────────────────
function ScrIBoiteAccounts({ t }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}/>
      <div style={{ position: 'absolute', top: 80, left: 22, right: 22, background: t.surface, borderRadius: 16, padding: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.22)' }}>
        <div style={{ padding: '10px 12px 4px', fontSize: 10, color: t.muted, fontWeight: 600, letterSpacing: 1.2 }}>VOS BOÎTES</div>
        {ACCOUNTS.map((a, i) => {
          const sel = i === 0;
          return (
            <button key={a.id} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: a.grad, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{MailIcons[a.icon]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{a.label}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{a.email}</div>
              </div>
              {sel && <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span>}
            </button>
          );
        })}
        <div style={{ height: 1, background: t.borderSoft, margin: '8px 4px' }}/>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, color: idnTokens.green, fontSize: 13, fontWeight: 500, textAlign: 'left' }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.plus}</span>
          Ajouter une boîte
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. iBoîte — Section Colis
// ─────────────────────────────────────────────────────────────
function ScrIBoiteColis({ t }) {
  const acc = ACCOUNTS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="iBoîte" sub="Vos courriers, colis et emails"/>
      <div style={{ padding: '0 22px' }}><AccountPill acc={acc} t={t}/></div>
      <AddressStrip acc={acc} t={t}/>
      <IBoiteTabs t={t} active="colis"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 22px 22px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: t.dark ? '#3A2D14' : '#FEF3C7', border: `1px solid ${t.dark ? '#5A4626' : '#FDE68A'}`, borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400e' }}>
              {MailIcons.package}
              <span style={{ fontSize: 22, fontWeight: 700, color: t.dark ? '#fcd34d' : '#92400e' }}>1</span>
            </div>
            <div style={{ fontSize: 11, color: t.dark ? '#fcd34d' : '#92400e', fontWeight: 500, marginTop: 2 }}>À retirer</div>
          </div>
          <div style={{ flex: 1, background: t.dark ? '#10243A' : idnTokens.blueSoft, border: `1px solid ${t.dark ? '#1B3F5A' : '#BFD9F7'}`, borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: idnTokens.blue }}>
              {MailIcons.truck}
              <span style={{ fontSize: 22, fontWeight: 700, color: idnTokens.blue }}>1</span>
            </div>
            <div style={{ fontSize: 11, color: idnTokens.blue, fontWeight: 500, marginTop: 2 }}>En transit</div>
          </div>
        </div>

        {/* Liste */}
        {MOCK_PACKAGES.map(p => {
          const avail = p.status === 'available';
          return (
            <div key={p.id} style={{ display: 'flex', gap: 12, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: avail ? (t.dark ? '#3A2D14' : '#FEF3C7') : (t.dark ? '#10243A' : idnTokens.blueSoft), color: avail ? '#92400e' : idnTokens.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avail ? MailIcons.package : MailIcons.truck}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>{p.description}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>De : {p.sender}</div>
                <div style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>{p.tracking}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: avail ? '#FEF3C7' : idnTokens.blueSoft, color: avail ? '#92400e' : idnTokens.blue }}>{avail ? 'À retirer' : 'En transit'}</span>
                {p.eta && <span style={{ fontSize: 10, color: t.muted }}>Arrivée {p.eta}</span>}
              </div>
            </div>
          );
        })}

        {/* Point Relais info */}
        <div style={{ marginTop: 18, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.ink2 }}>{MailIcons.qr}</div>
          <div>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>POINT RELAIS IDN.GA</div>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 14, color: t.ink, fontWeight: 600, marginTop: 2 }}>{acc.addr.qr}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>À présenter au retrait</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. iBoîte — Section eMails (liste)
// ─────────────────────────────────────────────────────────────
function ScrIBoiteEmails({ t }) {
  const acc = ACCOUNTS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="iBoîte" sub="Vos courriers, colis et emails"/>
      <div style={{ padding: '0 22px' }}><AccountPill acc={acc} t={t}/></div>
      <AddressStrip acc={acc} t={t}/>
      <IBoiteTabs t={t} active="emails"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 22px 22px' }}>
        <div style={{ display: 'flex', gap: 6, padding: '6px 0 12px', overflowX: 'auto' }}>
          {[
            { l: 'Réception', n: 2, sel: true },
            { l: 'Favoris', n: 1 },
            { l: 'Envoyés' },
            { l: 'Corbeille' },
          ].map((f, i) => (
            <button key={i} style={{ flexShrink: 0, padding: '6px 12px', background: f.sel ? idnTokens.green : t.surface, border: `1px solid ${f.sel ? idnTokens.green : t.border}`, color: f.sel ? '#fff' : t.ink2, borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {f.l}{f.n ? <span style={{ marginLeft: 6, padding: '0 6px', borderRadius: 9999, background: f.sel ? 'rgba(255,255,255,0.22)' : t.surface2, fontSize: 10, fontWeight: 700 }}>{f.n}</span> : ''}
            </button>
          ))}
        </div>

        {MOCK_EMAILS.map((e, i) => (
          <div key={e.id} style={{ display: 'flex', gap: 10, padding: '12px 4px', borderBottom: i === MOCK_EMAILS.length - 1 ? 'none' : `1px solid ${t.borderSoft}`, background: e.read ? 'transparent' : (t.dark ? 'rgba(14,124,58,0.06)' : 'rgba(14,124,58,0.04)') }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: e.starred ? idnTokens.yellow : t.mutedSoft, padding: 0, alignSelf: 'flex-start', marginTop: 6 }}>{e.starred ? MailIcons.star : MailIcons.starO}</button>
            <div style={{ width: 36, height: 36, borderRadius: 9999, background: e.sender.type === 'admin' ? 'linear-gradient(135deg,#3b82f6,#4338ca)' : 'linear-gradient(135deg,#10b981,#0d9488)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{e.sender.type === 'admin' ? MailIcons.building : MailIcons.user}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: e.read ? 500 : 700, color: e.read ? t.ink2 : t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.sender.name}</div>
                <span style={{ fontSize: 10, color: t.muted, flexShrink: 0 }}>{e.time}</span>
              </div>
              <div style={{ fontSize: 12, color: e.read ? t.muted : t.ink, fontWeight: e.read ? 500 : 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subject}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ flex: 1, fontSize: 11, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.preview}</span>
                {e.attach && <span style={{ color: t.muted }}>{MailIcons.paper}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button style={{ position: 'absolute', right: 16, bottom: 24, width: 52, height: 52, borderRadius: 9999, background: idnTokens.green, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(14,124,58,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {MailIcons.send}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. iBoîte — Détail email
// ─────────────────────────────────────────────────────────────
function ScrIBoiteEmailDetail({ t }) {
  const e = MOCK_EMAILS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Message" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: idnTokens.yellow, cursor: 'pointer', padding: 4 }}>{MailIcons.star}</button>}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 22px 14px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, letterSpacing: -0.3, lineHeight: 1.3 }}>{e.subject}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 16, paddingBottom: 14, borderBottom: `1px solid ${t.borderSoft}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 9999, background: 'linear-gradient(135deg,#3b82f6,#4338ca)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{MailIcons.building}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{e.sender.name}</div>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono }}>{e.sender.email}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>À : jean.dupont@idn.ga · 15 mai 2026, 09:32</div>
          </div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: t.ink2, paddingTop: 14 }}>
          <p style={{ margin: 0 }}>Bonjour Monsieur Dupont,</p>
          <p style={{ marginTop: 10 }}>Votre demande a été enregistrée sous le numéro <b style={{ fontFamily: idnTokens.mono, color: t.ink }}>#2024-12345</b>. Vous recevrez une réponse définitive sous 3 à 5 jours ouvrés.</p>
          <p style={{ marginTop: 10 }}>Vous pouvez suivre l'avancement de votre dossier depuis votre espace personnel sur idn.ga.</p>
          <p style={{ marginTop: 16, color: t.muted }}>Cordialement,<br/>L'équipe État Civil</p>
        </div>

        {/* Pièces jointes (cas E2) */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>PIÈCE JOINTE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12 }}>
            <div style={{ width: 36, height: 44, borderRadius: 4, background: '#fff', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: idnTokens.blue, fontSize: 9, fontWeight: 700 }}>PDF</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>Confirmation_2024-12345.pdf</div>
              <div style={{ fontSize: 10, color: t.muted }}>248 KB</div>
            </div>
            <button style={{ background: 'none', border: 'none', color: idnTokens.green, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Télécharger</button>
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${t.borderSoft}`, background: t.surface, padding: '10px 14px', display: 'flex', gap: 4 }}>
        {[
          { i: MailIcons.reply,   l: 'Répondre', primary: true },
          { i: MailIcons.forward, l: 'Transférer' },
          { i: MailIcons.archive, l: 'Archiver' },
          { i: <span style={{ color: '#B83A3A' }}>{MailIcons.trash}</span>, l: 'Suppr.' },
        ].map((a, i) => (
          <button key={i} style={{ flex: 1, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: a.primary ? idnTokens.green : t.ink2 }}>
            {a.i}
            <span style={{ fontSize: 10, fontWeight: 500 }}>{a.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. iBoîte — Compose new email
// ─────────────────────────────────────────────────────────────
function ScrIBoiteCompose({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Nouveau message" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: idnTokens.green, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{MailIcons.send}</button>}/>
      <div style={{ flex: 1, padding: '0 22px' }}>
        <div style={{ borderBottom: `1px solid ${t.borderSoft}`, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: 500 }}>De</span>
          <span style={{ fontSize: 13, color: t.ink }}>jean.dupont@idn.ga</span>
        </div>
        <div style={{ borderBottom: `1px solid ${t.borderSoft}`, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: 500 }}>À</span>
          <input placeholder="destinataire@…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: t.ink, fontFamily: idnTokens.font }}/>
        </div>
        <div style={{ borderBottom: `1px solid ${t.borderSoft}`, padding: '12px 0' }}>
          <input placeholder="Objet" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: t.ink, fontWeight: 600, fontFamily: idnTokens.font }}/>
        </div>
        <textarea placeholder="Votre message…" rows="10" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: t.ink, fontFamily: idnTokens.font, lineHeight: 1.6, padding: '14px 0', resize: 'none' }} defaultValue=""/>
      </div>
      <div style={{ borderTop: `1px solid ${t.borderSoft}`, background: t.surface, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'transparent', border: 'none', color: t.ink2, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
          {MailIcons.paper} Joindre
        </button>
        <div style={{ flex: 1 }}/>
        <IdnButton t={t} variant="ghost" size="sm">Brouillon</IdnButton>
        <IdnButton t={t} variant="primary" size="sm" leadIcon={MailIcons.send}>Envoyer</IdnButton>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScrIBoiteCourriers, ScrIBoiteCourrierDetail, ScrIBoiteAccounts,
  ScrIBoiteColis, ScrIBoiteEmails, ScrIBoiteEmailDetail, ScrIBoiteCompose,
  MailIcons, ACCOUNTS, MOCK_LETTERS, MOCK_PACKAGES, MOCK_EMAILS,
});
