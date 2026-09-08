"""Face match : InsightFace (pack `buffalo_l`, embeddings ArcFace).

Pipeline :
  1. détecter le visage sur le selfie et sur la photo du document,
  2. extraire l'embedding ArcFace (512-d, normalisé) de chaque visage,
  3. calculer la similarité cosinus,
  4. normaliser en score 0..1 exposé au backend.

Dégradation gracieuse : si le pack de modèles InsightFace n'est pas présent,
le moteur reste `ready=False` et les routes renvoient 503.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from .config import Settings


class NoFaceDetected(Exception):
    """Aucun visage détecté sur une des images -> 422 côté route."""


@dataclass(frozen=True)
class FaceMatchResult:
    """Score de correspondance + empreinte du selfie.

    `score` est normalisé dans [0, 1] (cf. `_normalize_cosine`) tandis que
    `selfie_embedding` est le vecteur ArcFace brut, L2-normalisé. Les deux
    n'ont pas la même échelle : un seuil calibré sur l'un ne vaut RIEN sur
    l'autre. La similarité entre deux embeddings est un cosinus dans [-1, 1].
    """

    score: float
    selfie_embedding: list[float]
    model_version: str


@dataclass
class FaceMatchEngine:
    settings: Settings
    _app: object | None = field(default=None, init=False, repr=False)
    _ready: bool = field(default=False, init=False)
    _load_error: str | None = field(default=None, init=False)

    def load(self) -> None:
        try:
            from insightface.app import FaceAnalysis

            providers = (
                ["CUDAExecutionProvider", "CPUExecutionProvider"]
                if self.settings.use_gpu
                else ["CPUExecutionProvider"]
            )
            app = FaceAnalysis(
                name=self.settings.insightface_model_pack,
                root=self.settings.insightface_root,
                providers=providers,
            )
            # ctx_id=-1 => CPU. det_size : compromis vitesse/rappel.
            app.prepare(ctx_id=0 if self.settings.use_gpu else -1, det_size=(640, 640))
            self._app = app
            self._ready = True
        except Exception as exc:  # noqa: BLE001
            self._app = None
            self._ready = False
            self._load_error = f"{type(exc).__name__}: {exc}"

    @property
    def ready(self) -> bool:
        return self._ready

    def _largest_face_embedding(self, image_bytes: bytes) -> np.ndarray:
        image = _decode_image(image_bytes)
        assert self._app is not None
        faces = self._app.get(image)  # type: ignore[attr-defined]
        if not faces:
            raise NoFaceDetected("Aucun visage détecté.")
        # Sur un document/selfie on prend le plus grand visage (le sujet principal).
        face = max(faces, key=lambda f: _bbox_area(f.bbox))
        embedding = np.asarray(face.normed_embedding, dtype=np.float32)
        return embedding

    def compare(self, *, selfie_bytes: bytes, doc_face_bytes: bytes) -> float:
        """Renvoie `faceMatch` normalisé dans [0, 1]."""
        return self.compare_with_embedding(
            selfie_bytes=selfie_bytes, doc_face_bytes=doc_face_bytes
        ).score

    def compare_with_embedding(
        self, *, selfie_bytes: bytes, doc_face_bytes: bytes
    ) -> "FaceMatchResult":
        """Comme `compare`, mais expose aussi l'empreinte du **selfie**.

        L'empreinte rendue est celle du selfie, jamais celle du document : la
        galerie de déduplication côté backend doit contenir des captures
        vivantes, pas des photographies de photographies, dont les embeddings
        sont dégradés par l'impression et la reprise de vue.

        `compare()` reste la surface historique, inchangée — les appelants qui
        ne veulent que le score n'ont rien à modifier.
        """
        if not self._ready:
            raise RuntimeError(
                "Moteur face match indisponible (pack InsightFace non chargé)."
            )
        emb_selfie = self._largest_face_embedding(selfie_bytes)
        emb_doc = self._largest_face_embedding(doc_face_bytes)
        cosine = _cosine_similarity(emb_selfie, emb_doc)
        return FaceMatchResult(
            score=_normalize_cosine(cosine),
            selfie_embedding=[float(x) for x in emb_selfie],
            model_version=self.settings.insightface_model_pack,
        )


# --------------------------------------------------------------------------- #
# Helpers purs (testables sans modèle)
# --------------------------------------------------------------------------- #
def _bbox_area(bbox: np.ndarray) -> float:
    x1, y1, x2, y2 = bbox[:4]
    return float(max(0.0, x2 - x1) * max(0.0, y2 - y1))


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Similarité cosinus. Les embeddings ArcFace `normed_embedding` sont déjà
    L2-normalisés, mais on renormalise par prudence."""
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na == 0.0 or nb == 0.0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def _normalize_cosine(cosine: float) -> float:
    """Mappe la similarité cosinus (-1..1) vers un score 0..1.

    Transformation linéaire simple (cos+1)/2. Le SEUIL de décision "même
    personne" reste `settings.face_match_threshold` appliqué sur le cosinus brut
    au niveau métier ; ici on ne fait qu'exposer un score continu au backend.
    """
    return float(max(0.0, min(1.0, (cosine + 1.0) / 2.0)))


def _decode_image(image_bytes: bytes) -> np.ndarray:
    import cv2

    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Image indécodable (format non supporté ou corrompu).")
    return image
