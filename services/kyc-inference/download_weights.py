"""Baking des poids de modèles au BUILD (pas au premier appel runtime).

Exécuté dans le Dockerfile après installation des dépendances. Télécharge et
met en cache dans l'image :
  * PaddleOCR : modèles det + rec + cls pour la langue configurée,
  * InsightFace : pack ArcFace (`buffalo_l` par défaut) + détecteur SCRFD.

Vérifie aussi la présence des poids MiniFASNet vendorisés (copiés via COPY).

Ce script N'EXIGE PAS le secret HMAC (au contraire de `app.config.get_settings`) :
il lit directement l'environnement avec des valeurs par défaut sûres, afin de
pouvoir tourner pendant le build.

En cas d'échec de téléchargement, on sort en code != 0 pour FAIRE ÉCHOUER le
build (fail loud) : une image sans poids ne doit pas être publiée.
"""

from __future__ import annotations

import os
import sys


def check_minifasnet() -> None:
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
