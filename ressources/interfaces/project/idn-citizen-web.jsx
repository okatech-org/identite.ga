// Citizen flow on desktop — same content, web layout in BrowserChrome

function CitizenWeb({ t, screen = 'welcome', user = DEMO_USERS.citoyen }) {
  return (
    <BrowserChrome t={t} url={`https://idn.ga/${screen === 'welcome' ? '' : screen}`} w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden' }}>
        <CWNav t={t} user={user} screen={screen}/>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {screen === 'welcome' && <CWWelcome t={t}/>}
          {screen === 'profil' && <CWProfil t={t}/>}
          {screen === 'signup' && <CWSignup t={t}/>}
          {screen === 'otp' && <CWOtp t={t}/>}
          {screen === 'pivot' && <CWPivot t={t}/>}
          {screen === 'pin' && <CWPin t={t}/>}
          {screen === 'login' && <CWLogin t={t}/>}
          {screen === 'home' && <CWHome t={t} user={user}/>}
          {screen === 'profile' && <CWProfile t={t} user={user}/>}
          {screen === 'consents' && <CWConsents t={t}/>}
          {screen === 'kyc' && <CWKyc t={t}/>}
          {screen === 'kyc-status' && <CWKycStatus t={t}/>}
        </div>
      </div>
    </BrowserChrome>
  );
}

function CWNav({ t, user, screen }) {
  const loggedIn = ['home', 'profile', 'consents', 'kyc', 'kyc-status'].includes(screen);
  const tabs = [
    { id: 'home', label: 'Accueil' },
    { id: 'profile', label: 'Mon profil' },
    { id: 'consents', label: 'Consentements' },
  ];
  return (
    <div style={{ height: 60, padding: '0 28px', borderBottom: `1px solid ${t.border}`, background: t.surface, display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IdnMark size={26} t={t}/>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Identité Numérique</div>
        <span style={{ fontSize: 10, color: t.muted, padding: '2px 7px', borderRadius: 9999, background: t.surface2, fontWeight: 600, letterSpacing: 0.5 }}>RÉPUBLIQUE GABONAISE</span>
      </div>
      {loggedIn && (
        <div style={{ display: 'flex', gap: 4, marginLeft: 22 }}>
          {tabs.map(tb => (
            <div key={tb.id} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13,
              fontWeight: tb.id === screen ? 600 : 500,
              color: tb.id === screen ? idnTokens.green : t.ink2,
              background: tb.id === screen ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent',
              cursor: 'pointer',
            }}>{tb.label}</div>
          ))}
        </div>
      )}
      <div style={{ flex: 1 }}/>
      {loggedIn ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: t.muted }}>{IdnIcons.bell}</span>
          <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.prenom[0]}{user.nom[0]}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <IdnButton t={t} variant="quiet" size="sm">FR · EN</IdnButton>
          <IdnButton t={t} variant="ghost" size="sm">Aide</IdnButton>
        </div>
      )}
    </div>
  );
}

// Centered wizard wrapper (used by signup/otp/pivot/pin)
function CWWizard({ t, step, total, title, sub, children, primary, onPrimary, secondary }) {
  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {Array.from({length: total}).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? idnTokens.green : t.border }}/>
        ))}
      </div>
      <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>ÉTAPE {step} SUR {total}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: t.ink, letterSpacing: -0.4, lineHeight: 1.2 }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: t.muted, marginTop: 10, lineHeight: 1.5 }}>{sub}</div>}
      <div style={{ marginTop: 28 }}>{children}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        {secondary}
        <IdnButton t={t} variant="primary" size="lg" onClick={onPrimary} style={{ flex: 1 }}>{primary}</IdnButton>
      </div>
    </div>
  );
}

// 1. Welcome
function CWWelcome({ t }) {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <IdnFlagBars width={36} height={3}/>
          <span style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>RÉPUBLIQUE GABONAISE · IDN v1.2</span>
        </div>
        <div style={{ fontSize: 52, fontWeight: 600, color: t.ink, lineHeight: 1.1, letterSpacing: -1.2 }}>
          Un compte unique<br/>pour tous les services<br/><span style={{ color: idnTokens.green }}>de l'État.</span>
        </div>
        <div style={{ fontSize: 16, color: t.muted, marginTop: 22, lineHeight: 1.6, maxWidth: 460 }}>
          Authentifiez-vous une fois sur IDN, accédez à l'ensemble des services administratifs gabonais — consulats, ministères, e-Visa, bourses, santé.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
          <IdnButton t={t} variant="primary" size="lg" leadIcon={IdnIcons.userPlus}>Créer un compte IDN</IdnButton>
          <IdnButton t={t} variant="ghost" size="lg" leadIcon={IdnIcons.login}>Se connecter</IdnButton>
        </div>
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 16 }}>NIVEAUX DE GARANTIE</div>
        {[
          { l: 1, n: 'Faible', d: 'Email vérifié — services informatifs, e-Visa', col: t.muted },
          { l: 2, n: 'Substantiel', d: 'Document + selfie liveness — résidents', col: idnTokens.blue },
          { l: 3, n: 'Élevé', d: 'KYC vidéo + état civil — services régaliens', col: idnTokens.green },
        ].map((r, i, arr) => (
          <div key={r.l} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: t.surface2, color: r.col, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.l}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Niveau {r.l} — {r.n}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 3, lineHeight: 1.5 }}>{r.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Profile selection
function CWProfil({ t }) {
  return (
    <CWWizard t={t} step={1} total={5} title="Quel est votre profil ?" sub="Votre profil détermine les pièces demandées et les services accessibles." primary="Continuer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PROFILS.map((p, i) => {
          const sel = i === 0;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 16,
              border: `1.5px solid ${sel ? idnTokens.green : t.border}`,
              background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
              borderRadius: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: sel ? idnTokens.green : t.surface2, color: sel ? '#fff' : t.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{IdnIcons.user}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{p.label}</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{p.sub}</div>
              </div>
              {p.loa && <LoABadge level={p.loa} t={t} compact/>}
            </div>
          );
        })}
      </div>
    </CWWizard>
  );
}

// 3. Signup
function CWSignup({ t }) {
  return (
    <CWWizard t={t} step={2} total={5} title="Vos identifiants" sub="Email et mot de passe — vous pourrez ajouter une 2FA plus tard." primary="Recevoir le code de vérification">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <IdnInput t={t} label="Adresse email" value="aissatou.mboumba@example.ga" onChange={()=>{}} type="email" leadIcon={IdnIcons.mail}/>
        <IdnInput t={t} label="Mot de passe" value="••••••••••••" onChange={()=>{}} type="password" leadIcon={IdnIcons.lock} hint="Minimum 8 caractères, mélangez chiffres et symboles."/>
        <label style={{ display: 'flex', gap: 10, fontSize: 12, color: t.ink2, marginTop: 4, alignItems: 'flex-start' }}>
          <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: idnTokens.green }}/>
          <span>J'accepte les <u style={{ color: idnTokens.green }}>conditions d'utilisation</u> et la <u style={{ color: idnTokens.green }}>politique de confidentialité</u> IDN.</span>
        </label>
      </div>
    </CWWizard>
  );
}

// 4. OTP
function CWOtp({ t }) {
  const code = ['4','7','2','9','',''];
  return (
    <CWWizard t={t} step={3} total={5} title="Vérifiez votre email" sub={<>Code à 6 chiffres envoyé à <b style={{ color: t.ink }}>aissatou.mboumba@example.ga</b></>} primary="Vérifier">
      <div style={{ display: 'flex', gap: 10 }}>
        {code.map((c, i) => (
          <div key={i} style={{ flex: 1, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, fontFamily: idnTokens.mono, color: t.ink, background: t.surface, border: `1.5px solid ${c ? idnTokens.green : t.border}`, borderRadius: 10 }}>{c}</div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: t.muted, display: 'flex', justifyContent: 'space-between' }}>
        <span>Expire dans 0:43</span>
        <span style={{ cursor: 'pointer' }}>Renvoyer le code</span>
      </div>
    </CWWizard>
  );
}

// 5. Pivot
function CWPivot({ t }) {
  return (
    <CWWizard t={t} step={4} total={5} title="Vos informations" sub="Identité pivot — telles qu'elles figurent sur vos documents officiels." primary="Continuer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <IdnInput t={t} label="Prénom" value="Aïssatou" onChange={()=>{}}/>
          <IdnInput t={t} label="Nom" value="Mboumba" onChange={()=>{}}/>
        </div>
        <IdnInput t={t} label="Date de naissance" value="14/03/1992" onChange={()=>{}}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <IdnInput t={t} label="Genre" value="Féminin" onChange={()=>{}}/>
          <IdnInput t={t} label="Nationalité" value="Gabonaise" onChange={()=>{}}/>
        </div>
        <IdnInput t={t} label="Lieu de naissance" value="Libreville" onChange={()=>{}}/>
      </div>
    </CWWizard>
  );
}

// 6. PIN
function CWPin({ t }) {
  return (
    <CWWizard t={t} step={5} total={5} title="Créez votre PIN" sub="Un code à 6 chiffres pour les actions sensibles : signature, validation, accès rapide mobile." primary="Confirmer">
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '20px 0' }}>
        {[1,1,1,1,0,0].map((v, i) => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: 9999, background: v ? idnTokens.green : 'transparent', border: `2px solid ${v ? idnTokens.green : t.border}` }}/>
        ))}
      </div>
      <div style={{ background: t.dark ? '#10243A' : idnTokens.blueSoft, padding: 14, borderRadius: 10, fontSize: 12, color: t.ink2, lineHeight: 1.6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: idnTokens.blue, marginTop: 1 }}>{IdnIcons.shield}</span>
        Évitez les suites évidentes (123456) ou répétées (000000). Vous pourrez le changer dans <b>Mon profil → Sécurité</b>.
      </div>
    </CWWizard>
  );
}

// Login
function CWLogin({ t }) {
  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}><IdnMark size={42} t={t}/></div>
      <div style={{ fontSize: 26, fontWeight: 600, color: t.ink, textAlign: 'center', letterSpacing: -0.4 }}>Connectez-vous</div>
      <div style={{ fontSize: 14, color: t.muted, textAlign: 'center', marginTop: 8 }}>à votre compte Identité Numérique</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
        <IdnInput t={t} label="Email" value="aissatou.mboumba@example.ga" onChange={()=>{}} leadIcon={IdnIcons.mail}/>
        <IdnInput t={t} label="Mot de passe" value="••••••••" onChange={()=>{}} type="password" leadIcon={IdnIcons.lock}/>
      </div>
      <div style={{ textAlign: 'right', marginTop: 8, fontSize: 12, color: t.muted, cursor: 'pointer' }}>Mot de passe oublié ?</div>
      <IdnButton t={t} variant="primary" size="lg" full style={{ marginTop: 18 }}>Se connecter</IdnButton>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: t.border }}/>
        <span style={{ fontSize: 11, color: t.muted, letterSpacing: 1 }}>OU</span>
        <div style={{ flex: 1, height: 1, background: t.border }}/>
      </div>
      <IdnButton t={t} variant="ghost" size="md" full leadIcon={IdnIcons.qr}>Scanner le QR depuis l'app mobile</IdnButton>
      <div style={{ textAlign: 'center', fontSize: 12, color: t.muted, marginTop: 22 }}>
        Pas encore de compte ? <span style={{ color: idnTokens.green, fontWeight: 500, cursor: 'pointer' }}>Créer un compte IDN</span>
      </div>
    </div>
  );
}

// Home (dashboard)
function CWHome({ t, user }) {
  const services = [
    { title: 'e-Visa', sub: 'Statut : actif', tag: 'Niv. 1', icon: IdnIcons.doc },
    { title: 'Carte de séjour', sub: 'Renouvellement', tag: 'Niv. 2', icon: IdnIcons.shield },
    { title: 'État civil', sub: 'Acte de naissance', tag: 'Niv. 3', icon: IdnIcons.user },
    { title: 'Bourses étudiantes', sub: 'Min. enseign. sup.', tag: 'Niv. 3', icon: IdnIcons.mail },
    { title: 'Impôts.ga', sub: 'DGI — déclarations', tag: 'Niv. 2', icon: IdnIcons.doc },
    { title: 'Santé.ga', sub: 'Portail e-santé', tag: 'Niv. 3', icon: IdnIcons.user },
  ];
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontSize: 22, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{user.prenom[0]}{user.nom[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>{user.profil.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: t.ink, marginTop: 2 }}>Bonjour, {user.prenom}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LoABadge level={user.loa} t={t}/>
              <span style={{ fontSize: 12, color: t.muted }}>· ID IDN <span style={{ fontFamily: idnTokens.mono, color: t.ink2 }}>GA-7K3J-9Q2L</span></span>
            </div>
          </div>
        </div>
        {user.loa < 3 ? (
          <div style={{ background: t.dark ? '#1F2316' : idnTokens.yellowSoft, border: `1px solid ${t.dark ? '#3A3F1F' : '#E8D67E'}`, borderRadius: 14, padding: 18, display: 'flex', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: idnTokens.yellow, color: '#5a4a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{IdnIcons.shield}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Vérifiez votre identité</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>Passez au Niveau {user.loa + 1} pour débloquer plus de services administratifs.</div>
              <IdnButton t={t} variant="primary" size="sm" style={{ marginTop: 10 }}>Démarrer</IdnButton>
            </div>
          </div>
        ) : (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>SESSIONS ACTIVES</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: t.ink, marginTop: 6 }}>3 appareils</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>iPhone · MacBook · Chrome Linux</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>SERVICES</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
        {services.map((s, i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: idnTokens.mono, color: t.muted }}>{s.tag}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{s.title}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>ACTIVITÉ RÉCENTE</div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, marginTop: 12, overflow: 'hidden' }}>
        {[
          { ts: 'Aujourd\'hui 14:32', e: 'Connexion à Consulat.ga', m: 'depuis Libreville · iPhone' },
          { ts: 'Hier 09:14', e: 'Niveau de garantie élevé au 3', m: 'KYC vidéo validé' },
          { ts: '06 mai', e: 'Consentement accordé à Bourses Étudiantes', m: 'scopes : profile, email, birth_cert' },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', alignItems: 'center', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
            <span style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, width: 130 }}>{r.ts}</span>
            <span style={{ fontSize: 13, color: t.ink, fontWeight: 500, flex: 1 }}>{r.e}</span>
            <span style={{ fontSize: 12, color: t.muted }}>{r.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile detail
function CWProfile({ t, user }) {
  const Row = ({ label, value, mono }) => (
    <div style={{ display: 'flex', padding: '14px 0', borderBottom: `1px solid ${t.borderSoft}`, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: t.muted, width: 200, letterSpacing: 0.4 }}>{label}</span>
      <span style={{ fontSize: 13, color: t.ink, fontWeight: 500, fontFamily: mono ? idnTokens.mono : idnTokens.font, flex: 1 }}>{value}</span>
    </div>
  );
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontSize: 26, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.prenom[0]}{user.nom[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>{user.prenom} {user.nom}</div>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 4 }}>{user.profil}</div>
          <div style={{ marginTop: 8 }}><LoABadge level={user.loa} t={t}/></div>
        </div>
        <IdnButton t={t} variant="ghost" size="md">Modifier</IdnButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>IDENTITÉ PIVOT</div>
          <Row label="Prénom" value={user.prenom}/>
          <Row label="Nom" value={user.nom}/>
          <Row label="Date de naissance" value={user.ddn}/>
          <Row label="Lieu de naissance" value={user.lieu}/>
          <Row label="Nationalité" value={user.nat}/>
          <Row label="ID IDN" value="GA-7K3J-9Q2L" mono/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 22 }}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>SÉCURITÉ</div>
            <Row label="Mot de passe" value="Modifié il y a 18 jours"/>
            <Row label="PIN à 6 chiffres" value="Configuré · ••••••"/>
            <Row label="Authentification 2FA" value="Non configurée"/>
            <Row label="Sessions actives" value="3 appareils"/>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 22 }}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>VÉRIFICATION</div>
            <Row label="Niveau actuel" value={`Niveau ${user.loa}`}/>
            <Row label="Vérifié le" value="22 avril 2026"/>
            <Row label="Documents validés" value="CNI · Acte de naissance"/>
          </div>
        </div>
      </div>
    </div>
  );
}

// Consents
function CWConsents({ t }) {
  const apps = [
    { name: 'Consulat.ga', desc: 'Démarches consulaires en ligne', scopes: ['profile', 'email', 'loa:2'], date: '12 mar 2026' },
    { name: 'Bourses Étudiantes', desc: 'Min. de l\'Enseignement supérieur', scopes: ['profile', 'birth_cert', 'loa:3'], date: '04 fév 2026' },
    { name: 'Santé.ga', desc: 'Portail e-santé national', scopes: ['profile', 'loa:3'], date: '21 jan 2026' },
    { name: 'Impots.ga', desc: 'DGI — déclarations en ligne', scopes: ['profile', 'tax_id'], date: '08 jan 2026' },
  ];
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 28px' }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: t.ink, letterSpacing: -0.4 }}>Consentements</div>
      <div style={{ fontSize: 14, color: t.muted, marginTop: 8 }}>{apps.length} applications ont accès à vos données IDN. Révocable à tout moment.</div>
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {apps.map((a, i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: t.surface2, color: t.ink, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{a.name}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{a.desc} · autorisé le {a.date}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {a.scopes.map(s => <span key={s} style={{ fontSize: 11, fontFamily: idnTokens.mono, padding: '2px 8px', borderRadius: 9999, background: t.surface2, color: t.ink2 }}>{s}</span>)}
              </div>
            </div>
            <IdnButton t={t} variant="danger" size="sm">Révoquer</IdnButton>
          </div>
        ))}
      </div>
    </div>
  );
}

// KYC L2 — desktop (single-page summary)
function CWKyc({ t }) {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 28px' }}>
      <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>VÉRIFICATION D'IDENTITÉ · NIVEAU 2</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: t.ink, marginTop: 6, letterSpacing: -0.4 }}>Passons au Niveau 2</div>
      <div style={{ fontSize: 14, color: t.muted, marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>Trois étapes pour passer du Niveau 1 (email vérifié) au Niveau 2 (substantiel). Comptez environ 5 minutes.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 28 }}>
        {[
          { n: '01', t: 'Document d\'identité', d: 'Photographiez votre CNI gabonaise recto-verso. Cadrage automatique.', icon: IdnIcons.doc, status: 'à faire' },
          { n: '02', t: 'Selfie vivant', d: 'Détection de présence + face match avec le document.', icon: IdnIcons.camera, status: 'à faire' },
          { n: '03', t: 'Validation', d: 'Revue automatique puis manuelle si nécessaire (24-48h).', icon: IdnIcons.check, status: 'à faire' },
        ].map((s, i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, fontWeight: 600 }}>{s.n}</div>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.surface2, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, marginTop: 14 }}>{s.t}</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>{s.d}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 10, fontFamily: idnTokens.mono }}>{s.status}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 12, background: t.dark ? '#10243A' : idnTokens.blueSoft }}>
        <span style={{ color: idnTokens.blue }}>{IdnIcons.shield}</span>
        <div style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>Le KYC peut s'effectuer plus confortablement depuis l'app mobile (caméra). Voulez-vous y continuer ?</div>
        <IdnButton t={t} variant="ghost" size="sm" leadIcon={IdnIcons.qr}>Continuer sur mobile</IdnButton>
      </div>
      <div style={{ marginTop: 20 }}>
        <IdnButton t={t} variant="primary" size="lg" leadIcon={IdnIcons.camera}>Démarrer ici</IdnButton>
      </div>
    </div>
  );
}

function CWKycStatus({ t }) {
  return (
    <div style={{ maxWidth: 580, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: t.ink, marginTop: 22, letterSpacing: -0.3 }}>Demande envoyée</div>
      <div style={{ fontSize: 14, color: t.muted, marginTop: 10, lineHeight: 1.6 }}>Votre dossier passe en revue automatique puis manuelle si nécessaire.<br/>Vous serez notifié·e sous 24-48h par email.</div>
      <div style={{ marginTop: 28, padding: 18, borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`, fontFamily: idnTokens.mono, fontSize: 12, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: t.muted }}><span>RÉFÉRENCE</span><span style={{ color: t.ink }}>KYC-7K9-3F2</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: t.muted, marginTop: 8 }}><span>STATUT</span><span style={{ color: idnTokens.blue }}>en cours d'examen</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: t.muted, marginTop: 8 }}><span>NIVEAU CIBLE</span><span style={{ color: t.ink }}>2 — Substantiel</span></div>
      </div>
      <IdnButton t={t} variant="primary" size="lg" full style={{ marginTop: 20 }}>Retour à l'accueil</IdnButton>
    </div>
  );
}

Object.assign(window, { CitizenWeb });
