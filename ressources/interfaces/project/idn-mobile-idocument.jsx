// IDN Mobile — iDocument (Coffre-fort de documents)
// 8 dossiers + ajout 3 étapes + demande de documents officiels + mode confidentiel

// ─────────────────────────────────────────────────────────────
// Icônes locales
// ─────────────────────────────────────────────────────────────
const DocIcons = {
  user:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>,
  baby:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="4"/><path d="M9 13l-3 4 6 4 6-4-3-4M10 8h.5M13.5 8h.5M10 11c1 .5 3 .5 4 0"/></svg>,
  home:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>,
  cap:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5M21 9v6"/></svg>,
  brief:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  heart:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>,
  car:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16V11l2-5h10l2 5v5"/><path d="M5 16h14v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>,
  file:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>,
  folderO: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  upload:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>,
  camera:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M9 6l1.5-2h3L15 6"/></svg>,
  download:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>,
  trash:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>,
  eye:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 3l18 18M10.5 6.4A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6s-1 1.7-3 3.4M6.7 7.9C3.7 9.6 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>,
  shield:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>,
  sparkles:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5 5 1.5-5 1.5L12 16l-1.5-5-5-1.5 5-1.5z"/><path d="M19 14v3M17.5 15.5h3M5 4v2M4 5h2"/></svg>,
  send:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  scale:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 9l-3 6h6zM19 9l-3 6h6zM5 9l7-3 7 3M5 21h14"/></svg>,
  bell:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3V9zM10 19a2 2 0 0 0 4 0"/></svg>,
  checkCir:<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>,
};

// 8 dossiers + couleurs
const DOC_FOLDERS = [
  { id: 'identity',     label: 'Identité',     desc: 'CNI, Passeport, Carte de séjour', icon: 'user',  grad: 'linear-gradient(135deg,#3b82f6,#4338ca)', count: 3 },
  { id: 'civil_status', label: 'État Civil',   desc: 'Naissance, mariage, divorce',     icon: 'baby',  grad: 'linear-gradient(135deg,#ec4899,#e11d48)', count: 2 },
  { id: 'residence',    label: 'Domicile',     desc: 'Justificatif, factures',           icon: 'home',  grad: 'linear-gradient(135deg,#10b981,#0d9488)', count: 1 },
  { id: 'education',    label: 'Diplômes',     desc: 'Certificats, attestations',        icon: 'cap',   grad: 'linear-gradient(135deg,#f59e0b,#ea580c)', count: 4 },
  { id: 'work',         label: 'Travail',      desc: 'Contrats, bulletins',              icon: 'brief', grad: 'linear-gradient(135deg,#a855f7,#7e22ce)', count: 5 },
  { id: 'health',       label: 'Santé',        desc: 'CNAMGS, ordonnances',              icon: 'heart', grad: 'linear-gradient(135deg,#ef4444,#e11d48)', count: 2 },
  { id: 'vehicle',      label: 'Véhicule',     desc: 'Permis, carte grise',              icon: 'car',   grad: 'linear-gradient(135deg,#06b6d4,#2563eb)', count: 2 },
  { id: 'other',        label: 'Autres',       desc: 'Documents divers',                  icon: 'file',  grad: 'linear-gradient(135deg,#64748b,#475569)', count: 0 },
];

const IDENTITY_DOCS = [
  { id: 'D1', name: 'CNI · Recto',       fileType: 'image', side: 'front', status: 'verified', expiresIn: '4 ans' },
  { id: 'D2', name: 'CNI · Verso',       fileType: 'image', side: 'back',  status: 'verified', expiresIn: '4 ans' },
  { id: 'D3', name: 'Passeport',         fileType: 'pdf',                  status: 'verified', expiresIn: '3 ans' },
];

const REQUESTABLE_DOCS = [
  { id: 'birth',     label: 'Acte de Naissance',     icon: 'baby',  color: '#ec4899', desc: 'Copie intégrale ou extrait', delai: '3-5 jours',  prix: '2 500 FCFA' },
  { id: 'criminal',  label: 'Casier Judiciaire',     icon: 'scale', color: '#a855f7', desc: 'Bulletin n°3',                delai: '5-7 jours',  prix: '5 000 FCFA' },
  { id: 'driving',   label: 'Permis de Conduire',    icon: 'car',   color: '#f97316', desc: 'Renouvellement / duplicata',  delai: '7-10 jours', prix: '15 000 FCFA' },
  { id: 'residence', label: 'Certificat Résidence',  icon: 'home',  color: '#3b82f6', desc: 'Attestation officielle',      delai: '1-2 jours',  prix: '1 000 FCFA' },
  { id: 'diploma',   label: 'Copie de Diplôme',      icon: 'cap',   color: '#10b981', desc: 'Copie certifiée conforme',    delai: '5-7 jours',  prix: '3 000 FCFA' },
  { id: 'marriage',  label: 'Acte de Mariage',       icon: 'heart', color: '#ef4444', desc: 'Copie intégrale',             delai: '3-5 jours',  prix: '2 500 FCFA' },
];

// ─────────────────────────────────────────────────────────────
// Folder card
// ─────────────────────────────────────────────────────────────
function FolderCard({ f, t, opened }) {
  const empty = f.count === 0;
  return (
    <button style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      {/* Folder icon stylisé */}
      <div style={{ position: 'relative', width: 60, height: 50 }}>
        {/* Onglet arrière */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 24, height: 8, background: f.grad, borderRadius: '4px 4px 0 0', opacity: empty ? 0.3 : 1 }}/>
        {/* Corps du dossier */}
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, bottom: 0, background: f.grad, borderRadius: '5px 8px 6px 6px', opacity: empty ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          {React.cloneElement(DocIcons[f.icon], { width: 22, height: 22 })}
        </div>
        {/* Doc qui dépasse (ouvert) */}
        {opened && (
          <div style={{ position: 'absolute', top: 12, right: -3, width: 14, height: 18, background: '#fff', borderRadius: '2px 0 0 2px', boxShadow: '-2px 2px 4px rgba(0,0,0,0.12)' }}/>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{f.label}</div>
        <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{f.count} document{f.count > 1 ? 's' : ''}</div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. iDocument — Home (grille 8 dossiers)
// ─────────────────────────────────────────────────────────────
function ScrIDocHome({ t, confidential }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="iDocument" sub="17 documents · 8 dossiers"
        right={(
          <div style={{ display: 'flex', gap: 6 }}>
            <button title="Mode confidentiel" style={{ width: 36, height: 36, borderRadius: 9999, background: confidential ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface, border: `1px solid ${confidential ? (t.dark ? '#1B3F2A' : '#C5E0CC') : t.border}`, color: confidential ? idnTokens.green : t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {confidential ? DocIcons.eyeOff : DocIcons.eye}
            </button>
            <button title="Notifications" style={{ position: 'relative', width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {IdnIcons.bell}
              <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 9999, background: '#B83A3A' }}/>
            </button>
          </div>
        )}
      />
      {/* IA badge */}
      <div style={{ margin: '0 22px 8px', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9999, background: 'linear-gradient(90deg,#7e22ce0d,#a855f70d)', border: `1px solid ${t.dark ? '#3a1f5a' : '#e9d5ff'}` }}>
        <span style={{ color: '#a855f7' }}>{DocIcons.sparkles}</span>
        <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>IA Active</span>
        <span style={{ flex: 1, fontSize: 11, color: t.muted }}>Détection automatique du type & du dossier</span>
      </div>
      {/* Search */}
      <div style={{ padding: '0 22px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '10px 14px' }}>
          <span style={{ color: t.muted }}>{IdnIcons.search}</span>
          <input placeholder="Rechercher un document…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: t.ink, fontFamily: idnTokens.font }}/>
        </div>
      </div>
      {/* Grille dossiers */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {DOC_FOLDERS.map((f, i) => <FolderCard key={f.id} f={f} t={t} opened={i === 0}/>)}
        </div>
      </div>
      {/* FAB */}
      <button style={{ position: 'absolute', right: 16, bottom: 24, height: 52, padding: '0 18px', borderRadius: 9999, background: idnTokens.green, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(14,124,58,0.36)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        {IdnIcons.plus} Ajouter
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. iDocument — Dossier ouvert (Identité)
// ─────────────────────────────────────────────────────────────
function ScrIDocFolder({ t, confidential }) {
  const f = DOC_FOLDERS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Identité" sub="3 documents" onBack={() => {}}
        right={<button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.more}</button>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {IDENTITY_DOCS.map(d => (
            <div key={d.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Preview */}
              <div style={{ position: 'relative', aspectRatio: '4/3', background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', filter: confidential ? 'blur(6px)' : 'none' }}>
                {d.fileType === 'image' ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/></svg>
                ) : (
                  <div style={{ width: 40, height: 50, background: '#fff', borderRadius: 4, padding: 6, color: idnTokens.green, fontSize: 9, fontWeight: 700 }}>PDF</div>
                )}
                {d.side && (
                  <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', letterSpacing: 0.5 }}>{d.side === 'front' ? 'RECTO' : 'VERSO'}</div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, background: idnTokens.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.cloneElement(DocIcons.shield, { width: 12, height: 12 })}
                </div>
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 12, color: t.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green }}>VÉRIFIÉ</span>
                  <span style={{ fontSize: 10, color: t.muted }}>Expire {d.expiresIn}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button style={{ position: 'absolute', right: 16, bottom: 24, height: 52, padding: '0 18px', borderRadius: 9999, background: idnTokens.green, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(14,124,58,0.36)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        {IdnIcons.plus} Ajouter
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. iDocument — Dossier vide
// ─────────────────────────────────────────────────────────────
function ScrIDocFolderEmpty({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Autres" sub="0 document" onBack={() => {}}/>
      <div style={{ flex: 1, padding: '20px 22px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', padding: '32px 24px', border: `1.5px dashed ${t.border}`, borderRadius: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft, opacity: 0.5 }}>
            {React.cloneElement(DocIcons.folderO, { width: 48, height: 48 })}
          </div>
          <div style={{ fontSize: 14, color: t.ink2, fontWeight: 600, marginTop: 12 }}>Aucun document</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>Glissez vos fichiers ici ou utilisez le bouton d'ajout. L'IA détectera automatiquement le type et rangera le document.</div>
          <IdnButton t={t} variant="primary" full leadIcon={IdnIcons.plus} style={{ marginTop: 18 }}>Ajouter un document</IdnButton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. iDocument — Preview document (modal sheet)
// ─────────────────────────────────────────────────────────────
function ScrIDocPreview({ t }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}/>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: t.surface, borderRadius: '22px 22px 0 0', maxHeight: '92%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 9999, background: t.borderSoft }}/>
        </div>
        <div style={{ padding: '0 22px 14px', borderBottom: `1px solid ${t.borderSoft}` }}>
          <div style={{ fontSize: 15, color: t.ink, fontWeight: 700 }}>CNI · Recto</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Identité · 12 mai 2026</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 22px 14px' }}>
          {/* Preview */}
          <div style={{ aspectRatio: '85/55', borderRadius: 14, background: DOC_FOLDERS[0].grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', position: 'relative', overflow: 'hidden' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/></svg>
            <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', letterSpacing: 0.5 }}>RECTO</div>
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, color: '#fff' }}>
              {React.cloneElement(DocIcons.shield, { width: 12, height: 12, stroke: '#22c55e' })}
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8 }}>DOCUMENT VÉRIFIÉ</span>
            </div>
          </div>
          {/* Métadonnées */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>DÉTAILS</div>
            <div style={{ background: t.surface2, borderRadius: 12, padding: 14 }}>
              {[
                { l: 'Type',     v: 'Identité' },
                { l: 'Numéro',   v: 'GA-1234-5678-9012', mono: true },
                { l: 'Délivré le', v: '12/03/2022' },
                { l: 'Expire le', v: '12/03/2030', accent: true },
                { l: 'Autorité', v: 'DGDI' },
                { l: 'Taille',   v: '2.4 MB' },
                { l: 'Source',   v: 'Upload' },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
                  <span style={{ fontSize: 12, color: t.muted }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: r.accent ? idnTokens.green : t.ink, fontFamily: r.mono ? idnTokens.mono : idnTokens.font }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 22px 22px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', gap: 8 }}>
          <IdnButton t={t} variant="ghost" full leadIcon={DocIcons.download}>Télécharger</IdnButton>
          <IdnButton t={t} variant="danger" full leadIcon={DocIcons.trash}>Supprimer</IdnButton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5/6/7. iDocument — Ajout 3 étapes (plein écran)
// ─────────────────────────────────────────────────────────────
function ScrIDocAddSelect({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Ajouter un document" onBack={() => {}}/>
      <div style={{ flex: 1, padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Sélection dossier */}
        <div>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>DOSSIER DE DESTINATION</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
            {DOC_FOLDERS.slice(0, 6).map((f, i) => (
              <button key={f.id} style={{ flexShrink: 0, padding: '8px 12px', background: i === 0 ? idnTokens.green : t.surface, border: `1px solid ${i === 0 ? idnTokens.green : t.border}`, color: i === 0 ? '#fff' : t.ink2, borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 8 }}>L'IA peut détecter automatiquement le bon dossier après l'upload.</div>
        </div>
        {/* Dropzone */}
        <div style={{ flex: 1, border: `1.5px dashed ${idnTokens.green}`, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 9999, background: '#fff', color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(14,124,58,0.2)' }}>
            {DocIcons.upload}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: t.ink, fontWeight: 600 }}>Cliquez pour sélectionner</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>PDF, JPG, PNG · max 10 MB</div>
          </div>
        </div>
        <IdnButton t={t} variant="ghost" size="lg" full leadIcon={DocIcons.camera}>Prendre une photo</IdnButton>
      </div>
    </div>
  );
}

function ScrIDocAddPreview({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Confirmer" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: '#B83A3A', cursor: 'pointer', padding: 4 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>}/>
      <div style={{ flex: 1, padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Aperçu */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 76, borderRadius: 6, background: '#fff', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: idnTokens.green, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>PDF</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>cni_recto_aissatou.pdf</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>1.24 MB</div>
          </div>
        </div>
        {/* Détection IA */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, background: 'linear-gradient(135deg,#a855f70d,#7e22ce0d)', border: `1px solid ${t.dark ? '#3a1f5a' : '#e9d5ff'}`, borderRadius: 12 }}>
          <span style={{ color: '#a855f7', marginTop: 2 }}>{DocIcons.sparkles}</span>
          <div>
            <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 600 }}>Détection IA</div>
            <div style={{ fontSize: 11, color: t.ink2, marginTop: 2, lineHeight: 1.5 }}>Type : <b>Identité (recto)</b> · Dossier suggéré : <b>Identité</b></div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <IdnButton t={t} variant="primary" size="lg" full>Confirmer l'envoi</IdnButton>
      </div>
    </div>
  );
}

function ScrIDocAddSuccess({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 26px 26px', textAlign: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ width: 96, height: 96, borderRadius: 9999, background: idnTokens.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(14,124,58,0.35)' }}>
          {DocIcons.checkCir}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Document ajouté !</div>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 10, lineHeight: 1.55, maxWidth: 280, margin: '10px auto 0' }}>Votre document est en cours de vérification. Vous serez notifié·e dès qu'il sera validé.</div>
        </div>
        <div style={{ width: '100%', maxWidth: 280, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: DOC_FOLDERS[0].grad, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(DocIcons.user, { width: 16, height: 16 })}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: t.ink, fontWeight: 600 }}>Identité</div>
            <div style={{ fontSize: 11, color: t.muted }}>4 documents</div>
          </div>
        </div>
      </div>
      <IdnButton t={t} variant="primary" size="lg" full>Retour aux documents</IdnButton>
      <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, padding: 16, cursor: 'pointer' }}>Ajouter un autre</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. iDocument — Demander un document officiel
// ─────────────────────────────────────────────────────────────
function ScrIDocRequest({ t }) {
  const [sel, setSel] = React.useState('birth');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Demander" sub="Document officiel à l'administration" onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 90px' }}>
        {/* Demandes en cours */}
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '8px 0 8px' }}>DEMANDES EN COURS</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(DocIcons.file, { width: 18, height: 18 })}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>Acte de Naissance</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>Demandé le 12 mai · Prévu le 17 mai</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: t.dark ? '#10243A' : idnTokens.blueSoft, color: idnTokens.blue }}>En cours</span>
        </div>

        {/* Types disponibles */}
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '20px 0 8px' }}>DOCUMENTS DISPONIBLES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {REQUESTABLE_DOCS.map(d => {
            const isSel = d.id === sel;
            return (
              <button key={d.id} onClick={() => setSel(d.id)} style={{ background: t.surface, border: `2px solid ${isSel ? idnTokens.green : t.border}`, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
                {isSel && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9999, background: idnTokens.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg>
                  </div>
                )}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: d.color + '22', color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  {React.cloneElement(DocIcons[d.icon], { width: 16, height: 16 })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.ink, lineHeight: 1.3 }}>{d.label}</div>
                <div style={{ fontSize: 10, color: t.muted, marginTop: 2, lineHeight: 1.4, height: 28, overflow: 'hidden' }}>{d.desc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 9, color: t.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    {d.delai}
                  </span>
                  <span style={{ fontSize: 10, color: t.ink, fontWeight: 700 }}>{d.prix}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* CTA flottant */}
      <div style={{ position: 'absolute', bottom: 14, left: 22, right: 22 }}>
        <button style={{ width: '100%', padding: 14, background: 'linear-gradient(90deg,#0E7C3A,#10b981)', border: 'none', color: '#fff', borderRadius: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(14,124,58,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          {DocIcons.send} Envoyer la demande {IdnIcons.arrow}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScrIDocHome, ScrIDocFolder, ScrIDocFolderEmpty, ScrIDocPreview,
  ScrIDocAddSelect, ScrIDocAddPreview, ScrIDocAddSuccess, ScrIDocRequest,
  DocIcons, DOC_FOLDERS, IDENTITY_DOCS, REQUESTABLE_DOCS,
});
