# KYC Inference — microservice d'inférence souverain (identite.ga)

Microservice **auto-hébergé** d'inférence KYC pour le système d'identité national
gabonais. Il exécute des modèles **open-source** derrière une API HTTP privée
appelée par le backend Convex. **Aucune donnée biométrique ne sort de l'infra.**

Quatre traitements :

| Traitement       | Modèle OSS                                | Rôle                                          | État                |
|------------------|-------------------------------------------|-----------------------------------------------|---------------------|
| OCR — MRZ        | PassportEye/mrz sur Tesseract (ICAO 9303) | Lire la MRZ d'un passeport (checksums)        | actif               |
| OCR — plein texte| Tesseract 5 (`fra+eng`) via pytesseract   | Extraire les champs d'une CNI (recto/verso)   | actif, **à calibrer** |
| Face match       | InsightFace `buffalo_l` (ArcFace)         | Similarité selfie ↔ photo du document         | actif               |
| Liveness         | Silent-Face-Anti-Spoofing (MiniFASNet)    | Détecter présentation-attack (papier, écran…) | actif               |

> **Pourquoi Tesseract et pas PaddleOCR.** `paddlepaddle` segfault (SIGSEGV,
> exit 139 — non rattrapable en Python, ça tue le worker) à l'instanciation de
> PaddleOCR sur l'amd64 de Cloud Build. Ce n'est pas propre à la 2.6 : PaddleOCR
> 3.3 + paddlepaddle 3.0 plantent de la même façon en conteneur x86_64
> ([Paddle#76111](https://github.com/PaddlePaddle/Paddle/issues/76111),
> [PaddleOCR#16402](https://github.com/PaddlePaddle/PaddleOCR/issues/16402),
> [#16361](https://github.com/PaddlePaddle/PaddleOCR/issues/16361)). Paddle est
> donc définitivement écarté. Tesseract est un binaire système stable, installé
> par apt (`tesseract-ocr` + `tesseract-ocr-fra`/`-eng`).

> **Les deux chemins OCR sont indépendants.** `mrz_ready` et `text_ready` sont
> deux drapeaux distincts, exposés par `/healthz` sous `ocr_mrz` et `ocr_text`.
> La lecture MRZ ne dépend ni du langpack français ni des heuristiques de layout :
> une carence sur l'extraction CNI ne doit pas faire tomber la lecture des
> passeports, qui est entièrement normalisée. Quand le chemin requis pour un type
> de document manque, `/v1/ocr` renvoie un **503** (et non 422) : la faute est
> côté service, et le backend sait dégrader un 503 vers la revue manuelle.

> ⚠️ **Extraction CNI à calibrer.** `app/ocr.py::_extract_cni_gabon` fonctionne
> mais ses libellés et son ordre de champs sont **supposés** — seul le format du
> NIP est sourcé (14 caractères alphanumériques, DGDI). Deux garde-fous sont déjà
> en place : la date de naissance est prise par libellé puis, à défaut, comme la
> **plus ancienne** date de la carte (la naissance précède délivrance et
> expiration), et le numéro privilégie le format NIP sur l'heuristique « plus
> long token dense ». Pour finir la calibration, remplir `CNI_SAMPLES` dans
> `tests/test_ocr_extraction.py` avec des échantillons réels puis ajuster jusqu'au
> vert.

> ℹ️ **`docAuthentic` n'est significatif que pour la MRZ** (checksums ICAO 9303).
> Sur une CNI, aucun contrôle d'authenticité n'est possible depuis une simple
> photo (ni UV, ni hologramme, ni puce) : le champ vaut donc `false`, plutôt que
> de rapporter un signal fabriqué à partir de « les champs sont remplis ».

---

## Architecture & flux

```
Convex backend  ──(1) upload images KYC dans son storage
      │
      ├─(2) POST /v1/ocr        { documentType, frontImageUrl, backImageUrl }
      └─(2) POST /v1/biometric  { selfieUrl, docFaceUrl }
              headers: X-Signature (HMAC-SHA256 hex du body), X-Timestamp (ISO)
      │
      ▼
  kyc-inference  ──(3) GET des URLs signées Convex (images en mémoire)
      │           (4) inférence OCR / face / liveness
      └─(5) verdict JSON ─────────────────────────────► Convex
```

Le service **ne stocke rien durablement** : les images restent en mémoire ; les
vidéos liveness passent par un fichier temporaire **supprimé immédiatement**
après analyse.

---

## Contrat HTTP

Authentification entrante sur toutes les routes `/v1/*` :

- `X-Signature` = `HMAC_SHA256(KYC_INFERENCE_SECRET, raw_body_bytes)` en **hex**.
  La signature porte sur les **octets bruts** du corps (pas un JSON re-sérialisé).
- `X-Timestamp` = instant d'émission ISO 8601 (UTC recommandé). Rejet si l'écart
  dépasse **5 min** (anti-rejeu).
- Signature absente/invalide ou timestamp périmé → **401** (comparaison
  timing-safe, message générique).

### `POST /v1/ocr`
> `documentType: "passport"` passe par la MRZ (fiable, checksums ICAO) avec repli
> sur l'OCR plein texte ; tout autre type passe directement par l'OCR plein texte.
> **503** si le chemin requis est indisponible, **422** si l'image est illisible.
```jsonc
// requête
{ "documentType": "passport", "frontImageUrl": "https://…", "backImageUrl": null }
// réponse
{
  "confidence": 0.91,
  "fields": {
    "firstName": "…", "lastName": "…", "dateOfBirth": "YYYY-MM-DD",
    "documentNumber": "…", "nationality": "…", "expiryDate": "…"
  },
  "docAuthentic": true
}
```

### `POST /v1/biometric`
```jsonc
// requête (selfieUrl peut pointer une image OU une courte vidéo liveness)
{ "selfieUrl": "https://…", "docFaceUrl": "https://…" }
// réponse
{ "faceMatch": 0.84, "liveness": "real", "livenessScore": 0.88 }
```

### `GET /healthz` (public, sans auth)
```json
{ "status": "ok", "models": { "ocr": true, "ocr_text": true, "ocr_mrz": true, "face_match": true, "liveness": true } }
```
Sur l'image Docker officielle, les cinq drapeaux ressortent `true` (poids bakés
ou vendorisés, Tesseract et ses langpacks installés par apt et vérifiés au build).
`ocr` est le OU de `ocr_text` et `ocr_mrz` : un `ocr: true` avec
`ocr_text: false` signifie que les passeports sont lisibles mais pas les CNI. En
dev local sans poids ni binaire tesseract, ils peuvent tous être `false`
(voir « Dégradation gracieuse »).

---

## Structure

```
services/kyc-inference/
├── app/
│   ├── main.py         # FastAPI, middleware HMAC, routes, lifespan (chargement modèles)
│   ├── config.py       # Settings depuis l'environnement
│   ├── security.py     # HMAC-SHA256 + anti-rejeu timestamp
│   ├── schemas.py      # Modèles Pydantic (contrat backend)
│   ├── assets.py       # Récupération des images (SSRF guard, limite taille, tmp files)
│   ├── ocr.py          # Tesseract + MRZ passeport + extraction CNI (À CALIBRER)
│   ├── face_match.py   # InsightFace / ArcFace, similarité cosinus
│   ├── liveness.py     # MiniFASNet (verdict réel), échantillonnage vidéo, seuils (À CALIBRER)
│   └── vendor/
│       └── minifasnet/ # Prédicteur MiniFASNet vendorisé (Apache-2.0, voir NOTICE.md)
├── models/             # Poids MiniFASNet + détecteur caffe (hors-Git, COPY au build)
├── download_weights.py # Vérif Tesseract + baking InsightFace au build (fail loud)
├── tests/              # pytest : HMAC (accept/reject) + shape des réponses (mocks)
├── requirements.txt        # runtime complet (modèles lourds)
├── requirements-test.txt   # sous-ensemble pour lancer les tests (modèles mockés)
├── Dockerfile              # image CPU multi-étapes, poids bakés (note GPU incluse)
├── .env.example
└── README.md
```

---

## Dégradation gracieuse

Si les **poids ne sont pas présents**, le service **démarre quand même** :
- `/healthz` indique quel moteur est chargé (`true`/`false`),
- les endpoints concernés répondent **503** avec un message clair (pas de crash).

C'est le comportement attendu tant que les poids n'ont pas été déposés.

---

## Poids des modèles (bakés dans l'image)

L'image Docker embarque **tous les poids au build** (pas de téléchargement au
premier appel, pas de volume à monter). Deux mécanismes :

| Modèle       | Stratégie                        | Emplacement dans l'image                    | Licence |
|--------------|----------------------------------|---------------------------------------------|---------|
| MiniFASNet   | **vendorisé** (COPY)             | `/srv/models/anti_spoof/*.pth` + `/srv/models/detection/` (détecteur caffe) | Apache-2.0 |
| Tesseract    | **paquet apt** (aucun poids)     | `/usr/share/tesseract-ocr/*/tessdata`       | Apache-2.0 |
| InsightFace  | **téléchargé au build**          | `/home/kyc/.insightface/models/buffalo_l`   | code MIT (voir ⚠️ poids) |

### MiniFASNet (Silent-Face-Anti-Spoofing) — vendorisé
Repo : https://github.com/minivision-ai/Silent-Face-Anti-Spoofing — **Apache-2.0**.
- Le **code du prédicteur** (`AntiSpoofPredict`, `CropImage`, MiniFASNet) est
  vendorisé sous `app/vendor/minifasnet/` (voir `NOTICE.md` + `LICENSE` : copie
  fidèle, adaptations documentées). `app/liveness.py` s'y branche pour un verdict
  **réel** real/spoof/uncertain.
- Les poids `.pth` (`2.7_80x80_MiniFASNetV2.pth`, `4_0_0_80x80_MiniFASNetV1SE.pth`)
  et le détecteur de visage caffe (`Widerface-RetinaFace.caffemodel` +
  `deploy.prototxt`) sont déposés hors-Git sous `services/kyc-inference/models/`
  (voir `.gitignore`) et **copiés dans l'image** au build.
- Pour ré-obtenir les poids (dépôt propre) :
  `git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing` puis
  copier `resources/anti_spoof_models/*.pth` → `models/anti_spoof/` et
  `resources/detection_model/*` → `models/detection/`.

### Tesseract — paquet système
Aucun poids à télécharger : le moteur et ses données de langue viennent d'apt
(`tesseract-ocr`, `tesseract-ocr-fra`, `tesseract-ocr-eng`). L'étape `ocr` de
`download_weights.py` ne télécharge rien — elle **vérifie** la présence du binaire
et des langpacks, et fait échouer le build s'ils manquent, pour ne pas publier une
image qui répondrait 503 en production. Licence **Apache-2.0**.
Repo : https://github.com/tesseract-ocr/tesseract

### InsightFace `buffalo_l` — téléchargé au build
Pack ArcFace (r100) + détecteur SCRFD, téléchargé dans
`/home/kyc/.insightface/models/buffalo_l` par `download_weights.py`.
Repo : https://github.com/deepinsight/insightface — code **MIT**.
> ⚠️ Les **poids `buffalo_l`** sont distribués pour un usage **non commercial /
> recherche**. Vérifier la licence des poids avant usage en production régalienne,
> et le cas échéant entraîner/obtenir un pack ArcFace sous licence adaptée
> (le contrat HTTP et le code `face_match.py` restent inchangés).

---

## Points à CALIBRER (marqués dans le code)

- **CNI gabonaise** (`app/ocr.py::_extract_cni_gabon`) : les libellés, l'ordre des
  lignes et les formats (numéro de carte, date) sont **supposés**. À ajuster avec
  des échantillons réels de CNI gabonaise.
- **Seuil face match** (`KYC_FACE_MATCH_THRESHOLD`, défaut 0.28 sur cosinus brut) :
  à calibrer sur un jeu de validation représentatif (FAR/FRR cible).
- **Seuils liveness** (`KYC_LIVENESS_REAL_THRESHOLD` / `..._SPOOF_THRESHOLD`) :
  dépendent de la variante MiniFASNet, de la caméra mobile et du protocole de
  capture. Recalibrer sur un jeu attaque/bonafide (papier, replay écran, masques).
- **`docAuthentic`** : hors passeport (checksums MRZ ICAO), c'est aujourd'hui une
  heuristique faible. Brancher un vrai contrôle d'authenticité documentaire si
  disponible.

---

## Lancer en local

```bash
cd services/kyc-inference
cp .env.example .env         # renseigner KYC_INFERENCE_SECRET (openssl rand -hex 32)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# → /healthz montrera models=false tant que les poids ne sont pas déposés
```

### Tests (sans les gros modèles)
```bash
python -m venv .venv-test && source .venv-test/bin/activate
pip install -r requirements-test.txt
pytest            # 16 tests : HMAC accept/reject + shape des réponses (mocks)
```

---

## Déployer (Docker)

### Build & run local
```bash
# Build ciblé Cloud Run (linux/amd64). Poids bakés → aucun volume de poids requis.
docker build --platform linux/amd64 -t identite-ga/kyc-inference:latest .

docker run --rm -p 8080:8080 -e PORT=8080 \
  -e KYC_INFERENCE_SECRET="$(openssl rand -hex 32)" \
  identite-ga/kyc-inference:latest
# → GET http://127.0.0.1:8080/healthz doit renvoyer les 3 moteurs à true.
```

- **Écoute** : `0.0.0.0:${PORT:-8000}`. Cloud Run injecte `PORT=8080`.
- **Architecture** : **`linux/amd64`** pour Cloud Run. Construire sur du x86
  réel (Cloud Build via `--source .`, ou une CI x86) reste recommandé : les wheels
  `onnxruntime`/`insightface` sont plus fiables ainsi, et l'émulation QEMU sur
  Apple Silicon rend le build très lent.
- **Taille d'image** : ~**4 Gio** (torch CPU + onnxruntime + buffalo_l +
  Tesseract). Prévoir Artifact Registry en conséquence. `torch` est
  installé en **CPU-only** (index PyTorch `/whl/cpu`) pour éviter ~3 Gio de
  dépendances CUDA inutiles.
- **RAM / CPU** : au moins **`--memory 4Gi --cpu 2`** (chargement simultané des
  trois moteurs en mémoire ; le pic au démarrage dépasse 2 Gio). 8Gi/4CPU
  recommandé pour la latence sous charge.

### Déployer sur Google Cloud Run

> Commande fournie à titre de référence — **à exécuter par l'opérateur** (ce
> service ne déploie rien lui-même). Choisir `--source .` (Cloud Build produit
> l'image amd64) **ou** pré-pousser une image dans Artifact Registry.

```bash
# Option A — build par Cloud Build depuis les sources (produit l'image amd64)
gcloud run deploy kyc-inference \
  --source . \
  --region europe-west9 \
  --platform managed \
  --no-allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --concurrency 4 \
  --timeout 120 \
  --min-instances 0 \
  --max-instances 5 \
  --port 8080 \
  --set-env-vars KYC_TESSERACT_LANG=fra+eng,ALLOWED_ASSET_HOST_SUFFIXES=.convex.cloud\,.convex.site \
  --set-secrets KYC_INFERENCE_SECRET=kyc-inference-secret:latest
```

Notes :
- `--no-allow-unauthenticated` : le service reste **privé** (invoker IAM +
  HMAC applicatif). Ne jamais l'exposer publiquement.
- `--set-secrets` : stocker `KYC_INFERENCE_SECRET` dans Secret Manager
  (`gcloud secrets create kyc-inference-secret …`), pas en clair.
- `--concurrency 4` : les moteurs ne sont pas thread-safe et sont coûteux en
  RAM ; garder une concurrence basse et scaler par instances.
- Le premier démarrage charge les modèles (cold start ~10–30 s) : envisager
  `--min-instances 1` en production pour éviter la latence de démarrage à froid.
- `--build-service-account` / `--gcs-source-staging-dir` peuvent être requis
  selon la politique du projet GCP.

GPU : voir la note en fin de `Dockerfile` (base CUDA, `onnxruntime-gpu`,
torch CUDA ; `KYC_USE_GPU=true`). Cloud Run supporte les GPU (L4) sur certaines
régions ; hors périmètre de cette image CPU.

---

## Notes de sécurité (IMPORTANT)

- **TLS obligatoire.** Le service ne doit jamais être exposé en clair. Terminer
  le TLS sur un reverse proxy (nginx/traefik) ou un mesh mTLS.
- **Réseau privé backend↔service.** N'exposer le service que sur un réseau
  interne / VPC. Pas d'accès public. Idéalement mTLS en plus du HMAC applicatif.
- **Secret HMAC** (`KYC_INFERENCE_SECRET`) : ≥ 256 bits, stocké dans un coffre
  (pas dans l'image, pas dans git). Rotation périodique.
- **Ne jamais journaliser les images** ni les embeddings ni les champs OCR. Les
  logs se limitent aux métadonnées (statut HTTP, durée, type de document).
- **Rétention nulle.** Images en mémoire uniquement ; les fichiers temporaires
  (vidéos liveness) sont supprimés immédiatement (`finally`), y compris en cas
  d'erreur. Vérifier que `KYC_TMP_DIR` est sur un volume non persistant.
- **Garde SSRF.** Restreindre `ALLOWED_ASSET_HOST_SUFFIXES` aux domaines Convex
  pour empêcher le service de récupérer des URLs arbitraires. Limite de taille de
  téléchargement active (`KYC_MAX_DOWNLOAD_BYTES`).
- **Anti-rejeu.** Fenêtre de 5 min sur `X-Timestamp`. Synchroniser les horloges
  (NTP) entre backend et service.
- **Isolation & non-root.** Le conteneur tourne en utilisateur non privilégié ;
  1 worker (modèles non thread-safe) — scaler par réplicas.

### Conformité (RGPD / loi gabonaise sur la biométrie)

- Les données biométriques sont des **données sensibles**. Le traitement doit
  reposer sur une **base légale** claire (mission d'identité régalienne) et
  respecter la réglementation gabonaise applicable ainsi que, le cas échéant, les
  principes RGPD si des flux transfrontaliers existent.
- **Minimisation & finalité** : n'utiliser les images que pour le verdict KYC ;
  pas de conservation, pas de réutilisation, pas d'entraînement sur les données
  citoyennes sans base légale et consentement distincts.
- **Souveraineté** : hébergement sur infrastructure contrôlée par l'État
  gabonais ; aucun appel sortant vers des services tiers (les modèles tournent
  localement). Vérifier qu'aucune dépendance ne « phone home ».
- **Traçabilité & DPIA** : tenir un registre des traitements et réaliser une
  analyse d'impact (DPIA/AIPD) avant mise en production.
- **Droits des personnes** : information, accès, rectification — gérés côté
  backend/registre, ce service ne conservant aucune donnée.

---

## Ce qui reste à faire (avant production)

1. ~~Déposer les poids et vendoriser MiniFASNet~~ — **fait** (poids bakés,
   prédicteur vendorisé sous `app/vendor/minifasnet/`).
2. **Calibrer** : layout CNI gabonaise (`app/ocr.py`), seuil face match
   (`KYC_FACE_MATCH_THRESHOLD`), seuils liveness (`KYC_LIVENESS_*_THRESHOLD`)
   sur un jeu représentatif gabonais (voir marqueurs `>>> À CALIBRER <<<`).
3. **Vérifier les licences des poids** (notamment `buffalo_l`) pour un usage
   régalien.
4. **Durcir l'hébergement** : IAM invoker privé, mTLS, VPC/Serverless VPC
   connector, Secret Manager, NTP, logs sans PII.
5. **Contrôle d'authenticité documentaire** réel (au-delà de la MRZ passeport).
6. **Tests d'intégration** avec de vrais échantillons (hors de ce dépôt), et
   évaluation FAR/FRR / APCER/BPCER.
