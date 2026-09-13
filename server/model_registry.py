"""Model catalog discovery and verified artifact loading."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
CATALOG_PATH = Path(os.getenv("MODEL_CATALOG_PATH", SERVER_DIR / "model_catalog.json"))
DEFAULT_MODEL_ID = os.getenv("DEFAULT_MODEL_ID", "custom-cnn")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as artifact:
        for chunk in iter(lambda: artifact.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_catalog(path: Path = CATALOG_PATH) -> list[dict]:
    models = json.loads(path.read_text(encoding="utf-8"))["models"]
    seen = set()
    for model in models:
        model_id = model["id"]
        if model_id in seen:
            raise RuntimeError(f"Duplicate model id: {model_id}")
        seen.add(model_id)
        artifact_path = Path(model["artifact"]["path"])
        if model_id == DEFAULT_MODEL_ID and os.getenv("MODEL_PATH"):
            artifact_path = Path(os.environ["MODEL_PATH"])
        elif not artifact_path.is_absolute():
            artifact_path = SERVER_DIR / artifact_path
        model["artifact"]["resolved_path"] = str(artifact_path.resolve())
        expected = os.getenv("MODEL_SHA256") if model_id == DEFAULT_MODEL_ID and os.getenv("MODEL_PATH") else model["artifact"].get("sha256")
        model["available"] = artifact_path.is_file() and bool(expected)
    return models


def public_catalog(models: list[dict]) -> list[dict]:
    result = json.loads(json.dumps(models))
    for model in result:
        model["artifact"].pop("resolved_path", None)
    return result


def find_model(models: list[dict], model_id: str) -> dict:
    try:
        return next(model for model in models if model["id"] == model_id)
    except StopIteration as exc:
        raise KeyError(model_id) from exc


def load_verified_model(model: dict):
    path = Path(model["artifact"]["resolved_path"])
    if not path.is_file():
        raise FileNotFoundError(f"Model artifact is unavailable: {model['id']}")
    digest = sha256(path)
    expected = model["artifact"].get("sha256")
    if model["id"] == DEFAULT_MODEL_ID and os.getenv("MODEL_SHA256"):
        expected = os.environ["MODEL_SHA256"]
    if expected and digest != expected.lower():
        raise RuntimeError(f"Model checksum verification failed: {model['id']}")

    from tensorflow.keras.models import load_model

    return load_model(path, compile=False), digest
