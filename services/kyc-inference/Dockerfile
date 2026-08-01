# ============================================================================
# Image CPU du microservice KYC Inference — poids BAKÉS au build.
#
# Build multi-étapes :
#   * builder  : toolchain C/C++ (insightface n'a pas de wheel -> compilation),
#                installe toutes les dépendances Python.
#   * runtime  : image slim, copie les site-packages compilés, COPY des poids
#                MiniFASNet vendorisés, puis TÉLÉCHARGE PaddleOCR + InsightFace
#                dans les caches de l'image (download_weights.py).
#
# Cible : linux/amd64 pour Cloud Run.
#   docker build --platform linux/amd64 -t kyc-inference:test .
#
# Cloud Run injecte PORT=8080 ; le CMD écoute sur 0.0.0.0:${PORT:-8000}.
# RAM recommandée : >= 4Gi (torch + paddle + onnxruntime + modèles en mémoire),
# CPU : >= 2. Voir README.
#
# GPU : voir la note en bas de fichier.
# ============================================================================

# --------------------------------------------------------------------------- #
# Étape 1 — builder (compile insightface & installe les dépendances)
# --------------------------------------------------------------------------- #
# Base bookworm (glibc 2.36) : les wheels manylinux2014 (paddlepaddle, onnxruntime)
# sont fiables dessus. La variante trixie (glibc 2.41) corrompt le tas avec paddle.
FROM python:3.10-slim-bookworm AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Toolchain de build : insightface (Cython/C++) et éventuelles deps à compiler.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt ./

# torch CPU-only : le wheel torch par défaut (linux) embarque toute la stack
# CUDA (nvidia-*), inutile ici et pesant plusieurs Gio. On l'installe depuis
# l'index CPU de PyTorch AVANT requirements.txt (qui le trouvera déjà satisfait).
# numpy + cython disponibles avant la compilation d'insightface (pas de wheel).
RUN pip install --upgrade pip \
    && pip install "numpy>=1.26,<2.0" cython \
    && pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.2,<3.0" \
    && pip install -r requirements.txt

# --------------------------------------------------------------------------- #
# Étape 2 — runtime (slim, poids bakés)
# --------------------------------------------------------------------------- #
FROM python:3.10-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HOME=/home/kyc \
    KYC_INSIGHTFACE_ROOT=/home/kyc/.insightface

# Dépendances système d'exécution :
#   libgl1/libglib2.0-0 : OpenCV headless
#   libgomp1            : OpenMP (torch)
#   ffmpeg              : décodage vidéo liveness (imageio/pyav)
#   tesseract-ocr       : moteur OCR (CNI via pytesseract, MRZ via PassportEye)
#   tesseract-ocr-fra   : langpack français — REQUIS par KYC_TESSERACT_LANG
#     ("fra+eng" par défaut). Sans lui le moteur texte se marque indisponible
#     au boot et /v1/ocr renvoie 503 sur les CNI.
#   curl                : HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        ffmpeg \
        tesseract-ocr \
        tesseract-ocr-fra \
        tesseract-ocr-eng \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copie des paquets Python compilés/installés depuis le builder.
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /srv

# Utilisateur non-root + arborescence de caches.
RUN useradd --create-home --home-dir /home/kyc --uid 10001 kyc \
    && mkdir -p /tmp/kyc-inference /home/kyc/.insightface \
    && chown -R kyc:kyc /srv /tmp/kyc-inference /home/kyc

# Code applicatif + poids vendorisés (MiniFASNet + détecteur caffe).
COPY --chown=kyc:kyc app ./app
COPY --chown=kyc:kyc models ./models
COPY --chown=kyc:kyc download_weights.py ./

USER kyc

# Baking des poids DANS l'image (télécharge InsightFace, vérifie MiniFASNet).
# Échoue le build si un téléchargement échoue.
# KYC_BAKE_ENGINES : build-only. Défaut = ocr,face (+ liveness vendorisé via
# COPY). Tesseract n'a aucun poids à télécharger (les langpacks viennent d'apt) :
# l'étape "ocr" VÉRIFIE la présence du binaire et des langpacks, pour que le
# build échoue ici plutôt que de livrer une image qui renvoie 503 en prod.
ARG KYC_BAKE_ENGINES=ocr,face
RUN KYC_BAKE_ENGINES="${KYC_BAKE_ENGINES}" python download_weights.py

EXPOSE 8080

# Cloud Run ignore ce HEALTHCHECK (il a le sien), mais utile en local/compose.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/healthz" || exit 1

# Cloud Run injecte PORT=8080. Forme shell -> substitution de ${PORT}. `exec`
# remplace le shell pour que uvicorn reçoive bien les signaux (SIGTERM).
# 1 worker : les moteurs (PaddleOCR/torch) ne sont pas thread-safe -> scaler par
# réplicas / instances Cloud Run.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]

# ----------------------------------------------------------------------------
# Variante GPU (indicative — ne pas décommenter tel quel) :
#   base builder+runtime = nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04
#   requirements-gpu : paddlepaddle-gpu, onnxruntime-gpu, torch (index CUDA)
#   docker run --gpus all -e KYC_PADDLE_USE_GPU=true ...
# ----------------------------------------------------------------------------
