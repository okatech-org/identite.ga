"""Point d'entrée FastAPI du microservice d'inférence KYC souverain.

Responsabilités :
  * charger les moteurs (OCR, face match, liveness) au démarrage, avec
    dégradation gracieuse si des poids manquent,
  * authentifier chaque requête via HMAC-SHA256 (middleware),
  * exposer /v1/ocr, /v1/biometric, /healthz conformément au contrat backend.

Aucune image ni donnée biométrique n'est journalisée. Les logs se limitent aux
métadonnées d'exploitation (statut, durée, type de document).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from .assets import AssetFetchError, fetch_bytes, looks_like_video
from .config import Settings, get_settings
from .face_match import FaceMatchEngine, NoFaceDetected
from .liveness import LivenessEngine
from .ocr import OcrEngine, OcrUnavailable
from .schemas import (
    BiometricRequest,
    BiometricResponse,
    HealthResponse,
    OcrRequest,
    OcrResponse,
)
from .security import AuthError, verify_request

logger = logging.getLogger("kyc-inference")

# Chemins publics (pas d'auth HMAC).
_PUBLIC_PATHS = frozenset({"/healthz", "/docs", "/openapi.json", "/redoc"})


@dataclass
class Engines:
    """Conteneur des moteurs, stocké sur app.state pour injection/mocking."""

    ocr: OcrEngine
    face: FaceMatchEngine
    liveness: LivenessEngine

    def status(self) -> dict[str, bool]:
        # `ocr` = au moins un chemin utilisable ; `ocr_text` / `ocr_mrz`
        # détaillent lequel. Les deux sont indépendants (cf. app/ocr.py) : un
        # `ocr: true` avec `ocr_text: false` signifie que les passeports sont
        # lisibles mais pas les CNI.
        return {
            "ocr": self.ocr.ready,
            **self.ocr.capabilities(),
            "face_match": self.face.ready,
            "liveness": self.liveness.ready,
        }


def build_engines(settings: Settings) -> Engines:
    """Instancie et charge les moteurs. Chaque `.load()` est tolérant aux poids
    manquants (dégradation gracieuse)."""
    ocr = OcrEngine(settings=settings)
    face = FaceMatchEngine(settings=settings)
    liveness = LivenessEngine(settings=settings)
    for engine in (ocr, face, liveness):
        engine.load()
    return Engines(ocr=ocr, face=face, liveness=liveness)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.engines = build_engines(settings)
    status = app.state.engines.status()
    logger.info("Moteurs chargés : %s", status)
    yield
    # Rien à libérer explicitement : les modèles sont GC avec le process.


app = FastAPI(
    title="identite.ga — KYC Inference",
    version="1.0.0",
    description="Microservice d'inférence KYC souverain (OCR + biométrie).",
    lifespan=lifespan,
)


# --------------------------------------------------------------------------- #
# Middleware d'authentification HMAC
# --------------------------------------------------------------------------- #
@app.middleware("http")
async def hmac_auth_middleware(request: Request, call_next):
    if request.url.path in _PUBLIC_PATHS or request.method == "OPTIONS":
        return await call_next(request)

    settings: Settings = request.app.state.settings

    # On lit le corps BRUT une seule fois et on le réinjecte pour les handlers.
    raw_body = await request.body()

    try:
        verify_request(
            secret=settings.inference_secret,
            raw_body=raw_body,
            signature_header=request.headers.get("X-Signature"),
            timestamp_header=request.headers.get("X-Timestamp"),
            tolerance_seconds=settings.timestamp_tolerance_seconds,
            previous_secret=settings.inference_secret_previous or None,
        )
    except AuthError as exc:
        # 401 générique : on ne divulgue pas quelle vérification a échoué au client.
        logger.warning("Rejet auth: %s", exc)
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)


# --------------------------------------------------------------------------- #
# Dépendances
# --------------------------------------------------------------------------- #
def get_engines(request: Request) -> Engines:
    return request.app.state.engines


def get_current_settings(request: Request) -> Settings:
    return request.app.state.settings


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/healthz", response_model=HealthResponse)
async def healthz(engines: Engines = Depends(get_engines)) -> HealthResponse:
    return HealthResponse(status="ok", models=engines.status())


@app.post("/v1/ocr", response_model=OcrResponse)
async def ocr_endpoint(
    payload: OcrRequest,
    engines: Engines = Depends(get_engines),
    settings: Settings = Depends(get_current_settings),
) -> OcrResponse | JSONResponse:
    if not engines.ocr.ready:
        return _service_unavailable("ocr")

    try:
        front = fetch_bytes(payload.frontImageUrl, settings)
        back = (
            fetch_bytes(payload.backImageUrl, settings)
            if payload.backImageUrl
            else None
        )
    except AssetFetchError as exc:
        return JSONResponse(status_code=502, content={"detail": str(exc)})

    try:
        result = engines.ocr.run(
            document_type=payload.documentType,
            front_bytes=front,
            back_bytes=back,
        )
    except OcrUnavailable as exc:
        # Le chemin requis pour CE type de document est indisponible (langpack
        # manquant, PassportEye absent…) alors que le moteur est globalement
        # "ready". 503 et pas 422 : la faute est côté service, et le backend
        # sait dégrader un 503 vers la revue manuelle (cf. kyc/actions.ts).
        return JSONResponse(status_code=503, content={"detail": str(exc)})
    except ValueError as exc:  # image indécodable, etc.
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    return OcrResponse(
        confidence=result.confidence,
        fields=result.fields,
        docAuthentic=result.doc_authentic,
    )


@app.post("/v1/biometric", response_model=BiometricResponse)
async def biometric_endpoint(
    payload: BiometricRequest,
    engines: Engines = Depends(get_engines),
    settings: Settings = Depends(get_current_settings),
) -> BiometricResponse | JSONResponse:
    # Les deux moteurs biométriques sont requis pour une réponse complète.
    if not engines.face.ready or not engines.liveness.ready:
        missing = "face_match" if not engines.face.ready else "liveness"
        return _service_unavailable(missing)

    try:
        selfie = fetch_bytes(payload.selfieUrl, settings)
        doc_face = fetch_bytes(payload.docFaceUrl, settings)
    except AssetFetchError as exc:
        return JSONResponse(status_code=502, content={"detail": str(exc)})

    is_video = looks_like_video(payload.selfieUrl, selfie)

    try:
        face_result = engines.face.compare_with_embedding(
            selfie_bytes=selfie, doc_face_bytes=doc_face
        )
        liveness_result = engines.liveness.analyze(media_bytes=selfie, is_video=is_video)
    except NoFaceDetected as exc:
        return JSONResponse(status_code=422, content={"detail": str(exc)})
    except ValueError as exc:
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    return BiometricResponse(
        faceMatch=face_result.score,
        liveness=liveness_result.verdict,
        livenessScore=liveness_result.score,
        embedding=face_result.selfie_embedding,
        embeddingModel=face_result.model_version,
    )


def _service_unavailable(model_name: str) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                f"Modèle '{model_name}' non chargé : poids absents. "
                "Voir /healthz et le README (section 'Obtenir les poids')."
            )
        },
    )
