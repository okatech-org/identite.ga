"""Moteur OCR : PaddleOCR (latin/fr) + parsing MRZ pour les passeports.

Deux chemins d'extraction :
  * documentType == "passport" -> lecture de la MRZ (zone lisible par machine)
    via PassportEye/mrz. Fiable et normalisé (ICAO 9303).
  * autres documents (CNI gabonaise, etc.) -> OCR plein texte PaddleOCR puis
    extraction best-effort par heuristiques de layout.

>>> À CALIBRER : le layout de la CNI gabonaise n'est pas standardisé ici. Les
>>> heuristiques `_extract_cni_gabon` ci-dessous sont un POINT DE DÉPART et
>>> doivent être ajustées avec des échantillons réels (positions des libellés,
>>> ordre des lignes, format du numéro de CNI, format de date local).

Dégradation gracieuse : si PaddleOCR (poids/paquet) n'est pas disponible, le
moteur se marque `ready=False`. Les routes renvoient alors 503.

>>> ÉTAT ACTUEL — OCR TEMPORAIREMENT DÉSACTIVÉ : `paddlepaddle`/`paddleocr` sont
>>> retirés de requirements.txt (paddle 2.6 segfault, exit 139, à l'instanciation
>>> sur l'amd64 de Cloud Build). L'import ci-dessous est paresseux (dans `load`)
>>> et tolérant : sans le paquet, `ImportError` est rattrapée, le moteur reste
>>> `ready=False` et `/v1/ocr` renvoie un 503 propre (jamais de segfault worker).
>>> Réactivation : Tesseract, ou un paddle stabilisé (+ calibration CNI gabonaise).
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from datetime import datetime

import numpy as np

from .config import Settings


@dataclass
class OcrResult:
    confidence: float
    fields: dict[str, str]
    doc_authentic: bool


# Champs toujours présents dans la réponse (contrat backend).
_REQUIRED_FIELD_KEYS = ("firstName", "lastName", "dateOfBirth", "documentNumber")


def _empty_required_fields() -> dict[str, str]:
    return {key: "" for key in _REQUIRED_FIELD_KEYS}


@dataclass
class OcrEngine:
    """Charge PaddleOCR une fois au démarrage. Thread-hostile : à protéger par un
    worker unique ou un verrou si concurrence forte (PaddleOCR n'est pas
    réentrant). En prod on privilégiera un pool de process uvicorn."""

    settings: Settings
    _ocr: object | None = field(default=None, init=False, repr=False)
    _ready: bool = field(default=False, init=False)
    _load_error: str | None = field(default=None, init=False)

    def load(self) -> None:
        try:
            from paddleocr import PaddleOCR  # import tardif : lourd

            self._ocr = PaddleOCR(
                use_angle_cls=True,
                lang=self.settings.paddle_lang,
                use_gpu=self.settings.paddle_use_gpu,
                show_log=False,
            )
            self._ready = True
        except Exception as exc:  # noqa: BLE001 - on veut une dégradation gracieuse
            self._ocr = None
            self._ready = False
            self._load_error = f"{type(exc).__name__}: {exc}"

    @property
    def ready(self) -> bool:
        return self._ready

    # ------------------------------------------------------------------ #
    # API publique
    # ------------------------------------------------------------------ #
    def run(
        self,
        *,
        document_type: str,
        front_bytes: bytes,
        back_bytes: bytes | None,
    ) -> OcrResult:
        if not self._ready:
            raise RuntimeError(
                "Moteur OCR indisponible (poids/paquet PaddleOCR non chargés)."
            )

        doc = document_type.strip().lower()
        if doc == "passport":
            # La MRZ se trouve en bas du recto (ou de la page d'identité).
            mrz_result = self._try_parse_mrz(front_bytes)
            if mrz_result is not None:
                return mrz_result
            # Repli : OCR plein texte si la MRZ n'est pas lisible.

        lines = self._ocr_lines(front_bytes)
        if back_bytes is not None:
            lines += self._ocr_lines(back_bytes)

        fields, confidence = self._extract_cni_gabon(lines)
        # docAuthentic : pas de contrôle de sécurité documentaire fort ici (pas
        # d'UV/hologramme sur une simple photo). On se contente d'un signal
        # heuristique : présence des champs clés. À REMPLACER par un vrai modèle
        # d'authenticité documentaire si disponible.
        doc_authentic = bool(fields.get("documentNumber")) and bool(
            fields.get("lastName")
        )
        return OcrResult(confidence=confidence, fields=fields, doc_authentic=doc_authentic)

    # ------------------------------------------------------------------ #
    # MRZ (passeport)
    # ------------------------------------------------------------------ #
    def _try_parse_mrz(self, image_bytes: bytes) -> OcrResult | None:
        """Tente de lire la MRZ via PassportEye. Renvoie None si illisible."""
        try:
            from passporteye import read_mrz
        except Exception:  # noqa: BLE001
            return None

        with self._as_temp_image(image_bytes) as path:
            try:
                mrz = read_mrz(path)
            except Exception:  # noqa: BLE001
                return None

        if mrz is None:
            return None

        data = mrz.to_dict()
        # PassportEye fournit un `valid_score` (0..100) agrégé des checksums.
        valid_score = float(data.get("valid_score", 0)) / 100.0

        fields = _empty_required_fields()
        fields["firstName"] = _clean_mrz_name(data.get("names", ""))
        fields["lastName"] = _clean_mrz_name(data.get("surname", ""))
        fields["dateOfBirth"] = _mrz_date_to_iso(data.get("date_of_birth", ""))
        fields["documentNumber"] = str(data.get("number", "")).replace("<", "").strip()
        fields["nationality"] = str(data.get("nationality", "")).strip()
        fields["sex"] = str(data.get("sex", "")).strip()
        fields["expiryDate"] = _mrz_date_to_iso(data.get("expiration_date", ""))
        fields["issuingCountry"] = str(data.get("country", "")).strip()

        # Authenticité MRZ : basée sur la validité des checksums ICAO 9303.
        doc_authentic = bool(data.get("valid_score", 0) >= 50)
        return OcrResult(confidence=valid_score, fields=fields, doc_authentic=doc_authentic)

    # ------------------------------------------------------------------ #
    # CNI gabonaise (OCR best-effort)  >>> À CALIBRER <<<
    # ------------------------------------------------------------------ #
    def _extract_cni_gabon(
        self, lines: list[tuple[str, float]]
    ) -> tuple[dict[str, str], float]:
        """Extraction heuristique des champs depuis les lignes OCR.

        `lines` : liste de (texte, score_confiance) fournie par PaddleOCR.

        >>> CALIBRATION REQUISE : les libellés, l'ordre et les formats ci-dessous
        >>> sont supposés. Ajuster avec des CNI gabonaises réelles :
        >>>   - libellés exacts ("Nom", "Prénom(s)", "Né(e) le", "N°", ...)
        >>>   - format du numéro de carte
        >>>   - format de date imprimé (JJ/MM/AAAA vs JJ.MM.AAAA)
        """
        fields = _empty_required_fields()
        texts = [t for t, _ in lines]
        scores = [s for _, s in lines]

        # Confiance globale = moyenne des scores de lignes (0 si vide).
        confidence = float(np.mean(scores)) if scores else 0.0

        # --- Dates : première date plausible = date de naissance (heuristique) ---
        date_iso = _first_date_iso(texts)
        if date_iso:
            fields["dateOfBirth"] = date_iso

        # --- Numéro de document : plus long token alphanumérique dense ---
        doc_number = _guess_document_number(texts)
        if doc_number:
            fields["documentNumber"] = doc_number

        # --- Nom / prénom par libellés (à calibrer) ---
        label_map = {
            "lastName": ("nom", "surname"),
            "firstName": ("prenom", "prénom", "prenoms", "prénoms", "given"),
        }
        for target, labels in label_map.items():
            value = _value_after_label(texts, labels)
            if value:
                fields[target] = value

        return fields, confidence

    # ------------------------------------------------------------------ #
    # Bas niveau OCR
    # ------------------------------------------------------------------ #
    def _ocr_lines(self, image_bytes: bytes) -> list[tuple[str, float]]:
        image = self._decode_image(image_bytes)
        assert self._ocr is not None
        raw = self._ocr.ocr(image, cls=True)  # type: ignore[attr-defined]
        lines: list[tuple[str, float]] = []
        # PaddleOCR renvoie [[ [box, (text, score)], ... ]] (une entrée par image).
        for page in raw or []:
            for entry in page or []:
                try:
                    text, score = entry[1]
                    lines.append((str(text), float(score)))
                except (IndexError, TypeError, ValueError):
                    continue
        return lines

    @staticmethod
    def _decode_image(image_bytes: bytes) -> np.ndarray:
        import cv2

        buffer = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Image indécodable (format non supporté ou corrompu).")
        return image

    @staticmethod
    def _as_temp_image(image_bytes: bytes):
        import contextlib
        import os
        import tempfile

        @contextlib.contextmanager
        def _ctx():
            fd, path = tempfile.mkstemp(suffix=".jpg")
            try:
                with os.fdopen(fd, "wb") as fh:
                    fh.write(image_bytes)
                yield path
            finally:
                with contextlib.suppress(FileNotFoundError):
                    os.remove(path)

        return _ctx()


# --------------------------------------------------------------------------- #
# Helpers d'extraction (purs, testables)
# --------------------------------------------------------------------------- #
_DATE_PATTERNS = (
    re.compile(r"\b(\d{2})[/.\-](\d{2})[/.\-](\d{4})\b"),  # JJ/MM/AAAA
    re.compile(r"\b(\d{4})[/.\-](\d{2})[/.\-](\d{2})\b"),  # AAAA-MM-JJ
)


def _first_date_iso(texts: list[str]) -> str:
    for text in texts:
        for pattern in _DATE_PATTERNS:
            m = pattern.search(text)
            if not m:
                continue
            groups = m.groups()
            try:
                if len(groups[0]) == 4:  # AAAA-MM-JJ
                    year, month, day = groups
                else:  # JJ/MM/AAAA
                    day, month, year = groups
                dt = datetime(int(year), int(month), int(day))
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
    return ""


def _guess_document_number(texts: list[str]) -> str:
    best = ""
    for text in texts:
        # Tokens alphanumériques d'au moins 6 caractères, majoritairement chiffrés.
        for token in re.findall(r"[A-Z0-9]{6,}", text.upper()):
            digit_ratio = sum(c.isdigit() for c in token) / len(token)
            if digit_ratio >= 0.5 and len(token) > len(best):
                best = token
    return best


def _value_after_label(texts: list[str], labels: tuple[str, ...]) -> str:
    """Renvoie la valeur associée à un libellé.

    Cherche le libellé soit sur la même ligne ("Nom : DUPONT"), soit sur la
    ligne suivante.
    """
    normalized = [t.strip() for t in texts]
    for idx, text in enumerate(normalized):
        lowered = text.lower()
        for label in labels:
            if label in lowered:
                # Même ligne : après ':' ou après le libellé.
                after = re.split(r"[:：]", text, maxsplit=1)
                if len(after) == 2 and after[1].strip():
                    return _clean_name(after[1])
                # Ligne suivante.
                if idx + 1 < len(normalized) and normalized[idx + 1]:
                    return _clean_name(normalized[idx + 1])
    return ""


def _clean_name(value: str) -> str:
    return re.sub(r"[^A-Za-zÀ-ÿ' \-]", "", value).strip()


def _clean_mrz_name(value: str) -> str:
    return value.replace("<", " ").strip().title()


def _mrz_date_to_iso(value: str) -> str:
    """Convertit une date MRZ 'AAMMJJ' (6 chiffres) en 'AAAA-MM-JJ'.

    Règle de siècle ICAO simplifiée : AA > année courante+ marge => 19xx,
    sinon 20xx. À affiner selon le contexte (dates de naissance vs expiration).
    """
    digits = re.sub(r"\D", "", value)
    if len(digits) != 6:
        return ""
    yy, mm, dd = int(digits[0:2]), int(digits[2:4]), int(digits[4:6])
    current_yy = datetime.now().year % 100
    century = 1900 if yy > current_yy + 20 else 2000
    try:
        return datetime(century + yy, mm, dd).strftime("%Y-%m-%d")
    except ValueError:
        return ""


# Import utilisé uniquement pour le type hint io (BytesIO) dans d'éventuelles
# extensions ; conservé pour clarté d'API.
_ = io
