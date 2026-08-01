"""Baking des poids de modèles au BUILD (pas au premier appel runtime).

Exécuté dans le Dockerfile après installation des dépendances. Télécharge et
met en cache dans l'image :
  * PaddleOCR : modèles det + rec + cls pour la langue configurée,
  * InsightFace : pack ArcFace (`buffalo_l` par défaut) + détecteur SCRFD.

Télécharge les poids MiniFASNet depuis une révision amont épinglée et vérifie
leurs empreintes SHA-256 avant de les intégrer à l'image.

Ce script N'EXIGE PAS le secret HMAC (au contraire de `app.config.get_settings`) :
il lit directement l'environnement avec des valeurs par défaut sûres, afin de
pouvoir tourner pendant le build.

En cas d'échec de téléchargement, on sort en code != 0 pour FAIRE ÉCHOUER le
build (fail loud) : une image sans poids ne doit pas être publiée.
"""

from __future__ import annotations

import hashlib
import os
import sys
from pathlib import Path
from typing import BinaryIO, Callable
from urllib.request import urlopen


_MINIFASNET_REVISION = "b6d5f04ad78778917853b25c778acef6d5626d15"
_MINIFASNET_BASE_URL = (
    "https://raw.githubusercontent.com/minivision-ai/"
    f"Silent-Face-Anti-Spoofing/{_MINIFASNET_REVISION}"
)
_MINIFASNET_FILES = (
    (
        "resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth",
        "anti_spoof/2.7_80x80_MiniFASNetV2.pth",
        "a5eb02e1843f19b5386b953cc4c9f011c3f985d0ee2bb9819eea9a142099bec0",
    ),
    (
        "resources/anti_spoof_models/4_0_0_80x80_MiniFASNetV1SE.pth",
        "anti_spoof/4_0_0_80x80_MiniFASNetV1SE.pth",
        "84ee1d37d96894d5e82de5a57df044ef80a58be2b218b5ed7cdfd875ec2f5990",
    ),
    (
        "resources/detection_model/Widerface-RetinaFace.caffemodel",
        "detection/Widerface-RetinaFace.caffemodel",
        "d08338a2c207df16a9c566f767fea67fb43ba6fff76ce11e938fe3fabefb9402",
    ),
    (
        "resources/detection_model/deploy.prototxt",
        "detection/deploy.prototxt",
        "9fe2f141b4baee039ed9442da2833e216af40a6ff3e639e7b39258812bcda808",
    ),
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_pinned_file(
    url: str,
    destination: Path,
    expected_sha256: str,
    opener: Callable[..., BinaryIO] = urlopen,
) -> None:
    """Télécharge un artefact épinglé et refuse toute empreinte inattendue."""
    if destination.is_file() and sha256_file(destination) == expected_sha256:
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f".{destination.name}.download")
    try:
        with opener(url, timeout=120) as response, temporary.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)

        actual_sha256 = sha256_file(temporary)
        if actual_sha256 != expected_sha256:
            raise ValueError(
                f"Empreinte SHA-256 invalide pour {destination.name}: "
                f"attendu {expected_sha256}, reçu {actual_sha256}"
            )
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)


def ensure_minifasnet_files() -> None:
    model_root = Path(os.getenv("KYC_MODEL_ROOT", "./models"))
    for source_path, destination_path, checksum in _MINIFASNET_FILES:
        ensure_pinned_file(
            f"{_MINIFASNET_BASE_URL}/{source_path}",
            model_root / destination_path,
            checksum,
        )


def check_minifasnet() -> None:
    ensure_minifasnet_files()
    model_dir = os.getenv("KYC_ANTISPOOF_MODEL_DIR", "./models/anti_spoof")
    det_dir = os.getenv("KYC_ANTISPOOF_DETECTION_DIR", "./models/detection")
    pth = [f for f in os.listdir(model_dir) if f.endswith(".pth")] if os.path.isdir(model_dir) else []
    if not pth:
        raise FileNotFoundError(f"Aucun poids .pth MiniFASNet dans {model_dir}")
    for req in ("Widerface-RetinaFace.caffemodel", "deploy.prototxt"):
        if not os.path.isfile(os.path.join(det_dir, req)):
            raise FileNotFoundError(f"Détecteur caffe manquant : {det_dir}/{req}")
    print(f"[weights] MiniFASNet OK : {pth} + détecteur caffe", flush=True)


def check_tesseract() -> None:
    """Vérifie le binaire tesseract ET les langpacks demandés.

    Tesseract n'a aucun poids à télécharger (les langpacks viennent d'apt) :
    l'intérêt de cette étape est de faire échouer le BUILD si le binaire ou un
    langpack manque, plutôt que de publier une image qui répond 503 sur
    /v1/ocr en production — c'est exactement le mode de panne qu'on vient de
    corriger, on refuse de pouvoir y revenir par un simple oubli d'apt.
    """
    import pytesseract

    cmd = os.getenv("KYC_TESSERACT_CMD", "").strip()
    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd

    version = pytesseract.get_tesseract_version()
    available = set(pytesseract.get_languages(config=""))
    wanted = [
        lang
        for lang in os.getenv("KYC_TESSERACT_LANG", "fra+eng").split("+")
        if lang
    ]
    missing = [lang for lang in wanted if lang not in available]
    if missing:
        raise FileNotFoundError(
            f"Langpack(s) tesseract manquant(s) : {', '.join(missing)}. "
            f"Installés : {', '.join(sorted(available)) or 'aucun'}. "
            "Ajouter le paquet apt correspondant (ex. tesseract-ocr-fra)."
        )
    print(
        f"[weights] Tesseract {version} OK (langpacks : {'+'.join(wanted)})",
        flush=True,
    )


def bake_insightface() -> None:
    from insightface.app import FaceAnalysis

    pack = os.getenv("KYC_INSIGHTFACE_PACK", "buffalo_l")
    root = os.path.expanduser(os.getenv("KYC_INSIGHTFACE_ROOT", "~/.insightface"))
    app = FaceAnalysis(name=pack, root=root, providers=["CPUExecutionProvider"])
    # prepare() finalise le téléchargement/extraction et charge les modèles.
    app.prepare(ctx_id=-1, det_size=(640, 640))
    print(f"[weights] InsightFace {pack} OK @ {root}", flush=True)


# `KYC_BAKE_ENGINES` (build-time uniquement) : liste des moteurs à baker.
# Défaut = `ocr,face` (+ liveness vendorisé vérifié). "ocr" ne télécharge rien :
# c'est une vérification de la présence de Tesseract et de ses langpacks.
_BAKERS = {
    "ocr": check_tesseract,
    "face": bake_insightface,
}


def main() -> int:
    engines = [
        e.strip()
        for e in os.getenv("KYC_BAKE_ENGINES", "ocr,face").split(",")
        if e.strip()
    ]
    try:
        check_minifasnet()  # toujours (simple vérif de présence des fichiers)
        for engine in engines:
            baker = _BAKERS.get(engine)
            if baker is not None:
                baker()
    except Exception as exc:  # noqa: BLE001 - on veut faire échouer le build
        print(f"[weights] ÉCHEC du baking : {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
        return 1
    skipped = [e for e in _BAKERS if e not in engines]
    if skipped:
        print(f"[weights] baking terminé (moteurs NON bakés : {skipped}).", flush=True)
    else:
        print("[weights] baking terminé (tous les moteurs prêts).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
