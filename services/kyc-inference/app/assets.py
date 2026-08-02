"""Récupération des assets KYC depuis les URLs signées Convex.

Sécurité :
  * garde SSRF : optionnellement restreint les hôtes autorisés (suffixes),
  * limite de taille de téléchargement (anti-DoS mémoire),
  * les octets restent EN MÉMOIRE autant que possible ; pour la vidéo liveness
    on écrit un fichier temporaire (imageio/opencv en ont besoin) qui DOIT être
    supprimé par l'appelant (voir `temporary_file`).

Aucune image n'est jamais journalisée ni persistée durablement.
"""

from __future__ import annotations

import contextlib
import os
import tempfile
from collections.abc import Iterator
from urllib.parse import urlparse

import httpx

from .config import Settings


class AssetFetchError(Exception):
    """Erreur de récupération d'un asset -> mappée en HTTP 502 par les routes."""


def _check_host_allowed(url: str, settings: Settings) -> None:
    if not settings.allowed_hosts_enabled:
        return
    host = (urlparse(url).hostname or "").lower()
    allowed = False
    for suffix in settings.allowed_asset_host_suffixes:
        domain = suffix.strip().lower().lstrip(".")
        if domain and (host == domain or host.endswith(f".{domain}")):
            allowed = True
            break
    if not allowed:
        raise AssetFetchError(
            f"Hôte non autorisé pour la récupération d'asset : {host!r}."
        )


def fetch_bytes(url: str, settings: Settings) -> bytes:
    """Télécharge un asset et renvoie ses octets bruts.

    Streaming avec coupure dès que `max_download_bytes` est dépassé.
    """
    _check_host_allowed(url, settings)

    chunks: list[bytes] = []
    total = 0
    try:
        with httpx.Client(timeout=settings.fetch_timeout_seconds, follow_redirects=True) as client:
            with client.stream("GET", url) as response:
                response.raise_for_status()
                for chunk in response.iter_bytes():
                    total += len(chunk)
                    if total > settings.max_download_bytes:
                        raise AssetFetchError(
                            f"Asset trop volumineux (> {settings.max_download_bytes} octets)."
                        )
                    chunks.append(chunk)
    except httpx.HTTPError as exc:
        raise AssetFetchError(f"Échec de récupération de l'asset : {exc}") from exc

    return b"".join(chunks)


@contextlib.contextmanager
def temporary_file(data: bytes, settings: Settings, suffix: str = "") -> Iterator[str]:
    """Écrit `data` dans un fichier temporaire supprimé à la sortie du bloc.

    Utilisé pour les vidéos liveness qui doivent être ouvertes par un décodeur.
    Le fichier est TOUJOURS supprimé (finally), même en cas d'exception, afin de
    ne laisser aucune trace biométrique sur disque.
    """
    os.makedirs(settings.tmp_dir, exist_ok=True)
    fd, path = tempfile.mkstemp(dir=settings.tmp_dir, suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
        yield path
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.remove(path)


def looks_like_video(url: str, content: bytes) -> bool:
    """Heuristique image vs vidéo courte.

    On regarde d'abord l'extension de l'URL, puis on retombe sur une signature
    de conteneur (ftyp mp4, webm/matroska).
    """
    lowered = urlparse(url).path.lower()
    if lowered.endswith((".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv")):
        return True
    head = content[:32]
    if b"ftyp" in head:  # ISO base media (mp4/mov/m4v)
        return True
    if head.startswith(b"\x1a\x45\xdf\xa3"):  # EBML (webm/mkv)
        return True
    return False
