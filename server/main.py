"""Production HTTP API for the Breathe-AI research model."""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from collections import Counter
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from inference import InvalidImage, predict_probability
from model_registry import DEFAULT_MODEL_ID, find_model, load_catalog, load_verified_model, public_catalog

APP_VERSION = os.getenv("APP_VERSION", "dev")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 10 * 1024 * 1024))
THRESHOLD = float(os.getenv("PREDICTION_THRESHOLD", "0.5"))
ALLOWED_TYPES = {"image/jpeg", "image/png"}

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(message)s")
logger = logging.getLogger("breathe-ai")
metrics = Counter()
metrics_lock = Lock()
model_lock = Lock()
registry_lock = Lock()


class Prediction(BaseModel):
    prediction: str
    confidence: float
    pneumonia_probability: float
    model_version: str
    model_id: str
    model_name: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    if getattr(app.state, "models", None) is None:
        app.state.models = {}
    yield


app = FastAPI(
    title="Breathe-AI inference API",
    description="Research-only pediatric chest X-ray classifier; not a medical device.",
    version=APP_VERSION,
    lifespan=lifespan,
)

origins = [value.strip() for value in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080").split(",") if value.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_controls(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))[:128]
    started = time.perf_counter()
    status = 500

    try:
        content_length = request.headers.get("content-length")
        if request.url.path.rstrip("/") == "/predict" and content_length:
            try:
                too_large = int(content_length) > MAX_UPLOAD_BYTES + 1024 * 1024
                response = JSONResponse({"detail": "Upload exceeds the configured limit"}, status_code=413) if too_large else await call_next(request)
            except ValueError:
                response = JSONResponse({"detail": "Invalid Content-Length header"}, status_code=400)
        else:
            response = await call_next(request)
        status = response.status_code
        return response
    finally:
        duration = time.perf_counter() - started
        with metrics_lock:
            metrics["requests"] += 1
            metrics["request_errors"] += status >= 500
            metrics["request_duration_seconds"] += duration
        logger.info(json.dumps({
            "event": "request",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path if request.url.path in {"/predict", "/predict/", "/health/live", "/health/ready", "/metrics"} else "other",
            "status": status,
            "duration_ms": round(duration * 1000, 2),
        }))
        if "response" in locals():
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Content-Type-Options"] = "nosniff"


@app.exception_handler(Exception)
async def unhandled_exception(_: Request, exc: Exception):
    logger.exception(json.dumps({"event": "unhandled_exception", "type": type(exc).__name__}))
    return JSONResponse({"detail": "Internal server error"}, status_code=500)


@app.get("/health/live", include_in_schema=False)
def live():
    return {"status": "ok", "version": APP_VERSION}


@app.get("/health/ready", include_in_schema=False)
def ready():
    available = [model for model in load_catalog() if model["available"]]
    return {"status": "ready", "models_available": len(available)}


@app.get("/models")
def models():
    return public_catalog(load_catalog())


@app.get("/metrics", response_class=PlainTextResponse, include_in_schema=False)
def prometheus_metrics():
    with metrics_lock:
        snapshot = metrics.copy()
    lines = [
        "# TYPE breathe_requests_total counter",
        f"breathe_requests_total {snapshot['requests']}",
        "# TYPE breathe_request_errors_total counter",
        f"breathe_request_errors_total {snapshot['request_errors']}",
        "# TYPE breathe_request_duration_seconds_sum counter",
        f"breathe_request_duration_seconds_sum {snapshot['request_duration_seconds']:.6f}",
        "# TYPE breathe_inferences_total counter",
        f"breathe_inferences_total {snapshot['inferences']}",
        "# TYPE breathe_inference_duration_seconds_sum counter",
        f"breathe_inference_duration_seconds_sum {snapshot['inference_duration_seconds']:.6f}",
    ]
    return "\n".join(lines) + "\n"


@app.post("/predict", response_model=Prediction)
async def predict_pneumonia(
    request: Request,
    file: UploadFile = File(...),
    model_id: str = Query(DEFAULT_MODEL_ID, alias="model"),
):
    try:
        entry = find_model(load_catalog(), model_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown model") from exc
    if not entry["available"]:
        raise HTTPException(status_code=503, detail="Selected model has not been trained locally")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG and PNG images are accepted")
    if file.size is not None and file.size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Upload exceeds the configured limit")

    data = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not data:
        raise HTTPException(status_code=422, detail="Image is empty")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Upload exceeds the configured limit")

    started = time.perf_counter()
    try:
        selected_model, digest = await run_in_threadpool(_get_or_load_model, request.app, entry)
        # ponytail: serialize per-process inference; scale containers when measured demand requires it.
        probability = await run_in_threadpool(_locked_predict, selected_model, data, entry["input"])
    except InvalidImage as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    duration = time.perf_counter() - started

    prediction = "Pneumonia" if probability >= THRESHOLD else "Normal"
    confidence = probability if prediction == "Pneumonia" else 1 - probability
    with metrics_lock:
        metrics["inferences"] += 1
        metrics["inference_duration_seconds"] += duration
    return Prediction(
        prediction=prediction,
        confidence=round(confidence, 6),
        pneumonia_probability=round(probability, 6),
        model_version=digest[:12],
        model_id=model_id,
        model_name=entry["name"],
    )


def _get_or_load_model(app: FastAPI, entry: dict):
    with registry_lock:
        cached = app.state.models.get(entry["id"])
        if cached:
            return cached
        loaded = load_verified_model(entry)
        app.state.models[entry["id"]] = loaded
        logger.info(json.dumps({"event": "model_loaded", "model_id": entry["id"], "model_sha256": loaded[1]}))
        return loaded


def _locked_predict(model, data: bytes, input_config: dict) -> float:
    with model_lock:
        return predict_probability(model, data, input_config)
