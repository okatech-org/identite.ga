# Plan d'implémentation backend — iCV (Constructeur de CV citoyen)

Document de planification — à exécuter après validation des designs (mobile + web) par l'agent design. Frontend hors scope ici.

## Context

iCV est la 5ᵉ feature citoyen reprise du précédent projet IDN. Specs design : [SPECS_FEATURE_ICV.md](SPECS_FEATURE_ICV.md). Cette spec décrit 3 écrans (iCV principal, EditCV, CVDashboard), 12 thèmes de rendu, 5 outils IA, import PDF/DOCX, export PDF.

Le backend doit fournir : persistance du CV unique par citoyen, calcul d'un score de complétion + suggestions, endpoints IA (5 outils), endpoint d'import (parsing serveur) et un signed URL pour le PDF généré côté client.

Décisions de cadrage **validées** :

- **Provider IA** : architecture **agnostique multi-provider** (Gemini Phase 1 avec clé API existante, Anthropic / OpenAI / self-hosted open-source à venir).
- **Parsing import** : **serveur** (Node action — `pdf-parse` / `mammoth` + LLM).
- **Export PDF** : **serveur** (`@react-pdf/renderer` Node action — déchargement du compute pour les utilisateurs sur mobile bas de gamme).
- **Multi-CV** : un user peut avoir **N CV** (CV principal + variantes optimisées par poste).
- **Multilingue** : FR uniquement Phase 1.

---

## 1 — Vue d'ensemble des changements

| Catégorie | Fichier(s) à créer | Tables / extensions schema |
|---|---|---|
| Schéma | `convex/schema.ts` (édit) | `citizenCv`, `citizenCvAiJob` |
| Liste multi-CV | `convex/cv/cvs.ts` | — |
| Module CV citoyen | `convex/cv/profile.ts`, `convex/cv/sections.ts`, `convex/cv/score.ts` | — |
| Provider IA agnostique | `convex/lib/ai/types.ts`, `convex/lib/ai/registry.ts`, `convex/lib/ai/providers/gemini.ts` | — |
| Module IA | `convex/cv/ai.ts` (action), `convex/cv/aiJobs.ts` (mutations job) | (alimente `citizenCvAiJob`) |
| Import | `convex/cv/import.ts` (action Node) | — |
| Export PDF serveur | `convex/cv/export.ts` (action Node) + 12 templates `convex/cv/pdfThemes/*.tsx` | — |
| Rate limit | `convex/rateLimiter.ts` (édit) | + `cvWrite`, `cvAi`, `cvImport`, `cvExport` |
| Onboarding | `convex/onboarding.ts` (édit) | + seed CV par défaut à la sélection profil |

Aucune dépendance frontend — toutes les fonctions sont posées avec validators complets pour brancher l'UI plus tard.

---

## 2 — Schéma

### 2.1 Table `citizenCv` (multi-CV)

**Un user peut avoir N CV** (max 10 Phase 1) : un CV « principal » créé à l'onboarding, plus des variantes générées par l'outil IA `optimize_job` (clone du CV principal + adaptation par poste visé). Chaque CV a son propre nom, son thème actif, son score, et un flag `isDefault` (max 1 par user).

```ts
citizenCv: defineTable({
  userId: v.string(),
  name: v.string(),            // « CV principal », « CV - Chef de projet », etc.
  isDefault: v.boolean(),      // true sur le CV principal ; 1 seul autorisé par user
  // Origine : utile pour distinguer un CV cloné via optimize_job
  source: v.union(
    v.literal("manual"),       // créé / dupliqué à la main
    v.literal("onboarding"),   // seed initial
    v.literal("ai_optimize"),  // dérivé de optimize_job
    v.literal("import"),       // créé via cv.import.parseAndApply
  ),
  derivedFromCvId: v.optional(v.id("citizenCv")),
  // Coordonnées
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phone: v.string(),
  address: v.string(),
  summary: v.string(),
  portfolioUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  // Préférence d'affichage (thème actif côté UI)
  activeTheme: v.union(
    v.literal("modern"), v.literal("classic"), v.literal("minimalist"),
    v.literal("professional"), v.literal("creative"), v.literal("startup"),
    v.literal("bold"), v.literal("tech"), v.literal("academic"),
    v.literal("executive"), v.literal("elegant"), v.literal("compact"),
  ),
  // Sections (listes plates, ordonnées via `position`)
  experiences: v.array(v.object({
    id: v.string(),
    title: v.string(),
    company: v.string(),
    location: v.string(),
    startDate: v.string(),       // ISO YYYY-MM-DD ou YYYY-MM
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.string(),
    position: v.number(),
  })),
  education: v.array(v.object({
    id: v.string(),
    degree: v.string(),
    school: v.string(),
    location: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
    position: v.number(),
  })),
  skills: v.array(v.object({
    id: v.string(),
    name: v.string(),
    level: v.union(
      v.literal("Beginner"), v.literal("Intermediate"),
      v.literal("Advanced"), v.literal("Expert"),
    ),
    position: v.number(),
  })),
  languages: v.array(v.object({
    id: v.string(),
    name: v.string(),
    level: v.union(
      v.literal("A1"), v.literal("A2"), v.literal("B1"), v.literal("B2"),
      v.literal("C1"), v.literal("C2"), v.literal("Native"),
    ),
    position: v.number(),
  })),
  hobbies: v.optional(v.array(v.string())),
  // Score calculé (dénormalisé, mis à jour à chaque write)
  completionScore: v.number(),    // 0..100
  // Soft delete (l'UI peut supprimer un CV variant sans casser les liens IA)
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_userId_default", ["userId", "isDefault"])
  .index("by_userId_deletedAt", ["userId", "deletedAt"]),
```

Choix :
- **Arrays embarqués** (et non sous-tables) pour les sections — un CV reste petit (<< 1 MB), et l'UI lit/écrit l'objet entier. Aligné sur la conv. Convex « pas d'array unbounded » mais ici la cardinalité est bornée par usage humain (~50 entries max).
- **Sous-objets avec `position`** pour permettre le drag-reorder ultérieur. Génération d'`id` aléatoire côté serveur (helper `crypto.randomUUID()`).
- **`activeTheme`** stocké côté serveur pour synchroniser entre les appareils (mobile/web).
- **`completionScore`** dénormalisé — recalculé en mutation pour éviter le compute en query.
- **`isDefault`** : un seul CV par user marqué comme défaut ; l'UI sélectionne ce CV par défaut quand `/icv` ouvre. Contrainte appliquée en mutation (pas au niveau schema).
- **`derivedFromCvId`** : pour les CV créés via `optimize_job`, permet de retrouver le CV source (utile pour rebaser sur le master si l'utilisateur l'a mis à jour entretemps).
- **Limite 10 CV/user** : appliquée en mutation `create` / `duplicate` pour éviter les abus.

### 2.2 Table `citizenCvAiJob`

Trace asynchrone des appels IA — utile pour rate-limit, audit, retry, et historique.

```ts
citizenCvAiJob: defineTable({
  userId: v.string(),
  cvId: v.id("citizenCv"),          // CV cible (multi-CV)
  feature: v.union(
    v.literal("improve_summary"),
    v.literal("suggest_skills"),
    v.literal("optimize_job"),
    v.literal("generate_letter"),
    v.literal("ats_check"),
  ),
  status: v.union(
    v.literal("queued"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  // Provider effectivement utilisé (audit + observabilité multi-provider)
  provider: v.optional(v.string()), // "gemini" | "anthropic" | "openai" | "ollama"
  model: v.optional(v.string()),    // "gemini-2.5-flash", etc.
  // Entrée libre (paramètres feature-specific, ex: jobOfferUrl pour optimize_job)
  input: v.optional(v.record(v.string(), v.any())),
  // Résultat structuré (sérialisable)
  result: v.optional(v.record(v.string(), v.any())),
  // Pour optimize_job : pointe vers le CV dérivé créé
  derivedCvId: v.optional(v.id("citizenCv")),
  errorMessage: v.optional(v.string()),
  // Métriques
  tokensIn: v.optional(v.number()),
  tokensOut: v.optional(v.number()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_userId", ["userId", "createdAt"])
  .index("by_user_cv", ["userId", "cvId", "createdAt"])
  .index("by_user_cv_feature", ["userId", "cvId", "feature", "createdAt"])
  .index("by_status", ["status", "createdAt"]),
```

### 2.3 Aucun changement aux énums globaux

Le score / les hobbies / etc. n'introduisent pas de catégorie d'audit nouvelle — les écrits passent par `account_modified` avec `metadata.module = "cv"`.

---

## 3 — Module `cv/cvs.ts` — Gestion multi-CV (liste)

Toutes les autres mutations (profile / sections / score / ai / export) prennent maintenant un `cvId` en argument.

```
query    cv.cvs.listMine()
         → CitizenCvSummary[]
         (id, name, isDefault, source, completionScore, activeTheme,
          updatedAt — sans les sections, pour le sélecteur en haut de
          l'écran iCV)

query    cv.cvs.getDefaultId()
         → Id<"citizenCv"> | null
         (helper utile au mount de la page principale)

mutation cv.cvs.create({ name, copyFromCvId? })
         → Id<"citizenCv">
         (refuse si l'user a déjà 10 CV actifs. Si copyFromCvId fourni,
          clone toutes les sections + coordonnées du CV source. Sinon
          crée un CV vide pré-rempli avec Better Auth user data.
          `source = "manual"`.)

mutation cv.cvs.setDefault({ cvId })
         → null
         (transactionnel : met isDefault=false sur l'ancien default,
          isDefault=true sur cvId.)

mutation cv.cvs.rename({ cvId, name })
         → null
         (1..80 chars. Pas de validation d'unicité — l'user peut avoir
          deux CV du même nom.)

mutation cv.cvs.remove({ cvId })
         → null
         (soft delete. Refuse si c'est le CV default — l'user doit
          d'abord en désigner un autre. Si le CV remove est référencé
          par un derivedFromCvId d'un autre, on garde la ref orpheline.)

mutation cv.cvs.restore({ cvId })
         → null
         (purge le deletedAt — utilisé par un éventuel undo client.)
```

## 4 — Module `cv/profile.ts` — Coordonnées + thème d'un CV

```
query    cv.profile.get({ cvId })
         → CitizenCV | null
         (null si pas owned ou soft-deleted)

mutation cv.profile.upsert({ cvId, patch: Partial<CVRoot> })
         → null
         (patch limité aux champs racine — firstName, lastName, email,
          phone, address, summary, portfolioUrl, linkedinUrl, hobbies.
          Recalcule completionScore. Rate-limit `cvWrite`.)

mutation cv.profile.setTheme({ cvId, theme })
         → null
```

Le helper `recomputeScore(cv)` calcule un score basé sur :
- présence champs racine obligatoires (firstName, lastName, email, phone, summary >= 50 chars) → 40 pts
- au moins 1 expérience → 20 pts
- au moins 1 formation → 15 pts
- au moins 3 compétences → 15 pts
- au moins 1 langue → 5 pts
- hobbies + portfolio/linkedin → 5 pts bonus

(Pondérations à valider — alignées sur les suggestions affichées dans le dashboard maquette : « Ajoutez vos diplômes » +15 %, « Validez vos compétences » +10 %, etc.)

---

## 5 — Module `cv/sections.ts` — Gestion fine des sections

Pour chaque type de section (experience / education / skill / language), 3 mutations + 1 reorder. Pattern identique aux entrées du wallet (positions ×1000, génération d'id serveur). Toutes prennent `cvId` en premier argument.

```
mutation cv.sections.experiences.add({ cvId, data })
mutation cv.sections.experiences.update({ cvId, id, patch })
mutation cv.sections.experiences.remove({ cvId, id })
mutation cv.sections.experiences.reorder({ cvId, orderedIds })

mutation cv.sections.education.add | update | remove | reorder
mutation cv.sections.skills.add | update | remove | reorder
mutation cv.sections.languages.add | update | remove | reorder
```

Toutes recalculent `completionScore` du `cvId` ciblé. Rate-limit `cvWrite` partagé (60/min/user, indépendamment du nombre de CV).

**Validation** :
- `experience.description` : 10..2000 chars.
- `skill.level` ∈ enum.
- `language.level` ∈ enum CECRL.
- `current === true` ⇒ `endDate` doit être undefined.

---

## 6 — Module `cv/score.ts` — Calcul score + suggestions

```
query cv.score.get({ cvId })
   → { score: number, level: "Débutant" | "Bon" | "Expert", suggestions: Suggestion[] }
```

`level` mapping :
- 0..40 → « Débutant »
- 41..75 → « Bon »
- 76..100 → « Expert »

`Suggestion = { title, description, impact }` — sorties **verbatim** alignées sur la maquette (cf. SPECS_FEATURE_ICV §5.3) :

| Condition | Title | Description | Impact |
|---|---|---|---|
| `education.length === 0` | « Ajoutez vos diplômes » | « 2x plus d'offres » | « +15% » |
| `skills.length < 5` | « Validez vos compétences » | « Certifier anglais » | « +10% » |
| `summary.length < 50` | « Améliorez votre résumé » | « Plus de mots-clés » | « +8% » |
| `phone === ""` ou `address === ""` | « Complétez vos contacts » | « Indispensable » | « +5% » |
| `linkedinUrl === undefined` | « Ajoutez votre LinkedIn » | « 3x plus vu » | « +5% » |

(Plafond : on retourne au max 3 suggestions, ordonnées par impact décroissant.)

---

## 7 — Couche provider IA agnostique (`convex/lib/ai/`)

Architecture multi-provider pour Phase 1 (Gemini) et futurs (Anthropic, OpenAI, self-hosted Ollama/vLLM…).

### 7.1 Interface commune

`convex/lib/ai/types.ts` — contrats stables consommés par `cv/ai.ts` :

```ts
export type AIProviderId =
  | "gemini"
  | "anthropic"
  | "openai"
  | "ollama"      // self-hosted Phase 2+
  | "vllm"        // self-hosted Phase 2+
  | "mock";       // tests

export interface AICompletionRequest {
  // Identifiant logique de la tâche — sert au logging, à la sélection de
  // modèle, et au caching éventuel.
  task: string;                  // ex "cv.improve_summary"
  system: string;
  prompt: string;
  // Réponse JSON structurée demandée (JSON Schema strict).
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  // Texte brut OU objet parsé si jsonSchema fourni.
  text?: string;
  json?: Record<string, unknown>;
  provider: AIProviderId;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface AIProvider {
  id: AIProviderId;
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
}
```

### 7.2 Registre

`convex/lib/ai/registry.ts` — sélection runtime selon les variables d'env :

```
const PRIMARY  = process.env.AI_PROVIDER ?? "gemini"
const FALLBACK = process.env.AI_PROVIDER_FALLBACK         // optionnel

getProvider(id?: AIProviderId): AIProvider
getActiveProvider(): AIProvider                 // = PRIMARY
withFallback<T>(fn): T                          // retry sur FALLBACK si PRIMARY 5xx
```

Chaque provider implémente l'interface dans `convex/lib/ai/providers/{id}.ts`. L'instanciation est paresseuse — un provider non configuré (env var manquante) ne s'enregistre pas.

### 7.3 Provider Gemini (Phase 1)

`convex/lib/ai/providers/gemini.ts` :

- SDK : `@google/genai` (officiel, expose `GoogleGenAI` + `generateContent`).
- Variables d'env : `GEMINI_API_KEY`, `GEMINI_MODEL` (défaut `gemini-2.5-flash`).
- Réponse JSON structurée via `responseMimeType: "application/json"` + `responseSchema`.
- Métriques `tokensIn`/`tokensOut` lues sur `response.usageMetadata.promptTokenCount` / `candidatesTokenCount`.

### 7.4 Providers futurs (stubs ready)

Documentés dès maintenant pour valider que l'interface est suffisante :

- `anthropic.ts` — SDK `@anthropic-ai/sdk`, modèle `claude-haiku-4-5`, prompt caching natif sur le système.
- `openai.ts` — SDK `openai`, modèle `gpt-4.1-mini`, structured output via `response_format`.
- `ollama.ts` — `fetch` direct vers `${OLLAMA_BASE_URL}/api/chat`, model `llama3.1:8b` ou autre, format `json`.
- `vllm.ts` — endpoint OpenAI-compatible (`${VLLM_BASE_URL}/v1/chat/completions`).

Pas implémentés Phase 1, mais le squelette `providers/<id>.ts` est posé pour servir de slot.

### 7.5 Mock pour tests

`convex/lib/ai/providers/mock.ts` — renvoie une réponse déterministe selon `task`. Activé via `AI_PROVIDER=mock` (utilisé dans les tests vitest pour ne pas appeler le réseau).

---

## 8 — Module `cv/ai.ts` — Outils IA (5 features)

Chaque feature = `action` (runtime Node) qui :
1. Crée une ligne `citizenCvAiJob` (cvId + feature, status `queued`) via `internalMutation`.
2. Vérifie le rate-limit `cvAi` (10/jour/user, tous CV confondus).
3. Charge le `citizenCv` via `internalQuery` (ownership check).
4. Bascule en `running`, appelle `getActiveProvider().complete(req)`.
5. Stocke `result` + `tokensIn/Out` + `provider` + `model` + bascule en `completed` (ou `failed` + errorMessage).
6. Side-effects par feature (voir §8.2).

```
action   cv.ai.improveSummary({ cvId })
         → Id<"citizenCvAiJob">

action   cv.ai.suggestSkills({ cvId })
         → Id<"citizenCvAiJob">

action   cv.ai.optimizeForJob({ cvId, jobOfferText? , jobOfferUrl?, newCvName? })
         → { jobId, derivedCvId: Id<"citizenCv"> }
         (crée un NOUVEAU CV cloné depuis cvId avec source="ai_optimize"
          et derivedFromCvId=cvId, applique les recommandations IA, puis
          retourne l'id du nouveau CV — l'UI peut naviguer dessus.)

action   cv.ai.generateLetter({ cvId, recipient?, tone? })
         → Id<"citizenCvAiJob">

action   cv.ai.atsCheck({ cvId })
         → Id<"citizenCvAiJob">

query    cv.ai.getLastResult({ cvId, feature })
         → CitizenCvAiJob | null

query    cv.ai.listJobs({ cvId?, limit? })
         → CitizenCvAiJob[]
```

### 8.1 Prompts (figés v1)

À encoder dans `cv/ai.ts` constants. Chaque prompt prend un `system` figé + le CV sérialisé en JSON en `user`. Toutes les réponses passent par `jsonSchema` pour réponse structurée stricte.

### 8.2 Side-effects par feature

**`improve_summary`** :
- Input : `cv.summary`, `cv.experiences[].{title,company,description}` (3 plus récents).
- Output JSON : `{ rewrittenSummary: string }`.
- Side-effect : **aucun** — l'UI affiche la suggestion dans la carte verte (cf. SPECS §4.3) avec boutons « Accepter » / « Ignorer ». L'acceptation déclenche un `cv.profile.upsert({ cvId, patch: { summary } })`.

**`suggest_skills`** :
- Input : `cv.experiences` complet.
- Output JSON : `{ suggestions: { name, level, rationale }[] }` (max 5).
- Side-effect : aucun — le client choisit lesquelles ajouter via `cv.sections.skills.add`.

**`optimize_job`** :
- Input : `cv` complet + `jobOfferText` (extrait depuis `jobOfferUrl` côté serveur si fourni).
- Output JSON : `{ tailoredSummary, prioritizedExperienceIds, suggestedSkills, addedKeywords }`.
- Side-effect : **crée un nouveau CV** (`cv.cvs.create` avec `copyFromCvId = cvId`, `source = "ai_optimize"`, `derivedFromCvId = cvId`, `name = newCvName ?? "Variant – {jobTitle}"`), puis applique les recommandations IA (réécrit `summary`, réordonne les expériences, ajoute les compétences).

**`generate_letter`** :
- Input : `cv` complet + recipient + tone (`formal` / `friendly` / `direct`).
- Output JSON : `{ letter: string, suggestedSubject: string }`.
- Side-effect : stocké en `result`. Le client peut soit afficher tel quel, soit déclencher un export PDF dédié (Phase 2 — pas dans ce plan).

**`ats_check`** :
- Input : `cv` complet.
- Output JSON : `{ score: number, breakdown: { keywords, structure, length, readability }, recommendations[] }`.
- Side-effect : aucun.

---

## 9 — Module `cv/import.ts` — Import PDF/DOCX

```
mutation cv.import.generateUploadUrl()
         → string   (Convex Storage signed URL)

action   cv.import.parseAndApply({ storageRef, mode, targetCvId? })
         → { jobId, cvId: Id<"citizenCv">, applied: Partial<CV> }
         (mode = "new" → crée un nouveau CV (source = "import") ;
          mode = "merge" → patch le CV `targetCvId` existant.
          Parse le fichier côté serveur, applique les champs reconnus.
          Rate-limit `cvImport` 5/jour.)
```

**Stratégie de parsing** :

- PDF : extraction texte via `pdf-parse` (Node action — `"use node"`).
- DOCX : extraction via `mammoth` (Node action).
- Une fois le texte brut récupéré, on délègue au provider IA actif (via `getActiveProvider()`) avec un `jsonSchema` qui décrit la structure CV attendue. C'est le même provider que les features IA — pas de logique parser custom.

Toast UI attendu (verbatim) : titre **« 📥 Import réussi »** + description **« Les données ont été importées. »** (cf. SPECS §3.7).

---

## 10 — Module `cv/export.ts` — Export PDF serveur

Rendu serveur via `@react-pdf/renderer` (action Node) pour décharger le compute des téléphones bas de gamme.

```
action   cv.export.renderPdf({ cvId, theme? })
         → { storageRef: Id<"_storage">, url: string, expiresAt: number }
         (theme par défaut = activeTheme du CV. Génère le PDF, l'upload
          dans Convex Storage, renvoie un signed URL valide 15 min.
          Rate-limit `cvExport` 30/jour/user.)

query    cv.export.getLastUrl({ cvId, theme })
         → { storageRef, url } | null
         (renvoie le dernier export non expiré pour ce couple
          (cvId, theme) — l'UI peut le réutiliser sans regénérer si
          le CV n'a pas été modifié depuis.)
```

**Architecture** :

- `convex/cv/export.ts` (Node action) — orchestre : charge le CV, sélectionne le template, render, upload.
- `convex/cv/pdfThemes/index.ts` — registre des 12 templates :
  ```
  ModernPdf, ClassicPdf, MinimalistPdf, ProfessionalPdf,
  CreativePdf, StartupPdf, BoldPdf, TechPdf,
  AcademicPdf, ExecutivePdf, ElegantPdf, CompactPdf
  ```
- Chaque template = composant React `@react-pdf/renderer` exportant un `<Document>` paramétré par `{ cv: CitizenCv }`.
- Cache : on hash le CV (sha256 du JSON canonique + theme) ; si un export récent (< 24h) existe avec ce même hash, on retourne le storageRef existant au lieu de regénérer.

**Frontend impact (à transmettre au designer)** : le bouton « PDF » de l'UI déclenche un loader 1-3s + redirige vers le signed URL au retour, au lieu de l'`react-to-print` actuel qui ouvre un dialogue d'impression natif. À refléter dans la maquette.

---

## 11 — Onboarding & seed

Aligné sur le pattern wallet/iBoîte (cf. commit `8d6d95f`).

```
internalMutation cv.cvs.ensureDefaultForUser({ userId })
         → null
         (idempotent — crée un `citizenCv` `isDefault=true`
          `source="onboarding"` vide pré-rempli avec firstName/lastName/email
          tirés de Better Auth si dispo, activeTheme = "modern",
          completionScore recalculé. Ne fait rien si l'user a déjà au
          moins 1 CV non supprimé.)
```

À brancher dans `convex/onboarding.ts::selectProfile`, à côté de `wallet.seedDefaultsForUser` et `iboite.accounts.ensurePersonal`.

---

## 12 — Rate limit (à ajouter à `rateLimiter.ts`)

```
cvWrite:  { kind: "token bucket", rate: 60, period: MINUTE, capacity: 60 }
cvAi:     { kind: "fixed window",  rate: 10, period: HOUR * 24 }   // 10/jour/user
cvImport: { kind: "fixed window",  rate: 5,  period: HOUR * 24 }   // 5/jour/user
cvExport: { kind: "token bucket",  rate: 30, period: HOUR * 24, capacity: 30 }
```

(`HOUR * 24` plutôt qu'un constante `DAY` qui n'existe pas dans `@convex-dev/rate-limiter`.)

---

## 13 — Audit

Toutes les mutations passent par `internal.audit.recordAudit` avec :
- `action: "account_modified"`
- `metadata.module: "cv"`
- `metadata.op: "cvs.create" | "profile.upsert" | "section.add" | "ai.improve_summary" | "import" | "export" | ...`
- `metadata.cvId: Id<"citizenCv">`

Pas de nouvelle catégorie d'audit nécessaire.

---

## 14 — Tests à prévoir

| Fichier | Couverture minimale |
|---|---|
| `convex/cv/cvs.test.ts` | seed onboarding ; create avec/sans copyFrom ; cap 10/user ; setDefault transactionnel ; remove refuse le default ; soft delete |
| `convex/cv/profile.test.ts` | upsert validation (summary < 50, email format) ; recompute score ; ownership (un user ne peut pas patcher le CV d'un autre) |
| `convex/cv/sections.test.ts` | add/update/remove pour les 4 types ; reorder cohérent ; validation `current → !endDate` |
| `convex/cv/score.test.ts` | mapping score → level ; ordre suggestions par impact ; cap à 3 |
| `convex/lib/ai/registry.test.ts` | sélection du PRIMARY ; fallback ; mock provider en mode `AI_PROVIDER=mock` |
| `convex/cv/ai.test.ts` | mocked provider via mock ; rate-limit 10/jour respecté ; status transitions ; `optimize_job` crée un nouveau CV avec `source="ai_optimize"` |
| `convex/cv/import.test.ts` | mocked parser ; rate-limit ; ownership ; mode `new` crée un CV, mode `merge` patche |
| `convex/cv/export.test.ts` | mocked PDF renderer ; cache hit si CV non modifié ; rate-limit |

---

## 15 — Fichiers à créer / modifier

### À modifier

| Fichier | Changement |
|---|---|
| `packages/backend/convex/schema.ts` | + tables `citizenCv` (multi-CV), `citizenCvAiJob` |
| `packages/backend/convex/onboarding.ts` | + `internal.cv.cvs.ensureDefaultForUser` dans `selectProfile` |
| `packages/backend/convex/rateLimiter.ts` | + `cvWrite`, `cvAi`, `cvImport`, `cvExport` |
| `packages/backend/package.json` | + `@google/genai`, `pdf-parse`, `mammoth`, `@react-pdf/renderer` |

### À créer

| Fichier | Rôle |
|---|---|
| `packages/backend/convex/cv/cvs.ts` | listMine, getDefaultId, create, setDefault, rename, remove, restore, ensureDefaultForUser (internal) |
| `packages/backend/convex/cv/profile.ts` | get, upsert, setTheme |
| `packages/backend/convex/cv/sections.ts` | CRUD + reorder pour experiences/education/skills/languages |
| `packages/backend/convex/cv/score.ts` | get — score + level + suggestions |
| `packages/backend/convex/cv/ai.ts` | 5 actions IA + queries `getLastResult` / `listJobs` |
| `packages/backend/convex/cv/aiJobs.ts` | internalMutations (`createJob`, `markRunning`, `markCompleted`, `markFailed`) |
| `packages/backend/convex/cv/import.ts` | generateUploadUrl, parseAndApply (action Node) |
| `packages/backend/convex/cv/export.ts` | renderPdf (action Node) + getLastUrl |
| `packages/backend/convex/cv/pdfThemes/index.ts` | registre des 12 templates `@react-pdf/renderer` |
| `packages/backend/convex/cv/pdfThemes/{modern,classic,...}.tsx` | un fichier par thème (12 au total) |
| `packages/backend/convex/lib/ai/types.ts` | interface `AIProvider` + types `AICompletionRequest/Result` |
| `packages/backend/convex/lib/ai/registry.ts` | sélection runtime + fallback |
| `packages/backend/convex/lib/ai/providers/gemini.ts` | implémentation Gemini (Phase 1) |
| `packages/backend/convex/lib/ai/providers/anthropic.ts` | stub typé (squelette pour Phase 2) |
| `packages/backend/convex/lib/ai/providers/openai.ts` | stub typé (squelette pour Phase 2) |
| `packages/backend/convex/lib/ai/providers/ollama.ts` | stub typé (squelette self-hosted) |
| `packages/backend/convex/lib/ai/providers/mock.ts` | provider mock pour tests |

### Fonctions existantes à réutiliser

- `convex/lib/auth.ts` → `requireVerifiedAuth` pour toutes les mutations.
- `convex/audit.ts` → `internal.audit.recordAudit`.
- `convex/rateLimiter.ts` → étendu.
- Pattern `wallet.seedDefaultsForUser` (idempotent + audit + positions multiples de 1000) → modèle pour les sections CV.
- Pattern `vault/items.ts::generateUploadUrl` → réutilisé tel quel par `cv/import.ts`.

---

## 16 — Variables d'environnement Convex à poser

```
bunx convex env set AI_PROVIDER gemini
bunx convex env set GEMINI_API_KEY <ta-clé>
bunx convex env set GEMINI_MODEL gemini-2.5-flash      # optionnel
# Plus tard :
# bunx convex env set AI_PROVIDER_FALLBACK anthropic
# bunx convex env set ANTHROPIC_API_KEY <clé>
```

---

## 17 — Ordre d'implémentation suggéré

1. **Schéma** : ajouter `citizenCv` (multi-CV) + `citizenCvAiJob`, lancer `bunx convex dev` pour vérifier la migration.
2. **`cv/cvs.ts`** : listMine, create, setDefault, rename, remove, restore, ensureDefaultForUser.
3. **`cv/profile.ts`** : get, upsert, setTheme, recomputeScore.
4. **`cv/sections.ts`** : CRUD pour les 4 types.
5. **`cv/score.ts`** : map score → level + suggestions.
6. **Onboarding** : branchage `ensureDefaultForUser`.
7. **Tests** des modules 2–5 (vitest + convex-test).
8. **Couche IA agnostique** :
   - `lib/ai/types.ts` + `registry.ts` + `providers/mock.ts` + `providers/gemini.ts`.
   - Stubs typés pour anthropic/openai/ollama (uniquement classes vides qui throw "NOT_IMPLEMENTED").
9. **`cv/aiJobs.ts`** + **`cv/ai.ts`** : 5 features, une par une (commit/test par feature avec provider `mock`).
10. **`cv/import.ts`** : parser PDF/DOCX + apply (modes new/merge).
11. **`cv/pdfThemes/*`** : 12 templates `@react-pdf/renderer` (peut être stubbé avec 2-3 thèmes au début, les 9 autres = fallback `modern`).
12. **`cv/export.ts`** : action renderPdf + cache 24h.
13. **Smoke E2E manuel** (Convex dashboard) : login → ensureDefault → upsert summary → score → cvs.listMine → cv.ai.improveSummary (provider mock puis Gemini) → cv.ai.optimizeForJob crée un nouveau CV → cv.export.renderPdf retourne une URL.

Un commit par module + un commit final qui rebranche `onboarding.selectProfile`.

---

## 18 — Hors scope explicite

- **Frontend (mobile + web)** — sera traité après réception des designs.
- **Lettre de motivation : export PDF dédié** — Phase 2 (`generate_letter` stocke juste le texte).
- **CV multilingue** (FR uniquement Phase 1).
- **Partage public d'URL** (`/cv/{slug}`) — Phase 2.
- **Vues / analytics du CV** (qui l'a consulté) — Phase 2, alimente la catégorie de notif `cv` déjà préparée dans `schema.ts`.
- **Providers IA autres que Gemini** — squelettes posés, implémentation Phase 2+.

---

## 19 — Vérification end-to-end

### 19.1 Type-check + dev
```
cd packages/backend && bun run check-types
cd packages/backend && bun run dev
```

### 19.2 Tests unitaires
```
cd packages/backend && AI_PROVIDER=mock bunx vitest run
```

### 19.3 Smoke E2E (Convex dashboard)
1. Login un user.
2. `cv.cvs.listMine()` retourne 1 CV `isDefault=true source="onboarding"`.
3. `cv.profile.upsert({ cvId, patch: { summary: "..." } })` → `completionScore` recalculé.
4. `cv.sections.experiences.add({ cvId, data: {...} })` → score remonte.
5. `cv.score.get({ cvId })` retourne `level` + suggestions ordonnées.
6. `cv.ai.improveSummary({ cvId })` avec `AI_PROVIDER=mock` → job `completed` + `result.rewrittenSummary` non null.
7. `cv.ai.optimizeForJob({ cvId, jobOfferText })` → crée un nouveau CV (`source="ai_optimize"`, `derivedFromCvId=cvId`).
8. `cv.cvs.listMine()` retourne maintenant 2 CV.
9. Upload PDF via `cv.import.generateUploadUrl()` + `cv.import.parseAndApply({ storageRef, mode: "new" })` → 3 CV.
10. `cv.export.renderPdf({ cvId })` → URL signée pointant vers le PDF dans Convex Storage.
