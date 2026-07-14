"""Schémas Pydantic des requêtes/réponses.

Ces schémas reflètent EXACTEMENT le contrat HTTP attendu par le backend Convex.
Ne pas renommer les champs sans mettre à jour le backend en miroir.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# /v1/ocr
# --------------------------------------------------------------------------- #
class OcrRequest(BaseModel):
    documentType: str = Field(
        ...,
        description="Type de document : 'passport', 'cni', 'residence_permit', ...",
    )
    frontImageUrl: str = Field(..., description="URL signée du recto.")
    backImageUrl: str | None = Field(
        default=None, description="URL signée du verso (null si non applicable)."
    )


class OcrResponse(BaseModel):
    confidence: float = Field(..., ge=0.0, le=1.0)
    # `fields` reste ouvert : firstName/lastName/dateOfBirth/documentNumber sont
    # garantis présents (éventuellement chaîne vide), plus des champs additionnels
    # selon le type de document (nationality, sex, expiryDate, mrz, ...).
    fields: dict[str, str]
    docAuthentic: bool


# --------------------------------------------------------------------------- #
# /v1/biometric
# --------------------------------------------------------------------------- #
class BiometricRequest(BaseModel):
    selfieUrl: str = Field(
        ..., description="URL signée du selfie (image OU courte vidéo liveness)."
    )
    docFaceUrl: str = Field(
        ..., description="URL signée de la photo du visage extraite du document."
    )


LivenessVerdict = Literal["real", "spoof", "uncertain"]


class BiometricResponse(BaseModel):
    faceMatch: float = Field(..., ge=0.0, le=1.0)
    liveness: LivenessVerdict
    livenessScore: float = Field(..., ge=0.0, le=1.0)


# --------------------------------------------------------------------------- #
# /healthz
# --------------------------------------------------------------------------- #
class HealthResponse(BaseModel):
    status: Literal["ok"]
    models: dict[str, bool]
