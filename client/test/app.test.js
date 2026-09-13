import assert from "node:assert/strict";
import test from "node:test";

import { COLUMN_DESCRIPTIONS, MAX_UPLOAD_BYTES, catalogModels, displayValue, modelCatalogUrl, percentage, predictionUrl, validateFile } from "../public/app.js";

test("accepts supported images within the limit", () => {
  assert.equal(validateFile({ type: "image/jpeg", size: MAX_UPLOAD_BYTES }), "");
});

test("rejects missing, unsupported, and oversized uploads", () => {
  assert.match(validateFile(), /Choose/);
  assert.match(validateFile({ type: "image/svg+xml", size: 1 }), /JPEG/);
  assert.match(validateFile({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 }), /10 MB/);
});

test("formats probabilities consistently", () => {
  assert.equal(percentage(0.870192), "87.0%");
  assert.equal(displayValue(null), "Unavailable — not verified locally");
  assert.equal(predictionUrl("model with spaces"), "/api/predict?model=model%20with%20spaces");
});

test("documents every comparison column", () => {
  assert.equal(Object.keys(COLUMN_DESCRIPTIONS).length, 14);
  assert.match(COLUMN_DESCRIPTIONS.Specificity, /normal images/);
});

test("supports API and GitHub Pages model catalogs", () => {
  assert.equal(modelCatalogUrl("localhost"), "/api/models");
  assert.equal(modelCatalogUrl("pratham-404.github.io"), "./models.json");
  assert.deepEqual(catalogModels({ models: [{ id: "custom-cnn" }] }), [{ id: "custom-cnn" }]);
  assert.throws(() => catalogModels({}), /Invalid model catalog/);
});
