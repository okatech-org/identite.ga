// ─────────────────────────────────────────────────────────────────────────
// ParcoursShell — single-file journey viewer
// Replaces the design-canvas grid with a focused "one screen at a time"
// presentation: device frame center, info panel left, stepper, prev/next,
// optional mobile/desktop toggle.
//
// Usage:
//   <ParcoursShell
//     title="iCV · Constructeur de CV"
//     subtitle="Du CV vide au score ATS"
//     steps={[
//       { id: '01', label: 'Onboarding · CV vide', desc: '...', mobile: 'icv-empty', web: 'empty' },
//       ...
//     ]}
//     renderMobile={(screen, t) => <NativeApp t={t} screen={screen}/>}
//     renderWeb={(screen, t) => <ICVWeb t={t} screen={screen}/>}
//   />
// ─────────────────────────────────────────────────────────────────────────

function ParcoursShell({
  title,
  subtitle,
  steps,
  renderMobile,
  renderWeb,
  storageKey = 'idn-parcours',
  accent = '#0E7C3A',
}) {
  const [idx, setIdx] = React.useState(() => {
    try {
      const v = parseInt(localStorage.getItem(`${storageKey}:idx`) || '0', 10);
      return isNaN(v) || v < 0 || v >= steps.length ? 0 : v;
    } catch { return 0; }
  });
  const [device, setDevice] = React.useState(() => {
    try { return localStorage.getItem(`${storageKey}:device`) || (renderWeb ? 'mobile' : 'mobile'); }
    catch { return 'mobile'; }
  });
  const [dark, setDark] = React.useState(() => {
    try { return localStorage.getItem('idn-hub-theme') === 'dark'; }
    catch { return false; }
  });

  const t = window.idnTheme(dark);

  React.useEffect(() => {
    try { localStorage.setItem(`${storageKey}:idx`, String(idx)); } catch {}
  }, [idx]);
  React.useEffect(() => {
    try { localStorage.setItem(`${storageKey}:device`, device); } catch {}
  }, [device]);
  React.useEffect(() => {
    document.body.classList.toggle('idn-dark', dark);
    try { localStorage.setItem('idn-hub-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  // Keyboard nav
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); setIdx(i => Math.min(steps.length - 1, i + 1)); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); setIdx(0); }
      else if (e.key === 'End') { e.preventDefault(); setIdx(steps.length - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const step = steps[idx];
  const hasWeb = !!renderWeb && !!step.web;
  const effectiveDevice = device === 'web' && !hasWeb ? 'mobile' : device;

  // Device frame intrinsic size
  const frameW = effectiveDevice === 'mobile' ? 360 : 1180;
  const frameH = effectiveDevice === 'mobile' ? 740 : 760;

  // Auto-scale to fit
  const stageRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const padX = 64, padY = 64;
      const aw = el.clientWidth - padX;
      const ah = el.clientHeight - padY;
      const s = Math.min(1, aw / frameW, ah / frameH);
      setScale(Math.max(0.3, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [frameW, frameH]);

  // ─── styles ────────────────────────────────────────────────────────────
  const css = {
    page: {
      minHeight: '100vh',
      background: dark
        ? 'radial-gradient(120% 80% at 80% 0%, #0F2218 0%, #0a0d0a 60%)'
        : 'radial-gradient(120% 80% at 80% 0%, #E6F2EA 0%, #f0eee9 55%)',
      color: t.ink,
      fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    },
    topbar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 22px',
      borderBottom: `1px solid ${t.border}`,
      background: dark ? 'rgba(10,13,10,0.6)' : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 50,
    },
    body: { flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: 0 },
    side: {
      borderRight: `1px solid ${t.border}`,
      background: dark ? 'rgba(24,28,22,0.55)' : 'rgba(255,255,255,0.55)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    },
    sideHead: { padding: '24px 24px 18px' },
    stage: {
      flex: 1, minWidth: 0, minHeight: 0, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    pill: (active) => ({
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 11px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
      cursor: 'pointer', border: 'none', fontFamily: 'inherit',
      background: active ? accent : (dark ? '#22271F' : '#fff'),
      color: active ? '#fff' : t.ink,
      boxShadow: active ? '0 4px 10px rgba(14,124,58,0.25)' : `inset 0 0 0 1px ${t.border}`,
      transition: 'all .15s',
    }),
    iconBtn: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: 9999, border: `1px solid ${t.border}`,
      background: dark ? '#22271F' : '#fff', color: t.ink, cursor: 'pointer',
      fontFamily: 'inherit',
    },
    stepCounter: {
      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      fontSize: 11, letterSpacing: 1.4, fontWeight: 600,
      color: t.muted, textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 8,
    },
    stepCounterDot: {
      width: 6, height: 6, borderRadius: 9999, background: accent,
    },
    stepTitle: {
      fontSize: 22, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2,
      margin: '14px 0 8px', color: t.ink,
    },
    stepDesc: {
      fontSize: 13, lineHeight: 1.55, color: t.muted, margin: 0,
    },
    navRow: { display: 'flex', gap: 8, marginTop: 22 },
    navBtn: (disabled) => ({
      flex: 1, padding: '10px 14px', borderRadius: 10,
      border: `1px solid ${t.border}`,
      background: disabled ? 'transparent' : (dark ? '#22271F' : '#fff'),
      color: disabled ? t.muted : t.ink,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      opacity: disabled ? 0.5 : 1,
    }),
    navPrimary: {
      flex: 1, padding: '10px 14px', borderRadius: 10,
      border: 'none', background: accent, color: '#fff',
      cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      boxShadow: '0 4px 12px rgba(14,124,58,0.25)',
    },
    stepsLabel: {
      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      fontSize: 10, letterSpacing: 1.4, fontWeight: 600,
      color: t.muted, textTransform: 'uppercase',
      padding: '0 24px 8px', margin: '8px 0 0',
    },
    stepsList: { flex: 1, overflowY: 'auto', padding: '0 14px 24px', minHeight: 0 },
    stepItem: (active, hasContent) => ({
      width: '100%', textAlign: 'left', cursor: hasContent ? 'pointer' : 'not-allowed',
      padding: '9px 12px', borderRadius: 10,
      background: active ? (dark ? 'rgba(14,124,58,0.18)' : '#E6F2EA') : 'transparent',
      border: 'none', fontFamily: 'inherit',
      color: active ? (dark ? '#7BD49C' : accent) : (hasContent ? t.ink : t.muted),
      fontWeight: active ? 600 : 500, fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: hasContent ? 1 : 0.55,
    }),
    stepNum: {
      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      fontSize: 11, fontWeight: 600, color: 'inherit',
      width: 22, flexShrink: 0,
    },
  };

  return (
    <div style={css.page}>
      {/* ─── Top bar ─── */}
      <div style={css.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="idn.html" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            textDecoration: 'none', color: t.muted, fontSize: 12, fontWeight: 600,
            padding: '6px 10px', borderRadius: 9999,
            border: `1px solid ${t.border}`, background: dark ? '#22271F' : '#fff',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Hub
          </a>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>{title}</span>
            {subtitle && <span style={{ fontSize: 12, color: t.muted }}>· {subtitle}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {renderWeb && (
            <div style={{
              display: 'inline-flex', gap: 4, padding: 4, borderRadius: 9999,
              border: `1px solid ${t.border}`, background: dark ? '#181C16' : '#fff',
            }}>
              <button onClick={() => setDevice('mobile')} style={css.pill(effectiveDevice === 'mobile')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>
                Mobile
              </button>
              <button onClick={() => setDevice('web')} style={css.pill(effectiveDevice === 'web')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 18h20M9 22h6"/></svg>
                Desktop
              </button>
            </div>
          )}
          <button onClick={() => setDark(d => !d)} style={css.iconBtn} title={dark ? 'Mode clair' : 'Mode sombre'}>
            {dark
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>}
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div style={css.body}>
        {/* ─── Side panel ─── */}
        <div style={css.side}>
          <div style={css.sideHead}>
            <div style={css.stepCounter}>
              <span style={css.stepCounterDot}></span>
              <span>Étape {step.id} · {String(idx + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
            </div>
            <h2 style={css.stepTitle}>{step.label}</h2>
            {step.desc && <p style={css.stepDesc}>{step.desc}</p>}

            <div style={css.navRow}>
              <button
                onClick={() => setIdx(i => Math.max(0, i - 1))}
                disabled={idx === 0}
                style={css.navBtn(idx === 0)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                Précédent
              </button>
              <button
                onClick={() => setIdx(i => Math.min(steps.length - 1, i + 1))}
                disabled={idx === steps.length - 1}
                style={idx === steps.length - 1 ? css.navBtn(true) : css.navPrimary}
              >
                Suivant
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          <div style={css.stepsLabel}>Étapes du parcours</div>
          <div style={css.stepsList}>
            {steps.map((s, i) => {
              const hasContent = effectiveDevice === 'mobile' ? !!s.mobile : !!s.web;
              return (
                <button
                  key={s.id + i}
                  onClick={() => hasContent && setIdx(i)}
                  disabled={!hasContent}
                  style={css.stepItem(i === idx, hasContent)}
                  title={hasContent ? s.label : 'Pas d\'écran sur ce support'}
                >
                  <span style={css.stepNum}>{s.id}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                  {i === idx && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Stage ─── */}
        <div ref={stageRef} style={css.stage}>
          {/* Subtle grid in the stage area */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: dark
              ? 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)'
              : 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}/>

          {/* Device-shaped wrapper */}
          <div style={{
            width: frameW, height: frameH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'width .2s, height .2s',
            position: 'relative', zIndex: 1,
          }}>
            {effectiveDevice === 'mobile'
              ? (step.mobile ? renderMobile(step.mobile, t) : <NoScreen t={t} kind="mobile"/>)
              : (step.web ? renderWeb(step.web, t) : <NoScreen t={t} kind="desktop"/>)}
          </div>

          {/* Step indicator floating bottom */}
          <div style={{
            position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 5, padding: '6px 12px',
            background: dark ? 'rgba(24,28,22,0.85)' : 'rgba(255,255,255,0.85)',
            border: `1px solid ${t.border}`, borderRadius: 9999,
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            zIndex: 2,
          }}>
            {steps.map((s, i) => {
              const hasContent = effectiveDevice === 'mobile' ? !!s.mobile : !!s.web;
              return (
                <button
                  key={'dot'+i}
                  onClick={() => hasContent && setIdx(i)}
                  disabled={!hasContent}
                  style={{
                    width: i === idx ? 24 : 8, height: 8, borderRadius: 9999,
                    border: 'none',
                    background: i === idx ? accent : (hasContent ? (dark ? '#3A3D2E' : '#D5D2C7') : (dark ? '#22271F' : '#E6E4DD')),
                    cursor: hasContent ? 'pointer' : 'not-allowed',
                    transition: 'all .2s',
                    padding: 0,
                  }}
                  title={s.label}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoScreen({ t, kind }) {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 16,
      border: `1px dashed ${t.border}`, background: t.surface2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: t.muted, fontSize: 13, fontFamily: 'IBM Plex Mono, monospace',
      flexDirection: 'column', gap: 8, textAlign: 'center', padding: 24,
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>
      </svg>
      <div>Pas d'écran {kind === 'mobile' ? 'mobile' : 'desktop'}<br/>pour cette étape.</div>
    </div>
  );
}

Object.assign(window, { ParcoursShell });
