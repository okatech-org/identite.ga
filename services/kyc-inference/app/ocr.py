"""Moteur OCR : Tesseract (fra/eng) + parsing MRZ ICAO 9303 pour les passeports.

Deux chemins d'extraction, INDÉPENDANTS l'un de l'autre :
  * documentType == "passport" -> lecture de la MRZ (zone lisible par machine)
    via PassportEye/mrz. Fiable et normalisé (ICAO 9303), checksums vérifiables.
  * autres documents (CNI gabonaise, etc.) -> OCR plein texte Tesseract puis
    extraction best-effort par heuristiques de layout.

Pourquoi Tesseract et pas PaddleOCR : paddle segfault (SIGSEGV, exit 139 — non
rattrapable en Python, ça tue le worker) à l'instanciation sur l'amd64 de Cloud
Build, et ce n'est pas propre à la 2.6 — PaddleOCR 3.3 + paddlepaddle 3.0
plantent de la même façon en conteneur x86_64 (cf. PaddlePaddle/Paddle#76111,
PaddleOCR#16402, #16361). Tesseract est un binaire système stable, déjà présent
dans l'image pour PassportEye.

Dégradation gracieuse et GRANULAIRE : les deux chemins ont leur propre drapeau
de disponibilité (`mrz_ready` / `text_ready`). C'est délibéré — la MRZ ne dépend
que du binaire tesseract + PassportEye, jamais d'un langpack ni d'heuristiques
de layout. Un chemin cassé ne doit pas emporter l'autre : sinon la lecture des
passeports, entièrement normalisée, tombe pour une raison qui ne la concerne
pas (c'était le cas avec l'ancien drapeau `ready` unique piloté par PaddleOCR).

>>> À CALIBRER : le layout de la CNI gabonaise n'est pas standardisé ici. Les
>>> heuristiques `_extract_cni_gabon` ci-dessous sont un POINT DE DÉPART et
>>> doivent être ajustées avec des échantillons réels (libellés exacts, ordre
>>> des lignes, format de date local). Le seul format sourcé à ce jour est le
>>> NIP : 14 caractères alphanumériques (DGDI).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime

import numpy as np

from .config import Settings


class OcrUnavailable(RuntimeError):
    """Le chemin d'extraction requis pour ce type de document est indisponible.

    Distinct de `ValueError` (image illisible) : appelle un 503 côté API, pas
    un 422 — c'est une carence de configuration du service, pas une faute de
    l'appelant.
    """


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
    """Sonde Tesseract une fois au démarrage.

    Contrairement à PaddleOCR, il n'y a aucun modèle à charger en mémoire :
    Tesseract est un binaire invoqué par process. `load()` ne fait donc que
    vérifier la disponibilité (binaire, langpacks, PassportEye) pour que
    `/healthz` dise la vérité au lieu de le découvrir à la première requête.
    """

    settings: Settings
    _text_ready: bool = field(default=False, init=False)
    _mrz_ready: bool = field(default=False, init=False)
    _load_error: str | None = field(default=None, init=False)
    _tesseract_version: str | None = field(default=None, init=False)

    def load(self) -> None:
        errors: list[str] = []

        try:
            import pytesseract

            if self.settings.tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = self.settings.tesseract_cmd
            self._tesseract_version = str(pytesseract.get_tesseract_version())
        except Exception as exc:  # noqa: BLE001 - dégradation gracieuse
            self._load_error = f"tesseract indisponible: {type(exc).__name__}: {exc}"
            return

        # Langpacks : "fra+eng" n'est utilisable que si CHAQUE composante est
        # installée (apt tesseract-ocr-fra / -eng). Sans ça Tesseract échoue à
        # chaque appel avec un message peu lisible — autant le voir au boot.
        try:
            available = set(pytesseract.get_languages(config=""))
            wanted = [lang for lang in self.settings.tesseract_lang.split("+") if lang]
            missing = [lang for lang in wanted if lang not in available]
            if missing:
                errors.append(
                    f"langpack(s) tesseract manquant(s): {', '.join(missing)} "
                    f"(disponibles: {', '.join(sorted(available)) or 'aucun'})"
                )
            else:
                self._text_ready = True
        except Exception as exc:  # noqa: BLE001
            errors.append(f"énumération des langpacks impossible: {exc}")

        # La MRZ n'a besoin ni du langpack fra ni des heuristiques de layout :
        # PassportEye embarque sa propre config Tesseract (OCR-B).
        try:
            import passporteye  # noqa: F401

            self._mrz_ready = True
        except Exception as exc:  # noqa: BLE001
            errors.append(f"passporteye indisponible: {type(exc).__name__}: {exc}")

        self._load_error = "; ".join(errors) if errors else None

    @property
    def ready(self) -> bool:
        """Au moins un chemin d'extraction est utilisable."""
        return self._text_ready or self._mrz_ready

    @property
    def text_ready(self) -> bool:
        return self._text_ready

    @property
    def mrz_ready(self) -> bool:
        return self._mrz_ready

    def capabilities(self) -> dict[str, bool]:
        return {"ocr_text": self._text_ready, "ocr_mrz": self._mrz_ready}

    @property
    def load_error(self) -> str | None:
        return self._load_error

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
        doc = document_type.strip().lower()

        if doc == "passport":
            if self._mrz_ready:
                # La MRZ se trouve en bas du recto (ou de la page d'identité).
                mrz_result = self._try_parse_mrz(front_bytes)
                if mrz_result is not None:
                    return mrz_result
                # Repli : OCR plein texte si la MRZ n'est pas lisible.
            if not self._text_ready:
                raise OcrUnavailable(
                    "Lecture MRZ impossible et OCR plein texte indisponible "
                    f"({self._load_error or 'raison inconnue'})."
                )
        elif not self._text_ready:
            raise OcrUnavailable(
                f"OCR plein texte indisponible ({self._load_error or 'raison inconnue'})."
            )

        lines = self._ocr_lines(front_bytes)
        if back_bytes is not None:
            lines += self._ocr_lines(back_bytes)

        fields, confidence = self._extract_cni_gabon(lines)
        # docAuthentic : AUCUN contrôle d'authenticité documentaire n'est
        # possible ici (pas d'UV, pas d'hologramme, pas de puce sur une simple
        # photo). On ne renvoie donc PAS un signal d'authenticité fabriqué à
        # partir de "les champs sont remplis" : ce serait affirmer au backend
        # quelque chose qu'on n'a pas vérifié. Seul le chemin MRZ peut valoir
        # authenticité (checksums ICAO 9303) — cf. `_try_parse_mrz`.
        return OcrResult(confidence=confidence, fields=fields, doc_authentic=False)

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

        `lines` : liste de (texte, score_confiance 0..1) fournie par Tesseract.

        >>> CALIBRATION REQUISE : les libellés et l'ordre ci-dessous sont
        >>> supposés. Ajuster avec des CNI gabonaises réelles :
        >>>   - libellés exacts ("Nom", "Prénom(s)", "Né(e) le", "N°", ...)
        >>>   - format de date imprimé (JJ/MM/AAAA vs JJ.MM.AAAA)
        >>> Seul le NIP est sourcé : 14 caractères alphanumériques (DGDI).
        """
        fields = _empty_required_fields()
        texts = [t for t, _ in lines]
        scores = [s for _, s in lines]

        # Confiance globale = moyenne des scores de lignes (0 si vide).
        confidence = float(np.mean(scores)) if scores else 0.0

        # --- Date de naissance ---
        # D'abord par libellé. En repli, la PLUS ANCIENNE date de la carte : une
        # CNI porte aussi une date de délivrance et une date d'expiration, tous
        # deux postérieurs à la naissance. Prendre "la première date rencontrée"
        # (ancien comportement) renvoyait la date de délivrance dès qu'elle
        # était imprimée avant l'état civil, ce qui est le cas usuel.
        dob = _labelled_date(texts, ("ne(e) le", "né(e) le", "nee le", "né le", "ne le", "date de naissance", "naissance"))
        if not dob:
            dob = _earliest_date_iso(texts)
        if dob:
            fields["dateOfBirth"] = dob

        # --- Numéro de document ---
        # Le NIP gabonais fait 14 caractères alphanumériques : on le cherche en
        # priorité sous cette forme, et on ne retombe sur l'heuristique
        # "plus long token dense" que s'il est absent (carte d'un ancien
        # millésime, OCR partiel).
        doc_number = _find_nip(texts) or _guess_document_number(texts)
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
        """OCR plein texte, regroupé par ligne avec une confiance moyenne.

        `image_to_data` (et non `image_to_string`) : on a besoin des confiances
        par mot pour produire un score global honnête — c'est ce score qui
        décide de l'auto-approbation côté backend, une valeur inventée y serait
        directement nuisible.
        """
        import pytesseract
        from pytesseract import Output

        image = self._preprocess(self._decode_image(image_bytes))
        data = pytesseract.image_to_data(
            image,
            lang=self.settings.tesseract_lang,
            config=f"--psm {self.settings.tesseract_psm}",
            output_type=Output.DICT,
        )

        # Regroupement par ligne physique : Tesseract numérote (bloc, paragraphe,
        # ligne) — la concaténation naïve de tous les mots perdrait la structure
        # dont dépendent les heuristiques "valeur après libellé".
        grouped: dict[tuple[int, int, int], list[tuple[str, float]]] = {}
        for i, word in enumerate(data.get("text", [])):
            text = (word or "").strip()
            if not text:
                continue
            try:
                conf = float(data["conf"][i])
            except (KeyError, IndexError, TypeError, ValueError):
                continue
            if conf < 0:  # -1 = pas de confiance (séparateur de bloc)
                continue
            key = (
                int(data["block_num"][i]),
                int(data["par_num"][i]),
                int(data["line_num"][i]),
            )
            grouped.setdefault(key, []).append((text, conf / 100.0))

        lines: list[tuple[str, float]] = []
        for key in sorted(grouped):
            words = grouped[key]
            text = " ".join(w for w, _ in words)
            confidence = float(np.mean([c for _, c in words]))
            lines.append((text, confidence))
        return lines

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Pré-traitement minimal orienté carte d'identité.

        Tesseract est nettement plus sensible que PaddleOCR à la résolution et
        au contraste : sur une photo de CNI prise au téléphone, sauter cette
        étape fait chuter la confiance moyenne bien en dessous du seuil
        d'auto-approbation, donc envoie tout en revue manuelle.
        """
        import cv2

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Tesseract vise ~300 DPI : on agrandit les captures trop petites.
        min_width = self.settings.tesseract_min_width
        height, width = gray.shape[:2]
        if width < min_width:
            scale = min_width / float(width)
            gray = cv2.resize(
                gray,
                (min_width, int(height * scale)),
                interpolation=cv2.INTER_CUBIC,
            )

        # CLAHE plutôt qu'un seuillage global : les CNI photographiées ont
        # presque toujours un éclairage inégal (reflet, ombre portée), qu'un
        # seuil unique transforme en pans de blanc ou de noir.
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(gray)

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

# NIP gabonais : 14 caractères alphanumériques (source DGDI). Utilisé pour
# reconnaître le numéro porté par la carte sans dépendre du libellé imprimé.
_NIP_PATTERN = re.compile(r"(?=.*\d)[A-Z0-9]{14}")


def _all_dates_iso(texts: list[str]) -> list[str]:
    """Toutes les dates plausibles, en ISO, dans l'ordre de lecture."""
    found: list[str] = []
    for text in texts:
        for pattern in _DATE_PATTERNS:
            for m in pattern.finditer(text):
                groups = m.groups()
                try:
                    if len(groups[0]) == 4:  # AAAA-MM-JJ
                        year, month, day = groups
                    else:  # JJ/MM/AAAA
                        day, month, year = groups
                    found.append(datetime(int(year), int(month), int(day)).strftime("%Y-%m-%d"))
                except ValueError:
                    continue
    return found


def _earliest_date_iso(texts: list[str]) -> str:
    """La plus ancienne date lue — meilleur candidat "naissance" que la première.

    Sur une CNI, la naissance précède toujours la délivrance et l'expiration :
    l'ordre chronologique est un invariant du document, l'ordre d'impression
    non.
    """
    dates = _all_dates_iso(texts)
    return min(dates) if dates else ""


def _labelled_date(texts: list[str], labels: tuple[str, ...]) -> str:
    """Première date trouvée sur la ligne d'un libellé, ou la ligne suivante."""
    for idx, text in enumerate(texts):
        lowered = text.lower()
        if not any(label in lowered for label in labels):
            continue
        window = [text]
        if idx + 1 < len(texts):
            window.append(texts[idx + 1])
        dates = _all_dates_iso(window)
        if dates:
            return dates[0]
    return ""


def _find_nip(texts: list[str]) -> str:
    """Cherche un NIP : 14 caractères alphanumériques, au moins un chiffre.

    Tesseract coupe fréquemment une suite de caractères en plusieurs tokens
    ("A1B2 C3D4 E5F6 G7"), donc on tente aussi la concaténation de tokens
    consécutifs. Contrainte pour éviter les faux positifs par recollage
    accidentel ("NOM MBA 12345678" ne doit PAS donner un NIP) : quand plusieurs
    tokens sont joints, chacun doit lui-même porter un chiffre.
    """
    for text in texts:
        tokens = re.findall(r"[A-Z0-9]+", text.upper())
        for start in range(len(tokens)):
            joined = ""
            for offset, token in enumerate(tokens[start:]):
                if offset > 0 and not any(c.isdigit() for c in token):
                    break
                joined += token
                if len(joined) > 14:
                    break
                if len(joined) == 14 and _NIP_PATTERN.fullmatch(joined):
                    return joined
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
