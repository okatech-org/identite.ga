"""Authentification entrante HMAC-SHA256 + anti-rejeu par timestamp.

Le backend Convex signe le corps JSON brut de la requête :

    signature = HMAC_SHA256(secret_partagé, raw_body_bytes)  -> hex

et envoie deux headers :

    X-Signature : la signature hex ci-dessus
    X-Timestamp : instant d'émission au format ISO 8601 (UTC recommandé)

Le service :
  * rejette (401) si un des headers est absent,
  * rejette (401) si la signature ne correspond pas (comparaison timing-safe),
  * rejette (401) si le timestamp est hors de la fenêtre de tolérance (5 min).

Important : on signe et on vérifie les OCTETS BRUTS du corps, pas un JSON
re-sérialisé (la re-sérialisation changerait l'ordre des clés / le whitespace
et casserait la signature).
"""

from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timezone


class AuthError(Exception):
    """Erreur d'authentification -> mappée en HTTP 401 par le middleware."""


def compute_signature(secret: str, raw_body: bytes) -> str:
    """Calcule la signature hex attendue pour un corps donné.

    Exposé pour être réutilisé côté tests et côté client de référence.
    """
    return hmac.new(
        secret.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()


def _parse_iso_timestamp(value: str) -> datetime:
    """Parse un timestamp ISO 8601, tolère le suffixe 'Z'.

    Retourne toujours un datetime "aware" (UTC si aucun offset fourni).
    """
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def verify_timestamp(timestamp_header: str, tolerance_seconds: int) -> None:
    """Vérifie que le timestamp est dans la fenêtre [-tolérance, +tolérance].

    On tolère le futur proche pour absorber le décalage d'horloge entre le
    backend et le service.
    """
    try:
        emitted = _parse_iso_timestamp(timestamp_header)
    except (ValueError, TypeError) as exc:
        raise AuthError("X-Timestamp illisible (ISO 8601 attendu).") from exc

    now = datetime.now(timezone.utc)
    delta_seconds = abs((now - emitted).total_seconds())
    if delta_seconds > tolerance_seconds:
        raise AuthError(
            f"X-Timestamp hors fenêtre ({int(delta_seconds)}s > "
            f"{tolerance_seconds}s) : requête rejetée (anti-rejeu)."
        )


def verify_request(
    *,
    secret: str,
    raw_body: bytes,
    signature_header: str | None,
    timestamp_header: str | None,
    tolerance_seconds: int,
    previous_secret: str | None = None,
) -> None:
    """Vérifie une requête entrante. Lève AuthError si invalide.

    Ordre volontaire : présence des headers -> fraîcheur du timestamp ->
    comparaison timing-safe de la signature.

    `previous_secret` permet une ROTATION SANS COUPURE : pendant la fenêtre où
    le backend Convex et ce service n'ont pas encore le même secret courant, les
    deux sont acceptés. Sans ce recouvrement, la fenêtre produit des 401 — et le
    backend ne dégrade gracieusement que sur 503 (cf. kyc/actions.ts), donc un
    401 fait échouer le workflow KYC après ses 3 retries : une demande de
    citoyen perdue. À vider (`KYC_INFERENCE_SECRET_PREVIOUS` non défini) dès la
    rotation terminée.
    """
    if not signature_header:
        raise AuthError("Header X-Signature manquant.")
    if not timestamp_header:
        raise AuthError("Header X-Timestamp manquant.")

    verify_timestamp(timestamp_header, tolerance_seconds)

    presented = signature_header.strip()
    # compare_digest : comparaison à temps constant contre les timing attacks.
    # Les deux secrets sont toujours évalués (pas de court-circuit) pour ne pas
    # révéler par le temps de réponse lequel a servi.
    accepted = hmac.compare_digest(compute_signature(secret, raw_body), presented)
    if previous_secret:
        accepted = (
            hmac.compare_digest(compute_signature(previous_secret, raw_body), presented)
            or accepted
        )
    if not accepted:
        raise AuthError("Signature X-Signature invalide.")
