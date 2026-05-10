// Public marketing pages + account settings sub-pages

function CitizenPublic({ t, screen = "about" }) {
  return (
    <BrowserChrome t={t} url={`https://identite.ga/${screen}`} w={1180} h={760}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: t.bg,
          fontFamily: idnTokens.font,
          overflow: "hidden",
        }}
      >
        <PubNav t={t} active={screen} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {screen === "about" && <PubAbout t={t} />}
          {screen === "services" && <PubServices t={t} />}
          {screen === "admins" && <PubAdmins t={t} />}
          {screen === "help" && <PubHelp t={t} />}
          {screen === "legal" && <PubLegal t={t} />}
          {screen === "status" && <PubStatus t={t} />}
          {screen === "contact" && <PubContact t={t} />}
        </div>
        <PubFooter t={t} />
      </div>
    </BrowserChrome>
  );
}

function PubNav({ t, active }) {
  const tabs = [
    { id: "about", label: "À propos" },
    { id: "services", label: "Services" },
    { id: "admins", label: "Administrations" },
    { id: "help", label: "Aide" },
    { id: "status", label: "État" },
  ];
  return (
    <div
      style={{
        height: 60,
        padding: "0 28px",
        borderBottom: `1px solid ${t.border}`,
        background: t.surface,
        display: "flex",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IdnMark size={26} t={t} />
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
          Identité Numérique
        </div>
        <span
          style={{
            fontSize: 10,
            color: t.muted,
            padding: "2px 7px",
            borderRadius: 9999,
            background: t.surface2,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          RÉPUBLIQUE GABONAISE
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, marginLeft: 22 }}>
        {tabs.map((tb) => (
          <div
            key={tb.id}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: tb.id === active ? 600 : 500,
              color: tb.id === active ? idnTokens.green : t.ink2,
              background:
                tb.id === active ?
                  t.dark ?
                    "#0F2A18"
                  : idnTokens.greenSoft
                : "transparent",
              cursor: "pointer",
            }}
          >
            {tb.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <IdnButton t={t} variant="ghost" size="sm">
          Se connecter
        </IdnButton>
        <IdnButton t={t} variant="primary" size="sm">
          Créer un compte
        </IdnButton>
      </div>
    </div>
  );
}

function PubFooter({ t }) {
  return (
    <div
      style={{
        height: 56,
        padding: "0 28px",
        borderTop: `1px solid ${t.border}`,
        background: t.surface,
        display: "flex",
        alignItems: "center",
        gap: 22,
        fontSize: 12,
        color: t.muted,
      }}
    >
      <IdnFlagBars width={24} height={2.5} />
      <span>
        © République Gabonaise — Agence Nationale des Infrastructures Numériques
      </span>
      <div style={{ flex: 1 }} />
      {["Mentions légales", "Confidentialité", "Accessibilité", "Contact"].map(
        (l) => (
          <span key={l} style={{ cursor: "pointer" }}>
            {l}
          </span>
        ),
      )}
    </div>
  );
}

function PubH1({ t, eyebrow, title, sub }) {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "60px 40px 28px" }}>
      <div
        style={{
          fontSize: 11,
          color: t.muted,
          letterSpacing: 1.2,
          fontWeight: 600,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 600,
          color: t.ink,
          letterSpacing: -0.8,
          lineHeight: 1.15,
          marginTop: 10,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 16,
            color: t.muted,
            marginTop: 14,
            lineHeight: 1.6,
            maxWidth: 660,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// About
function PubAbout({ t }) {
  return (
    <div>
      <PubH1
        t={t}
        eyebrow="À PROPOS D'IDN"
        title="Une identité numérique souveraine pour chaque Gabonais·e."
        sub="L'IDN est l'infrastructure de confiance qui relie chaque citoyen, résident et visiteur à l'ensemble des services administratifs en ligne — sans recréer un compte à chaque fois."
      />
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 40px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
        }}
      >
        {[
          { n: "142 318", l: "Comptes IDN actifs" },
          { n: "23", l: "Services intégrés" },
          { n: "99,98%", l: "Disponibilité 12 mois" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: t.ink,
                fontFamily: idnTokens.mono,
                letterSpacing: -0.5,
              }}
            >
              {s.n}
            </div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: t.surface,
          borderTop: `1px solid ${t.border}`,
          borderBottom: `1px solid ${t.border}`,
          padding: "52px 40px",
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              color: t.muted,
              letterSpacing: 1,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            NOS PRINCIPES
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28,
              rowGap: 32,
            }}
          >
            {[
              {
                t: "Souveraineté des données",
                d: "Hébergement national, chiffrement de bout en bout, pas de transfert hors du Gabon.",
              },
              {
                t: "Consentement explicite",
                d: "Chaque service obtient votre accord pour les données strictement nécessaires.",
              },
              {
                t: "Niveaux de garantie eIDAS",
                d: "Trois niveaux (faible, substantiel, élevé) calibrés sur la sensibilité des services.",
              },
              {
                t: "Inclusion territoriale",
                d: "Parcours mobile complet, USSD pour zones non connectées, antennes dans les neuf provinces.",
              },
            ].map((p, i) => (
              <div key={i}>
                <div style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>
                  {p.t}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: t.muted,
                    marginTop: 6,
                    lineHeight: 1.6,
                  }}
                >
                  {p.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "52px 40px" }}>
        <div
          style={{
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          GOUVERNANCE
        </div>
        <div style={{ fontSize: 14, color: t.ink2, lineHeight: 1.7 }}>
          IDN est opéré par l'Agence Nationale des Infrastructures Numériques
          (ANINF) sous la tutelle du Ministère de l'Économie Numérique. Le code
          source des composants critiques est audité chaque année par la Cour
          des Comptes et un cabinet indépendant.
        </div>
      </div>
    </div>
  );
}

// Services list
function PubServices({ t }) {
  const services = [
    {
      cat: "Affaires consulaires",
      items: [
        "e-Visa",
        "Carte de séjour",
        "Passeport diplomatique",
        "Légalisation de documents",
      ],
    },
    {
      cat: "État civil",
      items: [
        "Acte de naissance",
        "Acte de mariage",
        "Certificat de nationalité",
        "Livret de famille",
      ],
    },
    {
      cat: "Fiscalité",
      items: [
        "Impots.ga — déclarations",
        "Quitus fiscal",
        "Numéro d'identification fiscale",
      ],
    },
    {
      cat: "Éducation",
      items: [
        "Bourses étudiantes",
        "Inscription universitaire",
        "Reconnaissance de diplôme",
      ],
    },
    {
      cat: "Santé",
      items: [
        "Santé.ga — portail e-santé",
        "Carnet de vaccination",
        "Carte CNAMGS",
      ],
    },
    {
      cat: "Justice",
      items: ["Casier judiciaire (B3)", "Aide juridictionnelle"],
    },
  ];
  return (
    <div>
      <PubH1
        t={t}
        eyebrow="ANNUAIRE"
        title="Tous les services intégrés."
        sub="23 démarches administratives accessibles avec votre compte IDN — selon votre niveau de garantie."
      />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px 60px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {["Tous", "Niveau 1", "Niveau 2", "Niveau 3", "Mobile", "USSD"].map(
            (f, i) => (
              <span
                key={f}
                style={{
                  padding: "6px 12px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  background: i === 0 ? idnTokens.green : t.surface,
                  color: i === 0 ? "#fff" : t.ink2,
                  border: `1px solid ${i === 0 ? idnTokens.green : t.border}`,
                  cursor: "pointer",
                }}
              >
                {f}
              </span>
            ),
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {services.map((cat, i) => (
            <div
              key={i}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: 22,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: t.muted,
                  letterSpacing: 1,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                {cat.cat.toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {cat.items.map((it, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom:
                        j === cat.items.length - 1 ?
                          "none"
                        : `1px solid ${t.borderSoft}`,
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: t.ink,
                        fontWeight: 500,
                      }}
                    >
                      {it}
                    </span>
                    <LoABadge level={(j % 3) + 1} t={t} compact />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// For administrations
function PubAdmins({ t }) {
  return (
    <div>
      <PubH1
        t={t}
        eyebrow="POUR LES ADMINISTRATIONS"
        title="Intégrez IDN à votre service en quelques jours."
        sub="Standard OpenID Connect, SDK officiels, accompagnement par l'ANINF. Conforme RGPD et à la loi gabonaise sur la protection des données personnelles."
      />
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 40px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
        }}
      >
        {[
          {
            t: "01",
            h: "Demande d'intégration",
            d: "Constituez un dossier technique et fonctionnel auprès de l'ANINF. Réponse sous 10 jours ouvrés.",
          },
          {
            t: "02",
            h: "Validation et niveau de garantie",
            d: "L'ANINF qualifie le LoA minimum (1, 2 ou 3) requis selon la sensibilité du service.",
          },
          {
            t: "03",
            h: "Mise en production",
            d: "Test sur sandbox, audit de sécurité, déploiement progressif puis bascule complète.",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                fontFamily: idnTokens.mono,
                fontWeight: 600,
              }}
            >
              ÉTAPE {s.t}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: t.ink,
                marginTop: 10,
              }}
            >
              {s.h}
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.muted,
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              {s.d}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px 60px" }}>
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: 28,
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: t.ink,
                letterSpacing: -0.3,
              }}
            >
              Vous êtes développeur·se intégrant un service public ?
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.muted,
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              Le portail développeur expose les SDK, la sandbox et les clés
              OAuth.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <IdnButton t={t} variant="ghost" size="lg">
              Documentation
            </IdnButton>
            <IdnButton t={t} variant="primary" size="lg">
              Portail développeur
            </IdnButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// FAQ
function PubHelp({ t }) {
  const faqs = [
    {
      q: "Qu'est-ce qu'un niveau de garantie (LoA) ?",
      a: "Le niveau de garantie indique le degré de certitude avec lequel IDN connaît votre identité. Niveau 1 (faible) = email vérifié. Niveau 2 (substantiel) = pièce d'identité + selfie liveness. Niveau 3 (élevé) = vérification vidéo + état civil croisé.",
    },
    {
      q: "Comment passer du Niveau 1 au Niveau 2 ?",
      a: "Depuis votre tableau de bord, lancez la vérification d'identité. Vous serez guidé pour photographier votre CNI ou passeport, puis effectuer un selfie animé. Comptez 5 minutes.",
    },
    {
      q: "Que faire si j'ai perdu mon téléphone ?",
      a: "Connectez-vous depuis un autre appareil, allez dans Paramètres → Appareils & sessions, et révoquez la session de l'appareil perdu. Si vous avez perdu l'accès au compte entièrement, contactez le support avec votre PIN de récupération.",
    },
    {
      q: "Mes données sont-elles partagées avec les administrations ?",
      a: "Uniquement avec votre consentement explicite et seulement les champs nécessaires au service. Vous pouvez révoquer un consentement à tout moment.",
    },
    {
      q: "IDN fonctionne-t-il sans internet ?",
      a: "Un canal USSD (*242#) permet les opérations essentielles depuis n'importe quel téléphone. Antennes physiques dans les neuf provinces.",
    },
    {
      q: "Comment supprimer mon compte ?",
      a: "Paramètres → Données & confidentialité → Supprimer mon compte. Délai légal de conservation des logs d'audit : 5 ans après suppression.",
    },
  ];
  return (
    <div>
      <PubH1
        t={t}
        eyebrow="AIDE & FAQ"
        title="Questions fréquentes."
        sub="Vous ne trouvez pas votre réponse ? Contactez le support au 1407 ou via le formulaire."
      />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px 60px" }}>
        {faqs.map((f, i) => (
          <details
            key={i}
            style={{ borderBottom: `1px solid ${t.border}`, padding: "18px 0" }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                color: t.ink,
                listStyle: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ flex: 1 }}>{f.q}</span>
              <span style={{ color: t.muted, fontSize: 18 }}>+</span>
            </summary>
            <div
              style={{
                fontSize: 13,
                color: t.muted,
                marginTop: 10,
                lineHeight: 1.7,
              }}
            >
              {f.a}
            </div>
          </details>
        ))}
        <div
          style={{
            marginTop: 32,
            padding: 22,
            borderRadius: 12,
            background: t.dark ? "#10243A" : idnTokens.blueSoft,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ color: idnTokens.blue }}>{IdnIcons.shield}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
              Centre d'appel IDN
            </div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
              1407 — gratuit depuis le Gabon · 24/7 · français, fang, myènè,
              punu, nzébi
            </div>
          </div>
          <IdnButton t={t} variant="ghost" size="sm">
            Formulaire
          </IdnButton>
        </div>
      </div>
    </div>
  );
}

// Legal
function PubLegal({ t }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px 60px" }}>
      <PubH1
        t={t}
        eyebrow="MENTIONS LÉGALES"
        title="Politique de confidentialité."
        sub="Mise à jour le 18 mars 2026 · version 4.2"
      />
      {[
        {
          h: "Responsable de traitement",
          p: "Agence Nationale des Infrastructures Numériques (ANINF), 248 boulevard du Bord de Mer, BP 12 345, Libreville, République Gabonaise.",
        },
        {
          h: "Données collectées",
          p: "Identité pivot (nom, prénom, date et lieu de naissance, sexe, nationalité), email, numéro de téléphone, données biométriques (empreinte du visage), pièces d'identité scannées, journaux d'authentification.",
        },
        {
          h: "Finalités",
          p: "Authentification unifiée aux services administratifs, vérification d'identité (KYC), prévention de la fraude, audit légal.",
        },
        {
          h: "Durée de conservation",
          p: "Données du compte : tant que le compte est actif, plus 30 jours après suppression. Logs d'audit : 5 ans (obligation légale). Données biométriques : non conservées après vérification — seul un hash est gardé.",
        },
        {
          h: "Droits",
          p: "Accès, rectification, portabilité, opposition, suppression. Exercer vos droits depuis Paramètres → Données & confidentialité, ou par courrier à l'ANINF avec copie de la pièce d'identité.",
        },
        {
          h: "Cookies",
          p: "IDN utilise uniquement des cookies de session strictement nécessaires. Aucun traceur publicitaire ou analytique tiers.",
        },
      ].map((s, i) => (
        <div key={i} style={{ marginTop: 26 }}>
          <div
            style={{
              fontSize: 11,
              color: idnTokens.green,
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >{`§ ${i + 1}`}</div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: t.ink,
              marginTop: 6,
            }}
          >
            {s.h}
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.ink2,
              marginTop: 8,
              lineHeight: 1.7,
            }}
          >
            {s.p}
          </div>
        </div>
      ))}
    </div>
  );
}

// Status
function PubStatus({ t }) {
  const services = [
    {
      name: "Authentification (auth.identite.ga)",
      up: "Opérationnel",
      uptime: 99.99,
    },
    {
      name: "OIDC / OAuth (oauth.identite.ga)",
      up: "Opérationnel",
      uptime: 99.97,
    },
    {
      name: "API Identité (api.identite.ga)",
      up: "Opérationnel",
      uptime: 99.98,
    },
    {
      name: "KYC vidéo (kyc.identite.ga)",
      up: "Latence dégradée",
      uptime: 99.91,
      warn: true,
    },
    { name: "Notifications email/SMS", up: "Opérationnel", uptime: 99.96 },
    { name: "USSD *242#", up: "Opérationnel", uptime: 99.82 },
  ];
  return (
    <div>
      <PubH1
        t={t}
        eyebrow="ÉTAT DU SERVICE"
        title="Tous les systèmes essentiels fonctionnent."
        sub="Vue temps réel · mise à jour il y a 23 secondes"
      />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 40px 60px" }}>
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {services.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 22px",
                borderBottom:
                  i === services.length - 1 ?
                    "none"
                  : `1px solid ${t.borderSoft}`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 9999,
                  background: s.warn ? idnTokens.yellow : idnTokens.green,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
                  {s.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: t.muted,
                    marginTop: 2,
                    fontFamily: idnTokens.mono,
                  }}
                >
                  uptime 90j · {s.uptime}%
                </div>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 60 }).map((_, j) => {
                  const fail =
                    (s.warn && (j === 12 || j === 13)) ||
                    (j % 17 === 0 && i === 5);
                  return (
                    <div
                      key={j}
                      style={{
                        width: 4,
                        height: 22,
                        borderRadius: 1,
                        background:
                          fail ?
                            s.warn ?
                              idnTokens.yellow
                            : "#B83A3A"
                          : idnTokens.green,
                      }}
                    />
                  );
                })}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: s.warn ? idnTokens.yellow : idnTokens.green,
                  fontWeight: 600,
                  width: 130,
                  textAlign: "right",
                }}
              >
                {s.up}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          INCIDENTS RÉCENTS
        </div>
        <div
          style={{
            marginTop: 12,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: idnTokens.yellow,
                marginTop: 6,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
                Latence dégradée sur le KYC vidéo
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.muted,
                  marginTop: 2,
                  fontFamily: idnTokens.mono,
                }}
              >
                10 mai 2026 · 14:08 UTC · en cours
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: t.ink2,
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                Le service de vérification vidéo connaît une latence supérieure
                à la normale. Les nouvelles soumissions sont mises en file
                d'attente. Investigation en cours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact
function PubContact({ t }) {
  return (
    <div>
      <PubH1
        t={t}
        eyebrow="NOUS CONTACTER"
        title="Comment pouvons-nous vous aider ?"
        sub="Choisissez le canal le plus adapté à votre demande."
      />
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 40px 60px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {[
          {
            t: "Centre d'appel",
            d: "1407 (gratuit depuis le Gabon)\n+241 11 40 70 00 (international)",
            cta: "Appeler",
          },
          {
            t: "Antenne physique",
            d: "9 antennes provinciales\nLibreville · Port-Gentil · Franceville · Oyem · Lambaréné · Mouila · Tchibanga · Makokou · Koulamoutou",
            cta: "Voir la carte",
          },
          {
            t: "Email",
            d: "support@identite.ga\nRéponse sous 48h ouvrées",
            cta: "Écrire",
          },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>
              {c.t}
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.muted,
                marginTop: 10,
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}
            >
              {c.d}
            </div>
            <IdnButton
              t={t}
              variant="ghost"
              size="sm"
              style={{ marginTop: 16 }}
            >
              {c.cta}
            </IdnButton>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS — logged-in account management
// ─────────────────────────────────────────────────────────────

function CitizenSettings({
  t,
  screen = "security",
  user = DEMO_USERS.citoyen,
}) {
  return (
    <BrowserChrome
      t={t}
      url={`https://identite.ga/settings/${screen}`}
      w={1180}
      h={760}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: t.bg,
          fontFamily: idnTokens.font,
          overflow: "hidden",
        }}
      >
        <CWNav t={t} user={user} screen="profile" />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <SettingsSidebar t={t} active={screen} />
          <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              PARAMÈTRES
            </div>
            {screen === "security" && <SetSecurity t={t} />}
            {screen === "sessions" && <SetSessions t={t} />}
            {screen === "notifications" && <SetNotifications t={t} />}
            {screen === "documents" && <SetDocuments t={t} />}
            {screen === "activity" && <SetActivity t={t} />}
            {screen === "privacy" && <SetPrivacy t={t} />}
            {screen === "preferences" && <SetPreferences t={t} />}
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function SettingsSidebar({ t, active }) {
  const groups = [
    {
      title: "COMPTE",
      items: [
        { id: "security", label: "Sécurité", icon: IdnIcons.lock },
        {
          id: "sessions",
          label: "Appareils & sessions",
          icon: IdnIcons.shield,
        },
        { id: "documents", label: "Mes documents", icon: IdnIcons.doc },
      ],
    },
    {
      title: "PRÉFÉRENCES",
      items: [
        { id: "notifications", label: "Notifications", icon: IdnIcons.bell },
        {
          id: "preferences",
          label: "Langue & accessibilité",
          icon: IdnIcons.user,
        },
      ],
    },
    {
      title: "DONNÉES",
      items: [
        { id: "activity", label: "Historique d'activité", icon: IdnIcons.doc },
        {
          id: "privacy",
          label: "Données & confidentialité",
          icon: IdnIcons.shield,
        },
      ],
    },
  ];
  return (
    <div
      style={{
        width: 240,
        borderRight: `1px solid ${t.border}`,
        background: t.surface,
        padding: "24px 14px",
        flexShrink: 0,
      }}
    >
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 10,
              color: t.muted,
              letterSpacing: 1.2,
              fontWeight: 600,
              padding: "0 10px 8px",
            }}
          >
            {g.title}
          </div>
          {g.items.map((it) => {
            const sel = it.id === active;
            return (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: sel ? 600 : 500,
                  color: sel ? idnTokens.green : t.ink2,
                  background:
                    sel ?
                      t.dark ?
                        "#0F2A18"
                      : idnTokens.greenSoft
                    : "transparent",
                  cursor: "pointer",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    color: sel ? idnTokens.green : t.muted,
                    display: "flex",
                  }}
                >
                  {it.icon}
                </span>
                <span>{it.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SetH({ t, title, sub }) {
  return (
    <div style={{ marginBottom: 24, marginTop: 8 }}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: t.ink,
          letterSpacing: -0.4,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 13,
            color: t.muted,
            marginTop: 6,
            lineHeight: 1.6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function SetCard({ t, title, sub, children, actions }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 22,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.ink }}>
            {title}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 12,
                color: t.muted,
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              {sub}
            </div>
          )}
        </div>
        {actions}
      </div>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

function SetRow({ t, label, value, action, danger }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 0",
        borderBottom: `1px solid ${t.borderSoft}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: danger ? "#B83A3A" : t.ink,
          }}
        >
          {label}
        </div>
        {value && (
          <div
            style={{
              fontSize: 12,
              color: t.muted,
              marginTop: 2,
              fontFamily:
                typeof value === "string" && value.match(/[A-Z0-9-]{6,}/) ?
                  idnTokens.mono
                : idnTokens.font,
            }}
          >
            {value}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

// Security
function SetSecurity({ t }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <SetH
        t={t}
        title="Sécurité"
        sub="Gérez votre mot de passe, votre PIN et l'authentification à deux facteurs."
      />
      <SetCard
        t={t}
        title="Mot de passe"
        sub="Modifié il y a 18 jours"
        actions={
          <IdnButton t={t} variant="ghost" size="sm">
            Modifier
          </IdnButton>
        }
      />
      <SetCard
        t={t}
        title="Code PIN à 6 chiffres"
        sub="Utilisé pour les actions sensibles : signature, validation, accès rapide mobile."
        actions={
          <IdnButton t={t} variant="ghost" size="sm">
            Modifier
          </IdnButton>
        }
      >
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 9999,
                background: idnTokens.green,
              }}
            />
          ))}
        </div>
      </SetCard>
      <SetCard
        t={t}
        title="Authentification à deux facteurs"
        sub="Ajoutez une couche de sécurité supplémentaire à votre compte."
      >
        {[
          {
            l: "Application d'authentification (TOTP)",
            s: "Google Authenticator, Authy, …",
            a: (
              <IdnButton t={t} variant="primary" size="sm">
                Activer
              </IdnButton>
            ),
          },
          {
            l: "SMS",
            s: "+241 06 •• •• •32",
            a: (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: idnTokens.green,
                  padding: "3px 10px",
                  borderRadius: 9999,
                  background: t.dark ? "#0A1F11" : idnTokens.greenSoft,
                }}
              >
                ACTIF
              </span>
            ),
          },
          {
            l: "Clé de sécurité matérielle (FIDO2)",
            s: "YubiKey, Titan, …",
            a: (
              <IdnButton t={t} variant="ghost" size="sm">
                Ajouter
              </IdnButton>
            ),
          },
        ].map((r, i) => (
          <SetRow key={i} t={t} label={r.l} value={r.s} action={r.a} />
        ))}
      </SetCard>
      <SetCard
        t={t}
        title="Codes de récupération"
        sub="Conservez ces 10 codes en lieu sûr : ils permettent d'accéder au compte si vous perdez vos appareils."
        actions={
          <IdnButton t={t} variant="ghost" size="sm">
            Régénérer
          </IdnButton>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 6,
            fontFamily: idnTokens.mono,
            fontSize: 12,
            color: t.ink2,
          }}
        >
          {[
            "7K3J-9Q2L-4F8N",
            "M2H8-5C9R-7P1V",
            "B3X6-A4D2-9E5T",
            "K8Z1-N7Q4-2J9W",
            "••••-••••-••••",
            "••••-••••-••••",
          ].map((c, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                background: t.surface2,
                borderRadius: 6,
                color: i < 4 ? t.ink : t.muted,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </SetCard>
    </div>
  );
}

// Sessions / devices
function SetSessions({ t }) {
  const sessions = [
    {
      dev: "iPhone 14 Pro · Safari",
      loc: "Libreville, GA · 41.222.18.92",
      time: "Active maintenant",
      current: true,
    },
    {
      dev: "MacBook Pro · Chrome",
      loc: "Libreville, GA · 41.222.18.92",
      time: "Il y a 2 heures",
    },
    {
      dev: "Linux · Firefox",
      loc: "Paris, FR · 81.92.144.7",
      time: "Hier, 18:42",
    },
    {
      dev: "Android · Chrome",
      loc: "Port-Gentil, GA · 197.232.40.4",
      time: "Il y a 6 jours",
    },
  ];
  return (
    <div style={{ maxWidth: 720 }}>
      <SetH
        t={t}
        title="Appareils & sessions"
        sub="Voyez où vous êtes connecté·e. Révoquez les sessions que vous ne reconnaissez pas."
      />
      <SetCard
        t={t}
        title={`${sessions.length} sessions actives`}
        sub=""
        actions={
          <IdnButton t={t} variant="danger" size="sm">
            Tout déconnecter
          </IdnButton>
        }
      >
        {sessions.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 0",
              borderBottom:
                i === sessions.length - 1 ?
                  "none"
                : `1px solid ${t.borderSoft}`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: t.surface2,
                color: t.ink2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {IdnIcons.shield}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: t.ink,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {s.dev}
                {s.current && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: idnTokens.green,
                      padding: "2px 7px",
                      borderRadius: 9999,
                      background: t.dark ? "#0A1F11" : idnTokens.greenSoft,
                    }}
                  >
                    CET APPAREIL
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.muted,
                  marginTop: 2,
                  fontFamily: idnTokens.mono,
                }}
              >
                {s.loc}
              </div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                {s.time}
              </div>
            </div>
            {!s.current && (
              <IdnButton t={t} variant="ghost" size="sm">
                Révoquer
              </IdnButton>
            )}
          </div>
        ))}
      </SetCard>
      <SetCard
        t={t}
        title="Alerte de connexion inhabituelle"
        sub="Recevez un email à chaque nouvelle connexion depuis un appareil ou un pays inconnu."
        actions={<Toggle t={t} on />}
      />
    </div>
  );
}

function Toggle({ t, on }) {
  return (
    <div
      style={{
        width: 38,
        height: 22,
        borderRadius: 9999,
        background: on ? idnTokens.green : t.border,
        padding: 2,
        transition: "background .2s",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9999,
          background: "#fff",
          transform: on ? "translateX(16px)" : "translateX(0)",
          transition: "transform .2s",
          boxShadow: "0 1px 2px rgba(0,0,0,.2)",
        }}
      />
    </div>
  );
}

// Notifications
function SetNotifications({ t }) {
  const cats = [
    {
      title: "Sécurité",
      items: [
        {
          l: "Nouvelle connexion détectée",
          email: true,
          sms: true,
          push: true,
        },
        {
          l: "Modification du mot de passe / PIN",
          email: true,
          sms: true,
          push: false,
        },
        {
          l: "Consentement accordé à une nouvelle app",
          email: true,
          sms: false,
          push: true,
        },
      ],
    },
    {
      title: "Vérifications",
      items: [
        {
          l: "Mise à jour du dossier KYC",
          email: true,
          sms: false,
          push: true,
        },
        {
          l: "Niveau de garantie augmenté",
          email: true,
          sms: true,
          push: true,
        },
      ],
    },
    {
      title: "Services",
      items: [
        {
          l: "Démarche en attente de votre action",
          email: true,
          sms: false,
          push: true,
        },
        {
          l: "Service IDN intégré nouvellement",
          email: false,
          sms: false,
          push: false,
        },
      ],
    },
  ];
  return (
    <div style={{ maxWidth: 720 }}>
      <SetH
        t={t}
        title="Notifications"
        sub="Choisissez les événements qui vous notifient et les canaux utilisés."
      />
      {cats.map((c, ci) => (
        <SetCard key={ci} t={t} title={c.title}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              gap: "14px 22px",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <div />
            <div
              style={{
                color: t.muted,
                letterSpacing: 1,
                fontWeight: 600,
                fontSize: 10,
                textAlign: "center",
              }}
            >
              EMAIL
            </div>
            <div
              style={{
                color: t.muted,
                letterSpacing: 1,
                fontWeight: 600,
                fontSize: 10,
                textAlign: "center",
              }}
            >
              SMS
            </div>
            <div
              style={{
                color: t.muted,
                letterSpacing: 1,
                fontWeight: 600,
                fontSize: 10,
                textAlign: "center",
              }}
            >
              PUSH
            </div>
            {c.items.map((it, i) => (
              <React.Fragment key={i}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>
                  {it.l}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Toggle t={t} on={it.email} />
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Toggle t={t} on={it.sms} />
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Toggle t={t} on={it.push} />
                </div>
              </React.Fragment>
            ))}
          </div>
        </SetCard>
      ))}
    </div>
  );
}

// Documents
function SetDocuments({ t }) {
  const docs = [
    {
      type: "Carte Nationale d'Identité",
      num: "1 234 567 N",
      exp: "Expire le 14 mars 2030",
      status: "Validée",
      loa: 2,
    },
    {
      type: "Acte de naissance",
      num: "N° 2871/1992 — Libreville",
      exp: "Délivré le 22 avr 2026",
      status: "Validée",
      loa: 3,
    },
    {
      type: "Passeport biométrique",
      num: "GA 9183745",
      exp: "Expire le 09 juillet 2028",
      status: "Validée",
      loa: 2,
    },
    {
      type: "Certificat de résidence",
      num: "—",
      exp: "—",
      status: "Non fourni",
      loa: null,
    },
  ];
  return (
    <div style={{ maxWidth: 720 }}>
      <SetH
        t={t}
        title="Mes documents"
        sub="Pièces d'identité fournies à IDN. Sont stockées chiffrées, et utilisées uniquement pour les vérifications."
      />
      <SetCard t={t} title="Documents validés">
        {docs.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 0",
              borderBottom:
                i === docs.length - 1 ? "none" : `1px solid ${t.borderSoft}`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 50,
                borderRadius: 6,
                background: t.surface2,
                border: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.muted,
              }}
            >
              {IdnIcons.doc}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>
                {d.type}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.muted,
                  marginTop: 2,
                  fontFamily: idnTokens.mono,
                }}
              >
                {d.num}
              </div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>
                {d.exp}
              </div>
            </div>
            {d.loa ?
              <LoABadge level={d.loa} t={t} compact />
            : <span
                style={{
                  fontSize: 11,
                  color: t.muted,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 9999,
                  background: t.surface2,
                }}
              >
                NON FOURNI
              </span>
            }
            <IdnButton t={t} variant="ghost" size="sm">
              {d.loa ? "Voir" : "Ajouter"}
            </IdnButton>
          </div>
        ))}
      </SetCard>
    </div>
  );
}

// Activity / audit
function SetActivity({ t }) {
  const events = [
    {
      ts: "Aujourd'hui 14:32",
      cat: "AUTH",
      e: "Connexion à Consulat.ga",
      m: "Libreville · iPhone Safari",
      col: idnTokens.green,
    },
    {
      ts: "Aujourd'hui 09:14",
      cat: "CONS",
      e: "Consentement accordé à Bourses Étudiantes",
      m: "scopes : profile, email, birth_cert",
    },
    {
      ts: "Hier 18:42",
      cat: "AUTH",
      e: "Connexion à identite.ga",
      m: "Paris, FR · Firefox Linux",
      col: idnTokens.yellow,
      warn: true,
    },
    {
      ts: "Hier 09:14",
      cat: "KYC",
      e: "Niveau de garantie augmenté à 3",
      m: "KYC vidéo validé par contrôleur K. Ovono",
    },
    {
      ts: "06 mai 11:02",
      cat: "AUTH",
      e: "Mot de passe modifié",
      m: "depuis Paramètres → Sécurité",
    },
    {
      ts: "04 mai 16:30",
      cat: "CONS",
      e: "Consentement révoqué à Ancien-Service.ga",
      m: "inactif depuis 6 mois",
    },
    {
      ts: "22 avr 14:00",
      cat: "KYC",
      e: "Document validé : Acte de naissance",
      m: "soumission #KYC-7K9-3F2",
    },
  ];
  return (
    <div style={{ maxWidth: 880 }}>
      <SetH
        t={t}
        title="Historique d'activité"
        sub="Tous les événements liés à votre compte. Conservés 5 ans à des fins d'audit légal."
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Tous", "Connexions", "Consentements", "KYC", "Sécurité"].map(
          (f, i) => (
            <span
              key={f}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                background: i === 0 ? t.surface : "transparent",
                color: i === 0 ? t.ink : t.muted,
                border: `1px solid ${i === 0 ? t.border : "transparent"}`,
                cursor: "pointer",
              }}
            >
              {f}
            </span>
          ),
        )}
        <div style={{ flex: 1 }} />
        <IdnButton t={t} variant="ghost" size="sm">
          Exporter (.csv)
        </IdnButton>
      </div>
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {events.map((ev, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              padding: "14px 18px",
              alignItems: "center",
              borderBottom:
                i === events.length - 1 ? "none" : `1px solid ${t.borderSoft}`,
            }}
          >
            <span
              style={{
                fontFamily: idnTokens.mono,
                fontSize: 11,
                color: t.muted,
                width: 130,
              }}
            >
              {ev.ts}
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: idnTokens.mono,
                fontWeight: 600,
                color: t.muted,
                padding: "2px 7px",
                borderRadius: 4,
                background: t.surface2,
                width: 50,
                textAlign: "center",
              }}
            >
              {ev.cat}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: t.ink,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {ev.e}
                {ev.warn && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#9b6a00",
                      padding: "2px 7px",
                      borderRadius: 9999,
                      background: t.dark ? "#3A2D14" : idnTokens.yellowSoft,
                    }}
                  >
                    INHABITUEL
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                {ev.m}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Privacy
function SetPrivacy({ t }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <SetH
        t={t}
        title="Données & confidentialité"
        sub="Visualisez, exportez ou supprimez les données associées à votre compte IDN."
      />
      <SetCard
        t={t}
        title="Télécharger une copie de vos données"
        sub="Archive ZIP contenant identité pivot, documents, consentements et historique d'activité au format JSON. Disponible sous 24h."
        actions={
          <IdnButton t={t} variant="ghost" size="sm">
            Demander
          </IdnButton>
        }
      />
      <SetCard t={t} title="Partage de données" sub="">
        <SetRow
          t={t}
          label="Partage avec services intégrés"
          value="Uniquement avec consentement explicite"
          action={
            <span
              style={{ fontSize: 11, color: idnTokens.green, fontWeight: 600 }}
            >
              VERROUILLÉ
            </span>
          }
        />
        <SetRow
          t={t}
          label="Réutilisation à des fins statistiques"
          value="Données anonymisées, agrégées"
          action={<Toggle t={t} on />}
        />
        <SetRow
          t={t}
          label="Programme d'amélioration UX"
          value="Aide à améliorer le produit IDN — anonyme"
          action={<Toggle t={t} on={false} />}
        />
      </SetCard>
      <div
        style={{
          background: t.dark ? "#1F1216" : "#FBE5E5",
          border: `1px solid ${t.dark ? "#3A1E1E" : "#F5C7C7"}`,
          borderRadius: 12,
          padding: 22,
          marginTop: 18,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: "#B83A3A" }}>
          Zone sensible
        </div>
        <SetRow
          t={t}
          label="Désactiver temporairement le compte"
          value="Suspend les connexions sans supprimer les données. Réactivable par email."
          action={
            <IdnButton t={t} variant="ghost" size="sm">
              Désactiver
            </IdnButton>
          }
        />
        <SetRow
          t={t}
          danger
          label="Supprimer définitivement le compte"
          value="Vos données seront effacées sous 30 jours. Logs d'audit conservés 5 ans (obligation légale)."
          action={
            <IdnButton t={t} variant="danger" size="sm">
              Supprimer
            </IdnButton>
          }
        />
      </div>
    </div>
  );
}

// Preferences
function SetPreferences({ t }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <SetH
        t={t}
        title="Langue & accessibilité"
        sub="Personnalisez l'interface et les communications IDN."
      />
      <SetCard t={t} title="Langue de l'interface" sub="">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            { id: "fr", l: "Français", sub: "Langue officielle", sel: true },
            { id: "en", l: "English", sub: "Official language", sel: false },
            { id: "fang", l: "Fang", sub: "Bientôt", sel: false, dis: true },
          ].map((o) => (
            <div
              key={o.id}
              style={{
                padding: 14,
                borderRadius: 10,
                border: `1.5px solid ${o.sel ? idnTokens.green : t.border}`,
                background:
                  o.sel ?
                    t.dark ?
                      "#0F2A18"
                    : idnTokens.greenSoft
                  : t.surface,
                opacity: o.dis ? 0.5 : 1,
                cursor: o.dis ? "default" : "pointer",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
                {o.l}
              </div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>
                {o.sub}
              </div>
            </div>
          ))}
        </div>
      </SetCard>
      <SetCard t={t} title="Communications" sub="">
        <SetRow
          t={t}
          label="Langue des emails et SMS"
          value="Français"
          action={
            <IdnButton t={t} variant="ghost" size="sm">
              Modifier
            </IdnButton>
          }
        />
        <SetRow
          t={t}
          label="Format de la date"
          value="JJ/MM/AAAA — 14/03/1992"
          action={
            <IdnButton t={t} variant="ghost" size="sm">
              Modifier
            </IdnButton>
          }
        />
        <SetRow
          t={t}
          label="Fuseau horaire"
          value="Africa/Libreville (UTC+1)"
          action={
            <IdnButton t={t} variant="ghost" size="sm">
              Modifier
            </IdnButton>
          }
        />
      </SetCard>
      <SetCard t={t} title="Accessibilité" sub="">
        <SetRow
          t={t}
          label="Contraste élevé"
          value="Améliore la lisibilité"
          action={<Toggle t={t} on={false} />}
        />
        <SetRow
          t={t}
          label="Réduire les animations"
          value="Respecte prefers-reduced-motion"
          action={<Toggle t={t} on />}
        />
        <SetRow
          t={t}
          label="Lecteur d'écran optimisé"
          value="Annotations ARIA détaillées"
          action={<Toggle t={t} on />}
        />
      </SetCard>
    </div>
  );
}

Object.assign(window, { CitizenPublic, CitizenSettings });
