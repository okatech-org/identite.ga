"""Tests d'intégration des routes HTTP avec moteurs mockés.

On vérifie :
  * le middleware HMAC (accept/reject) sur une route protégée,
  * le shape exact des réponses /v1/ocr et /v1/biometric (contrat backend),
  * la dégradation gracieuse en 503 quand un moteur n'est pas chargé.

Les modèles réels ne sont JAMAIS exécutés : on injecte des moteurs factices et
on court-circuite la récupération réseau des images.
"""

from __future__ import annotations

import json
import math

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.face_match import FaceMatchResult
from app.liveness import LivenessResult
from app.main import Engines, app
from app.ocr import OcrResult, OcrUnavailable


# --------------------------------------------------------------------------- #
# Doubles de test (moteurs factices)
# --------------------------------------------------------------------------- #
class FakeOcr:
    def __init__(self, ready: bool = True, text_ready: bool | None = None):
        self.ready = ready
        # `text_ready` distinct de `ready` : le moteur peut être globalement
        # disponible (MRZ passeport OK) sans savoir lire une CNI (langpack
        # manquant). C'est le cas que `OcrUnavailable` doit couvrir.
        self.text_ready = ready if text_ready is None else text_ready

    def capabilities(self) -> dict[str, bool]:
        return {"ocr_text": self.text_ready, "ocr_mrz": self.ready}

    def run(self, *, document_type, front_bytes, back_bytes):
        if document_type != "passport" and not self.text_ready:
            raise OcrUnavailable("OCR plein texte indisponible (langpack fra manquant).")
        return OcrResult(
            confidence=0.91,
            fields={
                "firstName": "Jean",
                "lastName": "Ondo",
                "dateOfBirth": "1990-05-12",
                "documentNumber": "GA1234567",
                "nationality": "GAB",
            },
            doc_authentic=True,
        )


class FakeFace:
    def __init__(self, ready: bool = True):
        self.ready = ready

    def compare(self, *, selfie_bytes, doc_face_bytes):
        return 0.84

    def compare_with_embedding(self, *, selfie_bytes, doc_face_bytes):
        # Vecteur unitaire de dimension 512 : la route doit rendre l'empreinte
        # telle quelle, sans renormaliser ni tronquer.
        embedding = [0.0] * 512
        embedding[0] = 1.0
        return FaceMatchResult(
            score=0.84, selfie_embedding=embedding, model_version="buffalo_l"
        )


class FakeLiveness:
    def __init__(self, ready: bool = True):
        self.ready = ready

    def analyze(self, *, media_bytes, is_video):
        return LivenessResult(verdict="real", score=0.88)


@pytest.fixture()
def client(monkeypatch):
    """Client avec lifespan actif puis moteurs remplacés par des doubles."""
    # Court-circuite les GET réseau : renvoie des octets factices.
    monkeypatch.setattr(main, "fetch_bytes", lambda url, settings: b"\xff\xd8\xff")
    monkeypatch.setattr(main, "looks_like_video", lambda url, content: False)

    with TestClient(app) as c:
        # Après startup, on écrase les moteurs (chargés en dégradé) par les doubles.
        app.state.engines = Engines(ocr=FakeOcr(), face=FakeFace(), liveness=FakeLiveness())
        yield c


def _post_signed(client: TestClient, path: str, payload: dict, make_signed_headers):
    raw = json.dumps(payload).encode("utf-8")
    return client.post(path, content=raw, headers=make_signed_headers(raw))


# --------------------------------------------------------------------------- #
# /healthz (public)
# --------------------------------------------------------------------------- #
def test_healthz_public_and_reports_models(client):
    resp = client.get("/healthz")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    # `ocr_text` / `ocr_mrz` en plus de `ocr` : sans ce détail, un opérateur ne
    # peut pas distinguer "les passeports passent, les CNI non" d'un OCR
    # totalement HS — les deux se présentaient comme `ocr: false`.
    assert set(body["models"]) == {
        "ocr",
        "ocr_text",
        "ocr_mrz",
        "face_match",
        "liveness",
    }
    assert all(isinstance(v, bool) for v in body["models"].values())


# --------------------------------------------------------------------------- #
# Middleware HMAC
# --------------------------------------------------------------------------- #
def test_ocr_without_signature_rejected(client):
    resp = client.post(
        "/v1/ocr",
        content=b"{}",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 401


def test_ocr_with_bad_signature_rejected(client):
    resp = client.post(
        "/v1/ocr",
        content=b'{"documentType":"cni","frontImageUrl":"https://x/y"}',
        headers={
            "Content-Type": "application/json",
            "X-Signature": "deadbeef",
            "X-Timestamp": "2026-07-14T00:00:00Z",
        },
    )
    assert resp.status_code == 401


# --------------------------------------------------------------------------- #
# /v1/ocr — shape
# --------------------------------------------------------------------------- #
def test_ocr_response_shape(client, make_signed_headers):
    payload = {
        "documentType": "passport",
        "frontImageUrl": "https://storage.convex.cloud/front.jpg",
        "backImageUrl": None,
    }
    resp = _post_signed(client, "/v1/ocr", payload, make_signed_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert set(body) == {"confidence", "fields", "docAuthentic"}
    assert 0.0 <= body["confidence"] <= 1.0
    assert isinstance(body["docAuthentic"], bool)
    for key in ("firstName", "lastName", "dateOfBirth", "documentNumber"):
        assert key in body["fields"]


def test_ocr_returns_503_when_engine_not_ready(client, make_signed_headers):
    app.state.engines = Engines(
        ocr=FakeOcr(ready=False), face=FakeFace(), liveness=FakeLiveness()
    )
    payload = {"documentType": "cni", "frontImageUrl": "https://x/y", "backImageUrl": None}
    resp = _post_signed(client, "/v1/ocr", payload, make_signed_headers)
    assert resp.status_code == 503
    assert "non chargé" in resp.json()["detail"]


def test_passport_still_readable_when_text_ocr_unavailable(client, make_signed_headers):
    """La MRZ ne dépend pas du langpack fra : elle doit rester servie.

    C'est la régression qu'on vient de corriger — un drapeau `ready` unique
    faisait tomber la lecture des passeports (normalisée ICAO 9303) pour une
    carence qui ne concernait que l'extraction CNI.
    """
    app.state.engines = Engines(
        ocr=FakeOcr(ready=True, text_ready=False),
        face=FakeFace(),
        liveness=FakeLiveness(),
    )
    payload = {
        "documentType": "passport",
        "frontImageUrl": "https://x/y",
        "backImageUrl": None,
    }
    resp = _post_signed(client, "/v1/ocr", payload, make_signed_headers)
    assert resp.status_code == 200, resp.text

    # …tandis qu'une CNI renvoie 503 (et pas 422 : la faute est côté service).
    payload["documentType"] = "cni_gabon"
    resp = _post_signed(client, "/v1/ocr", payload, make_signed_headers)
    assert resp.status_code == 503
    assert "langpack" in resp.json()["detail"]


# --------------------------------------------------------------------------- #
# /v1/biometric — shape
# --------------------------------------------------------------------------- #
def test_biometric_response_shape(client, make_signed_headers):
    payload = {
        "selfieUrl": "https://storage.convex.cloud/selfie.jpg",
        "docFaceUrl": "https://storage.convex.cloud/docface.jpg",
    }
    resp = _post_signed(client, "/v1/biometric", payload, make_signed_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert set(body) == {
        "faceMatch",
        "liveness",
        "livenessScore",
        "embedding",
        "embeddingModel",
    }
    assert 0.0 <= body["faceMatch"] <= 1.0
    assert body["liveness"] in {"real", "spoof", "uncertain"}
    assert 0.0 <= body["livenessScore"] <= 1.0

    # L'empreinte alimente un index vectoriel déclaré à 512 dimensions côté
    # Convex : une dimension qui dérive y serait rejetée à l'insertion, donc
    # après coup, sur un dossier déjà traité.
    assert len(body["embedding"]) == 512
    assert all(isinstance(x, float) for x in body["embedding"])
    norm = math.sqrt(sum(x * x for x in body["embedding"]))
    # ArcFace rend des vecteurs L2-normalisés ; c'est ce qui rend le produit
    # scalaire directement interprétable comme un cosinus.
    assert abs(norm - 1.0) < 1e-6
    assert body["embeddingModel"] == "buffalo_l"


def test_biometric_returns_503_when_liveness_not_ready(client, make_signed_headers):
    app.state.engines = Engines(
        ocr=FakeOcr(), face=FakeFace(), liveness=FakeLiveness(ready=False)
    )
    payload = {"selfieUrl": "https://x/s", "docFaceUrl": "https://x/d"}
    resp = _post_signed(client, "/v1/biometric", payload, make_signed_headers)
    assert resp.status_code == 503
