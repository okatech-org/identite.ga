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

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.liveness import LivenessResult
from app.main import Engines, app
from app.ocr import OcrResult


# --------------------------------------------------------------------------- #
# Doubles de test (moteurs factices)
# --------------------------------------------------------------------------- #
class FakeOcr:
    def __init__(self, ready: bool = True):
        self.ready = ready

    def run(self, *, document_type, front_bytes, back_bytes):
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
    assert set(body["models"]) == {"ocr", "face_match", "liveness"}
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
    assert set(body) == {"faceMatch", "liveness", "livenessScore"}
    assert 0.0 <= body["faceMatch"] <= 1.0
    assert body["liveness"] in {"real", "spoof", "uncertain"}
    assert 0.0 <= body["livenessScore"] <= 1.0


def test_biometric_returns_503_when_liveness_not_ready(client, make_signed_headers):
    app.state.engines = Engines(
        ocr=FakeOcr(), face=FakeFace(), liveness=FakeLiveness(ready=False)
    )
    payload = {"selfieUrl": "https://x/s", "docFaceUrl": "https://x/d"}
    resp = _post_signed(client, "/v1/biometric", payload, make_signed_headers)
    assert resp.status_code == 503
