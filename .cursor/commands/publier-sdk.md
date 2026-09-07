Prepare la publication des paquets npm publics `@idn-ga/*`.

⚠️ **Ne publie rien sans mon accord explicite dans ce message.** Une publication
npm est irreversible : un numero depublie reste indisponible.

## Avant

1. Quels paquets changent, et en quoi ? `@idn-ga/core` (0.2.0),
   `@idn-ga/react` (0.1.2), `@idn-ga/better-auth` (0.2.1).
2. **Le changement est-il cassant ?** Verifie les signatures exportees. Rappel :
   `@idn-ga/better-auth` est consomme par administration.ga
   (`04_Socle_transition/administration_ga/convex/betterAuth/auth.ts`) — une
   signature cassee coupe l'authentification d'une vingtaine d'applications.
3. `peerDependencies` : `better-auth ^1.4.0` couvre-t-il encore la realite ?
4. Tests : `bun run --filter=@idn-ga/better-auth test` (le seul SDK qui en a un).
5. `bun run build:sdk` — le build doit passer avant tout.

## La sequence changesets

```bash
bun run changeset          # decrire le changement + le niveau de version
bun run version-packages   # applique versions et changelogs
bun run release            # build des @idn-ga/* PUIS changeset publish
```

## Apres — le maillon qu'on oublie

Une version publiee **n'est pas visible** chez le consommateur tant que sa
dependance n'a pas ete bumpee. Rappelle-moi de bumper `@idn-ga/better-auth` dans
le `package.json` **racine** d'administration.ga, sinon la publication n'a aucun
effet observable et on cherchera longtemps pourquoi.
