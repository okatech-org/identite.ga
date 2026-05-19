# Specs design — iCV (Constructeur de CV citoyen)

Document destiné aux designers. Source de référence : `apps/idn.ga/src/pages/cv/*` + `apps/idn.ga/src/components/cv/*` + `apps/idn.ga/src/types/cv.ts` du projet IDN. Tous les libellés cités entre guillemets sont **verbatim** des maquettes existantes — ne pas les paraphraser.

## 1 — Objectif

iCV est un constructeur de CV professionnel pour le citoyen : choix d'un thème parmi 12, édition section par section (infos perso, expériences, formations, compétences, langues, hobbies, liens), assistance IA (5 outils), import depuis fichier, export PDF imprimable. Pensé pour fonctionner aussi bien sur mobile que sur web.

Le citoyen peut posséder **plusieurs CV** (max 10) — typiquement un « CV principal » créé à l'inscription, plus des variantes adaptées par poste générées via l'outil IA « Optimiser pour Poste ». L'UI doit donc inclure un **sélecteur de CV** persistant.

Routes pour identite.ga :

| Route | Rôle |
|---|---|
| `/icv` | Vue principale du CV actif : aperçu + sélecteur de thème + outils IA |
| `/icv/list` | Liste de tous les CV de l'utilisateur (cartes empilées) |
| `/icv/edit` | Édition d'une section / d'une expérience du CV actif |
| `/icv/dashboard` | Tableau de bord du CV actif : score + sections + suggestions |

L'écran `/icv/list` est **nouveau par rapport à IDN** (qui était single-CV) — il est requis pour exposer la fonctionnalité multi-CV.

---

## 2 — Modèle de données affiché

L'UI manipule un objet `CV` (parmi N CV de l'utilisateur), avec ces champs (alignés sur `types/cv.ts` IDN + extensions multi-CV) :

### Champs spécifiques au multi-CV

| Champ | Type | Affiché où |
|---|---|---|
| `id` | string | clé technique (sélecteur, URL) |
| `name` | string | étiquette dans le sélecteur, en-tête de la page |
| `isDefault` | boolean | badge « Principal » sur le CV par défaut |
| `source` | `"onboarding" \| "manual" \| "ai_optimize" \| "import"` | badge contextuel (« CV importé », « Variant IA »…) |
| `derivedFromCvId` | id optionnel | breadcrumb « Variant de : CV principal » |
| `updatedAt` | ISO date | « Modifié le 12 mars 2026 » |

### Champs racine

| Champ | Type | Affiché où |
|---|---|---|
| `firstName` | string | Header preview + section « Mon Profil » |
| `lastName` | string | idem |
| `email` | string | section infos + en bas du panneau gauche |
| `phone` | string | section infos |
| `address` | string | section infos |
| `summary` | string (>= 50 chars) | bloc « Profil » du CV (résumé pro) |
| `portfolioUrl` | string (URL optionnelle) | section infos |
| `linkedinUrl` | string (URL optionnelle) | section infos |
| `hobbies` | string[] optionnel | section dédiée du CV |
| `experiences` | `Experience[]` | bloc « Expériences » |
| `education` | `Education[]` | bloc « Formation » |
| `skills` | `Skill[]` | bloc « Compétences » |
| `languages` | `Language[]` | bloc « Langues » |
| `updatedAt` | ISO date | metadata (dernière modif) |

### Sous-entités

```ts
Experience { id; title; company; location; startDate; endDate?; current; description }
Education  { id; degree; school; location; startDate; endDate?; current; description? }
Skill      { id; name; level: "Beginner" | "Intermediate" | "Advanced" | "Expert" }
Language   { id; name; level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native" }
```

---

## 3 — Sélecteur de CV (composant transverse)

Présent en haut des écrans `/icv` et `/icv/dashboard`. Sur mobile : pleine largeur en tête. Sur desktop : intégré au header.

Anatomie :

- Pill cliquable affichant le nom du CV actif + chevron `ChevronDown`.
- Badge « Principal » à droite du nom si `isDefault`.
- Au clic, ouvre un popover :
  - Liste des CV de l'utilisateur, ordonnés `isDefault` d'abord puis par `updatedAt desc`.
  - Chaque ligne : nom (sm medium), `source` badge (xs), score (`text-xs text-muted-foreground`), checkmark si actif.
  - Bouton primary en bas du popover : **« + Nouveau CV »** → ouvre une modale `Créer un CV` :
    - Champ texte **« Nom du CV »** (ex « CV Tech », « CV Direction »).
    - Option **« Partir d'un CV existant »** (select avec la liste — vide = CV vierge).
    - Bouton **« Créer »** primary.
  - Lien secondaire **« Voir tous mes CV »** → navigue vers `/icv/list`.

États :
- Aucun CV variant (juste le CV principal) : popover montre une seule ligne + bouton « + Nouveau CV ».
- CV actif issu d'un `optimize_job` : badge **« Variant IA »** + sous-texte muted **« Variant de : {nom du CV source} »**.

## 4 — Écran : Liste de tous les CV (`/icv/list`)

Variante simple destinée à une gestion en masse (renommer / supprimer / définir comme principal / dupliquer).

Layout :
- Header : bouton retour, titre **« Mes CV »**, bouton primary **« + Nouveau CV »**.
- Grille de cartes (1 col mobile, 2 col tablet, 3 col desktop) :
  - Mini-aperçu du CV (vignette du thème actif, ratio A4 réduit).
  - Nom + badges (« Principal », « Variant IA », « Importé »).
  - Sous-texte : « Modifié le 12 mars 2026 » + score sous forme de pill.
  - Menu kebab `MoreVertical` avec options :
    - **« Ouvrir »**
    - **« Renommer »**
    - **« Dupliquer »**
    - **« Définir comme principal »** (grisé si déjà principal)
    - **« Télécharger en PDF »**
    - **« Supprimer »** (rouge, désactivé sur le CV principal)
- État vide (uniquement à l'inscription, avant le seed) : illustration + CTA **« Démarrer mon premier CV »**.

Limite : si `cards.length === 10`, le CTA « + Nouveau CV » est désactivé + tooltip **« Limite de 10 CV atteinte »**.

## 5 — Écran : Vue principale (`/icv`)

### 5.1 Layout (desktop / web)

- Hauteur : `100vh - 8rem` (chrome déduit). Pas de scroll global.
- Structure : header (avec sélecteur de CV § 3) + 2 panneaux côte à côte (`flex gap-2`).
  - **Gauche** (`w-64` fixe) : sélecteur de thème + outils IA + résumé profil.
  - **Droite** (`flex-1`) : aperçu A4 du CV au thème actif, centré, scale auto pour rentrer dans le viewport (max scale 0.55).

### 5.2 Header

| Élément | Contenu |
|---|---|
| Titre H1 | **« iCV »** |
| Sélecteur de CV (§ 3) | pill du CV actif + popover de switch + bouton « + Nouveau CV » |
| Sous-titre (>=lg) | **« Créez et personnalisez votre CV professionnel »** |
| Bouton outline | icône `Edit3` + **« Modifier »** — navigue vers `/icv/edit` |
| Bouton outline | icône `Upload` + **« Importer »** — ouvre la modale d'import |
| Bouton primary | icône `Download` + **« PDF »** — déclenche un export PDF serveur (cf. § 5.7) |

### 5.3 Panneau gauche — section « Choisir un thème »

Titre de bloc : icône `Palette` primary + **« Choisir un thème »**.

Trois catégories (titres uppercase `text-muted-foreground tracking-wide`) :

#### Catégorie « Classique & Pro »

| id | Label | Pastille couleur | Description |
|---|---|---|---|
| `modern` | « Modern » | `#3B82F6` | « Clean & contemporain » |
| `classic` | « Classic » | `#6B7280` | « Intemporel » |
| `minimalist` | « Minimal » | `#1F2937` | « Épuré & simple » |
| `professional` | « Pro » | `#0F766E` | « Formel & sérieux » |

#### Catégorie « Créatif & Moderne »

| id | Label | Pastille couleur | Description |
|---|---|---|---|
| `creative` | « Créatif » | `#EC4899` | « Artistique » |
| `startup` | « Startup » | `#F97316` | « Tech & dynamique » |
| `bold` | « Bold » | `#7C3AED` | « Audacieux » |
| `tech` | « Tech » | `#06B6D4` | « IT & Digital » |

#### Catégorie « Spécialisé »

| id | Label | Pastille couleur | Description |
|---|---|---|---|
| `academic` | « Academic » | `#0369A1` | « Universitaire » |
| `executive` | « Executive » | `#1E3A5F` | « Direction » |
| `elegant` | « Elegant » | `#9D4EDD` | « Raffiné » |
| `compact` | « Compact » | `#059669` | « Dense & efficace » |

Chaque thème = ligne cliquable (`flex gap-3 px-3 py-2 rounded-lg`) avec :
- pastille couleur 4×4 ronde (shadow),
- label (sm medium),
- description (xs muted, truncate).

État sélectionné : `bg-primary/10 ring-1 ring-primary/30`, label en primary.

### 5.4 Panneau gauche — section « Options IA »

Titre de bloc : icône `Sparkles` primary + **« Options IA »**. Fond léger `bg-gradient-to-b from-primary/5 to-transparent`.

Liste verticale de 5 outils. Chaque entrée :
- pastille icône colorée 1.5 (carrée arrondie),
- label sm medium + description xs muted truncate.

Quand un outil tourne, l'icône devient `Loader2` qui spinne ; tous les autres outils sont désactivés (`opacity-50`).

| id | Icône | Label | Description | Couleur |
|---|---|---|---|---|
| `improve-summary` | `Wand2` | « Améliorer le Profil » | « Reformulez votre résumé » | violet (`text-purple-500` / `bg-purple-500/10`) |
| `suggest-skills` | `Brain` | « Suggérer Compétences » | « Basé sur vos expériences » | bleu (`text-blue-500` / `bg-blue-500/10`) |
| `optimize-job` | `Target` | « Optimiser pour Poste » | « Adaptez à une offre » | orange (`text-orange-500` / `bg-orange-500/10`) |
| `generate-letter` | `FileText` | « Lettre de Motivation » | « Générez automatiquement » | vert (`text-green-500` / `bg-green-500/10`) |
| `ats-check` | `Zap` | « Score ATS » | « Compatibilité recruteurs » | ambre (`text-amber-500` / `bg-amber-500/10`) |

Toasts attendus après exécution (titres et descriptions **verbatim**) :

| Feature | Titre toast | Description toast |
|---|---|---|
| `improve-summary` | « ✨ Profil amélioré » | « Votre résumé a été reformulé avec des mots-clés percutants. » |
| `suggest-skills` | « 🧠 Compétences suggérées » | « 5 nouvelles compétences ajoutées basées sur vos expériences. » |
| `optimize-job` | « 🎯 CV optimisé » | « Entrez une URL d'offre d'emploi pour adapter votre CV. » |
| `generate-letter` | « 📄 Lettre générée » | « Votre lettre de motivation est prête à télécharger. » |
| `ats-check` | « ⚡ Score ATS: 87% » | « Votre CV est bien optimisé pour les systèmes de recrutement. » |

### 5.5 Panneau gauche — section « Mon Profil »

Mini-titre uppercase muted : **« Mon Profil »**.

- Nom complet (sm medium foreground).
- Email (xs muted truncate).
- 2 pills :
  - `bg-primary/10 text-primary` — **« N exp. »** (nb expériences).
  - `bg-blue-500/10 text-blue-500` — **« N comp. »** (nb compétences).

### 5.6 Panneau droit — Aperçu CV

- Fond gris légèrement transparent (`bg-slate-200/50`).
- Conteneur centré, contenu `width: 210mm; min-height: 297mm` (A4), ombré blanc.
- Le composant `<CVPreview data={cv} theme={activeTheme} />` rend le CV au thème actif.
- Transformation `scale(N)` calculée pour rentrer dans le viewport (max 0.55).
- Bouton « PDF » du header utilise `react-to-print` sur cette zone.

### 5.7 Export PDF — workflow serveur

Le bouton « PDF » de l'header **ne déclenche pas** la boîte de dialogue d'impression native du navigateur. Le PDF est rendu côté serveur (cohérence visuelle + déchargement compute pour mobile bas de gamme).

Workflow attendu :

1. Clic sur **« PDF »** → bouton bascule en état loader (icône `Loader2` + texte **« Préparation... »**, 1–3 secondes).
2. Backend rend le PDF avec le thème actif + upload Convex Storage.
3. URL signée retournée → le client déclenche un téléchargement automatique (fichier nommé `CV_{firstName}_{lastName}_{theme}.pdf`).
4. Toast succès : titre **« 📄 PDF prêt »**, description **« Le téléchargement va démarrer. »**.

Cache : si le CV n'a pas changé depuis le dernier export (`completionScore` + `updatedAt` identiques), l'URL est réutilisée — l'attente passe à <500ms. Pas d'indication UI particulière, le bouton se comporte de la même façon.

Erreurs :
- `RATE_LIMIT` (>30 exports/jour) → toast destructive **« Limite d'exports atteinte. Réessayez demain. »**.
- `RENDER_FAILED` → toast destructive **« Échec de la génération. Réessayez ou contactez le support. »**.

### 5.8 Modale d'import (déclenchée par « Importer »)

Compose : titre **« Importer un CV »**, dropzone PDF/DOCX. Deux options à choix (radio) :

- **« Créer un nouveau CV »** (sélection par défaut) — le CV importé sera ajouté à la liste, badge `source = "import"`.
- **« Fusionner avec le CV actif »** — patche le CV courant avec les champs reconnus (confirmation requise avant d'écraser des données existantes).

Toast succès **verbatim** : titre **« 📥 Import réussi »**, description **« Les données ont été importées. »**.

### 5.9 État chargement

Spinner `Loader2` centré dans tout le viewport (avant que le CV soit récupéré).

---

## 6 — Écran : Édition (`/icv/edit`)

Variante mobile-first centrée (`max-w-3xl mx-auto`). Pensée comme un parcours d'ajout d'une section unique (le bouton retour conserve le focus). Les autres sections (formations, compétences, langues…) suivent le même pattern.

### 6.1 Header

- Bouton rond `ArrowLeft` à gauche (style neumorphique `neu-raised`).
- Titre H1 : **« Ajouter une expérience »** (à adapter selon la section éditée — « Ajouter une formation », « Ajouter une compétence », etc.).
- Spacer 10×10 à droite (pour centrer le titre).

### 6.2 Formulaire « Expérience » (référence)

Carte `neu-raised p-6 md:p-8 rounded-3xl space-y-6`.

| Label | Type | Placeholder |
|---|---|---|
| « Intitulé du poste » | input h-12 | « ex: Chef de Projet Digital » |
| « Entreprise » | input h-12 | « ex: Agence Web Gabon » |
| « Date de début » | input `type=date` h-12 | — |
| « Date de fin » | input `type=date` h-12 | — |
| « Description » | textarea min-h-[150px] | « Décrivez vos missions et réalisations... » |

Tous les inputs : style `neu-inset border-none bg-transparent`.

### 6.3 Bouton IA inline « Améliorer avec l'IA »

À droite du label « Description » :
- Bouton ghost xs `text-primary hover:bg-primary/10 rounded-full font-bold`.
- État normal : icône `Wand2` + **« Améliorer avec l'IA »**.
- État loading : icône `Sparkles` qui spinne + **« Génération... »**.
- Disable pendant que la requête tourne.

À la fin de la génération (`setTimeout 2000ms` dans la maquette), une carte verte apparaît sous le textarea avec :

- Header : icône `Sparkles` vert + texte **« Suggestion de l'IA : »**.
- Citation : texte italique en vert.
- 2 boutons :
  - **« Accepter »** (vert primary) — pousse le texte dans le textarea + ferme la carte.
  - **« Ignorer »** (ghost vert) — ferme sans accepter.

Exemple complet **verbatim** (à utiliser tel quel pour la maquette designer) :

> « En tant que Chef de Projet Digital, j'ai piloté la refonte complète de 3 plateformes e-commerce, augmentant le taux de conversion de 25%. J'ai coordonné une équipe agile de 8 développeurs et designers, assurant la livraison des sprints dans les délais. »

### 6.4 Footer

Bouton primary pleine largeur h-12 : icône `Save` + **« Enregistrer les modifications »**.

### 6.5 Autres formulaires (mêmes patterns)

#### Formation

| Label | Placeholder |
|---|---|
| « Diplôme » | « ex: Master 2 Informatique » |
| « École » | « ex: Université Omar Bongo » |
| « Lieu » | « ex: Libreville » |
| « Date de début / fin » | (date) |
| « Description » optionnelle | « Décrivez votre cursus... » |

#### Compétence

- Champ texte **« Compétence »** + sélecteur de niveau (radio ou select) avec les options exactes :
  - **« Beginner »** / **« Intermediate »** / **« Advanced »** / **« Expert »**

#### Langue

- Champ texte **« Langue »** + select niveau CECRL :
  - **« A1 »** / **« A2 »** / **« B1 »** / **« B2 »** / **« C1 »** / **« C2 »** / **« Native »**

#### Hobbies

- Input + bouton « Ajouter » (chips supprimables).

#### Liens

- Input URL **« Portfolio »** (placeholder `https://...`).
- Input URL **« LinkedIn »** (placeholder `https://www.linkedin.com/in/...`).

---

## 7 — Écran : Tableau de bord (`/icv/dashboard`)

Vue alternative compacte (utile mobile). Layout `flex flex-col gap-4`, hauteur pleine.

### 7.1 Header

- Titre H1 **« iCV »** + sélecteur de CV (§ 3).
- 2 boutons icônes à droite : `Share2` (partager — comportement à designer pour Phase 2) + `Download` (export PDF serveur, même workflow qu'en § 5.7).

### 7.2 Score de complétion (colonne gauche)

- Anneau `SmartScoreRing` (composant dédié, score 0-100). Valeur d'exemple à reproduire : **78**.
- Sous l'anneau :
  - Niveau (h3 bold) — **« Niveau Expert »** (ou « Bon », « Débutant » selon le score — à confirmer avec le designer).
  - Sous-texte muted **« Profil attractif »**.

### 7.3 Suggestions (sous l'anneau)

Mini-titre uppercase muted **« Suggestions »**. Chaque suggestion = carte cliquable (`bg-slate-100/80`) avec :
- Titre (sm medium foreground).
- Impact en haut à droite (sm bold vert) — ex **« +15% »**, **« +10% »**.
- Description (xs muted) sous le titre.

Exemples (verbatim) :

| Titre | Description | Impact |
|---|---|---|
| « Ajoutez vos diplômes » | « 2x plus d'offres » | « +15% » |
| « Validez vos compétences » | « Certifier anglais » | « +10% » |

### 7.4 Sections du CV (colonne droite, span 2)

Mini-titre uppercase muted **« Sections du CV »**. Grille 2 colonnes de 4 cartes :

| Icône | Titre | Compteur (exemple) | Couleur |
|---|---|---|---|
| `Briefcase` | « Expériences » | « 2 postes » | orange (`text-orange-500` / `bg-orange-500/10`) |
| `GraduationCap` | « Formation » | « 3 diplômes » | bleu (`text-blue-500` / `bg-blue-500/10`) |
| `Award` | « Compétences » | « 8 skills » | violet (`text-purple-500` / `bg-purple-500/10`) |
| `FileText` | « Infos » | « 100% » | vert (`text-green-500` / `bg-green-500/10`) |

Chaque carte : `p-4 rounded-xl bg-white/95 border` + icône colorée à gauche + titre + compteur + `ChevronRight` à droite. Hover : `scale-1.02 + border-primary/30`.

Tous les clics → `/icv/edit` (variante section).

### 7.5 Footer

Bouton primary pleine largeur : **« Modifier mon CV »**.

---

## 8 — Variante mobile

Sur mobile, les écrans sont les mêmes mais empilés :

### 8.1 `/icv` (mobile)

- Header : sélecteur de CV pleine largeur + titre **« iCV »** + 3 boutons icônes (Edit / Import / PDF).
- **Sélecteur de thème** : section dédiée pleine largeur (catégories sous forme de sous-onglets scrollables, chips de thèmes avec pastille + label).
- **Outils IA** : section dédiée sous le sélecteur (carte par outil, plein écran scrollable).
- **Profil** : footer compact (nom + email + 2 pills compteurs).
- **Aperçu** : full-screen modal accessible via un bouton « Voir l'aperçu » (lecture du PDF) — sur petit écran l'aperçu A4 n'est pas pertinent à scaler.

### 8.2 `/icv/list` (mobile)

- Header sticky : retour + **« Mes CV »** + bouton primary `+`.
- Cartes empilées plein largeur (1 col).
- Pas de menu kebab — actions accessibles via tap long ou via icônes inline (renommer / dupliquer / supprimer).

### 8.3 `/icv/edit` (mobile)

Identique au design web (max-w-3xl déjà mobile-friendly). Inputs grand format, bouton IA inline conservé.

### 8.4 `/icv/dashboard` (mobile)

- Sélecteur de CV en tête.
- Anneau au sommet (centré).
- Suggestions sous l'anneau.
- Grille 2 colonnes des sections.
- CTA « Modifier mon CV » sticky bas.

---

## 9 — Catalogue complet des 12 thèmes (composants existants)

Le designer doit fournir une maquette par thème. Les noms et tonalités sont déjà figés :

| id | Label affiché | Tonalité dominante | Style |
|---|---|---|---|
| `modern` | Modern | bleu indigo | Clean & contemporain |
| `classic` | Classic | gris neutre | Intemporel |
| `minimalist` | Minimal | noir profond | Épuré & simple |
| `professional` | Pro | teal | Formel & sérieux |
| `creative` | Créatif | rose | Artistique |
| `startup` | Startup | orange | Tech & dynamique |
| `bold` | Bold | violet | Audacieux |
| `tech` | Tech | cyan | IT & Digital |
| `academic` | Academic | bleu marine | Universitaire |
| `executive` | Executive | bleu nuit | Direction |
| `elegant` | Elegant | violet pastel | Raffiné |
| `compact` | Compact | vert émeraude | Dense & efficace |

Pour chaque thème, prévoir les variantes :
- aperçu A4 desktop,
- vignette miniature pour le sélecteur (juste la tonalité + une iconographie discrète),
- impression PDF (mêmes proportions A4, pas d'effets bloquants pour le PDF).

---

## 10 — États récapitulatifs à designer

| État | Description |
|---|---|
| Chargement | Spinner centré (`Loader2` 8×8 primary). |
| Vue principale renseignée | Aperçu + panneau gauche complet + sélecteur de CV au CV principal. |
| Thème en cours de bascule | Ring primary sur le thème actif, animation discrète sur l'aperçu. |
| Outil IA en cours | Icône `Loader2` qui spinne, tous les autres outils désactivés. |
| Toast IA | Sonner toast en bas (titre + description verbatim §5.4). |
| Bouton PDF en cours | Loader inline 1–3s, toast succès **« 📄 PDF prêt »** au retour. |
| Modale import ouverte | Backdrop + dropzone PDF/DOCX + radio « Nouveau CV » / « Fusionner ». |
| Sélecteur de CV ouvert | Popover liste + « + Nouveau CV ». |
| Modale « Créer un CV » | Champ nom + sélecteur « Partir d'un CV existant ». |
| Édition d'une expérience | Formulaire `/icv/edit` propre (sans suggestion IA). |
| Suggestion IA acceptée | Textarea pré-rempli, carte verte fermée. |
| `optimize_job` en cours | Loader + toast info **« Création d'un CV optimisé... »** ; à la fin, navigation auto vers le nouveau CV. |
| Dashboard score 78 | Anneau partiel, niveau « Expert », 2 suggestions. |
| Dashboard score < 50 | Niveau « À compléter » + plus de suggestions (à designer). |
| CV vide (premier login) | Variante onboarding : CTA « Démarrer mon CV », import depuis LinkedIn/PDF mis en avant. |
| Liste vide (`/icv/list`) | Empty state avec CTA « Démarrer mon premier CV ». |
| Limite 10 CV atteinte | CTA « + Nouveau CV » désactivé + tooltip **« Limite de 10 CV atteinte »**. |

---

## 11 — Conventions partagées avec les autres modules

- Iconographie : `lucide-react`. Stroke 1.6–1.7 monochrome.
- Animations : `framer-motion` (fade-y / scale courts).
- Toasts : `sonner`, messages courts FR.
- Format date : `dd MMMM yyyy` ou ISO selon le champ (`date-fns/locale/fr`).
- Couleurs sémantiques alignées sur `SPECS_FEATURES_CITIZEN.md` (primary IDN vert, ambre = attente, vert = OK, etc.).
- Empty states avec icône grande (30–50 % d'opacité) + 1 ligne `text-sm` + 1 ligne `text-xs text-muted-foreground`.

---

## 12 — Hors scope (Phase 1)

- **Lettre de motivation : éditeur PDF dédié** (l'outil IA `generate-letter` produit le texte Phase 1, l'export PDF dédié vient Phase 2).
- **CV multilingue** (FR uniquement Phase 1).
- **Partage public** (URL publique du CV) — Phase 2.
- **Versionning** (historique des modifs sur un même CV) — non couvert Phase 1. Le multi-CV ne remplace pas ce besoin (un user peut créer un nouveau CV pour expérimenter, mais il n'y a pas de diff/revert).
- **Analytics du CV** (« vu par X recruteurs ») — Phase 2, alimentera la catégorie de notif `cv` déjà préparée backend.
