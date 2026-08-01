"""Configuration centralisée du microservice KYC (chargée depuis l'environnement).

Toutes les valeurs sensibles proviennent de variables d'environnement (voir
`.env.example`). Aucune valeur par défaut de secret n'est fournie : le service
refuse de démarrer si `KYC_INFERENCE_SECRET` est absent.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _get_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return float(raw)


def _get_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


@dataclass(frozen=True)
class Settings:
    """Paramètres immuables du service."""

    # --- Sécurité / auth entrante ---
    # Secret partagé HMAC-SHA256 avec le backend Convex. OBLIGATOIRE.
    inference_secret: str
    # Secret précédent, accepté en plus du courant le temps d'une rotation
    # (KYC_INFERENCE_SECRET_PREVIOUS). Vide en régime normal — cf. security.py.
    inference_secret_previous: str = ""

    # Fenêtre de tolérance sur le header X-Timestamp (secondes). > 5 min => rejet.
    timestamp_tolerance_seconds: int = 300

    # --- Récupération des images ---
    # Timeout (s) des GET HTTP vers les URLs signées Convex.
    fetch_timeout_seconds: float = 15.0
    # Taille max d'un asset téléchargé (octets) pour éviter l'épuisement mémoire.
    max_download_bytes: int = 25 * 1024 * 1024  # 25 Mo
    # Hôtes autorisés pour la récupération des assets (SSRF guard). Vide => tous.
    # Format : liste de suffixes de host séparés par des virgules,
    # ex. ".convex.cloud,.convex.site".
    allowed_asset_host_suffixes: tuple[str, ...] = field(default_factory=tuple)

    # --- Répertoire temporaire des fichiers (vidéos liveness, etc.) ---
    tmp_dir: str = "/tmp/kyc-inference"

    # --- Accélération matérielle ---
    # Partagée par InsightFace (onnxruntime) et MiniFASNet (torch). S'appelait
    # `paddle_use_gpu` : nom hérité et trompeur, aucun des deux moteurs n'a
    # jamais eu de rapport avec paddle (et paddle n'est plus dans le service).
    use_gpu: bool = False

    # --- OCR (Tesseract) ---
    # Chemin du binaire tesseract. Vide => résolution par le PATH (cas normal
    # dans l'image Docker, qui installe le paquet apt tesseract-ocr).
    tesseract_cmd: str = ""
    # Langues passées à Tesseract. "fra+eng" : la CNI gabonaise est en français
    # mais les libellés translittérés et les numéros sortent mieux avec l'anglais
    # en second. Chaque composante exige son paquet apt (tesseract-ocr-fra…).
    tesseract_lang: str = "fra+eng"
    # Page Segmentation Mode. 6 = "bloc uniforme de texte", le moins mauvais
    # défaut sur une carte cadrée. À CALIBRER avec de vrais échantillons : 11
    # ("sparse text") donne souvent de meilleurs résultats sur les cartes où les
    # champs sont dispersés autour de la photo.
    tesseract_psm: int = 6
    # Largeur minimale avant OCR : Tesseract vise ~300 DPI, une capture
    # téléphone recadrée descend souvent sous cette barre.
    tesseract_min_width: int = 1600

    # --- Face match ---
    # Modèle InsightFace ("buffalo_l" = pack ArcFace r100 + détecteur SCRFD).
    insightface_model_pack: str = "buffalo_l"
    insightface_root: str = os.path.expanduser("~/.insightface")
    # Similarité cosinus brute (-1..1) au-dessus de laquelle on considère "même
    # personne". 0.38 = milieu de la bande 0.30–0.45 documentée par InsightFace
    # pour ses packs à FMR 1e-4/1e-5 (cf. guides InsightFace, "choose face
    # recognition model and evaluate").
    #
    # À CALIBRER sur un jeu de validation gabonais — la doc InsightFace insiste
    # sur un recalcul par population : collecter les scores de paires
    # authentiques et imposteurs, fixer le FMR cible, puis
    #   threshold = np.quantile(scores_imposteurs, 1.0 - fmr_cible)
    # Surchargeable sans redéploiement via KYC_FACE_MATCH_THRESHOLD.
    face_match_threshold: float = 0.38

    # --- Liveness / anti-spoof ---
    # Chemin du dossier contenant les poids MiniFASNet (Silent-Face-Anti-Spoofing).
    antispoof_model_dir: str = "./models/anti_spoof"
    # Dossier du détecteur de visage caffe RetinaFace (Widerface-RetinaFace.caffemodel
    # + deploy.prototxt) utilisé par MiniFASNet pour cadrer le visage avant le crop.
    antispoof_detection_dir: str = "./models/detection"
    # Nombre de frames échantillonnées si selfieUrl est une vidéo.
    liveness_video_sample_frames: int = 8
    # Seuils sur le score "real" agrégé (0..1). À CALIBRER : l'upstream
    # Silent-Face-Anti-Spoofing ne publie aucun seuil de référence (son démo
    # prend l'argmax des 3 classes, pas un seuil sur la proba "real"), donc ces
    # valeurs n'ont pas de source à citer — elles ne sont défendables qu'avec un
    # jeu de validation local (vrais selfies + tentatives papier/écran).
    # Surchargeables via KYC_LIVENESS_REAL_THRESHOLD / _SPOOF_THRESHOLD.
    liveness_real_threshold: float = 0.75
    liveness_spoof_threshold: float = 0.40

    @property
    def allowed_hosts_enabled(self) -> bool:
        return len(self.allowed_asset_host_suffixes) > 0


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    secret = os.getenv("KYC_INFERENCE_SECRET", "").strip()
    if not secret:
        raise RuntimeError(
            "KYC_INFERENCE_SECRET est manquant. Le service refuse de démarrer "
            "sans secret HMAC partagé (voir .env.example)."
        )

    host_suffixes_raw = os.getenv("ALLOWED_ASSET_HOST_SUFFIXES", "").strip()
    host_suffixes = tuple(
        s.strip() for s in host_suffixes_raw.split(",") if s.strip()
    )

    return Settings(
        inference_secret=secret,
        inference_secret_previous=os.getenv(
            "KYC_INFERENCE_SECRET_PREVIOUS", ""
        ).strip(),
        timestamp_tolerance_seconds=_get_int("KYC_TIMESTAMP_TOLERANCE_SECONDS", 300),
        fetch_timeout_seconds=_get_float("KYC_FETCH_TIMEOUT_SECONDS", 15.0),
        max_download_bytes=_get_int("KYC_MAX_DOWNLOAD_BYTES", 25 * 1024 * 1024),
        allowed_asset_host_suffixes=host_suffixes,
        tmp_dir=os.getenv("KYC_TMP_DIR", "/tmp/kyc-inference"),
        # KYC_PADDLE_USE_GPU accepté en repli : ancien nom de la même option.
        use_gpu=(
            os.getenv("KYC_USE_GPU") or os.getenv("KYC_PADDLE_USE_GPU") or "false"
        ).strip().lower()
        == "true",
        tesseract_cmd=os.getenv("KYC_TESSERACT_CMD", "").strip(),
        tesseract_lang=os.getenv("KYC_TESSERACT_LANG", "fra+eng"),
        tesseract_psm=_get_int("KYC_TESSERACT_PSM", 6),
        tesseract_min_width=_get_int("KYC_TESSERACT_MIN_WIDTH", 1600),
        insightface_model_pack=os.getenv("KYC_INSIGHTFACE_PACK", "buffalo_l"),
        insightface_root=os.path.expanduser(
            os.getenv("KYC_INSIGHTFACE_ROOT", "~/.insightface")
        ),
        face_match_threshold=_get_float("KYC_FACE_MATCH_THRESHOLD", 0.38),
        antispoof_model_dir=os.getenv("KYC_ANTISPOOF_MODEL_DIR", "./models/anti_spoof"),
        antispoof_detection_dir=os.getenv("KYC_ANTISPOOF_DETECTION_DIR", "./models/detection"),
        liveness_video_sample_frames=_get_int("KYC_LIVENESS_SAMPLE_FRAMES", 8),
        liveness_real_threshold=_get_float("KYC_LIVENESS_REAL_THRESHOLD", 0.75),
        liveness_spoof_threshold=_get_float("KYC_LIVENESS_SPOOF_THRESHOLD", 0.40),
    )
