# Accès aux données Convex

La production réelle d'Identité.ga utilise le déploiement Convex
`flexible-panda-248`.

Pour toute lecture ou commande CLI visant les données de production, passer
explicitement ce déploiement :

```sh
npx convex run --deployment flexible-panda-248 <fonction> '<arguments-json>'
```

Pour une requête ponctuelle en lecture seule :

```sh
npx convex run --deployment flexible-panda-248 --inline-query '<requête>'
```

Ne pas utiliser `--prod` pour ce projet : ce raccourci ne cible pas la
production historique contenant les données réelles.

Avant de travailler sur le code Convex, lire aussi
`_generated/ai/guidelines.md` en entier.

## Incident d'inscription embarquée d'août 2026

Après déploiement du correctif, auditer d'abord les adresses concernées sans
écriture :

```sh
npx convex run --deployment flexible-panda-248 \
  _dev/repairEmbeddedSignupOrphans:inspect \
  '{"emails":["adresse@idn.ga"]}'
```

La suppression n'est autorisée que pour une coquille Better Auth non vérifiée,
créée pendant la fenêtre de l'incident, sans profil, rôle, consentement, token
OAuth ni second facteur. Elle exige ensuite une confirmation explicite :

```sh
npx convex run --deployment flexible-panda-248 \
  _dev/repairEmbeddedSignupOrphans:run \
  '{"emails":["adresse@idn.ga"],"confirm":"SUPPRIMER LES INSCRIPTIONS IDN INCOMPLETES"}'
```

Ne jamais lancer `run` avant d'avoir contrôlé que chaque ligne renvoyée par
`inspect` porte `eligible: true`.
