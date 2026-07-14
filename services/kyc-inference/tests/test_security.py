"""Tests unitaires de l'authentification HMAC + anti-rejeu par timestamp.

Ces tests encodent le POURQUOI : la signature protège l'intégrité et
l'authenticité du corps ; le timestamp borne la fenêtre de rejeu à 5 min. Un
corps modifié, un secret erroné, ou un timestamp trop ancien DOIVENT être
rejetés — sinon un attaquant sur le réseau backend↔service pourrait injecter ou
rejouer des verdicts KYC.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.security import AuthError, compute_signature, verify_request

SECRET = "shared-secret"
TOLERANCE = 300


def _now_iso(offset_seconds: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=offset_seconds)).isoformat()


def test_valid_signature_and_fresh_timestamp_accepted():
    body = b'{"documentType":"passport"}'
    verify_request(
        secret=SECRET,
        raw_body=body,
        signature_header=compute_signature(SECRET, body),
        timestamp_header=_now_iso(),
        tolerance_seconds=TOLERANCE,
    )  # ne lève pas


def test_missing_signature_rejected():
    with pytest.raises(AuthError, match="X-Signature manquant"):
        verify_request(
            secret=SECRET,
            raw_body=b"{}",
            signature_header=None,
            timestamp_header=_now_iso(),
            tolerance_seconds=TOLERANCE,
        )


def test_missing_timestamp_rejected():
    body = b"{}"
    with pytest.raises(AuthError, match="X-Timestamp manquant"):
        verify_request(
            secret=SECRET,
            raw_body=body,
            signature_header=compute_signature(SECRET, body),
            timestamp_header=None,
            tolerance_seconds=TOLERANCE,
        )


def test_wrong_secret_rejected():
    body = b"{}"
    with pytest.raises(AuthError, match="Signature .* invalide"):
        verify_request(
            secret=SECRET,
            raw_body=body,
            signature_header=compute_signature("autre-secret", body),
            timestamp_header=_now_iso(),
            tolerance_seconds=TOLERANCE,
        )


def test_tampered_body_rejected():
    """La signature est calculée sur le corps original ; un corps modifié casse
    la vérification (intégrité)."""
    original = b'{"amount":1}'
    signature = compute_signature(SECRET, original)
    tampered = b'{"amount":9999}'
    with pytest.raises(AuthError, match="Signature .* invalide"):
        verify_request(
            secret=SECRET,
            raw_body=tampered,
            signature_header=signature,
            timestamp_header=_now_iso(),
            tolerance_seconds=TOLERANCE,
        )


def test_stale_timestamp_rejected():
    body = b"{}"
    with pytest.raises(AuthError, match="hors fenêtre"):
        verify_request(
            secret=SECRET,
            raw_body=body,
            signature_header=compute_signature(SECRET, body),
            timestamp_header=_now_iso(offset_seconds=-600),  # 10 min dans le passé
            tolerance_seconds=TOLERANCE,
        )


def test_future_timestamp_within_tolerance_accepted():
    """Léger décalage d'horloge vers le futur toléré (< 5 min)."""
    body = b"{}"
    verify_request(
        secret=SECRET,
        raw_body=body,
        signature_header=compute_signature(SECRET, body),
        timestamp_header=_now_iso(offset_seconds=60),
        tolerance_seconds=TOLERANCE,
    )


def test_timestamp_with_z_suffix_parsed():
    body = b"{}"
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    verify_request(
        secret=SECRET,
        raw_body=body,
        signature_header=compute_signature(SECRET, body),
        timestamp_header=ts,
        tolerance_seconds=TOLERANCE,
    )


def test_malformed_timestamp_rejected():
    body = b"{}"
    with pytest.raises(AuthError, match="illisible"):
        verify_request(
            secret=SECRET,
            raw_body=body,
            signature_header=compute_signature(SECRET, body),
            timestamp_header="pas-une-date",
            tolerance_seconds=TOLERANCE,
        )
