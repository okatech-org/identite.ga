// IDN — iCV mobile (Constructeur de CV citoyen)
// Vue principale, dashboard score, éditeur, thèmes, import, ATS

// ─────────────────────────────────────────────────────────────
// Tokens iCV
// ─────────────────────────────────────────────────────────────
const ICV_ACCENT = '#EC4899';
const ICV_ACCENT_DK = '#BE185D';

const ICV_THEMES = [
  // Classique & Pro
  { id: 'modern',       label: 'Modern',     desc: 'Clean & contemporain', cat: 'Classique & Pro',   color: '#3B82F6', font: 'sans' },
  { id: 'classic',      label: 'Classic',    desc: 'Intemporel',           cat: 'Classique & Pro',   color: '#6B7280', font: 'serif' },
  { id: 'minimalist',   label: 'Minimal',    desc: 'Épuré & simple',       cat: 'Classique & Pro',   color: '#1F2937', font: 'sans' },
  { id: 'professional', label: 'Pro',        desc: 'Formel & sérieux',     cat: 'Classique & Pro',   color: '#0F766E', font: 'sans' },
  // Créatif & Moderne
  { id: 'creative',     label: 'Créatif',    desc: 'Artistique',           cat: 'Créatif & Moderne', color: '#EC4899', font: 'sans' },
  { id: 'startup',      label: 'Startup',    desc: 'Tech & dynamique',     cat: 'Créatif & Moderne', color: '#F97316', font: 'sans' },
  { id: 'bold',         label: 'Bold',       desc: 'Audacieux',            cat: 'Créatif & Moderne', color: '#7C3AED', font: 'sans' },
  { id: 'tech',         label: 'Tech',       desc: 'IT & Digital',         cat: 'Créatif & Moderne', color: '#06B6D4', font: 'mono' },
  // Spécialisé
  { id: 'academic',     label: 'Academic',   desc: 'Universitaire',        cat: 'Spécialisé',        color: '#0369A1', font: 'serif' },
  { id: 'executive',    label: 'Executive',  desc: 'Direction',            cat: 'Spécialisé',        color: '#1E3A5F', font: 'serif' },
  { id: 'elegant',      label: 'Elegant',    desc: 'Raffiné',              cat: 'Spécialisé',        color: '#9D4EDD', font: 'serif' },
  { id: 'compact',      label: 'Compact',    desc: 'Dense & efficace',     cat: 'Spécialisé',        color: '#059669', font: 'sans' },
];

const ICV_AI_TOOLS = [
  { id: 'improve-summary', label: 'Améliorer le Profil',  desc: 'Reformulez votre résumé',  color: '#a855f7', bgL: '#F3E8FF', bgD: '#2A1542' },
  { id: 'suggest-skills',  label: 'Suggérer Compétences', desc: 'Basé sur vos expériences', color: '#3b82f6', bgL: '#DBEAFE', bgD: '#0F2640' },
  { id: 'optimize-job',    label: 'Optimiser pour Poste', desc: 'Adaptez à une offre',      color: '#f97316', bgL: '#FFEDD5', bgD: '#2A1A0E' },
  { id: 'generate-letter', label: 'Lettre de Motivation', desc: 'Générez automatiquement',  color: '#22c55e', bgL: '#DCFCE7', bgD: '#0F2818' },
  { id: 'ats-check',       label: 'Score ATS',            desc: 'Compatibilité recruteurs', color: '#f59e0b', bgL: '#FEF3C7', bgD: '#2A1F0A' },
];

const ICV_AI_ICONS = {
  'improve-summary': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4l-1 2-2 1 2 1 1 2 1-2 2-1-2-1zM4 14l4-4 7 7-4 4zM14 7l3 3"/></svg>,
  'suggest-skills':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3a4 4 0 0 0-3 6 4 4 0 0 0 0 5 4 4 0 0 0 3 5 4 4 0 0 0 6 0 4 4 0 0 0 3-5 4 4 0 0 0 0-5 4 4 0 0 0-3-6 4 4 0 0 0-6 0z"/><path d="M12 9v9M9 12h6"/></svg>,
  'optimize-job':    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>,
  'generate-letter': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>,
  'ats-check':       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>,
};

// Sample CV data (citoyenne Aïsha Ndong)
const ICV_SAMPLE = {
  firstName: 'Aïsha',
  lastName:  'Ndong',
  role:      'Chef de Projet Digital',
  email:     'aisha.ndong@idn.ga',
  phone:     '+241 06 12 34 56',
  address:   'Libreville · Gabon',
  summary:   'Chef de Projet Digital — 7 ans d\'expérience en transformation numérique pour le secteur public et privé africain. Spécialiste UX et conduite du changement.',
  experiences: [
    { title: 'Chef de Projet Digital', company: 'Agence Web Gabon', start: 'Janv. 2022', end: 'Présent',     desc: 'Refonte de 3 plateformes e-commerce · +25% conversion · coord. 8 dev/designers.' },
    { title: 'Product Manager',         company: 'Bantu Tech',        start: 'Sept. 2019', end: 'Déc. 2021', desc: 'Lancement d\'une app fintech (50 k users actifs).' },
  ],
  education: [
    { degree: 'Master 2 Marketing Digital', school: 'Université Omar Bongo', year: '2019' },
    { degree: 'Licence Communication',      school: 'INSG Libreville',         year: '2017' },
  ],
  skills:   [ { n: 'Gestion de projet', l: 'Expert' }, { n: 'UX Design', l: 'Advanced' }, { n: 'Marketing digital', l: 'Advanced' }, { n: 'Figma', l: 'Expert' }, { n: 'SQL', l: 'Intermediate' } ],
  languages:[ { n: 'Français', l: 'Native' }, { n: 'Anglais', l: 'C1' }, { n: 'Fang', l: 'B2' } ],
};

// ─────────────────────────────────────────────────────────────
// Mini CV Preview (A4 — utilisé en aperçu et en miniature)
// ─────────────────────────────────────────────────────────────
function ICVPreviewA4({ theme = ICV_THEMES[0], data = ICV_SAMPLE, scale = 1, white = '#fff', ink = '#16170F', muted = '#74766B' }) {
  // Format A4 portrait à l'échelle 1 = 320x452 (~ratio 1:1.41)
  const W = 320, H = 452;
  const font = theme.font === 'serif' ? '"IBM Plex Serif", Georgia, serif' : theme.font === 'mono' ? idnTokens.mono : idnTokens.font;
  // 3 variantes de layout selon catégorie
  const isSidebar = ['creative', 'bold', 'executive', 'elegant', 'startup'].includes(theme.id);
  const isBand    = ['modern', 'professional', 'tech', 'academic', 'compact'].includes(theme.id);
  return (
    <div style={{ width: W, height: H, background: white, color: ink, fontFamily: font, transform: `scale(${scale})`, transformOrigin: 'top left', boxShadow: '0 14px 30px rgba(20,20,30,0.18), 0 0 0 1px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: isSidebar ? 'row' : 'column', position: 'relative' }}>
      {isSidebar ? (
        <>
          <div style={{ width: 110, background: theme.color, color: '#fff', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>{data.firstName[0]}{data.lastName[0]}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>{data.firstName}</div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>{data.lastName}</div>
              <div style={{ fontSize: 9, opacity: 0.82, marginTop: 4, lineHeight: 1.35 }}>{data.role}</div>
            </div>
            <div style={{ fontSize: 8, lineHeight: 1.5, opacity: 0.92 }}>
              <div style={{ fontWeight: 700, fontSize: 8, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>CONTACT</div>
              <div>{data.email}</div>
              <div>{data.phone}</div>
              <div>{data.address}</div>
            </div>
            <div style={{ fontSize: 8, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>LANGUES</div>
              {data.languages.map((l, i) => <div key={i}>{l.n} · <span style={{ opacity: 0.8 }}>{l.l}</span></div>)}
            </div>
            <div style={{ fontSize: 8, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>COMPÉTENCES</div>
              {data.skills.slice(0, 4).map((s, i) => (
                <div key={i} style={{ marginBottom: 3 }}>
                  <div>{s.n}</div>
                  <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                    <div style={{ width: `${s.l === 'Expert' ? 95 : s.l === 'Advanced' ? 75 : 55}%`, height: '100%', background: '#fff', borderRadius: 99 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: '20px 16px', overflow: 'hidden' }}>
            <PreviewSections data={data} accent={theme.color} ink={ink} muted={muted} dense/>
          </div>
        </>
      ) : isBand ? (
        <>
          <div style={{ background: theme.color, color: '#fff', padding: '18px 22px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1 }}>{data.firstName} <span style={{ fontWeight: 400, opacity: 0.85 }}>{data.lastName}</span></div>
            <div style={{ fontSize: 10, opacity: 0.92, marginTop: 4 }}>{data.role}</div>
            <div style={{ fontSize: 8, marginTop: 8, opacity: 0.86, letterSpacing: 0.2 }}>{data.email} · {data.phone} · {data.address}</div>
          </div>
          <div style={{ flex: 1, padding: '14px 22px', overflow: 'hidden' }}>
            <PreviewSections data={data} accent={theme.color} ink={ink} muted={muted}/>
          </div>
        </>
      ) : (
        // minimaliste / classic
        <div style={{ flex: 1, padding: '22px 22px', overflow: 'hidden' }}>
          <div style={{ borderBottom: `2px solid ${theme.color}`, paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ink, letterSpacing: -0.4, lineHeight: 1 }}>{data.firstName} <span style={{ fontWeight: 300 }}>{data.lastName}</span></div>
            <div style={{ fontSize: 10, color: theme.color, marginTop: 4, fontWeight: 600, letterSpacing: 0.4 }}>{data.role.toUpperCase()}</div>
            <div style={{ fontSize: 8, color: muted, marginTop: 6 }}>{data.email} · {data.phone} · {data.address}</div>
          </div>
          <PreviewSections data={data} accent={theme.color} ink={ink} muted={muted}/>
        </div>
      )}
    </div>
  );
}

function PreviewSections({ data, accent, ink, muted, dense }) {
  const H = ({ children }) => <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: accent, marginTop: dense ? 8 : 12, marginBottom: 5, textTransform: 'uppercase' }}>{children}</div>;
  return (
    <div style={{ fontSize: 8, lineHeight: 1.45, color: ink }}>
      <H>Profil</H>
      <div style={{ color: muted, fontSize: 8, lineHeight: 1.5 }}>{data.summary}</div>
      <H>Expériences</H>
      {data.experiences.map((e, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ fontWeight: 700, color: ink, fontSize: 9 }}>{e.title}</div>
            <div style={{ fontSize: 7, color: muted, whiteSpace: 'nowrap' }}>{e.start} → {e.end}</div>
          </div>
          <div style={{ fontSize: 8, color: accent, fontWeight: 600 }}>{e.company}</div>
          <div style={{ fontSize: 7.5, color: muted, marginTop: 2 }}>{e.desc}</div>
        </div>
      ))}
      <H>Formation</H>
      {data.education.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <div>
            <div style={{ fontWeight: 600, color: ink, fontSize: 8.5 }}>{e.degree}</div>
            <div style={{ fontSize: 7.5, color: muted }}>{e.school}</div>
          </div>
          <div style={{ fontSize: 7, color: muted }}>{e.year}</div>
        </div>
      ))}
      {!dense && (
        <>
          <H>Compétences</H>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ fontSize: 7.5, padding: '2px 6px', border: `1px solid ${accent}`, color: accent, borderRadius: 99, fontWeight: 500 }}>{s.n}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Écran HOME — vue principale
// ─────────────────────────────────────────────────────────────
function ScrICVHome({ t }) {
  const activeTheme = ICV_THEMES[4]; // creative par défaut
  const groups = [['Classique & Pro', ICV_THEMES.slice(0, 4)], ['Créatif & Moderne', ICV_THEMES.slice(4, 8)], ['Spécialisé', ICV_THEMES.slice(8, 12)]];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 22px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: 'none', border: 'none', color: idnTokens.green, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>{IdnIcons.arrowL}<span style={{ fontSize: 14, fontWeight: 500 }}>Accueil</span></button>
        <div style={{ flex: 1 }}/>
        <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>
        </button>
        <button style={{ height: 36, padding: '0 14px', borderRadius: 9999, background: ICV_ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>
          PDF
        </button>
      </div>
      <div style={{ padding: '0 22px 4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.ink, letterSpacing: -0.6, lineHeight: 1 }}>iCV</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Créez votre CV professionnel</div>
        </div>
        <ICVPill t={t} color={ICV_ACCENT} bg={t.dark ? '#2A1426' : '#FCE7F3'}>78 %</ICVPill>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 22px 22px' }}>
        {/* Mini aperçu — tap pour ouvrir */}
        <button style={{ width: '100%', padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, display: 'flex', gap: 14, alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}>
          <div style={{ width: 86, height: 122, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            <div style={{ transform: 'scale(0.27)', transformOrigin: 'top left', width: 320, height: 452 }}>
              <ICVPreviewA4 theme={activeTheme} data={ICV_SAMPLE} ink={t.ink} muted={t.muted}/>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: 600 }}>APERÇU · A4</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, marginTop: 4 }}>{ICV_SAMPLE.firstName} {ICV_SAMPLE.lastName}</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Thème · <span style={{ color: activeTheme.color, fontWeight: 600 }}>{activeTheme.label}</span></div>
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, fontSize: 11, fontWeight: 600 }}>
              {IdnIcons.eye}<span>Voir en plein écran</span>
            </div>
          </div>
        </button>

        {/* Profil rapide */}
        <div style={{ marginTop: 14, padding: '12px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9999, background: 'linear-gradient(135deg,#0E7C3A,#0A5C2C)', color: '#fff', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AN</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{ICV_SAMPLE.firstName} {ICV_SAMPLE.lastName}</div>
            <div style={{ fontSize: 11, color: t.muted }}>{ICV_SAMPLE.email}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <ICVPill t={t} color={ICV_ACCENT} bg={t.dark ? '#2A1426' : '#FCE7F3'} sm>{ICV_SAMPLE.experiences.length} exp.</ICVPill>
            <ICVPill t={t} color="#3b82f6" bg={t.dark ? '#0F2640' : '#DBEAFE'} sm>{ICV_SAMPLE.skills.length} comp.</ICVPill>
          </div>
        </div>

        {/* Sélecteur de thèmes */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: ICV_ACCENT }}>{ICV_AI_ICONS['improve-summary']}</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, flex: 1 }}>Choisir un thème</div>
          <button style={{ background: 'none', border: 'none', color: idnTokens.green, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Tout voir →</button>
        </div>
        {groups.map(([cat, themes], gi) => (
          <div key={cat} style={{ marginTop: gi === 0 ? 10 : 12 }}>
            <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>{cat.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 8, overflow: 'auto', margin: '0 -22px', padding: '0 22px 4px' }}>
              {themes.map(th => {
                const sel = th.id === activeTheme.id;
                return (
                  <div key={th.id} style={{ minWidth: 110, padding: 10, background: sel ? (t.dark ? '#2A1426' : '#FCE7F3') : t.surface, border: `1px solid ${sel ? ICV_ACCENT : t.border}`, borderRadius: 12, flexShrink: 0, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, borderRadius: 9999, background: th.color, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}/>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sel ? ICV_ACCENT : t.ink }}>{th.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: t.muted, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{th.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Outils IA */}
        <div style={{ marginTop: 22, padding: 14, borderRadius: 14, background: t.dark ? 'linear-gradient(180deg, rgba(168,85,247,0.08), transparent)' : 'linear-gradient(180deg, rgba(168,85,247,0.05), transparent)', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ color: '#a855f7' }}>{ICV_AI_ICONS['improve-summary']}</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, flex: 1 }}>Outils IA</div>
            <span style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>5 outils</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ICV_AI_TOOLS.map(tool => (
              <button key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: t.dark ? tool.bgD : tool.bgL, color: tool.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ICV_AI_ICONS[tool.id]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{tool.label}</div>
                  <div style={{ fontSize: 10, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.desc}</div>
                </div>
                <span style={{ color: t.muted, transform: 'rotate(-90deg)' }}>{IdnIcons.arrow}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lien dashboard */}
        <button style={{ marginTop: 18, width: '100%', padding: '12px 14px', background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Tableau de bord</div>
            <div style={{ fontSize: 11, color: t.muted }}>Score · suggestions · sections</div>
          </div>
          <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>
        </button>
      </div>
    </div>
  );
}

function ICVPill({ children, color, bg, sm, t }) {
  return <span style={{ fontSize: sm ? 10 : 11, fontWeight: 700, padding: sm ? '2px 8px' : '3px 10px', borderRadius: 9999, background: bg, color, letterSpacing: 0.2 }}>{children}</span>;
}

// ─────────────────────────────────────────────────────────────
// 2. DASHBOARD — score 78 + sections + suggestions
// ─────────────────────────────────────────────────────────────
function ScrICVDashboard({ t }) {
  const score = 78;
  const sections = [
    { id: 'exp',   label: 'Expériences', count: '2 postes',   color: '#f97316', bgL: '#FFEDD5', bgD: '#2A1A0E', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
    { id: 'edu',   label: 'Formation',   count: '2 diplômes', color: '#3b82f6', bgL: '#DBEAFE', bgD: '#0F2640', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5M21 9v6"/></svg> },
    { id: 'skill', label: 'Compétences', count: '5 skills',   color: '#a855f7', bgL: '#F3E8FF', bgD: '#2A1542', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg> },
    { id: 'info',  label: 'Infos',       count: '100 %',      color: '#22c55e', bgL: '#DCFCE7', bgD: '#0F2818', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg> },
  ];
  const suggestions = [
    { title: 'Ajoutez vos diplômes',     desc: '2× plus d\'offres',  impact: '+15 %' },
    { title: 'Validez vos compétences',  desc: 'Certifier anglais',    impact: '+10 %' },
  ];
  const ring = (s) => {
    const r = 36, c = 2 * Math.PI * r, off = c * (1 - s / 100);
    return (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={t.surface2} strokeWidth="9"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={idnTokens.green} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 50 50)"/>
        <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 22, fontWeight: 700, fill: t.ink }}>{s}</text>
        <text x="50" y="64" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 9, fill: t.muted, letterSpacing: 1 }}>SCORE</text>
      </svg>
    );
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 22px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: 'none', border: 'none', color: idnTokens.green, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>{IdnIcons.arrowL}<span style={{ fontSize: 14, fontWeight: 500 }}>iCV</span></button>
        <div style={{ flex: 1 }}/>
        <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
        </button>
        <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>
        </button>
      </div>
      <div style={{ padding: '0 22px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: t.ink, letterSpacing: -0.6, lineHeight: 1 }}>Tableau de bord</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 6 }}>iCV de {ICV_SAMPLE.firstName} {ICV_SAMPLE.lastName} · mis à jour aujourd'hui</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px 22px' }}>
        {/* Anneau */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16 }}>
          {ring(score)}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 1 }}>NIVEAU</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: t.ink, letterSpacing: -0.3, marginTop: 2 }}>Expert</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>Profil attractif. Quelques ajouts pour atteindre 100 %.</div>
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 700, margin: '20px 0 8px' }}>SUGGESTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: t.dark ? t.surface2 : 'rgba(241,239,233,0.7)', display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{s.title}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{s.desc}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: idnTokens.green }}>{s.impact}</div>
            </div>
          ))}
        </div>

        {/* Sections grid 2x2 */}
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 700, margin: '20px 0 8px' }}>SECTIONS DU CV</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {sections.map(s => (
            <button key={s.id} style={{ padding: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: t.dark ? s.bgD : s.bgL, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{s.label}</div>
                <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{s.count}</div>
              </div>
              <span style={{ color: t.muted, transform: 'rotate(-90deg)', opacity: 0.6 }}>{IdnIcons.arrow}</span>
            </button>
          ))}
        </div>

        {/* CTA sticky-like */}
        <div style={{ marginTop: 24 }}>
          <IdnButton t={t} variant="primary" size="lg" full leadIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 21c5-1 8-3 13-8l3-3-4-4-3 3c-5 5-7 8-8 13z"/><path d="M14 6l4 4"/></svg>}>Modifier mon CV</IdnButton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. THEMES — grille 12 thèmes plein écran
// ─────────────────────────────────────────────────────────────
function ScrICVThemes({ t }) {
  const groups = [['Classique & Pro', ICV_THEMES.slice(0, 4)], ['Créatif & Moderne', ICV_THEMES.slice(4, 8)], ['Spécialisé', ICV_THEMES.slice(8, 12)]];
  const activeId = 'creative';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Choisir un thème" onBack={() => {}}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 18px 18px' }}>
        {groups.map(([cat, themes]) => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>{cat.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {themes.map(th => {
                const sel = th.id === activeId;
                return (
                  <div key={th.id} style={{ padding: 10, borderRadius: 14, background: sel ? (t.dark ? '#2A1426' : '#FCE7F3') : t.surface, border: `1.5px solid ${sel ? ICV_ACCENT : t.border}`, cursor: 'pointer', position: 'relative' }}>
                    {/* Mini aperçu */}
                    <div style={{ width: '100%', aspectRatio: '0.71', borderRadius: 6, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                      <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: 320, height: 452 }}>
                        <ICVPreviewA4 theme={th} data={ICV_SAMPLE} ink="#16170F" muted="#74766B"/>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 9999, background: th.color }}/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: sel ? ICV_ACCENT : t.ink }}>{th.label}</span>
                      {sel && <span style={{ marginLeft: 'auto', color: ICV_ACCENT }}>{IdnIcons.check}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{th.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 18px 18px', borderTop: `1px solid ${t.borderSoft}` }}>
        <IdnButton t={t} variant="primary" size="lg" full>Appliquer Créatif</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. PREVIEW — A4 plein écran
// ─────────────────────────────────────────────────────────────
function ScrICVPreview({ t }) {
  const theme = ICV_THEMES[4];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.dark ? '#06080A' : '#1F2024' }}>
      <div style={{ padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
        <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Aperçu · Créatif</div>
        <button style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 9999, height: 32, padding: '0 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>
          PDF
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: 320, height: 452, position: 'relative' }}>
          <ICVPreviewA4 theme={theme} data={ICV_SAMPLE} ink="#16170F" muted="#74766B"/>
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 9999, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
          Partager
        </button>
        <button style={{ background: '#fff', border: 'none', color: '#16170F', borderRadius: 9999, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 21c5-1 8-3 13-8l3-3-4-4-3 3c-5 5-7 8-8 13z"/><path d="M14 6l4 4"/></svg>
          Modifier
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. EDIT — Ajouter une expérience (avec / sans suggestion IA)
// ─────────────────────────────────────────────────────────────
function ScrICVEditExp({ t, aiState = 'idle' }) {
  // aiState: idle | loading | suggestion
  const aiSuggestion = "En tant que Chef de Projet Digital, j'ai piloté la refonte complète de 3 plateformes e-commerce, augmentant le taux de conversion de 25%. J'ai coordonné une équipe agile de 8 développeurs et designers, assurant la livraison des sprints dans les délais.";
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 14px 12px', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
        <button style={{ width: 40, height: 40, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', color: t.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: t.ink, textAlign: 'center' }}>Ajouter une expérience</div>
        <div style={{ width: 40 }}/>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 18px 22px' }}>
        <div style={{ background: t.surface, borderRadius: 20, padding: 18, border: `1px solid ${t.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ICVField t={t} label="Intitulé du poste" value="Chef de Projet Digital" placeholder="ex: Chef de Projet Digital"/>
          <ICVField t={t} label="Entreprise" value="Agence Web Gabon" placeholder="ex: Agence Web Gabon"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ICVField t={t} label="Date de début" value="01/2022" type="date"/>
            <ICVField t={t} label="Date de fin"   value="" placeholder="—" type="date"/>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.ink2 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: idnTokens.green }}/>Poste actuel
          </label>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.ink, flex: 1 }}>Description</span>
              <button style={{ background: 'none', border: 'none', color: aiState === 'loading' ? t.muted : idnTokens.green, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 9999, ...(aiState !== 'loading' ? { background: t.dark ? '#0F2A18' : idnTokens.greenSoft } : {}) }} disabled={aiState === 'loading'}>
                <span style={{ display: 'inline-flex', animation: aiState === 'loading' ? 'icv-spin 1s linear infinite' : 'none' }}>
                  {aiState === 'loading' ? ICV_AI_ICONS['ats-check'] : ICV_AI_ICONS['improve-summary']}
                </span>
                {aiState === 'loading' ? 'Génération…' : 'Améliorer avec l\'IA'}
              </button>
            </div>
            <div style={{
              background: t.dark ? '#0E110D' : '#F4F3EE',
              border: 'none',
              borderRadius: 14,
              padding: 12,
              boxShadow: t.dark ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
              minHeight: 110,
              fontSize: 13,
              color: t.ink,
              lineHeight: 1.5,
            }}>{aiState === 'suggestion' ? '' : 'Refonte de 3 plateformes e-commerce · +25% conversion · coord. 8 dev/designers.'}</div>
            {aiState === 'suggestion' && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: t.dark ? '#0F2818' : '#DCFCE7', border: `1px solid ${t.dark ? '#0F4A22' : '#86EFAC'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803D', fontWeight: 700, fontSize: 12 }}>
                  {ICV_AI_ICONS['improve-summary']}
                  Suggestion de l'IA :
                </div>
                <div style={{ fontStyle: 'italic', color: '#15803D', fontSize: 12, marginTop: 6, lineHeight: 1.55 }}>« {aiSuggestion} »</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{ flex: 1, height: 34, borderRadius: 9999, background: '#16A34A', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Accepter</button>
                  <button style={{ flex: 1, height: 34, borderRadius: 9999, background: 'transparent', color: '#15803D', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Ignorer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 18px 18px', borderTop: `1px solid ${t.borderSoft}` }}>
        <IdnButton t={t} variant="primary" size="lg" full leadIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}>Enregistrer les modifications</IdnButton>
      </div>
      <style>{`@keyframes icv-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ICVField({ t, label, value, placeholder, type = 'text' }) {
  return (
    <label>
      <div style={{ fontSize: 12, fontWeight: 500, color: t.ink2, marginBottom: 6 }}>{label}</div>
      <div style={{
        height: 44,
        background: t.dark ? '#0E110D' : '#F4F3EE',
        boxShadow: t.dark ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
        borderRadius: 12, padding: '0 14px', display: 'flex', alignItems: 'center', fontSize: 13, color: value ? t.ink : t.mutedSoft, fontFamily: idnTokens.font,
      }}>{value || placeholder}</div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. EDIT — Compétence (niveau Beginner→Expert)
// ─────────────────────────────────────────────────────────────
function ScrICVEditSkill({ t }) {
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const cur = 'Advanced';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ width: 40, height: 40, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: t.ink, textAlign: 'center' }}>Ajouter une compétence</div>
        <div style={{ width: 40 }}/>
      </div>
      <div style={{ flex: 1, padding: '8px 18px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: t.surface, borderRadius: 20, padding: 18, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ICVField t={t} label="Compétence" value="UX Design" placeholder="ex: UX Design"/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.ink2, marginBottom: 8 }}>Niveau</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {levels.map(l => {
                const sel = l === cur;
                const pct = (levels.indexOf(l) + 1) * 25;
                return (
                  <button key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: sel ? (t.dark ? '#2A1426' : '#FCE7F3') : t.surface2, border: `1.5px solid ${sel ? ICV_ACCENT : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: sel ? ICV_ACCENT : t.ink }}>{l}</div>
                      <div style={{ height: 4, background: t.dark ? '#0E110D' : 'rgba(0,0,0,0.06)', borderRadius: 99, marginTop: 5 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: sel ? ICV_ACCENT : t.muted, borderRadius: 99 }}/>
                      </div>
                    </div>
                    {sel && <span style={{ color: ICV_ACCENT }}>{IdnIcons.check}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 18px 18px', borderTop: `1px solid ${t.borderSoft}` }}>
        <IdnButton t={t} variant="primary" size="lg" full>Enregistrer</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. EDIT — Langue (CECRL A1→C2/Native)
// ─────────────────────────────────────────────────────────────
function ScrICVEditLang({ t }) {
  const levels = [
    { l: 'A1',     d: 'Débutant' },
    { l: 'A2',     d: 'Élémentaire' },
    { l: 'B1',     d: 'Intermédiaire' },
    { l: 'B2',     d: 'Intermédiaire +' },
    { l: 'C1',     d: 'Avancé' },
    { l: 'C2',     d: 'Maîtrise' },
    { l: 'Native', d: 'Langue maternelle' },
  ];
  const cur = 'C1';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ width: 40, height: 40, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: t.ink, textAlign: 'center' }}>Ajouter une langue</div>
        <div style={{ width: 40 }}/>
      </div>
      <div style={{ flex: 1, padding: '8px 18px 22px' }}>
        <div style={{ background: t.surface, borderRadius: 20, padding: 18, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ICVField t={t} label="Langue" value="Anglais" placeholder="ex: Anglais"/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.ink2, marginBottom: 8 }}>Niveau CECRL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {levels.map(({ l, d }) => {
                const sel = l === cur;
                return (
                  <button key={l} style={{ padding: '10px 10px', borderRadius: 10, background: sel ? ICV_ACCENT : t.surface2, border: `1.5px solid ${sel ? ICV_ACCENT : 'transparent'}`, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: sel ? '#fff' : t.ink, fontFamily: idnTokens.mono }}>{l}</span>
                    <span style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.85)' : t.muted, marginTop: 2 }}>{d}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 18px 18px', borderTop: `1px solid ${t.borderSoft}` }}>
        <IdnButton t={t} variant="primary" size="lg" full>Enregistrer</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. IMPORT — modale
// ─────────────────────────────────────────────────────────────
function ScrICVImport({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Importer un CV" onBack={() => {}}/>
      <div style={{ flex: 1, padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.55 }}>Importez un CV existant. Les données seront extraites et pré-remplies dans les sections.</div>

        <div style={{ borderRadius: 16, padding: 26, background: t.surface, border: `1.5px dashed ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: t.dark ? '#2A1426' : '#FCE7F3', color: ICV_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Déposer un PDF ou DOCX</div>
          <div style={{ fontSize: 12, color: t.muted }}>Taille max. 5 Mo</div>
          <IdnButton t={t} variant="ghost" size="md" style={{ marginTop: 6 }}>Choisir un fichier</IdnButton>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: 1 }}>OU IMPORTER DEPUIS</div>
          {[
            { l: 'LinkedIn', d: 'Importer le profil public', c: '#0A66C2' },
            { l: 'iDocument', d: 'Mes documents IDN', c: '#a855f7' },
          ].map(s => (
            <button key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{s.l[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{s.l}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{s.d}</div>
              </div>
              <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. EMPTY — pas encore de CV
// ─────────────────────────────────────────────────────────────
function ScrICVEmpty({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 22px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ background: 'none', border: 'none', color: idnTokens.green, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>{IdnIcons.arrowL}<span style={{ fontSize: 14, fontWeight: 500 }}>Accueil</span></button>
      </div>
      <div style={{ flex: 1, padding: '0 22px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: t.ink, letterSpacing: -0.6, lineHeight: 1 }}>iCV</div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>Votre constructeur de CV professionnel</div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ width: 120, height: 168, borderRadius: 8, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
            <div style={{ height: 30, background: ICV_ACCENT }}/>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 8, background: t.surface2, borderRadius: 2, width: '80%' }}/>
              <div style={{ height: 4, background: t.surface2, borderRadius: 2, width: '50%' }}/>
              <div style={{ height: 4, background: t.surface2, borderRadius: 2, width: '50%' }}/>
              <div style={{ height: 6, background: t.surface2, borderRadius: 2, width: '40%', marginTop: 6 }}/>
              <div style={{ height: 3, background: t.surface2, borderRadius: 2, width: '90%' }}/>
              <div style={{ height: 3, background: t.surface2, borderRadius: 2, width: '85%' }}/>
              <div style={{ height: 3, background: t.surface2, borderRadius: 2, width: '70%' }}/>
              <div style={{ height: 6, background: t.surface2, borderRadius: 2, width: '40%', marginTop: 6 }}/>
              <div style={{ height: 3, background: t.surface2, borderRadius: 2, width: '90%' }}/>
              <div style={{ height: 3, background: t.surface2, borderRadius: 2, width: '70%' }}/>
            </div>
          </div>
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: t.ink, letterSpacing: -0.3 }}>Créez votre premier CV</div>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 6, lineHeight: 1.55 }}>12 thèmes professionnels, 5 outils IA pour vous accompagner et un export PDF en un clic.</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <IdnButton t={t} variant="primary" size="lg" full leadIcon={IdnIcons.plus}>Démarrer mon CV</IdnButton>
          <IdnButton t={t} variant="ghost" size="lg" full leadIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 16V4M7 9l5-5 5 5M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></svg>}>Importer un CV existant</IdnButton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. ATS — résultat (modal résultat)
// ─────────────────────────────────────────────────────────────
function ScrICVAts({ t }) {
  const score = 87;
  const r = 48, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const checks = [
    { ok: true,  l: 'Format compatible',   d: 'Texte parsable, pas d\'image embarquée' },
    { ok: true,  l: 'Mots-clés métier',    d: '8 termes pertinents détectés' },
    { ok: true,  l: 'Structure claire',    d: 'Sections explicites, lisibles' },
    { ok: false, l: 'Verbes d\'action',    d: 'Renforcer 2 expériences' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Score ATS" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 18, background: t.dark ? '#0F2818' : '#DCFCE7', border: `1px solid ${t.dark ? '#0F4A22' : '#86EFAC'}`, borderRadius: 16 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(34,197,94,0.18)" strokeWidth="10"/>
            <circle cx="60" cy="60" r={r} fill="none" stroke="#16A34A" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 60 60)"/>
            <text x="60" y="58" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 28, fontWeight: 700, fill: '#15803D' }}>{score} %</text>
            <text x="60" y="78" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: idnTokens.font, fontSize: 10, fill: '#15803D', letterSpacing: 1 }}>ATS</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, letterSpacing: 1 }}>RÉSULTAT</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#15803D', marginTop: 4, letterSpacing: -0.3 }}>Bien optimisé</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4, lineHeight: 1.5 }}>Votre CV est bien optimisé pour les systèmes de recrutement.</div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 700, margin: '18px 0 8px' }}>DÉTAIL</div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '4px 14px' }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i === checks.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 9999, background: c.ok ? '#DCFCE7' : '#FEF3C7', color: c.ok ? '#16A34A' : '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {c.ok ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="10"/></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{c.l}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{c.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <IdnButton t={t} variant="primary" size="lg" full>Voir mon CV</IdnButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ICV_THEMES, ICV_AI_TOOLS, ICV_AI_ICONS, ICV_SAMPLE, ICV_ACCENT, ICV_ACCENT_DK,
  ICVPreviewA4, PreviewSections, ICVPill, ICVField,
  ScrICVHome, ScrICVDashboard, ScrICVThemes, ScrICVPreview,
  ScrICVEditExp, ScrICVEditSkill, ScrICVEditLang,
  ScrICVImport, ScrICVEmpty, ScrICVAts,
});
