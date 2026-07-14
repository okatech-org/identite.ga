"""Prédicteur MiniFASNet vendorisé (Silent-Face-Anti-Spoofing).

Source : https://github.com/minivision-ai/Silent-Face-Anti-Spoofing
Licence : Apache-2.0 (voir ./LICENSE et ./NOTICE.md).

Ce module est une adaptation FIDÈLE du code de référence
(`src/anti_spoof_predict.py`, `src/generate_patches.py`, `src/utility.py`,
`src/data_io/{transform,functional}.py`). Adaptations volontaires :

  * chemins d'imports adaptés au layout vendorisé (`.model` au lieu de
    `src.model_lib.MiniFASNet`),
  * emplacement du modèle de détection de visage (caffe RetinaFace) rendu
    CONFIGURABLE via `detection_model_dir` (au lieu du chemin relatif codé en
    dur `./resources/detection_model`),
  * `ToTensor` ré-implémenté en minimal (branche numpy uniquement) : il
    reproduit EXACTEMENT le comportement de référence, à savoir une conversion
    HWC->CHW en float SANS division par 255 (le modèle a été entraîné avec cette
    convention ; normaliser casserait les scores).

Le reste de la logique d'inférence (softmax, agrégation multi-modèles) est
identique à la référence.
"""

from __future__ import annotations

import math
import os

import cv2
import numpy as np
import torch
import torch.nn.functional as F

from .model import MiniFASNetV1, MiniFASNetV2, MiniFASNetV1SE, MiniFASNetV2SE

MODEL_MAPPING = {
    "MiniFASNetV1": MiniFASNetV1,
    "MiniFASNetV2": MiniFASNetV2,
    "MiniFASNetV1SE": MiniFASNetV1SE,
    "MiniFASNetV2SE": MiniFASNetV2SE,
}


# --------------------------------------------------------------------------- #
# utility.py (helpers de parsing du nom de modèle)
# --------------------------------------------------------------------------- #
def get_kernel(height: int, width: int) -> tuple[int, int]:
    return ((height + 15) // 16, (width + 15) // 16)


def parse_model_name(model_name: str) -> tuple[int, int, str, float | None]:
    """Extrait (h_input, w_input, model_type, scale) du nom de fichier.

    Ex. '2.7_80x80_MiniFASNetV2.pth' -> (80, 80, 'MiniFASNetV2', 2.7)
        '4_0_0_80x80_MiniFASNetV1SE.pth' -> (80, 80, 'MiniFASNetV1SE', 4.0)
    """
    info = model_name.split("_")[0:-1]
    h_input, w_input = info[-1].split("x")
    model_type = model_name.split(".pth")[0].split("_")[-1]
    scale = None if info[0] == "org" else float(info[0])
    return int(h_input), int(w_input), model_type, scale


# --------------------------------------------------------------------------- #
# data_io/transform.py + functional.py (branche numpy uniquement)
# --------------------------------------------------------------------------- #
def _to_tensor(pic: np.ndarray) -> torch.Tensor:
    """Reproduit `functional.to_tensor` (branche ndarray) de la référence.

    HWC uint8/… -> CHW float. IMPORTANT : PAS de division par 255 (le modèle a
    été entraîné ainsi ; cf. commentaires du code d'origine)."""
    if pic.ndim == 2:
        pic = pic.reshape((pic.shape[0], pic.shape[1], 1))
    img = torch.from_numpy(pic.transpose((2, 0, 1)))
    return img.float()


# --------------------------------------------------------------------------- #
# generate_patches.py : CropImage
# --------------------------------------------------------------------------- #
class CropImage:
    @staticmethod
    def _get_new_box(src_w, src_h, bbox, scale):
        x, y, box_w, box_h = bbox[0], bbox[1], bbox[2], bbox[3]
        scale = min((src_h - 1) / box_h, min((src_w - 1) / box_w, scale))

        new_width = box_w * scale
        new_height = box_h * scale
        center_x, center_y = box_w / 2 + x, box_h / 2 + y

        left_top_x = center_x - new_width / 2
        left_top_y = center_y - new_height / 2
        right_bottom_x = center_x + new_width / 2
        right_bottom_y = center_y + new_height / 2

        if left_top_x < 0:
            right_bottom_x -= left_top_x
            left_top_x = 0
        if left_top_y < 0:
            right_bottom_y -= left_top_y
            left_top_y = 0
        if right_bottom_x > src_w - 1:
            left_top_x -= right_bottom_x - src_w + 1
            right_bottom_x = src_w - 1
        if right_bottom_y > src_h - 1:
            left_top_y -= right_bottom_y - src_h + 1
            right_bottom_y = src_h - 1

        return (
            int(left_top_x),
            int(left_top_y),
            int(right_bottom_x),
            int(right_bottom_y),
        )

    def crop(self, org_img, bbox, scale, out_w, out_h, crop=True):
        if not crop:
            dst_img = cv2.resize(org_img, (out_w, out_h))
        else:
            src_h, src_w, _ = np.shape(org_img)
            left_top_x, left_top_y, right_bottom_x, right_bottom_y = self._get_new_box(
                src_w, src_h, bbox, scale
            )
            img = org_img[
                left_top_y : right_bottom_y + 1, left_top_x : right_bottom_x + 1
            ]
            dst_img = cv2.resize(img, (out_w, out_h))
        return dst_img


# --------------------------------------------------------------------------- #
# anti_spoof_predict.py : Detection + AntiSpoofPredict
# --------------------------------------------------------------------------- #
class Detection:
    """Détecteur de visage RetinaFace (caffe) via OpenCV DNN.

    `detection_model_dir` doit contenir `Widerface-RetinaFace.caffemodel` et
    `deploy.prototxt` (adaptation vendorisée : chemin configurable)."""

    def __init__(self, detection_model_dir: str):
        caffemodel = os.path.join(detection_model_dir, "Widerface-RetinaFace.caffemodel")
        deploy = os.path.join(detection_model_dir, "deploy.prototxt")
        self.detector = cv2.dnn.readNetFromCaffe(deploy, caffemodel)
        self.detector_confidence = 0.6

    def get_bbox(self, img):
        height, width = img.shape[0], img.shape[1]
        aspect_ratio = width / height
        if img.shape[1] * img.shape[0] >= 192 * 192:
            img = cv2.resize(
                img,
                (
                    int(192 * math.sqrt(aspect_ratio)),
                    int(192 / math.sqrt(aspect_ratio)),
                ),
                interpolation=cv2.INTER_LINEAR,
            )
        blob = cv2.dnn.blobFromImage(img, 1, mean=(104, 117, 123))
        self.detector.setInput(blob, "data")
        out = self.detector.forward("detection_out").squeeze()
        max_conf_index = np.argmax(out[:, 2])
        left, top, right, bottom = (
            out[max_conf_index, 3] * width,
            out[max_conf_index, 4] * height,
            out[max_conf_index, 5] * width,
            out[max_conf_index, 6] * height,
        )
        bbox = [int(left), int(top), int(right - left + 1), int(bottom - top + 1)]
        return bbox


class AntiSpoofPredict(Detection):
    def __init__(self, device_id: int, detection_model_dir: str):
        super().__init__(detection_model_dir)
        self.device = torch.device(
            "cuda:{}".format(device_id)
            if (device_id >= 0 and torch.cuda.is_available())
            else "cpu"
        )
        self.model = None

    def _load_model(self, model_path):
        model_name = os.path.basename(model_path)
        h_input, w_input, model_type, _ = parse_model_name(model_name)
        self.kernel_size = get_kernel(h_input, w_input)
        self.model = MODEL_MAPPING[model_type](conv6_kernel=self.kernel_size).to(
            self.device
        )

        state_dict = torch.load(model_path, map_location=self.device)
        keys = iter(state_dict)
        first_layer_name = keys.__next__()
        if first_layer_name.find("module.") >= 0:
            from collections import OrderedDict

            new_state_dict = OrderedDict()
            for key, value in state_dict.items():
                new_state_dict[key[7:]] = value
            self.model.load_state_dict(new_state_dict)
        else:
            self.model.load_state_dict(state_dict)
        return None

    def predict(self, img, model_path):
        test = _to_tensor(img)
        test = test.unsqueeze(0).to(self.device)
        self._load_model(model_path)
        self.model.eval()
        with torch.no_grad():
            result = self.model.forward(test)
            result = F.softmax(result, dim=1).cpu().numpy()
        return result
