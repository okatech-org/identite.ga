# ADR-0007 — URLs en anglais, contenu en français

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

L'application IDN sera **multilingue** à terme : français en langue principale, anglais en langue secondaire dès le MVP (au moins onboarding + connexion), portugais et langues nationales gabonaises (fang, etc.) en phase ultérieure (cf. cahier §8).

Le premier jet du site public utilisait des URL françaises pour coller au cahier (`/a-propos`, `/aide`, `/mentions-legales`, `/etat`, `/administrations`). Ces URL deviendraient **invalides ou ambiguës dans une autre langue** : que faire pour `/a-propos` quand on charge la version anglaise ? Renommer chaque route à la volée ? Servir deux URL différentes pour le même contenu ?

Les maquettes elles-mêmes (`idn-citizen-extras.jsx` ligne 5) utilisent des paths anglais : `https://idn.ga/about`, `/services`, `/admins`, `/help`, `/legal`, `/status`, `/contact`. C'est l'usage standard pour une plateforme multilingue.

## Décision

**Toutes les routes Next.js sont en anglais.** Le contenu affiché reste localisé en français (FR par défaut Phase 1). C'est la convention standard pour les apps multilingues : URL stables et techniques, i18n sur le contenu.

Renommage rétroactif (commit `ccc505c`) :

| Avant (FR) | Après (EN) |
| :--- | :--- |
| `/a-propos` | `/about` |
| `/services` | `/services` (inchangé) |
| `/administrations` | `/admins` |
| `/aide` | `/help` |
| `/mentions-legales` | `/legal` |
| `/etat` | `/status` |
| `/contact` | `/contact` (inchangé) |

Routes de l'onboarding et de l'auth (créées directement en anglais) :

| Route | Rôle |
| :--- | :--- |
| `/sign-up/profile` | Étape 1 — choix du profil |
| `/sign-up` | Étape 2 — email + mot de passe |
| `/sign-up/verify` | Étape 3 — saisie OTP |
| `/sign-up/identity` | Étape 4 — identité pivot |
| `/sign-up/pin` | Étape 5 — création PIN |
| `/sign-in` | Connexion |
| `/forgot-password` + `/reset-password` | Récupération mot de passe |
| `/dashboard` | Portail citoyen connecté |

Les **textes affichés** restent en français, centralisés dans `app/(public)/_content/fr.ts` et `app/(auth)/_content/fr.ts`. Quand on activera l'anglais (cf. §8), on ajoutera `en.ts` à côté et un router i18n (ex : `next-intl`).

## Alternatives envisagées

1. **URLs FR par défaut + URLs EN derrière un préfixe `/en/...`** — solution `next-intl` style. Rejeté : SEO duplique (Google voit deux routes pour le même contenu) et cela impose un middleware de redirection complexe.
2. **URLs traduites dans chaque langue** (`/fr/a-propos` ET `/en/about`) — riche en SEO local mais code de routing très complexe (mapping entre langues), et tout lien interne devient localisé. Trop coûteux pour le bénéfice.
3. **Garder les URL en français** — proche du cahier, mais bloque toute extension multilingue propre. Rejeté.

## Conséquences

**Positives**
- Une URL = un contenu, quelle que soit la langue affichée. Pas de duplication SEO.
- Quand on activera EN, il suffira d'ajouter `app/(public)/_content/en.ts` + un selector côté client/cookie ; aucun renommage de route.
- Cohérence avec les maquettes (qui utilisaient déjà ces paths).
- Convention reconnue par les développeurs de toute provenance.

**Négatives**
- Petit décalage cognitif : on développe en français mais les URL sont en anglais. Mitigé par le fait que c'est la pratique standard.
- Aucun lien externe n'existait encore en prod, donc **pas de redirects 301 nécessaires** côté Next.js. Si un lien officiel (mail gouvernemental, document imprimé) avait pointé vers `/a-propos`, il aurait fallu un redirect — à vérifier avant le déploiement initial.

**Suivi**
- Quand on active EN, ajouter le dictionnaire `_content/en.ts` et un `LanguageProvider` qui lit la préférence depuis `userPreference.language` (déjà modélisée Convex) ou un cookie / l'URL.
- Si un partenaire a partagé une ancienne URL FR (peu probable en pré-MVP), ajouter un `redirects()` dans `next.config.js`.
- Documenter cette convention dans le guide contributeur quand on en aura un.

## Références

- Cahier des charges §8 (Internationalisation)
- `idn-citizen-extras.jsx` — paths utilisés dans les maquettes (`/about`, `/services`, `/admins`, `/help`, `/legal`, `/status`, `/contact`)
- [next-intl](https://next-intl-docs.vercel.app/) — bibliothèque candidate pour l'activation EN
