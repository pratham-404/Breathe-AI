# Breathe-AI

Breathe-AI is a research application for comparing locally trained neural networks and screening chest X-rays for `Normal` or `Pneumonia` patterns.

> **Research use only:** Breathe-AI is not a medical device and must not be used for diagnosis or treatment. Always consult a qualified clinician.

## What it provides

- Upload and preview JPEG or PNG chest X-rays up to 10 MB.
- Choose any locally available model for inference.
- Compare model architectures through visual flow diagrams.
- Compare training settings and test metrics in one table; hover a column name for its definition.
- Verify model artifacts with SHA-256 checksums before loading them.
- Monitor readiness, request totals, errors, and inference duration.

## Quick start

You need Docker and at least one trained `.keras` artifact in `server/artifacts/`.

```powershell
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080), choose a model, upload a chest X-ray, and select **Analyze image**.

Stop the application with `Ctrl+C`. Models without a local artifact remain visible for comparison but cannot be selected for inference.

## GitHub Pages demo

The included Pages workflow publishes the static comparison interface to:

**https://pratham-404.github.io/Breathe-AI/**

The Pages demo includes architecture flows and verified model metrics. Image prediction is disabled there because GitHub Pages cannot run the FastAPI backend or TensorFlow models; run the Docker application for inference.

After the first push, open **Repository Settings → Pages** and select **GitHub Actions** as the source. Future pushes to `main` deploy automatically, or you can run **Deploy GitHub Pages** manually from the Actions tab.

## Latest model results

All results below come from the same untouched 624-image test set at a `0.5` classification threshold. The catalog records each result as `verified_local_test_split`.

| Model | Parameters | Input | Accuracy | Precision | Recall | Specificity | F1 | AUC | Loss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Custom CNN | 423,361 | 160×160×3 | 70.7% | 68.1% | **99.7%** | 22.2% | 81.0% | 89.4% | 1.0591 |
| Efficient Separable CNN | 48,545 | 180×180×3 | 72.8% | 70.1% | 98.5% | 29.9% | 81.9% | 82.8% | 0.6986 |
| Deep Separable CNN | 587,361 | 180×180×3 | 79.2% | 75.3% | 99.2% | 45.7% | 85.6% | **94.0%** | **0.5714** |
| ResNet152V2 | 58,333,697 | 224×224×3 | 78.8% | 74.9% | 99.5% | 44.4% | 85.5% | 90.9% | 0.8412 |
| **DenseNet121** | 7,038,529 | 180×180×3 | **81.1%** | **76.9%** | **99.7%** | **50.0%** | **86.8%** | 91.4% | 0.7718 |

DenseNet121 has the strongest accuracy, precision, specificity, and F1 in this evaluation. Deep Separable CNN has the highest AUC and lowest loss. These results describe this dataset only and are not evidence of clinical performance.

## How it works

```text
training notebook
      │
      ├── evaluates the untouched test set
      ├── writes server/artifacts/<model>.keras
      └── updates server/model_catalog.json
                         │
browser ── upload ──> FastAPI ── verifies + loads selected model
   │                         │
   └── architecture flows    └── Normal / Pneumonia probability
       and comparison table
```

- `notebooks/` trains, evaluates, exports, and registers each model.
- `server/` provides model discovery, checksum verification, preprocessing, inference, health checks, and metrics.
- `client/` is a dependency-free HTML, CSS, and JavaScript interface served by Nginx.

## Train or retrain models

Use Python 3.12 or 3.13:

```powershell
python -m venv .venv
.venv\Scripts\pip install -r server\requirements.txt -r server\requirements-dev.txt
```

Place the dataset at:

```text
dataset/archive/chest_xray/
├── train/
│   ├── NORMAL/
│   └── PNEUMONIA/
├── val/
│   ├── NORMAL/
│   └── PNEUMONIA/
└── test/
    ├── NORMAL/
    └── PNEUMONIA/
```

Run one notebook from top to bottom, then restart the application:

1. `notebooks/01_custom_cnn.ipynb`
2. `notebooks/02_separable_cnn.ipynb`
3. `notebooks/03_deep_separable_cnn.ipynb`
4. `notebooks/04_resnet152v2.ipynb`
5. `notebooks/05_densenet121.ipynb`

Each notebook uses a shared stratified 80/20 train-validation split with seed `42`; the original test directory remains untouched until final evaluation. Training several notebooks simultaneously is not recommended because they compete for the same CPU, memory, and GPU resources.

Generated model files are intentionally ignored by Git. Share them through an artifact store rather than committing large binaries.

## API

With Docker, the browser-facing endpoints are:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/models` | List models, metadata, metrics, and availability |
| `POST` | `/api/predict?model=<model-id>` | Analyze one JPEG or PNG image |
| `GET` | `/healthz` | Check application readiness |

Example:

```powershell
curl.exe -X POST -F "file=@chest-xray.jpg" "http://localhost:8080/api/predict?model=deep-separable-cnn"
```

For backend development and interactive API documentation:

```powershell
cd server
..\.venv\Scripts\python -m uvicorn main:app --reload
```

Open [http://localhost:8000/docs](http://localhost:8000/docs). The backend also exposes `/health/live`, `/health/ready`, and Prometheus-style `/metrics` endpoints.
