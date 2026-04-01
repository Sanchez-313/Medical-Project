import products from "../components/ProductList/ProductList";

const MODEL_URL = "/ai/model.json";
const METADATA_URL = "/ai/metadata.json";
const DEFAULT_MIN_CONFIDENCE = 0.7;
const TFJS_CDN_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
const TFJS_UNAVAILABLE_MESSAGE =
  "AI detection is unavailable right now because TensorFlow.js could not be loaded. Install the frontend dependency locally or allow CDN access, then try again.";

let modelPromise;
let metadataPromise;
let tfPromise;

const LABEL_PRODUCT_ALIASES = [
  {
    labels: ["generlog oral"],
    productId: 80,
  },
  {
    labels: ["gentalene c cream", "gentalene-c cream"],
    productId: 81,
  },
  {
    labels: ["win methylated spirit", "win methylated spirit )", "win ( methylated spirit )"],
    productId: 82,
  },
  {
    labels: ["enervon c", "enervon-c"],
    productId: 83,
  },
  {
    labels: ["taung gyi", "mahar phyay say"],
    productName: "Taunggyi Mahar Phyay Say (Pink)",
  },
  {
    labels: ["taung kyar pan ar toe say"],
    productName: "Taung Kyar Pan Ar Toe Say",
  },
  {
    labels: ["ab keto hair shampoo", "ab-keto hair shampoo", "ab keto"],
    productName: "Keto Shampoo 75ml",
  },
  {
    labels: ["rv ors oral rehydration salts blue", "rv ors", "oral rehydration salts"],
    productName: "Oral Rehydration Salts (ORS)",
  },
  {
    labels: ["doi kyaung thar", "dhoet kyaung thar", "ဒို့ ကျောင်းသား", "ဒို့ကျောင်းသား"],
    productName: "DhoetKyaungThar",
  },
  {
    labels: ["á€¥á€®á€¸á€á€»á€­á€”á€ºá€á€®", "u chain te"],
    productId: 79,
  },
  {
    labels: ["axiona"],
    productId: 84,
  },
  {
    labels: ["ribovit tablet"],
    productId: 85,
  },
  {
    labels: ["kotase"],
    productId: 86,
  },
  {
    labels: ["multivitaminus"],
    productId: 87,
  },
  {
    labels: ["sezo b cream", "sezo-b cream"],
    productId: 88,
  },
  {
    labels: ["fungiderm cream"],
    productId: 89,
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
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
    const directProduct = aliasMatch.productId
      ? products.find((product) => Number(product.id) === Number(aliasMatch.productId))
      : products.find(
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

function getBrowserTf() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.tf || null;
}

async function loadTensorflow() {
  const existingTf = getBrowserTf();
  if (existingTf) {
    return existingTf;
  }

  if (!tfPromise) {
    tfPromise = new Promise((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("TensorFlow.js requires a browser environment."));
        return;
      }

      const existingScript = document.querySelector('script[data-tfjs-cdn="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          const loadedTf = getBrowserTf();
          if (loadedTf) {
            resolve(loadedTf);
          } else {
            reject(new Error("TensorFlow.js loaded but was not initialized."));
          }
        }, { once: true });
        existingScript.addEventListener("error", () => {
          reject(new Error(TFJS_UNAVAILABLE_MESSAGE));
        }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = TFJS_CDN_URL;
      script.async = true;
      script.dataset.tfjsCdn = "true";
      script.onload = () => {
        const loadedTf = getBrowserTf();
        if (loadedTf) {
          resolve(loadedTf);
          return;
        }

        reject(new Error("TensorFlow.js loaded but was not initialized."));
      };
      script.onerror = () => {
        reject(new Error(TFJS_UNAVAILABLE_MESSAGE));
      };
      document.head.appendChild(script);
    });
  }

  return tfPromise;
}

async function loadModel() {
  if (!modelPromise) {
    modelPromise = loadTensorflow().then((tf) => tf.loadLayersModel(MODEL_URL));
  }

  return modelPromise;
}

async function makeInputTensor(imageSource, imageSize) {
  const tf = await loadTensorflow();
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

  const inputTensor = await makeInputTensor(imageSource, imageSize);
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
      bestPrediction && bestPrediction.confidence >= minConfidence ? bestPrediction : null,
  };
}
