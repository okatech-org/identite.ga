// IDN Mobile screens — citizen flow on iOS frame
// All flow state is local to each phone; pressing the home indicator returns to start.

const PROFILS = [
  {
    id: "citoyen",
    label: "Citoyen Gabonais",
    sub: "CNI / acte de naissance",
    loa: 3,
    doc: "CNI",
  },
  {
    id: "resident",
    label: "Résident",
    sub: "Carte de séjour + passeport",
    loa: 2,
    doc: "Carte de séjour",
  },
  {
    id: "visiteur",
    label: "Visiteur Temporaire",
    sub: "Passeport + visa",
    loa: 1,
    doc: "Visa",
  },
  {
    id: "developer",
    label: "Développeur",
    sub: "Entité morale, accès API",
    loa: null,
    doc: "Reg. commerce",
  },
];

const DEMO_USERS = {
  citoyen: {
    prenom: "Aïssatou",
    nom: "Mboumba",
    loa: 3,
    profil: "Citoyen Gabonais",
    ddn: "14 mars 1992",
    lieu: "Libreville",
    nat: "Gabonaise",
  },
  resident: {
    prenom: "Marc",
    nom: "Lefèvre",
    loa: 2,
    profil: "Résident",
    ddn: "02 juillet 1985",
    lieu: "Lyon, France",
    nat: "Française",
  },
  visiteur: {
    prenom: "Yuki",
    nom: "Tanaka",
    loa: 1,
    profil: "Visiteur Temporaire",
    ddn: "21 mai 1995",
    lieu: "Tokyo, Japon",
    nat: "Japonaise",
  },
};

// ─────────────────────────────────────────────────────────────
// Mobile chrome — sober status bar, app bar
// ─────────────────────────────────────────────────────────────
function MStatusBar({ t }) {
  const c = t.ink;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 22px 6px",
        fontFamily: idnTokens.font,
        fontSize: 15,
        fontWeight: 600,
        color: c,
      }}
    >
      <span>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill={c}>
          <rect x="0" y="7" width="2.5" height="4" rx="0.6" />
          <rect x="4" y="5" width="2.5" height="6" rx="0.6" />
          <rect x="8" y="3" width="2.5" height="8" rx="0.6" />
          <rect x="12" y="0" width="2.5" height="11" rx="0.6" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect
            x="0.5"
            y="0.5"
            width="19"
            height="10"
            rx="2.5"
            stroke={c}
            fill="none"
          />
          <rect x="2" y="2" width="13" height="7" rx="1" fill={c} />
        </svg>
      </div>
    </div>
  );
}

function MAppBar({ title, t, onBack, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px 14px",
        fontFamily: idnTokens.font,
        borderBottom: `1px solid ${t.borderSoft}`,
      }}
    >
      {onBack ?
        <button
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            border: "none",
            background: "transparent",
            color: t.ink,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: -8,
          }}
        >
          {IdnIcons.arrowL}
        </button>
      : <div style={{ width: 4 }} />}
      <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: t.ink }}>
        {title}
      </div>
      {right}
    </div>
  );
}

function PhoneShell({ t, children }) {
  return (
    <div
      style={{
        width: 360,
        height: 740,
        borderRadius: 44,
        background: t.dark ? "#000" : "#0E110D",
        padding: 9,
        boxShadow:
          t.dark ?
            "0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px #1c1f1a"
          : "0 30px 60px rgba(40,50,30,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 36,
          overflow: "hidden",
          background: t.bg,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          fontFamily: idnTokens.font,
        }}
      >
        <MStatusBar t={t} />
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 4,
            borderRadius: 9999,
            background: t.dark ? "#fff" : "#000",
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Welcome
// ─────────────────────────────────────────────────────────────
function MWelcome({ t, onCreate, onLogin }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "30px 26px 24px",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IdnMark size={36} t={t} />
          <div>
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              RÉPUBLIQUE GABONAISE
            </div>
            <div style={{ fontSize: 14, color: t.ink, fontWeight: 600 }}>
              Identité Numérique
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: t.ink,
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            Un compte unique
            <br />
            pour tous les services
            <br />
            <span style={{ color: idnTokens.green }}>de l'État.</span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: t.muted,
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            Authentifiez-vous une fois, accédez à l'ensemble des services
            administratifs gabonais en toute sécurité.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 8,
          }}
        >
          <IdnButton t={t} variant="primary" size="lg" full onClick={onCreate}>
            Créer un compte IDN
          </IdnButton>
          <IdnButton t={t} variant="ghost" size="lg" full onClick={onLogin}>
            Se connecter
          </IdnButton>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: t.mutedSoft,
        }}
      >
        <span>v1.2 · MVP</span>
        <IdnFlagBars width={36} height={3} />
        <span>FR · EN</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Profile selection
// ─────────────────────────────────────────────────────────────
function MProfilSelect({ t, onPick, onBack }) {
  const [picked, setPicked] = React.useState(null);
  return (
    <>
      <MAppBar t={t} title="Quel est votre profil ?" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: t.muted,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Votre profil détermine les pièces demandées et les services
          accessibles.
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}
        >
          {PROFILS.map((p) => {
            const sel = picked === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPicked(p.id)}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: 12,
                  cursor: "pointer",
                  background:
                    sel ?
                      t.dark ?
                        "#0F2A18"
                      : idnTokens.greenSoft
                    : t.surface,
                  border: `1.5px solid ${sel ? idnTokens.green : t.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: idnTokens.font,
                  color: t.ink,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: sel ? idnTokens.green : t.surface2,
                    color: sel ? "#fff" : t.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {IdnIcons.user}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
                    {p.sub}
                  </div>
                </div>
                {p.loa && <LoABadge level={p.loa} t={t} compact />}
              </button>
            );
          })}
        </div>
        <IdnButton
          t={t}
          variant="primary"
          size="lg"
          full
          disabled={!picked}
          onClick={() => onPick(picked)}
        >
          Continuer
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Sign up — email + password
// ─────────────────────────────────────────────────────────────
function MSignup({ t, onNext, onBack }) {
  const [email, setEmail] = React.useState("aissatou.mboumba@example.ga");
  const [pwd, setPwd] = React.useState("••••••••••");
  return (
    <>
      <MAppBar t={t} title="Créer un compte" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: t.muted,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Étape 1 sur 4 — vos identifiants de connexion.
        </div>
        <Stepper steps={4} current={1} t={t} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flex: 1,
            marginTop: 18,
          }}
        >
          <IdnInput
            t={t}
            label="Adresse email"
            value={email}
            onChange={setEmail}
            type="email"
            leadIcon={IdnIcons.mail}
          />
          <IdnInput
            t={t}
            label="Mot de passe"
            value={pwd}
            onChange={setPwd}
            type="password"
            leadIcon={IdnIcons.lock}
            hint="Minimum 8 caractères"
          />
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12,
              color: t.ink2,
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              defaultChecked
              style={{ marginTop: 2, accentColor: idnTokens.green }}
            />
            <span>
              J'accepte les{" "}
              <u style={{ color: idnTokens.green }}>conditions d'utilisation</u>{" "}
              et la{" "}
              <u style={{ color: idnTokens.green }}>
                politique de confidentialité
              </u>
              .
            </span>
          </label>
        </div>
        <IdnButton t={t} variant="primary" size="lg" full onClick={onNext}>
          Recevoir le code de vérification
        </IdnButton>
      </div>
    </>
  );
}

function Stepper({ steps, current, t }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i < current ? idnTokens.green : t.border,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. OTP — 6 digits
// ─────────────────────────────────────────────────────────────
function MOtp({ t, onNext, onBack }) {
  const [code, setCode] = React.useState(["4", "7", "2", "9", "", ""]);
  const [seconds, setSeconds] = React.useState(43);
  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  const setAt = (i, v) => {
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
  };
  const filled = code.every((c) => c !== "");
  return (
    <>
      <MAppBar t={t} title="Vérifier votre email" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stepper steps={4} current={2} t={t} />
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: t.muted,
            lineHeight: 1.5,
          }}
        >
          Code à 6 chiffres envoyé à<br />
          <span style={{ color: t.ink, fontWeight: 500 }}>
            aissatou.mboumba@example.ga
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          {code.map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={(e) => setAt(i, e.target.value)}
              maxLength={1}
              style={{
                flex: 1,
                height: 56,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 600,
                fontFamily: idnTokens.mono,
                background: t.surface,
                border: `1.5px solid ${c ? idnTokens.green : t.border}`,
                borderRadius: 10,
                color: t.ink,
                outline: "none",
              }}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: t.muted,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Expire dans {Math.floor(seconds / 60)}:
            {String(seconds % 60).padStart(2, "0")}
          </span>
          <button
            style={{
              border: "none",
              background: "none",
              color: t.muted,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Renvoyer le code
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <IdnButton
          t={t}
          variant="primary"
          size="lg"
          full
          disabled={!filled}
          onClick={onNext}
        >
          Vérifier
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Identity pivot fields
// ─────────────────────────────────────────────────────────────
function MPivot({ t, onNext, onBack }) {
  return (
    <>
      <MAppBar t={t} title="Vos informations" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <Stepper steps={4} current={3} t={t} />
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: t.muted,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          Identité pivot — telles qu'elles figurent sur vos documents officiels.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <IdnInput t={t} label="Prénom" value="Aïssatou" onChange={() => {}} />
          <IdnInput t={t} label="Nom" value="Mboumba" onChange={() => {}} />
          <IdnInput
            t={t}
            label="Date de naissance"
            value="14/03/1992"
            onChange={() => {}}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <IdnInput t={t} label="Genre" value="Féminin" onChange={() => {}} />
            <IdnInput
              t={t}
              label="Nationalité"
              value="Gabonaise"
              onChange={() => {}}
            />
          </div>
          <IdnInput
            t={t}
            label="Lieu de naissance"
            value="Libreville"
            onChange={() => {}}
          />
        </div>
        <div style={{ flex: 1, minHeight: 14 }} />
        <IdnButton t={t} variant="primary" size="lg" full onClick={onNext}>
          Continuer
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. PIN creation
// ─────────────────────────────────────────────────────────────
function MPin({ t, onNext, onBack }) {
  const [pin, setPin] = React.useState("");
  const dots = (val) =>
    Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        style={{
          width: 14,
          height: 14,
          borderRadius: 9999,
          background: i < val.length ? idnTokens.green : "transparent",
          border: `1.5px solid ${i < val.length ? idnTokens.green : t.border}`,
        }}
      />
    ));
  const press = (n) => {
    if (n === "del") setPin((p) => p.slice(0, -1));
    else if (pin.length < 6) setPin((p) => p + n);
  };
  return (
    <>
      <MAppBar t={t} title="Créer votre PIN" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stepper steps={4} current={4} t={t} />
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: t.muted,
            lineHeight: 1.5,
          }}
        >
          Un code à 6 chiffres pour les actions sensibles : signature,
          validation, accès rapide.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 28,
            marginBottom: 8,
          }}
        >
          {dots(pin)}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (n, i) => (
              <button
                key={i}
                disabled={n === ""}
                onClick={() => n && press(n)}
                style={{
                  height: 52,
                  borderRadius: 12,
                  border: `1px solid ${n === "" ? "transparent" : t.border}`,
                  background: n === "" ? "transparent" : t.surface,
                  color: t.ink,
                  fontSize: 20,
                  fontWeight: 500,
                  fontFamily: idnTokens.font,
                  cursor: n === "" ? "default" : "pointer",
                }}
              >
                {n === "del" ? "⌫" : n}
              </button>
            ),
          )}
        </div>
        <IdnButton
          t={t}
          variant="primary"
          size="lg"
          full
          disabled={pin.length !== 6}
          onClick={onNext}
        >
          Confirmer
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Home / Dashboard (citizen)
// ─────────────────────────────────────────────────────────────
function MHome({ t, user, onProfile, onConsents, onKyc, onWelcome }) {
  const services = [
    {
      icon: IdnIcons.doc,
      title: "e-Visa",
      sub: "Statut : actif",
      tag: "Niv. 1",
    },
    {
      icon: IdnIcons.shield,
      title: "Carte de séjour",
      sub: "Renouvellement",
      tag: "Niv. 2",
    },
    {
      icon: IdnIcons.user,
      title: "État civil",
      sub: "Acte de naissance",
      tag: "Niv. 3",
    },
    {
      icon: IdnIcons.mail,
      title: "Bourses étudiantes",
      sub: "Portail dédié",
      tag: "Niv. 3",
    },
  ];
  return (
    <>
      <div
        style={{
          padding: "10px 20px 16px",
          borderBottom: `1px solid ${t.borderSoft}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onWelcome}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <IdnMark size={28} t={t} />
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: t.muted,
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            IDN — IDENTITÉ NUMÉRIQUE
          </div>
          <div style={{ fontSize: 14, color: t.ink, fontWeight: 600 }}>
            {user.prenom} {user.nom}
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: t.surface2,
            color: t.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {IdnIcons.bell}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              borderRadius: 9999,
              background: idnTokens.green,
              border: `1.5px solid ${t.surface}`,
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 24px" }}>
        <button
          onClick={onProfile}
          style={{
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: idnTokens.font,
            color: t.ink,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              flexShrink: 0,
              background: "linear-gradient(135deg, #0E7C3A, #0A5C2C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {user.prenom[0]}
            {user.nom[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                letterSpacing: 0.8,
                fontWeight: 600,
              }}
            >
              {user.profil.toUpperCase()}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 1 }}>
              {user.prenom} {user.nom}
            </div>
            <div style={{ marginTop: 6 }}>
              <LoABadge level={user.loa} t={t} compact />
            </div>
          </div>
          <span style={{ color: t.muted }}>{IdnIcons.arrow}</span>
        </button>

        {user.loa < 2 && (
          <div
            onClick={onKyc}
            style={{
              cursor: "pointer",
              marginTop: 14,
              padding: 14,
              borderRadius: 12,
              background: t.dark ? "#1F2316" : idnTokens.yellowSoft,
              border: `1px solid ${t.dark ? "#3A3F1F" : "#E8D67E"}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: idnTokens.yellow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5a4a0a",
              }}
            >
              {IdnIcons.shield}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>
                Vérifiez votre identité
              </div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>
                Passer au Niveau 2 pour débloquer plus de services
              </div>
            </div>
            <span style={{ color: t.ink2 }}>{IdnIcons.arrow}</span>
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          SERVICES
        </div>
        <div
          style={{
            marginTop: 10,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {services.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom:
                  i === services.length - 1 ?
                    "none"
                  : `1px solid ${t.borderSoft}`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: t.surface2,
                  color: t.ink2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.ink }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>
                  {s.sub}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.muted,
                  fontFamily: idnTokens.mono,
                }}
              >
                {s.tag}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          RACCOURCIS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 10,
          }}
        >
          <button
            onClick={onConsents}
            style={{ ...quickAction(t), cursor: "pointer" }}
          >
            <div style={{ color: idnTokens.green }}>{IdnIcons.link}</div>
            <div>Consentements</div>
            <div style={{ fontSize: 11, color: t.muted }}>
              4 apps autorisées
            </div>
          </button>
          <button style={{ ...quickAction(t), cursor: "pointer" }}>
            <div style={{ color: idnTokens.green }}>{IdnIcons.qr}</div>
            <div>Présenter mon ID</div>
            <div style={{ fontSize: 11, color: t.muted }}>QR sécurisé</div>
          </button>
        </div>
      </div>
    </>
  );
}

const quickAction = (t) => ({
  background: t.surface,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: 14,
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: idnTokens.font,
  fontSize: 13,
  fontWeight: 500,
  color: t.ink,
});

// ─────────────────────────────────────────────────────────────
// 8. Profile detail
// ─────────────────────────────────────────────────────────────
function MProfile({ t, user, onBack, onKyc }) {
  const Row = ({ label, value, mono }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: `1px solid ${t.borderSoft}`,
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 13, color: t.muted }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: t.ink,
          fontWeight: 500,
          fontFamily: mono ? idnTokens.mono : idnTokens.font,
        }}
      >
        {value}
      </span>
    </div>
  );
  return (
    <>
      <MAppBar t={t} title="Mon profil" onBack={onBack} />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 18px 24px" }}>
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0E7C3A, #0A5C2C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            {user.prenom[0]}
            {user.nom[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: t.ink }}>
              {user.prenom} {user.nom}
            </div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
              {user.profil}
            </div>
            <div style={{ marginTop: 8 }}>
              <LoABadge level={user.loa} t={t} compact />
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          IDENTITÉ PIVOT
        </div>
        <div style={{ marginTop: 6 }}>
          <Row label="Prénom" value={user.prenom} />
          <Row label="Nom" value={user.nom} />
          <Row label="Date de naissance" value={user.ddn} />
          <Row label="Lieu de naissance" value={user.lieu} />
          <Row label="Nationalité" value={user.nat} />
          <Row label="ID IDN" value="GA-7K3J-9Q2L" mono />
        </div>
        {user.loa < 3 && (
          <div style={{ marginTop: 22 }}>
            <IdnButton
              t={t}
              variant="ghost"
              size="md"
              full
              onClick={onKyc}
              leadIcon={
                <span style={{ color: idnTokens.green }}>
                  {IdnIcons.shield}
                </span>
              }
            >
              Passer au Niveau {user.loa + 1}
            </IdnButton>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. Consents list
// ─────────────────────────────────────────────────────────────
function MConsents({ t, onBack }) {
  const apps = [
    {
      name: "Consulat.ga",
      desc: "Démarches consulaires en ligne",
      scopes: ["profile", "email", "loa:2"],
      date: "12 mar 2026",
      granted: true,
    },
    {
      name: "Bourses Étudiantes",
      desc: "Ministère de l'Enseignement supérieur",
      scopes: ["profile", "birth_cert"],
      date: "04 fév 2026",
      granted: true,
    },
    {
      name: "Santé.ga",
      desc: "Portail e-santé national",
      scopes: ["profile", "loa:3"],
      date: "21 jan 2026",
      granted: true,
    },
    {
      name: "Impots.ga",
      desc: "DGI — déclarations en ligne",
      scopes: ["profile", "tax_id"],
      date: "08 jan 2026",
      granted: true,
    },
  ];
  return (
    <>
      <MAppBar t={t} title="Consentements" onBack={onBack} />
      <div style={{ flex: 1, overflow: "auto", padding: "14px 18px 24px" }}>
        <div
          style={{
            fontSize: 13,
            color: t.muted,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {apps.length} applications ont accès à vos données IDN. Vous pouvez
          révoquer un accès à tout moment.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {apps.map((a, i) => (
            <div
              key={i}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: t.surface2,
                    color: t.ink,
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {a.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 1 }}>
                    {a.desc}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginTop: 10,
                }}
              >
                {a.scopes.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 11,
                      fontFamily: idnTokens.mono,
                      padding: "2px 8px",
                      borderRadius: 9999,
                      background: t.surface2,
                      color: t.ink2,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: `1px solid ${t.borderSoft}`,
                }}
              >
                <span style={{ fontSize: 11, color: t.muted }}>
                  Autorisé le {a.date}
                </span>
                <button
                  style={{
                    border: "none",
                    background: "none",
                    color: "#B83A3A",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Révoquer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. KYC L2 — document scan
// ─────────────────────────────────────────────────────────────
function MKycDoc({ t, onNext, onBack }) {
  return (
    <>
      <MAppBar t={t} title="Pièce d'identité" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stepper steps={3} current={1} t={t} />
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: t.muted,
            lineHeight: 1.5,
          }}
        >
          Photographiez votre <b style={{ color: t.ink }}>CNI gabonaise</b>{" "}
          recto-verso. Lumière vive, pas de reflets.
        </div>
        <div
          style={{
            marginTop: 22,
            aspectRatio: "1.6 / 1",
            borderRadius: 14,
            background: t.dark ? "#0A0D0A" : "#1A1D17",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Camera viewfinder */}
          <div
            style={{
              position: "absolute",
              inset: "14% 10%",
              border: "2px dashed rgba(255,255,255,0.4)",
              borderRadius: 12,
            }}
          />
          {[
            ["top", "left"],
            ["top", "right"],
            ["bottom", "left"],
            ["bottom", "right"],
          ].map(([v, h]) => (
            <div
              key={`${v}${h}`}
              style={{
                position: "absolute",
                [v]: "12%",
                [h]: "8%",
                width: 28,
                height: 28,
                [`border${v[0].toUpperCase() + v.slice(1)}`]: `3px solid ${idnTokens.green}`,
                [`border${h[0].toUpperCase() + h.slice(1)}`]: `3px solid ${idnTokens.green}`,
                borderRadius:
                  v === "top" && h === "left" ? "6px 0 0 0"
                  : v === "top" && h === "right" ? "0 6px 0 0"
                  : v === "bottom" && h === "left" ? "0 0 0 6px"
                  : "0 0 6px 0",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              color: "#fff",
              fontSize: 11,
              fontFamily: idnTokens.mono,
              letterSpacing: 1,
              opacity: 0.7,
            }}
          >
            RECTO · ALIGNEZ DANS LE CADRE
          </div>
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: t.muted,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span style={{ color: idnTokens.green }}>{IdnIcons.check}</span>
          Détection automatique des bords activée
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <IdnButton t={t} variant="ghost" size="lg" style={{ flex: 1 }}>
            Importer
          </IdnButton>
          <IdnButton
            t={t}
            variant="primary"
            size="lg"
            style={{ flex: 1 }}
            onClick={onNext}
            leadIcon={IdnIcons.camera}
          >
            Capturer
          </IdnButton>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. KYC L2 — selfie liveness
// ─────────────────────────────────────────────────────────────
function MKycSelfie({ t, onNext, onBack }) {
  const [phase, setPhase] = React.useState(0);
  const phases = [
    "Centrez votre visage",
    "Tournez doucement la tête",
    "Clignez des yeux",
  ];
  React.useEffect(() => {
    const id = setTimeout(() => phase < 2 && setPhase((p) => p + 1), 1800);
    return () => clearTimeout(id);
  }, [phase]);
  return (
    <>
      <MAppBar t={t} title="Selfie vivant" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stepper steps={3} current={2} t={t} />
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: t.muted,
            lineHeight: 1.5,
          }}
        >
          Détection de présence — assurez-nous que c'est bien vous.
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
          }}
        >
          <div style={{ position: "relative", width: 220, height: 220 }}>
            <svg
              width="220"
              height="220"
              viewBox="0 0 220 220"
              style={{ position: "absolute", inset: 0 }}
            >
              <circle
                cx="110"
                cy="110"
                r="100"
                fill="none"
                stroke={t.border}
                strokeWidth="3"
              />
              <circle
                cx="110"
                cy="110"
                r="100"
                fill="none"
                stroke={idnTokens.green}
                strokeWidth="3"
                strokeDasharray="628"
                strokeDashoffset={628 - (628 * (phase + 1)) / 3}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 1.4s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 14,
                borderRadius: 9999,
                overflow: "hidden",
                background: `repeating-linear-gradient(45deg, ${t.dark ? "#1F2620" : "#E8E5DC"}, ${t.dark ? "#1F2620" : "#E8E5DC"} 6px, ${t.dark ? "#252C25" : "#DCD9CF"} 6px, ${t.dark ? "#252C25" : "#DCD9CF"} 12px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.muted,
                fontSize: 11,
                fontFamily: idnTokens.mono,
                letterSpacing: 1,
              }}
            >
              FLUX CAMÉRA
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>
              {phases[phase]}
            </div>
            <div
              style={{
                fontSize: 12,
                color: t.muted,
                marginTop: 6,
                fontFamily: idnTokens.mono,
              }}
            >
              {phase + 1} / 3 · liveness check
            </div>
          </div>
        </div>
        <IdnButton t={t} variant="primary" size="lg" full onClick={onNext}>
          Continuer
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. KYC L2 — status (en cours d'examen)
// ─────────────────────────────────────────────────────────────
function MKycStatus({ t, onBack }) {
  return (
    <>
      <MAppBar t={t} title="Demande envoyée" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "8px 18px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stepper steps={3} current={3} t={t} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 9999,
              background: t.dark ? "#0F2A18" : idnTokens.greenSoft,
              color: idnTokens.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 12l5 5 9-11" />
            </svg>
          </div>
          <div style={{ textAlign: "center", padding: "0 16px" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: t.ink }}>
              Demande envoyée
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.muted,
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              Votre dossier passe en revue automatique puis manuelle si
              nécessaire. Vous serez notifié·e sous 24-48h.
            </div>
          </div>
          <div
            style={{
              width: "100%",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 14,
              fontFamily: idnTokens.mono,
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: t.muted,
              }}
            >
              <span>RÉFÉRENCE</span>
              <span style={{ color: t.ink }}>KYC-7K9-3F2</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: t.muted,
                marginTop: 6,
              }}
            >
              <span>STATUT</span>
              <span style={{ color: idnTokens.blue }}>en cours d'examen</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: t.muted,
                marginTop: 6,
              }}
            >
              <span>NIVEAU CIBLE</span>
              <span style={{ color: t.ink }}>2 — Substantiel</span>
            </div>
          </div>
        </div>
        <IdnButton t={t} variant="primary" size="lg" full onClick={onBack}>
          Retour à l'accueil
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. OIDC consent (mobile)
// ─────────────────────────────────────────────────────────────
function MOidc({ t }) {
  return (
    <>
      <div
        style={{
          padding: "10px 18px 14px",
          borderBottom: `1px solid ${t.borderSoft}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <IdnMark size={24} t={t} />
        <div style={{ fontSize: 13, color: t.muted, fontWeight: 500 }}>
          identite.ga · authentification sécurisée
        </div>
      </div>
      <div style={{ flex: 1, padding: "20px 22px", overflow: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg,#0E7C3A,#0A5C2C)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}
          >
            {DEMO_USERS.citoyen.prenom[0]}
            {DEMO_USERS.citoyen.nom[0]}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: t.muted,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: t.muted,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: t.muted,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: t.muted,
              }}
            />
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: t.surface2,
              color: t.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              border: `1px solid ${t.border}`,
            }}
          >
            C
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div
            style={{
              fontSize: 19,
              fontWeight: 600,
              color: t.ink,
              lineHeight: 1.3,
            }}
          >
            <b>Consulat.ga</b> demande
            <br />
            l'accès à votre compte IDN
          </div>
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          VOUS PARTAGEREZ
        </div>
        <div
          style={{
            marginTop: 8,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {[
            { l: "Identité pivot", s: "nom, prénom, date de naissance" },
            { l: "Adresse email", s: "aissatou.mboumba@example.ga" },
            { l: "Niveau de vérification", s: "Niveau 3 (requis : ≥ 2)" },
          ].map((r, i, arr) => (
            <div
              key={i}
              style={{
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom:
                  i === arr.length - 1 ? "none" : `1px solid ${t.borderSoft}`,
              }}
            >
              <span style={{ color: idnTokens.green, display: "flex" }}>
                {IdnIcons.check}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>
                  {r.l}
                </div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>
                  {r.s}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            color: t.muted,
            marginTop: 12,
            lineHeight: 1.6,
          }}
        >
          En continuant, vous autorisez Consulat.ga à accéder à ces données.
          Révocable à tout moment dans Consentements.
        </div>
      </div>
      <div
        style={{
          padding: "12px 18px 18px",
          borderTop: `1px solid ${t.borderSoft}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <IdnButton t={t} variant="primary" size="lg" full>
          Autoriser
        </IdnButton>
        <IdnButton t={t} variant="quiet" size="md" full>
          Refuser
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Login (rapide)
// ─────────────────────────────────────────────────────────────
function MLogin({ t, onBack, onLogged }) {
  return (
    <>
      <MAppBar t={t} title="Se connecter" onBack={onBack} />
      <div
        style={{
          flex: 1,
          padding: "20px 22px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <IdnMark size={42} t={t} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <IdnInput
            t={t}
            label="Email"
            value="aissatou.mboumba@example.ga"
            onChange={() => {}}
            leadIcon={IdnIcons.mail}
          />
          <IdnInput
            t={t}
            label="Mot de passe"
            value="••••••••"
            onChange={() => {}}
            type="password"
            leadIcon={IdnIcons.lock}
          />
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            color: t.muted,
            fontSize: 12,
            cursor: "pointer",
            alignSelf: "flex-end",
            marginTop: 8,
          }}
        >
          Mot de passe oublié ?
        </button>
        <div style={{ flex: 1 }} />
        <IdnButton t={t} variant="primary" size="lg" full onClick={onLogged}>
          Se connecter
        </IdnButton>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "14px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 11, color: t.muted, letterSpacing: 1 }}>
            OU
          </span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>
        <IdnButton
          t={t}
          variant="ghost"
          size="md"
          full
          leadIcon={IdnIcons.lock}
        >
          PIN à 6 chiffres
        </IdnButton>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MobilePrototype — orchestrates the full flow
// ─────────────────────────────────────────────────────────────
function MobilePrototype({
  t,
  initial = "welcome",
  user = DEMO_USERS.citoyen,
  fixedScreen,
}) {
  const [screen, setScreen] = React.useState(fixedScreen || initial);
  const go = (s) => setScreen(s);
  const reset = () => setScreen(fixedScreen || initial);
  return (
    <PhoneShell t={t}>
      {screen === "welcome" && (
        <MWelcome
          t={t}
          onCreate={() => go("profil")}
          onLogin={() => go("login")}
        />
      )}
      {screen === "profil" && (
        <MProfilSelect
          t={t}
          onPick={() => go("signup")}
          onBack={() => go("welcome")}
        />
      )}
      {screen === "signup" && (
        <MSignup t={t} onNext={() => go("otp")} onBack={() => go("profil")} />
      )}
      {screen === "otp" && (
        <MOtp t={t} onNext={() => go("pivot")} onBack={() => go("signup")} />
      )}
      {screen === "pivot" && (
        <MPivot t={t} onNext={() => go("pin")} onBack={() => go("otp")} />
      )}
      {screen === "pin" && (
        <MPin t={t} onNext={() => go("home")} onBack={() => go("pivot")} />
      )}
      {screen === "home" && (
        <MHome
          t={t}
          user={user}
          onProfile={() => go("profile")}
          onConsents={() => go("consents")}
          onKyc={() => go("kyc-doc")}
          onWelcome={reset}
        />
      )}
      {screen === "profile" && (
        <MProfile
          t={t}
          user={user}
          onBack={() => go("home")}
          onKyc={() => go("kyc-doc")}
        />
      )}
      {screen === "consents" && <MConsents t={t} onBack={() => go("home")} />}
      {screen === "kyc-doc" && (
        <MKycDoc
          t={t}
          onNext={() => go("kyc-selfie")}
          onBack={() => go("home")}
        />
      )}
      {screen === "kyc-selfie" && (
        <MKycSelfie
          t={t}
          onNext={() => go("kyc-status")}
          onBack={() => go("kyc-doc")}
        />
      )}
      {screen === "kyc-status" && (
        <MKycStatus t={t} onBack={() => go("home")} />
      )}
      {screen === "oidc" && <MOidc t={t} />}
      {screen === "login" && (
        <MLogin
          t={t}
          onBack={() => go("welcome")}
          onLogged={() => go("home")}
        />
      )}
    </PhoneShell>
  );
}

Object.assign(window, {
  PhoneShell,
  MWelcome,
  MProfilSelect,
  MSignup,
  MOtp,
  MPivot,
  MPin,
  MHome,
  MProfile,
  MConsents,
  MKycDoc,
  MKycSelfie,
  MKycStatus,
  MOidc,
  MLogin,
  MobilePrototype,
  DEMO_USERS,
  PROFILS,
});
