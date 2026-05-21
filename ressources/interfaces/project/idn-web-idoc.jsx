// IDN Web Desktop — iDocument (Coffre-fort)
// Grille de 8 dossiers, mode confidentiel, ajout modal, page demander

function IDocWeb({ t, screen = 'home', user = DEMO_USERS.citoyen }) {
  const isRequest = screen === 'request';
  return (
    <BrowserChrome t={t} url={`https://idn.ga/idocument${isRequest ? '/request' : ''}`} w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden', position: 'relative' }}>
        <CWNav t={t} user={user} screen="home"/>
        {!isRequest && <IDWMain t={t} screen={screen}/>}
        {isRequest && <IDWRequest t={t}/>}
        {screen === 'modal-preview' && <IDWModalPreview t={t}/>}
        {screen === 'modal-add'     && <IDWModalAdd t={t}/>}
      </div>
    </BrowserChrome>
  );
}

function IDWMain({ t, screen }) {
  const inFolder = screen.startsWith('folder');
  const conf = screen.includes('conf');
  const empty = screen === 'folder-empty';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <IDWHeader t={t} inFolder={inFolder} conf={conf}/>
      <div style={{ padding: '0 36px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ color: t.muted }}>{IdnIcons.search}</span>
          <input placeholder="Rechercher un document…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: t.ink, fontFamily: idnTokens.font }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 36px 32px' }}>
        {inFolder && empty && <IDWFolderEmpty t={t}/>}
        {inFolder && !empty && <IDWFolder t={t} conf={conf}/>}
        {!inFolder && <IDWFolderGrid t={t} conf={conf}/>}
      </div>
    </div>
  );
}

function IDWHeader({ t, inFolder, conf }) {
  return (
    <div style={{ padding: '24px 36px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {inFolder && (
          <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        )}
        {!inFolder && (
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,#3b82f6,#4338ca)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{React.cloneElement(DocIcons.file, { width: 22, height: 22 })}</div>
        )}
        <div>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>{inFolder ? 'IDENTITÉ' : 'COFFRE-FORT NUMÉRIQUE'}</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: t.ink, letterSpacing: -0.6, marginTop: 2 }}>{inFolder ? 'Identité' : 'iDocument'}</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{inFolder ? '3 documents' : '17 documents · 8 dossiers'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* IA Active */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, background: 'linear-gradient(90deg,#7e22ce15,#a855f715)', border: `1px solid ${t.dark ? '#3a1f5a' : '#e9d5ff'}`, color: '#a855f7', fontSize: 11, fontWeight: 600 }}>
          {React.cloneElement(DocIcons.sparkles, { width: 13, height: 13 })}
          IA Active
        </span>
        {/* Mode confidentiel */}
        <button title="Mode confidentiel" style={{ width: 36, height: 36, borderRadius: 9999, background: conf ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface, border: `1px solid ${conf ? (t.dark ? '#1B3F2A' : '#C5E0CC') : t.border}`, color: conf ? idnTokens.green : t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {conf ? DocIcons.eyeOff : DocIcons.eye}
        </button>
        {/* Notifications */}
        <button style={{ position: 'relative', width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {IdnIcons.bell}
          <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 9999, background: '#B83A3A' }}/>
        </button>
        {/* Export */}
        <IdnButton t={t} variant="ghost" leadIcon={DocIcons.download}>Export</IdnButton>
        {/* Demander */}
        <IdnButton t={t} variant="ghost" leadIcon={DocIcons.send}>Demander</IdnButton>
        {/* Ajouter */}
        <IdnButton t={t} variant="primary" leadIcon={IdnIcons.plus}>Ajouter</IdnButton>
      </div>
    </div>
  );
}

// Grille des 8 dossiers
function IDWFolderGrid({ t, conf }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {DOC_FOLDERS.map((f, i) => <IDWFolderCard key={f.id} f={f} t={t} opened={i === 0} conf={conf}/>)}
    </div>
  );
}

function IDWFolderCard({ f, t, opened, conf }) {
  const empty = f.count === 0;
  return (
    <button style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, cursor: 'pointer', textAlign: 'left', transition: 'transform .12s, border-color .12s' }}>
      <div style={{ position: 'relative', width: 88, height: 72 }}>
        <div style={{ position: 'absolute', top: 4, left: 6, width: 34, height: 12, background: f.grad, borderRadius: '5px 5px 0 0', opacity: empty ? 0.3 : 1, filter: conf ? 'blur(4px)' : 'none' }}/>
        <div style={{ position: 'absolute', top: 14, left: 0, right: 0, bottom: 0, background: f.grad, borderRadius: '6px 12px 8px 8px', opacity: empty ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', filter: conf ? 'blur(4px)' : 'none' }}>
          {React.cloneElement(DocIcons[f.icon], { width: 28, height: 28 })}
        </div>
        {opened && (
          <div style={{ position: 'absolute', top: 22, right: -4, width: 18, height: 26, background: '#fff', borderRadius: '3px 0 0 3px', boxShadow: '-2px 2px 6px rgba(0,0,0,0.12)' }}/>
        )}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: t.ink }}>{f.label}</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.4 }}>{f.desc}</div>
      </div>
      <div style={{ marginTop: 'auto', fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, fontWeight: 500, letterSpacing: 0.4 }}>{f.count} document{f.count > 1 ? 's' : ''}</div>
    </button>
  );
}

// Vue dossier ouvert (5 cols)
function IDWFolder({ t, conf }) {
  const f = DOC_FOLDERS[0];
  // Ajoute quelques docs supplémentaires pour remplir la grille
  const docs = [
    ...IDENTITY_DOCS,
    { id: 'D4', name: 'Passeport · Page 2', fileType: 'image', status: 'verified', expiresIn: '3 ans' },
    { id: 'D5', name: 'Visa Schengen',      fileType: 'image', status: 'verified', expiresIn: '1 an' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
      {docs.map(d => <IDWDocCard key={d.id} d={d} f={f} t={t} conf={conf}/>)}
    </div>
  );
}

function IDWDocCard({ d, f, t, conf }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform .12s, border-color .12s' }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', filter: conf ? 'blur(8px)' : 'none' }}>
        {d.fileType === 'image' ? (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/></svg>
        ) : (
          <div style={{ width: 44, height: 56, background: '#fff', borderRadius: 5, padding: 7, color: idnTokens.green, fontSize: 11, fontWeight: 700 }}>PDF</div>
        )}
        {d.side && (
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', letterSpacing: 0.5 }}>{d.side === 'front' ? 'RECTO' : 'VERSO'}</div>
        )}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, background: idnTokens.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(DocIcons.shield, { width: 12, height: 12 })}
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 12, color: t.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, letterSpacing: 0.5 }}>VÉRIFIÉ</span>
          {d.expiresIn && <span style={{ fontSize: 10, color: t.muted }}>Expire {d.expiresIn}</span>}
        </div>
      </div>
    </div>
  );
}

function IDWFolderEmpty({ t }) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center', border: `1.5px dashed ${t.border}`, borderRadius: 16, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft, opacity: 0.5 }}>
        {React.cloneElement(DocIcons.folderO, { width: 64, height: 64 })}
      </div>
      <div style={{ fontSize: 16, color: t.ink2, fontWeight: 600, marginTop: 16 }}>Aucun document dans ce dossier</div>
      <div style={{ fontSize: 13, color: t.muted, marginTop: 6, lineHeight: 1.5, maxWidth: 440, margin: '6px auto 0' }}>Glissez vos fichiers ici ou cliquez sur Ajouter. L'IA détectera automatiquement le type et rangera vos documents.</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
        <IdnButton t={t} variant="ghost" leadIcon={DocIcons.camera}>Prendre une photo</IdnButton>
        <IdnButton t={t} variant="primary" leadIcon={IdnIcons.plus}>Ajouter un document</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Preview modal (full doc)
// ─────────────────────────────────────────────────────────────
function IDWModalPreview({ t }) {
  return (
    <div style={{ position: 'absolute', inset: 60, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 10 }}>
      <div style={{ width: '100%', maxWidth: 720, background: t.surface, borderRadius: 14, boxShadow: '0 32px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90%' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.ink }}>CNI · Recto</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Identité · 12 mai 2026</div>
          </div>
          <button style={{ width: 32, height: 32, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {/* Preview */}
          <div style={{ aspectRatio: '85/55', borderRadius: 12, background: DOC_FOLDERS[0].grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', position: 'relative', overflow: 'hidden' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/></svg>
            <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', letterSpacing: 0.6 }}>RECTO</div>
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, color: '#fff' }}>
              {React.cloneElement(DocIcons.shield, { width: 12, height: 12, stroke: '#22c55e' })}
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8 }}>DOCUMENT VÉRIFIÉ</span>
            </div>
          </div>
          {/* Métadonnées */}
          <div>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 10 }}>DÉTAILS</div>
            <div style={{ background: t.surface2, borderRadius: 10, padding: 14 }}>
              {[
                { l: 'Type',       v: 'Identité' },
                { l: 'Numéro',     v: 'GA-1234-5678-9012', mono: true },
                { l: 'Délivré le', v: '12/03/2022' },
                { l: 'Expire le',  v: '12/03/2030', accent: true },
                { l: 'Autorité',   v: 'DGDI' },
                { l: 'Taille',     v: '2.4 MB' },
                { l: 'Source',     v: 'Upload' },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
                  <span style={{ fontSize: 12, color: t.muted }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: r.accent ? idnTokens.green : t.ink, fontFamily: r.mono ? idnTokens.mono : idnTokens.font }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <IdnButton t={t} variant="danger" leadIcon={DocIcons.trash}>Supprimer</IdnButton>
          <div style={{ display: 'flex', gap: 8 }}>
            <IdnButton t={t} variant="ghost" leadIcon={IdnIcons.qr}>QR Code</IdnButton>
            <IdnButton t={t} variant="ghost" leadIcon={DocIcons.download}>Télécharger</IdnButton>
            <IdnButton t={t} variant="primary" leadIcon={IdnIcons.link}>Partager</IdnButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add modal
// ─────────────────────────────────────────────────────────────
function IDWModalAdd({ t }) {
  return (
    <div style={{ position: 'absolute', inset: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 10 }}>
      <div style={{ width: '100%', maxWidth: 520, background: t.surface, borderRadius: 14, boxShadow: '0 32px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.ink }}>Ajouter un document</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>L'IA détectera automatiquement le type et le dossier.</div>
          </div>
          <button style={{ width: 32, height: 32, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ padding: 22, overflow: 'auto' }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 10 }}>DOSSIER DE DESTINATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
            {DOC_FOLDERS.map((f, i) => (
              <button key={f.id} style={{ background: i === 0 ? f.grad : t.surface2, border: `1.5px solid ${i === 0 ? 'transparent' : t.borderSoft}`, borderRadius: 10, padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: i === 0 ? '#fff' : t.ink2, boxShadow: i === 0 ? `0 0 0 3px ${t.dark ? '#0F2A18' : idnTokens.greenSoft}` : 'none' }}>
                {React.cloneElement(DocIcons[f.icon], { width: 18, height: 18 })}
                <span style={{ fontSize: 10, fontWeight: 500 }}>{f.label}</span>
              </button>
            ))}
          </div>
          {/* Dropzone */}
          <div style={{ border: `1.5px dashed ${idnTokens.green}`, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, borderRadius: 14, padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: '#fff', color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(14,124,58,0.22)' }}>{DocIcons.upload}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: t.ink, fontWeight: 600 }}>Glissez vos fichiers ici, ou cliquez</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>PDF, JPG, PNG, WebP · max 10 MB</div>
            </div>
          </div>
          <IdnButton t={t} variant="ghost" size="lg" full leadIcon={DocIcons.camera} style={{ marginTop: 10 }}>Prendre une photo</IdnButton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page Demander un document
// ─────────────────────────────────────────────────────────────
function IDWRequest({ t }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
          <div>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>DEMANDE OFFICIELLE</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: t.ink, letterSpacing: -0.5, marginTop: 2 }}>Demander un document</div>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>Faites une demande de document officiel en ligne, livraison à votre point relais idn.ga.</div>
          </div>
        </div>

        {/* Demandes en cours */}
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '8px 0 8px' }}>DEMANDES EN COURS</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
          {[
            { l: 'Acte de Naissance', sub: 'Demandé le 12 mai · Prévu le 17 mai', st: 'En cours',  col: idnTokens.blue,   bg: t.dark ? '#10243A' : idnTokens.blueSoft },
            { l: 'Certificat de Résidence', sub: 'Demandé hier · Prévu demain', st: 'Prêt',  col: '#16a34a', bg: t.dark ? '#0F2A18' : idnTokens.greenSoft },
          ].map((r, i) => (
            <div key={i} style={{ flex: 1, padding: 16, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: r.bg, color: r.col, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(DocIcons.file, { width: 20, height: 20 })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: t.ink, fontWeight: 600 }}>{r.l}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{r.sub}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 9999, background: r.bg, color: r.col }}>{r.st}</span>
            </div>
          ))}
        </div>

        {/* Types disponibles */}
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '0 0 12px' }}>DOCUMENTS DISPONIBLES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {REQUESTABLE_DOCS.map((d, i) => {
            const isSel = i === 0;
            return (
              <div key={d.id} style={{ background: t.surface, border: `2px solid ${isSel ? idnTokens.green : t.border}`, borderRadius: 12, padding: 18, cursor: 'pointer', position: 'relative' }}>
                {isSel && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 9999, background: idnTokens.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg>
                  </div>
                )}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: d.color + '22', color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {React.cloneElement(DocIcons[d.icon], { width: 20, height: 20 })}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{d.label}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 4, lineHeight: 1.4, minHeight: 32 }}>{d.desc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.borderSoft}` }}>
                  <span style={{ fontSize: 11, color: t.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    {d.delai}
                  </span>
                  <span style={{ fontSize: 12, color: t.ink, fontWeight: 700 }}>{d.prix}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <IdnButton t={t} variant="primary" size="lg" leadIcon={DocIcons.send}>Envoyer la demande</IdnButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IDocWeb });
