from __future__ import annotations

import hashlib
import io
from pathlib import Path

import pytest

from download_weights import ensure_pinned_file


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def test_existing_valid_file_is_not_downloaded(tmp_path: Path) -> None:
    payload = b"modele-valide"
    destination = tmp_path / "model.pth"
    destination.write_bytes(payload)

    def unexpected_download(*_args: object, **_kwargs: object) -> io.BytesIO:
        raise AssertionError("aucun téléchargement attendu")

    ensure_pinned_file(
        "https://example.invalid/model.pth",
        destination,
        _sha256(payload),
        opener=unexpected_download,
    )

    assert destination.read_bytes() == payload


def test_downloads_and_installs_verified_file(tmp_path: Path) -> None:
    payload = b"poids-officiel"
    destination = tmp_path / "models" / "model.pth"

    ensure_pinned_file(
        "https://example.invalid/model.pth",
        destination,
        _sha256(payload),
        opener=lambda *_args, **_kwargs: io.BytesIO(payload),
    )

    assert destination.read_bytes() == payload
    assert not (destination.parent / ".model.pth.download").exists()


def test_rejects_unexpected_checksum_without_installing_file(
    tmp_path: Path,
) -> None:
    destination = tmp_path / "model.pth"

    with pytest.raises(ValueError, match="Empreinte SHA-256 invalide"):
        ensure_pinned_file(
            "https://example.invalid/model.pth",
            destination,
            _sha256(b"attendu"),
            opener=lambda *_args, **_kwargs: io.BytesIO(b"compromis"),
        )

    assert not destination.exists()
    assert not (tmp_path / ".model.pth.download").exists()
