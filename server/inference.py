"""Shared image preprocessing and model inference."""

from __future__ import annotations

import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 20_000_000


class InvalidImage(ValueError):
    pass


def preprocess(data: bytes, input_config: dict | None = None) -> np.ndarray:
    config = input_config or {"size": 224, "channels": 3, "normalization": "scale_0_1"}
    size = int(config["size"])
    mode = "L" if int(config["channels"]) == 1 else "RGB"
    try:
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            resized = ImageOps.fit(image.convert(mode), (size, size), method=Image.Resampling.BILINEAR)
            pixels = np.asarray(resized, dtype=np.float32)
            if mode == "L":
                pixels = np.expand_dims(pixels, axis=-1)
            if config["normalization"] == "samplewise_standardize":
                pixels = (pixels - pixels.mean()) / max(float(pixels.std()), 1 / np.sqrt(pixels.size))
            else:
                pixels /= 255.0
            return np.expand_dims(pixels, axis=0)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InvalidImage("File is not a valid, safe image") from exc


def predict_probability(model, data: bytes, input_config: dict | None = None) -> float:
    output = np.asarray(model.predict(preprocess(data, input_config), verbose=0)).reshape(-1)
    value = float(output[1] if input_config and input_config.get("output") == "softmax_pneumonia_index_1" else output[0])
    if not np.isfinite(value) or not 0 <= value <= 1:
        raise RuntimeError("Model returned an invalid probability")
    return value
