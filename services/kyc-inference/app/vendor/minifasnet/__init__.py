"""MiniFASNet vendorisé — Silent-Face-Anti-Spoofing (Apache-2.0).

Voir NOTICE.md pour la provenance et LICENSE pour les termes.
"""

from .predict import AntiSpoofPredict, CropImage, get_kernel, parse_model_name

__all__ = ["AntiSpoofPredict", "CropImage", "get_kernel", "parse_model_name"]
