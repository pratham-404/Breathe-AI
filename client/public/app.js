export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const COLUMN_DESCRIPTIONS = {
  Model: "The model architecture evaluated on the shared test set.",
  Parameters: "The number of trainable and non-trainable values in the network.",
  Input: "The width, height and color channels expected by the model.",
  Batch: "The number of images processed before each training update.",
  Optimizer: "The algorithm used to update model weights during training.",
  "Learning rate": "The size of each optimizer update during training.",
  Accuracy: "The share of all test images classified correctly.",
  Precision: "Of images predicted as pneumonia, the share that truly had pneumonia.",
  "Recall / sensitivity": "Of pneumonia images, the share correctly detected.",
  Specificity: "Of normal images, the share correctly identified as normal.",
  F1: "The harmonic mean of precision and recall; higher is better.",
  AUC: "How well the model separates the two classes across all thresholds; higher is better.",
  Loss: "The binary cross-entropy error on the test set; lower is better.",
  Status: "Whether the metrics were verified on the untouched local test split.",
};

export function validateFile(file) {
  if (!file) return "Choose an image first.";
  if (!["image/jpeg", "image/png"].includes(file.type)) return "Only JPEG and PNG images are accepted.";
  if (file.size > MAX_UPLOAD_BYTES) return "The image must be 10 MB or smaller.";
  return "";
}

export function percentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function predictionUrl(modelId) {
  return `/api/predict?model=${encodeURIComponent(modelId)}`;
}

export function modelCatalogUrl(hostname) {
  return hostname.endsWith(".github.io") ? "./models.json" : "/api/models";
}

export function catalogModels(payload) {
  const models = Array.isArray(payload) ? payload : payload?.models;
  if (!Array.isArray(models)) throw new Error("Invalid model catalog");
  return models;
}

export function displayValue(value, percentageValue = false) {
  if (value === null || value === undefined) return "Unavailable — not verified locally";
  if (percentageValue) return percentage(value);
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

const form = globalThis.document?.querySelector("#prediction-form");
if (form) {
  const input = document.querySelector("#xray");
  const dropzone = document.querySelector("#dropzone");
  const submit = document.querySelector("#submit");
  const status = document.querySelector("#status");
  const result = document.querySelector("#result");
  const preview = document.querySelector("#preview");
  const modelSelect = document.querySelector("#model-select");
  const modelList = document.querySelector("#model-list");
  const comparisonTable = document.querySelector("#comparison-table");
  const metricTooltip = document.querySelector("#metric-tooltip");
  const staticDemo = location.hostname.endsWith(".github.io");
  let selectedFile;
  let previewUrl;

  function selectFile(file) {
    selectedFile = file;
    document.querySelector("#file-name").textContent = file?.name ?? "No file selected";
    result.hidden = true;
    status.textContent = validateFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file && !validateFile(file)) {
      previewUrl = URL.createObjectURL(file);
      preview.src = previewUrl;
      preview.hidden = false;
      dropzone.classList.add("has-file");
    } else {
      preview.hidden = true;
      dropzone.classList.remove("has-file");
    }
  }

  input.addEventListener("change", () => selectFile(input.files[0]));

  for (const eventName of ["dragenter", "dragover"]) {
    document.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    document.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    });
  }
  document.addEventListener("drop", (event) => selectFile(event.dataTransfer.files[0]));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = selectedFile;
    const validationError = validateFile(file);
    if (validationError) {
      status.textContent = validationError;
      return;
    }

    submit.disabled = true;
    status.textContent = "Analyzing…";
    result.hidden = true;
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(predictionUrl(modelSelect.value), {
        method: "POST",
        headers: { "X-Request-ID": crypto.randomUUID() },
        body,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Prediction failed");

      document.querySelector("#classification").textContent = payload.prediction;
      document.querySelector("#probability").textContent = percentage(payload.pneumonia_probability);
      document.querySelector("#model-version").textContent = payload.model_version;
      document.querySelector("#result-model").textContent = payload.model_name;
      result.hidden = false;
      status.textContent = "Analysis complete.";
    } catch (error) {
      status.textContent = error.message || "Prediction service unavailable.";
    } finally {
      submit.disabled = false;
    }
  });

  const showView = () => {
    const showModel = location.hash === "#model";
    document.querySelector("#home-view").hidden = showModel;
    document.querySelector("#model-view").hidden = !showModel;
  };
  addEventListener("hashchange", showView);
  showView();

  const renderModels = (models) => {
    modelSelect.replaceChildren();
    modelList.replaceChildren();
    comparisonTable.replaceChildren();
    const columns = [
      ["Model", (model) => model.name],
      ["Parameters", (model) => displayValue(model.parameters)],
      ["Input", (model) => `${model.input.size}×${model.input.size}×${model.input.channels}`],
      ["Batch", (model) => model.training.batch_size],
      ["Optimizer", (model) => model.training.optimizer],
      ["Learning rate", (model) => model.training.learning_rate],
      ["Accuracy", (model) => displayValue(model.metrics.accuracy, true)],
      ["Precision", (model) => displayValue(model.metrics.precision, true)],
      ["Recall / sensitivity", (model) => displayValue(model.metrics.recall, true)],
      ["Specificity", (model) => displayValue(model.metrics.specificity, true)],
      ["F1", (model) => displayValue(model.metrics.f1, true)],
      ["AUC", (model) => displayValue(model.metrics.auc, true)],
      ["Loss", (model) => displayValue(model.metrics.loss)],
      ["Status", (model) => model.metrics.status],
    ];
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const [label] of columns) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      cell.tabIndex = 0;
      cell.dataset.description = COLUMN_DESCRIPTIONS[label];
      headRow.append(cell);
    }
    head.append(headRow);
    const body = document.createElement("tbody");

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = `${model.name}${model.available ? "" : " — not trained"}`;
      option.disabled = !model.available;
      modelSelect.append(option);

      const row = document.createElement("tr");
      for (const [, value] of columns) {
        const cell = document.createElement("td");
        cell.textContent = value(model);
        row.append(cell);
      }
      body.append(row);

      const card = document.createElement("article");
      card.className = "architecture-card";
      const heading = document.createElement("h2");
      heading.textContent = model.name;
      const meta = document.createElement("p");
      meta.className = "architecture-meta";
      meta.textContent = `${model.parameters.toLocaleString()} parameters · ${model.input.size}×${model.input.size} input`;
      const flow = document.createElement("div");
      flow.className = "architecture-flow";
      flow.setAttribute("aria-label", `${model.name} architecture: ${model.architecture}`);
      for (const [index, step] of model.architecture.split(";").entries()) {
        if (index) {
          const arrow = document.createElement("span");
          arrow.className = "flow-arrow";
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "→";
          flow.append(arrow);
        }
        const node = document.createElement("span");
        node.className = "flow-node";
        node.textContent = step.trim();
        flow.append(node);
      }
      card.append(heading, meta, flow);
      modelList.append(card);
    }
    comparisonTable.append(head, body);
    const available = models.some((model) => model.available);
    submit.disabled = !available;
    modelSelect.disabled = !available;
    if (available) modelSelect.value = models.find((model) => model.available).id;
    else document.querySelector("#model-status").textContent = staticDemo
      ? "Live prediction requires the local FastAPI service. Model comparison remains available."
      : "Run a notebook to train and register a model.";
  };

  const showMetricTooltip = (cell) => {
    if (!cell?.dataset.description) return;
    metricTooltip.textContent = cell.dataset.description;
    metricTooltip.hidden = false;
    const rect = cell.getBoundingClientRect();
    metricTooltip.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - metricTooltip.offsetWidth - 12))}px`;
    metricTooltip.style.top = `${Math.min(rect.bottom + 8, innerHeight - metricTooltip.offsetHeight - 12)}px`;
  };
  comparisonTable.addEventListener("pointerover", (event) => showMetricTooltip(event.target.closest("[data-description]")));
  comparisonTable.addEventListener("pointerout", () => { metricTooltip.hidden = true; });
  comparisonTable.addEventListener("focusin", (event) => showMetricTooltip(event.target));
  comparisonTable.addEventListener("focusout", () => { metricTooltip.hidden = true; });

  fetch(modelCatalogUrl(location.hostname))
    .then((response) => {
      if (!response.ok) throw new Error("Model catalog unavailable");
      return response.json();
    })
    .then(catalogModels)
    .then((models) => renderModels(staticDemo ? models.map((model) => ({ ...model, available: false })) : models))
    .catch((error) => {
      document.querySelector("#model-status").textContent = error.message;
      modelSelect.disabled = true;
      submit.disabled = true;
    });
}
