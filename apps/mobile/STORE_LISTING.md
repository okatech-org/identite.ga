# Store listing — Identité Numérique (TestFlight External + Play Open)

Ce document centralise tout le texte et les choix de fiche store pour
**App Store Connect** (iOS) et **Google Play Console** (Android),
ainsi que les réponses aux questionnaires *App Privacy* (Apple) et
*Data Safety* (Google) que la review utilise pour valider l'app.

Tous les textes sont en français — l'audience cible étant
exclusivement gabonaise. Une version EN minimale est fournie en bas
pour les options où Apple/Google l'exigent (TestFlight External,
Open Testing).

---

## Métadonnées communes

| Champ                      | Valeur                                                |
| -------------------------- | ----------------------------------------------------- |
| Nom de l'app               | `Identité Numérique`                                  |
| Sous-titre / short desc    | `Service public numérique du Gabon`                   |
| Bundle iOS                 | `ga.idn.mobile`                                       |
| Package Android            | `ga.idn.mobile`                                       |
| Catégorie iOS              | Utilitaires (`Utilities`)                             |
| Catégorie iOS secondaire   | Productivité (`Productivity`)                         |
| Catégorie Android          | Outils (`Tools`)                                      |
| Classement âge             | 4+ (Apple) · Tout public (Google)                     |
| URL Privacy Policy         | `https://identite.ga/legal/privacy`                   |
| URL Terms                  | `https://identite.ga/legal/terms`                     |
| URL Support                | `https://identite.ga/contact`                         |
| URL Marketing (optionnel)  | `https://identite.ga`                                 |
| Email support              | `support@identite.ga`                                 |
| Email confidentialité      | `privacy@identite.ga`                                 |
| Téléphone                  | `1407` (Gabon) · `+241 11 40 70 00` (international)   |
| Compte démo (review Apple) | À créer : `apple-review@idn.ga` + passkey de test     |

---

## Description (FR)

> Identité Numérique du Gabon — votre compte unique pour tous les
> services administratifs en ligne.
>
> Authentifiez-vous une fois, accédez à l'ensemble des démarches
> publiques (état civil, fiscalité, éducation, santé, justice,
> e-Visa) en toute sécurité, sans recréer un compte à chaque fois.
>
> ◆ AUTHENTIFICATION SÉCURISÉE
> Passkey Face ID / Touch ID, code PIN à 6 chiffres, double facteur.
> Trois niveaux de garantie (LoA) calibrés sur la sensibilité du
> service.
>
> ◆ VÉRIFICATION D'IDENTITÉ (KYC)
> Photographiez votre CNI, votre passeport ou votre carte de séjour
> + selfie animé. Validation par les contrôleurs Ntsagui digital sous 24h.
>
> ◆ iCARTE — Portefeuille numérique
> Toutes vos cartes (CNI, permis, transport, CNAMGS, bancaire,
> visite, fidélité) regroupées en un seul endroit, accessibles
> hors connexion.
>
> ◆ iBOÎTE — Courrier officiel
> Recevez vos courriers administratifs et colis en numérique.
> Adresse unique `prenom.nom@idn.ga`. Notifications en temps réel.
>
> ◆ iDOCUMENT — Archive personnelle
> Conservez vos pièces officielles, contrats, factures, diplômes —
> alertes d'expiration avant la date butoir.
>
> ◆ iCV — Curriculum Vitæ
> Construisez et exportez votre CV au format PDF. Optimisation IA
> pour les offres d'emploi (analyse ATS, suggestions de compétences).
>
> ◆ CONFIDENTIALITÉ
> Données hébergées au Gabon. Chiffrement de bout en bout. Aucun
> partage sans votre consentement explicite. Conforme RGPD et à la
> loi 001/2011 sur la protection des données.
>
> ◆ INCLUSION
> Disponible en français + langues nationales. Centre d'appel 1407
> gratuit 24/7. Antennes physiques dans les 9 provinces. Canal USSD
> *242# pour les zones non connectées.
>
> Opéré par Ntsagui digital.
>
> Une question ? privacy@identite.ga · support@identite.ga · 1407

### Description (EN — pour TestFlight External / Open Testing)

> Digital Identity of Gabon — one account for all online public
> services of the Gabonese Republic.
>
> Authenticate once, access civil status, taxation, education,
> healthcare, justice and e-Visa services without re-creating
> an account every time.
>
> Features:
> – Secure passkey authentication (Face ID / Touch ID), PIN, 2FA
> – Identity verification (KYC) with national ID, passport or
>   residence card
> – iCarte digital wallet (national ID, driving licence, transport,
>   health insurance, banking, business cards)
> – iBoîte mailbox for official mail and parcels
> – iDocument personal archive with expiry alerts
> – iCV résumé builder with AI optimisation for job applications
>
> All data hosted in Gabon. End-to-end encryption. GDPR-compliant,
> Gabonese Data Protection Law 001/2011.
>
> Operated by Ntsagui digital.

---

## What's New (release notes preview 1.0.0)

> Première version publique de l'app Identité Numérique du Gabon.
>
> – Création de compte avec passkey (Face ID / Touch ID)
> – Vérification d'identité (KYC) pour passer aux niveaux 2 et 3
> – Portefeuille iCarte avec 10 types de cartes
> – Courrier iBoîte (courriers, colis, e-mails internes)
> – Archive iDocument avec alertes d'expiration
> – CV iCV avec export PDF et optimisation IA
>
> Cette version est une **preview publique**. Merci de signaler
> tout bug à support@identite.ga ou via le formulaire dans
> Paramètres → Aide.

---

## Mots-clés Apple (≤ 100 chars, virgules)

```
identité,gabon,kyc,ntsagui,wallet,icarte,icv,iboite,passkey,ID,service public,e-visa,administration
```

(99 caractères avec les virgules — OK.)

## Tags Google Play

Aucun champ tags libres ; Play utilise les **catégories**. Choix
secondaires :
- Catégorie : Outils (`Tools`)
- Tag : Entreprise / Productivité

---

## App Privacy (Apple — questionnaire)

À remplir dans App Store Connect → App Privacy.

### Data Collected
**Linked to the user, not used for tracking** :

- **Contact Info**
  - Name → App Functionality
  - Email Address → App Functionality
  - Phone Number → App Functionality
  - Physical Address → App Functionality (iBoîte)
- **Health & Fitness** : non
- **Financial Info** : non (aucune transaction)
- **Location**
  - Precise Location → App Functionality (pré-remplissage adresse
    iBoîte uniquement, en cours d'utilisation, jamais en arrière-plan)
- **Sensitive Info**
  - Government ID → App Functionality (KYC)
- **Contacts** : non
- **User Content**
  - Photos or Videos → App Functionality (pièces d'identité, photos
    de profil)
  - Other User Content → App Functionality (CV, documents archivés,
    courriers)
- **Browsing History** : non
- **Search History** : non
- **Identifiers**
  - User ID → App Functionality, Authentication
- **Purchases** : non
- **Usage Data**
  - Product Interaction → Analytics (anonymisé)
- **Diagnostics**
  - Crash Data → App Functionality
  - Performance Data → App Functionality

### Tracking
**Non** — IDN n'effectue **aucun tracking publicitaire** au sens
ATT. Aucune donnée n'est partagée avec des tiers à des fins
publicitaires.

### Encryption
- En transit : TLS 1.3
- Au repos : chiffrement Convex (base) + chiffrement applicatif
  pour les pièces KYC

### Export Compliance (déjà déclaré)
`ITSAppUsesNonExemptEncryption = false` dans `app.json` →
exempt (HTTPS / passkey standard, pas de crypto propriétaire).

---

## Data Safety (Google Play — questionnaire)

À remplir dans Play Console → App content → Data safety.

### Data collected
Coche les mêmes catégories qu'Apple (Name, Email, Phone, Address,
Precise Location, Government ID, Photos, User content, User ID,
Product interaction, Crash Data, Performance Data).

Pour chaque :
- **Collected** : oui
- **Shared with 3rd parties** : non
- **Optional / Required** : Required (sauf Location → Optional)
- **Purpose** : App functionality, Account management, Analytics,
  Identity verification, Personalization

### Security practices
- **Data is encrypted in transit** : oui
- **Users can request data deletion** : oui (cf. `/legal/delete-account`)
- **Reviewed against Google Play Families Policy** : N/A (4+)
- **Independent security review** : oui (audité annuellement par la
  Cour des Comptes du Gabon + cabinet indépendant — cf.
  `/legal/mentions`)

---

## Screenshots à produire

### iOS (App Store Connect)

| Device family               | Résolution           | Nombre |
| --------------------------- | -------------------- | ------ |
| iPhone 6.7" (15/16 Pro Max) | 1290 × 2796          | 3–10   |
| iPhone 6.5" (Xs Max, 11 PM) | 1242 × 2688          | 3–10   |
| iPhone 5.5" (8+, optionnel) | 1242 × 2208          | 3–10   |

(`supportsTablet: false` → pas d'iPad à fournir.)

### Android (Play Console)

| Type                | Résolution            | Nombre |
| ------------------- | --------------------- | ------ |
| Phone               | 1080 × 1920 ou 1080 × 2400 | 4–8 |
| 7-inch tablet       | 1600 × 2560 (optionnel) | 0–8  |
| 10-inch tablet      | 2048 × 2732 (optionnel) | 0–8  |
| Feature graphic     | 1024 × 500            | 1 (requis) |
| Icon                | 512 × 512 (32 bits PNG sans alpha) | 1 |

### Écrans à capturer (suggestions)

1. **Splash / Login** — IdnMark + flag bars + bouton « Se connecter »
2. **Home dashboard** — tuiles iCarte / iBoîte / iDocument / iCV
3. **iCarte index** — portefeuille de cartes
4. **KYC selfie** — étape de vérification d'identité
5. **iBoîte index** — boîte aux lettres avec courriers
6. **iCV studio** — éditeur de CV avec thèmes
7. **Profile** — paramètres + sécurité
8. **Settings → Privacy** — bouton « Supprimer mon compte »
   (important pour Apple review)

Conventions :
- Mode clair ET sombre (au moins une capture par mode)
- Strings FR uniquement (pas EN)
- Pas de données réelles (créer un compte démo)
- Pas de chrome iOS/Android visible (utiliser `simctl io booted recordVideo`
  pour iOS, ou `adb exec-out screencap` pour Android, puis crop)

---

## Compte de revue (Apple Connect)

Créer un compte démo dédié et le renseigner dans App Store Connect →
App Review Information → Sign-in Info :

- Email : `apple-review@idn.ga` (compte créé manuellement)
- Mot de passe : (générer un mot de passe fort, communiquer dans le
  champ Notes)
- Configurer un passkey de test sur ce compte
- Pré-valider KYC au niveau 2 pour permettre à Apple de tester les
  fonctionnalités gated (iBoîte, etc.)
- Notes de review (champ libre) :
  > Cet utilisateur est créé pour la review Apple. Il dispose d'un
  > compte vérifié de niveau 2 (KYC validé). La langue de l'app est
  > le français. Pour tester la suppression de compte (Guideline
  > 5.1.1(v)), aller dans Profil → Confidentialité → Supprimer mon
  > compte. La suppression est effective après un délai de 30 jours
  > (annulable). Une page web publique de suppression est disponible
  > à https://identite.ga/legal/delete-account.

Côté Google Play : pas de compte review explicite, mais activer
l'option « Demande d'examen d'app détaillé » avec les mêmes infos.

---

## Checklist avant submission

- [ ] Pages légales déployées et accessibles sans login sur
      `identite.ga` (privacy, terms, mentions, accessibilite,
      delete-account, licenses)
- [ ] `.well-known/apple-app-site-association` retourne 200 +
      content-type `application/json` sur identite.ga et connect.identite.ga
- [ ] `.well-known/assetlinks.json` idem
- [ ] DNS pointe `identite.ga` ET `connect.identite.ga` sur le déploiement
      Cloud Run de `apps/web`
- [ ] Convex prod déployé (URL distincte de dev)
- [ ] `bunx convex env set PASSKEY_RP_ID identite.ga` sur prod
- [ ] `bunx convex env set PASSKEY_RP_ORIGINS "..."` avec SHA-256 Play
- [ ] EAS build preview iOS + Android passe
- [ ] `eas submit --profile preview --platform all`
- [ ] Compte démo Apple créé + KYC pré-validé
- [ ] Screenshots produits (3 min par device family)
- [ ] App Privacy form rempli (Apple) + Data Safety form rempli
      (Google)
