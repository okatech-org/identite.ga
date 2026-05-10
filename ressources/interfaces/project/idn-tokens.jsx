// IDN — Design tokens + shared primitives
// Sober institutional aesthetic. Green primary, yellow + blue as accents.

const idnTokens = {
  // Gabon flag colors — used institutionally, not decoratively
  green:   '#0E7C3A',  // primary, deepened from #009639 for AA on white
  greenDk: '#0A5C2C',
  greenSoft:'#E6F2EA',
  yellow:  '#F2C811',
  yellowSoft:'#FCF4D6',
  blue:    '#2563AC',
  blueSoft:'#E6EEF7',

  // Light mode neutrals
  l: {
    bg:        '#FAFAF8',
    surface:   '#FFFFFF',
    surface2:  '#F4F3EE',
    border:    '#E6E4DD',
    borderSoft:'#EFEEE9',
    ink:       '#16170F',
    ink2:      '#3A3D2E',
    muted:     '#74766B',
    mutedSoft: '#A6A89D',
  },
  // Dark mode neutrals
  d: {
    bg:        '#0E110D',
    surface:   '#181C16',
    surface2:  '#22271F',
    border:    '#2C3128',
    borderSoft:'#232820',
    ink:       '#F2F0E8',
    ink2:      '#D4D2C7',
    muted:     '#9A9C8E',
    mutedSoft: '#6B6D62',
  },

  // Type scale
  font: '"IBM Plex Sans", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',

  radius: { sm: 6, md: 10, lg: 14, xl: 20, pill: 9999 },
};

// Resolve theme palette for given mode
function idnTheme(dark) {
  const n = dark ? idnTokens.d : idnTokens.l;
  return { ...idnTokens, ...n, dark };
}

// ─────────────────────────────────────────────────────────────
// LoA badge (Niveau de garantie 1/2/3) — discrete
// ─────────────────────────────────────────────────────────────
function LoABadge({ level = 1, t, compact = false }) {
  const meta = {
    1: { label: 'Niveau 1', sub: 'Faible',       color: t.muted,  fill: t.surface2 },
    2: { label: 'Niveau 2', sub: 'Substantiel',  color: t.blue,   fill: t.dark ? '#10243A' : t.blueSoft },
    3: { label: 'Niveau 3', sub: 'Élevé',        color: t.green,  fill: t.dark ? '#0F2A18' : t.greenSoft },
  }[level];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: compact ? '2px 8px' : '4px 10px',
      borderRadius: 9999,
      background: meta.fill,
      color: meta.color,
      fontSize: compact ? 11 : 12,
      fontWeight: 600,
      letterSpacing: 0.1,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
    }}>
      <svg width={compact ? 10 : 11} height={compact ? 10 : 11} viewBox="0 0 12 12" fill="none">
        <path d="M6 1l4 1.5v3.5c0 2.4-1.7 4.4-4 5-2.3-.6-4-2.6-4-5V2.5L6 1z" fill={meta.color}/>
      </svg>
      {meta.label}{!compact && <span style={{ opacity: 0.7, fontWeight: 500 }}>· {meta.sub}</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
function IdnButton({ children, variant = 'primary', size = 'md', t, onClick, disabled, full, leadIcon, style = {}, type = 'button' }) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13 },
    md: { h: 40, px: 16, fs: 14 },
    lg: { h: 48, px: 20, fs: 15 },
  }[size];
  const variants = {
    primary: { bg: t.green, fg: '#fff', bd: t.green, hover: t.greenDk },
    ghost:   { bg: 'transparent', fg: t.ink, bd: t.border, hover: t.surface2 },
    quiet:   { bg: 'transparent', fg: t.ink2, bd: 'transparent', hover: t.surface2 },
    danger:  { bg: 'transparent', fg: '#B83A3A', bd: t.border, hover: 'rgba(184,58,58,0.06)' },
  }[variant];
  const [hov, setHov] = React.useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`, fontSize: sizes.fs, fontWeight: 500,
        fontFamily: idnTokens.font,
        background: hov && !disabled ? variants.hover : variants.bg,
        color: variants.fg, border: `1px solid ${variants.bd}`,
        borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: full ? '100%' : 'auto',
        transition: 'background .12s, color .12s, border-color .12s',
        ...style,
      }}>
      {leadIcon}
      {children}
    </button>
  );
}

function IdnInput({ label, value, onChange, placeholder, type = 'text', t, hint, error, leadIcon, suffix, autoFocus }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'block', fontFamily: idnTokens.font }}>
      {label && <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, marginBottom: 6 }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: t.surface,
        border: `1px solid ${error ? '#B83A3A' : focused ? t.green : t.border}`,
        boxShadow: focused ? `0 0 0 3px ${t.dark ? 'rgba(14,124,58,0.25)' : 'rgba(14,124,58,0.12)'}` : 'none',
        borderRadius: 8, padding: '0 12px', height: 44,
        transition: 'border-color .12s, box-shadow .12s',
      }}>
        {leadIcon && <span style={{ color: t.muted, display: 'flex' }}>{leadIcon}</span>}
        <input
          type={type} value={value} onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: t.ink, fontFamily: idnTokens.font, height: '100%',
          }}
        />
        {suffix}
      </div>
      {(hint || error) && (
        <div style={{ fontSize: 12, color: error ? '#B83A3A' : t.muted, marginTop: 6 }}>
          {error || hint}
        </div>
      )}
    </label>
  );
}

function IdnCard({ children, t, style = {}, padded = true }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: padded ? 20 : 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

// IDN logo mark (original — three-bar shield wordmark)
function IdnMark({ size = 28, t, color }) {
  const c = color || idnTokens.green;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="7" fill={c} />
      <path d="M11 9v14M16 13v10M21 17v6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function IdnFlagBars({ height = 3, width = 36, t }) {
  return (
    <div style={{ display: 'flex', gap: 3, height }}>
      <div style={{ flex: 1, background: idnTokens.green, borderRadius: 2 }} />
      <div style={{ flex: 1, background: idnTokens.yellow, borderRadius: 2 }} />
      <div style={{ flex: 1, background: idnTokens.blue, borderRadius: 2 }} />
    </div>
  );
}

// Plain icon set (24x24 stroke icons — original, no library)
const IdnIcons = {
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>,
  userPlus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="8" r="4"/><path d="M2 21c1.4-3.7 4.2-5.6 7.5-5.6"/><path d="M18 13v6M15 16h6"/></svg>,
  login: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M3 12h12"/></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>,
  arrow: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowL: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  doc: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>,
  camera: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M9 6l1.5-2h3L15 6"/></svg>,
  qr: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v7M14 21h3"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3V9zM10 19a2 2 0 0 0 4 0"/></svg>,
  link: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 14l4-4M9 7h-2a4 4 0 0 0 0 8h2M15 17h2a4 4 0 0 0 0-8h-2"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  more: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>,
};

Object.assign(window, { idnTokens, idnTheme, LoABadge, IdnButton, IdnInput, IdnCard, IdnMark, IdnFlagBars, IdnIcons });
