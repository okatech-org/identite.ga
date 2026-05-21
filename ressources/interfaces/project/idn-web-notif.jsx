// IDN Web Desktop — Centre de notifications
// Page centrée max-w-2xl, filtres + groupes Aujourd'hui & Hier

function NotifWeb({ t, screen = 'all', user = DEMO_USERS.citoyen }) {
  const filter = screen;
  return (
    <BrowserChrome t={t} url="https://idn.ga/notifications" w={1180} h={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: idnTokens.font, overflow: 'hidden' }}>
        <CWNav t={t} user={user} screen="home"/>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 28px 60px' }}>
            <NotifWHeader t={t}/>
            <NotifWTabs t={t} active={filter}/>
            <NotifWList t={t} filter={filter}/>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function NotifWHeader({ t }) {
  const unreadCount = NOTIF_MOCK.filter(n => !n.read).length;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button style={{ width: 36, height: 36, borderRadius: 9999, background: t.surface, border: `1px solid ${t.border}`, color: t.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{IdnIcons.arrowL}</button>
        <div>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 1.2, fontWeight: 600 }}>CENTRE DE NOTIFICATIONS</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: t.ink, letterSpacing: -0.6, marginTop: 2 }}>Notifications</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <IdnButton t={t} variant="ghost" size="sm" leadIcon={NotifIcons.checkD}>Tout marquer comme lu</IdnButton>
        <IdnButton t={t} variant="ghost" size="sm" leadIcon={NotifIcons.trash}>Tout effacer</IdnButton>
      </div>
    </div>
  );
}

function NotifWTabs({ t, active }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '4px 0 20px', borderBottom: `1px solid ${t.borderSoft}`, marginBottom: 22 }}>
      {FILTERS.map(f => {
        const sel = f.id === active;
        return (
          <button key={f.id} style={{ padding: '8px 16px', background: sel ? idnTokens.green : 'transparent', border: `1px solid ${sel ? idnTokens.green : t.border}`, color: sel ? '#fff' : t.ink2, borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.2 }}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function NotifWList({ t, filter }) {
  const items = NOTIF_MOCK.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });
  if (items.length === 0) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', opacity: 0.6 }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: t.mutedSoft }}>
          {React.cloneElement(NotifIcons.bell, { width: 56, height: 56 })}
        </div>
        <div style={{ fontSize: 16, color: t.ink2, fontWeight: 600, marginTop: 14 }}>Aucune notification</div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 4 }}>Vous êtes à jour !</div>
      </div>
    );
  }
  const today = items.filter(n => n.date === 'today');
  const yesterday = items.filter(n => n.date === 'yesterday');
  return (
    <div>
      {today.length > 0 && <NotifWGroup t={t} label="Aujourd'hui" items={today}/>}
      {yesterday.length > 0 && <NotifWGroup t={t} label="Hier" items={yesterday}/>}
    </div>
  );
}

function NotifWGroup({ t, label, items }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1.4, fontWeight: 700, marginBottom: 12 }}>{label.toUpperCase()}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(n => <NotifWItem key={n.id} n={n} t={t}/>)}
      </div>
    </div>
  );
}

function NotifWItem({ n, t }) {
  const meta = NOTIF_TYPE[n.type];
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 14, padding: 18, borderRadius: 14, background: n.read ? 'transparent' : t.surface, border: n.read ? `1px solid transparent` : `1px solid ${t.border}`, boxShadow: n.read ? 'none' : (t.dark ? 'none' : '0 1px 2px rgba(0,0,0,0.03)') }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: t.dark ? meta.dBg : meta.bg, color: meta.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {NotifIcons[meta.icon]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: n.read ? 500 : 700, color: n.read ? t.ink2 : t.ink, lineHeight: 1.3 }}>{n.title}</div>
          <span style={{ fontSize: 11, color: t.muted, flexShrink: 0 }}>{n.time}</span>
        </div>
        <div style={{ fontSize: 13, color: t.muted, marginTop: 4, lineHeight: 1.55 }}>{n.message}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
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
      {!n.read && <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: 9999, background: idnTokens.green }}/>}
    </div>
  );
}

Object.assign(window, { NotifWeb });
