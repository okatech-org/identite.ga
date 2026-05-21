// IDN Web Desktop — iBoîte (Boîte aux lettres souveraine)
// 2 panneaux : Sidebar (w=288) — compte + sections + dossiers · Main — liste ou A4

function IBoiteWeb({ t, screen = 'courriers', user = DEMO_USERS.citoyen }) {
  // section : courriers / colis / emails
  const section = screen.startsWith('email') ? 'emails' : screen.startsWith('colis') ? 'colis' : 'courriers';
  return (
    <BrowserChrome t={t} url={`https://idn.ga/iboite${section !== 'courriers' ? '/' + section : ''}`} w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden', position: 'relative' }}>
        <CWNav t={t} user={user} screen="home"/>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>
          <IBWSidebar t={t} section={section} screen={screen}/>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {section === 'courriers' && screen === 'courriers' && <IBWCourrierList t={t}/>}
            {section === 'courriers' && screen === 'courrier'  && <IBWCourrierDetail t={t}/>}
            {section === 'colis'     && <IBWColis t={t}/>}
            {section === 'emails'    && screen === 'emails'    && <IBWEmailList t={t}/>}
            {section === 'emails'    && screen === 'email'     && <IBWEmailDetail t={t}/>}
          </div>
        </div>
        {screen === 'compose' && <IBWCompose t={t}/>}
      </div>
    </BrowserChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar (288px) — account · sections · folders · actions
// ─────────────────────────────────────────────────────────────
function IBWSidebar({ t, section, screen }) {
  const acc = ACCOUNTS[0];
  return (
    <div style={{ width: 288, borderRight: `1px solid ${t.border}`, background: t.surface, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Account selector */}
      <div style={{ padding: 14, borderBottom: `1px solid ${t.borderSoft}` }}>
        <button style={{ width: '100%', background: acc.grad, border: 'none', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', textAlign: 'left' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MailIcons[acc.icon]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{acc.label}</div>
            <div style={{ fontSize: 10, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.email}</div>
          </div>
          {MailIcons.chevDn}
        </button>
        {/* Address chip */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: t.surface2, borderRadius: 8 }}>
          <span style={{ color: idnTokens.green }}>{MailIcons.pin}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: t.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.addr.rue}</div>
            <div style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{acc.addr.qr}</div>
          </div>
          <button style={{ width: 24, height: 24, borderRadius: 5, background: 'transparent', border: `1px solid ${t.borderSoft}`, color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MailIcons.copy}</button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: 8 }}>
        {[
          { id: 'courriers', label: 'Courriers',  icon: 'mail',    badge: 2, color: '#3b82f6' },
          { id: 'colis',     label: 'Colis',      icon: 'package', badge: 1, color: '#f59e0b' },
          { id: 'emails',    label: 'eMails',     icon: 'chat',    badge: 2, color: '#10b981' },
        ].map(s => {
          const sel = s.id === section;
          return (
            <a key={s.id} href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 2, background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent', color: sel ? idnTokens.green : t.ink2, textDecoration: 'none', cursor: 'pointer' }}>
              <span style={{ color: sel ? idnTokens.green : s.color }}>{MailIcons[s.icon]}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: sel ? 600 : 500 }}>{s.label}</span>
              {s.badge > 0 && <span style={{ minWidth: 18, padding: '0 6px', height: 18, borderRadius: 9999, background: sel ? idnTokens.green : t.surface2, color: sel ? '#fff' : t.muted, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.badge}</span>}
            </a>
          );
        })}
      </div>

      {/* Folders */}
      <div style={{ padding: '4px 8px 8px', flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '10px 12px 6px' }}>{section === 'colis' ? 'STATUT' : 'DOSSIERS'}</div>
        {section === 'courriers' && [
          { id: 'inbox',   label: 'Réception',  icon: 'inbox', n: 2, sel: true },
          { id: 'sent',    label: 'Expédiés',   icon: 'send' },
          { id: 'pending', label: 'À traiter',  icon: 'clock', n: 1 },
          { id: 'trash',   label: 'Poubelle',   icon: 'trash' },
        ].map(f => <IBWFolderRow key={f.id} f={f} t={t}/>)}
        {section === 'emails' && [
          { id: 'inbox',   label: 'Boîte de réception', icon: 'inbox', n: 2, sel: true },
          { id: 'starred', label: 'Favoris',             icon: 'star',  n: 1 },
          { id: 'sent',    label: 'Envoyés',             icon: 'send' },
          { id: 'trash',   label: 'Corbeille',           icon: 'trash' },
        ].map(f => <IBWFolderRow key={f.id} f={f} t={t}/>)}
        {section === 'colis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
            <div style={{ padding: 12, background: t.dark ? '#3A2D14' : '#FEF3C7', border: `1px solid ${t.dark ? '#5A4626' : '#FDE68A'}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.dark ? '#fcd34d' : '#92400e' }}>
                {MailIcons.package}
                <div><div style={{ fontSize: 18, fontWeight: 700 }}>1</div><div style={{ fontSize: 10, fontWeight: 500 }}>À retirer</div></div>
              </div>
            </div>
            <div style={{ padding: 12, background: t.dark ? '#10243A' : idnTokens.blueSoft, border: `1px solid ${t.dark ? '#1B3F5A' : '#BFD9F7'}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: idnTokens.blue }}>
                {MailIcons.truck}
                <div><div style={{ fontSize: 18, fontWeight: 700 }}>1</div><div style={{ fontSize: 10, fontWeight: 500 }}>En transit</div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New action button */}
      {section !== 'colis' && (
        <div style={{ padding: 12, borderTop: `1px solid ${t.borderSoft}` }}>
          <IdnButton t={t} variant="primary" size="md" full leadIcon={IdnIcons.plus}>{section === 'emails' ? 'Nouveau message' : 'Nouveau courrier'}</IdnButton>
        </div>
      )}

      {/* QR Point Relais (colis only) */}
      {section === 'colis' && (
        <div style={{ margin: 12, padding: 14, background: t.surface2, borderRadius: 10, textAlign: 'center' }}>
          <span style={{ color: t.muted, display: 'flex', justifyContent: 'center' }}>{MailIcons.qr}</span>
          <div style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.ink, fontWeight: 600, marginTop: 6 }}>{ACCOUNTS[0].addr.qr}</div>
          <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>Point Relais</div>
        </div>
      )}
    </div>
  );
}

function IBWFolderRow({ f, t }) {
  return (
    <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 7, marginBottom: 1, background: f.sel ? t.surface2 : 'transparent', color: t.ink2, textDecoration: 'none', cursor: 'pointer' }}>
      <span style={{ color: t.muted }}>{MailIcons[f.icon]}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: f.sel ? 600 : 500, color: f.sel ? t.ink : t.ink2 }}>{f.label}</span>
      {f.n > 0 && <span style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>{f.n}</span>}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// Courriers — liste (cartes papier)
// ─────────────────────────────────────────────────────────────
function IBWCourrierList({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Réception</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{MOCK_LETTERS.length} courrier{MOCK_LETTERS.length > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: '6px 12px', minWidth: 240 }}>
          <span style={{ color: t.muted }}>{IdnIcons.search}</span>
          <input placeholder="Rechercher un courrier…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: t.ink, fontFamily: idnTokens.font }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {MOCK_LETTERS.map(l => (
            <div key={l.id} style={{ position: 'relative', padding: 16, background: '#fffdf7', borderRadius: 10, border: `${l.read ? 1 : 2}px solid ${l.read ? t.border : idnTokens.green}`, boxShadow: '0 2px 6px rgba(0,0,0,0.04)', cursor: 'pointer', overflow: 'hidden', minHeight: 180 }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: '#f0ecde', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}/>
              {l.type === 'action_required' && !l.read && (
                <div style={{ position: 'absolute', top: 12, right: 14, padding: '2px 8px', borderRadius: 4, background: '#B83A3A', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 0.6, zIndex: 1 }}>URGENT</div>
              )}
              <div style={{ fontSize: 11, color: '#7a7560', fontWeight: 600, letterSpacing: 0.2 }}>{l.sender}</div>
              <div style={{ fontSize: 14, color: '#1a1a1a', fontWeight: l.read ? 600 : 700, marginTop: 6, lineHeight: 1.3 }}>{l.subject}</div>
              <div style={{ fontSize: 11, color: '#5a5a5a', marginTop: 8, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.preview}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 10, color: '#7a7560' }}>
                <span>{l.time}</span>
                {!l.read && <span style={{ width: 8, height: 8, borderRadius: 9999, background: idnTokens.green }}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Courrier — Detail A4
// ─────────────────────────────────────────────────────────────
function IBWCourrierDetail({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 28px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ width: 32, height: 32, borderRadius: 8, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Mairie de Libreville</div>
          <div style={{ fontSize: 11, color: t.muted }}>Reçu le 15 mai 2026</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { i: MailIcons.reply,   l: 'Répondre',  primary: true },
            { i: MailIcons.clock,   l: 'À traiter' },
            { i: MailIcons.printer, l: 'Imprimer' },
            { i: MailIcons.archive, l: 'Archiver' },
          ].map((a, i) => (
            <IdnButton key={i} t={t} variant={a.primary ? 'primary' : 'ghost'} size="sm" leadIcon={a.i}>{a.l}</IdnButton>
          ))}
          <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: `1px solid ${t.border}`, color: '#B83A3A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MailIcons.trash}</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* A4 paper */}
        <div style={{ width: 560, background: '#fffdf7', borderRadius: 6, padding: '40px 48px', boxShadow: '0 12px 36px rgba(0,0,0,0.12)', fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a1a1a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, lineHeight: 1.4, color: '#3a3a3a' }}>
            <div><div style={{ fontWeight: 700 }}>Mairie de Libreville</div><div>Service État Civil</div><div>BP 123 Libreville</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>Jean Dupont</div><div>BP 1000</div><div>Libreville, GABON</div></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#3a3a3a', marginTop: 22 }}>Libreville, le 15 mai 2026</div>
          <div style={{ borderBottom: '1px solid #d6d2c4', paddingBottom: 8, marginTop: 22, fontSize: 13, fontWeight: 700 }}>Objet : Complément de dossier requis</div>
          <div style={{ fontSize: 12, lineHeight: 1.8, marginTop: 18, textAlign: 'justify' }}>
            <p style={{ margin: 0 }}>Monsieur,</p>
            <p style={{ marginTop: 10 }}>Suite à l'examen de votre dossier de demande d'acte de naissance, nous avons constaté qu'il manque une pièce justificative.</p>
            <p style={{ marginTop: 10, marginBottom: 0 }}>Nous vous prions de bien vouloir nous transmettre dans les meilleurs délais :</p>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>Une copie de votre pièce d'identité</li>
              <li>Un justificatif de domicile récent</li>
            </ul>
            <p style={{ marginTop: 12 }}>Sans réponse de votre part sous 15 jours, votre dossier sera classé sans suite.</p>
            <p style={{ marginTop: 18, textAlign: 'right', fontStyle: 'italic', color: '#1d3a6a' }}>Le Service de l'État Civil</p>
          </div>
        </div>
        {/* Action required banner */}
        <div style={{ width: 560, background: t.dark ? '#1F1216' : '#FBE5E5', border: `1px solid ${t.dark ? '#3A1E1E' : '#F5C7C7'}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ color: '#B83A3A' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg>
          </span>
          <div>
            <div style={{ fontSize: 13, color: '#B83A3A', fontWeight: 700 }}>Action requise</div>
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 2 }}>Réponse attendue avant le 30 mai 2026. Vous pouvez répondre directement ou télécharger ce courrier pour le traiter hors ligne.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Colis
// ─────────────────────────────────────────────────────────────
function IBWColis({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Mes colis</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{MOCK_PACKAGES.length} colis</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        {MOCK_PACKAGES.map(p => {
          const avail = p.status === 'available';
          return (
            <div key={p.id} style={{ display: 'flex', gap: 14, padding: 16, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: avail ? (t.dark ? '#3A2D14' : '#FEF3C7') : (t.dark ? '#10243A' : idnTokens.blueSoft), color: avail ? '#92400e' : idnTokens.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avail ? MailIcons.package : MailIcons.truck}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: t.ink, fontWeight: 600 }}>{p.description}</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>De : <b style={{ color: t.ink2 }}>{p.sender}</b></div>
                <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>Tracking : {p.tracking}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 9999, background: avail ? '#FEF3C7' : idnTokens.blueSoft, color: avail ? '#92400e' : idnTokens.blue }}>{avail ? 'À retirer' : 'En transit'}</span>
                {p.eta && <span style={{ fontSize: 11, color: t.muted }}>Arrivée {p.eta}</span>}
                {avail && <IdnButton t={t} variant="ghost" size="sm">Détails</IdnButton>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Emails — list
// ─────────────────────────────────────────────────────────────
function IBWEmailList({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Boîte de réception</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{MOCK_EMAILS.length} messages</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: '6px 12px', minWidth: 280 }}>
          <span style={{ color: t.muted }}>{IdnIcons.search}</span>
          <input placeholder="Rechercher dans vos messages…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: t.ink, fontFamily: idnTokens.font }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {MOCK_EMAILS.map((e, i) => (
          <div key={e.id} style={{ display: 'flex', gap: 14, padding: '14px 28px', borderBottom: `1px solid ${t.borderSoft}`, background: e.read ? 'transparent' : (t.dark ? 'rgba(14,124,58,0.06)' : 'rgba(14,124,58,0.04)'), cursor: 'pointer', alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: e.starred ? idnTokens.yellow : t.mutedSoft, padding: 0 }}>{e.starred ? MailIcons.star : MailIcons.starO}</button>
            <div style={{ width: 36, height: 36, borderRadius: 9999, background: e.sender.type === 'admin' ? 'linear-gradient(135deg,#3b82f6,#4338ca)' : 'linear-gradient(135deg,#10b981,#0d9488)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{e.sender.type === 'admin' ? MailIcons.building : MailIcons.user}</div>
            <div style={{ width: 160, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: e.read ? 500 : 700, color: e.read ? t.ink2 : t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.sender.name}</div>
              <div style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.sender.email}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: e.read ? t.muted : t.ink, fontWeight: e.read ? 500 : 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subject}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.preview}</div>
            </div>
            {e.attach && <span style={{ color: t.muted }}>{MailIcons.paper}</span>}
            <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, minWidth: 60, textAlign: 'right' }}>{e.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Email — detail
// ─────────────────────────────────────────────────────────────
function IBWEmailDetail({ t }) {
  const e = MOCK_EMAILS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 28px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ width: 32, height: 32, borderRadius: 8, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, fontSize: 13, color: t.muted }}>Réception · 1 sur {MOCK_EMAILS.length}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <IdnButton t={t} variant="primary" size="sm" leadIcon={MailIcons.reply}>Répondre</IdnButton>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={MailIcons.forward}>Transférer</IdnButton>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={MailIcons.archive}>Archiver</IdnButton>
          <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: `1px solid ${t.border}`, color: '#B83A3A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MailIcons.trash}</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4, lineHeight: 1.3 }}>{e.subject}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 18, paddingBottom: 18, borderBottom: `1px solid ${t.borderSoft}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 9999, background: 'linear-gradient(135deg,#3b82f6,#4338ca)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MailIcons.building}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{e.sender.name}</div>
              <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono }}>{e.sender.email}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>À : jean.dupont@idn.ga · 15 mai 2026, 09:32</div>
            </div>
            <IdnButton t={t} variant="ghost" size="sm" leadIcon={MailIcons.star}>Favori</IdnButton>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: t.ink2, marginTop: 22 }}>
            <p style={{ margin: 0 }}>Bonjour Monsieur Dupont,</p>
            <p style={{ marginTop: 12 }}>Votre demande a été enregistrée sous le numéro <b style={{ fontFamily: idnTokens.mono, color: t.ink }}>#2024-12345</b>. Vous recevrez une réponse définitive sous 3 à 5 jours ouvrés.</p>
            <p style={{ marginTop: 12 }}>Vous pouvez suivre l'avancement de votre dossier depuis votre espace personnel sur idn.ga.</p>
            <p style={{ marginTop: 18, color: t.muted }}>Cordialement,<br/>L'équipe État Civil de Libreville</p>
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 10 }}>PIÈCE JOINTE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, maxWidth: 380 }}>
              <div style={{ width: 40, height: 50, borderRadius: 4, background: '#fff', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: idnTokens.blue, fontSize: 10, fontWeight: 700 }}>PDF</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>Confirmation_2024-12345.pdf</div>
                <div style={{ fontSize: 11, color: t.muted }}>248 KB</div>
              </div>
              <IdnButton t={t} variant="ghost" size="sm">Télécharger</IdnButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Compose — modal
// ─────────────────────────────────────────────────────────────
function IBWCompose({ t }) {
  return (
    <div style={{ position: 'absolute', inset: 60, top: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 10 }}>
      <div style={{ width: 600, background: t.surface, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.32)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Nouveau message</div>
          <button style={{ background: 'transparent', border: 'none', color: t.muted, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ padding: '0 18px' }}>
          {['De', 'À', 'Objet'].map((lbl, i) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${t.borderSoft}` : 'none' }}>
              <span style={{ width: 40, fontSize: 12, color: t.muted, fontWeight: 500 }}>{lbl}</span>
              <input placeholder={lbl === 'De' ? '' : lbl === 'À' ? 'destinataire@…' : 'Objet du message'} defaultValue={lbl === 'De' ? 'jean.dupont@idn.ga' : ''} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: t.ink, fontFamily: idnTokens.font, fontWeight: lbl === 'De' ? 500 : (lbl === 'Objet' ? 600 : 500) }}/>
            </div>
          ))}
        </div>
        <textarea placeholder="Votre message…" rows="10" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: t.ink, fontFamily: idnTokens.font, lineHeight: 1.6, padding: '14px 18px', resize: 'none', minHeight: 200 }}/>
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={MailIcons.paper}>Joindre</IdnButton>
          <div style={{ flex: 1 }}/>
          <IdnButton t={t} variant="ghost" size="sm">Brouillon</IdnButton>
          <IdnButton t={t} variant="primary" size="sm" leadIcon={MailIcons.send}>Envoyer</IdnButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IBoiteWeb });
