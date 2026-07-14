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

    # --- OCR ---
    paddle_use_gpu: bool = False
    paddle_lang: str = "fr"

    # --- Face match ---
    # Modèle InsightFace ("buffalo_l" = pack ArcFace r100 + détecteur SCRFD).
    insightface_model_pack: str = "buffalo_l"
    insightface_root: str = os.path.expanduser("~/.insightface")
    # Similarité cosinus brute (-1..1) au-dessus de laquelle on considère "même
    # personne". À CALIBRER sur un jeu de validation gabonais. 0.28 est un point
    # de départ prudent pour ArcFace/buffalo_l.
    face_match_threshold: float = 0.28

    # --- Liveness / anti-spoof ---
    # Chemin du dossier contenant les poids MiniFASNet (Silent-Face-Anti-Spoofing).
    antispoof_model_dir: str = "./models/anti_spoof"
    # Dossier du détecteur de visage caffe RetinaFace (Widerface-RetinaFace.caffemodel
    # + deploy.prototxt) utilisé par MiniFASNet pour cadrer le visage avant le crop.
    antispoof_detection_dir: str = "./models/detection"
    # Nombre de frames échantillonnées si selfieUrl est une vidéo.
    liveness_video_sample_frames: int = 8
    # Seuils sur le score "real" agrégé (0..1). À CALIBRER.
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
        timestamp_tolerance_seconds=_get_int("KYC_TIMESTAMP_TOLERANCE_SECONDS", 300),
        fetch_timeout_seconds=_get_float("KYC_FETCH_TIMEOUT_SECONDS", 15.0),
        max_download_bytes=_get_int("KYC_MAX_DOWNLOAD_BYTES", 25 * 1024 * 1024),
        allowed_asset_host_suffixes=host_suffixes,
        tmp_dir=os.getenv("KYC_TMP_DIR", "/tmp/kyc-inference"),
        paddle_use_gpu=os.getenv("KYC_PADDLE_USE_GPU", "false").lower() == "true",
        paddle_lang=os.getenv("KYC_PADDLE_LANG", "fr"),
        insightface_model_pack=os.getenv("KYC_INSIGHTFACE_PACK", "buffalo_l"),
        insightface_root=os.path.expanduser(
            os.getenv("KYC_INSIGHTFACE_ROOT", "~/.insightface")
        ),
        face_match_threshold=_get_float("KYC_FACE_MATCH_THRESHOLD", 0.28),
        antispoof_model_dir=os.getenv("KYC_ANTISPOOF_MODEL_DIR", "./models/anti_spoof"),
        antispoof_detection_dir=os.getenv("KYC_ANTISPOOF_DETECTION_DIR", "./models/detection"),
        liveness_video_sample_frames=_get_int("KYC_LIVENESS_SAMPLE_FRAMES", 8),
        liveness_real_threshold=_get_float("KYC_LIVENESS_REAL_THRESHOLD", 0.75),
        liveness_spoof_threshold=_get_float("KYC_LIVENESS_SPOOF_THRESHOLD", 0.40),
    )
