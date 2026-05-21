# PLAN — Emails externes auto-hébergés (`@identite.ga`)

> **Statut** : planification — aucun code écrit. Document de référence à reprendre
> au moment de l'implémentation.
>
> **Auteur** : @iasted · **Date** : 2026-05-21
>
> Lire `ressources/SPECS_FEATURES_CITIZEN.md §2` (iBoîte) avant ce document.

---

## 1. Contexte

L'iBoîte actuelle (cf. [`packages/backend/convex/iboite/`](../packages/backend/convex/iboite/)) est un système **fermé** :

- Chaque citoyen reçoit à l'inscription un alias **`prenom.nom@idn.ga`** généré par
  [`generateIboiteEmailAlias`](../packages/backend/convex/lib/iboiteId.ts).
- Cet alias n'a **aucun SMTP réel** — c'est un libellé interne. La mutation
  [`iboite/letters.send`](../packages/backend/convex/iboite/letters.ts) rejette
  explicitement tout domaine externe.
- Les emails sortants applicatifs (OTP, KYC, notifs) passent par **Resend** via
  [`@convex-dev/resend`](../packages/backend/convex/email/provider.tsx).

On veut **ouvrir** l'iBoîte au monde extérieur tout en **éliminant Resend** :
auto-hébergement complet de l'infrastructure email.

---

## 2. Objectifs

1. À l'inscription, chaque citoyen reçoit une adresse `prenom.nom@identite.ga`
   **réellement routable** sur Internet (MX résolu, SMTP actif).
2. Un mail envoyé depuis Gmail/Outlook/etc. vers cette adresse arrive dans
   l'iBoîte du citoyen, section **eMails** (pas Courriers — cf. choix table §6.3).
3. Le citoyen répond depuis l'iBoîte → le mail part avec `From: prenom.nom@identite.ga`,
   threadé correctement (headers `Message-ID` / `In-Reply-To` / `References`).
4. Les communications **interne → interne** (`alice@identite.ga` →
   `bob@identite.ga`) continuent de fonctionner sans aller-retour SMTP (court-circuit
   dans la mutation, comme aujourd'hui).
5. **Zéro service email tiers** dans la chaîne (pas de Resend, pas de SendGrid,
   pas de Postmark). Toute la couche email transite par notre infrastructure.

---

## 3. Décisions arrêtées (validées avec @iasted)

| # | Décision | Conséquence |
|---|----------|-------------|
| D1 | **Convex reste** (Cloud aujourd'hui, self-hosted plus tard) | Pas de refonte BD |
| D2 | **Full auto-hébergement** des emails (inbound **et** outbound) | Pas d'hybride avec relais SES/Scaleway |
| D3 | MTA = **Stalwart Mail Server** (Rust, Apache 2.0, soutenu par NLnet) | Webhooks natifs + MTA Hooks + Sieve |
| D4 | Domaine principal = **`identite.ga`** | DNS + MX sur identite.ga |
| D5 | Élimination à terme de `@convex-dev/resend` | Refactor [`email/provider.tsx`](../packages/backend/convex/email/provider.tsx) |
| D6 | Table cible pour les emails externes = **`iboiteMessage`** | Déjà thread-aware (`threadId`, `inReplyTo`) |
| D7 | Trafic majoritairement interne attendu → tolérance acceptable sur la délivrabilité externe | Warmup standard suffisant, pas besoin de relais infra |

---

## 4. Décisions à prendre (TBD avant implémentation)

| # | Question | Options | Reco |
|---|----------|---------|------|
| Q1 | Faut-il garder **`@idn.ga`** en parallèle de `@identite.ga` pour les alias ? Le code et les maquettes l'utilisent partout aujourd'hui. | (A) Tout migrer vers `@identite.ga`, abandonner `@idn.ga` · (B) Accepter les deux (double MX, Stalwart multi-domaine) · (C) Garder uniquement `@idn.ga` | (A) — cohérence marketing |
| Q2 | Hébergeur du VPS Stalwart ? | Scaleway Paris (FR souverain) · OVH (FR) · Hetzner (DE) · Serveur physique GA | Scaleway Paris pour alignement souveraineté UE/FR le temps que l'infra GA mûrisse |
| Q3 | Durée du warmup avant ouverture grand public ? | 4 sem · 6 sem · 8 sem | 6 sem (compromis vitesse/délivrabilité) |
| Q4 | Hébergement de la web app `identite.ga` (site lui-même) ? | Convex (assets statiques) · VPS Apache reverse-proxy · Vercel/Netlify | Hors-scope de ce document, à arbitrer à part — n'impacte pas le MX |
| Q5 | Chiffrement applicatif des emails entrants stockés en BD (cohérent avec iDocument E2E) ou clear-text V1 ? | E2E · Clear-text V1 | Clear-text V1, E2E V2 — à documenter dans la politique RGPD |

---

## 5. Architecture cible

```
                     Internet (Gmail / Outlook / Yahoo / …)
                                    │
                                    │ port 25 (SMTP entrant)
                                    ▼
                  ┌──────────────────────────────────────────┐
       MX  ──►    │  Stalwart Mail Server                    │
   identite.ga    │  (VPS Scaleway Paris, Rust, 512 MB-1 GB) │
                  │                                          │
                  │  • SMTP inbound (port 25)                │
                  │  • DKIM signing outbound                 │
                  │  • Catch-all *@identite.ga → MTA Hook    │
                  │  • SMTP submission (587) pour outbound   │
                  │  • API HTTP (JMAP) pour l'app            │
                  └──────────┬──────────────────────┬────────┘
                             │                      │
                  HTTP POST  │                      │  HTTP POST
                  signé HMAC │                      │  (mail à envoyer)
                  (MTA Hook  │                      │
                  on DATA)   ▼                      │
                  ┌──────────────────────┐          │
                  │  Convex HTTP route   │          │
                  │  /inbound-email      │          │
                  │  - vérif HMAC        │          │
                  │  - parse RFC 5322    │          │
                  │  - resolve dest      │          │
                  │  - insert message    │          │
                  └──────────┬───────────┘          │
                             │                      │
                             ▼                      │
                  ┌──────────────────────┐          │
                  │  iboiteMessage (DB)  │          │
                  │  + storage attach.   │          │
                  └──────────┬───────────┘          │
                             │                      │
                  reply UI   │                      │
                             ▼                      │
                  ┌──────────────────────┐          │
                  │  iboite/messages.send│──────────┘
                  │  - interne: court-   │
                  │    circuit DB        │
                  │  - externe: appel    │
                  │    Stalwart API      │
                  └──────────────────────┘
```

**Principe** : Stalwart fait office d'**unique passerelle SMTP** dans les deux sens.
Convex ne parle jamais directement à un MTA tiers — uniquement à notre Stalwart via
HTTP (entrant) et HTTP/SMTP (sortant).

---

## 6. Détails techniques

### 6.1 DNS sur `identite.ga`

```
mx.identite.ga.                    A     <IP statique du VPS>
identite.ga.                       MX    10 mx.identite.ga.
identite.ga.                       TXT   "v=spf1 mx -all"
stalwart._domainkey.identite.ga.   TXT   "v=DKIM1; k=rsa; p=<clé publique>"
                                         (clé générée par Stalwart au boot)
_dmarc.identite.ga.                TXT   "v=DMARC1; p=none; rua=mailto:dmarc@identite.ga; pct=100"
                                         (passer à p=quarantine après 4 sem., p=reject après 8)
```

**PTR (reverse DNS)** : `<IP>` → `mx.identite.ga`. À configurer côté
fournisseur VPS, **pas** dans la zone DNS d'identite.ga. C'est rédhibitoire pour
Gmail — vérifier que le fournisseur permet la délégation PTR **avant achat**.

### 6.2 VPS Stalwart — dimensionnement

- **Minimum** : 1 vCPU, 1 GB RAM, 20 GB SSD (Scaleway DEV1-S ~7 €/mois, ou Hetzner CX22 ~4 €/mois)
- **IP** : IPv4 statique obligatoire. IPv6 bienvenu.
- **OS** : Debian 12 LTS ou Ubuntu 24.04 LTS.
- Vérifier l'IP sur https://mxtoolbox.com/blacklists.aspx **avant** signature contrat.

### 6.3 Stalwart — config (extraits `/opt/stalwart/etc/config.toml`)

```toml
[server.hostname]
default = "mx.identite.ga"

[server.listener.smtp]
bind = ["0.0.0.0:25"]
protocol = "smtp"

[server.listener.submission]
bind = ["0.0.0.0:587"]
protocol = "smtp"
tls.implicit = false  # STARTTLS

# Accepte tout *@identite.ga (catch-all, pas de mailbox locale)
[session.rcpt]
relay = "is_local_domain('default', rcpt_domain)"
max-recipients = 25

[session.data.script]
run = "to_convex_webhook"

# Filtrage anti-spam minimal — DKIM/SPF/DMARC verdict avant le hook
[session.data]
spam.threshold.discard = 5.0
spam.threshold.reject = 8.0

# MTA Hook → Convex
[mta-hook."convex-inbound"]
url = "https://<convex-deployment>.convex.site/inbound-email"
enable = true
stages = ["data"]
timeout = "30s"
auth.username = "convex"
auth.secret = "%{env:MTA_HOOK_SECRET}%"  # HMAC sur le body, vérifié côté Convex

# DKIM
[signature."identite.ga"]
domain = "identite.ga"
selector = "stalwart"
private-key = "%{file:/opt/stalwart/etc/dkim/identite.ga.key}%"
canonicalization = "relaxed/relaxed"
algorithm = "rsa-sha256"
```

### 6.4 Convex — extensions

**A. Nouvelle route HTTP** (à ajouter à
[`packages/backend/convex/http.ts`](../packages/backend/convex/http.ts)) :

```ts
http.route({
  path: "/inbound-email",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const sig = req.headers.get("X-Hook-Signature")
    const body = await req.text()
    if (!verifyHmacSha256(body, sig, process.env.MTA_HOOK_SECRET!)) {
      return new Response("forbidden", { status: 403 })
    }
    await ctx.runAction(internal.email.inbound.ingest, { rawBody: body })
    // Stalwart attend une réponse { action: "accept" | "reject", ... }
    return new Response(JSON.stringify({ action: "accept" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }),
})
```

**B. Nouvelle action** `convex/email/inbound.ts` (internalAction — Node runtime
pour utiliser `mailparser`) :

```ts
// convex/email/inbound.ts
"use node"
import { simpleParser } from "mailparser"
import { internalAction } from "../_generated/server"
import { internal } from "../_generated/api"
import { v } from "convex/values"

export const ingest = internalAction({
  args: { rawBody: v.string() },
  handler: async (ctx, { rawBody }) => {
    const evt = JSON.parse(rawBody)
    const parsed = await simpleParser(evt.message.contents)

    for (const rcpt of evt.envelope.to) {
      // 1. resolve destinataire — silently drop si introuvable (anti-enum)
      // 2. stocker pièces jointes dans ctx.storage
      // 3. dispatch via mutation interne
      await ctx.runMutation(internal.iboite.messages.deliverExternal, {
        toEmail: rcpt,
        from: { name: parsed.from?.value[0].name, email: parsed.from?.value[0].address },
        subject: parsed.subject ?? "(sans objet)",
        text: parsed.text ?? "",
        html: parsed.html || null,
        messageId: parsed.messageId,
        inReplyTo: parsed.inReplyTo,
        references: parsed.references,
        attachments: await Promise.all(
          (parsed.attachments ?? []).map(async (a) => {
            const id = await ctx.storage.store(
              new Blob([a.content], { type: a.contentType }),
            )
            return { name: a.filename ?? "fichier", mimeType: a.contentType, size: a.size, storageRef: id }
          }),
        ),
        spamVerdict: evt.context?.spam?.verdict ?? null,
      })
    }
  },
})
```

**C. Refactor** [`email/provider.tsx`](../packages/backend/convex/email/provider.tsx) :
remplacer toute la couche `@convex-dev/resend` par un client HTTP/SMTP vers
Stalwart. L'abstraction `sendOtpEmail` / `sendKycEmail` / `sendGenericEmail`
**reste identique** côté call-sites — c'est exactement le scénario prévu dans le
commentaire ligne 24 du fichier actuel.

```ts
async function sendViaStalwart(args: {
  from: string
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
  attachments?: Array<{ filename: string; content: Buffer | string; contentType: string }>
}) {
  // Option SMTP submission via nodemailer (Node runtime)
  // OU JMAP HTTP API (plus simple côté Convex)
  await fetch(`${process.env.STALWART_API_URL}/api/email/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STALWART_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  })
}
```

**D. Mutation** `iboite/messages.send` — extension pour router selon le
domaine :

```ts
if (recipientEmail.endsWith("@identite.ga")) {
  // → écriture in-app uniquement (court-circuit, comme aujourd'hui)
} else {
  // → écriture in-app (sent folder) + appel sendViaStalwart()
  //   avec From: `${user.displayName} <${account.emailAlias}>`
  //   et headers In-Reply-To/References si reply
}
```

### 6.5 Schéma BD — migration `iboiteMessage`

Ajouter les champs suivants à
[`packages/backend/convex/schema.ts`](../packages/backend/convex/schema.ts)
table `iboiteMessage` (tous **optionnels** pour rétro-compat) :

```ts
iboiteMessage: defineTable({
  // ... champs existants ...
  externalMessageId: v.optional(v.string()),        // RFC 5322 Message-ID
  externalInReplyTo: v.optional(v.string()),        // header In-Reply-To brut
  externalReferences: v.optional(v.array(v.string())), // header References brut
  isExternal: v.optional(v.boolean()),              // true = vient/part vers hors identite.ga
  spamVerdict: v.optional(v.string()),              // "pass" | "fail" | "neutral" depuis Stalwart
  // Pièces jointes — schéma à clarifier : sous-table iboiteMessageAttachment
  // (sur le modèle d'iboiteLetterAttachment) ou champ embarqué ?
  // Recommandation : sous-table pour symétrie avec les courriers.
})
  .index("by_externalMessageId", ["externalMessageId"])
  // ... index existants ...
```

Créer aussi `iboiteMessageAttachment` (calque d'`iboiteLetterAttachment`).

### 6.6 Variables d'environnement Convex (à ajouter)

```
STALWART_API_URL          # https://mx.identite.ga:8080 ou via tunnel privé
STALWART_API_TOKEN        # bearer token généré côté Stalwart
MTA_HOOK_SECRET           # secret HMAC partagé Stalwart ↔ Convex
EMAIL_INBOUND_ENABLED     # feature flag pour activer/désactiver l'inbound
```

À retirer (après migration) :

```
RESEND_API_KEY
RESEND_WEBHOOK_SECRET
RESEND_FROM
```

---

## 7. Délivrabilité — mesures obligatoires

Référence : [Gmail Sender Requirements (fév. 2024 + durcissement 2025)](https://support.google.com/mail/answer/81126).

### 7.1 Avant le premier mail sortant

- [ ] PTR (reverse DNS) configuré et résolu (`dig -x <IP>` doit renvoyer `mx.identite.ga`)
- [ ] SPF, DKIM, DMARC publiés et validés ([https://mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx))
- [ ] IP vérifiée sur Spamhaus, Barracuda, SORBS — si listée avant même d'envoyer, **changer d'IP**
- [ ] Inscription **Google Postmaster Tools v2** (https://postmaster.google.com/)
- [ ] Inscription **Microsoft SNDS** (https://sendersupport.olc.protection.outlook.com/snds/)
- [ ] DMARC en `p=none` au démarrage avec rapports `rua=mailto:dmarc@identite.ga`

### 7.2 Plan de warmup (6 semaines)

| Semaine | Volume max/jour | Destinataires |
|---------|-----------------|---------------|
| 1 | 50 | Beta-testers internes uniquement (≤ 10 comptes Gmail/Outlook personnels validés) |
| 2 | 200 | + 50 amis/famille pré-prévenus |
| 3 | 500 | Petit cercle (100 utilisateurs sélectionnés) |
| 4 | 1 500 | 250 utilisateurs |
| 5 | 5 000 | 1 000 utilisateurs |
| 6 | 15 000 | Ouverture progressive |

**Critères d'arrêt warmup** : taux de plaintes > 0,1 % OU taux de bounces dur > 2 % → on
pause, on diagnostique, on attend 48 h avant de redémarrer.

### 7.3 Durcissement DMARC après warmup

- Semaine 4 : `p=none` → `p=quarantine; pct=25`
- Semaine 6 : `pct=100`
- Semaine 10 : `p=quarantine` → `p=reject`

### 7.4 Monitoring continu (en plus du dashboard admin existant)

- Cron quotidien : pull Google Postmaster Tools API → stocker dans `systemConfig` ou nouvelle table `emailReputationDaily`
- Alerte Slack/SMS si bounce rate > 2 % sur 1 h
- Alerte si l'IP apparaît sur une blocklist (cron `dig` toutes les heures)

---

## 8. Sécurité / anti-abus

| Vecteur | Mesure |
|---------|--------|
| Spam entrant massif (DoS BD) | Rate-limit par destinataire via `@convex-dev/rate-limiter` (déjà installé) — ex : max 100 mails/jour/compte, au-delà 421 temp fail |
| Énumération d'adresses | Webhook accepte **silencieusement** les destinataires inconnus (200 OK + drop) au lieu de bouncer. Stalwart configuré idem au niveau SMTP — `relay` accepte tout, le tri est côté app |
| Phishing usurpant `noreply@identite.ga`, `kyc@identite.ga` etc. | Liste réservée dans [`lib/iboiteId.ts`](../packages/backend/convex/lib/iboiteId.ts) : refus de génération d'alias collidant avec `postmaster`, `abuse`, `admin`, `support`, `noreply`, `updates`, `kyc`, `security`, `info`, `contact`, `root`, `webmaster` |
| Pièces jointes malveillantes | Limite taille 25 MB (configurable Stalwart), blacklist MIME (`.exe`, `.scr`, `.bat`, `.cmd`, `.js`, `.vbs`) au niveau du parser inbound. ClamAV au niveau Stalwart en V2 |
| SPF/DKIM/DMARC fail sur mail entrant | Stocker `spamVerdict` dans `iboiteMessage`, affichage UI badge "Origine non vérifiée" en orange |
| Compromission VPS Stalwart | Backup chiffré quotidien de la config + clé DKIM hors-site. Rotation clé DKIM si compromission suspectée (procédure ADR à écrire) |

---

## 9. Coûts estimés (mensuels)

| Poste | Coût |
|-------|------|
| VPS Scaleway DEV1-S (1 vCPU / 2 GB / 20 GB) | ~7 € |
| IP statique | inclus |
| Bande passante (estimation 50 GB) | inclus |
| Domaine `identite.ga` (déjà payé) | 0 |
| Monitoring (Google PMT, MS SNDS) | gratuit |
| Backup (S3-compatible chez Scaleway Object Storage) | ~1 € |
| **Total** | **~8 €/mois** |

Vs Resend Pro à 20 $/mois + overage — **gain ~15 €/mois** mais surtout
**indépendance et contrôle**.

---

## 10. Plan d'implémentation (ordonné)

> Chaque étape doit être **vérifiée** avant la suivante. Pas de big bang.

### Phase 0 — Préparation (1 semaine)
1. Trancher Q1 (alias `@idn.ga` vs `@identite.ga`)
2. Trancher Q2 (hébergeur VPS) — commander, vérifier blocklists
3. Configurer PTR avec le fournisseur VPS

### Phase 1 — Infra email (1-2 semaines)
4. Installer Stalwart sur VPS (Debian + binaire officiel)
5. Configurer DKIM/SPF/DMARC (DMARC en `p=none`)
6. Poser MX, A, TXT dans la zone DNS d'identite.ga
7. Test : `swaks --to test@identite.ga` depuis l'extérieur → Stalwart accepte
8. Inscription Google Postmaster Tools + Microsoft SNDS

### Phase 2 — Pont Convex ↔ Stalwart (1 semaine)
9. Migration schéma `iboiteMessage` (champs optionnels — non-cassant)
10. Créer `convex/email/inbound.ts` (internalAction) avec `mailparser`
11. Ajouter route `/inbound-email` dans `http.ts`
12. Configurer MTA Hook côté Stalwart vers cette route
13. Test E2E : mail Gmail → identite.ga → arrive dans Convex DB

### Phase 3 — Sortant via Stalwart (1 semaine)
14. Refactor `email/provider.tsx` : `sendViaStalwart()` derrière la même API
15. Bascule **progressive** call-site par call-site (OTP en premier, puis KYC,
    puis generic) — feature flag `EMAIL_VIA_STALWART` activable par catégorie
16. Test E2E : OTP via Stalwart arrive bien dans une Gmail/Outlook personnelle

### Phase 4 — Migration alias (1 semaine, dépend de Q1)
17. Si Q1=A : script `_dev/migrateIboiteAliases.ts` pour basculer
    `@idn.ga` → `@identite.ga` sur tous les comptes existants
18. Update libellés FR/EN ([`apps/web/.../_content/fr.ts`](../apps/web/app/(citizen)/iboite/_content/fr.ts))
19. Update [`generateIboiteEmailAlias`](../packages/backend/convex/lib/iboiteId.ts)
    pour générer en `@identite.ga`

### Phase 5 — Iboîte externe (2 semaines)
20. Extension mutation `iboite/messages.send` (routing interne/externe)
21. UI : badge "Reçu de l'extérieur" sur les messages où `isExternal = true`
22. UI : badge "Envoyé vers l'extérieur"
23. UI : avertissement si `spamVerdict !== "pass"`
24. Reply : récupération `externalMessageId` parent → headers In-Reply-To / References

### Phase 6 — Warmup (6 semaines, cf. §7.2)
25. Démarrage avec 10 beta-testeurs internes
26. Élargissement progressif
27. Durcissement DMARC selon §7.3
28. Retrait définitif de `@convex-dev/resend` du `convex.config.ts` une fois
    confirmé que tous les call-sites passent par Stalwart

### Phase 7 — Hardening (continu)
29. ClamAV sur les pièces jointes
30. Chiffrement applicatif des emails entrants (cohérent iDocument E2E) — V2

---

## 11. Risques connus

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| IP VPS déjà blacklistée à la livraison | Moyenne | Bloquant | Vérif pré-achat, demander changement d'IP au fournisseur |
| Gmail rejette tout pendant warmup | Faible (si DNS OK) | Élevé | Tester progressivement, surveiller PMT v2 |
| Volume entrant écrase Convex (DoS via spam) | Faible | Moyen | Rate-limit + Stalwart anti-spam built-in |
| Perte du VPS / compromission | Faible | Élevé | Backup quotidien chiffré + procédure de rotation DKIM |
| `@convex-dev/resend` resté actif partiellement après migration | Moyenne | Faible | Feature flag par catégorie pendant la bascule |
| Confusion utilisateurs entre `@idn.ga` (anciens comptes) et `@identite.ga` (nouveaux) | Élevée si Q1=B | Moyen | Trancher Q1=A et migrer tout |

---

## 12. Critères de succès (definition of done)

- [ ] Un mail envoyé depuis Gmail vers `<alias>@identite.ga` arrive dans
      l'iBoîte sous 30 secondes (P95)
- [ ] Une réponse depuis l'iBoîte arrive dans Gmail, **threadée** dans la
      conversation existante, avec `From: <alias>@identite.ga`
- [ ] Score `mail-tester.com` ≥ 9/10 pour l'envoi sortant
- [ ] `dmarcian.com` confirme alignement SPF + DKIM sur 100 % des mails sortants
- [ ] Google Postmaster Tools v2 : compliance status = "Pass" sur SPF, DKIM, DMARC, PTR, TLS
- [ ] Taux de bounce dur < 2 % sur 7 jours glissants
- [ ] Taux de plaintes < 0,1 % sur 7 jours glissants
- [ ] Aucun appel à `@convex-dev/resend` dans le code (grep clean)
- [ ] Coût mensuel < 15 €

---

## 13. Annexes — sources

- [Stalwart Mail Server (GitHub)](https://github.com/stalwartlabs/stalwart)
- [Stalwart — Webhooks & MTA Hooks](https://stalw.art/blog/webhooks/)
- [Stalwart — config reference](https://stalw.art/docs/)
- [Comparaison self-hosted email servers 2026](https://mailflowauthority.com/self-hosted-smtp/mailcow-vs-postal-vs-stalwart)
- [Google — Email Sender Guidelines (2024+)](https://support.google.com/mail/answer/81126)
- [Google Postmaster Tools v2](https://postmaster.google.com/)
- [Microsoft SNDS](https://sendersupport.olc.protection.outlook.com/snds/)
- [Self-hosted SMTP deliverability 2026 (warmup, PTR)](https://prospeo.io/s/how-to-warm-up-smtp-server)
- [mailparser (npm)](https://www.npmjs.com/package/mailparser)
- [Convex self-hosting docs](https://docs.convex.dev/self-hosting)
- [Convex — HTTP Actions](https://docs.convex.dev/functions/http-actions)
- ADR à écrire au moment de l'implémentation : `ressources/doc/adr-XXXX-email-stalwart-self-hosted.md`

---

## 14. Notes brutes (à intégrer / arbitrer plus tard)

- Question levée par @iasted (transcription verbale) sur un éventuel **second
  domaine alias** ("identitay" — orthographe à confirmer, peut-être `idn.ga`
  qui est déjà utilisé dans le code, ou un autre domaine encore non réservé).
  → Voir Q1, à trancher avant Phase 0.
- Hébergement du site web (apex `identite.ga`) → à arbitrer séparément,
  n'impacte pas le MX tant que les enregistrements DNS sont cohérents.
- Possibilité future : ouvrir un **webmail** (RoundCube ou interface Stalwart
  native) pour les agents administratifs IDN. Stalwart le supporte
  nativement via JMAP — pas de travail supplémentaire côté MTA.
