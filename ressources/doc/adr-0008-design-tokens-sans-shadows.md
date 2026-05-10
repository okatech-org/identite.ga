# ADR-0008 — Design tokens IDN sans ombres portées

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

IDN est l'identité numérique souveraine du Gabon — le ton **doit être institutionnel** (cf. cahier §7.4) :

> Sobre, factuel, rassurant — ce n'est pas une startup, c'est l'État. Pas d'emojis dans l'UI. **Pas de gradients flashy, pas de glassmorphism.** Pas de copie marketing exagérée.

Les composants shadcn/ui livrés par défaut intègrent des `shadow-sm`, `shadow-xs`, `shadow-md` sur cartes, inputs, boutons outline, onglets actifs, popover de Select. Ces ombres servent à donner du relief mais elles évoquent un design « produit grand public » plutôt qu'institutionnel.

Une revue visuelle a confirmé que les ombres rendaient les cartes du tableau de bord et du formulaire de contact « trop SaaS ».

## Décision

**Aucune ombre portée sur les blocs**, partout dans l'application. Les composants shadcn vendus dans `packages/ui/src/components/` ont été dépouillés de leurs `shadow-*` :

- `card.tsx` — retrait `shadow-sm`
- `input.tsx`, `textarea.tsx` — retrait `shadow-xs`
- `select.tsx` — retrait `shadow-xs` sur le trigger
- `button.tsx` (variant `outline`) — retrait `shadow-xs`
- `tabs.tsx` — retrait `shadow-sm` sur l'onglet actif
- `theme-toggle.tsx` — retrait `shadow-sm` sur l'option active

Le **relief vient de la bordure** (`border border-border` ; tokens IDN `--idn-border` clair / `#2C3128` sombre) et du **contraste de fond** (`bg-card` blanc / `#181C16` sombre vs `bg-background` `#FAFAF8` / `#0E110D`). Les rayons restent à 6 / 10 / 14 / 20 px (cf. `idn-tokens.jsx`).

Une seule exception : `focus:shadow-lg` sur le **skip link** (`Aller au contenu principal`). Il est `sr-only` 99,99 % du temps et n'apparaît qu'au focus clavier — l'ombre lui donne la visibilité requise pour que l'utilisateur sache qu'il a été activé.

## Alternatives envisagées

1. **Garder les ombres shadcn par défaut** — rejeté après revue visuelle, ne respecte pas le ton §7.4.
2. **Ombres très subtiles `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`** — quasi invisibles à 100 % zoom mais rajoutent du bruit visuel sans bénéfice mesurable.
3. **Bordures plus marquées (1.5 px)** pour compenser l'absence d'ombres — testé et écarté : devient trop dur en mode sombre. Border 1 px suffit avec le contraste fond / surface.

## Conséquences

**Positives**
- Aspect institutionnel et sobre, conforme §7.4.
- Charge visuelle réduite — plus simple pour les utilisateurs avec déficience cognitive ou en faible bande passante.
- Performance : pas de blur GPU côté CSS. Negligeable mais réel sur mobile bas de gamme.
- Cohérence light / dark : pas de réglage d'opacité d'ombre à gérer entre les deux modes.

**Négatives**
- Les developers shadcn habitués peuvent oublier le ban des shadows. Il faut le documenter comme convention obligatoire (cet ADR).
- Si on ajoute un nouveau composant shadcn via la CLI, il faudra **systématiquement retirer les `shadow-*`** avant de pousser. À automatiser via une règle ESLint custom ou un check `grep -r "shadow-" packages/ui/src/components/` en CI.

**Suivi**
- Ajouter une check CI qui échoue si un `shadow-*` apparaît dans `packages/ui/src/components/*.tsx` (sauf liste blanche : skip link, futurs composants pour des contextes spécifiques justifiables).
- Ajouter une note dans le guide contributeur : « Avant de pousser un nouveau composant shadcn, retirer les `shadow-*`. »
- Si un cas d'usage exige vraiment du relief (ex. drawer mobile, popover floating sur dashboard), réouvrir cet ADR avec un mémo « shadows autorisés sur quels contextes ».

## Références

- Cahier des charges §7.4 (Ton institutionnel)
- `ressources/interfaces/project/idn-tokens.jsx` — pas de prop `shadow` dans les primitives `IdnButton` / `IdnInput` / `IdnCard`
- [shadcn/ui — composants vendurés](https://ui.shadcn.com/)
