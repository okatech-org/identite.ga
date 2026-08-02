"""Récupération sécurisée des assets KYC depuis Convex."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.assets import AssetFetchError, _check_host_allowed
from app.config import Settings


def _settings() -> Settings:
    return Settings(
        inference_secret="test-secret",
        allowed_asset_host_suffixes=(
            ".convex.cloud",
            ".convex.site",
            "api.identite.ga",
        ),
    )


def test_custom_convex_storage_domain_is_allowed() -> None:
    _check_host_allowed(
        "https://api.identite.ga/api/storage/example?token=redacted",
        _settings(),
    )


def test_allowed_suffix_must_match_a_dns_label_boundary() -> None:
    with pytest.raises(AssetFetchError, match="Hôte non autorisé"):
        _check_host_allowed(
            "https://evilapi.identite.ga/api/storage/example",
            _settings(),
        )


def test_production_workflow_keeps_custom_storage_domain_allowed() -> None:
    workflow = (
        Path(__file__).resolve().parents[3]
        / ".github/workflows/deploy-kyc-inference.yml"
    ).read_text()
    assert (
        "ALLOWED_ASSET_HOST_SUFFIXES="
        ".convex.cloud\\,.convex.site\\,api.identite.ga"
    ) in workflow
