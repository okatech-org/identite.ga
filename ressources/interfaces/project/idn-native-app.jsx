// IDN Mobile App — native citizen experience
// Full app: launcher → onboarding → auth → home (tabs) → services → docs → activity → profile/settings
// Not responsive web — true mobile patterns (bottom tabs, swipeable carousel, sheets, native modals)

// ─────────────────────────────────────────────────────────────
// Native chrome (lighter, larger touch targets, sheet patterns)
// ─────────────────────────────────────────────────────────────
function NPhone({ t, children, statusInk }) {
  return (
    <div style={{
      width: 360, height: 740, borderRadius: 44,
      background: t.dark ? '#000' : '#0E110D',
      padding: 9,
      boxShadow: t.dark ? '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px #1c1f1a' : '0 30px 60px rgba(40,50,30,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
      flexShrink: 0,
    }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: t.bg, position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: idnTokens.font }}>
        <NStatus t={t} ink={statusInk}/>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 120, height: 4, borderRadius: 9999, background: statusInk === '#fff' ? '#fff' : (t.dark ? '#fff' : '#000'), opacity: 0.7 }}/>
      </div>
    </div>
  );
}

function NStatus({ t, ink }) {
  const c = ink || t.ink;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 6px', fontSize: 15, fontWeight: 600, color: c }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill={c}><rect x="0" y="7" width="2.5" height="4" rx=".6"/><rect x="4" y="5" width="2.5" height="6" rx=".6"/><rect x="8" y="3" width="2.5" height="8" rx=".6"/><rect x="12" y="0" width="2.5" height="11" rx=".6"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x=".5" y=".5" width="19" height="10" rx="2.5" stroke={c} fill="none"/><rect x="2" y="2" width="13" height="7" rx="1" fill={c}/></svg>
      </div>
    </div>
  );
}

// Large-title header (iOS-style)
function NLargeHeader({ t, title, sub, right, scrolled, onBack }) {
  return (
    <div style={{ padding: '6px 22px 14px', borderBottom: scrolled ? `1px solid ${t.borderSoft}` : 'none', background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36 }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: idnTokens.green, fontSize: 15, cursor: 'pointer', padding: 0, marginLeft: -4, display: 'flex', alignItems: 'center', gap: 2 }}>{IdnIcons.arrowL}<span style={{ fontWeight: 500 }}>Retour</span></button>}
        <div style={{ flex: 1 }}/>
        {right}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: t.ink, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: t.muted, marginTop: 6, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

// Modal sheet header (compact title bar)
function NSheetHeader({ t, title, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 12px', borderBottom: `1px solid ${t.borderSoft}`, minHeight: 44 }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: idnTokens.green, cursor: 'pointer', padding: 4, display: 'flex' }}>{IdnIcons.arrowL}</button>
      ) : <div style={{ width: 8 }}/>}
      <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: t.ink, textAlign: 'center' }}>{title}</div>
      <div style={{ minWidth: 28, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function NTabBar({ t, active, onChange }) {
  const tabs = [
    { id: 'home',     label: 'Accueil',   icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg> },
    { id: 'services', label: 'Services',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { id: 'activity', label: 'Activité',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13h4l2-5 3 11 3-7 2 4h4"/></svg> },
    { id: 'profile',  label: 'Profil',    icon: IdnIcons.user },
  ];
  return (
    <div style={{ paddingBottom: 22, borderTop: `1px solid ${t.borderSoft}`, background: t.surface, display: 'flex' }}>
      {tabs.map(tb => {
        const sel = tb.id === active;
        return (
          <button key={tb.id} onClick={() => onChange && onChange(tb.id)} style={{
            flex: 1, padding: '10px 4px 4px', background: 'none', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: sel ? idnTokens.green : t.muted, cursor: 'pointer',
          }}>
            {tb.icon}
            <span style={{ fontSize: 10.5, fontWeight: sel ? 600 : 500 }}>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. LAUNCHER (splash + biometric prompt)
// ─────────────────────────────────────────────────────────────
function ScrLauncher({ t }) {
  return (
    <div style={{ flex: 1, background: 'linear-gradient(170deg,#0E7C3A 0%,#0A5C2C 60%,#08401F 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '60px 26px 30px', color: '#fff' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ width: 96, height: 96, borderRadius: 26, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.22)' }}>
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none"><rect x="2" y="2" width="28" height="28" rx="7" fill="#fff"/><path d="M11 9v14M16 13v10M21 17v6" stroke="#0E7C3A" strokeWidth="2.6" strokeLinecap="round"/></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: 600, opacity: 0.78 }}>RÉPUBLIQUE GABONAISE</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, letterSpacing: -0.4 }}>Identité Numérique</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', width: '100%' }}>
        <button style={{ width: 76, height: 76, borderRadius: 9999, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5 11c0-3 3-7 7-7s7 4 7 7"/><path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4v2"/><path d="M12 15v6"/><path d="M5 17c0 3.3 3.1 4 7 4M19 14v3"/></svg>
        </button>
        <div style={{ fontSize: 13, opacity: 0.86, textAlign: 'center' }}>Touchez pour vous identifier avec Face ID</div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, opacity: 0.75, marginTop: 8 }}>
          <span style={{ cursor: 'pointer' }}>Utiliser le PIN</span>
          <IdnFlagBars width={28} height={2.5}/>
          <span style={{ cursor: 'pointer' }}>Changer de compte</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. ONBOARDING CAROUSEL (swipeable, 4 slides)
// ─────────────────────────────────────────────────────────────
function ScrOnboarding({ t, slide = 0 }) {
  const slides = [
    { tag: 'BIENVENUE', title: 'Un compte unique pour tous les services de l\'État.', desc: 'Authentifiez-vous une fois, accédez à 23 démarches administratives gabonaises.', art: <ArtIdMark t={t}/> },
    { tag: 'SOUVERAIN', title: 'Vos données restent au Gabon.', desc: 'Hébergement national, chiffrement de bout en bout, aucun transfert hors frontière.', art: <ArtSovereign t={t}/> },
    { tag: 'CONSENTEMENT', title: 'Vous choisissez ce que vous partagez.', desc: 'Chaque service obtient votre accord pour les données strictement nécessaires.', art: <ArtConsent t={t}/> },
    { tag: 'INCLUSIF', title: 'Disponible partout au Gabon.', desc: 'App mobile, web, USSD *242# pour les zones non connectées, antennes dans les 9 provinces.', art: <ArtCoverage t={t}/> },
  ];
  const s = slides[slide];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 22px' }}>
        <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Passer</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', gap: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', height: 200, alignItems: 'center' }}>{s.art}</div>
        <div>
          <div style={{ fontSize: 11, color: idnTokens.green, letterSpacing: 1.4, fontWeight: 600, textAlign: 'center' }}>{s.tag}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: -0.4, lineHeight: 1.18, marginTop: 10, textAlign: 'center' }}>{s.title}</div>
          <div style={{ fontSize: 14, color: t.muted, lineHeight: 1.55, marginTop: 12, textAlign: 'center' }}>{s.desc}</div>
        </div>
      </div>
      <div style={{ padding: '0 26px 24px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
          {slides.map((_, i) => <div key={i} style={{ width: i === slide ? 18 : 6, height: 6, borderRadius: 9999, background: i === slide ? idnTokens.green : t.border, transition: 'all .25s' }}/>)}
        </div>
        <IdnButton t={t} variant="primary" size="lg" full>{slide < slides.length - 1 ? 'Continuer' : 'Commencer'}</IdnButton>
      </div>
    </div>
  );
}
function ArtIdMark({ t }) {
  return (
    <div style={{ position: 'relative', width: 180, height: 200 }}>
      <div style={{ position: 'absolute', inset: 0, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, borderRadius: 24 }}/>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IdnMark size={84} t={t}/>
      </div>
      <div style={{ position: 'absolute', top: 14, left: 14, fontSize: 9, fontFamily: idnTokens.mono, color: idnTokens.green, letterSpacing: 1 }}>GA-7K3J-9Q2L</div>
      <div style={{ position: 'absolute', bottom: 14, right: 14 }}><IdnFlagBars width={32} height={3}/></div>
    </div>
  );
}
function ArtSovereign({ t }) {
  return (
    <div style={{ width: 180, height: 180, position: 'relative' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
        <path d="M100 20 L160 50 L160 110 Q160 160 100 180 Q40 160 40 110 L40 50 Z" fill={t.dark ? '#0F2A18' : idnTokens.greenSoft} stroke={idnTokens.green} strokeWidth="2"/>
        <path d="M80 100l15 15 30-35" stroke={idnTokens.green} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <text x="100" y="155" fontSize="9" fill={idnTokens.green} textAnchor="middle" fontFamily="IBM Plex Mono" letterSpacing="1.5">GABON · 100%</text>
      </svg>
    </div>
  );
}
function ArtConsent({ t }) {
  return (
    <div style={{ width: 200, height: 180, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      {[
        { l: 'Prénom · Nom', on: true },
        { l: 'Date de naissance', on: true },
        { l: 'Numéro fiscal', on: false },
        { l: 'Adresse', on: false },
      ].map((r, i) => (
        <div key={i} style={{ width: 200, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10 }}>
          <span style={{ fontSize: 12, color: t.ink, flex: 1, fontWeight: 500 }}>{r.l}</span>
          <div style={{ width: 30, height: 18, borderRadius: 9999, background: r.on ? idnTokens.green : t.border, padding: 2 }}>
            <div style={{ width: 14, height: 14, borderRadius: 9999, background: '#fff', transform: r.on ? 'translateX(12px)' : 'translateX(0)' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}
function ArtCoverage({ t }) {
  return (
    <div style={{ width: 200, height: 180, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 180" style={{ width: '100%', height: '100%' }}>
        <path d="M55 35 Q80 25 115 30 Q150 35 165 60 Q170 85 158 105 Q150 130 130 145 Q105 155 85 150 Q60 145 45 125 Q35 100 40 75 Q45 50 55 35 Z" fill={t.dark ? '#0F2A18' : idnTokens.greenSoft} stroke={idnTokens.green} strokeWidth="1.5"/>
        {[[90,65],[130,55],[110,90],[75,110],[145,100],[100,130],[60,80],[125,130],[90,45]].map((p, i) => (
          <g key={i}><circle cx={p[0]} cy={p[1]} r="8" fill={idnTokens.green} opacity="0.18"/><circle cx={p[0]} cy={p[1]} r="3" fill={idnTokens.green}/></g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. AUTH HUB (post-onboarding)
// ─────────────────────────────────────────────────────────────
function ScrAuthHub({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 26px 26px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <IdnMark size={56} t={t}/>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.4, fontWeight: 600 }}>RÉPUBLIQUE GABONAISE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Identité Numérique</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <IdnButton t={t} variant="primary" size="lg" full leadIcon={IdnIcons.userPlus}>Créer un compte IDN</IdnButton>
          <IdnButton t={t} variant="ghost" size="lg" full leadIcon={IdnIcons.login}>J'ai déjà un compte</IdnButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: t.border }}/>
          <span style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 600 }}>AUTRE</span>
          <div style={{ flex: 1, height: 1, background: t.border }}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NMiniRow t={t} icon={IdnIcons.qr} title="Scanner un QR" sub="Connexion depuis un autre appareil"/>
          <NMiniRow t={t} icon={<span style={{ fontFamily: idnTokens.mono, fontSize: 13 }}>#</span>} title="Continuer en USSD" sub="Composez *242# sans internet"/>
        </div>
      </div>
      <div style={{ fontSize: 11, color: t.mutedSoft, textAlign: 'center', lineHeight: 1.5 }}>
        En continuant, vous acceptez les <span style={{ color: idnTokens.green, fontWeight: 500 }}>conditions d'utilisation</span> et la <span style={{ color: idnTokens.green, fontWeight: 500 }}>politique de confidentialité</span> IDN.
      </div>
    </div>
  );
}
function NMiniRow({ t, icon, title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: t.surface2, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {right || <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. LOGIN (email + PIN, with biometric)
// ─────────────────────────────────────────────────────────────
function ScrLogin({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 26px 28px' }}>
      <button style={{ background: 'none', border: 'none', color: idnTokens.green, alignSelf: 'flex-start', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>{IdnIcons.arrowL}<span style={{ fontWeight: 500 }}>Retour</span></button>
      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: t.ink, letterSpacing: -0.5 }}>Bonjour,</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: t.ink, letterSpacing: -0.5 }}>Aïssatou</div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 8 }}>Connectez-vous pour continuer.</div>
      </div>
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <IdnInput t={t} label="Email" value="aissatou.mboumba@example.ga" onChange={()=>{}} leadIcon={IdnIcons.mail}/>
        <IdnInput t={t} label="Mot de passe" value="••••••••" onChange={()=>{}} type="password" leadIcon={IdnIcons.lock}/>
        <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 12, cursor: 'pointer', alignSelf: 'flex-end' }}>Mot de passe oublié ?</button>
      </div>
      <div style={{ flex: 1 }}/>
      <IdnButton t={t} variant="primary" size="lg" full>Se connecter</IdnButton>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button style={{ flex: 1, padding: '14px 0', border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.ink2, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 11c0-3 3-7 7-7s7 4 7 7"/><path d="M9 13c.5-1.5 2-2 3-2s2.5.5 3 2v2"/><path d="M12 15v5M5 16c0 3 3 4 7 4"/></svg>
          Face ID
        </button>
        <button style={{ flex: 1, padding: '14px 0', border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.ink2, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          {IdnIcons.qr} QR
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. SIGNUP STEPS (mobile-native, single-purpose pages)
// ─────────────────────────────────────────────────────────────
function NStepShell({ t, step, total, title, sub, children, primary = 'Continuer', secondary }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: 'none', border: 'none', color: idnTokens.green, cursor: 'pointer', padding: 4, marginLeft: -4 }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, display: 'flex', gap: 3 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? idnTokens.green : t.border }}/>
          ))}
        </div>
        <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, fontWeight: 600 }}>{step}/{total}</div>
      </div>
      <div style={{ flex: 1, padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: -0.4, lineHeight: 1.2 }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: t.muted, marginTop: 8, lineHeight: 1.55 }}>{sub}</div>}
        </div>
        {children}
      </div>
      <div style={{ padding: '14px 24px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <IdnButton t={t} variant="primary" size="lg" full>{primary}</IdnButton>
        {secondary && <IdnButton t={t} variant="quiet" size="md" full>{secondary}</IdnButton>}
      </div>
    </div>
  );
}

function ScrSignupProfil({ t }) {
  return (
    <NStepShell t={t} step={1} total={5} title="Quel est votre profil ?" sub="Détermine les pièces demandées et les services accessibles.">
      {PROFILS.map((p, i) => {
        const sel = i === 0;
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: 16,
            border: `1.5px solid ${sel ? idnTokens.green : t.border}`,
            background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
            borderRadius: 14,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: sel ? idnTokens.green : t.surface2, color: sel ? '#fff' : t.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{IdnIcons.user}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{p.label}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{p.sub}</div>
            </div>
            {p.loa && <LoABadge level={p.loa} t={t} compact/>}
          </div>
        );
      })}
    </NStepShell>
  );
}

function ScrSignupEmail({ t }) {
  return (
    <NStepShell t={t} step={2} total={5} title="Vos identifiants" sub="Vous pourrez ajouter la 2FA plus tard." primary="Recevoir le code">
      <IdnInput t={t} label="Adresse email" value="aissatou.mboumba@example.ga" onChange={()=>{}} type="email" leadIcon={IdnIcons.mail}/>
      <IdnInput t={t} label="Mot de passe" value="" placeholder="Minimum 8 caractères" onChange={()=>{}} type="password" leadIcon={IdnIcons.lock}/>
      <div style={{ display: 'flex', gap: 4 }}>
        {[idnTokens.green, idnTokens.green, idnTokens.yellow, t.border].map((c, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: c }}/>)}
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginTop: -8 }}>Force du mot de passe : <span style={{ color: idnTokens.yellow, fontWeight: 600 }}>moyenne</span></div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: t.ink2 }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: idnTokens.green }}/>
        <span>J'accepte les <u style={{ color: idnTokens.green }}>CGU</u> et la <u style={{ color: idnTokens.green }}>politique de confidentialité</u>.</span>
      </label>
    </NStepShell>
  );
}

function ScrSignupOtp({ t }) {
  const code = ['4','7','2','9','',''];
  return (
    <NStepShell t={t} step={3} total={5} title="Vérifiez votre email" sub={<>Code à 6 chiffres envoyé à <b style={{ color: t.ink }}>aissatou.mboumba@example.ga</b></>} primary="Vérifier" secondary="Modifier l'email">
      <div style={{ display: 'flex', gap: 8 }}>
        {code.map((c, i) => (
          <div key={i} style={{ flex: 1, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, fontFamily: idnTokens.mono, color: t.ink, background: t.surface, border: `1.5px solid ${c ? idnTokens.green : t.border}`, borderRadius: 12 }}>{c}</div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted }}>
        <span>Expire dans 0:43</span>
        <span style={{ color: idnTokens.green, fontWeight: 500 }}>Renvoyer le code</span>
      </div>
      <div style={{ marginTop: 'auto' }}/>
      <div style={{ background: t.dark ? '#10243A' : idnTokens.blueSoft, padding: 14, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: idnTokens.blue }}>{IdnIcons.mail}</span>
        <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>Pas reçu ? Vérifiez les courriers indésirables. Le code arrive habituellement en moins de 30 secondes.</div>
      </div>
    </NStepShell>
  );
}

function ScrSignupPivot({ t }) {
  return (
    <NStepShell t={t} step={4} total={5} title="Vos informations" sub="Identité pivot — telle qu'elle figure sur vos documents officiels.">
      <IdnInput t={t} label="Prénom" value="Aïssatou" onChange={()=>{}}/>
      <IdnInput t={t} label="Nom" value="Mboumba" onChange={()=>{}}/>
      <IdnInput t={t} label="Date de naissance" value="14/03/1992" onChange={()=>{}}/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <IdnInput t={t} label="Genre" value="Féminin" onChange={()=>{}}/>
        <IdnInput t={t} label="Nationalité" value="Gabonaise" onChange={()=>{}}/>
      </div>
      <IdnInput t={t} label="Lieu de naissance" value="Libreville" onChange={()=>{}}/>
    </NStepShell>
  );
}

function ScrSignupPin({ t }) {
  const [filled] = React.useState(4);
  return (
    <NStepShell t={t} step={5} total={5} title="Créez votre code PIN" sub="6 chiffres pour les actions sensibles : signature, validation, accès rapide." primary="Confirmer">
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '14px 0' }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: 9999, background: i < filled ? idnTokens.green : 'transparent', border: `2px solid ${i < filled ? idnTokens.green : t.border}` }}/>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 8 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
          <button key={i} disabled={k === ''} style={{
            height: 56, fontSize: 22, fontWeight: 500, color: t.ink, background: k === '' ? 'transparent' : t.surface,
            border: k === '' ? 'none' : `1px solid ${t.borderSoft}`, borderRadius: 14, cursor: k === '' ? 'default' : 'pointer',
            fontFamily: idnTokens.mono,
          }}>{k}</button>
        ))}
      </div>
    </NStepShell>
  );
}

function ScrSignupBio({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 26px 26px', textAlign: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ width: 110, height: 110, borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={idnTokens.green} strokeWidth="1.4" strokeLinecap="round"><path d="M5 11c0-3 3-7 7-7s7 4 7 7"/><path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4v2"/><path d="M12 15v6"/><path d="M5 17c0 3.3 3.1 4 7 4M19 14v3"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Face ID pour vous connecter ?</div>
          <div style={{ fontSize: 14, color: t.muted, marginTop: 10, lineHeight: 1.55, maxWidth: 280, margin: '10px auto 0' }}>Déverrouillez l'app et signez vos démarches plus rapidement. Vous pouvez toujours utiliser votre PIN.</div>
        </div>
      </div>
      <IdnButton t={t} variant="primary" size="lg" full>Activer Face ID</IdnButton>
      <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, padding: 16, cursor: 'pointer' }}>Plus tard</button>
    </div>
  );
}

function ScrSignupDone({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 26px 26px', textAlign: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ width: 96, height: 96, borderRadius: 9999, background: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Compte créé !</div>
          <div style={{ fontSize: 14, color: t.muted, marginTop: 10, lineHeight: 1.55, maxWidth: 280, margin: '10px auto 0' }}>Votre identité numérique est active. Vérifiez votre identité pour débloquer plus de services.</div>
        </div>
        <div style={{ padding: 16, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, fontFamily: idnTokens.mono, fontSize: 12, color: t.ink2, width: '100%', maxWidth: 280 }}>
          <div style={{ color: t.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: 600 }}>VOTRE ID IDN</div>
          <div style={{ fontSize: 16, color: t.ink, fontWeight: 600, marginTop: 6 }}>GA-7K3J-9Q2L</div>
          <div style={{ marginTop: 10 }}><LoABadge level={1} t={t} compact/></div>
        </div>
      </div>
      <IdnButton t={t} variant="primary" size="lg" full>Vérifier mon identité</IdnButton>
      <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, padding: 16, cursor: 'pointer' }}>Continuer vers l'accueil</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. HOME TAB — refonte autour des modules + activité + recos
// ─────────────────────────────────────────────────────────────
function ScrHome({ t, user = DEMO_USERS.citoyen }) {
  // Couleurs des modules (cohérentes avec les pages dédiées)
  const modules = [
    { id: 'icarte',  label: 'iCarte',     sub: '6 cartes',          badge: null,         color: idnTokens.green,
      bg: t.dark ? '#0F2A18' : idnTokens.greenSoft,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14l2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M16 14h4v-4h-4a2 2 0 0 0 0 4z"/></svg> },
    { id: 'iboite',  label: 'iBoîte',     sub: 'Courriers · emails',badge: '2 nouveaux', color: '#3b82f6',
      bg: t.dark ? '#10243A' : idnTokens.blueSoft,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg> },
    { id: 'idoc',    label: 'iDocument',  sub: '17 documents',       badge: null,         color: '#a855f7',
      bg: t.dark ? '#2A1542' : '#F3E8FF',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg> },
    { id: 'icv',     label: 'iCV',         sub: 'CV professionnel', badge: 'Nouveau',  color: '#EC4899',
      bg: t.dark ? '#2A1426' : '#FCE7F3',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><circle cx="12" cy="11" r="2.2"/><path d="M8.5 17c.7-1.6 2-2.3 3.5-2.3s2.8.7 3.5 2.3"/></svg> },
  ];

  // À faire : mix de courriers urgents + démarches en cours
  const todos = [
    { kind: 'mail',   label: 'Mairie de Libreville',  sub: 'Complément de dossier · 15 j',
      tagLabel: 'Urgent',  tagColor: '#B83A3A',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg> },
    { kind: 'demar',  label: 'e-Visa Tourisme',       sub: 'Documents à fournir',
      tagLabel: '60 %',    tagColor: idnTokens.blue, pct: 60,
      icon: IdnIcons.doc },
    { kind: 'demar',  label: 'Renouvellement passeport', sub: 'Affaires étrangères',
      tagLabel: '30 %',    tagColor: idnTokens.yellow, pct: 30,
      icon: IdnIcons.doc },
  ];

  // Activité récente (lectures, signatures, partages)
  const activity = [
    { t: 'Aujourd\'hui 14:32', e: 'Authentification', a: 'sur Bourses Étudiantes', icon: 'login', col: idnTokens.green },
    { t: 'Aujourd\'hui 09:14', e: 'Vérification KYC', a: 'validée — Niveau 3',     icon: 'shield', col: idnTokens.green },
    { t: 'Hier 18:42',         e: 'Connexion',        a: 'Firefox Linux · Paris',  icon: 'shield', col: idnTokens.yellow, warn: true },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '6px 22px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 9999, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.prenom[0]}{user.nom[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 0.6 }}>Bonjour,</div>
          <div style={{ fontSize: 15, color: t.ink, fontWeight: 600 }}>{user.prenom} {user.nom}</div>
        </div>
        <button style={{ position: 'relative', width: 40, height: 40, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {IdnIcons.bell}
          <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 9999, background: '#B83A3A' }}/>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 18px' }}>
        {/* ID card — conservée */}
        <div style={{ background: 'linear-gradient(135deg,#0E7C3A 0%,#0A5C2C 100%)', borderRadius: 18, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}/>
          <div style={{ position: 'absolute', right: 12, bottom: 12 }}><IdnFlagBars width={36} height={3}/></div>
          <div style={{ fontSize: 10, letterSpacing: 1.4, fontWeight: 600, opacity: 0.78 }}>IDENTITÉ NUMÉRIQUE</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{user.prenom} {user.nom}</div>
          <div style={{ fontSize: 11, opacity: 0.82, marginTop: 2 }}>{user.profil}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.18)', letterSpacing: 0.4 }}>NIVEAU {user.loa} {['','· Faible','· Substantiel','· Élevé'][user.loa]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div style={{ fontFamily: idnTokens.mono, fontSize: 11, opacity: 0.86, letterSpacing: 1 }}>GA-7K3J-9Q2L</div>
            <button style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.16)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>{IdnIcons.qr}<span>Montrer le QR</span></button>
          </div>
        </div>

        {/* Quick actions — conservées */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 18 }}>
          {[
            { l: 'Scanner', i: IdnIcons.qr },
            { l: 'Partager', i: IdnIcons.link },
            { l: 'Signer', i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 21c5-1 8-3 13-8l3-3-4-4-3 3c-5 5-7 8-8 13z"/><path d="M14 6l4 4"/></svg> },
            { l: 'Aide', i: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"/></svg> },
          ].map((q, i) => (
            <button key={i} style={{ padding: '14px 4px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', color: t.ink }}>
              <span style={{ color: idnTokens.green }}>{q.i}</span>
              <span style={{ fontSize: 11, fontWeight: 500 }}>{q.l}</span>
            </button>
          ))}
        </div>

        {/* LoA upsell */}
        {user.loa < 3 && (
          <div style={{ marginTop: 18, background: t.dark ? '#1F2316' : idnTokens.yellowSoft, border: `1px solid ${t.dark ? '#3A3F1F' : '#E8D67E'}`, borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: idnTokens.yellow, color: '#5a4a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{IdnIcons.shield}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Passez au Niveau {user.loa + 1}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>5 min · débloquez plus de services</div>
            </div>
            <span style={{ color: t.ink2 }}>{IdnIcons.arrow}</span>
          </div>
        )}

        {/* Mes services — grid 2x2 des modules */}
        <SectionH t={t} title="Mes services" right="Voir tout"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {modules.map(m => (
            <button key={m.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{m.label}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{m.sub}</div>
              </div>
              {m.badge && (
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '2px 8px', borderRadius: 9999, background: m.color, color: '#fff', fontSize: 10, fontWeight: 700 }}>{m.badge}</div>
              )}
            </button>
          ))}
        </div>

        {/* À traiter — mix urgent letters + démarches en cours */}
        <SectionH t={t} title="À traiter" right={`${todos.length} en attente`}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todos.map((it, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: it.kind === 'mail' ? '#B83A3A' : t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{it.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 9999, background: it.tagColor === '#B83A3A' ? '#FEE2E2' : t.surface2, color: it.tagColor, letterSpacing: 0.4 }}>{it.tagLabel}</span>
              </div>
              {typeof it.pct === 'number' && (
                <div style={{ marginTop: 10, height: 3, background: t.surface2, borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${it.pct}%`, height: '100%', background: it.tagColor }}/>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Activité récente */}
        <SectionH t={t} title="Activité récente" right="Tout voir"/>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '4px 14px' }}>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i === activity.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 9999, background: t.surface2, color: a.col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{IdnIcons[a.icon]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>
                  <b style={{ color: t.ink }}>{a.e}</b> <span style={{ color: t.muted, fontWeight: 400 }}>{a.a}</span>
                </div>
                <div style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>{a.t}</div>
              </div>
              {a.warn && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: t.dark ? '#3A2D14' : idnTokens.yellowSoft, color: '#9b6a00', letterSpacing: 0.4 }}>INHAB.</span>}
            </div>
          ))}
        </div>

        {/* Pour vous — services recommandés */}
        <SectionH t={t} title="Pour vous"/>
        <div style={{ display: 'flex', gap: 10, overflow: 'auto', margin: '0 -22px', padding: '0 22px 4px' }}>
          {[
            { l: 'Acte de naissance', sub: 'État civil',          col: '#E8DCC4', tag: 'Populaire' },
            { l: 'Quitus fiscal',     sub: 'DGI · sans rdv',       col: '#C4DCE8' },
            { l: 'Santé.ga',          sub: 'e-santé · CNAMGS',     col: '#C4E8D2', tag: 'New' },
            { l: 'Bourses étudiantes',sub: 'Enseign. supérieur',   col: '#E8C4DC' },
          ].map((c, i) => (
            <div key={i} style={{ minWidth: 160, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 12, flexShrink: 0, position: 'relative' }}>
              {c.tag && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: idnTokens.green, color: '#fff', letterSpacing: 0.4 }}>{c.tag}</span>}
              <div style={{ height: 70, borderRadius: 10, background: c.col, marginBottom: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 10, color: '#3a2c10', fontSize: 28, fontWeight: 700, fontFamily: idnTokens.mono, lineHeight: 1 }}>{c.l[0]}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{c.l}</div>
              <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Section header helper
function SectionH({ t, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, letterSpacing: -0.1 }}>{title}</div>
      {right && <span style={{ fontSize: 11, color: typeof right === 'string' && right.match(/^\d/) ? t.muted : idnTokens.green, fontWeight: 500 }}>{right}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. ID CARD — fullscreen QR (sheet)
// ─────────────────────────────────────────────────────────────
function ScrIdCard({ t }) {
  return (
    <div style={{ flex: 1, background: '#0E110D', color: '#fff', display: 'flex', flexDirection: 'column', padding: '0 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
        <button style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>Votre identité</div>
        <button style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.more}</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 26px' }}>
        <div style={{ background: '#fff', padding: 18, borderRadius: 18, width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QRPattern/>
        </div>
        <div style={{ fontFamily: idnTokens.mono, fontSize: 12, opacity: 0.8, letterSpacing: 2, marginTop: 22 }}>GA-7K3J-9Q2L</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Aïssatou Mboumba</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Citoyen Gabonais · 14 mars 1992</div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 9999, background: 'rgba(255,255,255,0.18)', letterSpacing: 0.4, marginTop: 12 }}>NIVEAU 3 · ÉLEVÉ</span>
      </div>
      <div style={{ padding: '0 26px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12, fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, textAlign: 'center' }}>
          Présentez ce QR à un contrôleur d'identité. Renouvellement automatique toutes les 30 s.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{ flex: 1, padding: '14px 0', background: 'rgba(255,255,255,0.14)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Partager</button>
          <button style={{ flex: 1, padding: '14px 0', background: '#fff', color: '#0E110D', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Signer un document</button>
        </div>
      </div>
    </div>
  );
}
function QRPattern() {
  // Stylised QR — deterministic random
  const cells = [];
  for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
    const corner = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
    const seed = ((r * 31 + c * 17) % 23);
    cells.push({ r, c, on: corner || seed < 11 });
  }
  return (
    <svg viewBox="0 0 210 210" width="100%" height="100%">
      <rect width="210" height="210" fill="#fff"/>
      {cells.map(({ r, c, on }) => on && <rect key={`${r}-${c}`} x={c*10} y={r*10} width="10" height="10" fill="#0E110D"/>)}
      {/* corner markers */}
      {[[0,0],[0,140],[140,0]].map(([x,y], i) => (
        <g key={i}><rect x={x} y={y} width="70" height="70" fill="none" stroke="#0E110D" strokeWidth="10"/><rect x={x+20} y={y+20} width="30" height="30" fill="#0E110D"/></g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. SERVICES TAB (search, categories, list)
// ─────────────────────────────────────────────────────────────
function ScrServices({ t }) {
  const cats = [
    { k: 'Consulaire', i: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>, c: 6 },
    { k: 'État civil', i: IdnIcons.user, c: 5 },
    { k: 'Fiscalité', i: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h6"/></svg>, c: 3 },
    { k: 'Éducation', i: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5"/></svg>, c: 4 },
    { k: 'Santé', i: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4v16M4 12h16"/></svg>, c: 3 },
    { k: 'Justice', i: IdnIcons.shield, c: 2 },
  ];
  const services = [
    { l: 'e-Visa Tourisme', sub: 'Consulat.ga · Niv. 1', col: idnTokens.blue, b: 'New' },
    { l: 'Acte de naissance', sub: 'État civil · Niv. 3', col: idnTokens.green },
    { l: 'Renouvellement CNI', sub: 'Intérieur · Niv. 3', col: idnTokens.green },
    { l: 'Déclaration de revenus', sub: 'DGI · Niv. 2', col: idnTokens.green },
    { l: 'Bourses étudiantes', sub: 'Enseign. sup. · Niv. 3', col: idnTokens.green },
    { l: 'Carte CNAMGS', sub: 'Santé.ga · Niv. 3', col: idnTokens.green },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Services" sub="23 démarches accessibles avec votre IDN"/>
      <div style={{ padding: '0 22px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '10px 14px' }}>
          <span style={{ color: t.muted }}>{IdnIcons.search}</span>
          <input placeholder="Rechercher un service…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: t.ink, fontFamily: idnTokens.font }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
          {cats.map((cc, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cc.i}</div>
              <div style={{ fontSize: 11.5, color: t.ink, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{cc.k}</div>
              <div style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{cc.c}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 8 }}>Populaires</div>
        {services.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i === services.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.doc}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                {s.l}
                {s.b && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 9999, background: idnTokens.green, color: '#fff', letterSpacing: 0.5 }}>{s.b}</span>}
              </div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{s.sub}</div>
            </div>
            <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Service detail (sheet pattern)
function ScrServiceDetail({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 140, background: 'linear-gradient(135deg,#0E7C3A 0%,#0A5C2C 100%)', position: 'relative', padding: '14px 22px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
          <button style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.more}</button>
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 22, right: 22 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.2)', letterSpacing: 0.4 }}>CONSULAT.GA</span>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, letterSpacing: -0.3 }}>e-Visa Tourisme</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px 22px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <NStat t={t} l="Délai moyen" v="48h"/>
          <NStat t={t} l="Coût" v="40 000 FCFA"/>
          <NStat t={t} l="LoA min." v="1"/>
        </div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, marginTop: 18 }}>
          Visa touristique pour les ressortissants étrangers souhaitant visiter le Gabon. Validité 30 ou 90 jours, entrée unique ou multiple. Demande instruite par les services consulaires.
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginTop: 22, marginBottom: 10 }}>Pièces nécessaires</div>
        {[
          { l: 'Passeport en cours de validité', ok: true },
          { l: 'Photo d\'identité récente', ok: true },
          { l: 'Justificatif d\'hébergement', ok: false },
          { l: 'Billet retour', ok: false },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.borderSoft}` }}>
            <div style={{ width: 24, height: 24, borderRadius: 9999, background: r.ok ? idnTokens.green : t.surface2, color: r.ok ? '#fff' : t.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.ok ? IdnIcons.check : IdnIcons.plus}</div>
            <span style={{ flex: 1, fontSize: 13, color: t.ink }}>{r.l}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 22px 22px', borderTop: `1px solid ${t.borderSoft}`, background: t.surface }}>
        <IdnButton t={t} variant="primary" size="lg" full>Démarrer la démarche</IdnButton>
      </div>
    </div>
  );
}
function NStat({ t, l, v }) {
  return (
    <div style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: t.muted, letterSpacing: 0.8, fontWeight: 600 }}>{l.toUpperCase()}</div>
      <div style={{ fontSize: 14, color: t.ink, fontWeight: 600, marginTop: 2 }}>{v}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. ACTIVITY TAB (timeline)
// ─────────────────────────────────────────────────────────────
function ScrActivity({ t }) {
  const events = [
    { d: 'Aujourd\'hui', items: [
      { ts: '14:32', cat: 'AUTH', e: 'Connexion à Consulat.ga', m: 'iPhone · Libreville', col: idnTokens.green },
      { ts: '09:14', cat: 'CONS', e: 'Consentement accordé à Bourses Étudiantes', m: 'profile, email, birth_cert', col: idnTokens.blue },
    ]},
    { d: 'Hier', items: [
      { ts: '18:42', cat: 'AUTH', e: 'Connexion depuis Paris', m: 'Firefox Linux · 81.92.144.7', col: idnTokens.yellow, warn: true },
      { ts: '09:14', cat: 'KYC', e: 'Niveau de garantie augmenté à 3', m: 'Validé par K. Ovono', col: idnTokens.green },
    ]},
    { d: '06 mai', items: [
      { ts: '11:02', cat: 'AUTH', e: 'Mot de passe modifié', m: 'Paramètres → Sécurité', col: idnTokens.green },
      { ts: '08:14', cat: 'NOTIF', e: 'Email de bienvenue lu', m: 'Premier message IDN', col: t.muted },
    ]},
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Activité" sub="Tous les événements de votre compte"/>
      <div style={{ padding: '0 22px 12px', display: 'flex', gap: 6, overflow: 'auto' }}>
        {['Tout', 'Connexions', 'Consentements', 'KYC', 'Sécurité'].map((f, i) => (
          <span key={f} style={{ padding: '6px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500, background: i === 0 ? idnTokens.green : t.surface, color: i === 0 ? '#fff' : t.ink2, border: `1px solid ${i === 0 ? idnTokens.green : t.border}`, flexShrink: 0 }}>{f}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 18px' }}>
        {events.map((day, di) => (
          <div key={di}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '14px 0 8px' }}>{day.d.toUpperCase()}</div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
              {day.items.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 14px', borderBottom: i === day.items.length - 1 ? 'none' : `1px solid ${t.borderSoft}`, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 9999, background: ev.col, marginTop: 6, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{ev.e}</span>
                      {ev.warn && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 9999, background: idnTokens.yellowSoft, color: '#9b6a00', letterSpacing: 0.5 }}>INHABITUEL</span>}
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{ev.m}</div>
                  </div>
                  <span style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted }}>{ev.ts}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. PROFILE TAB (settings hub)
// ─────────────────────────────────────────────────────────────
function ScrProfileTab({ t, user = DEMO_USERS.citoyen }) {
  const Group = ({ children }) => <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>{children}</div>;
  const Row = ({ icon, l, sub, right, danger }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: `1px solid ${t.borderSoft}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: t.surface2, color: danger ? '#B83A3A' : idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: danger ? '#B83A3A' : t.ink }}>{l}</div>
        {sub && <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {right || <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>}
    </div>
  );
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Profil"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 18px' }}>
        <Group>
          <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.prenom[0]}{user.nom[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>{user.prenom} {user.nom}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{user.profil}</div>
              <div style={{ marginTop: 6 }}><LoABadge level={user.loa} t={t} compact/></div>
            </div>
            <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>
          </div>
        </Group>

        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 600, padding: '6px 4px 6px' }}>SÉCURITÉ</div>
        <Group>
          <Row icon={IdnIcons.lock} l="Mot de passe" sub="Modifié il y a 18 jours"/>
          <Row icon={<span style={{ fontFamily: idnTokens.mono, fontSize: 12, fontWeight: 600 }}>•••</span>} l="Code PIN" sub="6 chiffres"/>
          <Row icon={IdnIcons.shield} l="Authentification 2FA" sub="SMS activé" right={<span style={{ fontSize: 10, fontWeight: 600, color: idnTokens.green, padding: '3px 8px', borderRadius: 9999, background: t.dark ? '#0A1F11' : idnTokens.greenSoft }}>ACTIF</span>}/>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 11c0-3 3-7 7-7s7 4 7 7"/><path d="M9 13c.5-1.5 2-2 3-2s2.5.5 3 2v2"/><path d="M12 15v5M5 16c0 3 3 4 7 4"/></svg>} l="Face ID" sub="Pour déverrouiller l'app" right={<Toggle on/>}/>
        </Group>

        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 600, padding: '12px 4px 6px' }}>COMPTE</div>
        <Group>
          <Row icon={IdnIcons.doc} l="Mes documents" sub="3 documents validés"/>
          <Row icon={IdnIcons.shield} l="Consentements" sub="4 applications autorisées"/>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 6h18l-2 14H5z"/><path d="M9 10v6M15 10v6"/></svg>} l="Appareils & sessions" sub="3 sessions actives"/>
        </Group>

        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 600, padding: '12px 4px 6px' }}>PRÉFÉRENCES</div>
        <Group>
          <Row icon={IdnIcons.bell} l="Notifications"/>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>} l="Langue" sub="Français"/>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>} l="Apparence" sub="Système"/>
        </Group>

        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 600, padding: '12px 4px 6px' }}>DONNÉES</div>
        <Group>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3v14M6 11l6 6 6-6M4 21h16"/></svg>} l="Télécharger mes données"/>
          <Row icon={IdnIcons.shield} l="Confidentialité"/>
        </Group>

        <Group>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"/></svg>} l="Aide & support"/>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>} l="À propos d'IDN" sub="v1.2 · MVP"/>
          <Row icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 17l5-5-5-5M9 12h10"/></svg>} l="Se déconnecter" danger/>
        </Group>

        <div style={{ textAlign: 'center', fontSize: 11, color: t.mutedSoft, padding: '12px 0', fontFamily: idnTokens.mono }}>ID IDN · GA-7K3J-9Q2L</div>
      </div>
    </div>
  );
}
function Toggle({ on }) {
  return (
    <div style={{ width: 38, height: 22, borderRadius: 9999, background: on ? idnTokens.green : '#cbcab8', padding: 2 }}>
      <div style={{ width: 18, height: 18, borderRadius: 9999, background: '#fff', transform: on ? 'translateX(16px)' : 'translateX(0)', boxShadow: '0 1px 2px rgba(0,0,0,.15)' }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. KYC FLOW (native camera UX)
// ─────────────────────────────────────────────────────────────
function ScrKycIntro({ t }) {
  return (
    <NStepShell t={t} step={0} total={3} title="Passons au Niveau 2" sub="3 étapes, environ 5 minutes. Vos données restent chiffrées sur votre téléphone." primary="Commencer">
      {[
        { n: '01', t: 'Document d\'identité', d: 'Photographiez votre CNI recto-verso', i: IdnIcons.doc },
        { n: '02', t: 'Selfie vivant', d: 'Détection de présence + face match', i: IdnIcons.camera },
        { n: '03', t: 'Validation', d: 'Revue auto, puis manuelle si besoin (24-48h)', i: IdnIcons.check },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.i}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{s.t}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{s.d}</div>
          </div>
          <div style={{ fontSize: 10, fontFamily: idnTokens.mono, color: t.muted, fontWeight: 600 }}>{s.n}</div>
        </div>
      ))}
    </NStepShell>
  );
}

function ScrKycDoc({ t }) {
  return (
    <div style={{ flex: 1, background: '#0E110D', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
        <button style={{ background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>Recto de la CNI</div>
        <div style={{ width: 32 }}/>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 26px' }}>
        <div style={{ width: '100%', height: 180, borderRadius: 14, border: '2.5px solid #fff', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', position: 'relative' }}>
          {/* mock ID card outline */}
          <div style={{ position: 'absolute', inset: 14, opacity: 0.34 }}>
            <div style={{ fontSize: 8, letterSpacing: 1.4, color: '#fff', fontFamily: idnTokens.mono }}>RÉPUBLIQUE GABONAISE</div>
            <div style={{ fontSize: 9, color: '#fff', marginTop: 2, fontFamily: idnTokens.mono }}>CARTE NATIONALE D'IDENTITÉ</div>
            <div style={{ fontSize: 10, color: '#fff', marginTop: 28, fontWeight: 600 }}>MBOUMBA</div>
            <div style={{ fontSize: 10, color: '#fff' }}>Aïssatou</div>
          </div>
          {/* corner brackets */}
          {[[0,0,'tl'],[0,1,'tr'],[1,0,'bl'],[1,1,'br']].map(([y,x,k]) => (
            <div key={k} style={{ position: 'absolute', [y === 0 ? 'top' : 'bottom']: -3, [x === 0 ? 'left' : 'right']: -3, width: 20, height: 20, borderTop: y === 0 ? `3px solid ${idnTokens.green}` : 'none', borderBottom: y === 1 ? `3px solid ${idnTokens.green}` : 'none', borderLeft: x === 0 ? `3px solid ${idnTokens.green}` : 'none', borderRight: x === 1 ? `3px solid ${idnTokens.green}` : 'none' }}/>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 18, left: 22, right: 22, padding: '10px 14px', background: 'rgba(255,255,255,0.14)', borderRadius: 10, fontSize: 12, color: '#fff', textAlign: 'center' }}>
          Cadrez la carte dans le rectangle
        </div>
      </div>
      <div style={{ padding: '20px 26px 26px' }}>
        <div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center', marginBottom: 16 }}>Bonne lumière · pas de reflets · cadre net</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 48, height: 48, borderRadius: 9999, background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button style={{ width: 72, height: 72, borderRadius: 9999, background: '#fff', border: '4px solid rgba(255,255,255,0.4)', cursor: 'pointer' }}/>
          <button style={{ width: 48, height: 48, borderRadius: 9999, background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 4v4h-4"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ScrKycSelfie({ t }) {
  return (
    <div style={{ flex: 1, background: '#0E110D', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
        <button style={{ background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>Selfie vivant</div>
        <div style={{ width: 32 }}/>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 220, height: 280, borderRadius: '50% / 42%', border: `3px dashed ${idnTokens.green}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: 180, height: 220, opacity: 0.34 }}>
            <svg viewBox="0 0 100 120" width="100%" height="100%" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round">
              <ellipse cx="50" cy="55" rx="28" ry="38"/>
              <circle cx="40" cy="48" r="2.5"/><circle cx="60" cy="48" r="2.5"/>
              <path d="M44 65c2 2 10 2 12 0"/>
            </svg>
          </div>
          {/* progress ring on top */}
          <svg style={{ position: 'absolute', inset: -3 }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M50 4 A46 46 0 1 1 49 4" fill="none" stroke={idnTokens.green} strokeWidth="2" strokeDasharray="220 600" opacity="0.8" pathLength="600"/>
          </svg>
        </div>
        <div style={{ position: 'absolute', top: 30, left: 22, right: 22, padding: '12px 14px', background: 'rgba(255,255,255,0.14)', borderRadius: 12, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
          Tournez doucement la tête à gauche →
        </div>
        <div style={{ position: 'absolute', bottom: 18, left: 22, right: 22 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[1, 0.6, 0.3, 0].map((o, i) => <div key={i} style={{ width: 24, height: 4, borderRadius: 9999, background: idnTokens.green, opacity: o }}/>)}
          </div>
          <div style={{ fontSize: 11, opacity: 0.75, textAlign: 'center', marginTop: 12 }}>Étape 2/4 · Bonne luminosité détectée</div>
        </div>
      </div>
    </div>
  );
}

function ScrKycReview({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 26px 26px', textAlign: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          <svg viewBox="0 0 100 100" width="96" height="96">
            <circle cx="50" cy="50" r="44" fill="none" stroke={t.border} strokeWidth="5"/>
            <circle cx="50" cy="50" r="44" fill="none" stroke={idnTokens.blue} strokeWidth="5" strokeDasharray="276" strokeDashoffset="80" strokeLinecap="round" transform="rotate(-90 50 50)"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: t.ink, fontFamily: idnTokens.mono }}>71%</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.3 }}>Vérification en cours</div>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 10, lineHeight: 1.55, maxWidth: 280, margin: '10px auto 0' }}>Notre système croise vos données. Vous serez notifié·e dès qu'une décision sera prise.</div>
        </div>
        <div style={{ width: '100%', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, textAlign: 'left' }}>
          {[
            { l: 'Document scanné', ok: true },
            { l: 'Lecture OCR', ok: true },
            { l: 'Face match (selfie ↔ doc)', ok: true },
            { l: 'Croisement registre civil', ok: false, w: 'en cours' },
            { l: 'Revue manuelle si nécessaire', ok: null },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <div style={{ width: 18, height: 18, borderRadius: 9999, background: r.ok === true ? idnTokens.green : r.ok === false ? idnTokens.blue : t.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r.ok === true && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg>}
                {r.ok === false && <div style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }}/>}
              </div>
              <div style={{ flex: 1, fontSize: 12, color: r.ok === null ? t.muted : t.ink }}>{r.l}</div>
              {r.w && <span style={{ fontSize: 10, color: idnTokens.blue, fontWeight: 600 }}>{r.w}</span>}
            </div>
          ))}
        </div>
      </div>
      <IdnButton t={t} variant="ghost" size="lg" full>Retour à l'accueil</IdnButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. CONSENT (OIDC, native sheet)
// ─────────────────────────────────────────────────────────────
function ScrConsent({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: t.borderSoft }}/>
      </div>
      <div style={{ padding: '14px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>CONNEXION À</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
          <div style={{ color: t.muted }}><svg width="20" height="6" viewBox="0 0 30 6"><circle cx="3" cy="3" r="1.5" fill="currentColor"/><circle cx="15" cy="3" r="1.5" fill="currentColor"/><circle cx="27" cy="3" r="1.5" fill="currentColor"/></svg></div>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: '#dac5a0', color: '#5a4a0a', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>B</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, marginTop: 16 }}>Bourses Étudiantes</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Ministère de l'Enseignement supérieur</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 18px' }}>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.55, padding: '12px 0' }}>
          Cette application souhaite accéder à ces informations de votre compte IDN :
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {[
            { l: 'Identité pivot', s: 'Prénom, nom, date et lieu de naissance', i: IdnIcons.user, req: true },
            { l: 'Adresse email', s: 'aissatou.mboumba@example.ga', i: IdnIcons.mail, req: true },
            { l: 'Acte de naissance numérique', s: 'Pour la vérification du statut d\'étudiant·e', i: IdnIcons.doc, req: true },
            { l: 'Niveau de garantie ≥ 3', s: 'Vérifié — vous avez le Niveau 3', i: IdnIcons.shield, req: true, ok: true },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 14px', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: t.surface2, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.i}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{r.l}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2, lineHeight: 1.4 }}>{r.s}</div>
              </div>
              {r.ok && <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span>}
            </div>
          ))}
        </div>
        <div style={{ background: t.dark ? '#10243A' : idnTokens.blueSoft, marginTop: 12, padding: 12, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: idnTokens.blue }}>{IdnIcons.shield}</span>
          <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>Vous pouvez révoquer cet accès à tout moment depuis <b>Profil → Consentements</b>.</div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 22px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${t.borderSoft}`, background: t.surface }}>
        <IdnButton t={t} variant="primary" size="lg" full>Autoriser</IdnButton>
        <IdnButton t={t} variant="quiet" size="md" full>Refuser</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. NOTIFICATIONS (inbox)
// ─────────────────────────────────────────────────────────────
function ScrNotifications({ t }) {
  const groups = [
    { d: 'Aujourd\'hui', items: [
      { cat: 'KYC', e: 'Votre niveau de garantie est passé à 3', m: 'Validé par le contrôleur K. Ovono.', ts: '09:14', col: idnTokens.green, unread: true },
      { cat: 'SÉCURITÉ', e: 'Nouvelle connexion détectée', m: 'Firefox Linux · Paris, FR · 81.92.144.7', ts: '08:42', col: idnTokens.yellow, warn: true, unread: true },
    ]},
    { d: 'Cette semaine', items: [
      { cat: 'SERVICE', e: 'e-Visa Tourisme : pièces à compléter', m: 'Ajoutez un justificatif d\'hébergement', ts: 'Hier', col: idnTokens.blue },
      { cat: 'CONS.', e: 'Consentement accordé à Bourses Étudiantes', m: 'Vous pouvez le révoquer à tout moment', ts: '08 mai', col: t.muted },
    ]},
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Notifications" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: idnTokens.green, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Tout lu</button>}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 22px' }}>
        {groups.map((g, gi) => (
          <div key={gi}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '14px 4px 8px' }}>{g.d.toUpperCase()}</div>
            {g.items.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: n.unread ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface, border: `1px solid ${n.unread ? (t.dark ? '#1B3F2A' : '#C5E0CC') : t.border}`, borderRadius: 12, marginBottom: 8, position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: n.col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {n.warn ? IdnIcons.shield : IdnIcons.bell}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, fontFamily: idnTokens.mono, fontWeight: 600, color: n.col, padding: '1px 6px', borderRadius: 4, background: t.surface }}>{n.cat}</span>
                    <span style={{ fontSize: 11, color: t.muted, marginLeft: 'auto' }}>{n.ts}</span>
                  </div>
                  <div style={{ fontSize: 13, color: t.ink, fontWeight: 500, marginTop: 4 }}>{n.e}</div>
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 2, lineHeight: 1.45 }}>{n.m}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 14. SCANNER (camera for QR signin)
// ─────────────────────────────────────────────────────────────
function ScrScanner({ t }) {
  return (
    <div style={{ flex: 1, background: '#0E110D', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
        <button style={{ background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>Scanner un QR</div>
        <button style={{ background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v3M21 12h-3M12 21v-3M3 12h3"/><circle cx="12" cy="12" r="5"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          {[[0,0,'tl'],[0,1,'tr'],[1,0,'bl'],[1,1,'br']].map(([y,x,k]) => (
            <div key={k} style={{ position: 'absolute', [y === 0 ? 'top' : 'bottom']: 0, [x === 0 ? 'left' : 'right']: 0, width: 40, height: 40, borderTop: y === 0 ? `3px solid ${idnTokens.green}` : 'none', borderBottom: y === 1 ? `3px solid ${idnTokens.green}` : 'none', borderLeft: x === 0 ? `3px solid ${idnTokens.green}` : 'none', borderRight: x === 1 ? `3px solid ${idnTokens.green}` : 'none' }}/>
          ))}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: idnTokens.green, boxShadow: `0 0 18px ${idnTokens.green}` }}/>
        </div>
      </div>
      <div style={{ padding: '0 26px 30px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Pointez la caméra vers le QR</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Connexion sécurisée à un site IDN ou présentation à un contrôleur</div>
        <div style={{ marginTop: 22, padding: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, opacity: 0.86, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: idnTokens.green }}>{IdnIcons.shield}</span>
          <span>L'authentification cross-device chiffre votre identité avant de la transmettre.</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 15. SETTINGS SUB-PAGES (security, sessions, notifications, language, privacy)
// ─────────────────────────────────────────────────────────────
function ScrSettingsSecurity({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Sécurité" sub="Mot de passe, PIN, authentification à deux facteurs." onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '6px 4px 6px' }}>IDENTIFIANTS</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} l="Mot de passe" v="Modifié il y a 18 jours"/>
          <SetMobileRow t={t} l="Code PIN" v="6 chiffres · ••••••"/>
        </div>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '14px 4px 6px' }}>AUTHENTIFICATION À 2 FACTEURS</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} l="Application d'authentification" v="Non configurée" right={<IdnButton t={t} variant="primary" size="sm">Activer</IdnButton>}/>
          <SetMobileRow t={t} l="SMS" v="+241 06 •• •• •32" right={<span style={{ fontSize: 10, fontWeight: 600, color: idnTokens.green, padding: '3px 8px', borderRadius: 9999, background: t.dark ? '#0A1F11' : idnTokens.greenSoft }}>ACTIF</span>}/>
          <SetMobileRow t={t} l="Clé matérielle (FIDO2)" v="YubiKey, Titan…" right={<IdnButton t={t} variant="ghost" size="sm">Ajouter</IdnButton>}/>
        </div>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '14px 4px 6px' }}>BIOMÉTRIE</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} l="Face ID" v="Pour déverrouiller l'app" right={<Toggle on/>}/>
          <SetMobileRow t={t} l="Face ID pour signer" v="Validation des actions sensibles" right={<Toggle on/>}/>
        </div>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '14px 4px 6px' }}>CODES DE RÉCUPÉRATION</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>10 codes à conserver en lieu sûr. Permettent de récupérer le compte si vous perdez vos appareils.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontFamily: idnTokens.mono, fontSize: 11, color: t.ink2, marginTop: 12 }}>
            {['7K3J-9Q2L', 'M2H8-5C9R', 'B3X6-A4D2', 'K8Z1-N7Q4', '••••-••••', '••••-••••'].map((c, i) => (
              <div key={i} style={{ padding: '8px 10px', background: t.surface2, borderRadius: 6, color: i < 4 ? t.ink : t.muted }}>{c}</div>
            ))}
          </div>
          <IdnButton t={t} variant="ghost" size="sm" full style={{ marginTop: 12 }}>Régénérer</IdnButton>
        </div>
      </div>
    </div>
  );
}
function SetMobileRow({ t, l, v, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: `1px solid ${t.borderSoft}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{l}</div>
        {v && <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{v}</div>}
      </div>
      {right || <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>}
    </div>
  );
}

function ScrSettingsSessions({ t }) {
  const sess = [
    { dev: 'iPhone 14 Pro · Safari', loc: 'Libreville, GA', ip: '41.222.18.92', ts: 'Active maintenant', current: true },
    { dev: 'MacBook Pro · Chrome', loc: 'Libreville, GA', ip: '41.222.18.92', ts: 'Il y a 2 h' },
    { dev: 'Firefox · Linux', loc: 'Paris, FR', ip: '81.92.144.7', ts: 'Hier 18:42', warn: true },
    { dev: 'Android · Chrome', loc: 'Port-Gentil, GA', ip: '197.232.40.4', ts: 'Il y a 6 j' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Appareils & sessions" sub="4 sessions actives sur votre compte." onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        {sess.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: 14, background: t.surface, border: `1px solid ${s.warn ? (t.dark ? '#3A2D14' : '#E8D67E') : t.border}`, borderRadius: 14, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: s.warn ? idnTokens.yellow : t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.shield}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: t.ink, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                {s.dev}
                {s.current && <span style={{ fontSize: 9, fontWeight: 600, color: idnTokens.green, padding: '2px 6px', borderRadius: 9999, background: t.dark ? '#0A1F11' : idnTokens.greenSoft }}>CET APPAREIL</span>}
                {s.warn && <span style={{ fontSize: 9, fontWeight: 600, color: '#9b6a00', padding: '2px 6px', borderRadius: 9999, background: t.dark ? '#3A2D14' : idnTokens.yellowSoft }}>INHABITUEL</span>}
              </div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 3, fontFamily: idnTokens.mono }}>{s.loc} · {s.ip}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{s.ts}</div>
              {!s.current && <button style={{ background: 'none', border: 'none', color: '#B83A3A', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0, marginTop: 8 }}>Révoquer cette session</button>}
            </div>
          </div>
        ))}
        <button style={{ width: '100%', padding: 14, background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 12, color: '#B83A3A', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Déconnecter tous les autres appareils</button>
      </div>
    </div>
  );
}

function ScrSettingsLanguage({ t }) {
  const langs = [
    { id: 'fr', l: 'Français', sub: 'Langue officielle', sel: true },
    { id: 'en', l: 'English', sub: 'Official language' },
    { id: 'fang', l: 'Fang', sub: 'Bientôt', dis: true },
    { id: 'myene', l: 'Myènè', sub: 'Bientôt', dis: true },
    { id: 'punu', l: 'Punu', sub: 'Bientôt', dis: true },
    { id: 'nzebi', l: 'Nzébi', sub: 'Bientôt', dis: true },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Langue" sub="L'interface, les emails et les SMS s'adapteront." onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {langs.map((o, i) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: i === langs.length - 1 ? 'none' : `1px solid ${t.borderSoft}`, opacity: o.dis ? 0.45 : 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{o.l}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{o.sub}</div>
              </div>
              {o.sel ? <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span> : <div style={{ width: 20, height: 20, borderRadius: 9999, border: `1.5px solid ${t.border}` }}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScrSettingsPrivacy({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Confidentialité" sub="Visualisez, exportez ou supprimez vos données." onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '6px 4px 6px' }}>VOS DONNÉES</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} l="Télécharger une copie" v="Archive ZIP · disponible sous 24h"/>
          <SetMobileRow t={t} l="Liste des partages actifs" v="4 services autorisés"/>
        </div>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, padding: '14px 4px 6px' }}>RÉUTILISATION</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} l="Statistiques anonymisées" v="Aide les administrations à planifier" right={<Toggle on/>}/>
          <SetMobileRow t={t} l="Programme d'amélioration UX" v="Anonyme · révocable" right={<Toggle on={false}/>}/>
        </div>
        <div style={{ background: t.dark ? '#1F1216' : '#FBE5E5', border: `1px solid ${t.dark ? '#3A1E1E' : '#F5C7C7'}`, borderRadius: 14, padding: 16, marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#B83A3A' }}>Zone sensible</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>Suspendre ou supprimer définitivement votre compte IDN. Les logs d'audit sont conservés 5 ans (obligation légale).</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <IdnButton t={t} variant="ghost" size="md" full>Désactiver temporairement</IdnButton>
            <IdnButton t={t} variant="danger" size="md" full>Supprimer mon compte</IdnButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrAbout({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="À propos" onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22, textAlign: 'center' }}>
          <IdnMark size={56} t={t}/>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, marginTop: 12 }}>Identité Numérique</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>République Gabonaise · ANINF</div>
          <div style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, marginTop: 14 }}>v1.2.0 · MVP · build 2026.05.11</div>
        </div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, padding: '20px 4px' }}>
          IDN est l'infrastructure de confiance qui relie chaque citoyen, résident et visiteur à l'ensemble des services administratifs en ligne. Opéré par l'Agence Nationale des Infrastructures Numériques sous la tutelle du Ministère de l'Économie Numérique.
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} l="Conditions d'utilisation"/>
          <SetMobileRow t={t} l="Politique de confidentialité"/>
          <SetMobileRow t={t} l="Mentions légales"/>
          <SetMobileRow t={t} l="Accessibilité (RGAA)"/>
          <SetMobileRow t={t} l="Licences open source"/>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', marginTop: 12 }}>
          <SetMobileRow t={t} l="Centre d'appel" v="1407 · gratuit · 24/7"/>
          <SetMobileRow t={t} l="Antennes physiques" v="9 provinces"/>
          <SetMobileRow t={t} l="État du service" v="Tous les systèmes opérationnels" right={<div style={{ width: 8, height: 8, borderRadius: 9999, background: idnTokens.green }}/>}/>
        </div>
        <div style={{ textAlign: 'center', padding: '22px 0 0', display: 'flex', justifyContent: 'center' }}><IdnFlagBars width={42} height={3}/></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────
function NativeApp({ t, screen, user, statusInk }) {
  return (
    <NPhone t={t} statusInk={statusInk || (screen === 'launcher' || screen === 'id-card' || screen === 'scan' || screen === 'kyc-doc' || screen === 'kyc-selfie' ? '#fff' : undefined)}>
      {screen === 'launcher' && <ScrLauncher t={t}/>}
      {screen === 'onboarding-1' && <ScrOnboarding t={t} slide={0}/>}
      {screen === 'onboarding-2' && <ScrOnboarding t={t} slide={1}/>}
      {screen === 'onboarding-3' && <ScrOnboarding t={t} slide={2}/>}
      {screen === 'onboarding-4' && <ScrOnboarding t={t} slide={3}/>}
      {screen === 'auth-hub' && <ScrAuthHub t={t}/>}
      {screen === 'login' && <ScrLogin t={t}/>}
      {screen === 'signup-profil' && <ScrSignupProfil t={t}/>}
      {screen === 'signup-email' && <ScrSignupEmail t={t}/>}
      {screen === 'signup-otp' && <ScrSignupOtp t={t}/>}
      {screen === 'signup-pivot' && <ScrSignupPivot t={t}/>}
      {screen === 'signup-pin' && <ScrSignupPin t={t}/>}
      {screen === 'signup-bio' && <ScrSignupBio t={t}/>}
      {screen === 'signup-done' && <ScrSignupDone t={t}/>}
      {/* Nouveau parcours souverain @idn.ga */}
      {screen === 'signup-idn-a' && <ScrSignupIdnA t={t}/>}
      {screen === 'signup-idn-b' && <ScrSignupIdnB t={t}/>}
      {screen === 'signup-idn-c' && <ScrSignupIdnC t={t}/>}
      {screen === 'signup-idn-taken' && <ScrSignupIdnTaken t={t}/>}
      {screen === 'signup-pwd-idn' && <ScrSignupPasswordIdn t={t}/>}
      {screen === 'signup-phone' && <ScrSignupPhone t={t}/>}
      {screen === 'signup-sms-otp' && <ScrSignupSmsOtp t={t}/>}
      {screen === 'signup-idn-done' && <ScrSignupIdnDone t={t}/>}
      {screen === 'home' && <><ScrHome t={t} user={user}/><NTabBar t={t} active="home"/></>}
      {screen === 'id-card' && <ScrIdCard t={t}/>}
      {screen === 'services' && <><ScrServices t={t}/><NTabBar t={t} active="services"/></>}
      {screen === 'service-detail' && <ScrServiceDetail t={t}/>}
      {screen === 'activity' && <><ScrActivity t={t}/><NTabBar t={t} active="activity"/></>}
      {screen === 'profile-tab' && <><ScrProfileTab t={t} user={user}/><NTabBar t={t} active="profile"/></>}
      {screen === 'kyc-intro' && <ScrKycIntro t={t}/>}
      {screen === 'kyc-doc' && <ScrKycDoc t={t}/>}
      {screen === 'kyc-selfie' && <ScrKycSelfie t={t}/>}
      {screen === 'kyc-review' && <ScrKycReview t={t}/>}
      {screen === 'consent' && <ScrConsent t={t}/>}
      {screen === 'notifications' && <ScrNotifications t={t}/>}
      {screen === 'scan' && <ScrScanner t={t}/>}
      {screen === 'set-security' && <ScrSettingsSecurity t={t}/>}
      {screen === 'set-sessions' && <ScrSettingsSessions t={t}/>}
      {screen === 'set-language' && <ScrSettingsLanguage t={t}/>}
      {screen === 'set-privacy' && <ScrSettingsPrivacy t={t}/>}
      {screen === 'about' && <ScrAbout t={t}/>}

      {/* ─── iCarte ─── */}
      {screen === 'icarte-home'       && <ScrICarteHome t={t}/>}
      {screen === 'icarte-empty'      && <ScrICarteHome t={t} empty/>}
      {screen === 'icarte-card'       && <ScrICarteCardFront t={t}/>}
      {screen === 'icarte-card-back'  && <ScrICarteCardBack t={t}/>}
      {screen === 'icarte-add'        && <ScrICarteAdd t={t}/>}
      {screen === 'icarte-add-form'   && <ScrICarteAddForm t={t}/>}
      {screen === 'icarte-edit'       && <ScrICarteEdit t={t}/>}
      {screen === 'icarte-custom'     && <ScrICarteCustom t={t}/>}
      {screen === 'icarte-stack'      && <ScrICarteStack t={t}/>}

      {/* ─── iBoîte ─── */}
      {screen === 'iboite-courriers'      && <ScrIBoiteCourriers t={t}/>}
      {screen === 'iboite-courrier'       && <ScrIBoiteCourrierDetail t={t}/>}
      {screen === 'iboite-accounts'       && <ScrIBoiteAccounts t={t}/>}
      {screen === 'iboite-colis'          && <ScrIBoiteColis t={t}/>}
      {screen === 'iboite-emails'         && <ScrIBoiteEmails t={t}/>}
      {screen === 'iboite-email'          && <ScrIBoiteEmailDetail t={t}/>}
      {screen === 'iboite-compose'        && <ScrIBoiteCompose t={t}/>}

      {/* ─── iDocument ─── */}
      {screen === 'idoc-home'         && <ScrIDocHome t={t}/>}
      {screen === 'idoc-home-conf'    && <ScrIDocHome t={t} confidential/>}
      {screen === 'idoc-folder'       && <ScrIDocFolder t={t}/>}
      {screen === 'idoc-folder-conf'  && <ScrIDocFolder t={t} confidential/>}
      {screen === 'idoc-folder-empty' && <ScrIDocFolderEmpty t={t}/>}
      {screen === 'idoc-preview'      && <ScrIDocPreview t={t}/>}
      {screen === 'idoc-add-select'   && <ScrIDocAddSelect t={t}/>}
      {screen === 'idoc-add-preview'  && <ScrIDocAddPreview t={t}/>}
      {screen === 'idoc-add-success'  && <ScrIDocAddSuccess t={t}/>}
      {screen === 'idoc-request'      && <ScrIDocRequest t={t}/>}

      {/* ─── iCV ─── */}
      {screen === 'icv-empty'         && <ScrICVEmpty t={t}/>}
      {screen === 'icv-home'          && <ScrICVHome t={t}/>}
      {screen === 'icv-themes'        && <ScrICVThemes t={t}/>}
      {screen === 'icv-preview'       && <ScrICVPreview t={t}/>}
      {screen === 'icv-dashboard'     && <ScrICVDashboard t={t}/>}
      {screen === 'icv-edit-exp'      && <ScrICVEditExp t={t}/>}
      {screen === 'icv-edit-ai-load'  && <ScrICVEditExp t={t} aiState="loading"/>}
      {screen === 'icv-edit-ai-sugg'  && <ScrICVEditExp t={t} aiState="suggestion"/>}
      {screen === 'icv-edit-skill'    && <ScrICVEditSkill t={t}/>}
      {screen === 'icv-edit-lang'     && <ScrICVEditLang t={t}/>}
      {screen === 'icv-import'        && <ScrICVImport t={t}/>}
      {screen === 'icv-ats'           && <ScrICVAts t={t}/>}

      {/* ─── Notifications ─── */}
      {screen === 'notif-center'      && <ScrNotifCenter t={t}/>}
      {screen === 'notif-unread'      && <ScrNotifCenter t={t} filter="unread"/>}
      {screen === 'notif-security'    && <ScrNotifCenter t={t} filter="security"/>}
      {screen === 'notif-document'    && <ScrNotifCenter t={t} filter="document"/>}
      {screen === 'notif-allread'     && <ScrNotifCenter t={t} allRead/>}
    </NPhone>
  );
}

Object.assign(window, { NativeApp });
