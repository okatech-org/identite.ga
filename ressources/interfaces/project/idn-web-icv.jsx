// IDN — iCV web (desktop)
// Vue principale 2 panneaux, dashboard, édition, galerie thèmes, import, ATS

function ICVWeb({ t, screen = 'home', user = DEMO_USERS.citoyen }) {
  return (
    <BrowserChrome t={t} url={`https://idn.ga/icv${screen === 'home' ? '' : `/${screen}`}`} w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden', position: 'relative' }}>
        <CWNav t={t} user={user} screen="home"/>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {screen === 'home'         && <ICVWebHome t={t}/>}
          {screen === 'dashboard'    && <ICVWebDashboard t={t}/>}
          {screen === 'edit-exp'     && <ICVWebEditExp t={t}/>}
          {screen === 'edit-ai'      && <ICVWebEditExp t={t} aiState="suggestion"/>}
          {screen === 'empty'        && <ICVWebEmpty t={t}/>}
          {/* Overlays gardent l'accueil en fond pour le contexte */}
          {(screen === 'themes-gallery' || screen === 'import' || screen === 'ats') && <ICVWebHome t={t}/>}
        </div>
        {screen === 'themes-gallery' && <ICVWebOverlay t={t}><ICVWebThemesGallery t={t}/></ICVWebOverlay>}
        {screen === 'import'         && <ICVWebOverlay t={t}><ICVWebImport t={t}/></ICVWebOverlay>}
        {screen === 'ats'            && <ICVWebOverlay t={t}><ICVWebAts t={t}/></ICVWebOverlay>}
      </div>
    </BrowserChrome>
  );
}

// Sous-page Home page rendue d'abord pour ts overlay screens
function ICVWebOverlay({ t, children }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, top: 60, background: 'rgba(10,10,10,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
        {children}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-header iCV (partagé)
// ─────────────────────────────────────────────────────────────
function ICVWebSubheader({ t, title = 'iCV', sub, right }) {
  return (
    <div style={{ padding: '16px 28px 14px', borderBottom: `1px solid ${t.border}`, background: t.surface, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: t.dark ? '#2A1426' : '#FCE7F3', color: ICV_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><circle cx="12" cy="11" r="2.2"/><path d="M8.5 17c.7-1.6 2-2.3 3.5-2.3s2.8.7 3.5 2.3"/></svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, letterSpacing: -0.3, lineHeight: 1.1 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME — vue principale 2 panneaux
// ─────────────────────────────────────────────────────────────
function ICVWebHome({ t }) {
  const activeTheme = ICV_THEMES[4]; // creative
  const groups = [['Classique & Pro', ICV_THEMES.slice(0, 4)], ['Créatif & Moderne', ICV_THEMES.slice(4, 8)], ['Spécialisé', ICV_THEMES.slice(8, 12)]];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ICVWebSubheader t={t} title="iCV" sub="Créez et personnalisez votre CV professionnel" right={
        <div style={{ display: 'flex', gap: 8 }}>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 21c5-1 8-3 13-8l3-3-4-4-3 3c-5 5-7 8-8 13z"/><path d="M14 6l4 4"/></svg>}>Modifier</IdnButton>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>}>Importer</IdnButton>
          <IdnButton t={t} variant="primary" size="sm" leadIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>}>PDF</IdnButton>
        </div>
      }/>
      <div style={{ flex: 1, display: 'flex', gap: 14, padding: 14, overflow: 'hidden' }}>
        {/* Panneau gauche */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {/* Thèmes */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ color: ICV_ACCENT }}>{ICV_AI_ICONS['improve-summary']}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, flex: 1 }}>Choisir un thème</div>
            </div>
            {groups.map(([cat, themes]) => (
              <div key={cat} style={{ marginTop: 6 }}>
                <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, letterSpacing: 1.2, padding: '6px 0 4px' }}>{cat.toUpperCase()}</div>
                {themes.map(th => {
                  const sel = th.id === activeTheme.id;
                  return (
                    <button key={th.id} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: sel ? (t.dark ? '#2A1426' : 'rgba(236,72,153,0.10)') : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 9999, background: th.color, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: sel ? ICV_ACCENT : t.ink }}>{th.label}</div>
                        <div style={{ fontSize: 10.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{th.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Outils IA */}
          <div style={{ background: t.dark ? 'linear-gradient(180deg, rgba(168,85,247,0.10), transparent)' : 'linear-gradient(180deg, rgba(168,85,247,0.05), transparent)', border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ color: '#a855f7' }}>{ICV_AI_ICONS['improve-summary']}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, flex: 1 }}>Options IA</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ICV_AI_TOOLS.map(tool => (
                <button key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: t.dark ? tool.bgD : tool.bgL, color: tool.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ICV_AI_ICONS[tool.id]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{tool.label}</div>
                    <div style={{ fontSize: 10, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Profil */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>MON PROFIL</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{ICV_SAMPLE.firstName} {ICV_SAMPLE.lastName}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ICV_SAMPLE.email}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <ICVPill color={ICV_ACCENT} bg={t.dark ? '#2A1426' : '#FCE7F3'} sm>{ICV_SAMPLE.experiences.length} exp.</ICVPill>
              <ICVPill color="#3b82f6" bg={t.dark ? '#0F2640' : '#DBEAFE'} sm>{ICV_SAMPLE.skills.length} comp.</ICVPill>
            </div>
          </div>
        </div>

        {/* Panneau droit — aperçu */}
        <div style={{ flex: 1, background: t.dark ? '#181C16' : '#E5E4DE', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', position: 'relative' }}>
          <div style={{ width: 470, height: 664, position: 'relative' }}>
            <div style={{ transform: 'scale(1.47)', transformOrigin: 'top left', width: 320, height: 452 }}>
              <ICVPreviewA4 theme={activeTheme} data={ICV_SAMPLE} ink="#16170F" muted="#74766B"/>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, alignItems: 'center', padding: '6px 12px', borderRadius: 9999, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontFamily: idnTokens.mono, letterSpacing: 0.5 }}>
            <span>A4 · 210×297 mm</span>
            <span style={{ opacity: 0.6 }}>·</span>
            <span>1.47×</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD — Tableau de bord
// ─────────────────────────────────────────────────────────────
function ICVWebDashboard({ t }) {
  const score = 78;
  const r = 60, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const sections = [
    { id: 'exp', label: 'Expériences', count: '2 postes',   color: '#f97316', bgL: '#FFEDD5', bgD: '#2A1A0E', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
    { id: 'edu', label: 'Formation', count: '2 diplômes',   color: '#3b82f6', bgL: '#DBEAFE', bgD: '#0F2640', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5M21 9v6"/></svg> },
    { id: 'skill', label: 'Compétences', count: '5 skills', color: '#a855f7', bgL: '#F3E8FF', bgD: '#2A1542', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg> },
    { id: 'info', label: 'Infos', count: '100 %',           color: '#22c55e', bgL: '#DCFCE7', bgD: '#0F2818', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg> },
    { id: 'lang', label: 'Langues', count: '3 langues',     color: '#06b6d4', bgL: '#CFFAFE', bgD: '#0E2A33', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg> },
    { id: 'hobby', label: 'Hobbies', count: '0',            color: '#94a3b8', bgL: '#F1F5F9', bgD: '#1A1F26', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg> },
  ];
  const suggestions = [
    { title: 'Ajoutez vos diplômes manquants', desc: '2× plus d\'offres correspondantes',           impact: '+15 %' },
    { title: 'Validez vos compétences',         desc: 'Certifier anglais (TOEFL/IELTS)',             impact: '+10 %' },
    { title: 'Détaillez la dernière expérience',desc: 'Ajoutez 2-3 réalisations chiffrées',          impact: '+8 %' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ICVWebSubheader t={t} title="Tableau de bord iCV" sub={`Mis à jour aujourd'hui · ${ICV_SAMPLE.firstName} ${ICV_SAMPLE.lastName}`} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <IdnButton t={t} variant="ghost" size="sm">Partager</IdnButton>
          <IdnButton t={t} variant="primary" size="sm">Modifier mon CV</IdnButton>
        </div>
      }/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          {/* Score + suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22, textAlign: 'center' }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block', margin: '0 auto' }}>
                <circle cx="90" cy="90" r={r} fill="none" stroke={t.surface2} strokeWidth="12"/>
                <circle cx="90" cy="90" r={r} fill="none" stroke={idnTokens.green} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 90 90)"/>
                <text x="90" y="90" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 38, fontWeight: 700, fill: t.ink }}>{score}</text>
                <text x="90" y="112" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 11, fill: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>SCORE</text>
              </svg>
              <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, marginTop: 6, letterSpacing: -0.2 }}>Niveau Expert</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Profil attractif</div>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>SUGGESTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestions.map((s, i) => (
                  <button key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: t.dark ? t.surface2 : 'rgba(241,239,233,0.7)', border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: t.ink }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: idnTokens.green, whiteSpace: 'nowrap' }}>{s.impact}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sections du CV */}
          <div>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>SECTIONS DU CV</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {sections.map(s => (
                <button key={s.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: t.dark ? s.bgD : s.bgL, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{s.count}</div>
                  </div>
                  <span style={{ color: t.muted, opacity: 0.5 }}>{IdnIcons.arrow}</span>
                </button>
              ))}
            </div>

            {/* Mini aperçu en bas */}
            <div style={{ marginTop: 18, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 120, height: 170, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <div style={{ transform: 'scale(0.375)', transformOrigin: 'top left', width: 320, height: 452 }}>
                  <ICVPreviewA4 theme={ICV_THEMES[4]} data={ICV_SAMPLE} ink="#16170F" muted="#74766B"/>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 1 }}>APERÇU ACTUEL</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: t.ink, marginTop: 4 }}>Thème · <span style={{ color: ICV_THEMES[4].color }}>Créatif</span></div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Format A4 · Police {ICV_THEMES[4].font === 'serif' ? 'serif' : ICV_THEMES[4].font === 'mono' ? 'monospace' : 'sans-serif'}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <IdnButton t={t} variant="ghost" size="sm">Changer de thème</IdnButton>
                  <IdnButton t={t} variant="primary" size="sm" leadIcon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>}>Télécharger PDF</IdnButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EDIT — Expérience (centré max-w-3xl)
// ─────────────────────────────────────────────────────────────
function ICVWebEditExp({ t, aiState = 'idle' }) {
  const aiSuggestion = "En tant que Chef de Projet Digital, j'ai piloté la refonte complète de 3 plateformes e-commerce, augmentant le taux de conversion de 25%. J'ai coordonné une équipe agile de 8 développeurs et designers, assurant la livraison des sprints dans les délais.";
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px 28px 40px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button style={{ width: 40, height: 40, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 1 }}>ICV · ÉDITION</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: -0.4, marginTop: 2 }}>Ajouter une expérience</div>
          </div>
          <IdnButton t={t} variant="ghost" size="sm">Annuler</IdnButton>
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ICVWebField t={t} label="Intitulé du poste" value="Chef de Projet Digital" placeholder="ex: Chef de Projet Digital"/>
          <ICVWebField t={t} label="Entreprise" value="Agence Web Gabon" placeholder="ex: Agence Web Gabon"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ICVWebField t={t} label="Date de début" value="01/2022" type="date"/>
            <ICVWebField t={t} label="Date de fin" value="" placeholder="—" type="date"/>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.ink2 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: idnTokens.green }}/>Poste actuel
          </label>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.ink, flex: 1 }}>Description</span>
              <button style={{ background: t.dark ? '#0F2A18' : idnTokens.greenSoft, border: 'none', color: idnTokens.green, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9999 }}>
                {ICV_AI_ICONS['improve-summary']}
                Améliorer avec l'IA
              </button>
            </div>
            <div style={{
              background: t.dark ? '#0E110D' : '#F4F3EE',
              borderRadius: 14, padding: 14, boxShadow: t.dark ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
              minHeight: 130, fontSize: 13.5, color: t.ink, lineHeight: 1.55,
            }}>{aiState === 'suggestion' ? '' : 'Refonte de 3 plateformes e-commerce · +25% conversion · coord. 8 dev/designers.'}</div>
            {aiState === 'suggestion' && (
              <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: t.dark ? '#0F2818' : '#DCFCE7', border: `1px solid ${t.dark ? '#0F4A22' : '#86EFAC'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803D', fontWeight: 700, fontSize: 13 }}>
                  {ICV_AI_ICONS['improve-summary']}
                  Suggestion de l'IA :
                </div>
                <div style={{ fontStyle: 'italic', color: '#15803D', fontSize: 13.5, marginTop: 8, lineHeight: 1.6 }}>« {aiSuggestion} »</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button style={{ height: 38, padding: '0 18px', borderRadius: 9999, background: '#16A34A', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Accepter</button>
                  <button style={{ height: 38, padding: '0 18px', borderRadius: 9999, background: 'transparent', color: '#15803D', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ignorer</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <IdnButton t={t} variant="ghost" size="lg">Annuler</IdnButton>
            <IdnButton t={t} variant="primary" size="lg" style={{ flex: 1 }} leadIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}>Enregistrer les modifications</IdnButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ICVWebField({ t, label, value, placeholder, type = 'text' }) {
  return (
    <label>
      <div style={{ fontSize: 13, fontWeight: 500, color: t.ink2, marginBottom: 6 }}>{label}</div>
      <div style={{
        height: 48,
        background: t.dark ? '#0E110D' : '#F4F3EE',
        boxShadow: t.dark ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
        borderRadius: 12, padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 14, color: value ? t.ink : t.mutedSoft, fontFamily: idnTokens.font,
      }}>{value || placeholder}</div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY — onboarding
// ─────────────────────────────────────────────────────────────
function ICVWebEmpty({ t }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '60px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, maxWidth: 1000, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: t.dark ? '#2A1426' : '#FCE7F3', color: ICV_ACCENT, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><circle cx="12" cy="11" r="2.2"/><path d="M8.5 17c.7-1.6 2-2.3 3.5-2.3s2.8.7 3.5 2.3"/></svg>
            </span>
            <span style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 700 }}>ICV · NOUVEAU</span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: t.ink, letterSpacing: -1, lineHeight: 1.05 }}>
            Votre CV professionnel,<br/>
            <span style={{ color: ICV_ACCENT }}>en quelques minutes.</span>
          </div>
          <div style={{ fontSize: 15, color: t.muted, marginTop: 18, lineHeight: 1.6, maxWidth: 440 }}>
            12 thèmes professionnels, 5 outils IA pour reformuler, suggérer des compétences ou évaluer votre score ATS. Synchronisé avec votre identité IDN.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <IdnButton t={t} variant="primary" size="lg" leadIcon={IdnIcons.plus}>Démarrer mon CV</IdnButton>
            <IdnButton t={t} variant="ghost" size="lg" leadIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>}>Importer un CV</IdnButton>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { l: '12', d: 'Thèmes pro' },
              { l: '5', d: 'Outils IA' },
              { l: 'PDF', d: 'Export 1 clic' },
              { l: 'ATS', d: 'Score auto' },
            ].map(s => (
              <div key={s.d}>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, fontFamily: idnTokens.mono }}>{s.l}</div>
                <div style={{ fontSize: 11, color: t.muted, letterSpacing: 0.4, marginTop: 2 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', height: 460 }}>
          {/* Mockup: trois CV empilés en éventail */}
          {[
            { th: ICV_THEMES[0],  rot: -10, dx: -90, dy: 40, z: 1 },
            { th: ICV_THEMES[6],  rot:   6, dx:  90, dy: 60, z: 2 },
            { th: ICV_THEMES[4],  rot:  -2, dx:   0, dy:  0, z: 3 },
          ].map((c, i) => (
            <div key={i} style={{ position: 'absolute', top: c.dy, left: '50%', marginLeft: c.dx - 160, transform: `rotate(${c.rot}deg)`, zIndex: c.z, width: 320, height: 452, boxShadow: '0 24px 40px rgba(20,20,30,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <ICVPreviewA4 theme={c.th} data={ICV_SAMPLE} ink="#16170F" muted="#74766B"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// THEMES GALLERY — modal plein
// ─────────────────────────────────────────────────────────────
function ICVWebThemesGallery({ t }) {
  const groups = [['Classique & Pro', ICV_THEMES.slice(0, 4)], ['Créatif & Moderne', ICV_THEMES.slice(4, 8)], ['Spécialisé', ICV_THEMES.slice(8, 12)]];
  const activeId = 'creative';
  return (
    <div style={{ width: 'min(1040px, 96%)', maxHeight: '92%', background: t.surface, borderRadius: 16, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, letterSpacing: -0.3 }}>Galerie des thèmes</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>12 mises en page, 3 catégories — appliquées au CV de {ICV_SAMPLE.firstName} {ICV_SAMPLE.lastName}</div>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {groups.map(([cat, themes]) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>{cat.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {themes.map(th => {
                const sel = th.id === activeId;
                return (
                  <div key={th.id} style={{ padding: 10, borderRadius: 14, background: sel ? (t.dark ? '#2A1426' : '#FCE7F3') : t.surface, border: `1.5px solid ${sel ? ICV_ACCENT : t.border}`, cursor: 'pointer' }}>
                    <div style={{ width: '100%', aspectRatio: '0.71', borderRadius: 4, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                      <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: 320, height: 452 }}>
                        <ICVPreviewA4 theme={th} data={ICV_SAMPLE} ink="#16170F" muted="#74766B"/>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 9999, background: th.color }}/>
                      <span style={{ fontSize: 13, fontWeight: 700, color: sel ? ICV_ACCENT : t.ink }}>{th.label}</span>
                      {sel && <span style={{ marginLeft: 'auto', color: ICV_ACCENT }}>{IdnIcons.check}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{th.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <IdnButton t={t} variant="ghost" size="md">Annuler</IdnButton>
        <IdnButton t={t} variant="primary" size="md">Appliquer Créatif</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IMPORT — modale
// ─────────────────────────────────────────────────────────────
function ICVWebImport({ t }) {
  return (
    <div style={{ width: 560, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.ink, letterSpacing: -0.3 }}>Importer un CV</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Vos données seront extraites et pré-remplies.</div>
        </div>
        <button style={{ width: 32, height: 32, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ borderRadius: 14, padding: 30, background: t.surface2, border: `1.5px dashed ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: t.dark ? '#2A1426' : '#FCE7F3', color: ICV_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.ink }}>Déposez votre CV</div>
          <div style={{ fontSize: 12, color: t.muted }}>PDF ou DOCX · 5 Mo max.</div>
          <IdnButton t={t} variant="ghost" size="md" style={{ marginTop: 6 }}>Parcourir mes fichiers</IdnButton>
        </div>
        <div style={{ marginTop: 18, fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 1 }}>OU IMPORTER DEPUIS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { l: 'LinkedIn',   d: 'Profil public', c: '#0A66C2' },
            { l: 'iDocument',  d: 'Mes documents IDN', c: '#a855f7' },
          ].map(s => (
            <button key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{s.l[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{s.l}</div>
                <div style={{ fontSize: 11, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.d}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ATS — modale résultat
// ─────────────────────────────────────────────────────────────
function ICVWebAts({ t }) {
  const score = 87;
  const r = 60, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const checks = [
    { ok: true,  l: 'Format compatible',  d: 'Texte parsable, pas d\'image embarquée' },
    { ok: true,  l: 'Mots-clés métier',   d: '8 termes pertinents détectés (« digital », « projet », « UX »…)' },
    { ok: true,  l: 'Structure claire',   d: 'Sections explicites, ordre lisible' },
    { ok: false, l: 'Verbes d\'action',   d: 'Renforcer 2 expériences avec des verbes au prétérit' },
    { ok: true,  l: 'Densité de mots-clés', d: 'Niveau optimal pour le secteur visé' },
  ];
  return (
    <div style={{ width: 640, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: '0 30px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.ink, letterSpacing: -0.3 }}>Score ATS</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Compatibilité avec les systèmes de recrutement</div>
        </div>
        <button style={{ width: 32, height: 32, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 22, background: t.dark ? '#0F2818' : '#DCFCE7', border: `1px solid ${t.dark ? '#0F4A22' : '#86EFAC'}`, borderRadius: 14 }}>
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(34,197,94,0.18)" strokeWidth="11"/>
            <circle cx="80" cy="80" r={r} fill="none" stroke="#16A34A" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 80 80)"/>
            <text x="80" y="78" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 36, fontWeight: 700, fill: '#15803D' }}>{score} %</text>
            <text x="80" y="100" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 10, fill: '#15803D', letterSpacing: 1.2, fontWeight: 600 }}>SCORE ATS</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, letterSpacing: 1 }}>RÉSULTAT</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#15803D', marginTop: 4, letterSpacing: -0.3 }}>Bien optimisé</div>
            <div style={{ fontSize: 13, color: '#166534', marginTop: 6, lineHeight: 1.55 }}>Votre CV est bien optimisé pour les systèmes de recrutement automatique.</div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '4px 16px' }}>
          {checks.map((cc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i === checks.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
              <div style={{ width: 26, height: 26, borderRadius: 9999, background: cc.ok ? '#DCFCE7' : '#FEF3C7', color: cc.ok ? '#16A34A' : '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {cc.ok ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="10"/></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{cc.l}</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>{cc.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <IdnButton t={t} variant="ghost" size="md">Plus tard</IdnButton>
        <IdnButton t={t} variant="primary" size="md">Optimiser mon CV</IdnButton>
      </div>
    </div>
  );
}

Object.assign(window, { ICVWeb });
