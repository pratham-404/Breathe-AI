from io import BytesIO

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

import main
from inference import preprocess
from model_registry import DEFAULT_MODEL_ID, load_catalog


class FakeModel:
    def __init__(self, probability=0.9):
        self.probability = probability

    def predict(self, batch, verbose=0):
        assert batch.shape == (1, 160, 160, 3)
        assert batch.dtype == np.float32
        return np.array([[self.probability]])


@pytest.fixture
def client(monkeypatch):
    catalog = load_catalog()
    catalog[0]["available"] = True
    monkeypatch.setattr(main, "load_catalog", lambda: catalog)
    main.app.state.models = {DEFAULT_MODEL_ID: (FakeModel(), "a" * 64)}
    with TestClient(main.app) as test_client:
        yield test_client


def image_bytes(format="PNG"):
    content = BytesIO()
    Image.new("L", (64, 64), color=128).save(content, format=format)
    return content.getvalue()


def test_health_and_metrics(client):
    assert client.get("/health/live").status_code == 200
    assert client.get("/health/ready").json()["status"] == "ready"
    assert "breathe_requests_total" in client.get("/metrics").text


def test_pneumonia_prediction(client):
    response = client.post("/predict", files={"file": ("xray.png", image_bytes(), "image/png")})
    assert response.status_code == 200
    assert response.json() == {
        "prediction": "Pneumonia",
        "confidence": 0.9,
        "pneumonia_probability": 0.9,
        "model_version": "aaaaaaaaaaaa",
        "model_id": "custom-cnn",
        "model_name": "Custom CNN",
    }
    assert response.headers["X-Request-ID"]


def test_normal_prediction(client):
    main.app.state.models[DEFAULT_MODEL_ID] = (FakeModel(0.1), "a" * 64)
    response = client.post("/predict", files={"file": ("xray.jpg", image_bytes("JPEG"), "image/jpeg")})
    assert response.json()["prediction"] == "Normal"
    assert response.json()["confidence"] == 0.9


@pytest.mark.parametrize(
    ("payload", "content_type", "status"),
    [(b"", "image/png", 422), (b"not an image", "image/png", 422), (b"text", "text/plain", 415)],
)
def test_rejects_invalid_uploads(client, payload, content_type, status):
    assert client.post("/predict", files={"file": ("bad", payload, content_type)}).status_code == status


def test_rejects_oversized_upload(client, monkeypatch):
    monkeypatch.setattr(main, "MAX_UPLOAD_BYTES", 8)
    assert client.post("/predict", files={"file": ("large.png", b"x" * 9, "image/png")}).status_code == 413


def test_catalog_and_model_selection(client, monkeypatch):
    models = client.get("/models").json()
    assert len(models) == 5
    assert "resolved_path" not in models[0]["artifact"]
    assert client.post("/predict?model=unknown", files={"file": ("x.png", image_bytes(), "image/png")}).status_code == 404
    catalog = load_catalog()
    next(model for model in catalog if model["id"] == "separable-cnn")["available"] = False
    monkeypatch.setattr(main, "load_catalog", lambda: catalog)
    assert client.post("/predict?model=separable-cnn", files={"file": ("x.png", image_bytes(), "image/png")}).status_code == 503


def test_model_specific_preprocessing():
    gray = preprocess(image_bytes(), {"size": 150, "channels": 1, "normalization": "scale_0_1"})
    standardized = preprocess(image_bytes(), {"size": 180, "channels": 3, "normalization": "samplewise_standardize"})
    assert gray.shape == (1, 150, 150, 1)
    assert standardized.shape == (1, 180, 180, 3)
    assert np.isfinite(standardized).all()
