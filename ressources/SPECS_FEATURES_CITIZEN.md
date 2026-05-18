# Specs design — Fonctionnalités citoyen à reprendre depuis IDN

Document destiné aux designers. Source : `apps/idn.ga` du projet IDN. Tous les libellés cités entre guillemets sont **verbatim** des maquettes existantes — ne pas les paraphraser.

Modules couverts :

1. [iCarte — Portefeuille numérique](#1--icarte--portefeuille-numérique)
2. [iBoîte — Boîte aux lettres souveraine](#2--iboîte--boîte-aux-lettres-souveraine)
3. [iDocument — Coffre-fort de documents](#3--idocument--coffre-fort-de-documents)
4. [Centre de notifications](#4--centre-de-notifications)

Conventions communes :

- Toutes les pages sont rendues dans un layout authentifié `UserSpaceLayout` (header / nav latérale appli) ; les specs ci-dessous décrivent uniquement la zone de contenu.
- Animations : `framer-motion` (fade/slide/scale courts, ~150–300ms).
- Toasts : `sonner`. Format : message court FR.
- Iconographie : `lucide-react`.
- Format date : `dd MMMM yyyy` en français (`date-fns/locale/fr`), distances "Il y a 2 min", "Hier".

---

## 1 — iCarte — Portefeuille numérique

> Route IDN : `/icarte` · Source : `apps/idn.ga/src/pages/icarte/ICartePage.tsx`, `apps/idn.ga/src/components/dashboard/DigitalWallet.tsx`

### 1.1 Objectif

Gérer l'ensemble des cartes numériques du citoyen (CNI, permis, transport, CNAMGS, bancaire, visite, électeur, fidélité, consulaire, **cartes personnalisées**). Permettre d'en mettre en avant jusqu'à **6 dans le profil** (visibles sur le dashboard), et de gérer la liste complète depuis cette page.

### 1.2 Layout général

- **Hauteur** : `100vh - 8rem` (header global déduit), pas de scroll global.
- **Structure** : 1 header + 1 grid 2 colonnes égales (mobile = 1 colonne empilée).
  - **Colonne gauche** — « Cartes dans le Profil » (les featured, max 6, réordonnables).
  - **Colonne droite** — « Autres Cartes » + bloc « Ajouter une carte » en bas.

### 1.3 Header (zone supérieure)

| Élément | Contenu / libellé |
|---|---|
| Titre H1 | **« iCarte »** |
| Sous-titre | **« Gérez toutes vos cartes numériques »** |
| Compteur featured | Pill `bg-primary/10 text-primary` — **« N/6 dans le profil »** (N = nb cartes en favori) |
| Bouton | Icône `Wallet` + **« Voir le profil »** + chevron — navigue vers `/dashboard` |

### 1.4 Colonne gauche — Cartes dans le Profil

- Header de bloc : icône `Eye` (primary) + **« Cartes dans le Profil »** à gauche · indication discrète **« Glissez pour réordonner »** à droite.
- Grille **2 colonnes** de mini-cartes au ratio `85/55` (format carte de crédit), réordonnables par drag (framer-motion `Reorder.Group`/`Reorder.Item`, axe Y, curseur `grab` → `grabbing`).
- Chaque mini-carte affiche :
  - Icône de type (ou sceau du Gabon pour la CNI) — image disponible : `sceau_gabon.png`.
  - Nom de la carte (texte 10px gras blanc).
  - Sous-titre (8px blanc 70 %).
  - Fond dégradé `bg-gradient-to-br ${gradient}` selon le type.
  - Poignée `GripVertical` en haut à droite (semi-transparente).
  - Bouton flottant haut-droite **rond** (icône `EyeOff` blanc sur fond noir 20 %) — retire la carte du profil (tooltip **« Retirer du profil »**).
- **Cas spécifique carte CNAMGS / santé** : fond blanc (pas de gradient), libellés en vert `#009640`, lien en bas-droite **« Ouvrir → »** ; clic = navigation vers `/health/cnamgs`.
- **État vide** (aucune carte featured) :
  - Icône `Wallet` (40px, opacity 50 %).
  - Texte 1 : **« Aucune carte dans le profil »**.
  - Texte 2 (small) : **« Ajoutez des cartes depuis la liste à droite »**.

### 1.5 Colonne droite — Autres Cartes + Ajouter

#### 1.5.1 Liste (haut)

- Header de bloc : icône `EyeOff` muted + **« Autres Cartes »** · à droite compteur **« N cartes »**.
- Chaque ligne (`CardRow`) :
  - Vignette dégradée 14×9 (rounded-lg) avec icône blanche ou sceau Gabon pour la CNI.
  - Nom (sm semibold) + sous-titre (xs muted) tronqués.
  - Pour la CNAMGS : pill primary **« Voir »** + chevron à droite, clic = `/health/cnamgs`.
  - Trio de boutons icônes à droite :
    - `Edit3` (tooltip **« Modifier »**) — ouvre modal d'édition.
    - `Eye` / `EyeOff` (tooltip **« Ajouter au profil »** ou **« Retirer du profil »**) — désactivé si 6 atteints et carte non featured.
    - `Trash2` rouge (tooltip **« Supprimer »**) — suppression directe (pas de confirm).
  - La ligne CNAMGS n'expose pas Modifier ni Supprimer (carte officielle non éditable).
- **État vide** (toutes au profil) :
  - Icône `CreditCard` (40px, 50 %).
  - Texte 1 : **« Toutes vos cartes sont dans le profil »**.
  - Texte 2 (small) : **« Ajoutez de nouvelles cartes ci-dessous »**.

#### 1.5.2 Bloc « Ajouter une carte » (bas, fixe)

- Mini-titre uppercase muted : **« Ajouter une carte »**.
- Grille 4 colonnes contenant 6 templates + 1 carte spéciale prenant 2 colonnes.
- Chaque template-tile : mini-vignette dégradée 8×5 + icône 3×3 + label 10px muted.
- Tile **« Personnalisée »** (span 2 colonnes) : fond `primary/10`, icône `Palette` primary, label primary medium — ouvre le modal de carte custom.

### 1.6 Catalogue des cartes par défaut (`defaultCards`)

| id | Type | Nom | Sous-titre | Gradient (Tailwind) | Icône | Données recto (data) | Données verso (backData) | Actions |
|---|---|---|---|---|---|---|---|---|
| `cni` | CNI | « Carte d'Identité » | « République Gabonaise » | `from-green-600 via-green-700 to-emerald-800` | sceau Gabon (image) | nom : « DUPONT Jean » · numero : « GA-1234-5678-9012 » · validite : « 12/2030 » | naissance : « 15/03/1990 » · lieu : « Libreville » · sexe : « M » · taille : « 1.75m » | « QR Code », « Télécharger » |
| `driving` | Permis | « Permis de Conduire » | « Catégories B, C » | `from-orange-500 via-orange-600 to-red-600` | `Car` | nom · numero : « PER-GA-2022-5678 » · categories : « B, C » | delivrance : « 01/03/2022 » · prefecture : « Libreville » · points : « 12/12 » | « QR Code », « Imprimer » |
| `transport` | Transport | « Carte Transport » | « STLG Libreville » | `from-blue-500 via-blue-600 to-indigo-700` | `Bus` | zone : « Toutes zones » · numero : « TRS-2024-001234 » · validite : « 01/2025 » | type : « Abonnement Mensuel » · solde : « 12 500 XAF » | « Recharger », « QR Code » |
| `health` | Santé | « CNAMGS » | « Assurance Maladie » | `from-rose-500 via-rose-600 to-pink-600` | `Heart` | regime : « Salarié » · numero : « CNAM-789012 » · validite : « 12/2025 » | employeur : « TechGabon SARL » · couverture : « 100 % » | « Voir Carte », « Attestation » (→ `/health/cnamgs`) |
| `bank` | Bancaire | « BGFI Bank » | « Carte Visa Premium » | `from-slate-800 via-slate-900 to-black` | `CreditCard` | numero : « **** **** **** 4521 » · titulaire : « DUPONT JEAN » · expiration : « 09/27 » | cvv : « *** » · plafond : « 500 000 XAF/jour » | « Payer », « QR Code » |
| `business` | Visite | « Carte de Visite » | « TechGabon SARL » | `from-purple-600 via-purple-700 to-violet-800` | `Briefcase` | titre : « Directeur Technique » · entreprise : « TechGabon SARL » | email : « j.dupont@techgabon.ga » · tel : « +241 77 12 34 56 » · site : « techgabon.ga » | « Partager », « QR Code » |
| `consular` | Consulaire | « Carte Consulaire » | « République Gabonaise » | `from-amber-500 via-amber-600 to-yellow-700` | `Globe` | numero : « GAB-2024-123456 » · nip : « 1234 » · validite : « 01/2029 » | consulat : « Paris, France » · zone : « Île-de-France » | « Voir Carte », « Télécharger » (→ `/consular`) |

Templates additionnels disponibles à l'ajout (non actifs par défaut dans `defaultCards`) :

| Type | Nom | Short label | Gradient | Icône |
|---|---|---|---|---|
| `voter` | « Carte d'Électeur » | « Électeur » | `from-amber-500 via-amber-600 to-yellow-600` | `Vote` |
| `loyalty` | « Carte de Fidélité » | « Fidélité » | `from-indigo-600 via-indigo-700 to-blue-800` | `Gift` |

### 1.7 Champs de formulaire par type (modal d'ajout)

Tous les types affichent en commun :
- **« Nom de la carte »** (input texte).
- **« Émetteur / Organisation »** (input texte).

Puis champs spécifiques (label · placeholder) :

| Type | Champ 1 | Champ 2 |
|---|---|---|
| `cni` | « Nom complet » — « DUPONT Jean » | « Numéro CNI » — « GA-1234-5678-9012 » |
| `driving` | « Nom complet » — « DUPONT Jean » | « Catégories » — « A, B, C » |
| `transport` | « Zone » — « Toutes zones » | « Numéro » — « TRS-2024-001234 » |
| `health` | « Régime » — « Salarié / Étudiant » | « Numéro CNAMGS » — « CNAM-789012 » |
| `bank` | « Numéro » — « **** **** **** 4521 » | « Titulaire » — « DUPONT JEAN » |
| `business` | « Poste » — « Directeur Technique » | « Entreprise » — « TechGabon SARL » |
| `voter` | « Nom » — « DUPONT Jean » | « Bureau » — « Bureau 12 - Libreville » |
| `loyalty` | « Enseigne » — « Casino / Géant » | « Points » — « 1500 points » |
| `custom` | « Champ 1 » — « Valeur... » | — |

Modal d'ajout (`showAddModal`) :
- Fond `bg-black/50 backdrop-blur-sm`, carte centrée max-w-md.
- Header : vignette dégradée du template + icône + nom du template + bouton `X` fermer.
- Champs label uppercase `text-xs muted` + input `bg-muted/50 ring-primary/30`.
- Footer 2 boutons côte à côte : **« Annuler »** (muted) · **« Créer »** (primary + icône `Plus`).

Modal d'édition (`editingCard`) :
- Même structure mais titre **« Modifier la carte »**, 2 champs uniquement : **« Nom »**, **« Sous-titre »**.
- Footer : **« Annuler »** · **« Enregistrer »** (icône `Check`).

### 1.8 Carte personnalisée — Modal dédié (`showCustomModal`)

Titre H3 : **« Carte Personnalisée »**.

Sections du formulaire (labels uppercase) :

1. **« Nom »** — input texte, valeur par défaut **« Ma Carte »**.
2. **« Couleur »** — palette de 6 swatches 8×8, ring primary sur sélection :
   - **« Vert »** — `from-green-600 via-green-700 to-emerald-800`
   - **« Orange »** — `from-orange-500 via-orange-600 to-red-600`
   - **« Bleu »** — `from-blue-500 via-blue-600 to-indigo-700`
   - **« Rose »** — `from-rose-500 via-rose-600 to-pink-600`
   - **« Noir »** — `from-slate-800 via-slate-900 to-black`
   - **« Violet »** — `from-purple-600 via-purple-700 to-violet-800`
3. **« Icône »** — 6 tiles 8×8 (icônes Lucide, ring primary sur sélection) :
   - **« Carte »** (`CreditCard`)
   - **« Voiture »** (`Car`)
   - **« Bus »** (`Bus`)
   - **« Cœur »** (`Heart`)
   - **« Valise »** (`Briefcase`)
   - **« Groupe »** (`Users`)
   - + (catalogue complet : « Vote » `Vote`, « Drapeau » `Flag`, « Cadeau » `Gift`).

Footer identique : **« Annuler »** · **« Créer »**.

### 1.9 États récapitulatifs à designer

| État | Description |
|---|---|
| Initial / normal | Cartes par défaut chargées, 6 en favori, drag inactif. |
| Drag en cours | Curseur `grabbing`, mini-carte soulevée (motion). |
| 6 favoris atteints | Boutons `EyeOff` des autres cartes opacité 30, `cursor-not-allowed`. |
| Aucun favori | Empty state colonne gauche. |
| Aucune autre carte | Empty state colonne droite. |
| Modal Ajouter | Sélection d'un template via bloc « Ajouter une carte ». |
| Modal Modifier | Édition rapide nom + sous-titre. |
| Modal Personnalisée | Choix couleur + icône + nom. |
| Carte CNAMGS sélectionnée | Lien direct vers page CNAMGS dédiée, pas d'édition possible. |

### 1.10 Variante « Stack Apple Wallet » (composant `CompactWallet` du dashboard)

À reprendre pour la **vue dashboard** (preview compacte des cartes du profil) — pas pour la page iCarte elle-même, mais utile pour le designer pour comprendre comment les cartes sont prévisualisées dans le profil :

- Max 7 cartes empilées (`MAX_CARDS`).
- Décalage `CARD_OVERLAP = 44px`, hauteur `CARD_HEIGHT = 56px`.
- Clic sur une carte → la sélectionne en plein format (ratio `85/55`) avec animation `layout`.
- Clic une deuxième fois → flip 3D (`rotateY: 180`) pour afficher le verso.
- Verso : titre **« Verso »** + données `backData` clé/valeur (clé uppercase 10px opacité 60, valeur 12px medium).
- Bouton flip : `RotateCcw` dans un rond `bg-white/20`.
- En haut : **« Retour »** (`ArrowLeft`) + hint droite **« Cliquez pour retourner »**.
- Boutons d'action (2 colonnes) sous la carte sélectionnée — labels des `actions` listés au §1.6.
- En bas si `cards.length > MAX_CARDS` : lien **« Voir toutes les cartes (N) »** + chevron — navigue vers `/icarte`.

### 1.11 Structure de donnée `WalletCard`

```ts
interface WalletCard {
  id: string;
  type: "cni" | "transport" | "bank" | "business" | "driving"
      | "health" | "consular" | "voter" | "loyalty" | "custom";
  name: string;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;          // classes Tailwind from/via/to
  data: Record<string, string>;
  backData?: Record<string, string>;
  actions?: { icon: React.ElementType; label: string; onClick: () => void }[];
}
```

---

## 2 — iBoîte — Boîte aux lettres souveraine

> Route IDN : `/iboite` · Source : `apps/idn.ga/src/pages/iboite/IBoitePage.tsx`

### 2.1 Objectif

Boîte aux lettres unifiée pour le citoyen : **courriers physiques numérisés**, **colis** (avec point relais idn.ga), **emails** administratifs et citoyens. Gestion multi-comptes : **Personnel**, **Professionnel**, **Association**.

### 2.2 Layout général

- Hauteur `100vh - 8rem`, 2 panneaux côte à côte, gap 2.
- **Panneau gauche** (`w-72`, fixe) : sélecteur de compte + onglets sections + dossiers + actions contextuelles.
- **Panneau droit** (`flex-1`) : contenu (liste ou prévisualisation A4).
- Modal global : « Nouveau message » (compose email).

### 2.3 Sélecteur de compte (haut du panneau gauche)

Bouton "compte courant" pleine largeur, fond dégradé selon le compte :
- Avatar carré 7×7 (icône du compte sur fond `bg-white/20`).
- Nom du compte (sm bold blanc) + email (xs blanc 70 %).
- `ChevronDown` à droite, rotation 180° quand dropdown ouvert.

Dropdown ouvert : liste des 3 comptes, ligne sélectionnée surlignée + `Check` primary à droite.

**Sous le bouton** : badge adresse compact (icône `MapPin` primary + `street, city` tronqué + bouton copier `Copy`/`Check` quand copié, feedback 2 s).

#### Liste exacte des comptes (`mockAccounts`)

| id | name | type | icône | gradient | adresse | email |
|---|---|---|---|---|---|---|
| `personal` | « Personnel » | personal | `Home` | `from-blue-500 to-indigo-600` | label « Jean Dupont » · « Point Relais idn.ga #12345 » · rue « Avenue du Colonel Parant » · ville « Libreville » · pays « Gabon » · BP « BP 1000 » · QR « IDNGA-12345 » | « jean.dupont@idn.ga » |
| `professional` | « Professionnel » | professional | `Briefcase` | `from-emerald-500 to-teal-600` | label « ABC SARL » · « Immeuble Le Cristal, Bureau 302 » · rue « Boulevard Triomphal » · ville « Libreville » · pays « Gabon » · BP « BP 5000 » · QR « IDNGA-PRO-5000 » | « contact@abc-sarl.ga » |
| `association` | « Association » | association | `Users` | `from-purple-500 to-pink-600` | label « Jeunesse Active » · « Maison des Associations » · rue « Rue de la Solidarité » · ville « Libreville » · pays « Gabon » · BP « BP 2500 » · QR « IDNGA-ASSO-2500 » | « asso.jeunesse@idn.ga » |

### 2.4 Onglets sections (mid-panneau gauche)

3 boutons verticaux pleine largeur, avec badge compteur à droite :

| id | Label | Icône | Couleur icône (off) | Badge compteur |
|---|---|---|---|---|
| `courriers` | « Courriers » | `Mail` | `text-blue-500` | `unreadLetters` (non lus dans inbox) |
| `colis` | « Colis » | `Package` | `text-amber-500` | `availablePackages` (statut "available") |
| `emails` | « eMails » | `MessageCircle` | `text-green-500` | `unreadEmails` (non lus dans inbox email) |

État actif : `bg-primary/10 text-primary` + icône primary + badge plein primary blanc.

### 2.5 Section Courriers — Dossiers + actions

#### Dossiers (sous-titre uppercase muted **« Dossiers »**)

| id | Label | Icône | Compteur |
|---|---|---|---|
| `inbox` | « Réception » | `Inbox` | nb non lus |
| `sent` | « Expédiés » | `Send` | — |
| `pending` | « À traiter » | `Clock` | nb dans pending |
| `trash` | « Poubelle » | `Trash2` | — |

Bouton primary pleine largeur sous les dossiers : icône `Plus` + **« Nouveau courrier »**.

#### Actions contextuelles (quand un courrier est sélectionné)

Sous-titre **« Actions »** uppercase muted. Boutons :

1. Pleine largeur primary : `Reply` + **« Répondre »**.
2. Ligne 2 colonnes : `Download` bleu **« Télécharger »** · `Printer` slate **« Imprimer »**.
3. Ligne 2 colonnes :
   - Si `folder` ≠ pending/trash : bouton amber `Clock` **« À traiter »** (déplace vers pending).
   - `Share2` vert **« Partager »** (col-span 2 si « À traiter » caché).
4. Pleine largeur destructive : `Trash2` rouge + **« Supprimer »** (déplace vers trash).

### 2.6 Section Colis — Statut + QR

Sous-titre **« Statut »** uppercase muted. Deux cartes empilées :

1. Card amber : `Package` + **« N à retirer »** (où N = nb statut `available`).
2. Card bleue : `Truck` + **« N en transit »** (où N = nb statut `transit`).

Bloc QR Code en bas (carte slate centrée) :
- Icône `QrCode` 8×8 muted.
- Texte mono : code QR du compte (ex : `IDNGA-12345`).

### 2.7 Section Emails — Dossiers + actions

#### Dossiers (sous-titre **« Dossiers »**)

| id | Label | Icône |
|---|---|---|
| `inbox` | « Boîte de réception » | `Inbox` (+ compteur non lus) |
| `starred` | « Favoris » | `Star` (rempli amber quand sélectionné) |
| `sent` | « Envoyés » | `Send` |
| `trash` | « Corbeille » | `Trash2` |

Bouton primary : `Plus` + **« Nouveau message »** → ouvre modal compose.

#### Actions contextuelles (email sélectionné)

Sous-titre **« Actions »**. Boutons :

1. Ligne 2 colonnes :
   - Bouton primary avec dropdown : `Reply` + **« Répondre »** + `ChevronDown`. Hover révèle un sous-menu **« Répondre à tous »** (`ReplyAll`).
   - Bouton secondary : `Forward` bleu + **« Transférer »**.
2. Ligne 2 colonnes :
   - `Archive` slate + **« Archiver »**.
   - `Trash2` rouge + **« Supprimer »**.

### 2.8 Bas du panneau gauche

Quand un courrier ou un email est sélectionné, bouton **« Retour à la liste »** (`ArrowLeft`) en bas du panneau gauche.

### 2.9 Panneau droit — états par section

#### 2.9.1 Courriers

**Liste (aucun courrier sélectionné)** :

- Header haut : titre dynamique selon `currentFolder` (**« Réception »** / **« Expédiés »** / **« À traiter »** / **« Poubelle »**) + sous-titre `N courrier(s)`.
- État vide : icône `Mail` 40px opacity 30 + texte xs **« Aucun courrier »**.
- Sinon : grille responsive `2/3/4 cols`, chaque carte est un faux courrier physique (effet papier) :
  - Bande haute en biseau (clip-path triangle) couleur ivoire/sable `#f5f2eb`.
  - Encart blanc 70 % avec **expéditeur** (ou destinataire si dossier "sent") en sm + objet en xs.
  - Bandeau **URGENT** rouge en haut droite si `type === "action_required"` ET non lu.
  - Bandeau **À TRAITER** amber si dossier pending.
  - Pied de carte : distance temporelle (`Il y a 2 heures` etc.) + bouton "marquer à traiter" `Clock` (sauf dossiers pending/trash/sent).
- Ring primary épais sur les non-lus.
- Hover : scale 1.02 + remontée 2px.

**Détail courrier (un courrier sélectionné)** — **Prévisualisation A4** plein écran :

- Conteneur centré avec scaling automatique (mesure du parent vs 595×842 px, scale max 1).
- Papier blanc shadow-2xl, padding 10.
- En-tête : 2 colonnes — `senderAddress` à gauche, `recipientAddress` à droite (whitespace-pre-line).
- Ligne droite : **« Libreville, le 15 mai 2025 »** (format `dd MMMM yyyy` fr).
- Titre 16px gras avec border-bottom : **« Objet : {subject} »**.
- Corps : texte 14px leading-6, whitespace-pre-wrap, justifié.
- Section **Pièces jointes** si présentes :
  - Titre xs uppercase **« Pièces jointes »**.
  - Pour chaque PJ : `FileText` bleu + nom + taille (alignée droite).
- Signature : nom du sender en italique bleu nuit, aligné droite.
- Encart rouge en bas si type `action_required` & dossier inbox :
  - Icône `AlertCircle` rouge.
  - Titre **« Action requise »**.
  - Texte **« Réponse attendue avant le {date} »** (ou « prochainement »).

#### 2.9.2 Colis

- Header : titre **« Mes Colis »** + sous-titre `N colis`.
- État vide : `Package` 40px + **« Aucun colis »**.
- Sinon liste verticale, chaque ligne :
  - Avatar carré 12×12 amber (`Package`) si `available`, sinon bleu (`Truck`).
  - Description (sm bold) + ligne **« De: {sender} »** + tracking mono xs.
  - À droite : pill amber **« À retirer »** ou pill bleue **« En transit »**.
  - Sous le pill si transit : **« Arrivée: dd/MM »**.

#### 2.9.3 Emails

**Liste** :

- Header : titre dynamique (**« Boîte de réception »** / **« Favoris »** / **« Envoyés »** / **« Corbeille »**) + sous-titre `N message(s)`.
- État vide : `MessageCircle` 40px + **« Aucun message »**.
- Sinon liste verticale séparée par lignes :
  - Étoile cliquable (`Star`) à gauche — pleine amber si starred.
  - Avatar circulaire 9×9 : dégradé bleu→indigo si sender admin (icône `Building2`), vert→émeraude si citizen (icône `User`).
  - Bloc texte : ligne 1 = expéditeur (ou destinataire si dossier "Envoyés") en sm bold/muted selon read, à droite distance temporelle xs.
  - Ligne 2 : objet xs bold/muted selon read.
  - Ligne 3 : preview xs muted.
  - Icône `Paperclip` muted à droite si `hasAttachment`.
  - Surlignage léger bleu `bg-blue-50/50` sur les non-lus.

**Détail email** :

- Header (fond carte) :
  - Avatar 10×10 dégradé selon type sender (admin/citizen).
  - Nom (base bold) + email `<{email}>` xs muted.
  - Ligne **« À: {recipient.email} • dd MMM yyyy, HH:mm »** xs muted.
  - À droite : bouton pill **« Ajouter aux favoris »** ou **« Retirer des favoris »** (selon `isStarred`), couleur amber si starred.
  - Sous le header : objet (text-lg semibold).
- Corps : papier blanc max-w-2xl, padding 6, ombre légère.
  - Texte 14px whitespace-pre-wrap.
  - Bloc **Pièces jointes** si présent : titre uppercase **« Pièces jointes »** + ligne `Paperclip` + nom (placeholder « Document.pdf ») + lien primary **« Télécharger »**.

### 2.10 Modal « Nouveau message »

- Fond `bg-black/50 backdrop-blur-sm`.
- Carte max-w-lg.
- Header : titre **« Nouveau message »** + bouton X.
- 3 champs empilés :
  - Input **« À »** (placeholder).
  - Input **« Objet »**.
  - Textarea 8 lignes **« Votre message... »**.
- Footer : bouton ghost **« Joindre »** (`Paperclip`) à gauche · à droite **« Annuler »** + bouton primary `Send` **« Envoyer »**.

### 2.11 États récapitulatifs

| État | Description |
|---|---|
| Section Courriers / dossier vide | Empty state `Mail`. |
| Section Courriers / liste | Grille de courriers stylisés papier. |
| Section Courriers / lecture | Preview A4 plein écran, panneau gauche affiche les actions. |
| Section Colis / vide | Empty state `Package`. |
| Section Colis / liste | Liste verticale avec pills statut. |
| Section Emails / vide | Empty state `MessageCircle`. |
| Section Emails / liste | Liste threads style Gmail. |
| Section Emails / lecture | Détail mail avec actions dans panneau gauche. |
| Compose ouvert | Modal flottant. |
| Switch compte | Le contenu des 3 sections se recharge filtré par `accountId`. |

### 2.12 Mock data — exemples à donner au designer

**Courrier (`mockLetters[0]`)** :

> Expéditeur : **« Mairie de Libreville »** — adresse :
> ```
> Mairie de Libreville
> Service État Civil
> BP 123 Libreville
> ```
> Destinataire : **« Jean Dupont »** —
> ```
> Jean Dupont
> BP 1000
> Libreville, GABON
> ```
> Objet : **« Complément de dossier requis »**
>
> Corps : **« Monsieur, / Suite à l'examen de votre dossier de demande d'acte de naissance, nous avons constaté qu'il manque une pièce justificative. / Nous vous prions de bien vouloir nous transmettre dans les meilleurs délais : / - Une copie de votre pièce d'identité / - Un justificatif de domicile récent / Sans réponse de votre part sous 15 jours, votre dossier sera classé sans suite. / Veuillez agréer, Monsieur, l'expression de nos salutations distinguées. / Le Service de l'État Civil »**
>
> Type : `action_required` · stamp rouge · non lu · échéance J+15.

**Courrier informatif (`mockLetters[1]`)** : CNAMGS — **« Confirmation d'adhésion à l'assurance maladie »** (numéro d'assuré « CNAMGS-2024-78901 »).

**Courrier envoyé (`mockLetters[2]`)** : citoyen → Mairie — **« Demande de copie intégrale d'acte de naissance »** avec 2 pièces jointes : « CNI_recto_verso.pdf » (1.2 MB), « Justificatif_domicile.pdf » (850 KB).

**Colis (`mockPackages`)** :

| id | Tracking | Expéditeur | Description | Statut |
|---|---|---|---|---|
| pkg1 | `GA2024-78901` | Amazon.fr | « Commande électronique » | `available` (« À retirer ») |
| pkg2 | `GA2024-78902` | La Poste | « Recommandé » | `transit` (« En transit »), arrivée J+2 |

**Emails (`mockEmails`)** :

| Expéditeur | Type | Objet | Preview |
|---|---|---|---|
| « Mairie de Libreville » | admin | « Confirmation de votre demande » | « Votre demande a été enregistrée sous le numéro #2024-12345... » (favori, non lu) |
| « CNAMGS » | admin | « Documents requis pour votre dossier » | « Pour compléter votre dossier, merci de fournir les documents suivants... » (non lu, PJ) |
| « Direction Générale des Impôts » | admin | « Rappel: Déclaration fiscale 2025 » | « Nous vous rappelons que la date limite de déclaration... » |
| « Jean Dupont » | citizen | « Re: Documents requis pour votre dossier » | « Veuillez trouver ci-joint les documents demandés... » (dossier `sent`, PJ) |

### 2.13 Structures de données

```ts
type SectionType   = "courriers" | "colis" | "emails";
type FolderType    = "inbox" | "sent" | "pending" | "trash";
type EmailFolderType = "inbox" | "sent" | "starred" | "trash";
type AccountType   = "personal" | "professional" | "association";

interface Account {
  id: string; name: string; type: AccountType;
  icon: typeof Home; color: string;            // classes Tailwind from-... to-...
  address: {
    label: string; fullAddress: string;
    street: string; city: string; country: string;
    postalCode: string; qrCode: string;
  };
  email: string;
}

interface DigitalLetter {
  id: string; accountId: string; folder: FolderType;
  sender: string; senderAddress: string;
  recipient: string; recipientAddress: string;
  subject: string; content: string;
  attachments: { name: string; size: string }[];
  isRead: boolean;
  type: "action_required" | "informational" | "standard";
  stampColor: "red" | "blue" | "green";
  createdAt: Date; dueDate?: Date;
}

interface PackageDelivery {
  id: string; accountId: string; trackingNumber: string;
  sender: string; description: string;
  status: "pending" | "transit" | "delivered" | "available";
  estimatedDelivery?: Date;
}

interface EmailMessage {
  id: string; accountId: string;
  sender: { name: string; email: string; type: "admin" | "citizen" };
  recipient: { name: string; email: string };
  subject: string; preview: string; content: string; date: Date;
  isRead: boolean; isStarred: boolean;
  folder: EmailFolderType; hasAttachment?: boolean;
}
```

---

## 3 — iDocument — Coffre-fort de documents

> Source de vérité retenue : **`apps/idn.ga/src/pages/documents/IDocumentPage.tsx`** (interface Dossier → Fichier).
>
> Variantes complémentaires utiles pour le designer :
> - `DocumentVault.tsx` — vue alternative à onglets (catégories légèrement différentes : « Famille » au lieu d'« État Civil », « Logement » au lieu de « Domicile »). À conserver uniquement comme inspiration secondaire.
> - `AddDocument.tsx` — variante plein écran de l'ajout (parcours 3 étapes).
> - `DocumentDetail.tsx` — variante plein écran de la prévisualisation (à privilégier sur tablette/mobile).
> - `RequestDocument.tsx` — page **séparée** pour demander un document officiel à l'administration.
> - `DocumentList.tsx` — vue liste compacte (à oublier ; remplacée par IDocumentPage).
>
> **Recommandation** : retenir IDocumentPage comme architecture canonique, et incorporer le parcours d'ajout 3 étapes (`AddDocument`) ainsi que la page « Demander » (`RequestDocument`) en sous-routes.

### 3.1 Objectif

Stockage personnel sécurisé des documents du citoyen, organisés en **8 dossiers** + recherche + ajout multi-source (upload, photo) + détection intelligente du type par OCR/nom de fichier + groupement automatique recto/verso + mode confidentiel (blur) + export PDF + partage. Plus : **demande de documents officiels** à l'administration.

### 3.2 Architecture des routes

| Route | Page | Rôle |
|---|---|---|
| `/idocument` | `IDocumentPage` | Accueil (grille des 8 dossiers) + vue dossier ouvert |
| `/documents/add` | `AddDocument` | Parcours d'ajout en plein écran (select → preview → success) |
| `/documents/:id` | `DocumentDetail` | Détail plein écran d'un document |
| `/documents/request` | `RequestDocument` | Demander un document officiel à l'administration |

### 3.3 Catalogue des dossiers (`DocumentCategory`)

Le label, la description, l'icône Lucide et la couleur sont définitifs (utilisés tels quels).

| Clé | Label | Description | Icône | Couleur (gradient Tailwind) |
|---|---|---|---|---|
| `identity` | « Identité » | « CNI, Passeport, Carte de séjour » | `User` | `from-blue-500 to-indigo-600` |
| `civil_status` | « État Civil » | « Acte de naissance, mariage, divorce » | `Baby` | `from-pink-500 to-rose-600` |
| `residence` | « Domicile » | « Justificatif de domicile, factures » | `Home` | `from-emerald-500 to-teal-600` |
| `education` | « Diplômes » | « Diplômes, certificats, attestations » | `GraduationCap` | `from-amber-500 to-orange-600` |
| `work` | « Travail » | « Contrats, bulletins de paie » | `Briefcase` | `from-purple-500 to-violet-600` |
| `health` | « Santé » | « Carte CNAMGS, ordonnances » | `Heart` | `from-red-500 to-rose-600` |
| `vehicle` | « Véhicule » | « Permis de conduire, carte grise » | `Car` | `from-cyan-500 to-blue-600` |
| `other` | « Autres » | « Documents divers » | `FileText` | `from-slate-500 to-gray-600` |

### 3.4 Page d'accueil iDocument (`/idocument`)

#### 3.4.1 Header

- À gauche :
  - Si vue dossier ouvert : bouton retour `ArrowLeft` (`bg-muted/50`).
  - Sinon : avatar dégradé bleu→indigo `from-blue-500 to-indigo-600` avec icône `FileText` blanche.
  - Titre H1 dynamique : **« iDocument »** (accueil) ou label du dossier ouvert.
  - Sous-titre xs muted : **« N documents • M dossiers »** (accueil) ou **« N document(s) »** (dossier).
- À droite (groupe d'actions) :
  - Toggle **mode confidentiel** : icône `EyeOff` — actif = bg `primary/20`, tooltip **« Désactiver mode confidentiel »** / **« Activer mode confidentiel »**.
  - Badge IA (hidden sm-) : icône `Sparkles` violet + texte **« IA Active »** (gradient violet).
  - Bouton notifications (`NotificationsPanel`, voir §3.4.5).
  - Bouton **« Export »** (icône `Download`, hidden sm-) — ouvre le ShareModal en mode `export`.
  - Bouton primary **« Ajouter »** (icône `Plus`) — ouvre le modal d'upload.

#### 3.4.2 Recherche

Input pleine largeur, icône `Search` à gauche, placeholder : **« Rechercher un document... »**. Filtre par `name` et `original_name` (case-insensitive).

#### 3.4.3 Vue dossiers (accueil)

Grille `2 / 3 / 4` colonnes selon viewport. Chaque tuile (`FolderCard`) :
- Composant `FolderIcon` 80px qui change selon l'état :
  - `closed-empty` : dossier fermé vide (count = 0).
  - `closed-filled` : dossier fermé avec contenu, jamais ouvert.
  - `open-filled` : dossier ouvert (déjà visité, persisté `localStorage`).
- Couleur via `FOLDER_ICON_COLORS[category]` (variante des gradients).
- Label sm bold (ex : **« Identité »**).
- Sous-label xs muted : **« 3 documents »** (ou « 1 document » au singulier, **« 0 document »** si vide).
- Hover : scale 1.02 ; tap : scale 0.98.

#### 3.4.4 Vue dossier ouvert

- Documents groupés automatiquement (`groupDocuments` apparie recto/verso d'une même pièce).
- Grille `2 / 3 / 4 / 5` colonnes selon viewport.
- Chaque carte (`DocumentFlipCard`) :
  - Vignette ratio 4/3 dégradée (couleur du dossier).
  - Si image et `public_url` : aperçu (avec blur si `isBlurMode`, hover retire le blur).
  - Sinon icône grande blanche (selon `file_type`).
  - Badge **RECTO**/**VERSO** en absolute top-left si `side` défini (style **« RECTO »** ou **« VERSO »** blanc sur fond noir 50 %).
  - Hover : overlay noir 50 % avec 3 boutons icônes blancs : `Eye` (preview), `Download`, `Trash2` (rouge).
- Sous la vignette : nom (sm medium tronqué) + ligne badges : **StatusBadge** (état) + **ExpirationBadge** (expiration).
- État vide dans un dossier :
  - Icône `FolderOpen` 12×12 muted.
  - Texte sm **« Aucun document dans ce dossier »**.
  - Lien primary souligné **« Ajouter un document »** (ouvre le modal d'upload).

#### 3.4.5 Notifications documents (panel)

Un panneau d'alertes générées automatiquement depuis les documents (`generateDocumentNotifications`). Le clic sur une notif :
- Sélectionne le dossier concerné.
- Ouvre directement la preview du document.

(Détail visuel du panneau à définir avec le designer : popover ou drawer.)

#### 3.4.6 Drag-and-drop global

- Zone overlay invisible qui s'active au drag sur toute la page.
- Quand actif : overlay primary 10 % + dashed border + icône `Upload` + texte **« Déposez vos fichiers ici »**.
- Détection intelligente au drop :
  - `detectDocumentType(filename)` → type détecté.
  - `detectDocumentSide(filename)` → recto/verso.
  - `getSuggestedFolder(type)` → dossier suggéré.
  - Toast d'info : **« Type détecté: {type} → Dossier: {Label} »**.
- Formats acceptés : `.pdf`, `.jpg`/`.jpeg`, `.png`, `.webp`.

### 3.5 Modal « Ajouter un document » (déclenché depuis IDocument)

- Fond `bg-black/50 backdrop-blur-sm`, carte max-w-md.
- Header : **« Ajouter un document »** + bouton X.
- Section 1 : label uppercase **« Dossier de destination »** + grille 4×2 de tiles (8 dossiers) — ring primary sur sélection.
- Section 2 — zone d'upload :
  - Dropzone dashed : icône `Upload` 8×8 + **« Cliquez pour sélectionner »** + sous-texte **« PDF, JPG, PNG (max 5MB) »**.
  - Bouton secondary pleine largeur : icône `Camera` + **« Prendre une photo »**.
- Aucune validation supplémentaire — création immédiate au sélection du fichier.
- Toast succès : **« N document(s) ajouté(s) »**.

### 3.6 Modal Preview document

- Fond `bg-black/70 backdrop-blur-sm`, carte max-w-2xl.
- Header :
  - Titre = nom du document (sm bold).
  - Sous-titre xs muted : **« {Label du dossier} • dd MMMM yyyy »**.
  - Bouton X.
- Zone preview ratio vidéo :
  - Image si `image` + `public_url`.
  - `<iframe>` si `pdf` + `public_url`.
  - Sinon icône `FileText` 24×24 muted.
- Métadonnées grille 2 colonnes (xs) :
  - **« Statut: »** + StatusBadge.
  - **« Expiration: »** + ExpirationBadge (jamais expire pour `civil_status` & `education`).
  - **« Taille: »** + nombre + « MB ».
  - **« Source: »** + valeur capitalize (`upload`, `camera`, `official`, `generated`).
- Footer 2 boutons :
  - Pleine largeur muted : `Download` + **« Télécharger »**.
  - Bouton rouge : `Trash2` + **« Supprimer »**.

### 3.7 Page **« Ajouter un document »** plein écran (`/documents/add`)

Variante alternative en flot guidé (à privilégier sur mobile/tablette). 3 étapes (state `step`) :

#### Étape 1 — `select`

- Titre H2 centré : **« Importer un fichier »**.
- Sous-titre muted : **« PNG, JPG ou PDF (Max 10MB) »**.
- 2 grandes cartes côte à côte (h-64) :
  - **« Choisir un fichier »** — pastille bleue `UploadCloud` 40px.
  - **« Prendre une photo »** — pastille verte `Camera` 40px.

#### Étape 2 — `preview`

- Carte centrée avec X rouge en haut à droite (annule, retour à étape 1).
- Vignette 24×24 grise + icône `FileText`.
- Nom du fichier tronqué + taille en MB sous 2 décimales.
- CTA pleine largeur h-14 primary : **« Confirmer l'envoi »**.
- Loader implicite (timeout 1.5 s) avant passage à success.

#### Étape 3 — `success`

- Cercle 32×32 vert avec `CheckCircle` 64px.
- Titre H2 : **« Document ajouté ! »**.
- Sous-texte : **« Votre document est en cours de vérification. »**.
- CTA secondary : **« Retour aux documents »** (navigue vers `/documents`).

### 3.8 Page **Détail document** (`/documents/:id`)

Layout 2 colonnes (1 col en mobile) avec retour `ArrowLeft` en haut + titre tronqué.

#### Colonne gauche — Aperçu

- Cadre `neu-inset` arrondi avec ratio 1.586 (≈ carte ID).
- Image preview cover.
- Overlay bas dégradé noir : `ShieldCheck` vert + **« DOCUMENT VÉRIFIÉ »** uppercase blanc.
- Sous l'aperçu, 2 boutons côte à côte `neu-raised` :
  - `Download` + **« Télécharger »**.
  - `Share2` + **« Partager »**.

#### Colonne droite — Détails

- Carte `neu-raised`.
- Titre **« Détails »** bold + séparateur.
- Lignes `DetailRow` (icône + label + valeur droite) :
  - `FileText` · **« Type »** · ex : « Identité ».
  - `ShieldCheck` · **« Numéro »** · valeur mono.
  - `Calendar` · **« Délivré le »** · date.
  - `Calendar` · **« Expire le »** · date — en primary (highlight).
  - `ShieldCheck` · **« Autorité »** · ex : « DGDI ».
- En bas, bouton destructive pleine largeur :
  - `Trash2` + **« Supprimer ce document »** (style rouge).

### 3.9 Page **Demander un document** (`/documents/request`)

#### Header

- Bouton retour rond `ArrowLeft`.
- Titre H1 **« Demander un Document »**.
- Sous-titre **« Faites une demande de document officiel en ligne »**.

#### Section « Demandes en cours » (si non vide)

- Mini-titre uppercase **« Demandes en cours »**.
- Liste de cartes : avatar primary + icône `FileText`, nom du document, ligne sous-titre **« Demandé le {date} • Prévu le {date} »**, pill statut à droite.
- 3 statuts possibles :
  - `pending` — **« En attente »** — `text-amber-600 bg-amber-500/10`.
  - `processing` — **« En cours »** — `text-blue-600 bg-blue-500/10`.
  - `ready` — **« Prêt »** — `text-green-600 bg-green-500/10`.

#### Section « Types de documents disponibles »

Mini-titre uppercase **« Types de documents disponibles »**. Grille 2 colonnes de cartes sélectionnables (border-2 primary quand actif + `CheckCircle2` primary apparu).

Chaque carte :
- Pastille colorée + icône.
- Titre du document.
- Description xs muted.
- Footer : `Clock` + temps de traitement · prix en bold.

##### Catalogue exact des documents demandables

| id | Nom | Icône | Couleur | Description | Délai | Frais |
|---|---|---|---|---|---|---|
| `birth-certificate` | « Acte de Naissance » | `Baby` | pink | « Copie intégrale ou extrait d'acte de naissance » | « 3-5 jours » | « 2 500 FCFA » |
| `criminal-record` | « Casier Judiciaire » | `Scale` | purple | « Bulletin n°3 du casier judiciaire » | « 5-7 jours » | « 5 000 FCFA » |
| `driving-license` | « Permis de Conduire » | `Car` | orange | « Renouvellement ou duplicata du permis » | « 7-10 jours » | « 15 000 FCFA » |
| `residence-cert` | « Certificat de Résidence » | `Home` | blue | « Attestation de domicile officielle » | « 1-2 jours » | « 1 000 FCFA » |
| `diploma-copy` | « Copie de Diplôme » | `GraduationCap` | green | « Copie certifiée conforme de diplôme » | « 5-7 jours » | « 3 000 FCFA » |
| `marriage-cert` | « Acte de Mariage » | `Heart` | red | « Copie intégrale d'acte de mariage » | « 3-5 jours » | « 2 500 FCFA » |

#### CTA flottant (apparaît dès qu'un type est sélectionné)

Bouton pleine largeur sticky bas : dégradé primary→emerald, icône `Send` + **« Envoyer la demande »** + chevron.

### 3.10 Statuts & badges documents

`VaultDocument.status` :

| valeur | label | sémantique |
|---|---|---|
| `pending` | « En attente » (à confirmer dans `StatusBadge`) | en attente de vérification |
| `verified` | « Vérifié » | OK |
| `rejected` | « Rejeté » | refusé |
| `expired` | « Expiré » | document expiré |

`ExpirationBadge` :
- Couleur verte si valide.
- Couleur amber si proche expiration (< 30 j).
- Couleur rouge si expiré.
- **« N'expire pas »** si dossier `civil_status` ou `education` (jamais expire).

### 3.11 Structures de données

```ts
type DocumentCategory = "identity" | "civil_status" | "residence" | "education"
                      | "work" | "health" | "vehicle" | "other";
type DocumentSource   = "upload" | "camera" | "official" | "generated";
type DocumentStatus   = "pending" | "verified" | "rejected" | "expired";
type FileType         = "pdf" | "image" | "other";

interface VaultDocument {
  id: string;
  user_id: string;
  folder_id: DocumentCategory;
  name: string;
  original_name: string | null;
  file_path: string;
  file_type: FileType;
  file_size: number;       // bytes
  mime_type: string | null;
  source: DocumentSource;
  status: DocumentStatus;
  is_verified: boolean;
  verification_date: string | null;
  expiration_date: string | null;
  side?: "front" | "back";
  paired_document_id?: string;
  metadata: Record<string, any>;
  created_at: string; updated_at: string;
  last_used_at: string | null;
  public_url?: string; thumbnail_url?: string;
}
```

### 3.12 États récapitulatifs

| État | Description |
|---|---|
| Accueil — aucun document | 8 tuiles de dossier, toutes avec compteur 0. |
| Accueil — quelques dossiers remplis | Mix `closed-empty` / `closed-filled` / `open-filled`. |
| Dossier ouvert — vide | Empty `FolderOpen` + lien « Ajouter un document ». |
| Dossier ouvert — peuplé | Grille de cartes, certaines appariées recto/verso. |
| Mode confidentiel actif | Toutes les images vignettes en `blur-md`, hover retire le blur. |
| Drag actif | Overlay primary plein écran « Déposez vos fichiers ici ». |
| Upload modal | Sélection dossier + dropzone. |
| Preview modal | Aperçu + métadonnées + actions. |
| Ajout 3 étapes (page séparée) | `select` → `preview` → `success`. |
| Détail page | Aperçu + métadonnées + actions. |
| Demande document — vide | Section « Demandes en cours » masquée. |
| Demande document — sélection | CTA « Envoyer la demande » apparaît. |

---

## 4 — Centre de notifications

> Route IDN : `/notifications` · Source : `apps/idn.ga/src/pages/notifications/NotificationCenter.tsx` + `apps/idn.ga/src/components/notifications/NotificationItem.tsx`

### 4.1 Objectif

Page dédiée listant les notifications du citoyen, regroupées par jour, filtrables par type, avec actions par item et globales.

### 4.2 Layout

- Page centrée `max-w-2xl mx-auto`, padding bas `pb-24`, espacement vertical 6.
- Structure :
  1. Header (retour + titre + actions globales).
  2. Tabs filtres.
  3. Liste regroupée temporellement.

### 4.3 Header

- Gauche :
  - Bouton rond `ArrowLeft` (`neu-raised`) — retour navigation.
  - Titre H1 **« Notifications »** xl bold.
  - Sous-titre xs muted : **« N non lues »**.
- Droite — 2 boutons ronds `neu-raised` :
  - `CheckCheck` 18px — tooltip **« Tout marquer comme lu »**.
  - `Trash2` 18px hover destructive — tooltip **« Tout effacer »**.

### 4.4 Filtres (Tabs)

Onglets horizontaux scrollables, style `neu-raised` (inset quand actif), bold xs uppercase.

| value | Label exact |
|---|---|
| `all` | « Tout » |
| `unread` | « Non lu » |
| `security` | « Sécurité » |
| `document` | « Documents » |

> Note : Les types `ai` et `cv` existent dans les données mais ne sont pas exposés comme onglets — ils tombent dans « Tout » / « Non lu ».

### 4.5 Regroupement temporel

2 groupes (clé `date`) :

| Clé | Titre affiché (uppercase tracked) |
|---|---|
| `today` | « Aujourd'hui » |
| `yesterday` | « Hier » |

Chaque groupe affiche ses items dans `space-y-3`.

### 4.6 Anatomie d'une notification (`NotificationItem`)

#### Props

```ts
{
  id: number;
  type: "security" | "document" | "ai" | "cv" | "system";
  icon: LucideIcon;
  title: string;
  message: string;
  time: string;         // ex: "Il y a 2 min", "Hier"
  read: boolean;
  date: "today" | "yesterday";
  actionLabel?: string; // CTA optionnel
}
```

#### Visuel

- Carte `p-4 rounded-2xl flex items-start space-x-4`.
- Variante non lue : `neu-raised bg-background` + point primary `animate-pulse` 2×2 en absolute top-right.
- Variante lue : fond transparent + hover bg léger.
- Avatar carré 3 (`p-3 rounded-xl`), couleur selon type :

| Type | Couleurs |
|---|---|
| `security` | `text-red-600 bg-red-100` (dark : `bg-red-900/20 text-red-400`) |
| `document` | `text-blue-600 bg-blue-100` |
| `ai` | `text-green-600 bg-green-100` |
| `cv` | `text-purple-600 bg-purple-100` |
| `system` / default | `text-gray-600 bg-gray-100` |

- Contenu :
  - Titre sm bold (muted si lu, foreground sinon) + heure 10px muted alignée droite.
  - Message xs leading-relaxed.
  - Ligne actions (mt-3) :
    - Si non lu : bouton ghost xs `Check` + **« Marquer comme lu »** (texte muted → primary au hover).
    - Si `actionLabel` : bouton xs bold primary 10 → primary plein au hover, contient le label fourni.

### 4.7 Mock data — exemples par type (verbatim)

| # | Type | Icône | Titre | Message | Temps | Lu | Date | Action label |
|---|---|---|---|---|---|---|---|---|
| 1 | `security` | `Shield` | « Nouvelle connexion détectée » | « Une connexion a été détectée depuis Chrome sur Windows à 14:30. Si ce n'est pas vous, changez votre mot de passe. » | « Il y a 2 min » | non | today | — |
| 2 | `document` | `FileText` | « Document expirant bientôt » | « Votre passeport expire dans 30 jours. Pensez à initier le renouvellement. » | « Il y a 2h » | non | today | « Renouveler » |
| 3 | `ai` | `Sparkles` | « Suggestion IA » | « Ajoutez vos compétences linguistiques pour compléter votre profil à 100%. » | « Hier » | oui | yesterday | « Voir mon profil » |
| 4 | `cv` | `User` | « Vue de profil » | « Votre CV a été consulté par 'Gabon Telecom' pour le poste de Chef de Projet. » | « Hier » | oui | yesterday | — |

### 4.8 État vide (aucune notification dans le filtre courant)

- Bloc centré opacity 50 :
  - Icône `Bell` 48px muted.
  - Texte bold foreground : **« Aucune notification »**.
  - Texte xs muted : **« Vous êtes à jour ! »**.

### 4.9 Comportements

- Clic sur **« Marquer comme lu »** → bascule `read=true` (uniquement ce point, l'item passe en variante "lu").
- Clic sur **« Tout marquer comme lu »** → tous les items deviennent `read=true`.
- Clic sur **« Tout effacer »** → liste vidée (idéalement avec confirmation à designer — actuellement vide direct).
- Clic sur le CTA `actionLabel` → action contextuelle (renouvellement, navigation profil…). Le designer doit prévoir l'aspect d'un toast de confirmation.

### 4.10 Variantes à prévoir

| État | Description |
|---|---|
| Liste pleine | Groupes "Aujourd'hui" + "Hier" avec items mixtes. |
| Filtre actif | Les groupes vides ne s'affichent pas. |
| Tout lu | Tous les items en variante "lue" (transparente), aucun point pulse. |
| Vide global | Empty state `Bell` centré. |
| Vide après filtre | Même empty state (le compteur d'en-tête « 0 non lues » reste cohérent). |

---

## Annexe — Conventions partagées entre modules

### A.1 Couleurs sémantiques récurrentes

| Sémantique | Tailwind |
|---|---|
| Primary (vert IDN) | classes `primary` / `primary-foreground` du thème |
| Action requise / urgent | `red-500` / `red-100` |
| À traiter / attente | `amber-500` / `amber-100` |
| En transit / info | `blue-500` / `blue-100` |
| Vérifié / OK | `green-500` / `green-100` |
| Confidentiel / IA | `violet-500` → `purple-500` |

### A.2 Composants UI réutilisés

- `Button` (shadcn) : variants `ghost`, `default`, `destructive`, sizes `icon`, `sm`.
- `Tabs` / `TabsList` / `TabsTrigger` (shadcn) — pour les filtres (notifications) et la sélection compte (iBoîte, dropdown custom).
- `UserSpaceLayout` — wrapper authentifié.
- `framer-motion` : `motion.div`, `AnimatePresence`, `Reorder.Group`.
- `sonner` `toast` : succès, info, erreur (français).

### A.3 Internationalisation

Tous les contenus sont **en français**. Les dates utilisent `date-fns` locale `fr`. Les distances temporelles ont le format **« Il y a … »** / **« Hier »** / **« dd MMMM yyyy »**.

### A.4 Format des montants

XAF / FCFA. Exemples : **« 2 500 FCFA »**, **« 12 500 XAF »**, **« 500 000 XAF/jour »**. Espace insécable comme séparateur de milliers.

### A.5 Empty states — gabarit récurrent

- Icône Lucide grande (40–48px) en `text-muted-foreground` à 30–50 % d'opacité.
- Texte principal `text-sm` ou `text-bold` foreground.
- Texte secondaire `text-xs text-muted-foreground`.
- Optionnel : lien primary souligné pour l'action principale.
