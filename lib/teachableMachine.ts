// eslint-disable-next-line @typescript-eslint/no-var-requires
const tf: any = require("@tensorflow/tfjs");
import { readFile } from "fs/promises";
import path from "path";
import { decodeImage } from "./imageDecode";

const MODEL_DIR = path.join(process.cwd(), "ai");

interface Metadata {
  labels: string[];
  imageSize: number;
}

export interface Prediction {
  label: string;
  confidence: number;
}

// tfjs registers each layer's weights by name in a process-wide registry
// (tf.engine()), which outlives this module. In Next.js dev mode, API routes
// get recompiled and this module re-evaluated per request, so a plain
// module-level `let modelPromise` resets to null and loadLayersModel() runs
// a second time — colliding with the first load's variable names ("Conv1/
// kernel was already registered"). Caching on globalThis survives that
// re-evaluation, the same trick used for Prisma-style singletons in Next.js.
const globalForTm = globalThis as unknown as {
  __tmModelPromise?: Promise<any>;
  __tmMetadataPromise?: Promise<Metadata>;
  __tmBackendReady?: Promise<void>;
};

async function ensureBackend(): Promise<void> {
  if (!globalForTm.__tmBackendReady) {
    globalForTm.__tmBackendReady = tf.setBackend("cpu").then(() => tf.ready()) as Promise<void>;
  }
  await globalForTm.__tmBackendReady;
}

/**
 * Reads the Teachable Machine export (model.json + weights.bin) straight off
 * disk from ai/. Not tf.io.fileSystem (that's a tfjs-node-only handler, and
 * this app deliberately avoids the native tfjs-node binding), so the
 * model.json/weights.bin parsing is done by hand here.
 */
function localFileIOHandler() {
  return {
    load: async () => {
      const modelJsonRaw = await readFile(path.join(MODEL_DIR, "model.json"), "utf-8");
      const modelJson = JSON.parse(modelJsonRaw);
      const manifest = modelJson.weightsManifest as Array<{
        paths: string[];
        weights: Array<Record<string, unknown>>;
      }>;

      const weightSpecs: Array<Record<string, unknown>> = [];
      const buffers: Buffer[] = [];
      for (const group of manifest) {
        weightSpecs.push(...group.weights);
        for (const relativePath of group.paths) {
          buffers.push(await readFile(path.join(MODEL_DIR, relativePath)));
        }
      }
      const weightBuffer = Buffer.concat(buffers);
      const weightData = weightBuffer.buffer.slice(
        weightBuffer.byteOffset,
        weightBuffer.byteOffset + weightBuffer.byteLength
      );

      return {
        modelTopology: modelJson.modelTopology,
        weightSpecs,
        weightData,
        format: modelJson.format,
        generatedBy: modelJson.generatedBy,
        convertedBy: modelJson.convertedBy,
      };
    },
  };
}

async function loadModel(): Promise<any> {
  if (!globalForTm.__tmModelPromise) {
    globalForTm.__tmModelPromise = ensureBackend()
      .then(() => tf.loadLayersModel(localFileIOHandler()))
      .catch((error) => {
        // Don't leave a permanently-rejected promise cached — a transient
        // failure (e.g. disk read) shouldn't wedge every future request.
        globalForTm.__tmModelPromise = undefined;
        throw error;
      });
  }
  return globalForTm.__tmModelPromise;
}

async function loadMetadata(): Promise<Metadata> {
  if (!globalForTm.__tmMetadataPromise) {
    globalForTm.__tmMetadataPromise = readFile(path.join(MODEL_DIR, "metadata.json"), "utf-8").then((raw) =>
      JSON.parse(raw)
    );
  }
  return globalForTm.__tmMetadataPromise;
}

/**
 * Runs local MobileNet-based Teachable Machine inference on an uploaded
 * image, returning every class with its probability, sorted highest first.
 * The model's final layer is already softmax, so these sum to ~1.
 */
export async function classifyImage(buffer: Buffer, mimeType: string): Promise<Prediction[]> {
  const [model, metadata] = await Promise.all([loadModel(), loadMetadata()]);
  const imageSize = metadata.imageSize || 224;
  const decoded = decodeImage(buffer, mimeType);

  const probabilities = tf.tidy(() => {
    const rgba = tf.tensor3d(decoded.data, [decoded.height, decoded.width, 4], "int32");
    const rgb = rgba.slice([0, 0, 0], [decoded.height, decoded.width, 3]).toFloat();
    const resized = tf.image.resizeBilinear(rgb, [imageSize, imageSize]);
    const normalized = resized.div(127.5).sub(1);
    const batched = normalized.expandDims(0);
    const output = model.predict(batched);
    return Array.from(output.dataSync()) as number[];
  });

  return probabilities
    .map((confidence: number, index: number) => ({ label: metadata.labels[index] ?? `Class ${index + 1}`, confidence }))
    .sort((a: Prediction, b: Prediction) => b.confidence - a.confidence);
}
