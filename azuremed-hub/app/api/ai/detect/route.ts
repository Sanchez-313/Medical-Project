import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { mapLabelToProduct } from "@/lib/productLabelMatch";
import { classifyImage } from "@/lib/teachableMachine";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// webp isn't handled here: the local classifier only has pure-JS decoders
// for jpeg/png (see lib/imageDecode.ts) to avoid a native image lib.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "detections");

// Below this, we still show the AI's best guess (with topMatches for
// transparency) but don't attempt a catalog lookup — an unconfident guess
// shouldn't be dressed up as a real product/medicine detail.
const MIN_MATCH_CONFIDENCE = 0.7;
const HIGH_CONFIDENCE_THRESHOLD = 0.85;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

type ConfidenceStatus = "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "NO_MATCH";

function confidenceStatus(confidence: number): ConfidenceStatus {
  if (confidence <= 0) return "NO_MATCH";
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return "HIGH_CONFIDENCE";
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return "MEDIUM_CONFIDENCE";
  return "LOW_CONFIDENCE";
}

interface CatalogMedicine {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  selling_price_ks: number;
  stock_qty: number;
  expiry_date: string | null;
  description: string | null;
}

/**
 * Runs the uploaded image through the local Teachable Machine model
 * (ai/model.json + ai/weights.bin) and pairs the top prediction with the
 * real catalog row, if one matches. `howToUse` always comes back null: the
 * medicines table has no usage-instructions field, and inventing plausible
 * dosage/usage text for a real medicine would be fabricated medical
 * guidance, not a UI nicety — the frontend is expected to say so plainly
 * rather than paper over the gap.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  let file: File;
  try {
    const formData = await request.formData();
    const uploaded = formData.get("image");
    if (!(uploaded instanceof File)) {
      return NextResponse.json({ success: false, message: "image file is required" }, { status: 400 });
    }
    file = uploaded;
  } catch {
    return NextResponse.json({ success: false, message: "Could not read the uploaded image" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { success: false, message: "unsupported image type (use JPEG or PNG)" },
      { status: 415 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ success: false, message: "image exceeds 5MB limit" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Persist the upload before inference so every attempt has a durable
  // image_url for the log, even if classification fails.
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  const imageUrl = `/uploads/detections/${filename}`;

  const userId = Number(gate.session.user.id);

  let predictions;
  try {
    predictions = await classifyImage(bytes, file.type);
  } catch (error) {
    await logDetection({ userId, imageUrl, label: null, confidence: null, matchedMedicineId: null });
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Local model inference failed: ${error.message}`
            : "Local model inference failed",
      },
      { status: 500 }
    );
  }

  const best = predictions[0] ?? null;
  const predictedClass = best?.label ?? null;
  const confidence = best?.confidence ?? 0;
  const status = confidenceStatus(confidence);
  const topMatches = predictions.slice(0, 5).map((p) => ({ label: p.label, confidence: p.confidence }));

  let medicineDetail = null as null | {
    id: string | null;
    name: string;
    expireDate: string | null;
    stock: { quantity: number; unit: string };
    about: string | null;
    howToUse: string | null;
    matched: boolean;
    // Not part of the requested shape, but needed so the frontend can wire
    // an Add to Cart action without a second round-trip.
    category: string | null;
    imageUrl: string | null;
    priceKs: number | null;
  };
  let matchedMedicineId: number | null = null;

  if (predictedClass && confidence >= MIN_MATCH_CONFIDENCE) {
    const [catalog] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, category, image_url, selling_price_ks, stock_qty, expiry_date, description
       FROM medicines WHERE is_active = 1`
    );
    const matched = mapLabelToProduct(predictedClass, catalog as unknown as CatalogMedicine[]);

    if (matched) {
      matchedMedicineId = matched.id;
      medicineDetail = {
        id: String(matched.id),
        name: matched.name,
        expireDate: matched.expiry_date ? String(matched.expiry_date).slice(0, 10) : null,
        stock: { quantity: matched.stock_qty, unit: "units" },
        about: matched.description ?? null,
        howToUse: null,
        matched: true,
        category: matched.category,
        imageUrl: matched.image_url,
        priceKs: matched.selling_price_ks,
      };
    } else {
      // Recognized by the model but no catalog row matches it yet —
      // reported as a fallback, not silently dropped.
      medicineDetail = {
        id: null,
        name: predictedClass,
        expireDate: null,
        stock: { quantity: 0, unit: "units" },
        about: null,
        howToUse: null,
        matched: false,
        category: null,
        imageUrl: null,
        priceKs: null,
      };
    }
  }

  await logDetection({ userId, imageUrl, label: predictedClass, confidence, matchedMedicineId });

  return NextResponse.json({
    success: true,
    data: {
      detection: { predictedClass, confidence, status },
      medicineDetail,
      topMatches,
    },
  });
}

async function logDetection(entry: {
  userId: number;
  imageUrl: string;
  label: string | null;
  confidence: number | null;
  matchedMedicineId: number | null;
}) {
  await pool.query<ResultSetHeader>(
    `INSERT INTO ai_detection_logs (user_id, image_url, detected_label, confidence, matched_medicine_id)
     VALUES (:user_id, :image_url, :detected_label, :confidence, :matched_medicine_id)`,
    {
      user_id: entry.userId,
      image_url: entry.imageUrl,
      detected_label: entry.label,
      confidence: entry.confidence,
      matched_medicine_id: entry.matchedMedicineId,
    }
  );
}
