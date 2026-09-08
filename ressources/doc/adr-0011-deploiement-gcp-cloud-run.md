# ADR-0011 — Déploiement Phase 1 sur Google Cloud Platform (Cloud Run)

- **Statut** : Accepté
- **Date** : 2026-05-11
- **Décideurs** : équipe IDN
- **Remplace** : §12.2 de [`stack-technique.md`](../stack-technique.md) (hébergement Vercel mentionné initialement)

## Contexte

La Phase 1 documentée dans `stack-technique.md` prévoyait initialement un hébergement des apps Next.js sur **Vercel** (région Paris / Frankfurt). Nous décidons de basculer immédiatement sur **Google Cloud Platform (GCP)** pour la Phase 1, sans attendre la Phase 2 « souveraineté pragmatique ».

Motivations :

1. **Préparation de la Phase 2.** La Phase 2 (cf. §13 de `stack-technique.md`) cible un déploiement en conteneurs Docker sur infra gabonaise (Raxio / ANINF) orchestrés par Docker Compose ou k3s, avec Convex self-hosted. Démarrer la Phase 1 sur **Cloud Run** (conteneurs Docker scale-to-zero) rend la transition Phase 1 → Phase 2 quasi triviale : même image Docker, juste un changement d'orchestrateur et d'hébergeur. Vercel obligeait à réécrire le packaging au moment de la Phase 2.
2. **Souveraineté & régulation.** GCP propose des régions UE de premier rang (`europe-west1`, Belgique) avec garanties RGPD et résidence des données. Vercel délègue à AWS / Cloud Provider tiers, opacifie le contrôle réseau et complique l'analyse RGPD pour la CNIL/ARCEP.
3. **Coût.** Cloud Run scale-to-zero + 2 M requêtes gratuites/mois couvre confortablement le trafic MVP attendu. Vercel Pro est facturé même sans trafic significatif.
4. **CI/CD.** Le besoin (déploiement sélectif par app modifiée + déploiement Convex isolé) se modélise proprement avec GitHub Actions + `paths:` filters. Pas de dépendance à la plateforme d'hébergement (à l'inverse du couplage Vercel/Vercel CLI).

Le backend **Convex Cloud reste inchangé** : Convex n'est pas un service GCP, c'est un SaaS managé. Toutes les apps partagent le même déploiement Convex (cf. [ADR-0010](./adr-0010-multi-apps-auth-cross-domain.md)).

## Décision

### 1. Hébergement applicatif — Cloud Run

| Élément | Choix |
| :--- | :--- |
| Service | **Google Cloud Run** (une instance par app : `web`, `admin`, `controller`, `developer`, `connect`) |
| Région | **`europe-west1`** (Belgique, St-Ghislain) |
| Registry | **Artifact Registry** `identite-ga` (région `europe-west1`, format Docker) |
| Build | **Docker multi-stage** depuis le monorepo Bun, lancé par GitHub Actions |
| Output Next | `output: "standalone"` + `outputFileTracingRoot` pointant la racine du monorepo |
| Runtime | Image finale `node:22-alpine` (image standalone, sans Bun) |
| Authentification GitHub → GCP | **Workload Identity Federation** (pas de clé JSON) |
| Mapping domaines | Cloud Run Domain Mapping : `identite.ga`, `admin.identite.ga`, `controllers.identite.ga`, `developers.identite.ga` (cf. [ADR-0010](./adr-0010-multi-apps-auth-cross-domain.md), [ADR-0012](./adr-0012-fusion-connect-identite-ga.md)). Le service biométrique `kyc-inference` utilise un Application Load Balancer global + serverless NEG + certificat Certificate Manager validé par DNS sur `kyc.identite.ga`, car son hostname Cloud Run renvoyait un 404 Google Frontend avant le conteneur. |

### 2. Pipelines GitHub Actions

Un workflow **par app** + un workflow **Convex**, déclenchés par `push` sur `main` avec filtres `paths:` :

| Workflow | Déclenché par modifications de |
| :--- | :--- |
| [`deploy-convex.yml`](../../.github/workflows/deploy-convex.yml) | `packages/backend/convex/**` (hors `_generated/`) |
| [`deploy-web.yml`](../../.github/workflows/deploy-web.yml) | `apps/web/**`, `packages/ui/**`, dépendances racine |
| [`deploy-admin.yml`](../../.github/workflows/deploy-admin.yml) | `apps/admin/**`, `packages/ui/**`, dépendances racine |
| [`deploy-controller.yml`](../../.github/workflows/deploy-controller.yml) | `apps/controller/**`, `packages/ui/**`, dépendances racine |
| [`deploy-developer.yml`](../../.github/workflows/deploy-developer.yml) | `apps/developer/**`, `packages/ui/**`, `packages/sdk/**`, dépendances racine |
| [`deploy-kyc-inference.yml`](../../.github/workflows/deploy-kyc-inference.yml) | `services/kyc-inference/**`, workflow KYC |
| [`ci.yml`](../../.github/workflows/ci.yml) | Toute PR ou push sur `main` (lint + types + build) |

### 3. Propagation Convex → apps : **aucune automatisation**

Quand `deploy-convex.yml` se déclenche, **les apps ne sont pas re-déployées automatiquement**. Justification :

- Les apps Next consomment Convex au runtime via `NEXT_PUBLIC_CONVEX_URL` (URL fixe, ne change pas entre déploiements Convex).
- Les types/codegen `convex/_generated/**` sont **versionnés** dans le repo et déjà inclus dans les paths filters de chaque app : si Convex change le schéma, le commit qui modifie `convex/**` modifie aussi `convex/_generated/**` et déclenche les apps qui en dépendent.
- Si une mise à jour Convex casse les apps existantes (rare, signal de migration mal faite), il faut **revoir la PR**, pas compter sur un cascade auto.

### 4. Branche & environnements

- **Branche prod** : `main` (renommée depuis `master` au moment de la mise en place).
- **Pas d'environnement `staging`** pour l'instant (cf. `stack-technique.md` §12.5 — à monter ultérieurement avec Convex Preview Deployments + Cloud Run preview revisions).

### 5. Secrets GitHub requis

| Secret | Source |
| :--- | :--- |
| `GCP_PROJECT_ID` | Console GCP |
| `GCP_WIF_PROVIDER` | Workload Identity Pool provider (full resource name) |
| `GCP_SA_EMAIL` | `github-deployer@<project>.iam.gserviceaccount.com` |
| `CONVEX_DEPLOY_KEY` | Dashboard Convex → Settings → Deploy Key (prod) |
| `NEXT_PUBLIC_CONVEX_URL` | URL HTTPS publique du déploiement Convex prod |

## Alternatives envisagées

| Option | Pourquoi rejetée |
| :--- | :--- |
| **Vercel** (plan initial §12.2) | Couplage fort à un éditeur tiers ; trajectoire Phase 2 plus coûteuse ; coût et souveraineté moins favorables. |
| **GCP App Engine Standard** | API héritée, runtime Node bridé, mapping domaines moins flexible que Cloud Run. |
| **GCP App Engine Flex** | Pas de scale-to-zero, démarrage lent ; payant en continu. |
| **GKE Autopilot** | Overkill pour 5 services stateless ; coût plancher élevé (cluster + control plane) ; complexité opérationnelle injustifiée en Phase 1. |
| **Firebase Hosting + Functions** | Mauvais fit pour Next.js 16 SSR/App Router (cold-starts plus longs sur Functions Gen 1, intégration officielle Next moins mature). |
| **Cloud Build pour le build** (au lieu de Docker dans GHA) | Gain marginal ; nécessite un second système (`cloudbuild.yaml`) à maintenir ; perte de la portabilité Docker locale. |

## Conséquences

### Positives

- **Pipeline simple** : un workflow par app, un seul filtre `paths:` à comprendre.
- **Scale-to-zero** : coût quasi nul sur les apps peu sollicitées (`admin`, `controller`, `developer`).
- **Trajectoire Phase 2 lisible** : la même image Docker est rejouable sur n'importe quel orchestrateur (k3s, Docker Compose, Nomad).
- **Sécurité** : pas de clé JSON GCP à stocker dans GitHub ; WIF + OIDC token de courte durée.
- **Image légère** : `output: "standalone"` réduit l'image finale à ~150 Mo (vs ~1 Go avec un `bun install` complet).

### Négatives

- **Cold-starts** : ~1–3 s sur la première requête après scale-to-zero. Acceptable pour `admin`/`controller`/`developer`, à mitiger sur `web`/`connect` (apps publiques) avec `min-instances=1` une fois la prod en charge.
- **Complexité initiale** supérieure à Vercel (création projet GCP, WIF, IAM, mapping domaines, vérification Search Console).
- **Pas de propagation auto Convex → apps** : si une migration de schéma se fait sans rebuild des apps, les apps peuvent tourner sur du code obsolète tant qu'on ne pousse pas un commit qui les déclenche. Convention : toute migration de schéma s'accompagne d'un commit qui touche `apps/*` (ou push manuel `workflow_dispatch`).

### Suivi

- [ ] Mesurer le p95 cold-start sur `web` et `connect` au bout d'1 mois ; activer `min-instances=1` si > 1.5 s.
- [ ] Mettre en place un environnement `staging` (Cloud Run preview revisions + Convex preview deployment).
- [ ] Documenter la procédure d'audit RGPD GCP (DPA, sous-traitants, régions).
- [ ] Préparer la trajectoire Phase 2 : `docker compose up` de la même image sur un VPS de test (Raxio sandbox).

## Références

- [ADR-0001](./adr-0001-monorepo-turborepo-bun.md) — Monorepo Turborepo + Bun
- [ADR-0010](./adr-0010-multi-apps-auth-cross-domain.md) — Auth cross-domain multi-apps (sous-domaines)
- [`stack-technique.md`](../stack-technique.md) §12 — CI/CD et déploiement (mis à jour)
- [Next.js — Output: standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Cloud Run — Container contract](https://cloud.google.com/run/docs/container-contract)
- [google-github-actions/auth — Workload Identity Federation](https://github.com/google-github-actions/auth#setup)
