# MiniFASNet — code vendorisé

- **Projet source** : Silent-Face-Anti-Spoofing
- **URL** : https://github.com/minivision-ai/Silent-Face-Anti-Spoofing
- **Auteur / Copyright** : Minivision Technology
- **Licence** : Apache License 2.0 (voir `LICENSE` dans ce dossier)

## Fichiers repris

| Vendorisé            | Source amont                                             |
|----------------------|----------------------------------------------------------|
| `model.py`           | `src/model_lib/MiniFASNet.py` (copie verbatim)           |
| `predict.py`         | `src/anti_spoof_predict.py`, `src/generate_patches.py`, `src/utility.py`, `src/data_io/transform.py`, `src/data_io/functional.py` (fusion + adaptations) |

## Adaptations par rapport à l'amont (documentées dans `predict.py`)

1. Chemins d'import adaptés au layout vendorisé (`from .model import ...`).
2. Emplacement du modèle de détection de visage (caffe RetinaFace) rendu
   **configurable** (`detection_model_dir`) au lieu du chemin relatif codé en dur
   `./resources/detection_model`.
3. `ToTensor` ré-implémenté en minimal (branche numpy) : comportement **identique**
   à la référence (HWC→CHW en float, **sans** division par 255).
4. `F.softmax(result, dim=1)` (au lieu de `F.softmax(result)`) pour supprimer le
   warning de dimension implicite ; résultat numériquement identique.

## Poids

Les poids `.pth` (`2.7_80x80_MiniFASNetV2.pth`, `4_0_0_80x80_MiniFASNetV1SE.pth`)
et le détecteur caffe (`Widerface-RetinaFace.caffemodel` + `deploy.prototxt`)
proviennent du dossier `resources/` du dépôt amont (mêmes termes Apache-2.0).
Ils sont déposés hors-Git sous `services/kyc-inference/models/` et copiés dans
l'image Docker au build (voir `Dockerfile`).
