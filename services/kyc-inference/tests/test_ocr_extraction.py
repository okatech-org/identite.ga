"""Heuristiques d'extraction OCR — helpers purs, sans binaire tesseract.

Ces tests encodent les invariants MÉTIER de l'extraction, pas le comportement
de Tesseract :

  * la date de naissance ne doit jamais être confondue avec la date de
    délivrance ou d'expiration — un mauvais choix ici produit une identité
    fausse dans un registre national, pas juste un champ mal rempli ;
  * le numéro de document doit privilégier le format NIP officiel (14
    caractères alphanumériques, source DGDI) sur une heuristique de longueur.

>>> HARNAIS DE CALIBRATION : `CNI_SAMPLES` ci-dessous est volontairement vide.
>>> Dès qu'on dispose de CNI gabonaises réelles, ajouter une entrée par
>>> échantillon (lignes OCR observées -> champs attendus) et ajuster les
>>> libellés dans `app/ocr.py::_extract_cni_gabon` jusqu'à ce que la suite
>>> passe. C'est le seul moyen de sortir du statut "heuristique supposée".
"""

from __future__ import annotations

import pytest

from app.config import Settings
from app.ocr import (
    OcrEngine,
    _earliest_date_iso,
    _find_nip,
    _labelled_date,
)


def _engine() -> OcrEngine:
    return OcrEngine(settings=Settings(inference_secret="x"))


def _lines(*texts: str) -> list[tuple[str, float]]:
    """Lignes OCR avec une confiance uniforme (le score n'est pas le sujet ici)."""
    return [(t, 0.9) for t in texts]


# --------------------------------------------------------------------------- #
# Dates
# --------------------------------------------------------------------------- #
def test_earliest_date_wins_over_reading_order():
    """La naissance précède toujours délivrance et expiration.

    Cas réel typique : le numéro et la date de délivrance sont imprimés en haut
    de la carte, l'état civil en dessous. L'ancienne heuristique "première date
    rencontrée" renvoyait donc la délivrance comme date de naissance.
    """
    texts = ["Delivree le 12/03/2024", "Expire le 12/03/2034", "Nee le 05/07/1991"]
    assert _earliest_date_iso(texts) == "1991-07-05"


def test_labelled_date_beats_position():
    texts = ["Delivree le 12/03/2024", "Date de naissance", "05/07/1991"]
    assert _labelled_date(texts, ("date de naissance", "naissance")) == "1991-07-05"


def test_labelled_date_same_line():
    texts = ["Ne(e) le : 05/07/1991"]
    assert _labelled_date(texts, ("ne(e) le", "né(e) le")) == "1991-07-05"


def test_date_extraction_ignores_impossible_dates():
    """32/13/2024 n'est pas une date : ne pas la renvoyer plutôt que crasher."""
    assert _earliest_date_iso(["32/13/2024", "05/07/1991"]) == "1991-07-05"


@pytest.mark.parametrize("separator", ["/", ".", "-"])
def test_date_separators_tolerated(separator: str):
    """Le séparateur imprimé varie selon le millésime de la carte."""
    texts = [f"05{separator}07{separator}1991"]
    assert _earliest_date_iso(texts) == "1991-07-05"


# --------------------------------------------------------------------------- #
# Numéro de document / NIP
# --------------------------------------------------------------------------- #
def test_nip_14_alphanumeric_recognised():
    """NIP = 14 caractères alphanumériques (source DGDI)."""
    assert _find_nip(["NIP A1B2C3D4E5F6G7"]) == "A1B2C3D4E5F6G7"


def test_nip_preferred_over_longer_dense_token():
    """Un token plus long ne doit pas éclipser le NIP.

    L'heuristique historique retenait le plus long token alphanumérique dense :
    sur une carte portant aussi un numéro de série ou un code-barres, elle
    renvoyait ce dernier comme numéro de document.
    """
    engine = _engine()
    fields, _ = engine._extract_cni_gabon(
        _lines("SERIE 9988776655443322110", "NIP A1B2C3D4E5F6G7")
    )
    assert fields["documentNumber"] == "A1B2C3D4E5F6G7"


def test_falls_back_when_no_nip_present():
    """Ancien millésime sans NIP : on ne renvoie pas une chaîne vide."""
    engine = _engine()
    fields, _ = engine._extract_cni_gabon(_lines("Carte N 1234567"))
    assert fields["documentNumber"] == "1234567"


def test_nip_tolerates_ocr_spacing():
    """Tesseract insère souvent des espaces dans les suites de caractères."""
    assert _find_nip(["A1B2 C3D4 E5F6 G7"]) == "A1B2C3D4E5F6G7"


def test_purely_alphabetic_14_chars_is_not_a_nip():
    """Un mot de 14 lettres (ex. un nom de commune) n'est pas un NIP."""
    assert _find_nip(["FRANCEVILLEAAA"]) == ""


# --------------------------------------------------------------------------- #
# Contrat de sortie
# --------------------------------------------------------------------------- #
def test_required_fields_always_present_even_when_unreadable():
    """Le backend attend les 4 clés, quitte à ce qu'elles soient vides."""
    engine = _engine()
    fields, confidence = engine._extract_cni_gabon([])
    assert set(fields) >= {
        "firstName",
        "lastName",
        "dateOfBirth",
        "documentNumber",
    }
    assert confidence == 0.0


def test_confidence_is_mean_of_line_scores():
    """La confiance décide de l'auto-approbation : elle doit refléter l'OCR."""
    engine = _engine()
    _, confidence = engine._extract_cni_gabon([("A", 0.4), ("B", 0.8)])
    assert confidence == pytest.approx(0.6)


# --------------------------------------------------------------------------- #
# Harnais de calibration (à remplir avec de vrais échantillons)
# --------------------------------------------------------------------------- #
# Format d'une entrée :
#   (identifiant_lisible, [lignes OCR observées], {champs attendus})
CNI_SAMPLES: list[tuple[str, list[str], dict[str, str]]] = []


@pytest.mark.skipif(not CNI_SAMPLES, reason="aucun échantillon de CNI fourni")
@pytest.mark.parametrize(
    "sample_id,texts,expected",
    CNI_SAMPLES,
    ids=[s[0] for s in CNI_SAMPLES],
)
def test_cni_samples(sample_id: str, texts: list[str], expected: dict[str, str]):
    engine = _engine()
    fields, _ = engine._extract_cni_gabon(_lines(*texts))
    for key, want in expected.items():
        assert fields[key] == want, f"{sample_id}: {key}"
