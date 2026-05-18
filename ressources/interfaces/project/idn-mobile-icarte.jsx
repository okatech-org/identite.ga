// IDN Mobile — iCarte (Portefeuille numérique)
// Toutes les écrans du module iCarte adaptés au format mobile natif.
// Réutilise NPhone / NLargeHeader / NSheetHeader / IdnIcons / idnTokens.

// ─────────────────────────────────────────────────────────────
// Icônes Lucide localement (stroke 1.6, 24x24, monochrome)
// ─────────────────────────────────────────────────────────────
const CardIcons = {
  wallet:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14l2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M16 14h4v-4h-4a2 2 0 0 0 0 4z"/></svg>,
  cc:        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>,
  car:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16V11l2-5h10l2 5v5"/><path d="M5 16h14v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>,
  bus:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14V7a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3z"/><path d="M5 11h14M8 17v2M16 17v2"/><circle cx="8.5" cy="14.5" r="1"/><circle cx="15.5" cy="14.5" r="1"/></svg>,
  heart:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>,
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  globe:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>,
  vote:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M5 21h14a2 2 0 0 0 2-2v-9l-9-7-9 7v9a2 2 0 0 0 2 2z"/></svg>,
  gift:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8h16v-8M2 8h20v4H2zM12 8v12M8 8a2 2 0 1 1 0-4c2 0 4 4 4 4M16 8a2 2 0 1 0 0-4c-2 0-4 4-4 4"/></svg>,
  users:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2 21c1-3.5 3.5-5.5 7-5.5s6 2 7 5.5"/><circle cx="17" cy="7" r="2.5"/><path d="M16 13c2.5 0 5 1.6 6 4"/></svg>,
  flag:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3v18M4 4h12l-2 4 2 4H4"/></svg>,
  palette:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s5 0 5-4a9 9 0 0 0-7-9z"/><circle cx="7" cy="10" r="1.2"/><circle cx="9.5" cy="6.5" r="1.2"/><circle cx="14.5" cy="6.5" r="1.2"/><circle cx="17" cy="10" r="1.2"/></svg>,
  edit:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h4l11-11-4-4L3 17z"/><path d="M14 6l4 4"/></svg>,
  trash:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>,
  grip:      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/></svg>,
  eyeOff:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 3l18 18M10.5 6.4A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6s-1 1.7-3 3.4M6.7 7.9C3.7 9.6 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>,
  rotate:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/></svg>,
  share:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-3.8M8.2 13l7.6 3.8"/></svg>,
  download:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M7 11l5 5 5-5M5 21h14"/></svg>,
};

// Gradients par type de carte (issus du cahier des charges)
const CARD_GRADIENTS = {
  green:    'linear-gradient(135deg,#16a34a 0%,#15803d 50%,#065f46 100%)',
  orange:   'linear-gradient(135deg,#f97316 0%,#ea580c 50%,#dc2626 100%)',
  blue:     'linear-gradient(135deg,#3b82f6 0%,#2563eb 50%,#4338ca 100%)',
  rose:     'linear-gradient(135deg,#f43f5e 0%,#e11d48 50%,#db2777 100%)',
  black:    'linear-gradient(135deg,#1e293b 0%,#0f172a 50%,#000000 100%)',
  purple:   'linear-gradient(135deg,#9333ea 0%,#7e22ce 50%,#5b21b6 100%)',
  amber:    'linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#a16207 100%)',
  yellow:   'linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#ca8a04 100%)',
  indigo:   'linear-gradient(135deg,#4f46e5 0%,#4338ca 50%,#1e40af 100%)',
};

// Catalogue par défaut (verbatim du cahier des charges)
const DEFAULT_CARDS = [
  { id: 'cni',       type: 'cni',       name: 'Carte d\'Identité',    sub: 'République Gabonaise', grad: CARD_GRADIENTS.green,  icon: 'seal',     featured: true },
  { id: 'driving',   type: 'driving',   name: 'Permis de Conduire',   sub: 'Catégories B, C',     grad: CARD_GRADIENTS.orange, icon: 'car',      featured: true },
  { id: 'transport', type: 'transport', name: 'Carte Transport',      sub: 'STLG Libreville',     grad: CARD_GRADIENTS.blue,   icon: 'bus',      featured: true },
  { id: 'health',    type: 'health',    name: 'CNAMGS',               sub: 'Assurance Maladie',   grad: 'white',                icon: 'heart',    featured: true, official: true },
  { id: 'bank',      type: 'bank',      name: 'BGFI Bank',            sub: 'Visa Premium',        grad: CARD_GRADIENTS.black,  icon: 'cc',       featured: true },
  { id: 'business',  type: 'business',  name: 'Carte de Visite',      sub: 'TechGabon SARL',      grad: CARD_GRADIENTS.purple, icon: 'briefcase',featured: true },
  { id: 'consular',  type: 'consular',  name: 'Carte Consulaire',     sub: 'République Gabonaise',grad: CARD_GRADIENTS.amber,  icon: 'globe' },
  { id: 'voter',     type: 'voter',     name: 'Carte d\'Électeur',    sub: 'Bureau 12 Libreville',grad: CARD_GRADIENTS.yellow, icon: 'vote' },
  { id: 'loyalty',   type: 'loyalty',   name: 'Carte Fidélité',       sub: 'Casino · 1500 pts',   grad: CARD_GRADIENTS.indigo, icon: 'gift' },
];

const CARD_TEMPLATES = [
  { id: 'cni',       label: 'CNI',          icon: 'seal',     grad: CARD_GRADIENTS.green },
  { id: 'driving',   label: 'Permis',       icon: 'car',      grad: CARD_GRADIENTS.orange },
  { id: 'transport', label: 'Transport',    icon: 'bus',      grad: CARD_GRADIENTS.blue },
  { id: 'health',    label: 'Santé',        icon: 'heart',    grad: CARD_GRADIENTS.rose },
  { id: 'bank',      label: 'Bancaire',     icon: 'cc',       grad: CARD_GRADIENTS.black },
  { id: 'business',  label: 'Visite',       icon: 'briefcase',grad: CARD_GRADIENTS.purple },
];

const CUSTOM_COLORS = [
  { id: 'green',  label: 'Vert',   grad: CARD_GRADIENTS.green },
  { id: 'orange', label: 'Orange', grad: CARD_GRADIENTS.orange },
  { id: 'blue',   label: 'Bleu',   grad: CARD_GRADIENTS.blue },
  { id: 'rose',   label: 'Rose',   grad: CARD_GRADIENTS.rose },
  { id: 'black',  label: 'Noir',   grad: CARD_GRADIENTS.black },
  { id: 'purple', label: 'Violet', grad: CARD_GRADIENTS.purple },
];

const CUSTOM_ICONS = [
  { id: 'cc', label: 'Carte' },
  { id: 'car', label: 'Voiture' },
  { id: 'bus', label: 'Bus' },
  { id: 'heart', label: 'Cœur' },
  { id: 'briefcase', label: 'Valise' },
  { id: 'users', label: 'Groupe' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function CardArtIcon({ name, color = '#fff', size = 18 }) {
  if (name === 'seal') return (
    // Sceau du Gabon stylisé (placeholder discret — coq + branches)
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 13c0-3 1.5-5 3-5s3 2 3 5"/>
      <path d="M12 8V6M9 16h6"/>
    </svg>
  );
  const ic = CardIcons[name];
  if (!ic) return null;
  return React.cloneElement(ic, { width: size, height: size, stroke: color });
}

// Mini-carte (vignette featured, ratio 85/55)
function MiniCard({ card, t, onRemove, dragMode }) {
  const isOfficial = card.official;
  if (isOfficial) {
    // Variante santé : fond blanc, libellés verts
    return (
      <div style={{ position: 'relative', aspectRatio: '85/55', borderRadius: 11, background: '#fff', border: `1px solid ${t.border}`, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CardArtIcon name={card.icon} color="#009640" size={20}/>
          {dragMode && <span style={{ color: '#009640aa' }}>{CardIcons.grip}</span>}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#009640', letterSpacing: 0.2, lineHeight: 1.15 }}>{card.name}</div>
          <div style={{ fontSize: 8, color: '#00964099', marginTop: 2 }}>{card.sub}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 9, fontWeight: 600, color: '#009640', display: 'flex', alignItems: 'center', gap: 3 }}>Ouvrir →</div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', aspectRatio: '85/55', borderRadius: 11, background: card.grad, padding: 10, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <CardArtIcon name={card.icon} color="#fff" size={18}/>
        {dragMode ? (
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{CardIcons.grip}</span>
        ) : (
          <button onClick={onRemove} title="Retirer du profil" style={{ width: 20, height: 20, borderRadius: 9999, background: 'rgba(0,0,0,0.22)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(CardIcons.eyeOff, { width: 11, height: 11 })}
          </button>
        )}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.15 }}>{card.name}</div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{card.sub}</div>
      </div>
    </div>
  );
}

// Ligne "autres cartes" (compact row)
function CardRow({ card, t, atMax }) {
  const featuredAction = card.featured;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
      <div style={{ width: 52, height: 32, borderRadius: 6, background: card.grad === 'white' ? '#fff' : card.grad, border: card.grad === 'white' ? `1px solid ${t.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CardArtIcon name={card.icon} color={card.grad === 'white' ? '#009640' : '#fff'} size={15}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
        <div style={{ fontSize: 11, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.sub}</div>
      </div>
      {card.official ? (
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Voir <span>{IdnIcons.arrow}</span>
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 4 }}>
          <button title="Modifier" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.borderSoft}`, background: 'transparent', color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CardIcons.edit}</button>
          <button title={featuredAction ? 'Retirer' : 'Ajouter au profil'} disabled={!featuredAction && atMax} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.borderSoft}`, background: 'transparent', color: t.muted, cursor: atMax && !featuredAction ? 'not-allowed' : 'pointer', opacity: !featuredAction && atMax ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {featuredAction ? CardIcons.eyeOff : IdnIcons.eye}
          </button>
          <button title="Supprimer" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.borderSoft}`, background: 'transparent', color: '#B83A3A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CardIcons.trash}</button>
        </div>
      )}
    </div>
  );
}

// Sous-titre de section uppercase
function NSectionLabel({ t, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '14px 4px 8px' }}>
      <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>{children}</div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. iCarte — Accueil (liste des cartes)
// ─────────────────────────────────────────────────────────────
function ScrICarteHome({ t, empty }) {
  const featured = empty ? [] : DEFAULT_CARDS.filter(c => c.featured);
  const others   = empty ? DEFAULT_CARDS : DEFAULT_CARDS.filter(c => !c.featured);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="iCarte" sub="Gérez toutes vos cartes numériques"
        right={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, fontSize: 11, fontWeight: 600 }}>{featured.length}/6 dans le profil</span>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 22px' }}>
        {/* Cartes dans le profil */}
        <NSectionLabel t={t} right={<span style={{ fontSize: 10, color: t.muted }}>Maintenez pour réordonner</span>}>
          <span style={{ color: idnTokens.green }}>● </span>CARTES DANS LE PROFIL
        </NSectionLabel>
        {featured.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', border: `1.5px dashed ${t.border}`, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft, opacity: 0.5 }}>{CardIcons.wallet && React.cloneElement(CardIcons.wallet, { width: 36, height: 36 })}</div>
            <div style={{ fontSize: 13, color: t.ink2, fontWeight: 500, marginTop: 10 }}>Aucune carte dans le profil</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>Ajoutez des cartes depuis la liste ci-dessous</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {featured.map(c => <MiniCard key={c.id} card={c} t={t} dragMode/>)}
          </div>
        )}

        {/* Autres cartes */}
        <NSectionLabel t={t} right={<span style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{others.length} cartes</span>}>
          AUTRES CARTES
        </NSectionLabel>
        {others.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft, opacity: 0.5 }}>{React.cloneElement(CardIcons.cc, { width: 32, height: 32 })}</div>
            <div style={{ fontSize: 12, color: t.ink2, fontWeight: 500, marginTop: 8 }}>Toutes vos cartes sont dans le profil</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>Ajoutez de nouvelles cartes ci-dessous</div>
          </div>
        ) : (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '4px 10px' }}>
            {others.map((c, i) => (
              <div key={c.id} style={{ borderBottom: i === others.length - 1 ? 'none' : `1px solid ${t.borderSoft}` }}>
                <CardRow card={c} t={t} atMax={featured.length >= 6}/>
              </div>
            ))}
          </div>
        )}

        {/* Ajouter une carte */}
        <NSectionLabel t={t}>AJOUTER UNE CARTE</NSectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {CARD_TEMPLATES.map(tp => (
            <button key={tp.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{ width: 40, height: 26, borderRadius: 5, background: tp.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardArtIcon name={tp.icon} color="#fff" size={13}/>
              </div>
              <div style={{ fontSize: 10, color: t.muted, fontWeight: 500 }}>{tp.label}</div>
            </button>
          ))}
          <button style={{ gridColumn: 'span 2', background: t.dark ? '#0F2A18' : idnTokens.greenSoft, border: `1px solid ${t.dark ? '#1B3F2A' : '#C5E0CC'}`, borderRadius: 10, padding: '10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: idnTokens.green }}>
            {CardIcons.palette}
            <span style={{ fontSize: 12, fontWeight: 600 }}>Personnalisée</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. iCarte — Détail d'une carte (recto, plein écran)
// ─────────────────────────────────────────────────────────────
function ScrICarteCardFront({ t }) {
  const card = DEFAULT_CARDS[0]; // CNI
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Carte d'Identité" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}>{IdnIcons.more}</button>}/>
      <div style={{ flex: 1, padding: '20px 22px 18px', display: 'flex', flexDirection: 'column' }}>
        {/* Grande carte */}
        <div style={{ aspectRatio: '85/55', borderRadius: 18, background: card.grad, padding: 20, color: '#fff', position: 'relative', boxShadow: '0 12px 32px rgba(14,124,58,0.32)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 9999, background: 'rgba(255,255,255,0.08)' }}/>
          <div style={{ position: 'absolute', right: 14, bottom: 14 }}><IdnFlagBars width={32} height={3}/></div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <CardArtIcon name="seal" color="#fff" size={28}/>
            <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.16)', letterSpacing: 0.4 }}>RECTO</span>
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, letterSpacing: 1.4 }}>NOM COMPLET</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>DUPONT Jean</div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: 1.2 }}>NUMÉRO</div>
              <div style={{ fontFamily: idnTokens.mono, fontSize: 12, marginTop: 2 }}>GA-1234-5678-9012</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: 1.2 }}>VALIDITÉ</div>
              <div style={{ fontFamily: idnTokens.mono, fontSize: 12, marginTop: 2 }}>12/2030</div>
            </div>
          </div>
        </div>

        {/* Hint flip */}
        <button style={{ marginTop: 14, background: 'transparent', border: 'none', color: t.muted, display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'center', cursor: 'pointer', fontSize: 12 }}>
          {CardIcons.rotate} Toucher pour retourner
        </button>

        <div style={{ flex: 1 }}/>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <IdnButton t={t} variant="ghost" full leadIcon={IdnIcons.qr}>QR Code</IdnButton>
          <IdnButton t={t} variant="ghost" full leadIcon={CardIcons.download}>Télécharger</IdnButton>
        </div>
        <IdnButton t={t} variant="primary" size="lg" full style={{ marginTop: 10 }} leadIcon={CardIcons.share}>Partager</IdnButton>
      </div>
    </div>
  );
}

// 3. iCarte — Détail (verso)
function ScrICarteCardBack({ t }) {
  const card = DEFAULT_CARDS[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Carte d'Identité" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}>{IdnIcons.more}</button>}/>
      <div style={{ flex: 1, padding: '20px 22px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ aspectRatio: '85/55', borderRadius: 18, background: card.grad, padding: 20, color: '#fff', position: 'relative', boxShadow: '0 12px 32px rgba(14,124,58,0.32)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2, fontWeight: 600 }}>VERSO</div>
            <button style={{ width: 28, height: 28, borderRadius: 9999, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CardIcons.rotate}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
            {[
              { k: 'NAISSANCE', v: '15/03/1990' },
              { k: 'LIEU', v: 'Libreville' },
              { k: 'SEXE', v: 'M' },
              { k: 'TAILLE', v: '1.75 m' },
            ].map((r, i) => (
              <div key={i}>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: 1.2 }}>{r.k}</div>
                <div style={{ fontFamily: idnTokens.mono, fontSize: 13, marginTop: 2 }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6, color: t.muted, fontSize: 12 }}>
          {CardIcons.rotate} Toucher pour retourner
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <IdnButton t={t} variant="ghost" full leadIcon={IdnIcons.qr}>QR Code</IdnButton>
          <IdnButton t={t} variant="ghost" full leadIcon={CardIcons.download}>Télécharger</IdnButton>
        </div>
        <IdnButton t={t} variant="primary" size="lg" full style={{ marginTop: 10 }} leadIcon={CardIcons.share}>Partager</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. iCarte — Choisir un template (bottom sheet)
// ─────────────────────────────────────────────────────────────
function ScrICarteAdd({ t }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {/* Background blur */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}/>
      {/* Bottom sheet */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: t.surface, borderRadius: '22px 22px 0 0', padding: '14px 22px 24px', maxHeight: '88%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 38, height: 4, borderRadius: 9999, background: t.borderSoft, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.ink, letterSpacing: -0.2 }}>Ajouter une carte</div>
          <button style={{ width: 28, height: 28, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 14, lineHeight: 1.5 }}>Choisissez le type de carte à ajouter à votre portefeuille.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CARD_TEMPLATES.map(tp => (
            <button key={tp.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 44, height: 28, borderRadius: 5, background: tp.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CardArtIcon name={tp.icon} color="#fff" size={15}/>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{tp.label}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <button style={{ width: '100%', background: t.dark ? '#0F2A18' : idnTokens.greenSoft, border: `1px solid ${t.dark ? '#1B3F2A' : '#C5E0CC'}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 44, height: 28, borderRadius: 5, background: 'linear-gradient(135deg,#0E7C3A,#2563AC,#F2C811)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {React.cloneElement(CardIcons.palette, { width: 14, height: 14, stroke: '#fff' })}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: idnTokens.green }}>Carte personnalisée</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Choisissez couleur, icône et nom.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. iCarte — Formulaire d'ajout (template choisi → champs)
// ─────────────────────────────────────────────────────────────
function ScrICarteAddForm({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Ajouter une carte" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px 14px' }}>
        {/* Vignette du template sélectionné */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 18 }}>
          <div style={{ width: 56, height: 36, borderRadius: 6, background: CARD_GRADIENTS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CardArtIcon name="car" color="#fff" size={18}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Permis de Conduire</div>
            <div style={{ fontSize: 11, color: t.muted }}>Type sélectionné</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <IdnInput t={t} label="Nom de la carte" value="Permis de Conduire" onChange={()=>{}}/>
          <IdnInput t={t} label="Émetteur / Organisation" value="Direction Générale des Transports" onChange={()=>{}}/>
          <IdnInput t={t} label="Nom complet" placeholder="DUPONT Jean" value="" onChange={()=>{}}/>
          <IdnInput t={t} label="Catégories" placeholder="A, B, C" value="B, C" onChange={()=>{}}/>
        </div>
      </div>
      <div style={{ padding: '12px 22px 22px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', gap: 8 }}>
        <IdnButton t={t} variant="ghost" size="lg" full>Annuler</IdnButton>
        <IdnButton t={t} variant="primary" size="lg" full leadIcon={IdnIcons.plus}>Créer</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. iCarte — Édition rapide
// ─────────────────────────────────────────────────────────────
function ScrICarteEdit({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Modifier la carte" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>}/>
      <div style={{ flex: 1, padding: '24px 22px 14px' }}>
        <div style={{ aspectRatio: '85/55', borderRadius: 14, background: CARD_GRADIENTS.purple, padding: 16, color: '#fff', maxWidth: 220, margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(91,33,182,0.32)' }}>
          <CardArtIcon name="briefcase" color="#fff" size={18}/>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Carte de Visite</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>TechGabon SARL</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <IdnInput t={t} label="Nom" value="Carte de Visite" onChange={()=>{}}/>
          <IdnInput t={t} label="Sous-titre" value="TechGabon SARL" onChange={()=>{}}/>
        </div>
      </div>
      <div style={{ padding: '12px 22px 22px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', gap: 8 }}>
        <IdnButton t={t} variant="ghost" size="lg" full>Annuler</IdnButton>
        <IdnButton t={t} variant="primary" size="lg" full leadIcon={IdnIcons.check}>Enregistrer</IdnButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. iCarte — Carte personnalisée
// ─────────────────────────────────────────────────────────────
function ScrICarteCustom({ t }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NSheetHeader t={t} title="Carte personnalisée" onBack={() => {}} right={<button style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px 14px' }}>
        {/* Aperçu live */}
        <div style={{ aspectRatio: '85/55', borderRadius: 14, background: CARD_GRADIENTS.green, padding: 16, color: '#fff', maxWidth: 220, margin: '0 auto 22px', boxShadow: '0 8px 24px rgba(14,124,58,0.32)' }}>
          <CardArtIcon name="cc" color="#fff" size={18}/>
          <div style={{ marginTop: 22, fontSize: 13, fontWeight: 700 }}>Ma Carte</div>
        </div>

        <IdnInput t={t} label="Nom" value="Ma Carte" onChange={()=>{}}/>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>COULEUR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {CUSTOM_COLORS.map((c, i) => (
              <button key={c.id} style={{ aspectRatio: '1', borderRadius: 10, background: c.grad, border: `2px solid ${i === 0 ? idnTokens.green : 'transparent'}`, cursor: 'pointer', boxShadow: i === 0 ? `0 0 0 3px ${t.dark ? '#0F2A18' : idnTokens.greenSoft}` : 'none' }}/>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>ICÔNE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {CUSTOM_ICONS.map((ic, i) => (
              <button key={ic.id} style={{ aspectRatio: '1', borderRadius: 10, background: t.surface, border: `2px solid ${i === 0 ? idnTokens.green : t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? idnTokens.green : t.ink2 }}>
                <CardArtIcon name={ic.id} color="currentColor" size={18}/>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 22px 22px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', gap: 8 }}>
        <IdnButton t={t} variant="ghost" size="lg" full>Annuler</IdnButton>
        <IdnButton t={t} variant="primary" size="lg" full leadIcon={IdnIcons.plus}>Créer</IdnButton>
      </div>
    </div>
  );
}

// Stack version — preview compacte type Apple Wallet (vue dashboard)
function ScrICarteStack({ t }) {
  const cards = DEFAULT_CARDS.filter(c => c.featured && !c.official);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NLargeHeader t={t} title="Portefeuille" sub={`${cards.length} cartes`}
        right={<button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.plus}</button>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 22px 22px', position: 'relative' }}>
        {/* Stack effect */}
        <div style={{ position: 'relative', height: 280 }}>
          {cards.map((c, i) => (
            <div key={c.id} style={{ position: 'absolute', left: 0, right: 0, top: i * 38, aspectRatio: '85/55', borderRadius: 14, background: c.grad, padding: 14, color: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', zIndex: cards.length - i }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardArtIcon name={c.icon} color="#fff" size={16}/>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, letterSpacing: 0.4 }}>{c.name}</div>
              </div>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', marginTop: 12, padding: 12, background: 'transparent', border: 'none', color: idnTokens.green, fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          Voir toutes les cartes ({DEFAULT_CARDS.length}) {IdnIcons.arrow}
        </button>
      </div>
    </div>
  );
}

// Export to NativeApp
Object.assign(window, {
  ScrICarteHome, ScrICarteCardFront, ScrICarteCardBack,
  ScrICarteAdd, ScrICarteAddForm, ScrICarteEdit, ScrICarteCustom, ScrICarteStack,
  // Shared with desktop versions
  CardIcons, CardArtIcon, CARD_GRADIENTS, DEFAULT_CARDS, CARD_TEMPLATES, CUSTOM_COLORS, CUSTOM_ICONS,
});
