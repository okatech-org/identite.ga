// IDN Mobile — Centre de notifications
// Filtres (Tout/Non lu/Sécurité/Documents), groupes Aujourd'hui/Hier, CTA par item

const NotifIcons = {
  back:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  checkD:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13l3 3 7-7M9 13l3 3 10-12"/></svg>,
  trash:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>,
  shield:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z"/></svg>,
  file:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>,
  sparkles:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5 5 1.5-5 1.5L12 16l-1.5-5-5-1.5 5-1.5z"/><path d="M19 14v3M17.5 15.5h3M5 4v2M4 5h2"/></svg>,
  user:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>,
  bell:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3V9zM10 19a2 2 0 0 0 4 0"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg>,
};

// Couleurs par type
const NOTIF_TYPE = {
  security: { c: '#dc2626', bg: '#fee2e2', dBg: 'rgba(220,38,38,0.16)', icon: 'shield' },
  document: { c: '#2563eb', bg: '#dbeafe', dBg: 'rgba(37,99,235,0.16)',  icon: 'file' },
  ai:       { c: '#16a34a', bg: '#dcfce7', dBg: 'rgba(22,163,74,0.16)',  icon: 'sparkles' },
  cv:       { c: '#9333ea', bg: '#f3e8ff', dBg: 'rgba(147,51,234,0.16)', icon: 'user' },
  system:   { c: '#6b7280', bg: '#f3f4f6', dBg: 'rgba(107,114,128,0.18)',icon: 'bell' },
};

const NOTIF_MOCK = [
  { id: 1, type: 'security', title: 'Nouvelle connexion détectée', message: 'Une connexion a été détectée depuis Chrome sur Windows à 14:30. Si ce n\'est pas vous, changez votre mot de passe.', time: 'Il y a 2 min', read: false, date: 'today' },
  { id: 2, type: 'document', title: 'Document expirant bientôt', message: 'Votre passeport expire dans 30 jours. Pensez à initier le renouvellement.', time: 'Il y a 2 h', read: false, date: 'today', actionLabel: 'Renouveler' },
  { id: 5, type: 'ai',       title: 'Type détecté automatiquement', message: 'cni_recto.pdf classé dans le dossier Identité par l\'IA.', time: 'Il y a 4 h', read: true, date: 'today' },
  { id: 3, type: 'ai',       title: 'Suggestion IA', message: 'Ajoutez vos compétences linguistiques pour compléter votre profil à 100 %.', time: 'Hier', read: true, date: 'yesterday', actionLabel: 'Voir mon profil' },
  { id: 4, type: 'cv',       title: 'Vue de profil', message: 'Votre CV a été consulté par « Gabon Telecom » pour le poste de Chef de Projet.', time: 'Hier', read: true, date: 'yesterday' },
];

const FILTERS = [
  { id: 'all',      label: 'Tout' },
  { id: 'unread',   label: 'Non lu' },
  { id: 'security', label: 'Sécurité' },
  { id: 'document', label: 'Documents' },
];

// ─────────────────────────────────────────────────────────────
// Notif item
// ─────────────────────────────────────────────────────────────
function NotifItem({ n, t }) {
  const meta = NOTIF_TYPE[n.type];
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 12, padding: 14, borderRadius: 14, background: n.read ? 'transparent' : t.surface, border: n.read ? `1px solid transparent` : `1px solid ${t.border}`, boxShadow: n.read ? 'none' : (t.dark ? 'none' : '0 1px 2px rgba(0,0,0,0.02)') }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: t.dark ? meta.dBg : meta.bg, color: meta.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {NotifIcons[meta.icon]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: n.read ? 500 : 700, color: n.read ? t.ink2 : t.ink, lineHeight: 1.3 }}>{n.title}</div>
          <span style={{ fontSize: 10, color: t.muted, flexShrink: 0 }}>{n.time}</span>
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          {!n.read && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.muted, fontSize: 11, fontWeight: 500, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              {NotifIcons.check} Marquer comme lu
            </button>
          )}
          {n.actionLabel && (
            <button style={{ marginLeft: !n.read ? 0 : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: idnTokens.green, fontSize: 11, fontWeight: 700, padding: 0 }}>
              {n.actionLabel} →
            </button>
          )}
        </div>
      </div>
      {!n.read && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 9999, background: idnTokens.green }}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Centre de notifications — Liste pleine
// ─────────────────────────────────────────────────────────────
function ScrNotifCenter({ t, filter = 'all', allRead }) {
  const items = NOTIF_MOCK
    .map(n => allRead ? { ...n, read: true } : n)
    .filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.read;
      return n.type === filter;
    });
  const today = items.filter(n => n.date === 'today');
  const yesterday = items.filter(n => n.date === 'yesterday');
  const unreadCount = NOTIF_MOCK.filter(n => allRead ? false : !n.read).length;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 22px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{NotifIcons.back}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: -0.4, lineHeight: 1.1 }}>Notifications</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</div>
        </div>
        <button title="Tout marquer comme lu" style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{NotifIcons.checkD}</button>
        <button title="Tout effacer" style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{NotifIcons.trash}</button>
      </div>

      {/* Filtres */}
      <div style={{ padding: '8px 22px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {FILTERS.map(f => {
          const sel = f.id === filter;
          return (
            <button key={f.id} style={{ flexShrink: 0, padding: '8px 14px', background: sel ? idnTokens.green : t.surface, border: `1px solid ${sel ? idnTokens.green : t.border}`, color: sel ? '#fff' : t.ink2, borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.2 }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 22px' }}>
        {today.length === 0 && yesterday.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft }}>{React.cloneElement(NotifIcons.bell, { width: 48, height: 48 })}</div>
            <div style={{ fontSize: 14, color: t.ink2, fontWeight: 600, marginTop: 12 }}>Aucune notification</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Vous êtes à jour !</div>
          </div>
        )}
        {today.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 700, padding: '10px 4px 6px' }}>AUJOURD'HUI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {today.map(n => <NotifItem key={n.id} n={n} t={t}/>)}
            </div>
          </div>
        )}
        {yesterday.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: 700, padding: '14px 4px 6px' }}>HIER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {yesterday.map(n => <NotifItem key={n.id} n={n} t={t}/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScrNotifCenter, NotifIcons, NOTIF_TYPE, NOTIF_MOCK, FILTERS });
