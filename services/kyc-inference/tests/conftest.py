"""Fixtures de test. Le secret HMAC doit être défini AVANT l'import de `app`."""

from __future__ import annotations

import os
from datetime import datetime, timezone

import pytest

# Secret déterministe pour les tests, injecté avant tout import applicatif.
os.environ.setdefault("KYC_INFERENCE_SECRET", "test-secret-please-change")

from app.security import compute_signature  # noqa: E402


TEST_SECRET = os.environ["KYC_INFERENCE_SECRET"]


def signed_headers(raw_body: bytes, *, secret: str = TEST_SECRET) -> dict[str, str]:
    """Construit des headers d'auth valides pour un corps brut donné."""
    return {
        "X-Signature": compute_signature(secret, raw_body),
        "X-Timestamp": datetime.now(timezone.utc).isoformat(),
        "Content-Type": "application/json",
    }


@pytest.fixture()
def make_signed_headers():
    return signed_headers
