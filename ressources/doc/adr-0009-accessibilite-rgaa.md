# ADR-0009 — Accessibilité conforme RGAA 4.1.2 / WCAG 2.1 AA

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

IDN est un service public régalien — l'accessibilité n'est pas un nice-to-have mais une **obligation légale** pour l'État gabonais (cf. cahier §7.3, §10.2). Le cahier prescrit explicitement :

- Conformité **WCAG 2.1 AA** et **RGAA 4.1.2** (référentiel français appliqué par homologie pour le Gabon).
- Contraste ≥ 4.5:1 pour le texte, ≥ 3:1 pour les éléments graphiques.
- Navigation clavier complète sur tous les écrans.
- Focus visible sur tous les éléments interactifs.
- ARIA labels sur les icônes interactives, `aria-live` pour les toasts et statuts.
- Lecteurs d'écran (VoiceOver, NVDA) testés sur les flows critiques (signup, login, OTP, KYC).
- Tailles cliquables ≥ 44×44 px sur mobile.
- Aucune information transmise uniquement par la couleur.

L'inclusion territoriale (cahier §1.4) implique aussi : zones rurales avec connexion 2G / 3G dégradée, déficience visuelle prévalente, alphabétisation hétérogène.

## Décision

**Adopter le RGAA 4.1.2 comme référentiel de conformité de référence**, équivalent à WCAG 2.1 AA. Tous les écrans doivent passer la **checklist du skill `accessibility-rgaa`** disponible dans l'environnement de développement Claude Code.

### Règles transverses adoptées

#### Structure & sémantique (RGAA §8, §9)

1. **HTML sémantique d'abord** : `<button>` pour les actions, `<a href>` pour les navigations. Jamais `<div onClick>`.
2. **Landmarks** : `<header>`, `<nav aria-label="…">`, `<main id="main">`, `<footer>` sur chaque page. Plusieurs `<nav>` ou `<aside>` sur la même page → `aria-label` distinct.
3. **Hiérarchie de titres** : un seul `<h1>` par route, jamais de saut `<h2>` → `<h4>`.
4. **`<html lang="fr">`** à la racine. `<title>` non vide et unique par route (template Next : `« Page · Identité Numérique du Gabon »`).
5. **Skip link** « Aller au contenu principal » en première position du tab order, visible au focus, qui pointe vers `#main`.

#### Couleurs & contraste (RGAA §3, §10)

1. **L'information ne passe jamais par la couleur seule.** Statut = couleur + icône + libellé. LoA badge = couleur + icône bouclier + texte « Niveau N — qualificatif ». Champ en erreur = bordure rouge + icône + message texte + `aria-invalid` + `aria-describedby`.
2. **Contraste texte / fond ≥ 4.5:1** (texte normal) ou **≥ 3:1** (texte ≥ 18.66 px bold ou ≥ 24 px). Vérifié pour chaque combinaison de tokens IDN dans les deux modes (clair / sombre).
3. **Contraste éléments graphiques ≥ 3:1** : bordures de champs, icônes informatives, focus ring, segments du strength meter, indicateurs LoA.
4. **Mode sombre audité indépendamment** — pas d'inversion mécanique. Les couleurs Gabon (vert / jaune / bleu) restent inchangées entre les modes, seuls les neutres s'inversent (cf. `idn-tokens.jsx`).

#### Clavier & focus (RGAA §10, §12)

1. **Tout interactif est utilisable au clavier seul** : Tab, Enter / Space, Esc, flèches.
2. **Focus visible** sur tous les éléments interactifs : anneau IDN vert (`--idn-green`) ≥ 3:1 sur fond clair, équivalent en mode sombre. Jamais `outline:none` sans remplacement.
3. **Ordre de tab logique** : du haut vers le bas, de gauche à droite, en suivant la hiérarchie visuelle. Pas de `tabindex` positif.
4. **Pas de piège de focus** sauf dans les modales et menus déroulants ouverts (focus trap requis dans ces cas).

#### Formulaires (RGAA §11)

1. **Chaque champ a un `<label for>`** lié programmatiquement. Le `placeholder` n'est PAS un label — il sert d'exemple, pas d'instruction.
2. **Erreurs annoncées** : `aria-invalid="true"` + `aria-describedby` pointant vers le message + le message a un identifiant stable et un `role="alert"` (ou `aria-live="polite"`) à l'instant où il apparaît + focus déplacé sur le premier champ en erreur à la soumission.
3. **`autocomplete`** correct : `email`, `current-password`, `new-password`, `one-time-code`, `given-name`, `family-name`, `bday`, `address-level2`, etc.
4. **Pas de changement de contexte automatique** au `onChange` (pas de submit auto sur sélection, pas de redirect).
5. **Indication des champs requis** : explicite dans le label (ou bandeau de tête « les champs sont tous obligatoires »). Pas seulement par couleur.

#### Composants interactifs custom (RGAA §7, §13)

1. **Modales** (`role="dialog"` + `aria-modal="true"` + label + focus trap + `Escape` ferme + retour focus à l'élément déclencheur). Préférer `<dialog>` natif quand possible.
2. **Toasts (Sonner)** : `aria-live="polite"` (assertif uniquement pour les erreurs critiques).
3. **OTP input** : 6 cases, `inputMode="numeric"`, `autoComplete="one-time-code"`, paste 6 chiffres distribué automatiquement, navigation flèches / backspace, focus auto sur la case suivante.
4. **Tooltips et popovers** : déclenchables au clavier, fermables par `Escape`, le contenu doit rester lisible quand survol/focus.
5. **`aria-hidden="true"` jamais sur un élément focusable** ni sur du contenu utile.

#### Mobile (cf. cahier §7.3)

1. **Tailles cliquables ≥ 44×44 px** sur les éléments tactiles. Boutons IDN size `lg` = 48 px de hauteur, `default` = 40 px (fallback acceptable hors UX critique).
2. **Zoom 200% et reflow 320 px** sans perte de fonctionnalité. Viewport `width=device-width, initial-scale=1` (pas de `user-scalable=no`).
3. **Pas de geste complexe obligatoire** (pinch-to-zoom OK comme alternative, pas comme seule voie d'accès).

#### Lien & navigation (RGAA §6, §12)

1. **Intitulé de lien explicite** ou `aria-label` qui décrit la destination. Bannir « cliquez ici », « en savoir plus » seuls.
2. **Liens-icônes** : `aria-label` obligatoire (ex : `<button aria-label="Notifications">`).
3. **Lien externe / nouvelle fenêtre** : signalé visuellement et au lecteur d'écran. Préférer `rel="noopener noreferrer"` + `target="_blank"` + texte « (s'ouvre dans un nouvel onglet) » dans `aria-label`.

### Outils & process

- **axe DevTools** (extension navigateur) : audit avant chaque PR sur les écrans modifiés.
- **Lighthouse** : score a11y ≥ 95 sur chaque page (cible ; 100 idéal).
- **WCAG Contrast Checker** ou **Stark** : audit des combinaisons de tokens.
- **VoiceOver** (macOS) : test des flows critiques (signup, login, OTP) avant chaque release.
- **Tests clavier** : naviguer chaque page entièrement au clavier seul de A à Z une fois par release.
- **HeadingsMap** : audit de la hiérarchie de titres.
- **Validator W3C** (HTML) : critère 8.2.

## Alternatives envisagées

1. **Accessibilité « best effort » sans référentiel formel** — rejeté : pas conforme à l'obligation légale du service public.
2. **Suivre uniquement WCAG 2.1 AA sans le RGAA** — possible mais le RGAA est la version applicable côté France et opérée par homologie au Gabon. Adopter RGAA 4.1.2 = on couvre WCAG 2.1 AA + spécificités francophones (libellés en français pour les attributs `lang`, formatage ISO, etc.).
3. **Cibler WCAG 2.2 AAA** — surcoût important, et certains critères AAA (texte limité à 80 caractères / ligne, contraste 7:1) entreraient en conflit avec la maquette validée. À reconsidérer si un objectif réglementaire l'impose plus tard.

## Conséquences

**Positives**

- Plateforme utilisable par les citoyens en situation de handicap (visuel, moteur, cognitif), qui sont **aussi des usagers prioritaires** d'un service public d'identité.
- Conformité légale anticipée — pas de réécriture après audit externe.
- Bon SEO : les bonnes pratiques RGAA recoupent largement celles que Google valorise (sémantique, structure, alt texts).
- Code plus maintenable : `<button>` natif vs `<div onClick>`, `<label>` vs placeholder, etc.

**Négatives**

- Discipline supplémentaire à chaque PR : tester clavier + axe DevTools.
- Quelques composants interactifs (OTP input, password strength meter, wizard stepper) demandent un effort ARIA / focus dédié.
- Tests utilisateurs avec lecteur d'écran (NVDA / VoiceOver) requis avant release : à prévoir dans la planification.

**Suivi**

- Ajouter une étape **a11y check** au CI (axe-core run automatisé sur les routes principales).
- Auditer manuellement chaque écran nouveau ou modifié contre la checklist du skill.
- Inviter une association de personnes en situation de handicap (UNAPH ou équivalent local) à un test utilisateur avant la mise en production.
- Publier une **déclaration d'accessibilité** (obligatoire pour les services publics) sur `/legal` au moment de la mise en production.
- Mettre en place un **canal de signalement a11y** (`accessibilite@identite.ga` ou via le formulaire `/contact` catégorie « Sécurité » dérivée).

### Audit initial

Cet ADR a été publié avec un audit complet des pages déjà livrées (commits `433f475` à `ccc505c`) :

- Pages publiques (8 routes) : `/`, `/about`, `/services`, `/admins`, `/help`, `/legal`, `/status`, `/contact`.
- Tunnel d'auth (8 routes) : `/sign-up/profile`, `/sign-up`, `/sign-up/verify`, `/sign-up/identity`, `/sign-up/pin`, `/sign-in`, `/forgot-password`, `/reset-password`.
- Portail (1 route) : `/dashboard`.

Les corrections apportées sont consignées dans le commit qui suit cet ADR (« chore(a11y) : alignement RGAA des écrans existants »).

## Références

- [RGAA 4.1.2 — méthode officielle](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- Cahier des charges §7.3 (Accessibilité), §7.4 (Ton institutionnel), §10.2 (Critères MVP non-fonctionnels)
- Skill `accessibility-rgaa` (`~/.claude/skills/accessibility-rgaa/`)
- ADR-0008 (design tokens sans shadows)
