"""Anti-spoof / liveness : Silent-Face-Anti-Spoofing (MiniFASNet).

Réf. OSS : https://github.com/minivision-ai/Silent-Face-Anti-Spoofing
Le modèle prédit 3 classes : {0: fake/2D, 1: real, 2: fake/3D-mask} selon la
variante ; on agrège en un score "real" dans [0, 1].

Entrée :
  * image  -> une frame analysée directement,
  * vidéo courte -> échantillonnage de N frames (imageio), score agrégé
    (médiane) pour robustesse au bruit.

Verdict par seuils (À CALIBRER, cf. config) :
  * score >= liveness_real_threshold  -> "real"
  * score <= liveness_spoof_threshold -> "spoof"
  * sinon                             -> "uncertain"

Dégradation gracieuse : sans les poids MiniFASNet, `ready=False` -> 503.

>>> À CALIBRER : les seuils dépendent de la variante de modèle, de la caméra
>>> mobile cible et du protocole de capture (challenge actif ? passif ?).
>>> Recalibrer sur un jeu attaque/bonafide représentatif (impressions papier,
>>> replays écran, masques) avant mise en production.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

import numpy as np

from .assets import temporary_file
from .config import Settings

LivenessVerdict = Literal["real", "spoof", "uncertain"]


@dataclass
class LivenessResult:
    verdict: LivenessVerdict
    score: float  # score "real" agrégé 0..1


@dataclass
class LivenessEngine:
    settings: Settings
    _model: object | None = field(default=None, init=False, repr=False)
    _ready: bool = field(default=False, init=False)
    _load_error: str | None = field(default=None, init=False)

    def load(self) -> None:
        """Charge le(s) modèle(s) MiniFASNet depuis `antispoof_model_dir`.

        Le prédicteur MiniFASNet est vendorisé sous `app/vendor/minifasnet`
        (Silent-Face-Anti-Spoofing, Apache-2.0). Import tardif et tolérant :
        toute absence de poids/paquet -> dégradation gracieuse (`ready=False`).
        """
        try:
            import os

            model_dir = self.settings.antispoof_model_dir
            detection_dir = self.settings.antispoof_detection_dir
            weight_files = [
                f
                for f in (os.listdir(model_dir) if os.path.isdir(model_dir) else [])
                if f.endswith(".pth")
            ]
            if not weight_files:
                raise FileNotFoundError(
                    f"Dossier de poids anti-spoof vide/absent : {model_dir}"
                )
            for required in ("Widerface-RetinaFace.caffemodel", "deploy.prototxt"):
                if not os.path.isfile(os.path.join(detection_dir, required)):
                    raise FileNotFoundError(
                        f"Détecteur de visage caffe manquant : {detection_dir}/{required}"
                    )

            from .vendor.minifasnet import (  # import tardif : lourd (torch)
                AntiSpoofPredict,
                CropImage,
                parse_model_name,
            )

            predictor = AntiSpoofPredict(
                device_id=0 if self.settings.paddle_use_gpu else -1,
                detection_model_dir=detection_dir,
            )
            self._model = {
                "predictor": predictor,
                "cropper": CropImage(),
                "parse_model_name": parse_model_name,
                "model_dir": model_dir,
                "weight_files": weight_files,
            }
            self._ready = True
        except Exception as exc:  # noqa: BLE001
            self._model = None
            self._ready = False
            self._load_error = f"{type(exc).__name__}: {exc}"

    @property
    def ready(self) -> bool:
        return self._ready

    # ------------------------------------------------------------------ #
    # API publique
    # ------------------------------------------------------------------ #
    def analyze(self, *, media_bytes: bytes, is_video: bool) -> LivenessResult:
        if not self._ready:
            raise RuntimeError(
                "Moteur liveness indisponible (poids MiniFASNet non chargés)."
            )

        if is_video:
            frames = self._sample_video_frames(media_bytes)
        else:
            frames = [_decode_image(media_bytes)]

        if not frames:
            return LivenessResult(verdict="uncertain", score=0.0)

        scores = [s for s in (self._score_real(frame) for frame in frames) if s is not None]
        if not scores:
            # Aucun visage exploitable sur aucune frame -> on ne tranche pas.
            return LivenessResult(verdict="uncertain", score=0.0)
        # Médiane : robuste aux frames aberrantes (flou de bougé, clignement).
        aggregate = float(np.median(scores))
        return LivenessResult(verdict=self._verdict(aggregate), score=aggregate)

    # ------------------------------------------------------------------ #
    # Interne
    # ------------------------------------------------------------------ #
    def _score_real(self, frame: np.ndarray) -> float | None:
        """Renvoie la probabilité "real" (classe 1) pour une frame BGR.

        Reproduit le pipeline de référence Silent-Face-Anti-Spoofing :
          1. cadrage du visage (détecteur caffe RetinaFace) -> bbox,
          2. pour chaque variante MiniFASNet : crop multi-échelle (selon le
             `scale` encodé dans le nom du fichier) puis inférence,
          3. moyenne des vecteurs [fake2d, real, fake3d], on renvoie la proba
             de la classe "real".

        Renvoie None si aucun visage n'est détecté sur la frame (frame ignorée
        dans l'agrégation médiane par l'appelant).
        """
        import os

        assert self._model is not None
        predictor = self._model["predictor"]
        cropper = self._model["cropper"]
        parse_model_name = self._model["parse_model_name"]
        model_dir = self._model["model_dir"]
        weight_files = self._model["weight_files"]

        try:
            bbox = predictor.get_bbox(frame)
        except Exception:  # noqa: BLE001 - aucun visage / détecteur en échec
            return None

        prediction = np.zeros((1, 3), dtype=np.float32)
        for model_name in weight_files:
            h_input, w_input, _model_type, scale = parse_model_name(model_name)
            param = {
                "org_img": frame,
                "bbox": bbox,
                "scale": scale,
                "out_w": w_input,
                "out_h": h_input,
                "crop": scale is not None,
            }
            patch = cropper.crop(**param)
            model_path = os.path.join(model_dir, model_name)
            prediction += predictor.predict(patch, model_path)

        prediction /= len(weight_files)
        real_prob = float(prediction[0][1])
        return max(0.0, min(1.0, real_prob))

    def _sample_video_frames(self, video_bytes: bytes) -> list[np.ndarray]:
        """Échantillonne N frames réparties uniformément dans la vidéo."""
        import imageio.v3 as iio

        n = self.settings.liveness_video_sample_frames
        with temporary_file(video_bytes, self.settings, suffix=".mp4") as path:
            try:
                all_frames = iio.imread(path, plugin="pyav", index=None)
            except Exception:  # noqa: BLE001 - repli lecture frame par frame
                all_frames = np.stack(list(_iter_frames_fallback(path)))

        total = len(all_frames)
        if total == 0:
            return []
        if total <= n:
            indices = range(total)
        else:
            indices = np.linspace(0, total - 1, num=n, dtype=int)
        # imageio renvoie du RGB ; les modèles OpenCV attendent du BGR.
        return [_rgb_to_bgr(np.asarray(all_frames[i])) for i in indices]

    def _verdict(self, score: float) -> LivenessVerdict:
        if score >= self.settings.liveness_real_threshold:
            return "real"
        if score <= self.settings.liveness_spoof_threshold:
            return "spoof"
        return "uncertain"


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _iter_frames_fallback(path: str):
    import imageio.v2 as iio

    reader = iio.get_reader(path)
    try:
        for frame in reader:
            yield np.asarray(frame)
    finally:
        reader.close()


def _rgb_to_bgr(frame: np.ndarray) -> np.ndarray:
    if frame.ndim == 3 and frame.shape[2] == 3:
        return frame[:, :, ::-1].copy()
    return frame


def _decode_image(image_bytes: bytes) -> np.ndarray:
    import cv2

    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Image indécodable (format non supporté ou corrompu).")
    return image
