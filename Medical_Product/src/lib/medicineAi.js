import * as tf from "@tensorflow/tfjs";
import products from "../components/ProductList/ProductList";

const MODEL_URL = "/ai/model.json";
const METADATA_URL = "/ai/metadata.json";
const DEFAULT_MIN_CONFIDENCE = 0.35;

let modelPromise;
let metadataPromise;

const LABEL_PRODUCT_ALIASES = [
  {
    labels: ["taung gyi", "mahar phyay say"],
    productName: "Taunggyi Mahar Phyay Say (Pink)",
  },
  {
    labels: ["taung kyar pan ar toe say"],
    productName: "Taung Kyar Pan Ar Toe Say",
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}

function scoreProductMatch(label, product) {
  const labelTokens = tokenize(label);
  const nameTokens = tokenize(product.name);

  if (!labelTokens.length || !nameTokens.length) {
    return 0;
  }

  const labelSet = new Set(labelTokens);
  const nameSet = new Set(nameTokens);
  let score = 0;

  for (const token of labelSet) {
    if (nameSet.has(token)) {
      score += 3;
    }
  }

  const normalizedLabel = normalizeText(label);
  const normalizedName = normalizeText(product.name);

  if (normalizedName.includes(normalizedLabel) || normalizedLabel.includes(normalizedName)) {
    score += 8;
  }

  const sharedPrefix = labelTokens.find((token) => normalizedName.startsWith(token));
  if (sharedPrefix) {
    score += 1;
  }

  return score;
}

function mapLabelToProduct(label) {
  const normalizedLabel = normalizeText(label);

  const aliasMatch = LABEL_PRODUCT_ALIASES.find((entry) =>
    entry.labels.some((alias) => normalizedLabel.includes(normalizeText(alias))),
  );

  if (aliasMatch) {
    const directProduct = products.find(
      (product) => normalizeText(product.name) === normalizeText(aliasMatch.productName),
    );
    if (directProduct) {
      return directProduct;
    }
  }

  const bestMatch = products
    .map((product) => ({
      product,
      score: scoreProductMatch(label, product),
    }))
    .sort((a, b) => b.score - a.score)[0];

  return bestMatch && bestMatch.score >= 4 ? bestMatch.product : null;
}

async function loadMetadata() {
  if (!metadataPromise) {
    metadataPromise = fetch(METADATA_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load AI metadata.");
      }
      return response.json();
    });
  }

  return metadataPromise;
}

async function loadModel() {
  if (!modelPromise) {
    modelPromise = tf.loadLayersModel(MODEL_URL);
  }

  return modelPromise;
}

function makeInputTensor(imageSource, imageSize) {
  return tf.tidy(() => {
    const pixels = tf.browser.fromPixels(imageSource).toFloat();
    const resized = tf.image.resizeBilinear(pixels, [imageSize, imageSize], true);
    const normalized = resized.div(127.5).sub(1);
    return normalized.expandDims(0);
  });
}

export async function loadMedicineDetector() {
  const [metadata, model] = await Promise.all([loadMetadata(), loadModel()]);
  return { metadata, model };
}

export async function detectMedicineImage(imageSource, { minConfidence = DEFAULT_MIN_CONFIDENCE } = {}) {
  const { metadata, model } = await loadMedicineDetector();
  const imageSize = Number(metadata?.imageSize) || 224;
  const labels = Array.isArray(metadata?.labels) ? metadata.labels : [];

  const inputTensor = makeInputTensor(imageSource, imageSize);
  const output = model.predict(inputTensor);
  const probabilities = await output.data();

  inputTensor.dispose();
  output.dispose();

  const predictions = Array.from(probabilities)
    .map((probability, index) => {
      const label = labels[index] || `Class ${index + 1}`;
      const confidence = Number(probability);
      return {
        label,
        confidence,
        percentage: Math.round(confidence * 1000) / 10,
        product: mapLabelToProduct(label),
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const bestPrediction = predictions[0] || null;

  return {
    metadata,
    predictions,
    bestPrediction:
      bestPrediction && bestPrediction.confidence >= minConfidence ? bestPrediction : bestPrediction,
  };
}
