// IDN — Parcours d'inscription souverain
// L'identifiant @idn.ga est créé pendant l'inscription, avec suggestions
// intelligentes basées sur l'identité pivot.
//
// Parcours :
//   1. Profil
//   2. Identité pivot (nom/prénom — nécessaire pour les suggestions)
//   3. Choisir l'identifiant @idn.ga (3 variations)
//   4. Mot de passe
//   5. Téléphone
//   6. Code de vérification
//   7. PIN
//   8. Confirmation (avec carte d'identifiant)

// ─────────────────────────────────────────────────────────────
// Données partagées — suggestions générées à partir du pivot
// ─────────────────────────────────────────────────────────────
const PIVOT_DEMO = { prenom: 'Aïssatou', nom: 'Mboumba', annee: '92' };

const IDN_SUGGESTIONS = [
  { handle: 'aissatou.mboumba',     avail: true,  pop: 'Recommandé',   format: 'prénom.nom' },
  { handle: 'a.mboumba',            avail: true,  pop: null,           format: 'p.nom' },
  { handle: 'aissatou.m',           avail: true,  pop: null,           format: 'prénom.n' },
  { handle: 'mboumba.aissatou',     avail: true,  pop: null,           format: 'nom.prénom' },
  { handle: 'aissatou.mboumba.92',  avail: true,  pop: null,           format: 'prénom.nom.année' },
  { handle: 'aissatou_mboumba',     avail: true,  pop: null,           format: 'prénom_nom' },
];

// Helper : visuel de disponibilité (vert/rouge)
function AvailDot({ ok, t }) {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: 9999,
      background: ok ? idnTokens.green : '#B83A3A',
      flexShrink: 0,
    }}/>
  );
}

// Helper : badge "@idn.ga" suffixe verrouillé
function IdnSuffix({ t, dark }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 6,
      background: dark ? '#0F2A18' : idnTokens.greenSoft,
      color: idnTokens.green,
      fontFamily: idnTokens.mono, fontSize: 13, fontWeight: 600,
      letterSpacing: -0.2,
    }}>
      @idn.ga
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — VARIATION A : Suggestions chips (style Gmail)
// ─────────────────────────────────────────────────────────────
function ScrSignupIdnA({ t }) {
  const [val, setVal] = React.useState('aissatou.mboumba');
  return (
    <NStepShell t={t} step={3} total={7} title="Votre adresse IDN" sub="Choisissez l'adresse qui vous identifiera auprès de l'administration." primary="Réserver cette adresse">
      {/* Input principal avec suffixe verrouillé */}
      <div style={{ display: 'block' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>Identifiant</div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: t.surface,
          border: `1.5px solid ${idnTokens.green}`,
          boxShadow: `0 0 0 3px ${t.dark ? 'rgba(14,124,58,0.25)' : 'rgba(14,124,58,0.12)'}`,
          borderRadius: 10, padding: '0 12px', height: 52,
        }}>
          <input value={val} onChange={(e)=>setVal(e.target.value)} style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 16, color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500, minWidth: 0,
          }}/>
          <span style={{
            fontFamily: idnTokens.mono, fontSize: 16, color: t.muted, fontWeight: 500,
            padding: '0 0 0 2px', flexShrink: 0,
          }}>@idn.ga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: idnTokens.green, marginTop: 8, fontWeight: 500 }}>
          <AvailDot ok={true} t={t}/>
          <span>Disponible — vous pouvez la réserver</span>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>SUGGESTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {IDN_SUGGESTIONS.slice(0, 4).map((s, i) => {
            const sel = s.handle === val;
            return (
              <div key={s.handle} onClick={()=>setVal(s.handle)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                border: `1px solid ${sel ? idnTokens.green : t.border}`,
                background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                borderRadius: 10, cursor: 'pointer',
              }}>
                <AvailDot ok={true} t={t}/>
                <div style={{ flex: 1, minWidth: 0, fontFamily: idnTokens.mono, fontSize: 13, color: t.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.handle}<span style={{ color: t.muted }}>@idn.ga</span>
                </div>
                {s.pop && <span style={{ fontSize: 10.5, fontWeight: 600, color: idnTokens.green, padding: '2px 8px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, letterSpacing: 0.2 }}>{s.pop}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info card */}
      <div style={{ background: t.dark ? '#10243A' : idnTokens.blueSoft, padding: 12, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
        <span style={{ color: idnTokens.blue, flexShrink: 0, marginTop: 1 }}>{IdnIcons.shield}</span>
        <div style={{ fontSize: 11.5, color: t.ink2, lineHeight: 1.5 }}>L'adresse <span style={{ fontFamily: idnTokens.mono, color: t.ink, fontWeight: 600 }}>@idn.ga</span> est hébergée sur le sol gabonais. Elle est définitive et reste valide à vie.</div>
      </div>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — VARIATION B : Builder avec sélection de format
// ─────────────────────────────────────────────────────────────
function ScrSignupIdnB({ t }) {
  const [fmt, setFmt] = React.useState(0);
  const formats = [
    { id: 'pn',    label: 'prénom.nom',       sample: 'aissatou.mboumba' },
    { id: 'p_n',   label: 'p.nom',            sample: 'a.mboumba' },
    { id: 'n_p',   label: 'nom.prénom',       sample: 'mboumba.aissatou' },
    { id: 'p_n_a', label: 'prénom.nom.année', sample: 'aissatou.mboumba.92' },
  ];
  const sel = formats[fmt];

  return (
    <NStepShell t={t} step={3} total={7} title="Choisissez votre format" sub="Pour Aïssatou Mboumba — votre identifiant @idn.ga, à vie." primary="Continuer">
      {/* Preview géante */}
      <div style={{
        padding: '22px 18px', borderRadius: 14,
        background: t.dark ? '#0F2A18' : idnTokens.greenSoft,
        border: `1.5px solid ${idnTokens.green}`,
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: idnTokens.mono, fontSize: 9, fontWeight: 700, color: idnTokens.green, letterSpacing: 1.4 }}>IDN ID</div>
        <div style={{ fontFamily: idnTokens.mono, fontSize: 20, fontWeight: 600, color: t.ink, letterSpacing: -0.5, wordBreak: 'break-all', lineHeight: 1.3 }}>
          {sel.sample}<span style={{ color: idnTokens.green }}>@idn.ga</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '3px 9px', borderRadius: 9999, background: t.surface, fontSize: 10.5, fontWeight: 600, color: idnTokens.green }}>
          <AvailDot ok={true} t={t}/> Disponible
        </div>
      </div>

      {/* Format chips */}
      <div>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>FORMAT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {formats.map((f, i) => {
            const isSel = i === fmt;
            return (
              <div key={f.id} onClick={()=>setFmt(i)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                border: `1px solid ${isSel ? idnTokens.green : t.border}`,
                background: isSel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                borderRadius: 10, cursor: 'pointer',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, border: `1.5px solid ${isSel ? idnTokens.green : t.border}`, background: isSel ? idnTokens.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSel && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: t.ink, fontWeight: 500 }}>{f.label}</div>
                  <div style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.sample}@idn.ga</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom */}
      <button style={{ background: 'none', border: `1px dashed ${t.border}`, color: t.ink2, padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {IdnIcons.plus} Choisir un identifiant personnalisé
      </button>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — VARIATION C : "Carte d'identifiant" hero
// ─────────────────────────────────────────────────────────────
function ScrSignupIdnC({ t }) {
  return (
    <NStepShell t={t} step={3} total={7} title="Votre adresse @idn.ga" sub="Choisissez l'adresse qui vous identifiera à vie auprès de l'administration." primary="C'est mon adresse">
      {/* Carte hero */}
      <div style={{
        background: 'linear-gradient(140deg,#0E7C3A 0%,#0A5C2C 100%)',
        color: '#fff', padding: 20, borderRadius: 16, position: 'relative',
        boxShadow: t.dark ? '0 8px 24px rgba(14,124,58,0.4)' : '0 8px 24px rgba(14,124,58,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IdnFlagBars width={22} height={2}/>
            <span style={{ fontSize: 9, letterSpacing: 1.3, fontWeight: 700, opacity: 0.92 }}>RÉPUBLIQUE GABONAISE</span>
          </div>
          <span style={{ fontFamily: idnTokens.mono, fontSize: 9, letterSpacing: 1, opacity: 0.7 }}>IDN ID · v1.2</span>
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: 1.2, fontWeight: 600, opacity: 0.7 }}>VOTRE IDENTIFIANT</div>
        <div style={{ fontFamily: idnTokens.mono, fontSize: 18, fontWeight: 600, marginTop: 6, letterSpacing: -0.3, wordBreak: 'break-all' }}>
          aissatou.mboumba<br/><span style={{ opacity: 0.85 }}>@idn.ga</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, fontSize: 10.5, opacity: 0.8 }}>
          <div>
            <div style={{ opacity: 0.6, fontSize: 9, letterSpacing: 1 }}>TITULAIRE</div>
            <div style={{ marginTop: 2, fontWeight: 500 }}>Aïssatou Mboumba</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ opacity: 0.6, fontSize: 9, letterSpacing: 1 }}>VALIDE</div>
            <div style={{ marginTop: 2, fontWeight: 500 }}>à vie</div>
          </div>
        </div>
      </div>

      {/* Picker tabs */}
      <div style={{ marginTop: -4 }}>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>CHANGER POUR…</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {IDN_SUGGESTIONS.slice(1, 5).map((s) => (
            <button key={s.handle} style={{
              padding: '8px 12px', borderRadius: 9999,
              border: `1px solid ${t.border}`, background: t.surface,
              fontFamily: idnTokens.mono, fontSize: 11.5, color: t.ink2, fontWeight: 500,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <AvailDot ok={true} t={t}/>
              {s.handle}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.5, marginTop: 6 }}>
        L'identifiant est définitif. Vous pouvez ajouter un alias plus tard depuis vos paramètres.
      </div>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — Erreur : adresse déjà prise
// ─────────────────────────────────────────────────────────────
function ScrSignupIdnTaken({ t }) {
  const [val] = React.useState('aissatou.mboumba');
  return (
    <NStepShell t={t} step={3} total={7} title="Votre adresse IDN" sub="Choisissez l'adresse qui vous identifiera auprès de l'administration." primary="Réserver a.mboumba">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>Identifiant</div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: t.surface,
          border: `1.5px solid #B83A3A`,
          boxShadow: `0 0 0 3px rgba(184,58,58,0.10)`,
          borderRadius: 10, padding: '0 12px', height: 52,
        }}>
          <input value={val} readOnly style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 16, color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500, minWidth: 0,
          }}/>
          <span style={{ fontFamily: idnTokens.mono, fontSize: 16, color: t.muted, fontWeight: 500, flexShrink: 0 }}>@idn.ga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#B83A3A', marginTop: 8, fontWeight: 500 }}>
          <AvailDot ok={false} t={t}/>
          <span>Cette adresse est déjà attribuée à un autre citoyen</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>DISPONIBLES POUR VOUS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { handle: 'a.mboumba',           sel: true },
            { handle: 'aissatou.m',          sel: false },
            { handle: 'aissatou.mboumba.92', sel: false },
            { handle: 'aissatou-mboumba',    sel: false },
          ].map((s) => (
            <div key={s.handle} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              border: `1px solid ${s.sel ? idnTokens.green : t.border}`,
              background: s.sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
              borderRadius: 10,
            }}>
              <AvailDot ok={true} t={t}/>
              <div style={{ flex: 1, minWidth: 0, fontFamily: idnTokens.mono, fontSize: 13, color: t.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.handle}<span style={{ color: t.muted }}>@idn.ga</span>
              </div>
              {s.sel && <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span>}
            </div>
          ))}
        </div>
      </div>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — Mot de passe (étape 4)
// ─────────────────────────────────────────────────────────────
function ScrSignupPasswordIdn({ t }) {
  return (
    <NStepShell t={t} step={4} total={7} title="Sécurisez votre compte" sub="Mot de passe associé à votre adresse @idn.ga." primary="Continuer">
      <div style={{
        padding: '12px 14px', borderRadius: 10, background: t.surface,
        border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.mail}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>VOTRE ADRESSE IDN</div>
          <div style={{ fontFamily: idnTokens.mono, fontSize: 13, color: t.ink, fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>aissatou.mboumba@idn.ga</div>
        </div>
        <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span>
      </div>

      <IdnInput t={t} label="Mot de passe" value="••••••••••••" onChange={()=>{}} type="password" leadIcon={IdnIcons.lock}/>
      <IdnInput t={t} label="Confirmer" value="••••••••••••" onChange={()=>{}} type="password" leadIcon={IdnIcons.lock}/>

      <div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[idnTokens.green, idnTokens.green, idnTokens.green, t.border].map((c, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: c }}/>)}
        </div>
        <div style={{ fontSize: 11.5, color: t.muted, marginTop: 8, lineHeight: 1.5 }}>
          Force : <span style={{ color: idnTokens.green, fontWeight: 600 }}>bonne</span> · 12 caractères, chiffres, symbole
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: t.ink2 }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: idnTokens.green }}/>
        <span>J'accepte les <u style={{ color: idnTokens.green }}>CGU IDN</u> et la <u style={{ color: idnTokens.green }}>politique de confidentialité</u>.</span>
      </label>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — Téléphone
// ─────────────────────────────────────────────────────────────
function ScrSignupPhone({ t }) {
  return (
    <NStepShell t={t} step={5} total={7} title="Numéro de téléphone" sub="Pour sécuriser votre compte et recevoir les alertes importantes." primary="Recevoir le code">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>Numéro de téléphone</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: 10, height: 48,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRight: `1px solid ${t.border}`, height: '100%' }}>
            <div style={{ display: 'flex', gap: 2, height: 9 }}>
              <div style={{ flex: 1, width: 4, background: idnTokens.green, borderRadius: 1 }}/>
              <div style={{ flex: 1, width: 4, background: idnTokens.yellow, borderRadius: 1 }}/>
              <div style={{ flex: 1, width: 4, background: idnTokens.blue, borderRadius: 1 }}/>
            </div>
            <span style={{ fontSize: 13, color: t.ink, fontFamily: idnTokens.mono }}>+241</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <input value="06 22 14 89" onChange={()=>{}} style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 16, color: t.ink, fontFamily: idnTokens.mono, padding: '0 12px',
          }}/>
        </div>
      </div>

      <div style={{ background: t.dark ? '#10243A' : idnTokens.blueSoft, padding: 14, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: idnTokens.blue, flexShrink: 0, marginTop: 1 }}>{IdnIcons.shield}</span>
        <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: t.ink, marginBottom: 2 }}>À quoi sert votre numéro</div>
          Récupération de compte, double authentification, alertes de connexion. Il est chiffré et n'est jamais partagé avec les services tiers.
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: t.ink2 }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: idnTokens.green }}/>
        <span>Utiliser ce numéro pour les <b style={{ color: t.ink }}>notifications de sécurité</b> (connexion sur un nouvel appareil, etc.).</span>
      </label>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — Vérification du numéro
// ─────────────────────────────────────────────────────────────
function ScrSignupSmsOtp({ t }) {
  const code = ['7','3','9','1','',''];
  return (
    <NStepShell t={t} step={6} total={7} title="Vérifiez votre numéro" sub={<>Code envoyé au <b style={{ color: t.ink }}>+241 06 22 14 89</b></>} primary="Vérifier" secondary="Modifier le numéro">
      <div style={{ display: 'flex', gap: 8 }}>
        {code.map((c, i) => (
          <div key={i} style={{ flex: 1, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, fontFamily: idnTokens.mono, color: t.ink, background: t.surface, border: `1.5px solid ${c ? idnTokens.green : t.border}`, borderRadius: 12 }}>{c}</div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted }}>
        <span>Expire dans 0:38</span>
        <span style={{ color: idnTokens.green, fontWeight: 500 }}>Renvoyer le code</span>
      </div>

      {/* Visual: phone with SMS preview */}
      <div style={{
        marginTop: 8, padding: 14, borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: t.dark ? '#10243A' : idnTokens.blueSoft, color: idnTokens.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>SMS</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: t.muted }}>
            <span style={{ fontWeight: 600, color: t.ink }}>IDN-GA</span>
            <span>maintenant</span>
          </div>
          <div style={{ fontSize: 12.5, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Votre code IDN est <span style={{ fontFamily: idnTokens.mono, fontWeight: 700, color: t.ink }}>739142</span>. Valable 5 min. Ne le partagez jamais.
          </div>
        </div>
      </div>
    </NStepShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE — Confirmation finale avec carte IDN
// ─────────────────────────────────────────────────────────────
function ScrSignupIdnDone({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 22px 22px', background: t.bg }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 9999, background: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4 }}>Bienvenue, Aïssatou.</div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 6, lineHeight: 1.5, maxWidth: 280, margin: '6px auto 0' }}>Votre identité numérique est active.</div>
      </div>

      {/* Carte IDN — adresse souveraine */}
      <div style={{
        marginTop: 22,
        background: 'linear-gradient(140deg,#0E7C3A 0%,#0A5C2C 100%)',
        color: '#fff', padding: 20, borderRadius: 16, position: 'relative',
        boxShadow: '0 8px 24px rgba(14,124,58,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IdnFlagBars width={26} height={2.5}/>
          <span style={{ fontFamily: idnTokens.mono, fontSize: 9, letterSpacing: 1, opacity: 0.75 }}>IDN ID · GA-7K3J-9Q2L</span>
        </div>
        <div style={{ marginTop: 22, fontSize: 9.5, letterSpacing: 1.3, fontWeight: 700, opacity: 0.75 }}>VOTRE ADRESSE IDN</div>
        <div style={{ fontFamily: idnTokens.mono, fontSize: 17, fontWeight: 600, marginTop: 6, letterSpacing: -0.3, wordBreak: 'break-all' }}>
          aissatou.mboumba<span style={{ opacity: 0.85 }}>@idn.ga</span>
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.6 }}>TITULAIRE</div>
            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>Aïssatou Mboumba</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.18)', fontSize: 10, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }}/>
            Niveau 1
          </div>
        </div>
      </div>

      {/* Récap utile */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { l: 'Téléphone',     v: '+241 06 22 14 89' },
          { l: 'Mot de passe', v: 'défini · fort' },
          { l: 'Code PIN',     v: '••••••' },
        ].map((r,i)=>(
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: t.muted }}>{r.l}</span>
            <span style={{ color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500 }}>{r.v}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}/>
      <IdnButton t={t} variant="primary" size="lg" full>Vérifier mon identité · Niveau 2</IdnButton>
      <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, fontWeight: 500, padding: 14, cursor: 'pointer' }}>Continuer vers l'accueil</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DESKTOP — Variation A (suggestions chips)
// ─────────────────────────────────────────────────────────────
function CWSignupIdnA({ t }) {
  return (
    <CWWizard t={t} step={3} total={7} title="Votre adresse IDN" sub="L'adresse qui vous identifiera auprès de l'administration gabonaise. Définitive, valide à vie." primary="Réserver cette adresse">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>Identifiant</div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: t.surface, border: `1.5px solid ${idnTokens.green}`,
          boxShadow: `0 0 0 3px ${t.dark ? 'rgba(14,124,58,0.25)' : 'rgba(14,124,58,0.12)'}`,
          borderRadius: 10, padding: '0 14px', height: 56,
        }}>
          <input value="aissatou.mboumba" readOnly style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 18, color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500,
          }}/>
          <span style={{ fontFamily: idnTokens.mono, fontSize: 18, color: t.muted, fontWeight: 500 }}>@idn.ga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: idnTokens.green, marginTop: 10, fontWeight: 500 }}>
          <AvailDot ok={true} t={t}/>
          <span>Disponible — vous pouvez la réserver</span>
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginBottom: 12 }}>SUGGESTIONS POUR AÏSSATOU MBOUMBA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {IDN_SUGGESTIONS.map((s, i) => {
            const sel = i === 0;
            return (
              <div key={s.handle} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                border: `1px solid ${sel ? idnTokens.green : t.border}`,
                background: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                borderRadius: 10, cursor: 'pointer',
              }}>
                <AvailDot ok={true} t={t}/>
                <div style={{ flex: 1, minWidth: 0, fontFamily: idnTokens.mono, fontSize: 12.5, color: t.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.handle}<span style={{ color: t.muted }}>@idn.ga</span></div>
                {s.pop && <span style={{ fontSize: 10, fontWeight: 600, color: idnTokens.green, padding: '2px 7px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, letterSpacing: 0.2 }}>{s.pop}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 18, background: t.dark ? '#10243A' : idnTokens.blueSoft, padding: 14, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ color: idnTokens.blue, flexShrink: 0, marginTop: 1 }}>{IdnIcons.shield}</span>
        <div style={{ fontSize: 12.5, color: t.ink2, lineHeight: 1.5 }}>L'adresse <span style={{ fontFamily: idnTokens.mono, color: t.ink, fontWeight: 600 }}>@idn.ga</span> est hébergée sur le sol gabonais, chiffrée, et reste valide à vie. Vous pourrez ajouter un alias plus tard depuis vos paramètres.</div>
      </div>
    </CWWizard>
  );
}

// ─────────────────────────────────────────────────────────────
// DESKTOP — Variation B (split : carte preview + builder)
// ─────────────────────────────────────────────────────────────
function CWSignupIdnB({ t }) {
  return (
    <div style={{ maxWidth: 1080, margin: '40px auto', padding: '0 40px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {Array.from({length: 7}).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < 3 ? idnTokens.green : t.border }}/>
        ))}
      </div>
      <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>ÉTAPE 3 SUR 7</div>
      <div style={{ fontSize: 30, fontWeight: 600, color: t.ink, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 6 }}>Choisissez votre adresse @idn.ga</div>
      <div style={{ fontSize: 14, color: t.muted, marginTop: 10, maxWidth: 560 }}>Une adresse unique qui vous identifie partout sur les services de l'État. Définitive, valide à vie.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 32, marginTop: 32, alignItems: 'start' }}>
        {/* LEFT — Carte preview */}
        <div>
          <div style={{
            background: 'linear-gradient(140deg,#0E7C3A 0%,#0A5C2C 100%)',
            color: '#fff', padding: 28, borderRadius: 18, position: 'relative',
            boxShadow: '0 12px 32px rgba(14,124,58,0.18)',
            aspectRatio: '1.586/1',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IdnFlagBars width={28} height={2.5}/>
                <span style={{ fontSize: 10, letterSpacing: 1.3, fontWeight: 700, opacity: 0.92 }}>RÉPUBLIQUE GABONAISE</span>
              </div>
              <span style={{ fontFamily: idnTokens.mono, fontSize: 10, letterSpacing: 1, opacity: 0.7 }}>IDN · v1.2</span>
            </div>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: 1.3, fontWeight: 700, opacity: 0.7 }}>VOTRE ADRESSE IDN</div>
              <div style={{ fontFamily: idnTokens.mono, fontSize: 22, fontWeight: 600, marginTop: 8, letterSpacing: -0.4 }}>
                aissatou.mboumba<span style={{ opacity: 0.85 }}>@idn.ga</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11 }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: 1.2, opacity: 0.6, fontWeight: 700 }}>TITULAIRE</div>
                <div style={{ marginTop: 4, fontWeight: 500 }}>Aïssatou Mboumba</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9.5, letterSpacing: 1.2, opacity: 0.6, fontWeight: 700 }}>VALIDITÉ</div>
                <div style={{ marginTop: 4, fontWeight: 500 }}>À vie</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 12, lineHeight: 1.5 }}>L'aperçu se met à jour en temps réel. L'adresse est verrouillée après réservation.</div>
        </div>

        {/* RIGHT — Builder */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>Identifiant</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: t.surface, border: `1.5px solid ${idnTokens.green}`,
            boxShadow: `0 0 0 3px ${t.dark ? 'rgba(14,124,58,0.25)' : 'rgba(14,124,58,0.12)'}`,
            borderRadius: 10, padding: '0 14px', height: 52,
          }}>
            <input value="aissatou.mboumba" readOnly style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 16, color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500,
            }}/>
            <span style={{ fontFamily: idnTokens.mono, fontSize: 16, color: t.muted, fontWeight: 500 }}>@idn.ga</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: idnTokens.green, marginTop: 8, fontWeight: 500 }}>
            <AvailDot ok={true} t={t}/> Disponible
          </div>

          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>OU CHOISISSEZ UN FORMAT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'prénom.nom',       sample: 'aissatou.mboumba',    sel: true },
              { label: 'p.nom',            sample: 'a.mboumba',           sel: false },
              { label: 'prénom.n',         sample: 'aissatou.m',          sel: false },
              { label: 'nom.prénom',       sample: 'mboumba.aissatou',    sel: false },
              { label: 'prénom.nom.année', sample: 'aissatou.mboumba.92', sel: false },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                border: `1px solid ${f.sel ? idnTokens.green : t.border}`,
                background: f.sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                borderRadius: 10, cursor: 'pointer',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, border: `1.5px solid ${f.sel ? idnTokens.green : t.border}`, background: f.sel ? idnTokens.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.sel && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }}/>}
                </div>
                <div style={{ flex: 1, fontSize: 12.5, color: t.ink, fontWeight: 500 }}>{f.label}</div>
                <div style={{ fontFamily: idnTokens.mono, fontSize: 12, color: t.muted }}>{f.sample}@idn.ga</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 32, justifyContent: 'flex-end' }}>
        <IdnButton t={t} variant="ghost" size="lg">Retour</IdnButton>
        <IdnButton t={t} variant="primary" size="lg">Réserver cette adresse</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DESKTOP — Téléphone de récupération
// ─────────────────────────────────────────────────────────────
function CWSignupPhone({ t }) {
  return (
    <CWWizard t={t} step={5} total={7} title="Numéro de téléphone" sub="Pour sécuriser votre compte : récupération, double authentification et alertes de connexion." primary="Recevoir le code">
      {/* Recap card */}
      <div style={{
        padding: '14px 16px', borderRadius: 10, background: t.surface,
        border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.mail}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>ADRESSE IDN RÉSERVÉE</div>
          <div style={{ fontFamily: idnTokens.mono, fontSize: 14, color: t.ink, fontWeight: 600, marginTop: 2 }}>aissatou.mboumba@idn.ga</div>
        </div>
        <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>Numéro de téléphone</div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: t.surface, border: `1.5px solid ${idnTokens.green}`,
        boxShadow: `0 0 0 3px ${t.dark ? 'rgba(14,124,58,0.25)' : 'rgba(14,124,58,0.12)'}`,
        borderRadius: 10, height: 52,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRight: `1px solid ${t.border}`, height: '100%' }}>
          <div style={{ display: 'flex', gap: 2, height: 10 }}>
            <div style={{ width: 4, background: idnTokens.green, borderRadius: 1 }}/>
            <div style={{ width: 4, background: idnTokens.yellow, borderRadius: 1 }}/>
            <div style={{ width: 4, background: idnTokens.blue, borderRadius: 1 }}/>
          </div>
          <span style={{ fontSize: 14, color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500 }}>+241</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <input value="06 22 14 89" onChange={()=>{}} style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 16, color: t.ink, fontFamily: idnTokens.mono, padding: '0 14px',
        }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
        {[
          { i: IdnIcons.shield,  l: 'Récupération de compte', d: 'Si vous oubliez votre mot de passe.' },
          { i: IdnIcons.lock,    l: 'Double authentification', d: 'Activée par défaut, désactivable.' },
          { i: IdnIcons.bell,    l: 'Alertes de sécurité',    d: 'Nouvelle connexion, demande KYC.' },
        ].map((b, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 10, background: t.surface, border: `1px solid ${t.border}` }}>
            <span style={{ color: idnTokens.green }}>{b.i}</span>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.ink, marginTop: 8 }}>{b.l}</div>
            <div style={{ fontSize: 11.5, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>{b.d}</div>
          </div>
        ))}
      </div>
    </CWWizard>
  );
}

// ─────────────────────────────────────────────────────────────
// DESKTOP — OTP SMS
// ─────────────────────────────────────────────────────────────
function CWSignupSmsOtp({ t }) {
  const code = ['7','3','9','1','',''];
  return (
    <CWWizard t={t} step={6} total={7} title="Vérifiez votre numéro" sub={<>Code à 6 chiffres envoyé au <b style={{ color: t.ink }}>+241 06 22 14 89</b></>} primary="Vérifier">
      <div style={{ display: 'flex', gap: 10 }}>
        {code.map((c, i) => (
          <div key={i} style={{ flex: 1, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, fontFamily: idnTokens.mono, color: t.ink, background: t.surface, border: `1.5px solid ${c ? idnTokens.green : t.border}`, borderRadius: 12 }}>{c}</div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.muted, marginTop: 14 }}>
        <span>Le code expire dans 0:38</span>
        <span style={{ color: idnTokens.green, fontWeight: 500, cursor: 'pointer' }}>Renvoyer le code</span>
      </div>

      <div style={{ marginTop: 22, padding: 16, borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: t.dark ? '#10243A' : idnTokens.blueSoft, color: idnTokens.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11.5, fontWeight: 700 }}>SMS</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted }}>
            <span style={{ fontWeight: 600, color: t.ink }}>IDN-GA</span>
            <span>maintenant</span>
          </div>
          <div style={{ fontSize: 13, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Votre code IDN est <span style={{ fontFamily: idnTokens.mono, fontWeight: 700, color: t.ink }}>739142</span>. Valable 5 min. Ne le partagez avec personne.
          </div>
        </div>
      </div>
    </CWWizard>
  );
}

// ─────────────────────────────────────────────────────────────
// DESKTOP — Confirmation finale
// ─────────────────────────────────────────────────────────────
function CWSignupIdnDone({ t }) {
  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 40px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: t.ink, marginTop: 22, letterSpacing: -0.5 }}>Bienvenue, Aïssatou.</div>
      <div style={{ fontSize: 14, color: t.muted, marginTop: 10, lineHeight: 1.6, maxWidth: 480, margin: '10px auto 0' }}>Votre identité numérique est active. Utilisez votre adresse IDN pour vous connecter aux services de l'État et recevoir votre courrier dans iBoîte.</div>

      {/* Carte hero */}
      <div style={{
        margin: '32px auto 0', maxWidth: 480,
        background: 'linear-gradient(140deg,#0E7C3A 0%,#0A5C2C 100%)',
        color: '#fff', padding: 28, borderRadius: 18,
        boxShadow: '0 12px 32px rgba(14,124,58,0.18)',
        textAlign: 'left',
        aspectRatio: '1.586/1',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IdnFlagBars width={28} height={2.5}/>
            <span style={{ fontSize: 10, letterSpacing: 1.3, fontWeight: 700, opacity: 0.92 }}>RÉPUBLIQUE GABONAISE</span>
          </div>
          <span style={{ fontFamily: idnTokens.mono, fontSize: 10, letterSpacing: 1, opacity: 0.7 }}>GA-7K3J-9Q2L</span>
        </div>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: 1.3, fontWeight: 700, opacity: 0.7 }}>VOTRE ADRESSE IDN</div>
          <div style={{ fontFamily: idnTokens.mono, fontSize: 22, fontWeight: 600, marginTop: 8, letterSpacing: -0.4 }}>
            aissatou.mboumba<span style={{ opacity: 0.85 }}>@idn.ga</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11 }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: 1.2, opacity: 0.6, fontWeight: 700 }}>TITULAIRE</div>
            <div style={{ marginTop: 4, fontWeight: 500 }}>Aïssatou Mboumba</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 9999, background: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }}/> Niveau 1
          </div>
        </div>
      </div>

      {/* Récap */}
      <div style={{ marginTop: 22, padding: 18, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
        {[
          { l: 'Téléphone',     v: '+241 06 22 14 89' },
          { l: 'Mot de passe', v: 'défini · fort' },
          { l: 'Code PIN',     v: '6 chiffres' },
        ].map((r,i)=>(
          <div key={i}>
            <div style={{ fontSize: 10.5, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>{r.l.toUpperCase()}</div>
            <div style={{ fontSize: 13, color: t.ink, fontFamily: idnTokens.mono, fontWeight: 500, marginTop: 4 }}>{r.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'center' }}>
        <IdnButton t={t} variant="ghost" size="lg">Continuer vers l'accueil</IdnButton>
        <IdnButton t={t} variant="primary" size="lg">Vérifier mon identité · Niveau 2</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────
Object.assign(window, {
  ScrSignupIdnA, ScrSignupIdnB, ScrSignupIdnC, ScrSignupIdnTaken,
  ScrSignupPasswordIdn, ScrSignupPhone, ScrSignupSmsOtp, ScrSignupIdnDone,
  CWSignupIdnA, CWSignupIdnB, CWSignupPhone, CWSignupSmsOtp, CWSignupIdnDone,
});
