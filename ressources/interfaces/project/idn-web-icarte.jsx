// IDN Web Desktop — iCarte (Portefeuille numérique)
// Layout 2 colonnes : Cartes du Profil (gauche) · Autres + Ajouter (droite)
// Réutilise les constantes du module mobile (CARD_GRADIENTS, DEFAULT_CARDS, etc.)

function ICarteWeb({ t, screen = 'home', user = DEMO_USERS.citoyen }) {
  return (
    <BrowserChrome t={t} url="https://idn.ga/icarte" w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden', position: 'relative' }}>
        <CWNav t={t} user={user} screen="home"/>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ICW t={t} screen={screen}/>
        </div>
        {screen === 'modal-add'    && <ICWModal t={t}><ICWAddModal t={t}/></ICWModal>}
        {screen === 'modal-form'   && <ICWModal t={t}><ICWAddFormModal t={t}/></ICWModal>}
        {screen === 'modal-edit'   && <ICWModal t={t}><ICWEditModal t={t}/></ICWModal>}
        {screen === 'modal-custom' && <ICWModal t={t}><ICWCustomModal t={t}/></ICWModal>}
        {screen === 'modal-detail' && <ICWModal t={t}><ICWDetailModal t={t}/></ICWModal>}
      </div>
    </BrowserChrome>
  );
}

// Modal scaffold
function ICWModal({ t, children }) {
  return (
    <div style={{ position: 'absolute', inset: 60, top: 60, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 10 }}>
      <div style={{ background: t.surface, borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32)', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// Main page (left + right columns)
function ICW({ t, screen }) {
  const empty = screen === 'empty';
  const featured = empty ? [] : DEFAULT_CARDS.filter(c => c.featured);
  const others   = empty ? DEFAULT_CARDS : DEFAULT_CARDS.filter(c => !c.featured);
  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>PORTEFEUILLE NUMÉRIQUE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: t.ink, letterSpacing: -0.6, marginTop: 4 }}>iCarte</div>
          <div style={{ fontSize: 13, color: t.muted, marginTop: 4 }}>Gérez toutes vos cartes numériques.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, color: idnTokens.green, fontSize: 12, fontWeight: 600 }}>
            {React.cloneElement(CardIcons.wallet, { width: 14, height: 14 })}
            {featured.length}/6 dans le profil
          </span>
          <IdnButton t={t} variant="ghost" size="sm" leadIcon={CardIcons.wallet}>Voir le profil</IdnButton>
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Profile cards */}
        <ICWPanel t={t}
          title={<><span style={{ color: idnTokens.green }}>{IdnIcons.eye}</span> Cartes dans le Profil</>}
          right={<span style={{ fontSize: 11, color: t.muted }}>Glissez pour réordonner</span>}
        >
          {featured.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', border: `1.5px dashed ${t.border}`, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft, opacity: 0.5 }}>{React.cloneElement(CardIcons.wallet, { width: 40, height: 40 })}</div>
              <div style={{ fontSize: 14, color: t.ink2, fontWeight: 600, marginTop: 12 }}>Aucune carte dans le profil</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Ajoutez des cartes depuis la liste à droite</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {featured.map(c => <ICWMiniCard key={c.id} card={c} t={t}/>)}
            </div>
          )}
        </ICWPanel>

        {/* Right: Other cards + Add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ICWPanel t={t}
            title={<><span style={{ color: t.muted }}>{CardIcons.eyeOff}</span> Autres Cartes</>}
            right={<span style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono }}>{others.length} cartes</span>}
          >
            {others.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft, opacity: 0.5 }}>{React.cloneElement(CardIcons.cc, { width: 36, height: 36 })}</div>
                <div style={{ fontSize: 13, color: t.ink2, fontWeight: 500, marginTop: 10 }}>Toutes vos cartes sont dans le profil</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>Ajoutez de nouvelles cartes ci-dessous</div>
              </div>
            ) : (
              <div>
                {others.map((c, i) => (
                  <ICWRow key={c.id} card={c} t={t} last={i === others.length - 1} atMax={featured.length >= 6}/>
                ))}
              </div>
            )}
          </ICWPanel>

          <ICWPanel t={t} title={<span style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>AJOUTER UNE CARTE</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CARD_TEMPLATES.map(tp => (
                <button key={tp.id} style={{ background: t.surface2, border: `1px solid ${t.borderSoft}`, borderRadius: 10, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 30, borderRadius: 5, background: tp.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CardArtIcon name={tp.icon} color="#fff" size={14}/>
                  </div>
                  <div style={{ fontSize: 10, color: t.muted, fontWeight: 500 }}>{tp.label}</div>
                </button>
              ))}
              <button style={{ gridColumn: 'span 2', background: t.dark ? '#0F2A18' : idnTokens.greenSoft, border: `1px solid ${t.dark ? '#1B3F2A' : '#C5E0CC'}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: idnTokens.green }}>
                {CardIcons.palette}
                <span style={{ fontSize: 12, fontWeight: 600 }}>Personnalisée</span>
              </button>
            </div>
          </ICWPanel>
        </div>
      </div>
    </div>
  );
}

function ICWPanel({ t, title, right, children }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, display: 'flex', alignItems: 'center', gap: 8 }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

// Mini card (2-col grid, 85/55 ratio)
function ICWMiniCard({ card, t }) {
  const isOfficial = card.official;
  if (isOfficial) {
    return (
      <div style={{ position: 'relative', aspectRatio: '85/55', borderRadius: 12, background: '#fff', border: `1px solid ${t.border}`, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CardArtIcon name={card.icon} color="#009640" size={24}/>
          <span style={{ color: '#009640aa' }}>{CardIcons.grip}</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#009640', letterSpacing: 0.2 }}>{card.name}</div>
          <div style={{ fontSize: 10, color: '#00964099', marginTop: 2 }}>{card.sub}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 10, fontWeight: 600, color: '#009640' }}>Ouvrir →</div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', aspectRatio: '85/55', borderRadius: 12, background: card.grad, padding: 14, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'grab', boxShadow: '0 4px 10px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <CardArtIcon name={card.icon} color="#fff" size={20}/>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{CardIcons.grip}</span>
          <button title="Retirer du profil" style={{ width: 22, height: 22, borderRadius: 9999, background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(CardIcons.eyeOff, { width: 12, height: 12 })}
          </button>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{card.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{card.sub}</div>
      </div>
    </div>
  );
}

// Row (compact, with actions)
function ICWRow({ card, t, last, atMax }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: last ? 'none' : `1px solid ${t.borderSoft}` }}>
      <div style={{ width: 56, height: 36, borderRadius: 6, background: card.grad === 'white' ? '#fff' : card.grad, border: card.grad === 'white' ? `1px solid ${t.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CardArtIcon name={card.icon} color={card.grad === 'white' ? '#009640' : '#fff'} size={16}/>
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
          <button title="Modifier" style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.borderSoft}`, background: 'transparent', color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CardIcons.edit}</button>
          <button title="Ajouter au profil" disabled={atMax} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.borderSoft}`, background: 'transparent', color: t.muted, cursor: atMax ? 'not-allowed' : 'pointer', opacity: atMax ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.eye}</button>
          <button title="Supprimer" style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.borderSoft}`, background: 'transparent', color: '#B83A3A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CardIcons.trash}</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────
function ICWModalHeader({ t, title, sub }) {
  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.ink, letterSpacing: -0.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{sub}</div>}
      </div>
      <button style={{ width: 32, height: 32, borderRadius: 9999, background: t.surface2, border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  );
}

function ICWAddModal({ t }) {
  return (
    <>
      <ICWModalHeader t={t} title="Ajouter une carte" sub="Choisissez le type de carte à ajouter."/>
      <div style={{ padding: 24, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CARD_TEMPLATES.map(tp => (
            <button key={tp.id} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 48, height: 30, borderRadius: 5, background: tp.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CardArtIcon name={tp.icon} color="#fff" size={15}/>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{tp.label}</div>
            </button>
          ))}
        </div>
        <button style={{ width: '100%', marginTop: 12, background: t.dark ? '#0F2A18' : idnTokens.greenSoft, border: `1px solid ${t.dark ? '#1B3F2A' : '#C5E0CC'}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 48, height: 30, borderRadius: 5, background: 'linear-gradient(135deg,#0E7C3A,#2563AC,#F2C811)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(CardIcons.palette, { width: 14, height: 14, stroke: '#fff' })}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: idnTokens.green }}>Carte personnalisée</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Choisissez couleur, icône et nom.</div>
          </div>
        </button>
      </div>
    </>
  );
}

function ICWAddFormModal({ t }) {
  return (
    <>
      <ICWModalHeader t={t} title="Permis de Conduire" sub="Renseignez les informations de la carte."/>
      <div style={{ padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: t.surface2, borderRadius: 10 }}>
          <div style={{ width: 56, height: 36, borderRadius: 5, background: CARD_GRADIENTS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardArtIcon name="car" color="#fff" size={16}/>
          </div>
          <div style={{ fontSize: 12, color: t.muted }}>Type : <b style={{ color: t.ink }}>Permis de Conduire</b></div>
        </div>
        <IdnInput t={t} label="Nom de la carte" value="Permis de Conduire" onChange={()=>{}}/>
        <IdnInput t={t} label="Émetteur" value="Direction Générale des Transports" onChange={()=>{}}/>
        <IdnInput t={t} label="Nom complet" placeholder="DUPONT Jean" value="" onChange={()=>{}}/>
        <IdnInput t={t} label="Catégories" placeholder="A, B, C" value="B, C" onChange={()=>{}}/>
      </div>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <IdnButton t={t} variant="ghost">Annuler</IdnButton>
        <IdnButton t={t} variant="primary" leadIcon={IdnIcons.plus}>Créer</IdnButton>
      </div>
    </>
  );
}

function ICWEditModal({ t }) {
  return (
    <>
      <ICWModalHeader t={t} title="Modifier la carte"/>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ aspectRatio: '85/55', borderRadius: 12, background: CARD_GRADIENTS.purple, padding: 16, color: '#fff', maxWidth: 240, margin: '0 auto 6px', boxShadow: '0 8px 24px rgba(91,33,182,0.32)' }}>
          <CardArtIcon name="briefcase" color="#fff" size={20}/>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Carte de Visite</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>TechGabon SARL</div>
          </div>
        </div>
        <IdnInput t={t} label="Nom" value="Carte de Visite" onChange={()=>{}}/>
        <IdnInput t={t} label="Sous-titre" value="TechGabon SARL" onChange={()=>{}}/>
      </div>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <IdnButton t={t} variant="ghost">Annuler</IdnButton>
        <IdnButton t={t} variant="primary" leadIcon={IdnIcons.check}>Enregistrer</IdnButton>
      </div>
    </>
  );
}

function ICWCustomModal({ t }) {
  return (
    <>
      <ICWModalHeader t={t} title="Carte Personnalisée"/>
      <div style={{ padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ aspectRatio: '85/55', borderRadius: 12, background: CARD_GRADIENTS.green, padding: 16, color: '#fff', maxWidth: 240, margin: '0 auto', boxShadow: '0 8px 24px rgba(14,124,58,0.32)' }}>
          <CardArtIcon name="cc" color="#fff" size={18}/>
          <div style={{ marginTop: 22, fontSize: 13, fontWeight: 700 }}>Ma Carte</div>
        </div>
        <IdnInput t={t} label="Nom" value="Ma Carte" onChange={()=>{}}/>
        <div>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>COULEUR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {CUSTOM_COLORS.map((c, i) => (
              <button key={c.id} style={{ aspectRatio: '1', borderRadius: 10, background: c.grad, border: `2px solid ${i === 0 ? idnTokens.green : 'transparent'}`, cursor: 'pointer', boxShadow: i === 0 ? `0 0 0 3px ${t.dark ? '#0F2A18' : idnTokens.greenSoft}` : 'none' }}/>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>ICÔNE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {CUSTOM_ICONS.map((ic, i) => (
              <button key={ic.id} style={{ aspectRatio: '1', borderRadius: 10, background: t.surface2, border: `2px solid ${i === 0 ? idnTokens.green : t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? idnTokens.green : t.ink2 }}>
                <CardArtIcon name={ic.id} color="currentColor" size={18}/>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <IdnButton t={t} variant="ghost">Annuler</IdnButton>
        <IdnButton t={t} variant="primary" leadIcon={IdnIcons.plus}>Créer</IdnButton>
      </div>
    </>
  );
}

// Detail with front/back (modal)
function ICWDetailModal({ t }) {
  const [back, setBack] = React.useState(false);
  const card = DEFAULT_CARDS[0];
  return (
    <>
      <ICWModalHeader t={t} title={card.name} sub={card.sub}/>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ perspective: 1200, height: 240 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: back ? 'rotateY(180deg)' : 'none', transition: 'transform .5s' }}>
            {/* Front */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 14, background: card.grad, padding: 22, color: '#fff', boxShadow: '0 12px 32px rgba(14,124,58,0.32)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <CardArtIcon name="seal" color="#fff" size={28}/>
                <IdnFlagBars width={28} height={3}/>
              </div>
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, letterSpacing: 1.4 }}>NOM COMPLET</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>DUPONT Jean</div>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 16 }}>
                <div><div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: 1.2 }}>NUMÉRO</div><div style={{ fontFamily: idnTokens.mono, fontSize: 13, marginTop: 2 }}>GA-1234-5678-9012</div></div>
                <div><div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: 1.2 }}>VALIDITÉ</div><div style={{ fontFamily: idnTokens.mono, fontSize: 13, marginTop: 2 }}>12/2030</div></div>
              </div>
            </div>
            {/* Back */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 14, background: card.grad, padding: 22, color: '#fff', boxShadow: '0 12px 32px rgba(14,124,58,0.32)' }}>
              <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2, fontWeight: 600 }}>VERSO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
                {[['NAISSANCE','15/03/1990'],['LIEU','Libreville'],['SEXE','M'],['TAILLE','1.75 m']].map(([k, v]) => (
                  <div key={k}><div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: 1.2 }}>{k}</div><div style={{ fontFamily: idnTokens.mono, fontSize: 14, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setBack(!back)} style={{ background: 'transparent', border: 'none', color: t.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'center' }}>
          {CardIcons.rotate} Cliquez pour retourner
        </button>
      </div>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <IdnButton t={t} variant="ghost" leadIcon={IdnIcons.qr}>QR Code</IdnButton>
        <IdnButton t={t} variant="ghost" leadIcon={CardIcons.download}>Télécharger</IdnButton>
        <IdnButton t={t} variant="primary" leadIcon={CardIcons.share}>Partager</IdnButton>
      </div>
    </>
  );
}

Object.assign(window, { ICarteWeb });
